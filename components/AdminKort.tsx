"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../utils/supabase/client";
import { BILLED_BUCKET } from "../utils/billede";
import { ANSVARLIG_NAVN, SIDEN_NAVN } from "../data/kontakt";

export type AdminSag = {
  id: string;
  type: "opslag" | "kommentar" | "bidrag";
  dato: string;
  dage: number;
  aarsag: string;
  anmelder: string;
  forfatter: string;
  ejerEmail: string | null;
  opslagId: string;
  opslagTitel: string;
  indhold: string;
  kommentarId: string | null;
  bidragId: string | null;
  bidragSti: string | null;
  billedUrl: string | null;
};

const FRIST_DAGE = 3;

const typeNavn = {
  opslag: "Opslag",
  kommentar: "Kommentar",
  bidrag: "'Jeg har lavet den'-bidrag",
} as const;

export default function AdminKort({ sag }: { sag: AdminSag }) {
  const router = useRouter();
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  const overskredet = sag.dage >= FRIST_DAGE;

  async function fjernIndhold() {
    const spoergsmaal =
      sag.type === "opslag"
        ? "Vil du fjerne hele opslaget? Billeder, kommentarer og andres bidrag under det bliver også slettet. Det kan ikke fortrydes."
        : sag.type === "kommentar"
          ? "Vil du fjerne kommentaren? Det kan ikke fortrydes."
          : "Vil du fjerne bidraget og dets billede? Det kan ikke fortrydes.";
    if (!window.confirm(spoergsmaal)) return;

    setArbejder(true);
    setFejl(null);
    try {
      const supabase = createClient();

      if (sag.type === "opslag") {
        const [
          { data: billeder, error: e1 },
          { data: bidrag, error: e2 },
        ] = await Promise.all([
          supabase
            .from("opslag_billeder")
            .select("sti")
            .eq("opslag_id", sag.opslagId),
          supabase
            .from("har_lavet_den")
            .select("sti")
            .eq("opslag_id", sag.opslagId)
            .not("sti", "is", null),
        ]);
        if (e1) throw e1;
        if (e2) throw e2;

        const stier = [...(billeder ?? []), ...(bidrag ?? [])]
          .map((b) => b.sti as string | null)
          .filter((s): s is string => !!s);

        if (stier.length > 0) {
          const { error } = await supabase.storage
            .from(BILLED_BUCKET)
            .remove(stier);
          if (error) throw error;
        }

        const { data, error } = await supabase
          .from("opslag")
          .delete()
          .eq("id", sag.opslagId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          setFejl("Opslaget kunne ikke slettes.");
          return;
        }
      } else if (sag.type === "kommentar" && sag.kommentarId) {
        const { data, error } = await supabase
          .from("kommentarer")
          .delete()
          .eq("id", sag.kommentarId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          setFejl("Kommentaren kunne ikke slettes.");
          return;
        }
      } else if (sag.type === "bidrag" && sag.bidragId) {
        if (sag.bidragSti) {
          const { error } = await supabase.storage
            .from(BILLED_BUCKET)
            .remove([sag.bidragSti]);
          if (error) throw error;
        }
        const { data, error } = await supabase
          .from("har_lavet_den")
          .delete()
          .eq("id", sag.bidragId)
          .select("id");
        if (error) throw error;
        if (!data || data.length === 0) {
          setFejl("Bidraget kunne ikke slettes.");
          return;
        }
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  async function afvis() {
    if (!window.confirm("Afvis anmeldelsen? Indholdet bliver stående.")) return;

    setArbejder(true);
    setFejl(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("anmeldelser")
        .update({ afvist: true })
        .eq("id", sag.id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        setFejl("Anmeldelsen kunne ikke afvises.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Det lykkedes ikke. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  function skrivTilEjer() {
    if (!sag.ejerEmail) return;
    const dit = sag.type === "kommentar" ? "din" : "dit";
    const hvad =
      sag.type === "opslag"
        ? "opslag"
        : sag.type === "kommentar"
          ? "kommentar"
          : "bidrag";
    const emne = `${dit[0].toUpperCase()}${dit.slice(1)} ${hvad} på ${SIDEN_NAVN} er blevet anmeldt`;
    const tekst = [
      "Hej,",
      "",
      `Dit${dit === "din" ? "n" : ""} ${hvad} på ${SIDEN_NAVN} er blevet anmeldt.`,
      "",
      `Årsag: ${sag.aarsag}`,
      "",
      `Du kan selv rette eller fjerne det inden for et par dage. Sker det ikke, kan jeg gribe ind.`,
      "",
      `Link: ${window.location.origin}/opslag/${sag.opslagId}`,
      "",
      "Venlig hilsen",
      ANSVARLIG_NAVN,
    ].join("\n");

    window.location.href = `mailto:${sag.ejerEmail}?subject=${encodeURIComponent(
      emne
    )}&body=${encodeURIComponent(tekst)}`;
  }

  return (
    <li
      className={`rounded-2xl bg-white p-5 ring-1 ${
        overskredet ? "ring-amber-500" : "ring-green-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold">
          {typeNavn[sag.type]}
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            overskredet ? "bg-amber-100 font-semibold" : "bg-green-50"
          }`}
        >
          Anmeldt for {sag.dage} {sag.dage === 1 ? "dag" : "dage"} siden ({sag.dato})
          {overskredet ? " · fristen er gået" : ""}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-semibold">{sag.opslagTitel}</h2>
      <p className="text-sm text-green-900">
        Skrevet af {sag.forfatter}
        {sag.ejerEmail ? ` · ${sag.ejerEmail}` : ""}
      </p>

      {sag.billedUrl && (
        <a
          href={sag.billedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sag.billedUrl}
            alt="Billede i det anmeldte bidrag"
            loading="lazy"
            className="max-h-48 w-auto max-w-full rounded-xl ring-1 ring-green-200"
          />
        </a>
      )}

      {sag.indhold && (
        <p className="mt-3 rounded-xl bg-green-50 p-3 leading-relaxed whitespace-pre-wrap">
          {sag.indhold}
        </p>
      )}

      <p className="mt-3">
        <span className="font-semibold">Årsag:</span> {sag.aarsag}
      </p>
      <p className="text-sm text-green-900">Anmeldt af {sag.anmelder}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`/opslag/${sag.opslagId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200"
        >
          Se opslaget
        </a>
        {sag.ejerEmail && (
          <button
            type="button"
            onClick={skrivTilEjer}
            className="rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200"
          >
            ✉️ Skriv til ejeren
          </button>
        )}
        <button
          type="button"
          onClick={afvis}
          disabled={arbejder}
          className="rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200 disabled:opacity-60"
        >
          Afvis anmeldelsen
        </button>
        <button
          type="button"
          onClick={fjernIndhold}
          disabled={arbejder}
          className="rounded-xl bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {arbejder ? "Arbejder..." : "Fjern indholdet"}
        </button>
      </div>

      {!sag.ejerEmail && (
        <p className="mt-2 text-sm text-green-900">
          Ejerens e-mail kunne ikke findes (brugeren er måske slettet).
        </p>
      )}

      {fejl && (
        <p className="mt-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}
    </li>
  );
}