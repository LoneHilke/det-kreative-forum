"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "../../utils/supabase/client";

function laesDato(tekst: string) {
  const dele = tekst.split("-").map(Number);
  if (dele.length !== 3 || dele.some((d) => Number.isNaN(d))) return null;
  const [aar, maaned, dag] = dele;
  if (aar < 1900) return null;
  return { aar, maaned, dag };
}

function erMindst18(dato: { aar: number; maaned: number; dag: number }) {
  const attende = new Date(dato.aar + 18, dato.maaned - 1, dato.dag);
  return attende <= new Date();
}

export default function Registrer() {
  const [navn, setNavn] = useState("");
  const [email, setEmail] = useState("");
  const [fodselsdato, setFodselsdato] = useState("");
  const [besked, setBesked] = useState<string | null>(null);
  const [fejl, setFejl] = useState<string | null>(null);
  const [sender, setSender] = useState(false);

    async function opret(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);
    setBesked(null);

    const dato = laesDato(fodselsdato);
    if (!dato) {
      setFejl("Skriv din fødselsdato, så vi kan tjekke, at du er mindst 18 år.");
      return;
    }
    if (!erMindst18(dato)) {
      setFejl("Du skal være mindst 18 år for at oprette en bruger.");
      return;
    }

    setSender(true);
    try {
      const supabase = createClient();
      // Fødselsdatoen sendes ikke videre og gemmes ikke. Kun navn og e-mail.
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: { name: navn.trim() },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error(error);
        setFejl(
          "Det lykkedes ikke at sende linket. Vent et minut, og prøv igen."
        );
        return;
      }

      setFodselsdato("");
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
        <h1 className="text-3xl font-bold">Opret bruger</h1>
        <p className="mt-3 leading-relaxed">
          Du skal være mindst 18 år. Du får et link på mail, når du skal logge
          ind, så der er ingen adgangskode at huske.
        </p>

        <div className="mt-5 rounded-2xl bg-green-100 p-4 text-sm leading-relaxed">
          <p className="font-semibold">Det er godt at vide, før du opretter dig</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Din e-mail bruges kun til at logge ind.</li>
            <li>Dit navn vises ved de opslag og kommentarer, du skriver.</li>
            <li>
              Opslag, kommentarer og navne kan ses af alle på internettet,
              også uden login, og kan dukke op i Google.
            </li>
            <li>Din fødselsdato bruges kun til alderstjekket og gemmes ikke.</li>
          </ul>
          <p className="mt-2">
            <Link href="/spilleregler" className="underline underline-offset-4">
              Læs vores kreative spilleregler
            </Link>
          </p>
        </div>

        <form onSubmit={opret} className="mt-6 space-y-4">
          <div>
            <label htmlFor="navn" className="block font-medium">
              Navn (vises ved dine opslag)
            </label>
            <input
              id="navn"
              type="text"
              required
              maxLength={50}
              value={navn}
              onChange={(e) => setNavn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-medium">
              E-mail (bruges til login)
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
          <div>
            <label htmlFor="fodselsdato" className="block font-medium">
              Fødselsdato (gemmes ikke)
            </label>
            <input
              id="fodselsdato"
              type="date"
              required
              value={fodselsdato}
              onChange={(e) => setFodselsdato(e.target.value)}
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
            {sender ? "Sender..." : "Opret og send mig et link"}
          </button>
        </form>

        <p className="mt-6">
          Har du allerede en bruger?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            Log ind
          </Link>
        </p>
      </div>
    </main>
  );
}