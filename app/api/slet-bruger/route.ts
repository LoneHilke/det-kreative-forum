import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../utils/supabase/server";
import { opretAdminKlient } from "../../../utils/supabase/admin";
import { BILLED_BUCKET } from "../../../utils/billede";

type Admin = ReturnType<typeof opretAdminKlient>;

function svar(status: number, besked: string) {
  return NextResponse.json({ besked }, { status });
}

async function listMappe(admin: Admin, sti: string) {
  const resultat: { navn: string; erFil: boolean }[] = [];
  const side = 100;
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage
      .from(BILLED_BUCKET)
      .list(sti, { limit: side, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const e of data) {
      resultat.push({ navn: e.name, erFil: Boolean(e.id) });
    }
    if (data.length < side) break;
    offset += side;
  }
  return resultat;
}

// Alle filer, brugeren selv har lagt op (ligger i brugerens egen mappe)
async function brugerensFiler(admin: Admin, brugerId: string) {
  const filer: string[] = [];
  for (const e of await listMappe(admin, brugerId)) {
    if (e.erFil) {
      filer.push(`${brugerId}/${e.navn}`);
      continue;
    }
    for (const f of await listMappe(admin, `${brugerId}/${e.navn}`)) {
      if (f.erFil) filer.push(`${brugerId}/${e.navn}/${f.navn}`);
    }
  }
  return filer;
}

// Billeder, andre har lagt som "Jeg har lavet den" under brugerens opslag
async function andresBidragFiler(admin: Admin, brugerId: string) {
  const { data: opslag, error } = await admin
    .from("opslag")
    .select("id")
    .eq("forfatter_id", brugerId);
  if (error) throw error;

  const ider = (opslag ?? []).map((o) => o.id as string);
  const stier: string[] = [];
  for (let i = 0; i < ider.length; i += 100) {
    const { data, error: bidragFejl } = await admin
      .from("har_lavet_den")
      .select("sti")
      .in("opslag_id", ider.slice(i, i + 100))
      .not("sti", "is", null);
    if (bidragFejl) throw bidragFejl;
    for (const b of data ?? []) {
      if (b.sti) stier.push(b.sti as string);
    }
  }
  return stier;
}

async function fjernFiler(admin: Admin, stier: string[]) {
  for (let i = 0; i < stier.length; i += 100) {
    const { error } = await admin.storage
      .from(BILLED_BUCKET)
      .remove(stier.slice(i, i + 100));
    if (error) throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return svar(400, "Ugyldig forespørgsel.");
  }

  // Forespørgslen skal komme fra siden selv
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return svar(403, "Ugyldig forespørgsel.");
  }

  let body: { bekraeft?: unknown };
  try {
    body = await request.json();
  } catch {
    return svar(400, "Ugyldig forespørgsel.");
  }
  if (body.bekraeft !== "SLET") {
    return svar(400, "Bekræftelsen mangler.");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const brugerId = claimsData?.claims?.sub;
  if (!brugerId) {
    return svar(401, "Du skal være logget ind.");
  }

  let admin: Admin;
  try {
    admin = opretAdminKlient();
  } catch (err) {
    console.error(err);
    return svar(500, "Sletning er ikke sat op endnu.");
  }

  try {
    // Administratoren kan ikke slette sig selv her
    const { data: erAdmin, error: adminFejl } = await admin
      .from("administratorer")
      .select("id")
      .eq("id", brugerId)
      .maybeSingle();
    if (adminFejl) throw adminFejl;
    if (erAdmin) {
      return svar(403, "Administratoren kan ikke slette sig selv her.");
    }

    // 1. Slet filerne først. Supabase afviser at slette en bruger, der ejer filer.
    const stier = [
      ...new Set([
        ...(await brugerensFiler(admin, brugerId)),
        ...(await andresBidragFiler(admin, brugerId)),
      ]),
    ];
    await fjernFiler(admin, stier);

    // 2. Slet brugeren. Opslag, billeder, reaktioner og bidrag følger med.
    //    Kommentarer bliver stående uden navn.
    const { error: sletFejl } = await admin.auth.admin.deleteUser(brugerId);
    if (sletFejl) throw sletFejl;
  } catch (err) {
    console.error("Sletning af bruger mislykkedes:", err);
    return svar(500, "Det lykkedes ikke at slette din bruger. Prøv igen om lidt.");
  }

  return NextResponse.json({ ok: true });
}