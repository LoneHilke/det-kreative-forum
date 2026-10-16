"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

export default function OpslagHandlinger({
  opslagId,
  forfatterId,
  tilbageLink,
}: {
  opslagId: string;
  forfatterId: string;
  tilbageLink: string;
}) {
  const router = useRouter();
  const [maaRette, setMaaRette] = useState(false);
  const [sletter, setSletter] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    let afbrudt = false;

    async function tjek() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const bruger = data.session?.user;
        if (!bruger || afbrudt) return;

        if (bruger.id === forfatterId) {
          setMaaRette(true);
          return;
        }

        const { data: admin } = await supabase.rpc("er_admin");
        if (!afbrudt && admin === true) setMaaRette(true);
      } catch (err) {
        console.error(err);
      }
    }

    tjek();
    return () => {
      afbrudt = true;
    };
  }, [forfatterId]);

  async function slet() {
    if (
      !window.confirm(
        "Vil du slette opslaget? Kommentarer og anmeldelser under det bliver også slettet. Det kan ikke fortrydes."
      )
    ) {
      return;
    }

    setSletter(true);
    setFejl(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("opslag")
        .delete()
        .eq("id", opslagId)
        .select("id");

      if (error) {
        console.error(error);
        setFejl("Det lykkedes ikke at slette opslaget. Prøv igen om lidt.");
        return;
      }
      if (!data || data.length === 0) {
        setFejl("Du har ikke lov til at slette dette opslag.");
        return;
      }

      router.push(tilbageLink);
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSletter(false);
    }
  }

  if (!maaRette) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/opslag/${opslagId}/ret`}
          className="rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200"
        >
          ✏️ Ret
        </Link>
        <button
          type="button"
          onClick={slet}
          disabled={sletter}
          className="rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200 disabled:opacity-60"
        >
          {sletter ? "Sletter..." : "🗑️ Slet"}
        </button>
      </div>
      {fejl && (
        <p className="mt-2 text-red-900" role="alert">
          {fejl}
        </p>
      )}
    </div>
  );
}