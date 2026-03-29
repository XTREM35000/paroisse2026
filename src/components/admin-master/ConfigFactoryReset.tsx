import { useEffect, useState } from "react";
import { Skull, RefreshCw, Upload } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { performFullCleanup } from '@/lib/cleanup';
import { useQueryClient } from "@tanstack/react-query";
import { RestoreFromFileModal } from "./RestoreFromFileModal";
import { fetchBackups as fetchBackupsQuery, deleteBackup as deleteBackupQuery, BackupRow } from '@/lib/supabase/backupQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash, Download, Eye } from 'lucide-react';

type Step = "idle" | "first" | "second" | "third" | "executing" | "done";

export interface ConfigFactoryResetProps {
  onFactoryResetComplete?: (result: { launchSetupWizard?: boolean }) => void;
}

export function ConfigFactoryReset({ onFactoryResetComplete }: ConfigFactoryResetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("idle");
  const [confirm1Open, setConfirm1Open] = useState(false);
  const [confirm2Open, setConfirm2Open] = useState(false);
  const [confirm3Open, setConfirm3Open] = useState(false);
  const [textConfirm, setTextConfirm] = useState("");
  const [resetOptions, setResetOptions] = useState({
    keepSuperAdmin: true,
    superAdminEmail: "compassionnotredame5@gmail.com",
    deleteAllUsers: false,
    skipBackup: false,
    launchSetupWizard: true,
  });
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [systemBackups, setSystemBackups] = useState<BackupRow[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BackupRow | null>(null);
  const [rpcCleanAck, setRpcCleanAck] = useState(false);
  const [rpcCleanBusy, setRpcCleanBusy] = useState(false);
  const [rpcCleanConfirmOpen, setRpcCleanConfirmOpen] = useState(false);

  useEffect(() => {
    void loadSystemBackups();
  }, []);

  const loadSystemBackups = async () => {
    setLoadingBackups(true);
    try {
      const data = await fetchBackupsQuery('full');
      setSystemBackups(data || []);
    } catch (e) {
      console.error('[FactoryReset] Erreur chargement backups système:', e);
    } finally {
      setLoadingBackups(false);
    }
  };

  const requestDelete = (b: BackupRow) => {
    setDeleteTarget(b);
    setDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setDeleteDialogOpen(false);
    try {
      const res = await deleteBackupQuery(deleteTarget.id);
      if (res.deleted) {
        // refresh list
        await loadSystemBackups();
        toast({ title: 'Sauvegarde système supprimée' });
      } else if (res.reason === 'latest') {
        toast({ title: 'Action refusée', description: "Impossible de supprimer la dernière sauvegarde système.", variant: 'destructive' });
      }
    } catch (e) {
      console.error('[FactoryReset] Erreur suppression backup système:', e);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la sauvegarde système.', variant: 'destructive' });
    }
  };

  const startSequence = () => {
    setStep("first");
    setConfirm1Open(true);
  };

  const handleFirstConfirm = () => {
    setConfirm1Open(false);
    setStep("second");
    setConfirm2Open(true);
  };

  const handleSecondConfirm = () => {
    if (textConfirm !== "FACTORY RESET") {
      toast({
        title: "Confirmation invalide",
        description:
          'Vous devez taper exactement "FACTORY RESET" pour continuer.',
        variant: "destructive",
      });
      return;
    }
    setConfirm2Open(false);
    setStep("third");
    setConfirm3Open(true);
  };

  const performFactoryReset = async () => {
    setConfirm3Open(false);
    setExecuting(true);
    setStep("executing");
    setProgress(10);

    try {
      if (!resetOptions.skipBackup) {
        setProgress(35);
        const { data: backupData, error: backupError } =
          await supabase.functions.invoke("backup-full", {
            body: {},
          });
        if (backupError) throw backupError;

        const backupId = (backupData as any)?.backup?.id;

        toast({
          title: "Sauvegarde ultime créée",
          description:
            backupId != null
              ? `Backup ID: ${backupId}`
              : "Une sauvegarde complète (DB + fichiers) a été créée.",
        });
      } else {
        setProgress(35);
      }

      setProgress(65);

      const { data, error } = await supabase.functions.invoke(
        "factory-reset",
        {
          body: {
            keepSuperAdmin: resetOptions.keepSuperAdmin,
            superAdminEmail: resetOptions.keepSuperAdmin
              ? resetOptions.superAdminEmail || null
              : null,
            deleteAllUsers: resetOptions.deleteAllUsers,
            skipBackup: resetOptions.skipBackup,
            launchSetupWizard: resetOptions.launchSetupWizard,
          },
        }
      );

      if (error) throw error;

      setProgress(95);
      const payload = data as any;
      const launchSetupWizard = payload?.launchSetupWizard === true && !payload?.dryRun;

      toast({
        title: "Factory Reset terminé",
        description:
          payload && payload.finishedAt
            ? `Terminé à ${new Date(
                payload.finishedAt
              ).toLocaleString("fr-FR")}`
            : "Le site a été remis à nu. Vous pouvez maintenant le reconfigurer pour une nouvelle paroisse.",
      });

      setProgress(100);
      setStep("done");

      if (launchSetupWizard) {
        onFactoryResetComplete?.({ launchSetupWizard: true });
      }
    } catch (e) {
      console.error("[FactoryReset] Erreur pendant la mise à nu complète:", e);
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue pendant le Factory Reset. Vérifiez les logs des Edge Functions.",
        variant: "destructive",
      });
      setStep("idle");
      setProgress(0);
    } finally {
      setExecuting(false);
    }
  };

  const runRpcFullClean = async () => {
    if (!rpcCleanAck) {
      toast({
        title: "Confirmation requise",
        description: "Cochez la case pour confirmer que vous acceptez d’effacer les données.",
        variant: "destructive",
      });
      return;
    }
    setRpcCleanConfirmOpen(true);
  };

  const executeRpcFullClean = async () => {
    setRpcCleanConfirmOpen(false);
    setRpcCleanBusy(true);
    try {
      toast({
        title: "Nettoyage en cours",
        description: "Réinitialisation de la base et recréation du compte développeur, puis redirection.",
      });
      onFactoryResetComplete?.({ launchSetupWizard: true });
      void queryClient.clear();
      await performFullCleanup();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "Échec du nettoyage RPC",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setRpcCleanBusy(false);
    }
  };

  return (
    <>
      <Card className="border-amber-300 mb-6">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center gap-2">
            Nettoyage base (RPC)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Même opération que le bouton <strong>CLEAN</strong> du SetupWizard : appelle{" "}
            <code className="text-xs bg-muted px-1 rounded">clean_all_data</code> puis, si besoin,{" "}
            <code className="text-xs bg-muted px-1 rounded">reset_all_data</code>. N’utilise pas l’edge
            function « factory-reset » (sauvegarde + stockage).
          </p>
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
            <Checkbox
              id="rpc-clean-ack"
              checked={rpcCleanAck}
              onCheckedChange={(c) => setRpcCleanAck(c === true)}
            />
            <label htmlFor="rpc-clean-ack" className="text-sm leading-snug cursor-pointer">
              Je comprends que les données métier en base seront supprimées selon la logique serveur
              (comptes protégés selon la configuration Supabase).
            </label>
          </div>
          <Button
            type="button"
            variant="destructive"
            disabled={!rpcCleanAck || rpcCleanBusy}
            onClick={() => void runRpcFullClean()}
            className="gap-2"
          >
            {rpcCleanBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Nettoyage RPC (base de données)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Skull className="h-5 w-5" />
            🏭 MISE À NU COMPLÈTE – FACTORY RESET
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Cette opération supprime <span className="font-semibold">tout</span>{" "}
            le contenu du site (médias, dons, événements, messages, annonces,
            homélies, etc.) et vide les principaux buckets de stockage pour
            repartir sur une base vierge, prête pour une{" "}
            <span className="font-semibold">nouvelle paroisse</span>.
          </p>

          <div className="space-y-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-900 font-semibold">
              Ce qui est conservé :
            </p>
            <ul className="text-xs text-red-900/80 list-disc list-inside space-y-1">
              {resetOptions.deleteAllUsers ? (
                <li>
                  Un seul super_admin (celui indiqué), tous les autres utilisateurs
                  sont supprimés.
                </li>
              ) : (
                <li>Comptes utilisateurs et rôles (dont les super_admin).</li>
              )}
              <li>Structure des tables et configuration technique Supabase.</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    Garder un super_admin
                    <Switch
                      checked={resetOptions.keepSuperAdmin}
                      onCheckedChange={(checked) =>
                        setResetOptions((o) => ({ ...o, keepSuperAdmin: checked }))
                      }
                    />
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Recommandé : permet de garder un compte maître après le reset.
                  </p>
                </div>
                {resetOptions.keepSuperAdmin && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">
                      Email du super_admin à garder
                    </Label>
                    <Input
                      type="email"
                      value={resetOptions.superAdminEmail}
                      onChange={(e) =>
                        setResetOptions((o) => ({
                          ...o,
                          superAdminEmail: e.target.value,
                        }))
                      }
                      placeholder="ex: admin@paroisse-ci.org"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Laissez vide pour conserver tous les super_admin existants.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Supprimer tous les autres utilisateurs
                  <Switch
                    checked={resetOptions.deleteAllUsers}
                    onCheckedChange={(checked) =>
                      setResetOptions((o) => ({ ...o, deleteAllUsers: checked }))
                    }
                  />
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Si activé, seuls le ou les super_admin conservés restent.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Ignorer la sauvegarde avant reset
                  <Switch
                    checked={resetOptions.skipBackup}
                    onCheckedChange={(checked) =>
                      setResetOptions((o) => ({ ...o, skipBackup: checked }))
                    }
                  />
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Déconseillé : pas de sauvegarde ultime avant la mise à nu.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Lancer l'assistant de configuration après reset
                  <Switch
                    checked={resetOptions.launchSetupWizard}
                    onCheckedChange={(checked) =>
                      setResetOptions((o) => ({ ...o, launchSetupWizard: checked }))
                    }
                  />
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Ouvre le SetupWizard à la fin pour reconfigurer la paroisse.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowRestoreModal(true)}
                disabled={executing}
              >
                <Upload className="h-4 w-4" />
                Restaurer une sauvegarde
              </Button>
              <Button
                variant="destructive"
                className="font-semibold flex items-center gap-2"
                onClick={startSequence}
                disabled={executing}
              >
                🧨 Lancer la mise à nu complète
              </Button>
            </div>
          </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>Sauvegardes système (Factory backups)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBackups ? (
              <p className="text-sm text-muted-foreground">Chargement des sauvegardes système...</p>
            ) : systemBackups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune sauvegarde système trouvée.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemBackups.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name || 'Sauvegarde système'}</TableCell>
                        <TableCell>{new Date(b.created_at).toLocaleString('fr-FR')}</TableCell>
                        <TableCell>{b.size != null ? (b.size > 1024 * 1024 ? `${(b.size / 1024 / 1024).toFixed(1)} Mo` : `${(b.size / 1024).toFixed(1)} Ko`) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { const blob = new Blob([JSON.stringify(b.data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${(b.name || 'backup')}_${b.id}.json`; a.click(); URL.revokeObjectURL(url); }}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { /* preview could be implemented */ }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => requestDelete(b)}>
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

          {step === "executing" && (
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Factory Reset en cours…
              </p>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Étape 1 */}
      <AlertDialog open={confirm1Open} onOpenChange={setConfirm1Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de lancer un{" "}
              <span className="font-semibold">Factory Reset complet</span>. Cette
              action est <strong>irréversible</strong> pour toutes les données
              effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Étape 2 */}
      <AlertDialog open={confirm2Open} onOpenChange={setConfirm2Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation renforcée</AlertDialogTitle>
            <AlertDialogDescription>
              Pour confirmer, tapez{" "}
              <code className="font-mono text-xs">FACTORY RESET</code> ci‑dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={textConfirm}
              onChange={(e) => setTextConfirm(e.target.value)}
              placeholder="FACTORY RESET"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSecondConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Étape 3 */}
      <AlertDialog open={confirm3Open} onOpenChange={setConfirm3Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dernière confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              {resetOptions.skipBackup ? (
                <>Le Factory Reset sera lancé sans sauvegarde préalable.</>
              ) : (
                <>
                  Une <span className="font-semibold">sauvegarde ultime</span> va
                  être créée (DB + fichiers) juste avant la mise à nu complète.
                </>
              )}{" "}
              Confirmez‑vous vouloir lancer définitivement le Factory Reset ?
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

      <RestoreFromFileModal
        open={showRestoreModal}
        onOpenChange={setShowRestoreModal}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez‑vous vraiment supprimer la sauvegarde système <strong>{deleteTarget?.name || 'sélectionnée'}</strong> ?
              Cette opération est irréversible. La suppression sera refusée si il s'agit de la dernière sauvegarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rpcCleanConfirmOpen} onOpenChange={setRpcCleanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le nettoyage RPC</AlertDialogTitle>
            <AlertDialogDescription>
              Lancer le nettoyage complet (<code className="text-xs">clean_all_data</code> ou{' '}
              <code className="text-xs">reset_all_data</code>), recréer le compte développeur, vider le stockage local
              puis revenir à l’accueil ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rpcCleanBusy}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void executeRpcFullClean()} disabled={rpcCleanBusy}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

