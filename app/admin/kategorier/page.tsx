import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../../utils/supabase/server";
import { hentKategorier, type Hovedkategori } from "../../../utils/kategorier";
import KategoriIkon from "../../../components/KategoriIkon";
import FlytUnderkategori from "../../../components/FlytUnderkategori";

export const metadata = {
  title: "Flyt underkategorier",
  robots: { index: false, follow: false },
};

function Ramme({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
      {children}
    </section>
  );
}

export default function KategorierSide() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link
          href="/admin/forslag"
          className="font-medium underline underline-offset-4"
        >
          ← Til forslag
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Flyt underkategorier
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Ligger en underkategori under den forkerte hovedkategori, kan du
          flytte den her. Opslagene følger med, og den gamle adresse sender
          videre til den nye.
        </p>
        <Suspense fallback={<p className="mt-8 text-center">Henter...</p>}>
          <Indhold />
        </Suspense>
      </div>
    </main>
  );
}

async function Indhold() {
  const supabase = await createClient();

  let brugerId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    brugerId = data?.claims?.sub ?? null;
  } catch (err) {
    console.error(err);
  }

  if (!brugerId) {
    return (
      <Ramme>
        <p className="text-lg">Du skal være logget ind.</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          Log ind
        </Link>
      </Ramme>
    );
  }

  const { data: erAdmin } = await supabase.rpc("er_admin");
  if (erAdmin !== true) {
    return (
      <Ramme>
        <p className="text-lg">Kun administratoren har adgang til denne side.</p>
      </Ramme>
    );
  }

  let kategorier: Hovedkategori[] = [];
  try {
    kategorier = await hentKategorier();
  } catch (err) {
    console.error(err);
    return (
      <Ramme>
        <p>Kategorierne kunne ikke hentes. Prøv igen om lidt.</p>
      </Ramme>
    );
  }

  const hovedListe = kategorier.map((h) => ({ slug: h.slug, navn: h.navn }));

  return (
    <div className="mt-6 space-y-6">
      {kategorier.map((h) => (
        <section
          key={h.slug}
          className="rounded-2xl bg-white p-5 ring-1 ring-green-200"
        >
          <h2 className="text-xl font-semibold">
            <span aria-hidden="true">{h.ikon}</span> {h.navn}
          </h2>
          {h.underkategorier.length === 0 ? (
            <p className="mt-2 text-green-900">Ingen underkategorier.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {h.underkategorier.map((u) => (
                <li key={u.slug}>
                  <p className="font-medium">
                    <span aria-hidden="true">
                      <KategoriIkon ikon={u.ikon} />
                    </span>{" "}
                    {u.navn}
                  </p>
                  <FlytUnderkategori
                    slug={u.slug}
                    navn={u.navn}
                    nuvaerendeHoved={h.slug}
                    hovedkategorier={hovedListe}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}