"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";

type Status = "ukendt" | "ind" | "ud";

export default function KommentarFormular({ opslagId }: { opslagId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("ukendt");
  const [tekst, setTekst] = useState("");
  const [fejl, setFejl] = useState<string | null>(null);
  const [sender, setSender] = useState(false);

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

    if (!tekst.trim()) {
      setFejl("Skriv noget, før du sender.");
      return;
    }

    setSender(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("kommentarer")
        .insert({ opslag_id: opslagId, tekst: tekst.trim() });

      if (error) {
        console.error(error);
        setFejl("Det lykkedes ikke at sende kommentaren. Prøv igen om lidt.");
        return;
      }
      setTekst("");
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSender(false);
    }
  }

  if (status === "ukendt") {
    return null;
  }

  if (status === "ud") {
    return (
      <div className="mt-6 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        <p className="leading-relaxed">
          Du skal være logget ind for at skrive en kommentar.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Log ind
          </Link>
          <Link
            href="/registrer"
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Opret bruger
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="mt-6 space-y-3">
      <label htmlFor="kommentar" className="block font-medium">
        Skriv en kommentar eller et spørgsmål
      </label>
      <textarea
        id="kommentar"
        rows={4}
        maxLength={5000}
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        className="w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
      />
      <p className="text-sm text-green-900">
        Vil du spørge en bestemt person, kan du skrive @ og navnet, fx @Lone.
        Navnet bliver fremhævet, men personen får ikke besked, så kig gerne
        tilbage senere.
      </p>

      {fejl && (
        <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}

      <button
        type="submit"
        disabled={sender}
        className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {sender ? "Sender..." : "Send kommentar"}
      </button>
    </form>
  );
}