import Link from "next/link";
import { notFound } from "next/navigation";
import { hovedkategorier } from "../../../../../data/kategorier";
import OpretOpslag from "../../../../../components/OpretOpslag";

export function generateStaticParams() {
  return hovedkategorier.flatMap((hoved) =>
    hoved.underkategorier.map((under) => ({
      slug: hoved.slug,
      underslug: under.slug,
    }))
  );
}

export default async function NytOpslag({
  params,
}: {
  params: Promise<{ slug: string; underslug: string }>;
}) {
  const { slug, underslug } = await params;
  const hoved = hovedkategorier.find((k) => k.slug === slug);
  const under = hoved?.underkategorier.find((u) => u.slug === underslug);

  if (!hoved || !under) {
    notFound();
  }

  const tilbageLink = `/kategori/${hoved.slug}/${under.slug}`;

  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link href={tilbageLink} className="font-medium underline underline-offset-4">
          ← Tilbage til {under.navn}
        </Link>

        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Lav et opslag</h1>
        <p className="mt-3 text-lg leading-relaxed">
          Del noget, du har lavet, så andre kan blive inspireret.
        </p>

        <OpretOpslag
          forvalgt={`${hoved.slug}/${under.slug}`}
          tilbageLink={tilbageLink}
        />
      </div>
    </main>
  );
}