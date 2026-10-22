"use client";

import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

type Status = "afventer" | "godkendt" | "afvist";

type Linje = {
  id: string;
  tid: string;
  titel: string;
  status: Status;
};

type NytForslag = {
  id: string;
  type: "hoved" | "under";
  navn: string;
  ikon: string;
  status: Status;
  oprettet: string;
  hoved: { navn: string } | null;
};

type Sammen = {
  id: string;
  kilde_navn: string;
  maal_navn: string;
  status: Status;
  oprettet: string;
};

const statusTekst: Record<Status, string> = {
  afventer: "⏳ Venter på godkendelse",
  godkendt: "✅ Godkendt",
  afvist: "Ikke godkendt",
};

export default function MineForslag() {
  const [linjer, setLinjer] = useState<Linje[]>([]);

  useEffect(() => {
    let afbrudt = false;

    async function hent() {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const bruger = session.session?.user;
        if (!bruger || afbrudt) return;

        const [nye, sammen] = await Promise.all([
          supabase
            .from("kategoriforslag")
            .select(
              "id, type, navn, ikon, status, oprettet, hoved:hovedkategorier!hoved_id(navn)"
            )
            .eq("forslagsstiller_id", bruger.id)
            .order("oprettet", { ascending: false })
            .limit(20),
          supabase
            .from("sammenlaegningsforslag")
            .select("id, kilde_navn, maal_navn, status, oprettet")
            .eq("forslagsstiller_id", bruger.id)
            .order("oprettet", { ascending: false })
            .limit(20),
        ]);
        if (nye.error) throw nye.error;
        if (sammen.error) throw sammen.error;

        const a = ((nye.data ?? []) as unknown as NytForslag[]).map(
          (f): Linje => ({
            id: `n-${f.id}`,
            tid: f.oprettet,
            titel: `${f.ikon} ${f.navn} (${
              f.type === "hoved"
                ? "ny hovedkategori"
                : `ny underkategori under ${f.hoved?.navn ?? "en hovedkategori"}`
            })`,
            status: f.status,
          })
        );
        const b = ((sammen.data ?? []) as unknown as Sammen[]).map(
          (s): Linje => ({
            id: `s-${s.id}`,
            tid: s.oprettet,
            titel: `🔀 ${s.kilde_navn} slås sammen med ${s.maal_navn}`,
            status: s.status,
          })
        );

        const alle = [...a, ...b].sort(
          (x, y) => new Date(y.tid).getTime() - new Date(x.tid).getTime()
        );
        if (!afbrudt) setLinjer(alle);
      } catch (err) {
        console.error(err);
      }
    }

    hent();
    return () => {
      afbrudt = true;
    };
  }, []);

  if (linjer.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-green-200">
      <h2 className="text-xl font-bold">Mine forslag til kategorier</h2>
      <ul className="mt-3 space-y-3">
        {linjer.map((l) => (
          <li key={l.id}>
            <p className="font-medium">{l.titel}</p>
            <p className="text-sm text-green-900">{statusTekst[l.status]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}