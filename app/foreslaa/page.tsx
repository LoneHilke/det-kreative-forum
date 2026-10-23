import Link from "next/link";
import { Suspense } from "react";
import ForslagFormular from "../../components/ForslagFormular";
import { hentKategorier, type Hovedkategori } from "../../utils/kategorier";

export default function ForeslaaSide({
  searchParams,
}: {
  searchParams: Promise<{ hoved?: string | string[] }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="font-medium underline underline-offset-4">
          ← Tilbage til forsiden
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Foreslå en ny kategori
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Mangler der en hylde til det, du laver? Foreslå den her.
        </p>
        <Suspense fallback={<p className="mt-8 text-center">Et øjeblik...</p>}>
          <Indhold searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Indhold({
  searchParams,
}: {
  searchParams: Promise<{ hoved?: string | string[] }>;
}) {
  const { hoved } = await searchParams;
  const valgt = Array.isArray(hoved) ? hoved[0] : hoved;

  let kategorier: Hovedkategori[] = [];
  try {
    kategorier = await hentKategorier();
  } catch (err) {
    console.error(err);
    return (
      <p className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        Kategorierne kunne ikke hentes lige nu. Prøv igen om lidt.
      </p>
    );
  }

  const forvalgt = kategorier.some((k) => k.slug === valgt) ? (valgt ?? "") : "";

  return (
    <ForslagFormular
      key={forvalgt || "ny"}
      kategorier={kategorier}
      forvalgtHoved={forvalgt}
    />
  );
}