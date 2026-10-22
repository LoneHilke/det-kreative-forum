import { opretOffentligKlient } from "./supabase/offentlig";
import type { Hovedkategori } from "./kategoritype";

export type { Hovedkategori, Underkategori } from "./kategoritype";

type Raa = {
  slug: string;
  navn: string;
  ikon: string;
  intro: string;
  raekkefoelge: number | string;
  underkategorier:
    | {
        slug: string;
        navn: string;
        ikon: string;
        raekkefoelge: number | string;
      }[]
    | null;
};

// Henter alle kategorier fra databasen (hoved med underkategorier, i rækkefølge).
export async function hentKategorier(): Promise<Hovedkategori[]> {
  const supabase = opretOffentligKlient();
  const { data, error } = await supabase
    .from("hovedkategorier")
    .select(
      "slug, navn, ikon, intro, raekkefoelge, underkategorier!hoved_id(slug, navn, ikon, raekkefoelge)"
    )
    .order("raekkefoelge", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as Raa[]).map((h) => ({
    slug: h.slug,
    navn: h.navn,
    ikon: h.ikon,
    intro: h.intro,
    underkategorier: [...(h.underkategorier ?? [])]
      .sort((a, b) => Number(a.raekkefoelge) - Number(b.raekkefoelge))
      .map((u) => ({ slug: u.slug, navn: u.navn, ikon: u.ikon })),
  }));
}

// Er en underkategori slået sammen med en anden, findes den nye adresse her.
export async function findOmdirigering(
  gammelSlug: string
): Promise<string | null> {
  const supabase = opretOffentligKlient();
  const { data, error } = await supabase
    .from("kategori_omdirigeringer")
    .select("ny_slug")
    .eq("gammel_slug", gammelSlug)
    .maybeSingle();

  if (error) throw error;
  return (data?.ny_slug as string | undefined) ?? null;
}