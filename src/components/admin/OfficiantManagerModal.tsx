import { useEffect, useMemo, useState } from 'react';
import DraggableModal from '@/components/DraggableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface OfficiantManagerModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Officiant = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  title?: string | null;
  grade?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type OfficiantForm = {
  full_name: string;
  title: string;
  grade: string;
  phone: string;
  email: string;
  is_active: boolean;
};

const emptyForm: OfficiantForm = {
  full_name: '',
  title: '',
  grade: '',
  phone: '',
  email: '',
  is_active: true,
};

export function OfficiantManagerModal({ open, onClose, onComplete }: OfficiantManagerModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [officiants, setOfficiants] = useState<Officiant[]>([]);
  const [selectedOfficiant, setSelectedOfficiant] = useState<Officiant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<OfficiantForm>(emptyForm);

  const selectedName = useMemo(
    () => selectedOfficiant?.full_name || selectedOfficiant?.name || 'Sans nom',
    [selectedOfficiant],
  );

  const loadOfficiants = async () => {
    const { data } = await supabase.from('officiants').select('*').order('created_at', { ascending: false });
    setOfficiants((data as Officiant[]) || []);
  };

  useEffect(() => {
    if (open) void loadOfficiants();
  }, [open]);

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Le nom complet est requis');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        name: formData.full_name,
        paroisse_id: profile?.paroisse_id ?? null,
      };
      if (isEditing && selectedOfficiant?.id) {
        const { error } = await supabase
          .from('officiants')
          .update(payload as never)
          .eq('id', selectedOfficiant.id);
        if (error) throw error;
        toast.success('Officiant mis a jour');
      } else {
        const { error } = await supabase.from('officiants').insert(payload as never);
        if (error) throw error;
        toast.success('Officiant ajoute');
      }
      await loadOfficiants();
      setIsEditing(false);
      setSelectedOfficiant(null);
      setFormData(emptyForm);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (officiant: Officiant) => {
    const label = officiant.full_name || officiant.name || 'cet officiant';
    if (!window.confirm(`Supprimer "${label}" ?`)) return;
    await supabase.from('officiants').delete().eq('id', officiant.id);
    await loadOfficiants();
    if (selectedOfficiant?.id === officiant.id) {
      setSelectedOfficiant(null);
      setIsEditing(false);
      setFormData(emptyForm);
    }
  };

  const markCompleted = async () => {
    await supabase
      .from('profiles')
      .update({ has_seen_officiant_manager: true } as never)
      .eq('id', profile?.id);
    await refreshProfile();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await markCompleted();
      toast.success('Configuration des officiants terminee');
      onComplete?.();
      onClose();
    } catch {
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await markCompleted();
    } catch {
      // no-op
    } finally {
      onClose();
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={() => void handleSkip()}
      title="Gestion des officiants"
      maxWidthClass="max-w-6xl"
      className="h-[85vh] max-h-[85vh]"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="flex h-full">
        <div className="w-80 border-r p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Officiants</h3>
            <Button
              size="sm"
              onClick={() => {
                setSelectedOfficiant(null);
                setIsEditing(true);
                setFormData(emptyForm);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {officiants.map((o) => (
              <div
                key={o.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedOfficiant?.id === o.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedOfficiant(o);
                  setIsEditing(false);
                }}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.full_name || o.name || 'Sans nom'}</div>
                    <div className="text-xs opacity-75 truncate">{o.title || '—'} {o.grade || ''}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOfficiant(o);
                        setFormData({
                          full_name: o.full_name || o.name || '',
                          title: o.title || '',
                          grade: o.grade || '',
                          phone: o.phone || '',
                          email: o.email || '',
                          is_active: o.is_active ?? true,
                        });
                        setIsEditing(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(o);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {o.is_active && <Badge variant="outline" className="mt-1 text-xs">Actif</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">{selectedOfficiant ? 'Modifier' : 'Nouvel'} officiant</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />Annuler
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />Enregistrer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>Titre</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
                </div>
                <div>
                  <Label>Telephone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
            </div>
          ) : selectedOfficiant ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{selectedName}</h2>
              <p className="text-muted-foreground">{selectedOfficiant.title || '—'} {selectedOfficiant.grade || ''}</p>
              <div className="text-sm space-y-1">
                <p>Telephone: {selectedOfficiant.phone || '—'}</p>
                <p>Email: {selectedOfficiant.email || '—'}</p>
              </div>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />Modifier
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Selectionnez un officiant ou creez-en un</p>
            </div>
          )}
        </div>
      </div>
      <div className="border-t p-4 flex justify-end">
        <Button onClick={() => void handleComplete()} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Terminer la configuration
        </Button>
      </div>
    </DraggableModal>
  );
}
