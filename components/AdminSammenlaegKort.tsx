"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export type AdminSammenlaegning = {
  id: string;
  kildeNavn: string;
  kildeHoved: string;
  kildeAntal: number;
  maalNavn: string;
  maalHoved: string;
  maalAntal: number;
  begrundelse: string;
  forslagsstiller: string;
  dato: string;
};

export default function AdminSammenlaegKort({
  sag,
}: {
  sag: AdminSammenlaegning;
}) {
  const router = useRouter();
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function godkend() {
    const ok = window.confirm(
      `${sag.kildeAntal} opslag flyttes fra ${sag.kildeNavn} til ${sag.maalNavn}, og ${sag.kildeNavn} bliver slettet. Det kan ikke fortrydes fra siden. Vil du fortsætte?`
    );
    if (!ok) return;

    setFejl(null);
    setArbejder(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("godkend_sammenlaegning", {
        p_id: sag.id,
      });
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke at gennemføre sammenlægningen. Prøv igen om lidt.");
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
      const { error } = await supabase.rpc("afvis_sammenlaegning", {
        p_id: sag.id,
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
          Sammenlægning
        </span>{" "}
        foreslået af {sag.forslagsstiller} · {sag.dato}
      </p>

      <p className="mt-3 text-lg">
        <strong>{sag.kildeNavn}</strong> ({sag.kildeHoved}, {sag.kildeAntal}{" "}
        opslag) → <strong>{sag.maalNavn}</strong> ({sag.maalHoved},{" "}
        {sag.maalAntal} opslag)
      </p>
      <p className="mt-1 text-sm text-green-900">
        {sag.kildeNavn} forsvinder, og dens opslag flyttes til {sag.maalNavn}.
      </p>

      <p className="mt-3 rounded-xl bg-green-50 p-3 leading-relaxed whitespace-pre-wrap">
        {sag.begrundelse}
      </p>

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
          {arbejder ? "Arbejder..." : "Godkend og slå sammen"}
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