import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Facebook, Youtube, Instagram } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";

const Footer = () => {
  const massSchedule = [
    { day: "Dimanche", time: "9h00, 11h00, 18h30" },
    { day: "Lundi - Vendredi", time: "8h00, 18h30" },
    { day: "Samedi", time: "9h00, 18h00 (anticipée)" },
  ];

  const quickLinks = [
    { name: "Accueil", path: "/" },
    { name: "Vidéos", path: "/videos" },
    { name: "Galerie", path: "/galerie" },
    { name: "Événements", path: "/evenements" },
    { name: "À propos", path: "/a-propos" },
  ];

  return (
    <footer className="bg-card border-t border-border cross-pattern">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <AnimatedLogo size="md" />
              <div>
                <h3 className="font-display text-lg font-semibold leading-tight">Paroisse Notre Dame</h3>
                <p className="text-xs text-muted-foreground">de la Réconciliation</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Une communauté accueillante au cœur d'Abidjan, au service de la foi, de l'espérance et de la charité.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold">Liens rapides</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Mass Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" />
              Horaires des messes
            </h4>
            <ul className="space-y-3">
              {massSchedule.map((schedule) => (
                <li key={schedule.day} className="text-sm">
                  <span className="font-medium text-foreground">{schedule.day}</span>
                  <p className="text-muted-foreground">{schedule.time}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-display text-lg font-semibold">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                <span className="text-muted-foreground">
                  Boulevard de la Réconciliation<br />
                  Cocody, Abidjan, Côte d'Ivoire
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gold shrink-0" />
                <a href="tel:+22527223344" className="text-muted-foreground hover:text-primary">
                  +225 27 22 33 44 55
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gold shrink-0" />
                <a href="mailto:contact@paroisse-ndreconciliation.ci" className="text-muted-foreground hover:text-primary">
                  contact@paroisse-ndreconciliation.ci
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="liturgical-divider mt-10 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 Paroisse Notre Dame de la Réconciliation. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="hover:text-primary transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
