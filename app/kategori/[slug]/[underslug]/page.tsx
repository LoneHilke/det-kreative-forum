import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  findOmdirigering,
  hentKategorier,
  type Hovedkategori,
} from "../../../../utils/kategorier";
import OpslagListe from "../../../../components/OpslagListe";
import KategoriIkon from "../../../../components/KategoriIkon";

function findUnder(kategorier: Hovedkategori[], slug: string) {
  return kategorier
    .flatMap((h) => h.underkategorier.map((u) => ({ hoved: h, under: u })))
    .find((x) => x.under.slug === slug);
}

export default function Underkategoriside({
  params,
}: {
  params: Promise<{ slug: string; underslug: string }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Suspense fallback={<p className="text-center">Henter...</p>}>
          <UnderIndhold params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function UnderIndhold({
  params,
}: {
  params: Promise<{ slug: string; underslug: string }>;
}) {
  const { slug, underslug } = await params;

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

  const fundet = findUnder(kategorier, underslug);

  if (!fundet) {
    // Er den slået sammen med en anden, sendes man videre
    let ny: string | null = null;
    try {
      ny = await findOmdirigering(underslug);
    } catch (err) {
      console.error(err);
    }
    const maal = ny ? findUnder(kategorier, ny) : undefined;
    if (maal) {
      redirect(`/kategori/${maal.hoved.slug}/${maal.under.slug}`);
    }
    notFound();
  }

  // Er underkategorien flyttet, sendes man videre til den nye adresse
  if (fundet.hoved.slug !== slug) {
    redirect(`/kategori/${fundet.hoved.slug}/${fundet.under.slug}`);
  }

  const { hoved, under } = fundet;

  return (
    <>
      <Link
        href={`/kategori/${hoved.slug}`}
        className="font-medium underline underline-offset-4"
      >
        ← Tilbage til {hoved.navn}
      </Link>

      <section className="mt-6 text-center">
        <span
          className="flex h-16 items-center justify-center text-6xl"
          aria-hidden="true"
        >
          <KategoriIkon ikon={under.ikon} />
        </span>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{under.navn}</h1>
      </section>

      <div className="mt-8 text-center">
        <Link
          href={`/kategori/${hoved.slug}/${under.slug}/nyt`}
          className="inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
        >
          ✏️ Lav et opslag
        </Link>
      </div>

      <Suspense
        fallback={<p className="mt-10 text-center">Henter opslag...</p>}
      >
        <OpslagListe kategori={under.slug} />
      </Suspense>

      <p className="mt-10 text-center">
        <Link
          href={`/foreslaa/sammenlaeg?kilde=${under.slug}`}
          className="font-medium underline underline-offset-4"
        >
          🔀 Foreslå at slå den sammen med en anden
        </Link>
      </p>
    </>
  );
}