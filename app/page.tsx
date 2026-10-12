import Link from "next/link";

const kategorier = [
  { navn: "Garn", ikon: "🧶", link: "/kategori/garn" },
  { navn: "Perler", ikon: "📿", link: "/kategori/perler" },
  { navn: "Papir", ikon: "📄", link: "/kategori/papir" },
  { navn: "Gaveidéer", ikon: "🎁", link: "/kategori/gaveideer" },
  { navn: "Anledning", ikon: "🎉", link: "/kategori/Anledning" },
];

export default function Forside() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Velkomsttekst */}
        <section className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Velkommen til Det Kreative Forum
          </h1>
          <p className="mt-4 text-lg leading-relaxed">
            Her deler vi det, vi selv har lavet, og henter inspiration til
            næste projekt. Find en hylde herunder, og kig dig om.
          </p>
        </section>

        {/* Hovedkategorier */}
        <section className="mt-10 grid grid-cols-2 gap-4">
          {kategorier.map((kategori) => (
            <Link
              key={kategori.navn}
              href={kategori.link}
              className="flex flex-col last:odd:col-span-2 items-center justify-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-green-200 transition hover:bg-green-100"
            >
              <span className="text-5xl" aria-hidden="true">
                {kategori.ikon}
              </span>
              <span className="mt-3 text-lg font-semibold">
                {kategori.navn}
              </span>
            </Link>
          ))}
        </section>

        {/* Fællesskabets rammer */}
        <section className="mt-12 rounded-2xl bg-green-100 p-6">
          <h2 className="text-xl font-semibold">Sådan har vi det her</h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            <li>🎨 Her handler det om kreative projekter.</li>
            <li>💬 Vi taler pænt til hinanden.</li>
            <li>
              🍰 Almindelige bageopskrifter, møbelrenovering og store
              haveprojekter har deres egen plads et andet sted.
            </li>
          </ul>
          <Link
            href="/spilleregler"
            className="mt-4 inline-block font-medium underline underline-offset-4"
          >
            Læs vores kreative spilleregler
          </Link>
        </section>
      </div>
    </main>
  );
}