/**
 * Table pour afficher les certificats
 * Affiche: nom, type, date, actions
 */

import React from 'react';
import { Trash2, Eye, Edit2, Printer } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Certificate } from '../types/documents';

interface CertificateTableProps {
  certificates: Certificate[];
  loading?: boolean;
  onView?: (cert: Certificate) => void;
  onEdit?: (cert: Certificate) => void;
  onDelete?: (certId: string) => void;
  onPrint?: (cert: Certificate) => void;
}

/**
 * Table pour afficher les certificats avec actions
 * 
 * @example
 * <CertificateTable
 *   certificates={certs}
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onPrint={handlePrint}
 * />
 */
export function CertificateTable({
  certificates,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: CertificateTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Aucun certificat</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Mention</TableHead>
            <TableHead>Date d'émission</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((cert) => (
            <TableRow key={cert.id} className="hover:bg-gray-50">
              {/* Nom */}
              <TableCell className="font-medium text-gray-900">
                {cert.full_name}
              </TableCell>

              {/* Type */}
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {cert.certificate_type}
                </span>
              </TableCell>

              {/* Mention */}
              <TableCell className="text-sm text-gray-600">
                {cert.mention ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                    {cert.mention}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>

              {/* Date d'émission */}
              <TableCell className="text-sm text-gray-600">
                {cert.issued_at &&
                  new Date(cert.issued_at).toLocaleDateString('fr-FR')}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right space-x-2">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(cert)}
                    title="Voir l'aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}

                {onPrint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPrint(cert)}
                    title="Imprimer"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                )}

                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(cert)}
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}

                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Supprimer ce certificat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer le certificat de {cert.full_name} ? Cette
                        action est irréversible.
                      </AlertDialogDescription>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(cert.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default CertificateTable;
