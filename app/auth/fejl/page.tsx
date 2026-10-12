import Link from "next/link";

export default function LinkFejl() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-md px-5 py-10 text-center">
        <h1 className="text-3xl font-bold">Linket virkede ikke</h1>
        <p className="mt-4 leading-relaxed">
          Linket kan være udløbet eller allerede brugt. Et link virker kun i en
          time og kun én gang. Prøv at få et nyt.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          Få et nyt link
        </Link>
      </div>
    </main>
  );
}