/**
 * Page Admin pour gérer les certificats et diplômes
 * Créer, modifier, visualiser, imprimer, supprimer
 */

import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Loader, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import useRoleCheck from '@/hooks/useRoleCheck';
import usePageHero from '@/hooks/usePageHero';
import { useCertificates } from '@/modules/documents/hooks';
import { useDocumentSettings } from '@/modules/documents/hooks';
import HeroBanner from '@/components/HeroBanner';
import DocumentEditorModal from '@/components/DocumentEditorModal';
import ImageUploadField from '@/modules/documents/components/ImageUploadField';
import {
  CertificatePreview,
  CertificateTable,
} from '@/modules/documents/components';
import type { Certificate, CertificateFormData } from '@/modules/documents/types/documents';

/**
 * Page d'administration des certificats et diplômes
 * Accès restreint aux admins
 */
export default function AdminCertificates() {
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const { data: hero } = usePageHero('/admin/certificates');
  
  const { data: certificates, loading, error, createCert, updateCert, deleteCert, selectCertificate, selectedCertificate } =
    useCertificates();
  const { settings } = useDocumentSettings();

  // États modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // États formulaire
  const [formData, setFormData] = useState<CertificateFormData>({
    full_name: '',
    certificate_type: 'diplôme',
    mention: '',
    description: '',
    issued_by: '',
    signature_url: '',
    logo_url: '',
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
      certificate_type: 'diplôme',
      mention: '',
      description: '',
      issued_by: '',
      signature_url: '',
      logo_url: '',
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

      await createCert(formData);
      toast({
        title: 'Succès',
        description: 'Certificat créé avec succès',
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
  const handleEditOpen = (cert: Certificate) => {
    selectCertificate(cert);
    setFormData({
      full_name: cert.full_name,
      certificate_type: cert.certificate_type,
      mention: cert.mention || '',
      description: cert.description || '',
      issued_by: cert.issued_by || '',
      signature_url: cert.signature_url || '',
      logo_url: cert.logo_url || '',
    });
    setIsEditModalOpen(true);
  };

  // Soumettre édition
  const handleUpdate = async () => {
    try {
      if (!selectedCertificate) return;
      if (!formData.full_name.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom est obligatoire',
          variant: 'destructive',
        });
        return;
      }

      await updateCert(selectedCertificate.id, formData);
      toast({
        title: 'Succès',
        description: 'Certificat mis à jour avec succès',
      });
      setIsEditModalOpen(false);
      selectCertificate(null);
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
  const handleDelete = async (certId: string) => {
    try {
      await deleteCert(certId);
      toast({
        title: 'Succès',
        description: 'Certificat supprimé avec succès',
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
  const handlePreview = (cert: Certificate) => {
    selectCertificate(cert);
    setIsPreviewModalOpen(true);
  };

  // Impression
  const handlePrint = (cert: Certificate) => {
    selectCertificate(cert);
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <HeroBanner
        title="Certificats & Diplômes"
        subtitle="Gérez les certificats, diplômes et mentions honorifiques"
        backgroundImage="https://images.unsplash.com/photo-1557804506-669714d2e9d8?w=1920&h=1080&fit=crop"
        showBackButton={true}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Bouton de création */}
        <div className="mb-8 flex items-center justify-end">
          <Button
            onClick={handleCreateOpen}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Nouveau certificat
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
          <div className="rounded-lg border border-orange-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Total des certificats</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{certificates.length}</p>
          </div>
          <div className="rounded-lg border border-orange-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Diplômes</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {certificates.filter((c) => c.certificate_type === 'diplôme').length}
            </p>
          </div>
          <div className="rounded-lg border border-orange-200/50 bg-white p-6">
            <p className="text-sm text-gray-600">Autres certificats</p>
            <p className="text-2xl font-bold text-orange-500/60 mt-2">
              {certificates.filter((c) => c.certificate_type !== 'diplôme').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-orange-200 bg-white p-6">
          <CertificateTable
            certificates={certificates}
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
        title="Créer un nouveau certificat"
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
            <div>
              <Label htmlFor="cert_type" className="text-gray-700">
                Type de certificat *
              </Label>
              <Select
                value={formData.certificate_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    certificate_type: value as 'diplôme' | 'certificat' | 'mention' | 'honneur' | string,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diplôme">Diplôme</SelectItem>
                  <SelectItem value="certificat">Certificat</SelectItem>
                  <SelectItem value="mention">Mention</SelectItem>
                  <SelectItem value="honneur">Honneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mention" className="text-gray-700">
                  Mention
                </Label>
                <Input
                  id="mention"
                  value={formData.mention || ''}
                  onChange={(e) => setFormData({ ...formData, mention: e.target.value })}
                  placeholder="Distinction, Médaille, etc."
                  className="mt-1 bg-white text-black border border-gray-300"
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
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Détails du certificat"
                className="mt-1 bg-white text-black border border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField
                label="Signature"
                value={formData.signature_url}
                onChange={(url) => setFormData({ ...formData, signature_url: url })}
                imageId="signature"
                folder="documents/certificate-signatures"
              />
              <ImageUploadField
                label="Logo"
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                imageId="logo"
                folder="documents/certificate-logos"
              />
            </div>

          {/* Footer */}
          <div className="border-t border-orange-100 bg-gray-50 px-6 py-4 flex gap-2 justify-end">
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
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
          selectCertificate(null);
          resetForm();
        }}
        title="Modifier le certificat"
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
            <div>
              <Label htmlFor="edit_cert_type" className="text-gray-700">
                Type de certificat *
              </Label>
              <Select
                value={formData.certificate_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    certificate_type: value as 'diplôme' | 'certificat' | 'mention' | 'honneur' | string,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diplôme">Diplôme</SelectItem>
                  <SelectItem value="certificat">Certificat</SelectItem>
                  <SelectItem value="mention">Mention</SelectItem>
                  <SelectItem value="honneur">Honneur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_mention" className="text-gray-700">
                  Mention
                </Label>
                <Input
                  id="edit_mention"
                  value={formData.mention || ''}
                  onChange={(e) => setFormData({ ...formData, mention: e.target.value })}
                  className="mt-1 bg-white text-black border border-gray-300"
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
                  className="mt-1 bg-white text-black border border-gray-300"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_description" className="text-gray-700">
                Description
              </Label>
              <Input
                id="edit_description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 bg-white text-black border border-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadField
                label="Signature"
                value={formData.signature_url}
                onChange={(url) => setFormData({ ...formData, signature_url: url })}
                imageId="signature"
                folder="documents/certificate-signatures"
              />
              <ImageUploadField
                label="Logo"
                value={formData.logo_url}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                imageId="logo"
                folder="documents/certificate-logos"
              />
            </div>

          {/* Footer */}
          <div className="border-t border-orange-100 bg-gray-50 px-6 py-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                selectCertificate(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
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
          selectCertificate(null);
        }}
        title="Aperçu du certificat"
        headerClassName="bg-amber-900"
      >
        <div className="flex justify-center p-6 bg-gray-50">
            {selectedCertificate && (
              <CertificatePreview
                certificate={selectedCertificate}
                settings={settings}
                size="large"
              />
            )}
        </div>
      </DocumentEditorModal>
    </div>
  );
}
