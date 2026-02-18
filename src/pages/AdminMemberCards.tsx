/**
 * Page Admin pour gérer les cartes de membres
 * Créer, modifier, visualiser, imprimer, supprimer
 */

import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Loader, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useRoleCheck from '@/hooks/useRoleCheck';
import usePageHero from '@/hooks/usePageHero';
import { useMemberCards } from '@/modules/documents/hooks';
import { useDocumentSettings } from '@/modules/documents/hooks';
import HeroBanner from '@/components/HeroBanner';
import DocumentEditorModal from '@/components/DocumentEditorModal';
import ImageUploadField from '@/modules/documents/components/ImageUploadField';
import {
  MemberCardPreview,
  MemberCardTable,
} from '@/modules/documents/components';
import type { MemberCard, MemberCardFormData } from '@/modules/documents/types/documents';

/**
 * Page d'administration des cartes de membres
 * Accès restreint aux admins
 */
export default function AdminMemberCards() {
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const { data: hero } = usePageHero('/admin/member-cards');
  
  const { data: cards, loading, error, createCard, updateCard, deleteCard, selectCard, selectedCard } =
    useMemberCards();
  const { settings } = useDocumentSettings();

  // États modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // États formulaire
  const [formData, setFormData] = useState<MemberCardFormData>({
    full_name: '',
    role: '',
    member_number: '',
    photo_url: '',
    signature_url: '',
    issued_by: '',
  });

  // Vérification accès admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Accès refusé</h3>
                <p className="text-sm text-red-800 mt-1">
                  Seuls les administrateurs peuvent accéder à cette page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Réinitialiser formulaire
  const resetForm = () => {
    setFormData({
      full_name: '',
      role: '',
      member_number: '',
      photo_url: '',
      signature_url: '',
      issued_by: '',
    });
  };

  // Ouvrir création
  const handleCreateOpen = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Soumettre création
  const handleCreate = async () => {
    try {
      if (!formData.full_name.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom est obligatoire',
          variant: 'destructive',
        });
        return;
      }

      await createCard(formData);
      toast({
        title: 'Succès',
        description: 'Carte créée avec succès',
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  // Ouvrir édition
  const handleEditOpen = (card: MemberCard) => {
    selectCard(card);
    setFormData({
      full_name: card.full_name,
      role: card.role || '',
      member_number: card.member_number,
      photo_url: card.photo_url || '',
      signature_url: card.signature_url || '',
      issued_by: card.issued_by || '',
    });
    setIsEditModalOpen(true);
  };

  // Soumettre édition
  const handleUpdate = async () => {
    try {
      if (!selectedCard) return;
      if (!formData.full_name.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom est obligatoire',
          variant: 'destructive',
        });
        return;
      }

      await updateCard(selectedCard.id, formData);
      toast({
        title: 'Succès',
        description: 'Carte mise à jour avec succès',
      });
      setIsEditModalOpen(false);
      selectCard(null);
      resetForm();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    }
  };

  // Supprimer
  const handleDelete = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      toast({
        title: 'Succès',
        description: 'Carte supprimée avec succès',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  // Vue préalable
  const handlePreview = (card: MemberCard) => {
    selectCard(card);
    setIsPreviewModalOpen(true);
  };

  // Impression
  const handlePrint = (card: MemberCard) => {
    selectCard(card);
    // Implémenter la logique d'impression ici
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <HeroBanner
        title="Cartes de Membres"
        subtitle="Gérez les cartes officielles des membres"
        backgroundImage="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=1080&fit=crop"
        showBackButton={true}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Bouton de création */}
        <div className="mb-8 flex items-center justify-end">
          <Button
            onClick={handleCreateOpen}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Nouvelle carte
          </Button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border border-blue-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Total des cartes</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{cards.length}</p>
          </div>
          <div className="rounded-lg border border-blue-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Cartes actives</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {cards.filter((c) => c.status === 'active').length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Cartes inactives</p>
            <p className="text-2xl font-bold text-blue-600/60 mt-2">
              {cards.filter((c) => c.status !== 'active').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-blue-200/50 bg-white p-6">
          <MemberCardTable
            cards={cards}
            loading={loading}
            onView={handlePreview}
            onEdit={handleEditOpen}
            onDelete={handleDelete}
            onPrint={handlePrint}
          />
        </div>
      </div>

      {/* Modal création */}
      <DocumentEditorModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Créer une nouvelle carte de membre"
        headerClassName="bg-amber-900"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-gray-700">
              Nom complet *
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Jean Dupont"
              className="mt-1 bg-white text-black border border-gray-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role" className="text-gray-700">
                Rôle
              </Label>
              <Input
                id="role"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Paroissien, Prêtre, etc."
                className="mt-1 bg-white text-black border border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="member_number" className="text-gray-700">
                Numéro de membre
              </Label>
              <Input
                id="member_number"
                value={formData.member_number}
                onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                placeholder="MEM-001"
                className="mt-1 bg-white text-black border border-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              label="Photo du membre"
              value={formData.photo_url}
              onChange={(url) => setFormData({ ...formData, photo_url: url })}
              imageId="photo"
              folder="documents/member-photos"
            />
            <ImageUploadField
              label="Signature"
              value={formData.signature_url}
              onChange={(url) => setFormData({ ...formData, signature_url: url })}
              imageId="signature"
              folder="documents/member-signatures"
            />
          </div>
          <div>
            <Label htmlFor="issued_by" className="text-gray-700">
              Délivré par
            </Label>
            <Input
              id="issued_by"
              value={formData.issued_by || ''}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              placeholder="Nom de l'autorité"
              className="mt-1 bg-white text-black border border-gray-300"
            />
          </div>

          {/* Footer */}
          <div className="border-t border-blue-100 bg-gray-50 -mx-6 -mb-6 mt-6 px-6 py-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Créer
            </Button>
          </div>
        </form>
      </DocumentEditorModal>

      {/* Modal édition */}
      <DocumentEditorModal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          selectCard(null);
          resetForm();
        }}
        title="Modifier la carte de membre"
        headerClassName="bg-amber-900"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
          <div>
              <Label htmlFor="edit_full_name" className="text-gray-700">
                Nom complet *
              </Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 bg-white text-black border border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_role" className="text-gray-700">
                  Rôle
                </Label>
                <Input
                  id="edit_role"
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 bg-white text-black border border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="edit_member_number" className="text-gray-700">
                  Numéro de membre
                </Label>
                <Input
                  id="edit_member_number"
                  value={formData.member_number}
                  onChange={(e) => setFormData({ ...formData, member_number: e.target.value })}
                  className="mt-1 bg-white text-black border border-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField
                label="Photo du membre"
                value={formData.photo_url}
                onChange={(url) => setFormData({ ...formData, photo_url: url })}
                imageId="photo"
                folder="documents/member-photos"
              />
              <ImageUploadField
                label="Signature"
                value={formData.signature_url}
                onChange={(url) => setFormData({ ...formData, signature_url: url })}
                imageId="signature"
                folder="documents/member-signatures"
              />
            </div>
            <div>
              <Label htmlFor="edit_issued_by" className="text-gray-700">
                Délivré par
              </Label>
              <Input
                id="edit_issued_by"
                value={formData.issued_by || ''}
                onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
                className="mt-1"
              />
            </div>

          {/* Footer */}
          <div className="border-t border-blue-100 bg-gray-50 px-6 py-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                selectCard(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
              Mettre à jour
            </Button>
          </div>
        </form>
      </DocumentEditorModal>

      {/* Modal aperçu */}
      <DocumentEditorModal
        open={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          selectCard(null);
        }}
        title="Aperçu de la carte"
        headerClassName="bg-amber-900"
      >
        <div className="flex justify-center p-6 bg-gray-50">
          {selectedCard && (
            <MemberCardPreview card={selectedCard} settings={settings} size="large" />
          )}
        </div>
      </DocumentEditorModal>
    </div>
  );
}
