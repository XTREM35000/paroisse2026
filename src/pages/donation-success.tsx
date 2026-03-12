import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DonationStatus = "loading" | "success" | "error";

export default function DonationSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DonationStatus>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Empêche toute navigation automatique pendant l'affichage du succès/erreur
  useEffect(() => {
    const blockNavigation = (e: Event) => {
      e.preventDefault();
      (e as unknown as { returnValue?: boolean }).returnValue = false;
      return false;
    };
    window.addEventListener('beforeunload', blockNavigation);
    window.addEventListener('popstate', blockNavigation);
    return () => {
      window.removeEventListener('beforeunload', blockNavigation);
      window.removeEventListener('popstate', blockNavigation);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("Session de paiement manquante.");
      return;
    }

    let cancelled = false;

    const fetchDonation = async () => {
      try {
        // @ts-expect-error - Problème de typage récursif avec Supabase
        const { data, error } = await supabase
          .from("donations")
          .select("payment_status, amount")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (cancelled) return;
        
        if (error || !data) {
          setStatus("error");
          setErrorMsg("Aucune information de don trouvée.");
          return;
        }

        // Les statuts possibles sont "pending", "completed", "failed", "cancelled"
        const isCompleted = data?.payment_status === "completed";
        const isPending = data?.payment_status === "pending";
        const isFailed = data?.payment_status === "failed" || data?.payment_status === "cancelled";

        if (isCompleted) {
          setAmount(data.amount ?? null);
          setStatus("success");
          setShowSuccessDialog(true);
        } else if (isPending) {
          setStatus("loading");
          pollingRef.current = setTimeout(fetchDonation, 3000);
        } else if (isFailed) {
          setStatus("error");
          setErrorMsg("Paiement non effectué.");
          setShowErrorDialog(true);
        } else {
          setStatus("error");
          setErrorMsg(`Statut de paiement inconnu: ${data.payment_status}`);
          setShowErrorDialog(true);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("Erreur lors de la vérification du paiement.");
        setShowErrorDialog(true);
      }
    };

    fetchDonation();
    return () => {
      cancelled = true;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  // ✅ CORRECTION : Fonction de navigation vers /donate
  const goToDonatePage = () => {
    setShowSuccessDialog(false);
    setShowErrorDialog(false);
    setShowExitConfirm(false);
    navigate("/donate");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSeeDetails = () => {
    setShowSuccessDialog(false);
    navigate("/donations/history");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl bg-white/90 backdrop-blur-sm border border-white/20 flex flex-col items-center transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
        
        {/* État CHARGEMENT */}
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-6 animate-fadeIn">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl animate-pulse">⏳</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Vérification en cours
              </p>
              <p className="text-gray-600 animate-pulse">
                Un instant, nous confirmons votre don...
              </p>
            </div>
          </div>
        )}

        {/* Dialog de SUCCÈS */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-green-600 flex items-center justify-center gap-2">
                <span className="text-4xl">🎉</span>
                Don confirmé !
              </DialogTitle>
              <DialogDescription className="text-center pt-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <p className="text-lg text-gray-700 mb-2">Votre don de</p>
                  <p className="text-3xl font-bold text-green-700 mb-2">
                    {amount?.toLocaleString()} FCFA
                  </p>
                  <p className="text-green-600">a été traité avec succès</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2">
              <Button
                onClick={handleSeeDetails}
                variant="outline"
                className="border-2 border-green-200 hover:border-green-300"
              >
                Voir l'historique
              </Button>
              <Button
                onClick={goToDonatePage}  // ✅ CORRECTION
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Retour aux dons
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'ERREUR */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center text-red-600 flex items-center justify-center gap-2">
                <span className="text-4xl">😔</span>
                Paiement non abouti
              </DialogTitle>
              <DialogDescription className="text-center pt-4">
                <div className="bg-red-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4">
                    {errorMsg || "Une erreur est survenue lors du traitement de votre don."}
                  </p>
                  <div className="bg-white/50 p-4 rounded-lg text-sm text-gray-600">
                    <p>💡 Suggestions :</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>Vérifiez votre connexion internet</li>
                      <li>Assurez-vous que votre carte est valide</li>
                      <li>Contactez votre banque si le problème persiste</li>
                    </ul>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center gap-2 flex-col sm:flex-row">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-2 border-red-200 hover:border-red-300"
              >
                <span className="mr-2">🔄</span>
                Rafraîchir
              </Button>
              <Button
                onClick={goToDonatePage}  // ✅ CORRECTION
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <span className="mr-2">💝</span>
                Nouveau don
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de CONFIRMATION DE SORTIE */}
        <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                Quitter la page ?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-4">
                <p>
                  Êtes-vous sûr de vouloir quitter cette page ?
                </p>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>
                      <strong>Information importante :</strong><br />
                      Vous pourrez toujours vérifier le statut de votre don dans votre historique ou par email.
                    </span>
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-2 border-gray-200">
                Continuer sur cette page
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={goToDonatePage}  // ✅ CORRECTION
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Quitter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bouton de sortie (optionnel) */}
        {status !== "loading" && (
          <Button
            variant="ghost"
            onClick={handleExit}
            className="mt-6 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="mr-2">←</span>
            Retour à l'accueil
          </Button>
        )}
      </div>
    </div>
  );
}