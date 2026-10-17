import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../utils/supabase/server";
import { hovedkategorier } from "../../data/kategorier";

const niveauNavne: Record<string, string> = {
  startprojekt: "Startprojekt",
  "lidt-ovede": "For lidt øvede",
  erfaren: "Mere erfaren",
};

type Traef = {
  id: string;
  titel: string;
  uddrag: string;
  niveau: string | null;
  god_med_boern: boolean;
  er_spoergsmaal: boolean;
  oprettet: string;
  forfatter_navn: string | null;
  antal_ord: number;
};

function findOrd(soeg: string): string[] {
  const ord = soeg.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(ord.filter((o) => o.length >= 2))].slice(0, 8);
}

// Fjerner kun accent over e (é), så "gaveidéer" og "gaveideer" er det samme.
function normaliser(tekst: string) {
  return tekst
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\u0301/g, "")
    .normalize("NFC");
}

function kategorierForOrd(ord: string): string[] {
  const o = normaliser(ord);
  if (o.length < 3) return [];

  const fundet: string[] = [];
  for (const hoved of hovedkategorier) {
    const hovedNavn = normaliser(hoved.navn);
    if (hovedNavn.startsWith(o)) {
      for (const under of hoved.underkategorier) {
        fundet.push(`${hoved.slug}/${under.slug}`);
      }
    }
    for (const under of hoved.underkategorier) {
      if (normaliser(under.navn).startsWith(o)) {
        fundet.push(`${hoved.slug}/${under.slug}`);
      }
    }
  }
  return [...new Set(fundet)];
}

function kortTekst(tekst: string) {
  const ren = tekst.replace(/\s+/g, " ").trim();
  return ren.length > 140 ? `${ren.slice(0, 140).trimEnd()}…` : ren;
}

function dansk(dato: string) {
  return new Date(dato).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
}

function Formular({ vaerdi }: { vaerdi: string }) {
  return (
    <form action="/soeg" method="get" role="search" className="mt-6 flex gap-2">
      <label htmlFor="q" className="sr-only">
        Søg
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={vaerdi}
        maxLength={200}
        placeholder="fx strikket nisse eller kogler garnrester"
        className="min-w-0 flex-1 rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
      />
      <button
        type="submit"
        className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
      >
        Søg
      </button>
    </form>
  );
}

export default function SoegSide({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <section className="text-center">
          <span className="text-5xl" aria-hidden="true">
            🔎
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Søg</h1>
          <p className="mt-3 text-lg leading-relaxed">
            Skriv det, du vil lave, eller de materialer, du har.
          </p>
        </section>

        <Suspense fallback={<Formular vaerdi="" />}>
          <Resultater searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Resultater({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const raa = Array.isArray(q) ? q[0] : q;
  const soeg = (raa ?? "").slice(0, 200);
  const ord = findOrd(soeg);

  if (ord.length === 0) {
    return (
      <>
        <Formular vaerdi={soeg} />
        <p className="mt-8 rounded-2xl bg-white p-6 text-center leading-relaxed ring-1 ring-green-200">
          {soeg.trim()
            ? "Skriv mindst ét ord med to bogstaver eller mere."
            : "Du kan skrive flere ord, fx kogler garnrester. Så får du først de opslag, der passer på flest af ordene."}
        </p>
      </>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("soeg_opslag", {
    p_soeg: ord.map((o) => ({ ord: o, kat: kategorierForOrd(o) })),
  });

  if (error) {
    console.error(error);
    return (
      <>
        <Formular vaerdi={soeg} />
        <p className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
          Søgningen virker ikke lige nu. Prøv igen om lidt.
        </p>
      </>
    );
  }

  const traef = (data ?? []) as unknown as Traef[];

  if (traef.length === 0) {
    return (
      <>
        <Formular vaerdi={soeg} />
        <p className="mt-8 rounded-2xl bg-white p-6 text-center leading-relaxed ring-1 ring-green-200">
          Der er ikke noget, der passer på &quot;{soeg.trim()}&quot;. Prøv med
          færre eller andre ord.
        </p>
      </>
    );
  }

  return (
    <>
      <Formular vaerdi={soeg} />
      <p className="mt-6 text-green-900">
        {traef.length === 50
          ? "Her er de 50 bedste resultater."
          : traef.length === 1
            ? "Der er 1 resultat."
            : `Der er ${traef.length} resultater.`}
      </p>
      <ul className="mt-4 space-y-4">
        {traef.map((t) => (
          <li key={t.id}>
            <Link
              href={`/opslag/${t.id}`}
              className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-green-200 transition hover:bg-green-100"
            >
              <h2 className="text-xl font-semibold">
                {t.er_spoergsmaal && (
                  <span aria-label="Spørgsmål" title="Spørgsmål">
                    ❓{" "}
                  </span>
                )}
                {t.titel}
              </h2>
              {t.uddrag && (
                <p className="mt-2 leading-relaxed">{kortTekst(t.uddrag)}</p>
              )}
              <p className="mt-3 text-sm text-green-900">
                Af {t.forfatter_navn ?? "Slettet bruger"} · {dansk(t.oprettet)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {ord.length > 1 && (
                  <span className="rounded-full bg-green-200 px-3 py-1">
                    Passer på {t.antal_ord} af {ord.length} ord
                  </span>
                )}
                {t.niveau && (
                  <span className="rounded-full bg-green-100 px-3 py-1">
                    {niveauNavne[t.niveau] ?? t.niveau}
                  </span>
                )}
                {t.god_med_boern && (
                  <span className="rounded-full bg-green-100 px-3 py-1">
                    God med børn
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}