import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import { hovedkategorier } from "../../../data/kategorier";
import Kommentarer from "../../../components/Kommentarer";
import AnmeldKnap from "../../../components/AnmeldKnap";
import OpslagHandlinger from "../../../components/OpslagHandlinger";
import Reaktioner from "../../../components/Reaktioner";
import LavetDen from "../../../components/LavetDen";
import LavetDenListe from "../../../components/LavetDenListe";
import { BILLED_BUCKET } from "../../../utils/billede";

const niveauNavne: Record<string, string> = {
  startprojekt: "Startprojekt",
  "lidt-ovede": "For lidt øvede",
  erfaren: "Mere erfaren",
};

type Opslag = {
  id: string;
  forfatter_id: string;
  titel: string;
  tekst: string;
  kategorier: string[];
  niveau: string | null;
  god_med_boern: boolean;
  er_spoergsmaal: boolean;
  oprettet: string;
  profiler: { navn: string } | null;
};

const uuidMoenster =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dansk(dato: string) {
  return new Date(dato).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
}

function findKategori(vaerdi: string) {
  const [hovedSlug, underSlug] = vaerdi.split("/");
  const hoved = hovedkategorier.find((h) => h.slug === hovedSlug);
  const under = hoved?.underkategorier.find((u) => u.slug === underSlug);
  if (!hoved || !under) return null;
  return {
    link: `/kategori/${hoved.slug}/${under.slug}`,
    navn: `${hoved.navn} → ${under.navn}`,
  };
}

export default function OpslagSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Suspense fallback={<p className="text-center">Henter opslag...</p>}>
          <OpslagIndhold params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function OpslagIndhold({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!uuidMoenster.test(id)) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opslag")
    .select(
      "id, forfatter_id, titel, tekst, kategorier, niveau, god_med_boern, er_spoergsmaal, oprettet, profiler(navn)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return (
      <p className="rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        Vi kunne ikke hente opslaget lige nu. Prøv igen om lidt.
      </p>
    );
  }

  if (!data) {
    notFound();
  }

  const o = data as unknown as Opslag;

  const { data: billedData } = await supabase
    .from("opslag_billeder")
    .select("id, sti")
    .eq("opslag_id", o.id)
    .order("raekkefoelge", { ascending: true })
    .order("oprettet", { ascending: true });

  const billeder = ((billedData ?? []) as unknown as { id: string; sti: string }[]).map(
    (b) => ({
      id: b.id,
      url: supabase.storage.from(BILLED_BUCKET).getPublicUrl(b.sti).data
        .publicUrl,
    })
  );

  const kategorier = o.kategorier
    .map(findKategori)
    .filter((k): k is { link: string; navn: string } => k !== null);
  const foerste = kategorier[0];
  const tilbageLink = foerste ? foerste.link : "/";

  return (
    <article>
      <Link href={tilbageLink} className="font-medium underline underline-offset-4">
        ← Tilbage
      </Link>

      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
        {o.er_spoergsmaal && (
          <span aria-label="Spørgsmål" title="Spørgsmål">
            ❓{" "}
          </span>
        )}
        {o.titel}
      </h1>

      <p className="mt-3 text-green-900">
        Af {o.profiler?.navn ?? "Slettet bruger"} · {dansk(o.oprettet)}
      </p>

      {(o.niveau || o.god_med_boern) && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {o.niveau && (
            <span className="rounded-full bg-green-100 px-3 py-1">
              {niveauNavne[o.niveau] ?? o.niveau}
            </span>
          )}
          {o.god_med_boern && (
            <span className="rounded-full bg-green-100 px-3 py-1">
              God med børn
            </span>
          )}
        </div>
      )}

      {billeder.length > 0 && (
        <div
          className={`mt-6 grid gap-3 ${
            billeder.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          }`}
        >
          {billeder.map((b, i) => (
            <a
              key={b.id}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.url}
                alt={`Billede ${i + 1} af ${billeder.length} til opslaget ${o.titel}`}
                loading="lazy"
                className={
                  billeder.length === 1
                    ? "mx-auto max-h-[32rem] w-auto max-w-full rounded-xl ring-1 ring-green-200"
                    : "aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-green-200"
                }
              />
            </a>
          ))}
        </div>
      )}

      {o.tekst && (
        <div className="mt-6 rounded-2xl bg-white p-6 text-lg leading-relaxed whitespace-pre-wrap ring-1 ring-green-200">
          {o.tekst}
        </div>
      )}

      <Reaktioner opslagId={o.id} />

      <LavetDen opslagId={o.id} />

      <Suspense fallback={null}>
        <LavetDenListe opslagId={o.id} />
      </Suspense>

      {kategorier.length > 0 && (
        <div className="mt-6">
          <p className="font-medium">Findes under:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {kategorier.map((k) => (
              <Link
                key={k.link}
                href={k.link}
                className="rounded-full bg-green-100 px-3 py-1 text-sm hover:bg-green-200"
              >
                {k.navn}
              </Link>
            ))}
          </div>
        </div>
      )}

      <OpslagHandlinger
        opslagId={o.id}
        forfatterId={o.forfatter_id}
        tilbageLink={tilbageLink}
      />

      <div className="mt-6">
        <AnmeldKnap opslagId={o.id} />
      </div>

      <section className="mt-10">
        <Suspense fallback={<p>Henter kommentarer...</p>}>
          <Kommentarer opslagId={o.id} />
        </Suspense>
      </section>
    </article>
  );
}