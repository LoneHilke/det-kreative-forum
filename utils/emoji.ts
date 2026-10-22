// Er teksten præcis ét emoji? (Ikke bogstaver, tal eller flere tegn)
export function erEtEmoji(tekst: string): boolean {
  const t = tekst.trim();
  if (!t || t.length > 20) return false;
  if (/[\p{L}\p{N}@<>&\s]/u.test(t)) return false;
  if (!/\p{Extended_Pictographic}/u.test(t)) return false;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("da", { granularity: "grapheme" });
    return [...segmenter.segment(t)].length === 1;
  }
  return [...t].length <= 12;
}