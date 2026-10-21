import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hentKategorier, type Hovedkategori } from "../../../utils/kategorier";
import KategoriIkon from "../../../components/KategoriIkon";

export default function Kategoriside({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Suspense fallback={<p className="text-center">Henter...</p>}>
          <KategoriIndhold params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function KategoriIndhold({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let kategorier: Hovedkategori[] = [];
  try {
    kategorier = await hentKategorier();
  } catch (err) {
    console.error(err);
    return (
      <p className="rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        Kategorierne kunne ikke hentes lige nu. Prøv igen om lidt.
      </p>
    );
  }

  const kategori = kategorier.find((k) => k.slug === slug);
  if (!kategori) {
    notFound();
  }

  return (
    <>
      <Link href="/" className="font-medium underline underline-offset-4">
        ← Tilbage til forsiden
      </Link>

      <section className="mt-6 text-center">
        <span className="text-6xl" aria-hidden="true">
          {kategori.ikon}
        </span>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{kategori.navn}</h1>
        {kategori.intro && (
          <p className="mt-4 text-lg leading-relaxed">{kategori.intro}</p>
        )}
      </section>

      <section className="mt-10 grid grid-cols-2 gap-4">
        {kategori.underkategorier.map((under) => (
          <Link
            key={under.slug}
            href={`/kategori/${kategori.slug}/${under.slug}`}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-green-200 transition last:odd:col-span-2 hover:bg-green-100"
          >
            <span
              className="flex h-12 items-center justify-center text-5xl"
              aria-hidden="true"
            >
              <KategoriIkon ikon={under.ikon} />
            </span>
            <span className="mt-3 text-lg font-semibold">{under.navn}</span>
          </Link>
        ))}
      </section>
    </>
  );
}