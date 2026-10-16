import Link from "next/link";
import { createClient } from "../utils/supabase/server";

const niveauNavne: Record<string, string> = {
  startprojekt: "Startprojekt",
  "lidt-ovede": "For lidt øvede",
  erfaren: "Mere erfaren",
};

type Opslag = {
  id: string;
  titel: string;
  tekst: string;
  niveau: string | null;
  god_med_boern: boolean;
  er_spoergsmaal: boolean;
  oprettet: string;
  profiler: { navn: string } | null;
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

export default async function OpslagListe({ kategori }: { kategori: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opslag")
    .select(
      "id, titel, tekst, niveau, god_med_boern, er_spoergsmaal, oprettet, profiler(navn)"
    )
    .contains("kategorier", [kategori])
    .order("oprettet", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return (
      <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          Vi kunne ikke hente opslagene lige nu. Prøv igen om lidt.
        </p>
      </section>
    );
  }

  const opslag = (data ?? []) as unknown as Opslag[];

  if (opslag.length === 0) {
    return (
      <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">Der er ingen opslag her endnu.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-4">
      {opslag.map((o) => (
        <Link
          key={o.id}
          href={`/opslag/${o.id}`}
          className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-green-200 transition hover:bg-green-100"
        >
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
        </Link>
      ))}
    </section>
  );
}