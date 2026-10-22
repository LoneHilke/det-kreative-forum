import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  findOmdirigering,
  hentKategorier,
  type Hovedkategori,
} from "../../../../../utils/kategorier";
import OpretOpslag from "../../../../../components/OpretOpslag";

function findUnder(kategorier: Hovedkategori[], slug: string) {
  return kategorier
    .flatMap((h) => h.underkategorier.map((u) => ({ hoved: h, under: u })))
    .find((x) => x.under.slug === slug);
}

export default function NytOpslag({
  params,
}: {
  params: Promise<{ slug: string; underslug: string }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Suspense fallback={<p className="text-center">Henter...</p>}>
          <NytIndhold params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function NytIndhold({
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
    let ny: string | null = null;
    try {
      ny = await findOmdirigering(underslug);
    } catch (err) {
      console.error(err);
    }
    const maal = ny ? findUnder(kategorier, ny) : undefined;
    if (maal) {
      redirect(`/kategori/${maal.hoved.slug}/${maal.under.slug}/nyt`);
    }
    notFound();
  }

  if (fundet.hoved.slug !== slug) {
    redirect(`/kategori/${fundet.hoved.slug}/${fundet.under.slug}/nyt`);
  }

  const { hoved, under } = fundet;
  const tilbageLink = `/kategori/${hoved.slug}/${under.slug}`;

  return (
    <>
      <Link
        href={tilbageLink}
        className="font-medium underline underline-offset-4"
      >
        ← Tilbage til {under.navn}
      </Link>

      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Lav et opslag</h1>
      <p className="mt-3 text-lg leading-relaxed">
        Del noget, du har lavet, så andre kan blive inspireret.
      </p>

      <OpretOpslag
        forvalgt={under.slug}
        tilbageLink={tilbageLink}
        kategorier={kategorier}
      />
    </>
  );
}