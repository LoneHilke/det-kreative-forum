"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

type Reaktion = "like" | "inspirerende" | "vil-proeve";

const knapper: { type: Reaktion; ikon: string; navn: string }[] = [
  { type: "like", ikon: "👍", navn: "Like" },
  { type: "inspirerende", ikon: "💡", navn: "Inspirerende" },
  { type: "vil-proeve", ikon: "❤️", navn: "Den vil jeg prøve" },
];

const nul: Record<Reaktion, number> = {
  like: 0,
  inspirerende: 0,
  "vil-proeve": 0,
};

export default function Reaktioner({ opslagId }: { opslagId: string }) {
  const [antal, setAntal] = useState<Record<Reaktion, number>>(nul);
  const [mine, setMine] = useState<Reaktion[]>([]);
  const [loggetInd, setLoggetInd] = useState(false);
  const [optaget, setOptaget] = useState(false);
  const [besked, setBesked] = useState<string | null>(null);

  useEffect(() => {
    let afbrudt = false;

    async function hent() {
      try {
        const supabase = createClient();

        const { data: tal, error: talFejl } = await supabase.rpc(
          "reaktions_antal",
          { p_opslag_id: opslagId }
        );
        if (talFejl) throw talFejl;
        if (!afbrudt) {
          const ny = { ...nul };
          for (const raekke of (tal ?? []) as {
            reaktion: Reaktion;
            antal: number | string;
          }[]) {
            if (raekke.reaktion in ny) ny[raekke.reaktion] = Number(raekke.antal);
          }
          setAntal(ny);
        }

        const { data: session } = await supabase.auth.getSession();
        const bruger = session.session?.user;
        if (afbrudt) return;
        setLoggetInd(!!bruger);

        if (bruger) {
          const { data: egne, error: egneFejl } = await supabase
            .from("reaktioner")
            .select("reaktion")
            .eq("opslag_id", opslagId)
            .eq("bruger_id", bruger.id);
          if (egneFejl) throw egneFejl;
          if (!afbrudt) {
            setMine((egne ?? []).map((r) => r.reaktion as Reaktion));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    hent();
    return () => {
      afbrudt = true;
    };
  }, [opslagId]);

  function aendre(type: Reaktion, harDen: boolean) {
    setMine((f) => (harDen ? f.filter((t) => t !== type) : [...f, type]));
    setAntal((f) => ({
      ...f,
      [type]: Math.max(0, f[type] + (harDen ? -1 : 1)),
    }));
  }

  async function skift(type: Reaktion) {
    if (!loggetInd) {
      setBesked("login");
      return;
    }
    if (optaget) return;

    setOptaget(true);
    setBesked(null);
    const harDen = mine.includes(type);
    aendre(type, harDen);

    try {
      const supabase = createClient();
      const { error } = harDen
        ? await supabase
            .from("reaktioner")
            .delete()
            .eq("opslag_id", opslagId)
            .eq("reaktion", type)
        : await supabase
            .from("reaktioner")
            .insert({ opslag_id: opslagId, reaktion: type });

      // 23505 betyder, at reaktionen allerede findes. Det er i orden.
      if (error && error.code !== "23505") throw error;
    } catch (err) {
      console.error(err);
      aendre(type, !harDen);
      setBesked("fejl");
    } finally {
      setOptaget(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        {knapper.map((k) => {
          const aktiv = mine.includes(k.type);
          return (
            <button
              key={k.type}
              type="button"
              onClick={() => skift(k.type)}
              disabled={optaget}
              aria-pressed={aktiv}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ring-1 transition disabled:opacity-60 ${
                aktiv
                  ? "bg-green-700 text-white ring-green-700"
                  : "bg-white ring-green-300 hover:bg-green-100"
              }`}
            >
              <span aria-hidden="true">{k.ikon}</span>
              <span>{k.navn}</span>
              <span className="rounded-full bg-black/10 px-2 text-sm">
                {antal[k.type]}
              </span>
            </button>
          );
        })}
      </div>

      {besked === "login" && (
        <p className="mt-3 rounded-xl bg-white p-3 ring-1 ring-green-300" role="status">
          Du skal være logget ind for at reagere.{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            Log ind
          </Link>{" "}
          eller{" "}
          <Link href="/registrer" className="font-medium underline underline-offset-4">
            opret bruger
          </Link>
          .
        </p>
      )}
      {besked === "fejl" && (
        <p className="mt-3 text-red-900" role="alert">
          Det lykkedes ikke. Prøv igen om lidt.
        </p>
      )}
    </div>
  );
}