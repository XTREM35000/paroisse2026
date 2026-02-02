import React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  id: string;
  slug?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  imageUrl?: string;
  featured?: boolean;
}

const EventCard = ({
  id,
  slug,
  title,
  description,
  date,
  time,
  location,
  attendees,
  imageUrl,
  featured = false,
}: EventCardProps) => {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  const [day, month] = formattedDate.split(" ");

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let ctrl/cmd/shift/middle clicks open in a new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || (e as any).button !== 0) return;
    e.preventDefault();
    // Push the event URL so Index can detect and open the modal
    navigate(`/evenements/${slug ?? id}`, { state: { background: routerLocation } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      className={`card-liturgical overflow-hidden ${featured ? "lg:flex" : ""}`}
    >
      {/* Image */}
        {imageUrl && (
          <div className={`${featured ? "lg:w-2/5" : ""} h-32 md:h-40 overflow-hidden relative bg-muted`}>
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
            />
            {featured && (
              <Badge className="absolute top-4 left-4 bg-primary hover:bg-primary">
                Événement à venir
              </Badge>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`p-5 lg:p-6 ${featured ? "lg:w-3/5" : ""} flex flex-col`}>
          <div className="flex gap-4">
            {/* Date Badge */}
            <div className="shrink-0 w-14 h-14 rounded-lg gradient-hero flex flex-col items-center justify-center text-primary-foreground">
              <span className="text-xl font-bold leading-none">{day}</span>
              <span className="text-xs uppercase">{month}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1 mb-1">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              {time}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              {location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gold" />
              {attendees} participants
            </span>
          </div>

          {/* Action */}
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary p-0 h-auto">
              <Link to={`/evenements/${slug ?? id}`} onClick={handleLinkClick} className="flex items-center gap-1">
                En savoir plus
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
  );
};

export default EventCard;
