import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Calendar, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import HeroBanner from '@/components/HeroBanner';
import EventModalForm from '@/components/EventModalForm';
import { useEvents } from '@/hooks/useEvents';
import { useAuthContext } from '@/hooks/useAuthContext';
import useRoleCheck from '@/hooks/useRoleCheck';
import usePageHero from '@/hooks/usePageHero';
import { useNotification } from '@/components/ui/notification-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditingEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
}

const AdminEvents: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ eventId: string; clickCount: number } | null>(null);

  const { user } = useAuthContext();
  const { profile, isAdmin } = useRoleCheck();
  const { events, createEvent, updateEvent, deleteEvent, loading } = useEvents();
  const { notifySuccess, notifyError } = useNotification();

  console.debug('📅 AdminEvents:', {
    userId: user?.id,
    profileRole: profile?.role,
    authRole: user?.user_metadata?.role,
    isAdmin,
    eventCount: events.length,
  });

  // Filtrer les événements par titre
  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Trier par date de début
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return dateA - dateB;
  });

  const handleAddClick = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditClick = (event: (typeof events)[0]) => {
    setEditingEvent({
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      start_date: event.start_date,
      end_date: event.end_date ?? undefined,
      location: event.location ?? undefined,
      image_url: event.image_url,
    });
    setModalOpen(true);
  };

  const handleDeleteClick = (eventId: string) => {
    if (!deleteConfirm || deleteConfirm.eventId !== eventId) {
      setDeleteConfirm({ eventId, clickCount: 1 });
      notifySuccess('⚠️ Confirmer', 'Double-cliquez pour supprimer');
      setTimeout(() => setDeleteConfirm(null), 5000);
    } else {
      handleConfirmDelete(eventId);
    }
  };

  const handleConfirmDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      notifySuccess('Succès ✓', 'Événement supprimé');
      setDeleteConfirm(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      notifyError('Erreur', errorMsg);
    }
  };

  const handleSave = async (eventData: Record<string, unknown>) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData as Parameters<typeof updateEvent>[1]);
        notifySuccess('Succès ✓', 'Événement mis à jour');
      } else {
        await createEvent(eventData as Parameters<typeof createEvent>[0]);
        notifySuccess('Succès ✓', 'Événement créé');
      }
      setModalOpen(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      notifyError('Erreur', errorMsg);
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <HeroBanner
          title="Gestion des événements"
          subtitle="Créez et gérez les événements de votre église"
          backgroundImage={hero?.image_url}
          onBgSave={saveHero}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Top Section */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h1 className="text-3xl font-bold">Événements</h1>
              {isAdmin && (
                <Button onClick={handleAddClick} size="lg" className="w-full sm:w-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter un événement
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Total d'événements</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Événements à venir</p>
              <p className="text-2xl font-bold">
                {events.filter((e) => new Date(e.start_date) > new Date()).length}
              </p>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                {searchTerm ? 'Aucun événement trouvé' : 'Aucun événement pour le moment'}
              </p>
              {isAdmin && !searchTerm && (
                <Button onClick={handleAddClick} variant="outline" className="mt-6">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier événement
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {sortedEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors group"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-muted overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}

                      {/* Admin Overlay */}
                      {isAdmin && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(event)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(event.id)}
                            className={`p-3 rounded-lg transition-colors ${
                              deleteConfirm?.eventId === event.id
                                ? 'bg-destructive text-destructive-foreground animate-pulse'
                                : 'bg-destructive/80 hover:bg-destructive text-destructive-foreground'
                            }`}
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <h3 className="text-lg font-semibold line-clamp-2">{event.title}</h3>

                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {formatTime(event.start_date)}
                            {event.end_date && ` → ${formatTime(event.end_date)}`}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <EventModalForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSave}
        onDelete={deleteEvent}
        editingEvent={editingEvent}
      />
    </Layout>
  );
};

export default AdminEvents;
