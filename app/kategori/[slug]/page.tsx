import Link from "next/link";
import { notFound } from "next/navigation";
import { hovedkategorier } from "../../../data/kategorier";

export function generateStaticParams() {
  return hovedkategorier.map((kategori) => ({ slug: kategori.slug }));
}

export default async function Kategoriside({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const kategori = hovedkategorier.find((k) => k.slug === slug);

  if (!kategori) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/" className="font-medium underline underline-offset-4">
          ← Tilbage til forsiden
        </Link>

        <section className="mt-6 text-center">
          <span className="text-6xl" aria-hidden="true">
            {kategori.ikon}
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {kategori.navn}
          </h1>
          <p className="mt-4 text-lg leading-relaxed">{kategori.intro}</p>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-4">
          {kategori.underkategorier.map((under) => (
            <Link
              key={under.slug}
              href={`/kategori/${kategori.slug}/${under.slug}`}
              className="flex flex-col last:odd:col-span-2 items-center justify-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-green-200 transition hover:bg-green-100"
            >
              <span
                className="flex h-12 items-center justify-center text-5xl"
                aria-hidden="true"
              >
                {under.ikon}
              </span>
              <span className="mt-3 text-lg font-semibold">{under.navn}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}