import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
}

const SectionTitle = ({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "Voir tout",
}: SectionTitleProps) => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
    >
      <div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {viewAllLink && user && (
        <Link
          to={viewAllLink}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          {viewAllText}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </motion.div>
  );
};

export default SectionTitle;
