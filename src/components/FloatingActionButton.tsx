import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/useAuthContext';

export const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuthContext();

  if (role !== 'super_admin') return null;

  return (
    <motion.button
      type="button"
      initial={{ scale: 0.9, opacity: 0.8 }}
      animate={{ scale: [1, 1.08, 1], opacity: 1 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        navigate('/admin/paroisses/new');
      }}
      // Shadcn Dialog uses z-50 overlay/content; bump above to stay visible during paroisse selection.
      className="fixed bottom-6 right-6 z-[1000] flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-purple-600/30"
      aria-label="Créer une paroisse"
      title="Créer une paroisse"
    >
      <Plus className="w-6 h-6" />
    </motion.button>
  );
};

