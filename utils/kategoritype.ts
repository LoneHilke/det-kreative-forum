export type Underkategori = { slug: string; navn: string; ikon: string };

export type Hovedkategori = {
  slug: string;
  navn: string;
  ikon: string;
  intro: string;
  underkategorier: Underkategori[];
};