import type { ReactNode } from "react";

// ---------- Egne ikoner (enkle stregtegninger) ----------

export function IkonHaeklenaal() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g transform="rotate(45 24 24)">
        <path d="M24 22V12" />
        <path d="M24 12C24 6 30 6 29 10" />
        <rect x="20" y="22" width="8" height="20" rx="4" />
        <path d="M20 30H28" />
      </g>
    </svg>
  );
}

export function IkonKniplepind() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="24" cy="7" r="3" />
      <path d="M22 10V28M26 10V28" />
      <path d="M22 28C13 30 13 44 24 44C35 44 35 30 26 28" />
      <path d="M17 35H31M18 39.5H30" />
    </svg>
  );
}

export function IkonPerleplade() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="36" height="36" rx="4" />
      {[14, 24, 34].flatMap((x) =>
        [14, 24, 34].map((y) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={3}
            fill={x === 24 || y === 24 ? "currentColor" : "none"}
          />
        ))
      )}
    </svg>
  );
}

// ---------- Kategorierne ----------

export type Underkategori = {
  slug: string;
  navn: string;
  ikon: ReactNode;
};

export type Hovedkategori = {
  slug: string;
  navn: string;
  ikon: string;
  intro: string;
  underkategorier: Underkategori[];
};

export const hovedkategorier: Hovedkategori[] = [
  {
    slug: "garn",
    navn: "Garn",
    ikon: "🧶",
    intro:
      "Her samler vi alt det, der kan strikkes, hækles og knipples. Fra små nisser til varme halstørklæder. Vælg en teknik, og find inspiration.",
    underkategorier: [
      { slug: "haekling", navn: "Hækling", ikon: <IkonHaeklenaal /> },
      { slug: "strikning", navn: "Strikning", ikon: "🧦" },
      { slug: "knipling", navn: "Knipling", ikon: <IkonKniplepind /> },
    ],
  },
  {
    slug: "perler",
    navn: "Perler",
    ikon: "📿",
    intro:
      "Små perler kan blive til store ting. Her finder du idéer til perleplader, armbånd og rundeperler.",
    underkategorier: [
      { slug: "perleplader", navn: "Perleplader", ikon: <IkonPerleplade /> },
      { slug: "armband", navn: "Armbånd", ikon: "💍" },
      { slug: "rundeperler", navn: "Rundeperler", ikon: "🔵" },
    ],
  },
  {
    slug: "papir",
    navn: "Papir",
    ikon: "📄",
    intro:
      "Papir kan blive til næsten alt: æsker, tegninger, malerier og foldede figurer. Kig dig omkring, og se, hvad andre har lavet.",
    underkategorier: [
      { slug: "aesker", navn: "Æsker", ikon: "📦" },
      { slug: "tegning", navn: "Tegning", ikon: "✏️" },
      { slug: "maling", navn: "Maling", ikon: "🎨" },
      { slug: "foldning", navn: "Foldning", ikon: "🦢" },
    ],
  },
  {
    slug: "gaveideer",
    navn: "Gaveidéer",
    ikon: "🎁",
    intro:
      "Den bedste gave er ofte den, man selv har lavet. Her er idéer til pengegaver og små hilsner, der varmer.",
    underkategorier: [
      { slug: "pengegaver", navn: "Pengegaver", ikon: "💶" },
      { slug: "en-lille-hilsen", navn: "En lille hilsen", ikon: "💌" },
    ],
  },
  {
    slug: "anledninger",
    navn: "Anledninger",
    ikon: "🎉",
    intro:
      "Der er altid en anledning til at skabe noget. Find idéer til årets højtider, fødselsdage og bryllupsdage.",
    underkategorier: [
      { slug: "jul", navn: "Jul", ikon: "🎄" },
      { slug: "paaske", navn: "Påske", ikon: "🐣" },
      { slug: "halloween", navn: "Halloween", ikon: "🎃" },
      { slug: "foedselsdag", navn: "Fødselsdag", ikon: "🎂" },
      { slug: "bryllupsdage", navn: "Bryllupsdage", ikon: "💒" },
    ],
  },
];