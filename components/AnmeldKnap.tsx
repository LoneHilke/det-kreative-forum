"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";

type Status = "ukendt" | "ind" | "ud";

export default function AnmeldKnap({
  opslagId,
  kommentarId,
  bidragId,
}: {
  opslagId: string;
  kommentarId?: string;
  bidragId?: string;
}) {
  const [status, setStatus] = useState<Status>("ukendt");
  const [aaben, setAaben] = useState(false);
  const [aarsag, setAarsag] = useState("");
  const [sender, setSender] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [besked, setBesked] = useState<string | null>(null);

  const hvad = kommentarId
    ? "kommentaren"
    : bidragId
      ? "bidraget"
      : "opslaget";
  const feltId = `aarsag-${bidragId ?? kommentarId ?? opslagId}`;

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

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);

    if (!aarsag.trim()) {
      setFejl("Fortæl kort, hvorfor du anmelder det.");
      return;
    }

    setSender(true);
    try {
      const svar = await fetch("/api/anmeld", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opslagId,
          kommentarId: kommentarId ?? null,
          bidragId: bidragId ?? null,
          aarsag: aarsag.trim(),
        }),
      });

      if (svar.ok) {
        setBesked("Tak. Vi har modtaget din anmeldelse.");
        setAaben(false);
        setAarsag("");
        return;
      }
      if (svar.status === 409) {
        setFejl("Du har allerede anmeldt dette.");
      } else if (svar.status === 401) {
        setFejl("Du skal være logget ind for at anmelde.");
      } else if (svar.status === 429) {
        setFejl("Du har anmeldt mange ting på kort tid. Vent lidt.");
      } else {
        setFejl("Det lykkedes ikke at sende anmeldelsen. Prøv igen om lidt.");
      }
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSender(false);
    }
  }

  if (status === "ukendt") return null;

  if (status === "ud") {
    return (
      <Link href="/login" className="text-sm underline underline-offset-4">
        Log ind for at anmelde
      </Link>
    );
  }

  if (besked) {
    return (
      <p className="text-sm" role="status">
        {besked}
      </p>
    );
  }

  if (!aaben) {
    return (
      <button
        type="button"
        onClick={() => setAaben(true)}
        className="text-sm underline underline-offset-4"
      >
        🚩 Anmeld
      </button>
    );
  }

  return (
    <form
      onSubmit={send}
      className="mt-2 space-y-2 rounded-xl bg-green-50 p-3 ring-1 ring-green-200"
    >
      <label htmlFor={feltId} className="block text-sm font-medium">
        Hvorfor anmelder du {hvad}?
      </label>
      <textarea
        id={feltId}
        rows={3}
        maxLength={1000}
        value={aarsag}
        onChange={(e) => setAarsag(e.target.value)}
        className="w-full rounded-lg border border-green-300 bg-white px-3 py-2 text-base"
      />
      {fejl && (
        <p className="text-sm text-red-900" role="alert">
          {fejl}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={sender}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {sender ? "Sender..." : "Send anmeldelse"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAaben(false);
            setFejl(null);
          }}
          className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold hover:bg-green-200"
        >
          Annuller
        </button>
      </div>
    </form>
  );
}