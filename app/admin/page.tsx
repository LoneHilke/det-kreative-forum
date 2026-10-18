import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "../../utils/supabase/server";
import { opretAdminKlient } from "../../utils/supabase/admin";
import { BILLED_BUCKET } from "../../utils/billede";
import AdminKort, { type AdminSag } from "../../components/AdminKort";

export const metadata = {
  title: "Administrator",
  robots: { index: false, follow: false },
};

type Profil = { navn: string } | null;

type Raekke = {
  id: string;
  aarsag: string;
  oprettet: string;
  anmelder: Profil;
  opslag: {
    id: string;
    titel: string;
    tekst: string;
    forfatter_id: string;
    forfatter: Profil;
  } | null;
  kommentar: {
    id: string;
    tekst: string;
    forfatter_id: string | null;
    forfatter: Profil;
  } | null;
  bidrag: {
    id: string;
    tekst: string;
    sti: string | null;
    bruger_id: string;
    forfatter: Profil;
  } | null;
};

function Ramme({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl bg-white p-8 text-center ring-1 ring-green-200">
      {children}
    </section>
  );
}

export default function AdminSide() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Administrator</h1>
        <p className="mt-3 text-lg leading-relaxed">
          Her kan du se anmeldelser og fjerne eller afvise dem.
        </p>
        <Suspense fallback={<p className="mt-8 text-center">Henter...</p>}>
          <AdminIndhold />
        </Suspense>
      </div>
    </main>
  );
}

async function AdminIndhold() {
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
    .from("anmeldelser")
    .select(
      `id, aarsag, oprettet,
       anmelder:profiler!anmelder_id(navn),
       opslag:opslag!opslag_id(id, titel, tekst, forfatter_id, forfatter:profiler!forfatter_id(navn)),
       kommentar:kommentarer!kommentar_id(id, tekst, forfatter_id, forfatter:profiler!forfatter_id(navn)),
       bidrag:har_lavet_den!bidrag_id(id, tekst, sti, bruger_id, forfatter:profiler!bruger_id(navn))`
    )
    .eq("afvist", false)
    .order("oprettet", { ascending: true })
    .limit(100);

  if (error) {
    console.error(error);
    return (
      <Ramme>
        <p>Anmeldelserne kunne ikke hentes. Prøv igen om lidt.</p>
      </Ramme>
    );
  }

  const raekker = (data ?? []) as unknown as Raekke[];

  if (raekker.length === 0) {
    return (
      <Ramme>
        <p className="text-lg">Der er ingen åbne anmeldelser. 🎉</p>
      </Ramme>
    );
  }

  // Find ejernes e-mails. Det sker først nu, efter at vi har tjekket, at du er administrator.
  const ejerIder = [
    ...new Set(
      raekker
        .map((r) =>
          r.bidrag
            ? r.bidrag.bruger_id
            : r.kommentar
              ? r.kommentar.forfatter_id
              : (r.opslag?.forfatter_id ?? null)
        )
        .filter((id): id is string => !!id)
    ),
  ];

  const emails = new Map<string, string>();
  let emailFejl = false;
  try {
    const admin = opretAdminKlient();
    for (const id of ejerIder) {
      const { data: bruger, error: brugerFejl } =
        await admin.auth.admin.getUserById(id);
      if (brugerFejl) {
        console.error(brugerFejl);
        emailFejl = true;
        continue;
      }
      if (bruger.user?.email) emails.set(id, bruger.user.email);
    }
  } catch (err) {
    console.error(err);
    emailFejl = true;
  }

  const nu = Date.now();
  const sager: AdminSag[] = raekker
    .filter((r) => r.opslag)
    .map((r) => {
      const o = r.opslag!;
      const type: AdminSag["type"] = r.bidrag
        ? "bidrag"
        : r.kommentar
          ? "kommentar"
          : "opslag";

      const ejerId = r.bidrag
        ? r.bidrag.bruger_id
        : r.kommentar
          ? r.kommentar.forfatter_id
          : o.forfatter_id;
      const forfatterNavn = r.bidrag
        ? r.bidrag.forfatter?.navn
        : r.kommentar
          ? r.kommentar.forfatter?.navn
          : o.forfatter?.navn;

      const indhold =
        type === "opslag"
          ? o.tekst
          : type === "kommentar"
            ? (r.kommentar?.tekst ?? "")
            : (r.bidrag?.tekst ?? "");

      const sti = r.bidrag?.sti ?? null;

      return {
        id: r.id,
        type,
        dato: new Date(r.oprettet).toLocaleDateString("da-DK", {
          day: "numeric",
          month: "long",
          timeZone: "Europe/Copenhagen",
        }),
        dage: Math.max(
          0,
          Math.floor((nu - new Date(r.oprettet).getTime()) / 86_400_000)
        ),
        aarsag: r.aarsag,
        anmelder: r.anmelder?.navn ?? "slettet bruger",
        forfatter: forfatterNavn ?? "Slettet bruger",
        ejerEmail: ejerId ? (emails.get(ejerId) ?? null) : null,
        opslagId: o.id,
        opslagTitel: o.titel,
        indhold: indhold.length > 600 ? `${indhold.slice(0, 600)}…` : indhold,
        kommentarId: r.kommentar?.id ?? null,
        bidragId: r.bidrag?.id ?? null,
        bidragSti: sti,
        billedUrl: sti
          ? supabase.storage.from(BILLED_BUCKET).getPublicUrl(sti).data.publicUrl
          : null,
      };
    });

  return (
    <>
      <p className="mt-6 text-green-900">
        {sager.length === 1
          ? "1 åben anmeldelse."
          : `${sager.length} åbne anmeldelser.`}{" "}
        De ældste står øverst. Efter 3 dage markeres de, så du kan se, at ejeren
        har haft sin chance.
      </p>
      {emailFejl && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-900" role="alert">
          Nogle e-mails kunne ikke hentes. Tjek, at SUPABASE_SECRET_KEY ligger på
          Vercel.
        </p>
      )}
      <ul className="mt-4 space-y-4">
        {sager.map((sag) => (
          <AdminKort key={sag.id} sag={sag} />
        ))}
      </ul>
    </>
  );
}