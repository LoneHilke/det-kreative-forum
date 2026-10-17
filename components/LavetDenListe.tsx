import { createClient } from "../utils/supabase/server";
import { BILLED_BUCKET } from "../utils/billede";

type Bidrag = {
  id: string;
  tekst: string;
  sti: string | null;
  oprettet: string;
  profiler: { navn: string } | null;
};

function dansk(dato: string) {
  return new Date(dato).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Copenhagen",
  });
}

export default async function LavetDenListe({ opslagId }: { opslagId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("har_lavet_den")
    .select("id, tekst, sti, oprettet, profiler(navn)")
    .eq("opslag_id", opslagId)
    .order("oprettet", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return null;
  }

  // Kun bidrag med billede eller tekst vises
  const bidrag = ((data ?? []) as unknown as Bidrag[]).filter(
    (b) => b.tekst || b.sti
  );
  if (bidrag.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-lg font-bold">Andres versioner</h3>
      <ul className="mt-3 space-y-4">
        {bidrag.map((b) => {
          const navn = b.profiler?.navn ?? "Slettet bruger";
          const url = b.sti
            ? supabase.storage.from(BILLED_BUCKET).getPublicUrl(b.sti).data
                .publicUrl
            : null;
          return (
            <li
              key={b.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-green-200"
            >
              <p className="text-sm text-green-900">
                <span className="font-semibold">{navn}</span> ·{" "}
                {dansk(b.oprettet)}
              </p>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Billede af ${navn}s version`}
                    loading="lazy"
                    className="mx-auto max-h-96 w-auto max-w-full rounded-xl ring-1 ring-green-200"
                  />
                </a>
              )}
              {b.tekst && (
                <p className="mt-2 leading-relaxed whitespace-pre-wrap">
                  {b.tekst}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}