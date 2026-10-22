"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function FlytUnderkategori({
  slug,
  navn,
  nuvaerendeHoved,
  hovedkategorier,
}: {
  slug: string;
  navn: string;
  nuvaerendeHoved: string;
  hovedkategorier: { slug: string; navn: string }[];
}) {
  const router = useRouter();
  const [maal, setMaal] = useState("");
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  async function flyt() {
    const maalNavn = hovedkategorier.find((h) => h.slug === maal)?.navn;
    if (!maal || !maalNavn) return;
    if (!window.confirm(`Vil du flytte ${navn} til ${maalNavn}?`)) return;

    setFejl(null);
    setArbejder(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("flyt_underkategori", {
        p_slug: slug,
        p_hoved_slug: maal,
      });
      if (error) throw error;
      setMaal("");
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke at flytte den. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`flyt-${slug}`} className="sr-only">
          Flyt {navn} til
        </label>
        <select
          id={`flyt-${slug}`}
          value={maal}
          onChange={(e) => setMaal(e.target.value)}
          className="rounded-lg border border-green-300 bg-white px-3 py-2"
        >
          <option value="">Flyt til...</option>
          {hovedkategorier
            .filter((h) => h.slug !== nuvaerendeHoved)
            .map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.navn}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={flyt}
          disabled={!maal || arbejder}
          className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
        >
          {arbejder ? "Flytter..." : "Flyt"}
        </button>
      </div>
      {fejl && (
        <p className="mt-1 text-sm text-red-900" role="alert">
          {fejl}
        </p>
      )}
    </div>
  );
}