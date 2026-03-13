import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";

type Step = "idle" | "confirming" | "executing" | "done";

interface FactoryResetReport {
  imagesDeleted?: number;
  videosDeleted?: number;
  eventsDeleted?: number;
  donationsDeleted?: number;
  messagesDeleted?: number;
  announcementsDeleted?: number;
  homiliesDeleted?: number;
  prayersDeleted?: number;
  notificationsDeleted?: number;
  commentsDeleted?: number;
  startedAt?: string;
  finishedAt?: string;
}

export function ConfigFactoryReset() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [firstDialogOpen, setFirstDialogOpen] = useState(false);
  const [secondDialogOpen, setSecondDialogOpen] = useState(false);
  const [report, setReport] = useState<FactoryResetReport | null>(null);
  const [executing, setExecuting] = useState(false);

  const startSequence = () => {
    setConfirmText("");
    setStep("confirming");
    setFirstDialogOpen(true);
  };

  const handleFirstConfirm = () => {
    if (confirmText !== "SUPPRIMER TOUT") {
      toast({
        title: "Confirmation invalide",
        description: 'Vous devez taper exactement "SUPPRIMER TOUT" pour continuer.',
        variant: "destructive",
      });
      return;
    }
    setFirstDialogOpen(false);
    setSecondDialogOpen(true);
  };

  const performFactoryReset = async () => {
    setSecondDialogOpen(false);
    setStep("executing");
    setExecuting(true);
    setProgress(5);

    try {
      // 1. Sauvegarde automatique préalable
      setProgress(20);
      const now = new Date();
      const autoName = `Pré-Factory-Reset - ${now.toLocaleString("fr-FR")}`;

      const [homepageRes, headerRes, heroesRes] = await Promise.all([
        supabase.from("homepage_sections").select("*"),
        supabase.from("header_config").select("*").limit(1),
        supabase.from("page_hero_banners").select("*"),
      ]);

      if (homepageRes.error) throw homepageRes.error;
      if (headerRes.error) throw headerRes.error;
      if (heroesRes.error) throw heroesRes.error;

      const payload = {
        homepage_sections: homepageRes.data,
        header_config: headerRes.data,
        page_hero_banners: heroesRes.data,
      };

      const json = JSON.stringify(payload);
      const size = new Blob([json]).size;

      const { error: backupError } = await supabase.from("backups").insert({
        name: autoName,
        description: "Sauvegarde automatique avant Factory Reset",
        data: payload,
        size,
      });

      if (backupError) throw backupError;

      toast({
        title: "Sauvegarde créée",
        description: "Une sauvegarde automatique a été créée avant la réinitialisation.",
      });

      setProgress(50);

      // 2. Appel à l’Edge Function factory-reset
      const { data, error } = await supabase.functions.invoke("factory-reset", {
        body: { dryRun: false },
      });

      if (error) {
        throw error;
      }

      setProgress(90);

      const rep = (data as FactoryResetReport) || null;
      setReport(rep);

      setProgress(100);
      setStep("done");
      setExecuting(false);

      toast({
        title: "Factory Reset terminé",
        description: "Le contenu a été nettoyé. Consultez le rapport pour les détails.",
      });
    } catch (e) {
      console.error("[FactoryReset] Erreur pendant la mise à nu complète:", e);
      setExecuting(false);
      setStep("idle");
      setProgress(0);
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue pendant la mise à nu complète. Vérifiez la console et les Edge Functions.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Mise à nu complète (Factory Reset)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Cette opération supprime tout le contenu non essentiel (médias, dons,
            événements, messages, etc.) pour repartir sur un environnement vierge,
            prêt pour une nouvelle paroisse. Une sauvegarde complète est créée
            automatiquement avant l’exécution.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Les comptes utilisateurs et les rôles sont conservés.</li>
              <li>
                Les médias (images, vidéos), dons, événements, messages, annonces
                et contenus pastoraux sont supprimés.
              </li>
              <li>
                Utilisez cette fonction uniquement pour préparer un nouveau site
                de paroisse.
              </li>
            </ul>

            {step === "executing" && (
              <div className="space-y-2">
                <p className="font-medium">Traitement en cours…</p>
                <Progress value={progress} />
              </div>
            )}

            {step === "done" && report && (
              <div className="mt-4 border border-green-200 bg-green-50 text-green-900 rounded-md p-3 text-xs space-y-1">
                <p className="font-semibold mb-1">Rapport de suppression</p>
                {report.imagesDeleted != null && (
                  <p>Images supprimées : {report.imagesDeleted}</p>
                )}
                {report.videosDeleted != null && (
                  <p>Vidéos supprimées : {report.videosDeleted}</p>
                )}
                {report.eventsDeleted != null && (
                  <p>Événements supprimés : {report.eventsDeleted}</p>
                )}
                {report.donationsDeleted != null && (
                  <p>Dons supprimés : {report.donationsDeleted}</p>
                )}
                {report.messagesDeleted != null && (
                  <p>Messages supprimés : {report.messagesDeleted}</p>
                )}
                {report.announcementsDeleted != null && (
                  <p>Annonces supprimées : {report.announcementsDeleted}</p>
                )}
                {report.homiliesDeleted != null && (
                  <p>Homélies supprimées : {report.homiliesDeleted}</p>
                )}
                {report.prayersDeleted != null && (
                  <p>Intentions de prière supprimées : {report.prayersDeleted}</p>
                )}
                {report.notificationsDeleted != null && (
                  <p>Notifications supprimées : {report.notificationsDeleted}</p>
                )}
                {report.commentsDeleted != null && (
                  <p>Commentaires supprimés : {report.commentsDeleted}</p>
                )}
              </div>
            )}

            <Button
              variant="destructive"
              className="mt-2"
              onClick={startSequence}
              disabled={executing}
            >
              🧨 Hot Suppression Environnement
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Première confirmation */}
      <AlertDialog open={firstDialogOpen} onOpenChange={setFirstDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Êtes-vous absolument sûr ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est <strong>IRRÉVERSIBLE</strong>. Tout le contenu
              non essentiel sera supprimé. Pour confirmer, tapez{" "}
              <code className="font-mono">SUPPRIMER TOUT</code> ci-dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER TOUT"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dernière confirmation */}
      <AlertDialog open={secondDialogOpen} onOpenChange={setSecondDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dernière confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Une sauvegarde automatique sera créée juste avant la suppression.
              Confirmez-vous lancer la mise à nu complète de l’environnement ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performFactoryReset}>
              Oui, lancer le Factory Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

