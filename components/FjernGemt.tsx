"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function FjernGemt({ opslagId }: { opslagId: string }) {
  const router = useRouter();
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState(false);

  async function fjern() {
    setArbejder(true);
    setFejl(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reaktioner")
        .delete()
        .eq("opslag_id", opslagId)
        .eq("reaktion", "vil-proeve");
      if (error) {
        console.error(error);
        setFejl(true);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl(true);
    } finally {
      setArbejder(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={fjern}
        disabled={arbejder}
        className="rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold hover:bg-green-200 disabled:opacity-60"
      >
        {arbejder ? "Fjerner..." : "Fjern fra Gemte idéer"}
      </button>
      {fejl && (
        <span className="ml-2 text-sm text-red-900" role="alert">
          Det lykkedes ikke.
        </span>
      )}
    </div>
  );
}