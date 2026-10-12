import Link from "next/link";

const menupunkter = [
  { navn: "Hjem", ikon: "🏠", link: "/" },
  { navn: "Søg", ikon: "🔎", link: "/soeg" },
  { navn: "Spørg AI", ikon: "✨", link: "/spoerg-ai" },
  { navn: "Gemte idéer", ikon: "❤️", link: "/gemte-ideer" },
  { navn: "Login", ikon: "👤", link: "/login" },
];

export default function Hovedmenu() {
  return (
    <nav
      aria-label="Hovedmenu"
      className="sticky top-0 z-50 border-b border-green-200 bg-green-100/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-1 sm:px-5">
        {menupunkter.map((punkt) => (
          <li key={punkt.navn}>
            <Link
              href={punkt.link}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-2 text-xs font-medium whitespace-nowrap text-green-950 transition hover:bg-green-200 sm:flex-row sm:gap-2 sm:px-3 sm:text-base"
            >
              <span className="text-xl" aria-hidden="true">
                {punkt.ikon}
              </span>
              <span>{punkt.navn}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}