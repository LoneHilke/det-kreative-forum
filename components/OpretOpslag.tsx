"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";
import type { Hovedkategori } from "../utils/kategoritype";
import { MAKS_BILLEDER, uploadBilleder } from "../utils/billede";
import BilledVaelger from "./BilledVaelger";

const niveauer = [
  { vaerdi: "", navn: "Ikke angivet" },
  { vaerdi: "startprojekt", navn: "Startprojekt" },
  { vaerdi: "lidt-ovede", navn: "For lidt øvede" },
  { vaerdi: "erfaren", navn: "Mere erfaren" },
];

type Status = "ukendt" | "ind" | "ud";

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base";

export default function OpretOpslag({
  forvalgt,
  tilbageLink,
  kategorier,
}: {
  forvalgt: string;
  tilbageLink: string;
  kategorier: Hovedkategori[];
}) {
  const [status, setStatus] = useState<Status>("ukendt");
  const [titel, setTitel] = useState("");
  const [tekst, setTekst] = useState("");
  const [valgte, setValgte] = useState<string[]>([forvalgt]);
  const [niveau, setNiveau] = useState("");
  const [godMedBoern, setGodMedBoern] = useState(false);
  const [erSpoergsmaal, setErSpoergsmaal] = useState(false);
  const [billeder, setBilleder] = useState<File[]>([]);
  const [fejl, setFejl] = useState<string | null>(null);
  const [advarsel, setAdvarsel] = useState<string | null>(null);
  const [sender, setSender] = useState(false);
  const [faerdig, setFaerdig] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth
        .getSession()
        .then(({ data }) => setStatus(data.session ? "ind" : "ud"))
        .catch((err) => {
          console.error(err);
          setStatus("ud");
        });
    } catch (err) {
      console.error(err);
      setStatus("ud");
    }
  }, []);

  function skiftKategori(vaerdi: string) {
    setValgte((forrige) =>
      forrige.includes(vaerdi)
        ? forrige.filter((v) => v !== vaerdi)
        : [...forrige, vaerdi]
    );
  }

  function nulstil() {
    setTitel("");
    setTekst("");
    setValgte([forvalgt]);
    setNiveau("");
    setGodMedBoern(false);
    setErSpoergsmaal(false);
    setBilleder([]);
    setFejl(null);
    setAdvarsel(null);
    setFaerdig(false);
  }

  async function laegOp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);
    setAdvarsel(null);

    if (valgte.length === 0) {
      setFejl("Vælg mindst én underkategori, så andre kan finde dit opslag.");
      return;
    }
    if (valgte.length > 10) {
      setFejl("Du kan højst vælge 10 underkategorier.");
      return;
    }

    setSender(true);
    try {
      const supabase = createClient();
      const { data: ny, error } = await supabase
        .from("opslag")
        .insert({
          titel: titel.trim(),
          tekst: tekst.trim(),
          kategorier: valgte,
          niveau: niveau || null,
          god_med_boern: godMedBoern,
          er_spoergsmaal: erSpoergsmaal,
        })
        .select("id")
        .single();

      if (error || !ny) {
        console.error(error);
        setFejl("Det lykkedes ikke at lægge opslaget op. Prøv igen om lidt.");
        return;
      }

      if (billeder.length > 0) {
        const { data: session } = await supabase.auth.getSession();
        const brugerId = session.session?.user.id;
        if (!brugerId) {
          setAdvarsel("Billederne kunne ikke lægges op.");
        } else {
          const resultat = await uploadBilleder(
            supabase,
            brugerId,
            ny.id,
            billeder,
            0
          );
          if (resultat.fejl) setAdvarsel(resultat.fejl);
        }
      }

      setFaerdig(true);
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSender(false);
    }
  }

  if (status === "ukendt") {
    return <p className="mt-8 text-center">Et øjeblik...</p>;
  }

  if (status === "ud") {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          Du skal være logget ind for at lave et opslag.
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

  if (faerdig) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          🎉 Dit opslag er lagt op. Tak, fordi du deler.
        </p>
        {advarsel && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-900" role="alert">
            Opslaget er lagt op, men ikke alle billeder kunne lægges op.{" "}
            {advarsel}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={tilbageLink}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Tilbage
          </Link>
          <button
            type="button"
            onClick={nulstil}
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Lav et nyt opslag
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={laegOp} className="mt-8 space-y-6">
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
          Fortæl om dit projekt
        </label>
        <p className="text-sm text-green-900">
          Skriv, som du har lyst: fx materialer, fremgangsmåde eller tips.
        </p>
        <textarea
          id="tekst"
          rows={8}
          maxLength={20000}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          className={feltStil}
        />
      </div>

      <BilledVaelger
        filer={billeder}
        onAendr={setBilleder}
        maks={MAKS_BILLEDER}
      />

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
            Sæt kryds, hvis du gerne vil have hjælp. Så kan andre se det på
            opslaget.
          </span>
        </span>
      </label>

      <fieldset>
        <legend className="font-medium">
          Hvor hører det hjemme? (vælg mindst én)
        </legend>
        <div className="mt-2 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-green-200">
          {kategorier.map((hoved) => (
            <div key={hoved.slug}>
              <p className="font-semibold">
                <span aria-hidden="true">
                  {hoved.ikon.startsWith("@") ? "" : hoved.ikon}
                </span>{" "}
                {hoved.navn}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
                {hoved.underkategorier.map((under) => (
                  <label
                    key={under.slug}
                    className="flex items-center gap-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={valgte.includes(under.slug)}
                      onChange={() => skiftKategori(under.slug)}
                      className="h-5 w-5"
                    />
                    {under.navn}
                  </label>
                ))}
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

      <p className="rounded-xl bg-green-100 p-3 text-sm leading-relaxed">
        Opslaget vises med det samme, og dit navn står ved det. Alle kan se det,
        også uden login. Skriv ikke din adresse, e-mail eller andre private
        oplysninger her, det er på eget ansvar.
      </p>

      {fejl && (
        <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}

      <button
        type="submit"
        disabled={sender}
        className="w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {sender
          ? billeder.length > 0
            ? "Lægger op og gør billeder mindre..."
            : "Lægger op..."
          : "Læg opslaget op"}
      </button>
    </form>
  );
}