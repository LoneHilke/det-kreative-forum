import MinSide from "../../components/MinSide";

export default function MinSideSide() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <section className="text-center">
          <span className="text-5xl" aria-hidden="true">
            👤
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Min side</h1>
          <p className="mt-3 text-lg leading-relaxed">
            Her kan kun du se dine egne oplysninger.
          </p>
        </section>
        <MinSide />
      </div>
    </main>
  );
}
