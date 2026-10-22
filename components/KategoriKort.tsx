import Link from "next/link";
import { hentKategorier, type Hovedkategori } from "../utils/kategorier";

export default async function KategoriKort() {
  let kategorier: Hovedkategori[] = [];
  try {
    kategorier = await hentKategorier();
  } catch (err) {
    console.error(err);
    return (
      <p className="mt-10 rounded-2xl bg-white p-6 text-center ring-1 ring-green-200">
        Kategorierne kunne ikke hentes lige nu. Prøv igen om lidt.
      </p>
    );
  }

  return (
    <>
      <section className="mt-10 grid grid-cols-2 gap-4">
        {kategorier.map((kategori) => (
          <Link
            key={kategori.slug}
            href={`/kategori/${kategori.slug}`}
            className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-green-200 transition last:odd:col-span-2 hover:bg-green-100"
          >
            <span className="text-5xl" aria-hidden="true">
              {kategori.ikon}
            </span>
            <span className="mt-3 text-lg font-semibold">{kategori.navn}</span>
          </Link>
        ))}
      </section>
      <p className="mt-6 text-center">
        <Link
          href="/foreslaa"
          className="font-medium underline underline-offset-4"
        >
          💡 Foreslå en ny kategori
        </Link>
      </p>
    </>
  );
}