import { createClient } from "../utils/supabase/server";
import KommentarFormular from "./KommentarFormular";
import SletKommentar from "./SletKommentar";

type Kommentar = {
  id: string;
  tekst: string;
  oprettet: string;
  forfatter_id: string | null;
  profiler: { navn: string } | null;
};

function tidspunkt(dato: string) {
  return new Date(dato).toLocaleString("da-DK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Copenhagen",
  });
}

// Fremhæver ord, der starter med @. Der sendes ingen besked.
function visTekst(tekst: string) {
  return tekst.split(/(@[\p{L}\p{N}_-]+)/u).map((del, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="rounded bg-green-100 px-1">
        {del}
      </strong>
    ) : (
      <span key={i}>{del}</span>
    )
  );
}

export default async function Kommentarer({ opslagId }: { opslagId: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("kommentarer")
    .select("id, tekst, oprettet, forfatter_id, profiler(navn)")
    .eq("opslag_id", opslagId)
    .order("oprettet", { ascending: true })
    .limit(200);

  if (error) {
    console.error(error);
    return (
      <p className="rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        Vi kunne ikke hente kommentarerne lige nu. Prøv igen om lidt.
      </p>
    );
  }

  const kommentarer = (data ?? []) as unknown as Kommentar[];

  // Hvem er logget ind, og er vedkommende administrator?
  let minId: string | null = null;
  let erAdmin = false;
  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    minId = claimsData?.claims?.sub ?? null;
    if (minId) {
      const { data: admin } = await supabase.rpc("er_admin");
      erAdmin = admin === true;
    }
  } catch (err) {
    console.error(err);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        Kommentarer {kommentarer.length > 0 && `(${kommentarer.length})`}
      </h2>

      {kommentarer.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
          Der er ingen kommentarer endnu. Har du et spørgsmål til projektet, så
          skriv det herunder.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {kommentarer.map((k) => (
            <li
              key={k.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-green-200"
            >
              <p className="text-sm text-green-900">
                <span className="font-semibold">
                  {k.profiler?.navn ?? "Slettet bruger"}
                </span>{" "}
                · {tidspunkt(k.oprettet)}
              </p>
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">
                {visTekst(k.tekst)}
              </p>
              {minId && (k.forfatter_id === minId || erAdmin) && (
                <p className="mt-2">
                  <SletKommentar id={k.id} />
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <KommentarFormular opslagId={opslagId} />
    </div>
  );
}