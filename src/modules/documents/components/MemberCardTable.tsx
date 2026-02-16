/**
 * Table pour afficher les cartes de membres
 * Affiche: photo, nom, rôle, numéro, statut, actions
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
import type { MemberCard } from '../types/documents';

interface MemberCardTableProps {
  cards: MemberCard[];
  loading?: boolean;
  onView?: (card: MemberCard) => void;
  onEdit?: (card: MemberCard) => void;
  onDelete?: (cardId: string) => void;
  onPrint?: (card: MemberCard) => void;
}

/**
 * Table pour afficher les cartes de membres avec actions
 * 
 * @example
 * <MemberCardTable
 *   cards={cards}
 *   onView={handleView}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onPrint={handlePrint}
 * />
 */
export function MemberCardTable({
  cards,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: MemberCardTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Aucune carte de membre</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Photo</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Numéro</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id} className="hover:bg-gray-50">
              {/* Photo */}
              <TableCell className="w-16 h-16">
                {card.photo_url ? (
                  <img
                    src={card.photo_url}
                    alt={card.full_name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500">N/A</span>
                  </div>
                )}
              </TableCell>

              {/* Nom */}
              <TableCell className="font-medium text-gray-900">
                {card.full_name}
              </TableCell>

              {/* Rôle */}
              <TableCell className="text-sm text-gray-600">
                {card.role || '-'}
              </TableCell>

              {/* Numéro */}
              <TableCell className="text-sm text-gray-600">
                {card.member_number || '-'}
              </TableCell>

              {/* Statut */}
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    card.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : card.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : card.status === 'expired'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {card.status}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right space-x-2">
                {onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(card)}
                    title="Voir l'aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}

                {onPrint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPrint(card)}
                    title="Imprimer"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                )}

                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(card)}
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
                      <AlertDialogTitle>Supprimer cette carte?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer la carte de {card.full_name} ? Cette
                        action est irréversible.
                      </AlertDialogDescription>
                      <div className="flex gap-2">
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(card.id)}
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

export default MemberCardTable;
