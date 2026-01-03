import React from 'react';
import { motion } from 'framer-motion';
import DirectoryCard from './DirectoryCard';
import type { DirectoryItem } from '@/hooks/useDirectory';
import { LucideIcon } from 'lucide-react';

interface DirectorySectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  items: DirectoryItem[];
  index: number;
  showAdminActions?: boolean;
  onDelete?: (id: string) => void;
}

const DirectorySection: React.FC<DirectorySectionProps> = ({
  title,
  description,
  icon: Icon,
  items,
  index,
  showAdminActions = false,
  onDelete,
}) => {
  if (items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2 }}
      className="py-12"
    >
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground font-display">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-muted-foreground mt-2 ml-11">
            {description}
          </p>
        )}
      </div>

      {/* Grid de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <DirectoryCard 
            key={item.id} 
            item={item} 
            index={i}
            showAdminActions={showAdminActions}
            onDelete={onDelete}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default DirectorySection;
