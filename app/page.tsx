import Link from "next/link";
import { Suspense } from "react";
import KategoriKort from "../components/KategoriKort";

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
        <Suspense
          fallback={<p className="mt-10 text-center">Henter kategorier...</p>}
        >
          <KategoriKort />
        </Suspense>

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