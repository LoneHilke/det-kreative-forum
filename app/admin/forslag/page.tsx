import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../../utils/supabase/server";
import AdminForslagKort, {
  type AdminForslag,
} from "../../../components/AdminForslagKort";

export const metadata = {
  title: "Forslag til kategorier",
  robots: { index: false, follow: false },
};

type Profil = { navn: string } | null;

type Raekke = {
  id: string;
  type: "hoved" | "under";
  navn: string;
  ikon: string;
  intro: string;
  oprettet: string;
  forslagsstiller: Profil;
  hoved: { navn: string } | null;
};

function Ramme({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
      {children}
    </section>
  );
}

export default function ForslagSide() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/admin" className="font-medium underline underline-offset-4">
          ← Til anmeldelser
        </Link>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Forslag til kategorier
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Her godkender eller afviser du forslag. Du kan rette navn, ikon og
          introduktion, før du godkender.
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

  const { data, error } = await supabase
    .from("kategoriforslag")
    .select(
      `id, type, navn, ikon, intro, oprettet,
       forslagsstiller:profiler!forslagsstiller_id(navn),
       hoved:hovedkategorier!hoved_id(navn)`
    )
    .eq("status", "afventer")
    .order("oprettet", { ascending: true })
    .limit(50);

  if (error) {
    console.error(error);
    return (
      <Ramme>
        <p>Forslagene kunne ikke hentes. Prøv igen om lidt.</p>
      </Ramme>
    );
  }

  const raekker = (data ?? []) as unknown as Raekke[];

  if (raekker.length === 0) {
    return (
      <Ramme>
        <p className="text-lg">Der er ingen forslag, der venter. 🎉</p>
      </Ramme>
    );
  }

  const forslag: AdminForslag[] = await Promise.all(
    raekker.map(async (r) => {
      const { data: lig } = await supabase.rpc("lignende_kategorier", {
        p_navn: r.navn,
        p_ekskluder: r.id,
      });
      return {
        id: r.id,
        type: r.type,
        navn: r.navn,
        ikon: r.ikon,
        intro: r.intro,
        hovedNavn: r.hoved?.navn ?? null,
        forslagsstiller: r.forslagsstiller?.navn ?? "slettet bruger",
        dato: new Date(r.oprettet).toLocaleDateString("da-DK", {
          day: "numeric",
          month: "long",
          timeZone: "Europe/Copenhagen",
        }),
        lignende: (lig ?? []) as AdminForslag["lignende"],
      };
    })
  );

  return (
    <ul className="mt-6 space-y-4">
      {forslag.map((f) => (
        <AdminForslagKort key={f.id} forslag={f} />
      ))}
    </ul>
  );
}