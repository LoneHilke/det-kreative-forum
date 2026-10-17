import { createClient } from "./supabase/client";

type Klient = ReturnType<typeof createClient>;

export const BILLED_BUCKET = "opslag-billeder";
export const MAKS_BILLEDER = 4;

const TILLADTE_TYPER = ["image/jpeg", "image/png", "image/webp"];
const MAKS_ORIGINAL = 30 * 1024 * 1024;
const MAKS_SIDE = 1600;

export function erTilladtBillede(fil: File) {
  return TILLADTE_TYPER.includes(fil.type);
}

// Tegner billedet om i browseren som et almindeligt JPEG. Det gør det mindre
// og fjerner skjulte oplysninger som fx hvor billedet er taget.
export async function formindsk(fil: File): Promise<Blob> {
  if (!erTilladtBillede(fil)) throw new Error("filtype");
  if (fil.size > MAKS_ORIGINAL) throw new Error("for-stor");

  const bitmap = await createImageBitmap(fil, {
    imageOrientation: "from-image",
  });
  const skala = Math.min(1, MAKS_SIDE / Math.max(bitmap.width, bitmap.height));
  const bredde = Math.max(1, Math.round(bitmap.width * skala));
  const hoejde = Math.max(1, Math.round(bitmap.height * skala));

  const canvas = document.createElement("canvas");
  canvas.width = bredde;
  canvas.height = hoejde;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, bredde, hoejde);
  ctx.drawImage(bitmap, 0, 0, bredde, hoejde);
  bitmap.close();

  let sidste: Blob | null = null;
  for (const kvalitet of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", kvalitet)
    );
    if (blob) {
      sidste = blob;
      if (blob.size <= 800 * 1024) return blob;
    }
  }
  if (sidste && sidste.size <= 1_000_000) return sidste;
  throw new Error("for-stor-efter-formindskning");
}

export async function uploadBilleder(
  supabase: Klient,
  brugerId: string,
  opslagId: string,
  filer: File[],
  startRaekkefoelge: number
): Promise<{ lykkedes: number; fejl: string | null }> {
  let lykkedes = 0;

  for (let i = 0; i < filer.length; i++) {
    try {
      const blob = await formindsk(filer[i]);
      const sti = `${brugerId}/${opslagId}/${crypto.randomUUID()}.jpg`;

      const { error: uploadFejl } = await supabase.storage
        .from(BILLED_BUCKET)
        .upload(sti, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
        });
      if (uploadFejl) throw uploadFejl;

      const { error: raekkeFejl } = await supabase
        .from("opslag_billeder")
        .insert({
          opslag_id: opslagId,
          sti,
          raekkefoelge: startRaekkefoelge + i,
        });
      if (raekkeFejl) {
        await supabase.storage.from(BILLED_BUCKET).remove([sti]);
        throw raekkeFejl;
      }

      lykkedes++;
    } catch (err) {
      console.error(err);
      return { lykkedes, fejl: `Billede ${i + 1} kunne ikke lægges op.` };
    }
  }

  return { lykkedes, fejl: null };
}