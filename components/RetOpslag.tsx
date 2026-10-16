"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";
import { hovedkategorier } from "../data/kategorier";

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
  const [fejl, setFejl] = useState<string | null>(null);
  const [gemmer, setGemmer] = useState(false);

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
        let maaRette = r.forfatter_id === bruger.id;
        if (!maaRette) {
          const { data: admin } = await supabase.rpc("er_admin");
          maaRette = admin === true;
        }
        if (afbrudt) return;
        if (!maaRette) {
          setStatus("ingen-adgang");
          return;
        }

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

    setGemmer(true);
    try {
      const supabase = createClient();
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