import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database';
import useRoleCheck from '@/hooks/useRoleCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import HeroBanner from '@/components/HeroBanner';

const AdminNotificationsEditor: React.FC = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useRoleCheck();
  const { toast } = useToast();

  type SelectionMode = 'all' | 'by-role' | 'individual';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['member']);
  const [members, setMembers] = useState<Array<{ id: string; email: string; full_name: string; role: string }>>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [useScheduling, setUseScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Load members on mount
  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase.from('profiles').select('id,email,full_name,role');
        if (error) throw error;
        setMembers(data || []);
      } catch (e) {
        console.error('[AdminNotificationsEditor] loadMembers error', e);
        toast({ title: 'Erreur', description: 'Impossible de charger les membres', variant: 'destructive' });
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [toast]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeroBanner
          title="Notifications"
          subtitle="Gérez les alertes envoyées aux fidèles"
          showBackButton
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="text-xl font-semibold text-red-900">Accès refusé</h2>
            <p className="text-sm text-red-800 mt-1">
              Vous n'avez pas les droits nécessaires pour administrer les notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sendNotifications = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: 'Erreur', description: 'Titre et message requis', variant: 'destructive' });
      return;
    }

    let targetIds: string[] = [];

    if (selectionMode === 'all') {
      targetIds = members.map((m) => m.id);
    } else if (selectionMode === 'by-role') {
      targetIds = members.filter((m) => selectedRoles.includes(m.role)).map((m) => m.id);
    } else if (selectionMode === 'individual') {
      targetIds = selectedMemberIds;
    }

    if (targetIds.length === 0) {
      toast({ title: 'Erreur', description: 'Aucun destinataire sélectionné', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const rows = targetIds.map((userId) => ({
        user_id: userId,
        title: title.trim(),
        body: body.trim(),
        is_read: false,
        metadata: useScheduling && scheduledAt ? { scheduled_for: new Date(scheduledAt).toISOString() } : {},
      }));

      const { error: insErr } = await supabase.from('notifications').insert(rows);
      if (insErr) throw insErr;

      toast({ title: 'Succès', description: `Notification envoyée à ${rows.length} destinataire(s)` });
      setTitle('');
      setBody('');
      setScheduledAt(null);
      setUseScheduling(false);
      setSelectedMemberIds([]);
    } catch (e) {
      console.error('[AdminNotificationsEditor] send error', e);
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'envoi';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      moderator: 'Modérateur',
      member: 'Membre',
      guest: 'Invité',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Notifications"
        subtitle="Gérez les alertes envoyées aux fidèles"
        showBackButton
      />

      <div className="flex-1 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Administration — Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Envoyez des notifications ciblées aux membres de la paroisse par email (et plus tard push/app).
          </p>
        </div>

        {/* Message Content */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Contenu du message</h2>
          <div className="space-y-3">
            <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useScheduling} onChange={(e) => setUseScheduling(e.target.checked)} />
                <span>Planifier cette notification</span>
              </label>
              {useScheduling && (
                <input
                  type="datetime-local"
                  value={scheduledAt ?? ''}
                  onChange={(e) => setScheduledAt(e.target.value || null)}
                  className="rounded-md border border-input px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>
        </section>

        {/* Selection Mode */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sélectionner les destinataires</h2>
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2 border-b border-border">
              {(['all', 'by-role', 'individual'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectionMode(mode)}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    selectionMode === mode
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'all' && 'Tous'}
                  {mode === 'by-role' && 'Par rôle'}
                  {mode === 'individual' && 'Individuellement'}
                </button>
              ))}
            </div>

            {/* Mode: All */}
            {selectionMode === 'all' && (
              <div className="p-4 bg-muted/30 rounded text-sm">
                <p>Envoyer à <strong>{members.length}</strong> membre(s)</p>
              </div>
            )}

            {/* Mode: By Role */}
            {selectionMode === 'by-role' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['admin', 'moderator', 'member', 'guest'].map((role) => (
                    <label key={role} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role]);
                          } else {
                            setSelectedRoles(selectedRoles.filter((r) => r !== role));
                          }
                        }}
                      />
                      <span className="text-sm">{roleLabel(role)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({members.filter((m) => m.role === role).length})
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cible: <strong>{members.filter((m) => selectedRoles.includes(m.role)).length}</strong> destinataire(s)
                </p>
              </div>
            )}

            {/* Mode: Individual */}
            {selectionMode === 'individual' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun membre trouvé</p>
                  ) : (
                    filteredMembers.map((member) => (
                      <label key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, member.id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.id));
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.full_name || member.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{roleLabel(member.role)}</span>
                      </label>
                    ))
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Sélectionnés: <strong>{selectedMemberIds.length}</strong> destinataire(s)
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Send Button */}
        <div className="flex gap-2">
          <Button onClick={sendNotifications} disabled={sending} size="lg">
            <Send className="w-4 h-4 mr-2" /> {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTitle('');
              setBody('');
              setScheduledAt(null);
              setUseScheduling(false);
              setSelectedMemberIds([]);
            }}
            size="lg"
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationsEditor;
