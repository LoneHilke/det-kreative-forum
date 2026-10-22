"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";
import { erEtEmoji } from "../utils/emoji";
import EmojiVaelger from "./EmojiVaelger";

export type AdminForslag = {
  id: string;
  type: "hoved" | "under";
  navn: string;
  ikon: string;
  intro: string;
  hovedNavn: string | null;
  forslagsstiller: string;
  dato: string;
  lignende: {
    navn: string;
    art: string;
    hoved_navn: string | null;
    status: string;
    praecis: boolean;
  }[];
};

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base";

export default function AdminForslagKort({ forslag }: { forslag: AdminForslag }) {
  const router = useRouter();
  const [navn, setNavn] = useState(forslag.navn);
  const [ikon, setIkon] = useState(forslag.ikon);
  const [intro, setIntro] = useState(forslag.intro);
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function godkend() {
    setFejl(null);
    if (navn.trim().length < 2 || navn.trim().length > 30) {
      setFejl("Navnet skal være 2-30 tegn.");
      return;
    }
    if (!erEtEmoji(ikon)) {
      setFejl("Ikonet skal være ét enkelt emoji. Tryk på et af ikonerne.");
      return;
    }

    setArbejder(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("godkend_kategoriforslag", {
        p_id: forslag.id,
        p_navn: navn.trim(),
        p_ikon: ikon.trim(),
        p_intro: forslag.type === "hoved" ? intro.trim() : "",
      });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke at godkende forslaget. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  async function afvis() {
    if (!window.confirm("Vil du afvise forslaget?")) return;

    setFejl(null);
    setArbejder(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("afvis_kategoriforslag", {
        p_id: forslag.id,
      });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke at afvise forslaget. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  return (
    <li className="rounded-2xl bg-white p-5 ring-1 ring-green-200">
      <p className="text-sm">
        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold">
          {forslag.type === "hoved"
            ? "Ny hovedkategori"
            : `Ny underkategori under ${forslag.hovedNavn ?? "?"}`}
        </span>{" "}
        foreslået af {forslag.forslagsstiller} · {forslag.dato}
      </p>

      {forslag.lignende.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-300">
          <p className="font-medium">Ligner:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {forslag.lignende.map((l, i) => (
              <li key={i}>
                {l.navn} ({l.art}
                {l.hoved_navn ? ` under ${l.hoved_navn}` : ""}
                {l.status === "afventer" ? ", venter" : ""})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <label className="block font-medium" htmlFor={`navn-${forslag.id}`}>
          Navn
        </label>
        <input
          id={`navn-${forslag.id}`}
          type="text"
          maxLength={30}
          value={navn}
          onChange={(e) => setNavn(e.target.value)}
          className={feltStil}
        />
      </div>

      <div className="mt-4">
        <EmojiVaelger
          id={`ikon-${forslag.id}`}
          vaerdi={ikon}
          onAendr={setIkon}
          label="Ikon"
        />
      </div>

      {forslag.type === "hoved" && (
        <div className="mt-4">
          <label className="block font-medium" htmlFor={`intro-${forslag.id}`}>
            Introduktion (tom giver en standardtekst)
          </label>
          <textarea
            id={`intro-${forslag.id}`}
            rows={3}
            maxLength={200}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className={feltStil}
          />
        </div>
      )}

      {fejl && (
        <p className="mt-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={godkend}
          disabled={arbejder}
          className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {arbejder ? "Arbejder..." : "Godkend"}
        </button>
        <button
          type="button"
          onClick={afvis}
          disabled={arbejder}
          className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200 disabled:opacity-60"
        >
          Afvis
        </button>
      </div>
    </li>
  );
}