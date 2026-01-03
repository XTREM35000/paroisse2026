import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Globe, MapPin, Trash2 } from 'lucide-react';
import type { DirectoryItem } from '@/hooks/useDirectory';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

interface DirectoryCardProps {
  item: DirectoryItem;
  index: number;
  onDelete?: (id: string) => void;
  showAdminActions?: boolean;
}

const DirectoryCard: React.FC<DirectoryCardProps> = ({ item, index, onDelete, showAdminActions = false }) => {
  const { profile } = useUser();
  const isAdmin = !!(profile?.role && ['admin', 'super_admin'].includes(String(profile.role).toLowerCase()));
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      service: 'Service',
      clergy: 'Clergé',
      member: 'Membre',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      service: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      clergy: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      member: 'bg-green-500/10 text-green-700 dark:text-green-400',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="p-6">
        {/* Header avec image/avatar */}
        <div className="flex items-start gap-4 mb-4">
          {item.image_url && item.image_url.trim() ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                // Si l'image ne charge pas, remplacer par un avatar
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold flex-shrink-0 ${item.image_url && item.image_url.trim() ? 'hidden' : ''}`}>
            {getInitials(item.name)}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground leading-tight mb-1">
              {item.name}
            </h3>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
              {getCategoryLabel(item.category)}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
            {item.description}
          </p>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          {item.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
              <a 
                href={`mailto:${item.email}`}
                className="text-primary hover:underline truncate"
              >
                {item.email}
              </a>
            </div>
          )}
          
          {item.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
              <a 
                href={`tel:${item.phone}`}
                className="text-primary hover:underline"
              >
                {item.phone}
              </a>
            </div>
          )}
          
          {item.website && (
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-primary flex-shrink-0" />
              <a 
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {item.website}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        {(item.email || item.phone) && (
          <div className="flex gap-2 pt-4 border-t border-border/50 flex-wrap">
            {item.email && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a href={`mailto:${item.email}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Contacter
                </a>
              </Button>
            )}
            {item.phone && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a href={`tel:${item.phone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Appeler
                </a>
              </Button>
            )}
            {isAdmin && showAdminActions && onDelete && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => onDelete(item.id)}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DirectoryCard;
