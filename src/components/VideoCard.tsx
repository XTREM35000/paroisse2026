import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: string;
  date: string;
}

const VideoCard = ({ id, title, description, thumbnail, duration, views, category, date }: VideoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/videos/${id}`} className="block group">
        <div className="card-liturgical overflow-hidden h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-video overflow-hidden">
            <img
              src={thumbnail}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg"
              >
                <Play className="w-6 h-6 text-primary-foreground ml-1" fill="currentColor" />
              </motion.div>
            </div>
            {/* Duration Badge */}
            <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-foreground/80 text-primary-foreground text-xs font-medium">
              {duration}
            </span>
            {/* Category Badge */}
            <Badge className="absolute top-2 left-2 bg-gold/90 hover:bg-gold/80">
              {category}
            </Badge>
          </div>

          {/* Info */}
          <div className="p-4 space-y-2 flex-1 flex flex-col">
            <h3 className="font-display font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {views.toLocaleString()} vues
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {date}
              </span>
            </div>
            <div className="mt-3">
              <Button size="sm" className="w-full" variant="default">
                Regarder
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VideoCard;
