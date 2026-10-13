"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "../../utils/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [besked, setBesked] = useState<string | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [sender, setSender] = useState(false);

    async function logInd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);
    setBesked(null);
    setSender(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Her kan man kun logge ind, ikke oprette sig. Det sker på siden "Opret bruger".
          shouldCreateUser: false,
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setFejl(
          "Det lykkedes ikke at sende et link. Tjek adressen, og vent et minut, hvis du lige har prøvet. Har du ikke en bruger endnu, kan du oprette en."
        );
        return;
      }

      setBesked(
        "Tjek din e-mail. Vi har sendt et link, som logger dig ind. Husk også at kigge i spam."
      );
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSender(false);
    }
  }

  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-md px-5 py-10">
        <h1 className="text-3xl font-bold">Log ind</h1>
        <p className="mt-3 leading-relaxed">
          Skriv din e-mail, så sender vi dig et link, der logger dig ind.
        </p>

        <form onSubmit={logInd} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
            />
          </div>

          {fejl && (
            <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
              {fejl}
            </p>
          )}
          {besked && (
            <p className="rounded-xl bg-white p-3 ring-1 ring-green-300" role="status">
              {besked}
            </p>
          )}

          <button
            type="submit"
            disabled={sender}
            className="w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {sender ? "Sender..." : "Send mig et link"}
          </button>
        </form>

        <p className="mt-6">
          Er du ny her?{" "}
          <Link href="/registrer" className="font-medium underline underline-offset-4">
            Opret bruger
          </Link>
        </p>
      </div>
    </main>
  );
}