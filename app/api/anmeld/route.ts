import { NextResponse, type NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "../../../utils/supabase/server";
import { BILLED_BUCKET } from "../../../utils/billede";

const uuidMoenster =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ProfilNavn = { navn: string } | null;

type KommentarRaekke = {
  id: string;
  opslag_id: string;
  tekst: string;
  profiler: ProfilNavn;
};

type BidragRaekke = {
  id: string;
  opslag_id: string;
  tekst: string;
  sti: string | null;
  profiler: ProfilNavn;
};

type OpslagRaekke = {
  id: string;
  titel: string;
  tekst: string;
  profiler: ProfilNavn;
};

function svar(status: number, besked: string) {
  return NextResponse.json({ besked }, { status });
}

function kort(tekst: string, max: number) {
  return tekst.length > max ? `${tekst.slice(0, max)}…` : tekst;
}

export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return svar(400, "Ugyldig forespørgsel.");
  }

  let body: {
    opslagId?: unknown;
    kommentarId?: unknown;
    bidragId?: unknown;
    aarsag?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return svar(400, "Ugyldig forespørgsel.");
  }

  const aarsag = typeof body.aarsag === "string" ? body.aarsag.trim() : "";
  const kommentarId =
    typeof body.kommentarId === "string" ? body.kommentarId : null;
  const bidragId = typeof body.bidragId === "string" ? body.bidragId : null;
  let opslagId = typeof body.opslagId === "string" ? body.opslagId : "";

  if (!aarsag || aarsag.length > 1000) {
    return svar(400, "Skriv en årsag på op til 1.000 tegn.");
  }
  if (!uuidMoenster.test(opslagId)) {
    return svar(400, "Ugyldig forespørgsel.");
  }
  if (kommentarId !== null && !uuidMoenster.test(kommentarId)) {
    return svar(400, "Ugyldig forespørgsel.");
  }
  if (bidragId !== null && !uuidMoenster.test(bidragId)) {
    return svar(400, "Ugyldig forespørgsel.");
  }
  if (kommentarId !== null && bidragId !== null) {
    return svar(400, "Ugyldig forespørgsel.");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const brugerId = claimsData?.claims?.sub;
  if (!brugerId) {
    return svar(401, "Du skal være logget ind for at anmelde.");
  }

  // Find det anmeldte indhold
  let indhold = "";
  let forfatter = "Slettet bruger";
  let billedLink: string | null = null;

  if (kommentarId) {
    const { data: kData } = await supabase
      .from("kommentarer")
      .select("id, opslag_id, tekst, profiler(navn)")
      .eq("id", kommentarId)
      .maybeSingle();
    const k = kData as unknown as KommentarRaekke | null;
    if (!k) return svar(404, "Kommentaren findes ikke.");
    opslagId = k.opslag_id;
    indhold = k.tekst;
    forfatter = k.profiler?.navn ?? forfatter;
  }

  if (bidragId) {
    const { data: bData } = await supabase
      .from("har_lavet_den")
      .select("id, opslag_id, tekst, sti, profiler(navn)")
      .eq("id", bidragId)
      .maybeSingle();
    const b = bData as unknown as BidragRaekke | null;
    if (!b) return svar(404, "Bidraget findes ikke.");
    opslagId = b.opslag_id;
    indhold = b.tekst;
    forfatter = b.profiler?.navn ?? forfatter;
    if (b.sti) {
      billedLink = supabase.storage.from(BILLED_BUCKET).getPublicUrl(b.sti).data
        .publicUrl;
    }
  }

  const { data: oData } = await supabase
    .from("opslag")
    .select("id, titel, tekst, profiler(navn)")
    .eq("id", opslagId)
    .maybeSingle();
  const o = oData as unknown as OpslagRaekke | null;
  if (!o) return svar(404, "Opslaget findes ikke.");

  if (!kommentarId && !bidragId) {
    indhold = o.tekst;
    forfatter = o.profiler?.navn ?? forfatter;
  }

  const { data: anmelder } = await supabase
    .from("profiler")
    .select("navn")
    .eq("id", brugerId)
    .maybeSingle();

  // Gem anmeldelsen først, så den ikke kan gå tabt
  const { error: indsaetFejl } = await supabase.from("anmeldelser").insert({
    opslag_id: opslagId,
    kommentar_id: kommentarId,
    bidrag_id: bidragId,
    aarsag,
  });

  if (indsaetFejl) {
    if (indsaetFejl.code === "23505") {
      return svar(409, "Du har allerede anmeldt dette.");
    }
    if (indsaetFejl.message?.includes("for-mange-anmeldelser")) {
      return svar(429, "Du har anmeldt mange ting på kort tid. Vent lidt.");
    }
    console.error(indsaetFejl);
    return svar(500, "Det lykkedes ikke at gemme anmeldelsen.");
  }

  // Send mail til administratoren. Fejler det, ligger anmeldelsen stadig i databasen.
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ANMELD_TIL } =
    process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD && ANMELD_TIL) {
    try {
      const origin = new URL(request.url).origin;
      const type = kommentarId
        ? "kommentar"
        : bidragId
          ? "'Jeg har lavet den'-bidrag"
          : "opslag";
      const emne = kort(o.titel.replace(/[\r\n]+/g, " "), 80);

      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        requireTLS: Number(SMTP_PORT) !== 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transport.sendMail({
        from: `"Det Kreative Forum" <${SMTP_USER}>`,
        to: ANMELD_TIL,
        subject: `Anmeldelse af ${type}: ${emne}`,
        text: [
          `Der er anmeldt et ${type} på Det Kreative Forum.`,
          "",
          `Opslagets overskrift: ${o.titel}`,
          `Skrevet af: ${forfatter}`,
          "",
          "Indhold:",
          kort(indhold, 1500) || "(ingen tekst)",
          ...(billedLink ? ["", `Billede: ${billedLink}`] : []),
          "",
          "Årsag til anmeldelsen:",
          aarsag,
          "",
          `Anmeldt af: ${anmelder?.navn ?? "ukendt"}`,
          `Link: ${origin}/opslag/${opslagId}`,
          "",
          "Husk: Ejeren skal først have mulighed for selv at rette eller fjerne indholdet.",
        ].join("\n"),
      });
    } catch (err) {
      console.error("Mail om anmeldelse kunne ikke sendes:", err);
    }
  } else {
    console.error("Mail om anmeldelse kunne ikke sendes: opsætning mangler.");
  }

  return NextResponse.json({ ok: true });
}