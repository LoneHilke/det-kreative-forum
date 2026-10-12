import Link from "next/link";
import { notFound } from "next/navigation";
import { hovedkategorier } from "../../../../data/kategorier";

export function generateStaticParams() {
  return hovedkategorier.flatMap((hoved) =>
    hoved.underkategorier.map((under) => ({
      slug: hoved.slug,
      underslug: under.slug,
    }))
  );
}

export default async function Underkategoriside({
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

  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
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
            {under.ikon}
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{under.navn}</h1>
        </section>

        <section className="mt-10 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
          <p className="text-lg leading-relaxed">
            Der er ingen opslag her endnu.
          </p>
        </section>
      </div>
    </main>
  );
}