"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";
import { hovedkategorier } from "../data/kategorier";
import { BILLED_BUCKET, MAKS_BILLEDER, uploadBilleder } from "../utils/billede";
import BilledVaelger from "./BilledVaelger";

const niveauer = [
  { vaerdi: "", navn: "Ikke angivet" },
  { vaerdi: "startprojekt", navn: "Startprojekt" },
  { vaerdi: "lidt-ovede", navn: "For lidt øvede" },
  { vaerdi: "erfaren", navn: "Mere erfaren" },
];

type Status =
  | "henter"
  | "ud"
  | "findes-ikke"
  | "ingen-adgang"
  | "klar"
  | "fejl";

type Raekke = {
  id: string;
  titel: string;
  tekst: string;
  kategorier: string[];
  niveau: string | null;
  god_med_boern: boolean;
  er_spoergsmaal: boolean;
  forfatter_id: string;
};

type Billede = {
  id: string;
  sti: string;
  raekkefoelge: number;
  url: string;
};

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base";

export default function RetOpslag({ opslagId }: { opslagId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("henter");
  const [titel, setTitel] = useState("");
  const [tekst, setTekst] = useState("");
  const [valgte, setValgte] = useState<string[]>([]);
  const [niveau, setNiveau] = useState("");
  const [godMedBoern, setGodMedBoern] = useState(false);
  const [erSpoergsmaal, setErSpoergsmaal] = useState(false);
  const [eksisterende, setEksisterende] = useState<Billede[]>([]);
  const [fjernede, setFjernede] = useState<string[]>([]);
  const [nye, setNye] = useState<File[]>([]);
  const [erEjer, setErEjer] = useState(false);
  const [brugerId, setBrugerId] = useState<string | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [delvist, setDelvist] = useState<string | null>(null);
  const [gemmer, setGemmer] = useState(false);

  const tilbage = eksisterende.length - fjernede.length;
  const plads = Math.max(0, MAKS_BILLEDER - tilbage);

  useEffect(() => {
    let afbrudt = false;

    async function hent() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const bruger = sessionData.session?.user;
        if (afbrudt) return;
        if (!bruger) {
          setStatus("ud");
          return;
        }

        const { data, error } = await supabase
          .from("opslag")
          .select(
            "id, titel, tekst, kategorier, niveau, god_med_boern, er_spoergsmaal, forfatter_id"
          )
          .eq("id", opslagId)
          .maybeSingle();
        if (afbrudt) return;
        if (error) throw error;
        if (!data) {
          setStatus("findes-ikke");
          return;
        }

        const r = data as unknown as Raekke;
        const ejer = r.forfatter_id === bruger.id;
        let maaRette = ejer;
        if (!maaRette) {
          const { data: admin } = await supabase.rpc("er_admin");
          maaRette = admin === true;
        }
        if (afbrudt) return;
        if (!maaRette) {
          setStatus("ingen-adgang");
          return;
        }

        const { data: billedData, error: billedFejl } = await supabase
          .from("opslag_billeder")
          .select("id, sti, raekkefoelge")
          .eq("opslag_id", opslagId)
          .order("raekkefoelge", { ascending: true })
          .order("oprettet", { ascending: true });
        if (billedFejl) throw billedFejl;
        if (afbrudt) return;

        setEksisterende(
          ((billedData ?? []) as unknown as {
            id: string;
            sti: string;
            raekkefoelge: number | string;
          }[]).map((b) => ({
            id: b.id,
            sti: b.sti,
            raekkefoelge: Number(b.raekkefoelge),
            url: supabase.storage.from(BILLED_BUCKET).getPublicUrl(b.sti).data
              .publicUrl,
          }))
        );
        setErEjer(ejer);
        setBrugerId(bruger.id);
        setTitel(r.titel);
        setTekst(r.tekst);
        setValgte(r.kategorier);
        setNiveau(r.niveau ?? "");
        setGodMedBoern(r.god_med_boern);
        setErSpoergsmaal(r.er_spoergsmaal);
        setStatus("klar");
      } catch (err) {
        console.error(err);
        if (!afbrudt) setStatus("fejl");
      }
    }

    hent();
    return () => {
      afbrudt = true;
    };
  }, [opslagId]);

  function skiftKategori(vaerdi: string) {
    setValgte((forrige) =>
      forrige.includes(vaerdi)
        ? forrige.filter((v) => v !== vaerdi)
        : [...forrige, vaerdi]
    );
  }

  function skiftFjern(id: string) {
    setFejl(null);
    if (fjernede.includes(id)) {
      if (tilbage + 1 + nye.length > MAKS_BILLEDER) {
        setFejl(
          `Der er ikke plads til flere end ${MAKS_BILLEDER} billeder. Fjern et af de nye billeder først.`
        );
        return;
      }
      setFjernede((f) => f.filter((x) => x !== id));
    } else {
      setFjernede((f) => [...f, id]);
    }
  }

  async function gem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);

    if (valgte.length === 0) {
      setFejl("Vælg mindst én underkategori, så andre kan finde opslaget.");
      return;
    }
    if (valgte.length > 10) {
      setFejl("Du kan højst vælge 10 underkategorier.");
      return;
    }
    if (tilbage + nye.length > MAKS_BILLEDER) {
      setFejl(`Et opslag kan højst have ${MAKS_BILLEDER} billeder.`);
      return;
    }

    setGemmer(true);
    try {
      const supabase = createClient();

      // 1. Gem teksten og valgene
      const { data, error } = await supabase
        .from("opslag")
        .update({
          titel: titel.trim(),
          tekst: tekst.trim(),
          kategorier: valgte,
          niveau: niveau || null,
          god_med_boern: godMedBoern,
          er_spoergsmaal: erSpoergsmaal,
        })
        .eq("id", opslagId)
        .select("id");

      if (error) {
        console.error(error);
        setFejl("Det lykkedes ikke at gemme ændringerne. Prøv igen om lidt.");
        return;
      }
      if (!data || data.length === 0) {
        setFejl("Du har ikke lov til at rette dette opslag.");
        return;
      }

      // 2. Fjern billeder (filerne først, så de ikke bliver liggende)
      const skalFjernes = eksisterende.filter((b) => fjernede.includes(b.id));
      if (skalFjernes.length > 0) {
        const { error: filFejl } = await supabase.storage
          .from(BILLED_BUCKET)
          .remove(skalFjernes.map((b) => b.sti));
        if (filFejl) {
          console.error(filFejl);
          setFejl(
            "Teksten er gemt, men billederne kunne ikke fjernes. Tryk på Gem ændringer igen om lidt."
          );
          return;
        }
        const { error: raekkeFejl } = await supabase
          .from("opslag_billeder")
          .delete()
          .in(
            "id",
            skalFjernes.map((b) => b.id)
          );
        if (raekkeFejl) {
          console.error(raekkeFejl);
          setFejl(
            "Teksten er gemt, men billederne kunne ikke fjernes. Tryk på Gem ændringer igen om lidt."
          );
          return;
        }
      }

      // 3. Tilføj nye billeder (kun ejeren kan)
      if (nye.length > 0 && erEjer && brugerId) {
        const beholdt = eksisterende.filter((b) => !fjernede.includes(b.id));
        const start =
          beholdt.length > 0
            ? Math.max(...beholdt.map((b) => b.raekkefoelge)) + 1
            : 0;
        const resultat = await uploadBilleder(
          supabase,
          brugerId,
          opslagId,
          nye,
          start
        );
        if (resultat.fejl) {
          setDelvist(
            `Dine ændringer er gemt, men ${resultat.fejl} ${
              resultat.lykkedes > 0
                ? `${resultat.lykkedes} af billederne blev lagt op.`
                : ""
            }`
          );
          return;
        }
      }

      router.push(`/opslag/${opslagId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setGemmer(false);
    }
  }

  if (status === "henter") {
    return <p className="mt-8 text-center">Et øjeblik...</p>;
  }

  if (delvist) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">{delvist}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/opslag/${opslagId}`}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Se opslaget
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Ret igen
          </button>
        </div>
      </section>
    );
  }

  if (status !== "klar") {
    const beskeder: Record<Exclude<Status, "henter" | "klar">, string> = {
      ud: "Du skal være logget ind for at rette et opslag.",
      "findes-ikke": "Opslaget findes ikke.",
      "ingen-adgang": "Du kan kun rette dine egne opslag.",
      fejl: "Vi kunne ikke hente opslaget lige nu. Prøv igen om lidt.",
    };
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">{beskeder[status]}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {status === "ud" && (
            <Link
              href="/login"
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Log ind
            </Link>
          )}
          <Link
            href={status === "findes-ikke" ? "/" : `/opslag/${opslagId}`}
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Tilbage
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={gem} className="mt-8 space-y-6">
      <div>
        <label htmlFor="titel" className="block font-medium">
          Overskrift
        </label>
        <input
          id="titel"
          type="text"
          required
          maxLength={120}
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          className={feltStil}
        />
      </div>

      <div>
        <label htmlFor="tekst" className="block font-medium">
          Tekst
        </label>
        <textarea
          id="tekst"
          rows={8}
          maxLength={20000}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          className={feltStil}
        />
      </div>

      {eksisterende.length > 0 && (
        <div>
          <p className="font-medium">Billeder på opslaget</p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {eksisterende.map((b, i) => {
              const fjernet = fjernede.includes(b.id);
              return (
                <li
                  key={b.id}
                  className="rounded-xl bg-white p-2 ring-1 ring-green-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.url}
                    alt={`Billede ${i + 1}`}
                    className={`aspect-square w-full rounded-lg object-cover ${
                      fjernet ? "opacity-40" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => skiftFjern(b.id)}
                    className="mt-2 w-full text-sm underline underline-offset-4"
                  >
                    {fjernet ? "Fortryd" : "Fjern"}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-sm text-green-900">
            Billeder, du fjerner, bliver først slettet, når du trykker på Gem
            ændringer.
          </p>
        </div>
      )}

      {erEjer ? (
        plads > 0 ? (
          <BilledVaelger
            filer={nye}
            onAendr={setNye}
            maks={plads}
            titel={`Tilføj billeder (der er plads til ${plads} mere)`}
          />
        ) : (
          <p className="rounded-xl bg-green-100 p-3 text-sm">
            Opslaget har {MAKS_BILLEDER} billeder, som er det højeste. Fjern et,
            hvis du vil tilføje et nyt.
          </p>
        )
      ) : (
        <p className="rounded-xl bg-green-100 p-3 text-sm">
          Som administrator kan du fjerne billeder på andres opslag, men ikke
          tilføje nye.
        </p>
      )}

      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-green-200">
        <input
          type="checkbox"
          checked={erSpoergsmaal}
          onChange={(e) => setErSpoergsmaal(e.target.checked)}
          className="mt-1 h-5 w-5"
        />
        <span>
          <span className="font-medium">❓ Det her er et spørgsmål</span>
          <span className="block text-sm text-green-900">
            Sæt kryds, hvis du gerne vil have hjælp.
          </span>
        </span>
      </label>

      <fieldset>
        <legend className="font-medium">
          Hvor hører det hjemme? (vælg mindst én)
        </legend>
        <div className="mt-2 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-green-200">
          {hovedkategorier.map((hoved) => (
            <div key={hoved.slug}>
              <p className="font-semibold">
                <span aria-hidden="true">{hoved.ikon}</span> {hoved.navn}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                {hoved.underkategorier.map((under) => {
                  const vaerdi = `${hoved.slug}/${under.slug}`;
                  return (
                    <label
                      key={vaerdi}
                      className="flex items-center gap-2 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={valgte.includes(vaerdi)}
                        onChange={() => skiftKategori(vaerdi)}
                        className="h-5 w-5"
                      />
                      {under.navn}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="niveau" className="block font-medium">
          Niveau (valgfrit)
        </label>
        <select
          id="niveau"
          value={niveau}
          onChange={(e) => setNiveau(e.target.value)}
          className={feltStil}
        >
          {niveauer.map((n) => (
            <option key={n.vaerdi} value={n.vaerdi}>
              {n.navn}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={godMedBoern}
          onChange={(e) => setGodMedBoern(e.target.checked)}
          className="h-5 w-5"
        />
        God med børn (projektet kan laves sammen med et barn)
      </label>

      {fejl && (
        <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={gemmer}
          className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
        >
          {gemmer ? "Gemmer..." : "Gem ændringer"}
        </button>
        <Link
          href={`/opslag/${opslagId}`}
          className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
        >
          Annuller
        </Link>
      </div>
    </form>
  );
}