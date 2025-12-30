import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GalleryGridProps {
  children: ReactNode;
  columns?: {
    default: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  gap?: string;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  children,
  columns = {
    default: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
  },
  gap = '6',
}) => {
  const gridClass = `grid gap-${gap} grid-cols-${columns.default} sm:grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid gap-${gap}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 400px), 1fr))`,
      }}
    >
      {children}
    </motion.div>
  );
};

export default GalleryGrid;
