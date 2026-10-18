import Link from "next/link";

export default function Bund() {
  return (
    <footer className="border-t border-green-200 bg-green-100 px-5 py-6 text-center text-sm text-green-950">
      <nav
        aria-label="Om siden"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2"
      >
        <Link href="/spilleregler" className="underline underline-offset-4">
          Kreative spilleregler
        </Link>
        <Link href="/privatliv" className="underline underline-offset-4">
          Privatliv
        </Link>
      </nav>
    </footer>
  );
}