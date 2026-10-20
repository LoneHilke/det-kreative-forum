import { NextResponse, type NextRequest } from "next/server";
import { opretAdminKlient } from "../../../utils/supabase/admin";

// Kaldes én gang i døgnet af Vercel, så databasen ikke bliver sat på pause.
export async function GET(request: NextRequest) {
  const hemmelighed = process.env.CRON_SECRET;
  if (!hemmelighed) {
    console.error("Daglig aktivitet: CRON_SECRET mangler.");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${hemmelighed}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const admin = opretAdminKlient();

    const { error: skriveFejl } = await admin
      .from("puls")
      .upsert({ id: 1, sidst: new Date().toISOString() });
    if (skriveFejl) throw skriveFejl;

    const { count, error: laeseFejl } = await admin
      .from("opslag")
      .select("id", { count: "exact", head: true });
    if (laeseFejl) throw laeseFejl;

    return NextResponse.json({ ok: true, opslag: count ?? 0 });
  } catch (err) {
    console.error("Daglig aktivitet mislykkedes:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}