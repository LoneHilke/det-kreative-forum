import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../utils/supabase/server";
import FjernGemt from "../../components/FjernGemt";

type Gemt = {
  oprettet: string;
  opslag: {
    id: string;
    titel: string;
    tekst: string;
    er_spoergsmaal: boolean;
    oprettet: string;
    profiler: { navn: string } | null;
  } | null;
};

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

export default function GemteIdeer() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <section className="text-center">
          <span className="text-5xl" aria-hidden="true">
            ❤️
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Gemte idéer</h1>
          <p className="mt-3 text-lg leading-relaxed">
            Her samler du de idéer, du har lyst til at prøve.
          </p>
        </section>

        <Suspense fallback={<p className="mt-10 text-center">Henter...</p>}>
          <GemteIndhold />
        </Suspense>
      </div>
    </main>
  );
}

async function GemteIndhold() {
  const supabase = await createClient();

  let brugerId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    brugerId = data?.claims?.sub ?? null;
  } catch (err) {
    console.error(err);
  }

  if (!brugerId) {
    return (
      <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          Du skal være logget ind for at se dine gemte idéer.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Log ind
          </Link>
          <Link
            href="/registrer"
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Opret bruger
          </Link>
        </div>
      </section>
    );
  }

  const { data, error } = await supabase
    .from("reaktioner")
    .select(
      "oprettet, opslag(id, titel, tekst, er_spoergsmaal, oprettet, profiler(navn))"
    )
    .eq("bruger_id", brugerId)
    .eq("reaktion", "vil-proeve")
    .order("oprettet", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return (
      <p className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        Vi kunne ikke hente dine gemte idéer lige nu. Prøv igen om lidt.
      </p>
    );
  }

  const gemte = ((data ?? []) as unknown as Gemt[]).filter(
    (g): g is Gemt & { opslag: NonNullable<Gemt["opslag"]> } => g.opslag !== null
  );

  if (gemte.length === 0) {
    return (
      <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          Du har ikke gemt nogen idéer endnu. Tryk på ❤️ Den vil jeg prøve under
          et opslag, så dukker det op her.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-4">
      {gemte.map(({ opslag: o }) => (
        <div
          key={o.id}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-green-200"
        >
          <Link href={`/opslag/${o.id}`} className="block hover:opacity-80">
            <h2 className="text-xl font-semibold">
              {o.er_spoergsmaal && (
                <span aria-label="Spørgsmål" title="Spørgsmål">
                  ❓{" "}
                </span>
              )}
              {o.titel}
            </h2>
            {o.tekst && (
              <p className="mt-2 leading-relaxed">{kortTekst(o.tekst)}</p>
            )}
            <p className="mt-3 text-sm text-green-900">
              Af {o.profiler?.navn ?? "Slettet bruger"} · {dansk(o.oprettet)}
            </p>
          </Link>
          <div className="mt-3">
            <FjernGemt opslagId={o.id} />
          </div>
        </div>
      ))}
    </section>
  );
}