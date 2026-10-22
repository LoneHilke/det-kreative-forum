"use client";

import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

type Forslag = {
  id: string;
  type: "hoved" | "under";
  navn: string;
  ikon: string;
  status: "afventer" | "godkendt" | "afvist";
  hoved: { navn: string } | null;
};

const statusTekst = {
  afventer: "⏳ Venter på godkendelse",
  godkendt: "✅ Godkendt, og kategorien er på siden",
  afvist: "Ikke godkendt",
} as const;

export default function MineForslag() {
  const [forslag, setForslag] = useState<Forslag[]>([]);

  useEffect(() => {
    let afbrudt = false;

    async function hent() {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const bruger = session.session?.user;
        if (!bruger || afbrudt) return;

        const { data, error } = await supabase
          .from("kategoriforslag")
          .select("id, type, navn, ikon, status, hoved:hovedkategorier!hoved_id(navn)")
          .eq("forslagsstiller_id", bruger.id)
          .order("oprettet", { ascending: false })
          .limit(20);
        if (error) throw error;
        if (!afbrudt) setForslag((data ?? []) as unknown as Forslag[]);
      } catch (err) {
        console.error(err);
      }
    }

    hent();
    return () => {
      afbrudt = true;
    };
  }, []);

  if (forslag.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-green-200">
      <h2 className="text-xl font-bold">Mine forslag til kategorier</h2>
      <ul className="mt-3 space-y-3">
        {forslag.map((f) => (
          <li key={f.id}>
            <p className="font-medium">
              <span aria-hidden="true">{f.ikon}</span> {f.navn}{" "}
              <span className="text-sm font-normal text-green-900">
                (
                {f.type === "hoved"
                  ? "hovedkategori"
                  : `underkategori under ${f.hoved?.navn ?? "en hovedkategori"}`}
                )
              </span>
            </p>
            <p className="text-sm text-green-900">{statusTekst[f.status]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}