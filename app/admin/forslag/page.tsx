import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../../utils/supabase/server";
import AdminForslagKort, {
  type AdminForslag,
} from "../../../components/AdminForslagKort";
import AdminSammenlaegKort, {
  type AdminSammenlaegning,
} from "../../../components/AdminSammenlaegKort";

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

type UnderRef = {
  slug: string;
  navn: string;
  hoved: { navn: string } | null;
} | null;

type SammenRaekke = {
  id: string;
  begrundelse: string;
  oprettet: string;
  kilde_navn: string;
  maal_navn: string;
  forslagsstiller: Profil;
  kilde: UnderRef;
  maal: UnderRef;
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
        <p className="flex flex-wrap gap-x-6 gap-y-1">
          <Link href="/admin" className="font-medium underline underline-offset-4">
            ← Til anmeldelser
          </Link>
          <Link
            href="/admin/kategorier"
            className="font-medium underline underline-offset-4"
          >
            Flyt underkategorier
          </Link>
        </p>
        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Forslag til kategorier
        </h1>
        <p className="mt-3 text-lg leading-relaxed">
          Her godkender eller afviser du forslag til nye kategorier og
          sammenlægninger. Du kan rette navn, ikon og introduktion, før du
          godkender en ny kategori.
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

  const [nye, sammen] = await Promise.all([
    supabase
      .from("kategoriforslag")
      .select(
        `id, type, navn, ikon, intro, oprettet,
         forslagsstiller:profiler!forslagsstiller_id(navn),
         hoved:hovedkategorier!hoved_id(navn)`
      )
      .eq("status", "afventer")
      .order("oprettet", { ascending: true })
      .limit(50),
    supabase
      .from("sammenlaegningsforslag")
      .select(
        `id, begrundelse, oprettet, kilde_navn, maal_navn,
         forslagsstiller:profiler!forslagsstiller_id(navn),
         kilde:underkategorier!kilde_id(slug, navn, hoved:hovedkategorier!hoved_id(navn)),
         maal:underkategorier!maal_id(slug, navn, hoved:hovedkategorier!hoved_id(navn))`
      )
      .eq("status", "afventer")
      .order("oprettet", { ascending: true })
      .limit(50),
  ]);

  if (nye.error || sammen.error) {
    console.error(nye.error ?? sammen.error);
    return (
      <Ramme>
        <p>Forslagene kunne ikke hentes. Prøv igen om lidt.</p>
      </Ramme>
    );
  }

  const raekker = (nye.data ?? []) as unknown as Raekke[];
  const sammenRaekker = ((sammen.data ?? []) as unknown as SammenRaekke[]).filter(
    (r) => r.kilde && r.maal
  );

  if (raekker.length === 0 && sammenRaekker.length === 0) {
    return (
      <Ramme>
        <p className="text-lg">Der er ingen forslag, der venter. 🎉</p>
      </Ramme>
    );
  }

  const antalIKategori = async (slug: string) => {
    const { count } = await supabase
      .from("opslag")
      .select("id", { count: "exact", head: true })
      .contains("kategorier", [slug]);
    return count ?? 0;
  };

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

  const sammenlaegninger: AdminSammenlaegning[] = await Promise.all(
    sammenRaekker.map(async (r) => ({
      id: r.id,
      kildeNavn: r.kilde?.navn ?? r.kilde_navn,
      kildeHoved: r.kilde?.hoved?.navn ?? "?",
      kildeAntal: r.kilde ? await antalIKategori(r.kilde.slug) : 0,
      maalNavn: r.maal?.navn ?? r.maal_navn,
      maalHoved: r.maal?.hoved?.navn ?? "?",
      maalAntal: r.maal ? await antalIKategori(r.maal.slug) : 0,
      begrundelse: r.begrundelse,
      forslagsstiller: r.forslagsstiller?.navn ?? "slettet bruger",
      dato: new Date(r.oprettet).toLocaleDateString("da-DK", {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Copenhagen",
      }),
    }))
  );

  return (
    <>
      {forslag.length > 0 && (
        <>
          <h2 className="mt-8 text-2xl font-bold">Nye kategorier</h2>
          <ul className="mt-4 space-y-4">
            {forslag.map((f) => (
              <AdminForslagKort key={f.id} forslag={f} />
            ))}
          </ul>
        </>
      )}
      {sammenlaegninger.length > 0 && (
        <>
          <h2 className="mt-10 text-2xl font-bold">Sammenlægninger</h2>
          <ul className="mt-4 space-y-4">
            {sammenlaegninger.map((s) => (
              <AdminSammenlaegKort key={s.id} sag={s} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}