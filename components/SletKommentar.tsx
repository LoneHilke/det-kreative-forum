"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function SletKommentar({ id }: { id: string }) {
  const router = useRouter();
  const [sletter, setSletter] = useState(false);
  const [fejl, setFejl] = useState(false);

  async function slet() {
    if (!window.confirm("Vil du slette kommentaren? Det kan ikke fortrydes.")) {
      return;
    }
    setSletter(true);
    setFejl(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("kommentarer").delete().eq("id", id);
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
      setSletter(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={slet}
        disabled={sletter}
        className="text-sm underline underline-offset-4 disabled:opacity-60"
      >
        {sletter ? "Sletter..." : "Slet"}
      </button>
      {fejl && (
        <span className="ml-2 text-sm text-red-900" role="alert">
          Det lykkedes ikke.
        </span>
      )}
    </span>
  );
}