import Link from "next/link";
import { Suspense } from "react";
import SammenlaegFormular from "../../../components/SammenlaegFormular";
import {
  hentKategorier,
  type Hovedkategori,
} from "../../../utils/kategorier";

export default function SammenlaegSide({
  searchParams,
}: {
  searchParams: Promise<{ kilde?: string | string[] }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href="/" className="font-medium underline underline-offset-4">
          ← Tilbage til forsiden
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Foreslå en sammenlægning
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Hører to kategorier sammen? Foreslå, at de bliver til én.
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
  searchParams: Promise<{ kilde?: string | string[] }>;
}) {
  const { kilde } = await searchParams;
  const valgt = Array.isArray(kilde) ? kilde[0] : kilde;

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

  const fundet = kategorier
    .flatMap((h) => h.underkategorier.map((u) => ({ hoved: h, under: u })))
    .find((x) => x.under.slug === valgt);

  if (!fundet) {
    return (
      <p className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        Gå ind på den underkategori, du vil slå sammen med en anden, og tryk på
        &quot;Foreslå at slå den sammen med en anden&quot;.
      </p>
    );
  }

  const muligheder = kategorier
    .map((h) => ({
      hoved: h.navn,
      under: h.underkategorier
        .filter((u) => u.slug !== fundet.under.slug)
        .map((u) => ({ slug: u.slug, navn: u.navn })),
    }))
    .filter((m) => m.under.length > 0);

  return (
    <SammenlaegFormular
      kilde={{
        slug: fundet.under.slug,
        navn: fundet.under.navn,
        hoved: fundet.hoved.navn,
      }}
      muligheder={muligheder}
    />
  );
}