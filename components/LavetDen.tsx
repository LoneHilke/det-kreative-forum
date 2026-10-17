"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";
import { BILLED_BUCKET, uploadEnkeltBillede } from "../utils/billede";
import BilledVaelger from "./BilledVaelger";

type MitBidrag = { id: string; sti: string | null };

export default function LavetDen({ opslagId }: { opslagId: string }) {
  const router = useRouter();
  const [klar, setKlar] = useState(false);
  const [antal, setAntal] = useState(0);
  const [loggetInd, setLoggetInd] = useState(false);
  const [brugerId, setBrugerId] = useState<string | null>(null);
  const [mit, setMit] = useState<MitBidrag | null>(null);
  const [aaben, setAaben] = useState(false);
  const [tekst, setTekst] = useState("");
  const [billede, setBillede] = useState<File[]>([]);
  const [arbejder, setArbejder] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);

  const hent = useCallback(async () => {
    try {
      const supabase = createClient();

      const { data: tal, error: talFejl } = await supabase.rpc("lavet_antal", {
        p_opslag_id: opslagId,
      });
      if (talFejl) throw talFejl;
      setAntal(Number(tal ?? 0));

      const { data: session } = await supabase.auth.getSession();
      const bruger = session.session?.user;
      setLoggetInd(!!bruger);
      setBrugerId(bruger?.id ?? null);

      if (bruger) {
        const { data: egne, error: egneFejl } = await supabase
          .from("har_lavet_den")
          .select("id, sti")
          .eq("opslag_id", opslagId)
          .eq("bruger_id", bruger.id)
          .maybeSingle();
        if (egneFejl) throw egneFejl;
        setMit(
          egne
            ? { id: egne.id as string, sti: (egne.sti as string | null) ?? null }
            : null
        );
      } else {
        setMit(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKlar(true);
    }
  }, [opslagId]);

  useEffect(() => {
    hent();
  }, [hent]);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!brugerId) return;

    setArbejder(true);
    setFejl(null);
    let sti: string | null = null;
    const supabase = createClient();

    try {
      if (billede.length > 0) {
        sti = await uploadEnkeltBillede(supabase, brugerId, opslagId, billede[0]);
      }

      const { error } = await supabase
        .from("har_lavet_den")
        .insert({ opslag_id: opslagId, tekst: tekst.trim(), sti });

      if (error) {
        if (sti) await supabase.storage.from(BILLED_BUCKET).remove([sti]);
        if (error.code === "23505") {
          setFejl("Du har allerede sagt, at du har lavet den.");
        } else {
          console.error(error);
          setFejl("Det lykkedes ikke. Prøv igen om lidt.");
        }
        return;
      }

      setAaben(false);
      setTekst("");
      setBillede([]);
      await hent();
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl(
        "Billedet kunne ikke lægges op. Prøv et andet billede, eller send uden."
      );
    } finally {
      setArbejder(false);
    }
  }

  async function fjern() {
    if (!mit) return;
    if (!window.confirm("Vil du fjerne dit bidrag?")) return;

    setArbejder(true);
    setFejl(null);
    try {
      const supabase = createClient();

      if (mit.sti) {
        const { error: filFejl } = await supabase.storage
          .from(BILLED_BUCKET)
          .remove([mit.sti]);
        if (filFejl) {
          console.error(filFejl);
          setFejl("Billedet kunne ikke fjernes. Prøv igen om lidt.");
          return;
        }
      }

      const { error } = await supabase
        .from("har_lavet_den")
        .delete()
        .eq("id", mit.id);
      if (error) {
        console.error(error);
        setFejl("Det lykkedes ikke at fjerne dit bidrag. Prøv igen om lidt.");
        return;
      }

      await hent();
      router.refresh();
    } catch (err) {
      console.error(err);
      setFejl("Noget gik galt hos os, ikke hos dig. Prøv igen om lidt.");
    } finally {
      setArbejder(false);
    }
  }

  if (!klar) return null;

  const antalTekst =
    antal === 0
      ? "Ingen har sagt, at de har lavet denne idé endnu."
      : antal === 1
        ? "1 har lavet denne idé."
        : `${antal} har lavet denne idé.`;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-green-200">
      <h2 className="text-xl font-bold">🙋 Har du lavet den?</h2>
      <p className="mt-1">{antalTekst}</p>

      {!loggetInd && (
        <p className="mt-3">
          <Link href="/login" className="font-medium underline underline-offset-4">
            Log ind
          </Link>{" "}
          for at sige, at du har lavet den.
        </p>
      )}

      {loggetInd && mit && (
        <div className="mt-3">
          <p>✅ Du har lavet den.</p>
          <button
            type="button"
            onClick={fjern}
            disabled={arbejder}
            className="mt-2 text-sm underline underline-offset-4 disabled:opacity-60"
          >
            {arbejder ? "Fjerner..." : "Fjern mit bidrag"}
          </button>
        </div>
      )}

      {loggetInd && !mit && !aaben && (
        <button
          type="button"
          onClick={() => setAaben(true)}
          className="mt-3 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
        >
          🙋 Jeg har lavet den
        </button>
      )}

      {loggetInd && !mit && aaben && (
        <form onSubmit={send} className="mt-4 space-y-4">
          <p className="text-sm text-green-900">
            Du kan dele din egen version, så andre kan se forskellige
            fortolkninger, men du behøver ikke. Du kan også bare sige, at du har
            lavet den.
          </p>

          <div>
            <label htmlFor="bidrag-tekst" className="block font-medium">
              Skriv lidt om din version (valgfrit)
            </label>
            <textarea
              id="bidrag-tekst"
              rows={4}
              maxLength={2000}
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              className="mt-1 w-full rounded-xl border border-green-300 bg-white px-4 py-3 text-base"
            />
          </div>

          <BilledVaelger
            filer={billede}
            onAendr={setBillede}
            maks={1}
            titel="Billede af din version (valgfrit, ét billede)"
          />

          <p className="rounded-xl bg-green-100 p-3 text-sm leading-relaxed">
            Husk: Hvis det oprindelige opslag bliver slettet, bliver dit bidrag
            også slettet. Gem derfor gerne dit billede selv, så du kan lægge det
            op igen.
          </p>

          {fejl && (
            <p className="rounded-xl bg-red-50 p-3 text-red-900" role="alert">
              {fejl}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={arbejder}
              className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {arbejder ? "Sender..." : "Jeg har lavet den"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAaben(false);
                setFejl(null);
              }}
              className="rounded-xl bg-green-100 px-5 py-3 font-semibold hover:bg-green-200"
            >
              Annuller
            </button>
          </div>
        </form>
      )}

      {fejl && !aaben && (
        <p className="mt-3 text-red-900" role="alert">
          {fejl}
        </p>
      )}
    </section>
  );
}