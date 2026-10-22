"use client";

const IKONER = [
  "🧶", "🧵", "🧷", "✂️", "📏", "🎀", "🧦", "🧣", "🧤", "🧸",
  "🎨", "🖌️", "🖍️", "✏️", "📄", "📦", "🦢", "🧩", "🎭", "🕸️",
  "🌸", "🌼", "🌷", "🌻", "🌿", "🍂", "🍁", "🍄", "🌰", "🐚",
  "🎄", "🐣", "🎃", "🎂", "💒", "🎁", "💌", "💶", "📿", "💍",
];

const feltStil =
  "mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-2xl";

export default function EmojiVaelger({
  id,
  vaerdi,
  onAendr,
  label = "Ikon (ét emoji)",
}: {
  id: string;
  vaerdi: string;
  onAendr: (ny: string) => void;
  label?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <p className="text-sm text-green-900">
        Tryk på et ikon herunder, eller skriv dit eget. På en Windows-pc åbner
        du emoji-panelet ved at klikke i feltet og trykke Windows-tasten og
        punktum (⊞ + .). På en Mac: Ctrl + Cmd + mellemrum. På mobilen bruger du
        emoji-tastaturet.
      </p>
      <input
        id={id}
        type="text"
        maxLength={20}
        value={vaerdi}
        onChange={(e) => onAendr(e.target.value)}
        className={feltStil}
      />
      <div
        className="mt-2 grid grid-cols-5 gap-1 sm:grid-cols-10"
        role="group"
        aria-label="Vælg et ikon"
      >
        {IKONER.map((e) => {
          const valgt = vaerdi.trim() === e;
          return (
            <button
              key={e}
              type="button"
              onClick={() => onAendr(e)}
              aria-label={`Brug ikonet ${e}`}
              aria-pressed={valgt}
              className={`rounded-lg p-2 text-2xl transition hover:bg-green-100 ${
                valgt
                  ? "bg-green-200 ring-2 ring-green-700"
                  : "bg-white ring-1 ring-green-200"
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>
    </div>
  );
}