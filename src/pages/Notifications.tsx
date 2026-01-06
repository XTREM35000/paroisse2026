import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Trash2, Check, CheckCircle, Clock, Printer, AlertCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

const NotificationsPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!profile) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotifications((data as Notification[]) || []);
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les notifications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [profile, toast]);

  // Mark as read
  const handleMarkAsRead = async (notifId: string, isRead: boolean) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: !isRead })
        .eq("id", notifId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, is_read: !isRead } : n
        )
      );

      toast({
        title: "Succès",
        description: isRead ? "Marquée comme non lue" : "Marquée comme lue",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la notification",
        variant: "destructive",
      });
    }
  };

  // Delete notification
  const handleDelete = async (notifId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notifId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast({
        title: "Succès",
        description: "Notification supprimée",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: "Succès",
        description: "Toutes les notifications marquées comme lues",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications",
        variant: "destructive",
      });
    }
  };

  // Print notifications
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mes Notifications</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: white;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1a7d4a;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            color: #1a7d4a;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 12px;
            color: #666;
          }
          .timestamp {
            font-size: 11px;
            color: #999;
            text-align: right;
            margin-bottom: 20px;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-box {
            padding: 15px;
            background: #f5f5f5;
            border-left: 4px solid #1a7d4a;
            border-radius: 4px;
          }
          .stat-box h3 {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .stat-box .value {
            font-size: 24px;
            font-weight: bold;
            color: #1a7d4a;
          }
          .notifications-list {
            margin-bottom: 30px;
          }
          .notification-item {
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            border-radius: 4px;
          }
          .notification-item.unread {
            background: #f0f8f4;
            border-left: 4px solid #1a7d4a;
          }
          .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .notification-title {
            font-size: 14px;
            font-weight: bold;
            color: #1a7d4a;
          }
          .notification-date {
            font-size: 11px;
            color: #999;
          }
          .notification-body {
            font-size: 13px;
            color: #555;
            margin: 8px 0;
          }
          .notification-status {
            font-size: 11px;
            color: #666;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e0e0e0;
            padding-top: 15px;
            margin-top: 30px;
            font-size: 11px;
            color: #999;
          }
          @media print {
            body {
              background: white;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Mes Notifications</h1>
            <p>Synthèse des notifications reçues</p>
          </div>

          <div class="timestamp">
            Généré le: ${format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
          </div>

          <div class="stats">
            <div class="stat-box">
              <h3>Total</h3>
              <div class="value">${notifications.length}</div>
            </div>
            <div class="stat-box">
              <h3>Non Lues</h3>
              <div class="value">${notifications.filter((n) => !n.is_read).length}</div>
            </div>
            <div class="stat-box">
              <h3>Lues</h3>
              <div class="value">${notifications.filter((n) => n.is_read).length}</div>
            </div>
          </div>

          <div class="notifications-list">
            ${notifications
              .map(
                (notif) => `
              <div class="notification-item ${!notif.is_read ? "unread" : ""}">
                <div class="notification-header">
                  <span class="notification-title">${notif.title}</span>
                  <span class="notification-date">${format(new Date(notif.created_at), "dd MMM yyyy HH:mm", {
                    locale: fr,
                  })}</span>
                </div>
                <div class="notification-body">${notif.body}</div>
                <div class="notification-status">
                  ${notif.is_read ? "✓ Lue" : "● Non lue"}
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} - Paroisse. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterUnread ? !notif.is_read : true;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Mes Notifications"
        subtitle="Consultez et gérez toutes vos notifications"
        backgroundImage={hero?.image_url || "/images/gallery/homelies.png"}
        onBgSave={saveHero}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Total</p>
                  <p className="text-3xl font-bold text-blue-700">{notifications.length}</p>
                </div>
                <Info className="h-8 w-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-semibold">Non lues</p>
                  <p className="text-3xl font-bold text-amber-700">{unreadCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-400" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-semibold">Lues</p>
                  <p className="text-3xl font-bold text-green-700">
                    {notifications.filter((n) => n.is_read).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Controls Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg border border-border p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterUnread ? "default" : "outline"}
                onClick={() => setFilterUnread(!filterUnread)}
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {filterUnread ? "Non lues" : "Toutes"}
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Notifications List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Chargement des notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Aucune notification ne correspond à votre recherche" : "Aucune notification"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-lg border p-6 transition-all ${
                  notif.is_read
                    ? "bg-muted/30 border-border"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="inline-flex items-center justify-center h-2 w-2 bg-amber-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{notif.body}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(notif.created_at), "dd MMMM yyyy 'à' HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                      title={notif.is_read ? "Marquer comme non lue" : "Marquer comme lue"}
                    >
                      {notif.is_read ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notif.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default NotificationsPage;
