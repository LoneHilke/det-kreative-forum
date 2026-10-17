"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { erTilladtBillede } from "../utils/billede";

function stoerrelse(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function BilledVaelger({
  filer,
  onAendr,
  maks,
  titel,
}: {
  filer: File[];
  onAendr: (filer: File[]) => void;
  maks: number;
  titel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [besked, setBesked] = useState<string | null>(null);

  function vaelg(e: ChangeEvent<HTMLInputElement>) {
    const valgte = Array.from(e.target.files ?? []);
    e.target.value = "";
    setBesked(null);
    if (valgte.length === 0) return;

    const gyldige = valgte.filter(erTilladtBillede);
    const plads = Math.max(0, maks - filer.length);
    const tilfoej = gyldige.slice(0, plads);

    const beskeder: string[] = [];
    if (gyldige.length < valgte.length) {
      beskeder.push("Kun billeder af typen JPEG, PNG eller WebP kan bruges.");
    }
    if (gyldige.length > plads) {
      beskeder.push(`Du kan højst have ${maks} billeder.`);
    }
    if (beskeder.length > 0) setBesked(beskeder.join(" "));
    if (tilfoej.length > 0) onAendr([...filer, ...tilfoej]);
  }

  function fjern(index: number) {
    onAendr(filer.filter((_, i) => i !== index));
    setBesked(null);
  }

  return (
    <div>
      <p className="font-medium">
        {titel ?? `Billeder (valgfrit, op til ${maks})`}
      </p>
      <p className="text-sm text-green-900">
        Billederne gøres automatisk mindre. Alle kan se dem, også uden login, så
        vis kun ansigter, når det er ansigtsmaling.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={vaelg}
        className="hidden"
        aria-label="Vælg billeder"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={filer.length >= maks}
        className="mt-2 rounded-xl bg-green-100 px-4 py-2 font-semibold hover:bg-green-200 disabled:opacity-60"
      >
        📷 Vælg billeder
      </button>

      {besked && (
        <p className="mt-2 text-red-900" role="alert">
          {besked}
        </p>
      )}

      {filer.length > 0 && (
        <ul className="mt-3 space-y-2">
          {filer.map((fil, i) => (
            <li
              key={`${fil.name}-${fil.size}-${i}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-green-200"
            >
              <span className="min-w-0 truncate">
                {fil.name}{" "}
                <span className="text-sm text-green-900">
                  ({stoerrelse(fil.size)})
                </span>
              </span>
              <button
                type="button"
                onClick={() => fjern(i)}
                className="shrink-0 text-sm underline underline-offset-4"
              >
                Fjern
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}