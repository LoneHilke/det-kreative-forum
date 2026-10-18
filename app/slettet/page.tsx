import Link from "next/link";

export default function Slettet() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-md px-5 py-10 text-center">
        <h1 className="text-3xl font-bold">Din bruger er slettet</h1>
        <p className="mt-4 leading-relaxed">
          Dine oplysninger er fjernet. Tak, fordi du var med. Du er velkommen
          tilbage, hvis du får lyst.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          Til forsiden
        </Link>
      </div>
    </main>
  );
}