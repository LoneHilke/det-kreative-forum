"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";
import { erEtEmoji } from "../utils/emoji";
import type { Hovedkategori } from "../utils/kategoritype";
import EmojiVaelger from "./EmojiVaelger";

type Status = "ukendt" | "ind" | "ud";

type Lignende = {
  navn: string;
  art: string;
  hoved_navn: string | null;
  status: string;
  praecis: boolean;
};

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base";

export default function ForslagFormular({
  kategorier,
  forvalgtHoved,
}: {
  kategorier: Hovedkategori[];
  forvalgtHoved: string;
}) {
  const [status, setStatus] = useState<Status>("ukendt");
  const [type, setType] = useState<"hoved" | "under">(
    forvalgtHoved ? "under" : "hoved"
  );
  const [hovedSlug, setHovedSlug] = useState(forvalgtHoved);
  const [navn, setNavn] = useState("");
  const [ikon, setIkon] = useState("");
  const [intro, setIntro] = useState("");
  const [lignende, setLignende] = useState<Lignende[]>([]);
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
      setNavn("");
      setIkon("");
      setIntro("");
      setLignende([]);
      setFejl(null);
      setSender(false);
      setFaerdig(false);
      setType(forvalgtHoved ? "under" : "hoved");
      setHovedSlug(forvalgtHoved);
    };
  }, [forvalgtHoved]);

  // Tjek for lignende navne, mens man skriver
  useEffect(() => {
    const rent = navn.trim();
    if (rent.length < 2) return;

    let afbrudt = false;
    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("lignende_kategorier", {
          p_navn: rent,
        });
        if (error) throw error;
        if (!afbrudt) setLignende((data ?? []) as Lignende[]);
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => {
      afbrudt = true;
      clearTimeout(timer);
    };
  }, [navn]);

  const vis = navn.trim().length >= 2 ? lignende : [];
  const harPraecis = vis.some((l) => l.praecis);

  function nytForslag() {
    setNavn("");
    setIkon("");
    setIntro("");
    setLignende([]);
    setFejl(null);
    setType(forvalgtHoved ? "under" : "hoved");
    setHovedSlug(forvalgtHoved);
    setFaerdig(false);
  }

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFejl(null);

    if (!ikon.trim()) {
      setFejl("Vælg et ikon. Du kan trykke på et af ikonerne under feltet.");
      return;
    }
    if (!erEtEmoji(ikon)) {
      setFejl("Ikonet skal være ét enkelt emoji. Tryk på et af ikonerne under feltet.");
      return;
    }
    if (type === "under" && !hovedSlug) {
      setFejl("Vælg, hvilken hovedkategori underkategorien skal ligge under.");
      return;
    }
    if (harPraecis) {
      setFejl("Der findes allerede en kategori, der hedder det samme.");
      return;
    }

    setSender(true);
    try {
      const supabase = createClient();

      let hovedId: string | null = null;
      if (type === "under") {
        const { data, error } = await supabase
          .from("hovedkategorier")
          .select("id")
          .eq("slug", hovedSlug)
          .maybeSingle();
        if (error || !data) {
          setFejl("Hovedkategorien blev ikke fundet. Vælg en anden.");
          return;
        }
        hovedId = data.id as string;
      }

      const { error } = await supabase.from("kategoriforslag").insert({
        type,
        hoved_id: hovedId,
        navn: navn.trim(),
        ikon: ikon.trim(),
        intro: type === "hoved" ? intro.trim() : "",
      });

      if (error) {
        const tekst = error.message ?? "";
        if (tekst.includes("for-mange-forslag")) {
          setFejl(
            "Du har allerede 3 forslag, der venter. Vent, til de er behandlet."
          );
        } else if (tekst.includes("findes-allerede")) {
          setFejl("Der findes allerede en kategori, der hedder det samme.");
        } else {
          console.error(error);
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
          Du skal være logget ind for at foreslå en kategori.
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
          💡 Tak for dit forslag! Det bliver set igennem, før det kommer på
          siden. Du kan se, hvordan det går, under Min side.
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
      <fieldset>
        <legend className="font-medium">Hvad vil du foreslå?</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="type"
              checked={type === "hoved"}
              onChange={() => setType("hoved")}
              className="h-5 w-5"
            />
            En ny hovedkategori (kommer på forsiden)
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="type"
              checked={type === "under"}
              onChange={() => setType("under")}
              className="h-5 w-5"
            />
            En ny underkategori under en hovedkategori
          </label>
        </div>
      </fieldset>

      {type === "under" && (
        <div>
          <label htmlFor="hoved" className="block font-medium">
            Hører under
          </label>
          <select
            id="hoved"
            value={hovedSlug}
            onChange={(e) => setHovedSlug(e.target.value)}
            className={feltStil}
          >
            <option value="">Vælg hovedkategori</option>
            {kategorier.map((h) => (
              <option key={h.slug} value={h.slug}>
                {h.navn}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="navn" className="block font-medium">
          Navn (2-30 tegn)
        </label>
        <input
          id="navn"
          type="text"
          required
          minLength={2}
          maxLength={30}
          value={navn}
          onChange={(e) => setNavn(e.target.value)}
          className={feltStil}
        />
      </div>

      {vis.length > 0 && (
        <div
          className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-300"
          role="status"
        >
          <p className="font-medium">Det her findes allerede eller ligner:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {vis.map((l, i) => (
              <li key={i}>
                {l.navn} ({l.art}
                {l.hoved_navn ? ` under ${l.hoved_navn}` : ""}
                {l.status === "afventer"
                  ? ", foreslået af en anden og venter"
                  : ""}
                ){l.praecis ? " · samme navn" : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            {harPraecis
              ? "Du kan ikke foreslå en kategori, der hedder det samme. Brug den, der findes, eller vælg et andet navn."
              : "Passer dit forslag ikke ind i en af dem, kan du sende det alligevel."}
          </p>
        </div>
      )}

      <EmojiVaelger id="ikon" vaerdi={ikon} onAendr={setIkon} />

      {type === "hoved" && (
        <div>
          <label htmlFor="intro" className="block font-medium">
            Kort, hyggelig introduktion (valgfri, højst 200 tegn)
          </label>
          <textarea
            id="intro"
            rows={3}
            maxLength={200}
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            className={feltStil}
          />
        </div>
      )}

      <p className="rounded-xl bg-green-100 p-3 text-sm leading-relaxed">
        Forslaget bliver set igennem, før det kommer på siden, og navn og ikon
        kan blive rettet. Du kan højst have 3 forslag, der venter.
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