import { motion } from "framer-motion";
import { Heart, MessageCircle, Maximize2 } from "lucide-react";
import { useState } from "react";

interface GalleryCardProps {
  id: string;
  imageUrl?: string;
  image_url?: string;
  title: string;
  description?: string;
  likes: number;
  comments: number;
  onOpen?: () => void;
}

const GalleryCard = ({ id, imageUrl, image_url, title, description, likes, comments, onOpen }: GalleryCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const imgUrl = imageUrl || image_url || "/images/gallery/default.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-xl shadow-card cursor-pointer h-full flex flex-col"
      onClick={onOpen}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden">
        <img
          src={imgUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h4 className="font-display text-primary-foreground font-medium mb-2 line-clamp-2">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-primary-foreground/80 line-clamp-1 mb-3">
              {description}
            </p>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                isLiked ? "text-destructive" : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{isLiked ? likes + 1 : likes}</span>
            </button>
            <span className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
              <MessageCircle className="w-4 h-4" />
              <span>{comments}</span>
            </span>
          </div>
        </div>
        
        {/* Expand Icon */}
        <div className="absolute top-3 right-3">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center"
          >
            <Maximize2 className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Description Label */}
      {description && (
        <div className="p-3 bg-card border-t border-border/50">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      )}
    </motion.div>
  );
};

export default GalleryCard;
