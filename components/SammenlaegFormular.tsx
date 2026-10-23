"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";

type Status = "ukendt" | "ind" | "ud";

export type SammenlaegMulighed = {
  hoved: string;
  under: { slug: string; navn: string }[];
};

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base";

export default function SammenlaegFormular({
  kilde,
  muligheder,
}: {
  kilde: { slug: string; navn: string; hoved: string };
  muligheder: SammenlaegMulighed[];
}) {
  const [status, setStatus] = useState<Status>("ukendt");
  const [maal, setMaal] = useState("");
  const [begrundelse, setBegrundelse] = useState("");
  const [fejl, setFejl] = useState<string | null>(null);
  const [sender, setSender] = useState(false);
  const [faerdig, setFaerdig] = useState(false);

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

  // Når man forlader siden, nulstilles tak-siden, så formularen er tom næste gang
  useEffect(() => {
    return () => {
      setFaerdig(false);
    };
  }, []);

  function nytForslag() {
    setMaal("");
    setBegrundelse("");
    setFejl(null);
    setFaerdig(false);
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);

    if (!maal) {
      setFejl("Vælg, hvilken kategori den skal slås sammen med.");
      return;
    }
    if (begrundelse.trim().length < 3) {
      setFejl("Skriv kort, hvorfor de to hører sammen.");
      return;
    }

    setSender(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("underkategorier")
        .select("id, slug")
        .in("slug", [kilde.slug, maal]);
      if (error) throw error;

      const kildeId = data?.find((r) => r.slug === kilde.slug)?.id as
        | string
        | undefined;
      const maalId = data?.find((r) => r.slug === maal)?.id as
        | string
        | undefined;
      if (!kildeId || !maalId) {
        setFejl("En af kategorierne blev ikke fundet. Prøv igen.");
        return;
      }

      const { error: indsaetFejl } = await supabase
        .from("sammenlaegningsforslag")
        .insert({
          kilde_id: kildeId,
          maal_id: maalId,
          begrundelse: begrundelse.trim(),
        });

      if (indsaetFejl) {
        const tekst = indsaetFejl.message ?? "";
        if (tekst.includes("for-mange-forslag")) {
          setFejl(
            "Du har allerede 3 forslag, der venter. Vent, til de er behandlet."
          );
        } else if (tekst.includes("findes-allerede")) {
          setFejl("Der er allerede et forslag om at slå den her sammen med en anden.");
        } else if (tekst.includes("samme-kategori")) {
          setFejl("Du kan ikke slå en kategori sammen med sig selv.");
        } else {
          console.error(indsaetFejl);
          setFejl("Det lykkedes ikke at sende forslaget. Prøv igen om lidt.");
        }
        return;
      }

      setFaerdig(true);
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setSender(false);
    }
  }

  if (status === "ukendt") {
    return <p className="mt-8 text-center">Et øjeblik...</p>;
  }

  if (status === "ud") {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          Du skal være logget ind for at foreslå en sammenlægning.
        </p>
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
      </section>
    );
  }

  if (faerdig) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
        <p className="text-lg leading-relaxed">
          🔀 Tak for dit forslag! Det bliver set igennem. Du kan se, hvordan det
          går, under Min side.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={nytForslag}
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
          >
            Send et nyt forslag
          </button>
          <Link
            href="/min-side"
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Til Min side
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
          >
            Til forsiden
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={send} className="mt-8 space-y-6">
      <p className="rounded-xl bg-white p-4 ring-1 ring-green-200">
        Du foreslår, at <strong>{kilde.navn}</strong> (under {kilde.hoved})
        bliver slået sammen med en anden underkategori.
      </p>

      <div>
        <label htmlFor="maal" className="block font-medium">
          Slås sammen med
        </label>
        <select
          id="maal"
          value={maal}
          onChange={(e) => setMaal(e.target.value)}
          className={feltStil}
        >
          <option value="">Vælg underkategori</option>
          {muligheder.map((m) => (
            <optgroup key={m.hoved} label={m.hoved}>
              {m.under.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.navn}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="begrundelse" className="block font-medium">
          Hvorfor hører de sammen? (kort, højst 300 tegn)
        </label>
        <textarea
          id="begrundelse"
          rows={3}
          maxLength={300}
          value={begrundelse}
          onChange={(e) => setBegrundelse(e.target.value)}
          className={feltStil}
        />
      </div>

      <p className="rounded-xl bg-green-100 p-3 text-sm leading-relaxed">
        Bliver forslaget godkendt, flyttes alle opslag fra {kilde.navn} over i
        den kategori, du vælger, og {kilde.navn} forsvinder. Gamle links virker
        stadig. Du kan højst have 3 forslag, der venter.
      </p>

      {fejl && (
        <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}

      <button
        type="submit"
        disabled={sender}
        className="w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {sender ? "Sender..." : "Send forslag"}
      </button>
    </form>
  );
}