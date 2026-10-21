import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import RetOpslag from "../../../../components/RetOpslag";
import {
  hentKategorier,
  type Hovedkategori,
} from "../../../../utils/kategorier";

const uuidMoenster =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RetSide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Suspense fallback={<p className="text-center">Et øjeblik...</p>}>
          <RetIndhold params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function RetIndhold({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!uuidMoenster.test(id)) {
    notFound();
  }

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

  return (
    <>
      <Link
        href={`/opslag/${id}`}
        className="font-medium underline underline-offset-4"
      >
        ← Tilbage til opslaget
      </Link>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Ret opslag</h1>
      <RetOpslag opslagId={id} kategorier={kategorier} />
    </>
  );
}