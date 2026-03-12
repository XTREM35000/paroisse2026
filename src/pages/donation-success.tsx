import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VerifyResponse {
  success?: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

const DonationSuccess: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[DonationSuccess] Mount");
    console.log("[DonationSuccess] Location href:", window.location.href);
    console.log("[DonationSuccess] Location pathname/search:", {
      pathname: location.pathname,
      search: location.search,
    });

    const sId = searchParams.get("session_id");
    console.log("[DonationSuccess] Extracted session_id:", sId);
    setSessionId(sId);

    if (!sId) {
      setError("Session Stripe introuvable dans l'URL.");
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        console.log("[DonationSuccess] Appel de la fonction verify-payment avec:", {
          sessionId: sId,
        });

        const { data, error: fnError } = await supabase.functions.invoke(
          "verify-payment",
          {
            body: { sessionId: sId },
          }
        );

        console.log("[DonationSuccess] Réponse brute verify-payment:", {
          data,
          fnError,
        });

        if (fnError) {
          console.error("[DonationSuccess] Erreur Supabase verify-payment:", fnError);
          setError(
            "Une erreur est survenue lors de la vérification du paiement. Merci de contacter le support si le problème persiste."
          );
          setLoading(false);
          return;
        }

        const payload = data as VerifyResponse | null;
        console.log("[DonationSuccess] Payload parsé:", payload);

        if (!payload) {
          setError("Réponse vide lors de la vérification du paiement.");
          setLoading(false);
          return;
        }

        if (payload.success === false) {
          setStatus(payload.status || "unknown");
          setAmount(payload.amount ?? null);
          setCurrency(payload.currency ?? null);
          setError(
            payload.message ||
              "Le paiement n'a pas encore été confirmé. Si le montant a été débité, le statut sera mis à jour automatiquement."
          );
          setLoading(false);
          return;
        }

        setStatus(payload.status || "paid");
        setAmount(payload.amount ?? null);
        setCurrency(payload.currency ?? null);
        setError(null);
        setLoading(false);
      } catch (e) {
        console.error("[DonationSuccess] Exception lors de verify-payment:", e);
        setError(
          "Impossible de vérifier le paiement pour le moment. Merci de réessayer dans quelques instants."
        );
        setLoading(false);
      }
    };

    verify();
  }, [location.pathname, location.search, searchParams]);

  const renderStatus = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-green-700" />
          <p className="text-gray-700 text-center">
            Vérification de votre don en cours...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
          <p className="text-red-600 text-center max-w-xl">{error}</p>
          {status && (
            <p className="text-sm text-gray-600">
              Statut actuel du don : <span className="font-semibold">{status}</span>
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        <CheckCircle2 className="h-12 w-12 text-green-700" />
        <h2 className="text-2xl md:text-3xl font-bold text-green-800 text-center">
          Merci pour votre don !
        </h2>
        <p className="text-gray-700 text-center max-w-xl">
          Votre contribution nous aide à poursuivre la mission de compassion, de foi
          et de solidarité. Que Dieu vous bénisse abondamment.
        </p>
        {amount != null && currency && (
          <p className="text-lg font-semibold text-green-800">
            Montant confirmé : {amount} {currency}
          </p>
        )}
        {sessionId && (
          <p className="text-xs text-gray-500 break-all mt-2">
            ID de session Stripe : {sessionId}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Don confirmé"
        subtitle="Merci pour votre générosité"
        showBackButton={true}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-8">
          {renderStatus()}

          <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
            <Button asChild className="bg-green-700 hover:bg-green-800">
              <Link to="/donate">Faire un autre don</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationSuccess;