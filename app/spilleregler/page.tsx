import Link from "next/link";

export default function Spilleregler() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/" className="font-medium underline underline-offset-4">
          ← Tilbage til forsiden
        </Link>

        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">
          Vores kreative spilleregler
        </h1>
        <p className="mt-4 text-lg leading-relaxed">
          Her er det, vi har sammen: lysten til at lave ting med hænderne og
          dele det med andre. Et par enkle aftaler hjælper os med at holde
          stedet hyggeligt.
        </p>

        <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">🎨 Det handler om kreative projekter</h2>
          <p className="mt-2 leading-relaxed">
            Her er der plads til mindre kreative projekter, håndarbejde, kunst
            og dekoration. En flot pyntet kage hører til, og det gør
            ansigtsmaling også.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">🍰 Det, der hører til andre steder</h2>
          <p className="mt-2 leading-relaxed">
            Almindelige bageopskrifter, møbelrenovering, store haveprojekter og
            almindelig makeup er ikke det, vi samles om her. Er det
            dekorationen og kreativiteten, der er det spændende, er det
            velkomment.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">💬 Vi taler pænt til hinanden</h2>
          <p className="mt-2 leading-relaxed">
            Vi stiller spørgsmål, hjælper hinanden og glæder os over andres
            projekter. Kommentarer handler om det opslag, de står under.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">🖼️ Billeder og ansigter</h2>
          <p className="mt-2 leading-relaxed">
            Ansigter vises kun, når det er ansigtsmaling, der er pointen med
            billedet. Når man viser et projekt, der er lavet sammen med et
            barn, vælger man selv, om barnets navn skrives.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">👀 Alle kan se det, du deler</h2>
          <p className="mt-2 leading-relaxed">
            Opslag, kommentarer og dit navn kan ses af alle på internettet,
            også uden login, og kan dukke op i søgemaskiner som Google.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">🚩 Hvis noget ikke passer</h2>
          <p className="mt-2 leading-relaxed">
            Er der noget, der ikke hører hjemme, kan man anmelde det.
            Ophavspersonen får først mulighed for selv at rette eller fjerne
            det, og hvis det ikke sker, kan administrator gribe ind.
          </p>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
          <h2 className="text-xl font-semibold">🔞 For voksne</h2>
          <p className="mt-2 leading-relaxed">
            Man skal være mindst 18 år for at oprette en bruger. Projekter, der
            er gode at lave sammen med børn, er markeret, men børnene er ikke
            selv brugere.
          </p>
        </section>
      </div>
    </main>
  );
}