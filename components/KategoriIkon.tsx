import {
  IkonHaeklenaal,
  IkonKniplepind,
  IkonPerleplade,
} from "../data/kategorier";

// Et ikon er enten et emoji eller et af de tre selvtegnede ikoner (starter med @).
export default function KategoriIkon({ ikon }: { ikon: string }) {
  if (ikon === "@haeklenaal") return <IkonHaeklenaal />;
  if (ikon === "@kniplepind") return <IkonKniplepind />;
  if (ikon === "@perleplade") return <IkonPerleplade />;
  return <>{ikon}</>;
}