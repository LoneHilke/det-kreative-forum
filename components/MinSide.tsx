"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";

type Status = "henter" | "ud" | "klar" | "fejl";

export default function MinSide() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("henter");
  const [email, setEmail] = useState("");
  const [navn, setNavn] = useState<string | null>(null);
  const [bekraeft, setBekraeft] = useState("");
  const [sletter, setSletter] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  useEffect(() => {
    let afbrudt = false;

    async function hent() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const bruger = data.session?.user;
        if (afbrudt) return;
        if (!bruger) {
          setStatus("ud");
          return;
        }
        setEmail(bruger.email ?? "");

        const { data: profil, error } = await supabase
          .from("profiler")
          .select("navn")
          .eq("id", bruger.id)
          .maybeSingle();
        if (afbrudt) return;
        if (error) throw error;
        setNavn(profil?.navn ?? null);
        setStatus("klar");
      } catch (err) {
        console.error(err);
        if (!afbrudt) setStatus("fejl");
      }
    }

    hent();
    return () => {
      afbrudt = true;
    };
  }, []);

  async function logUd() {
    try {
      const supabase = createClient();
      // Logger kun ud på denne enhed.
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.error(err);
    }
    router.push("/");
    router.refresh();
  }

  async function slet() {
    setSletter(true);
    setFejl(null);
    try {
      const svar = await fetch("/api/slet-bruger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bekraeft: "SLET" }),
      });

      if (!svar.ok) {
        const tekst = (await svar.json().catch(() => null)) as {
          besked?: string;
        } | null;
        setFejl(
          tekst?.besked ??
            "Det lykkedes ikke at slette din bruger. Prøv igen om lidt."
        );
        return;
      }

      try {
        const supabase = createClient();
        await supabase.auth.signOut({ scope: "local" });
      } catch (err) {
        console.error(err);
      }
      router.push("/slettet");
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSletter(false);
    }
  }

  if (status === "henter") {
    return <p className="mt-8 text-center">Et øjeblik...</p>;
  }

  if (status === "ud" || status === "fejl") {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          {status === "ud"
            ? "Du skal være logget ind for at se din side."
            : "Vi kunne ikke hente dine oplysninger lige nu. Prøv igen om lidt."}
        </p>
        {status === "ud" && (
          <div className="mt-5 flex flex-wrap justify-center gap-3">
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
        )}
      </section>
    );
  }

  const klarTilSletning = bekraeft.trim().toLowerCase() === "slet";

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-green-200">
        <h2 className="text-xl font-bold">Dine oplysninger</h2>
        <dl className="mt-3 space-y-2">
          <div>
            <dt className="text-sm text-green-900">Navn (vises ved dine opslag)</dt>
            <dd className="font-medium">{navn ?? "Ukendt"}</dd>
          </div>
          <div>
            <dt className="text-sm text-green-900">E-mail (kun synlig for dig)</dt>
            <dd className="font-medium">{email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-green-900">
          Vil du have ændret dit navn eller se, hvad vi har om dig, kan du skrive
          til os. Du finder adressen i{" "}
          <Link href="/privatliv" className="underline underline-offset-4">
            privatlivspolitikken
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={logUd}
          className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          Log ud
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-red-300">
        <h2 className="text-xl font-bold">Slet min bruger</h2>
        <p className="mt-2 leading-relaxed">Hvis du sletter din bruger:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
          <li>
            Dine <strong>opslag og billeder</strong> bliver slettet, og med dem
            også kommentarer og &quot;Jeg har lavet den&quot;-bidrag, som andre
            har lagt under dem.
          </li>
          <li>
            Dine <strong>reaktioner, gemte idéer</strong> og dine egne
            &quot;Jeg har lavet den&quot;-bidrag bliver slettet.
          </li>
          <li>
            Dine <strong>kommentarer på andres opslag</strong> bliver stående,
            men uden dit navn. Der står &quot;Slettet bruger&quot;. Har du
            skrevet noget, der kan afsløre, hvem du er, står det stadig.
          </li>
          <li>Dit navn og din e-mail bliver slettet.</li>
        </ul>
        <p className="mt-3 font-semibold">Det kan ikke fortrydes.</p>

        <label htmlFor="bekraeft" className="mt-4 block font-medium">
          Skriv SLET for at bekræfte
        </label>
        <input
          id="bekraeft"
          type="text"
          value={bekraeft}
          onChange={(e) => setBekraeft(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
        />

        {fejl && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-900" role="alert">
            {fejl}
          </p>
        )}

        <button
          type="button"
          onClick={slet}
          disabled={!klarTilSletning || sletter}
          className="mt-4 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
        >
          {sletter ? "Sletter..." : "Slet min bruger for altid"}
        </button>
      </section>
    </div>
  );
}