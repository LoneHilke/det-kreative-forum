import Link from "next/link";
import {
  ANSVARLIG_NAVN,
  KONTAKT_EMAIL,
  SIDEN_NAVN,
} from "../../data/kontakt";

function Afsnit({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl bg-white p-6 ring-1 ring-green-200">
      <h2 className="text-xl font-semibold">{titel}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Privatliv() {
  return (
    <main className="min-h-screen bg-green-50 text-green-950">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/" className="font-medium underline underline-offset-4">
          ← Tilbage til forsiden
        </Link>

        <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Privatlivspolitik</h1>
        <p className="mt-4 text-lg leading-relaxed">
          Her kan du læse, hvilke oplysninger {SIDEN_NAVN} gemmer om dig, hvorfor,
          og hvad du selv kan gøre. Sidst opdateret: oktober 2026.
        </p>

        <Afsnit titel="Hvem er ansvarlig?">
          <p>
            {SIDEN_NAVN} drives af {ANSVARLIG_NAVN}. Det er den, der bestemmer,
            hvordan dine oplysninger bruges.
          </p>
          <p>
            Du kan kontakte os på{" "}
            <a
              href={`mailto:${KONTAKT_EMAIL}`}
              className="underline underline-offset-4"
            >
              {KONTAKT_EMAIL}
            </a>
            .
          </p>
        </Afsnit>

        <Afsnit titel="Hvilke oplysninger gemmer vi?">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Din e-mail.</strong> Bruges til at sende dig et login-link
              og til at kontakte dig, hvis noget af dit indhold bliver anmeldt.
              Den vises aldrig for andre brugere.
            </li>
            <li>
              <strong>Dit navn.</strong> Vises ved de opslag, kommentarer og
              &quot;Jeg har lavet den&quot;-bidrag, du skriver.
            </li>
            <li>
              <strong>Det, du lægger op:</strong> opslag, billeder, kommentarer,
              reaktioner, bidrag og de idéer, du har gemt. Dine gemte idéer og
              reaktioner kan kun du se.
            </li>
            <li>
              <strong>Anmeldelser,</strong> du selv sender, og årsagen du skriver.
            </li>
            <li>
              <strong>Tekniske oplysninger,</strong> fx din IP-adresse, som vores
              tjenesteudbydere kan registrere, når du bruger siden.
            </li>
          </ul>
          <p>
            <strong>Din fødselsdato</strong> bruger vi kun, når du opretter dig,
            til at tjekke, at du er mindst 18 år. Den sendes ikke videre og bliver
            ikke gemt.
          </p>
        </Afsnit>

        <Afsnit titel="Hvad bruger vi oplysningerne til?">
          <p>
            Til at give dig en bruger, vise dit indhold, behandle anmeldelser,
            holde siden ordentlig og sikker og kontakte dig om dit indhold.
          </p>
          <p>
            Vi behandler dine oplysninger, fordi det er nødvendigt for at give dig
            en bruger (databeskyttelsesforordningens artikel 6, stk. 1, litra b),
            og for at kunne håndtere anmeldelser og sikre, at siden bruges
            ordentligt (artikel 6, stk. 1, litra f).
          </p>
        </Afsnit>

        <Afsnit titel="Hvem kan se det, du deler?">
          <p>
            <strong>Alle på internettet,</strong> også uden login. Opslag,
            billeder, kommentarer, bidrag og dit navn kan ses af alle og kan
            dukke op i søgemaskiner som Google.
          </p>
          <p>
            Skriver du selv din adresse, e-mail, dit telefonnummer eller andre
            private oplysninger i et opslag, en kommentar eller et billede, er
            det på eget ansvar. Det kan ses af alle, og vi kan ikke trække det
            tilbage fra andre, der har set eller gemt det.
          </p>
          <p>
            Billeder gøres mindre, før de lægges op, og skjulte oplysninger som
            placering fjernes. Vis kun ansigter, når det er ansigtsmaling, der er
            pointen.
          </p>
        </Afsnit>

        <Afsnit titel="Hvem hjælper os med at drive siden?">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> gemmer brugere, opslag og billeder. Data
              er placeret i Frankfurt (EU).
            </li>
            <li>
              <strong>Vercel</strong> (USA) viser siden. Den del af siden, der
              kører på server, er indstillet til Frankfurt, men noget af Vercels
              net kan behandle tekniske oplysninger andre steder, herunder USA.
            </li>
            <li>
              <strong>Simply.com</strong> sender de e-mails, du får fra siden, fx
              login-links.
            </li>
          </ul>
          <p>
            Når oplysninger sendes uden for EU, sker det efter EU&apos;s
            standardkontraktbestemmelser eller tilsvarende. Vi sælger ikke dine
            oplysninger og bruger dem ikke til reklamer.
          </p>
        </Afsnit>

        <Afsnit titel="Cookies">
          <p>
            Vi bruger kun de cookies, der er nødvendige for at holde dig logget
            ind. Vi bruger ingen cookies til statistik, sporing eller reklamer.
          </p>
        </Afsnit>

        <Afsnit titel="Hvor længe gemmer vi oplysningerne?">
          <p>
            Så længe du har en bruger. Du kan altid slette den selv på{" "}
            <Link href="/min-side" className="underline underline-offset-4">
              Min side
            </Link>
            . Når du sletter:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Dine opslag og billeder, reaktioner, gemte idéer og dine egne
              &quot;Jeg har lavet den&quot;-bidrag bliver slettet. Bliver et opslag
              slettet, forsvinder også de kommentarer og bidrag, andre har lagt
              under det.
            </li>
            <li>
              Dine kommentarer på andres opslag bliver stående uden dit navn, så
              samtalerne ikke går i stykker. Der står &quot;Slettet bruger&quot;.
              Har du selv skrevet noget i en kommentar, der kan afsløre, hvem du
              er, står det stadig. Skriv derfor ikke private oplysninger.
            </li>
            <li>Dit navn og din e-mail bliver slettet.</li>
          </ul>
          <p>
            Mails om anmeldelser opbevares kun, så længe det er nødvendigt for at
            behandle sagen.
          </p>
        </Afsnit>

        <Afsnit titel="Dine rettigheder">
          <p>
            Du har ret til at få oplyst, hvad vi gemmer om dig, få rettet
            forkerte oplysninger (fx dit navn), få dine oplysninger slettet,
            begrænse eller gøre indsigelse mod vores brug af dem og få dine
            oplysninger udleveret. Skriv til{" "}
            <a
              href={`mailto:${KONTAKT_EMAIL}`}
              className="underline underline-offset-4"
            >
              {KONTAKT_EMAIL}
            </a>
            , så svarer vi.
          </p>
          <p>
            Du kan klage til Datatilsynet (datatilsynet.dk), hvis du mener, vi
            behandler dine oplysninger forkert.
          </p>
        </Afsnit>

        <Afsnit titel="Kun for voksne">
          <p>
            Man skal være mindst 18 år for at oprette en bruger. Børn er ikke
            brugere. Projekter, der kan laves sammen med et barn, er markeret
            &quot;God med børn&quot;, men vi vil helst ikke have billeder, der
            viser børns ansigter, medmindre det er ansigtsmaling.
          </p>
        </Afsnit>

        <Afsnit titel="Ændringer">
          <p>
            Hvis vi ændrer måden, vi bruger oplysninger på, opdaterer vi denne
            side.
          </p>
        </Afsnit>
      </div>
    </main>
  );
}