import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header darkMode={false} toggleDarkMode={() => {}} />
      
      <HeroBanner
        title="À propos de nous"
        subtitle="Découvrez l'histoire et la mission de notre paroisse"
        showBackButton={true}
        backgroundImage="/images/prieres.png"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Introduction */}
          <motion.section variants={itemVariants} className="max-w-3xl">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Paroisse Notre-Dame de la Réconciliation
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Notre paroisse est un lieu de foi, de communion et de service au
              cœur de notre communauté. Fondée sur les valeurs de l'Évangile,
              nous accueillons tous ceux qui cherchent à grandir spirituellement
              et à servir le prochain.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              À travers nos services religieux, nos activités pastorales et nos
              engagements sociaux, nous aspirons à vivre l'amour du Christ et à
              bâtir une communauté fraternelle et inclusive.
            </p>
          </motion.section>

          {/* Mission and Values */}
          <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Notre Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Annoncer l'Évangile, célébrer la présence du Christ dans nos
                communautés, et servir ceux qui souffrent avec compassion et
                justice.
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Nos Valeurs
              </h3>
              <ul className="text-muted-foreground space-y-2">
                <li>✦ Amour et charité envers tous</li>
                <li>✦ Respect et dignité humaine</li>
                <li>✦ Intégrité et transparence</li>
                <li>✦ Engagement communautaire</li>
              </ul>
            </div>
          </motion.section>

          {/* Ministry Areas */}
          <motion.section variants={itemVariants}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              Nos Ministères
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Célébrations",
                  description: "Messes, sacrements et célébrations liturgiques",
                },
                {
                  title: "Formation",
                  description: "Catéchèse, études bibliques et développement spirituel",
                },
                {
                  title: "Service",
                  description: "Actions sociales et solidarité avec les plus démunis",
                },
              ].map((ministry, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {ministry.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {ministry.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Contact Information */}
          <motion.section variants={itemVariants} className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              Nous Contacter
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Adresse</p>
                    <p className="text-muted-foreground text-sm">
                      Rue de l'Aéroport<br />
                     01 BP 5341 Abidjan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Téléphone</p>
                    <p className="text-muted-foreground text-sm">
                      +225 01 23 45 67 89
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <p className="text-muted-foreground text-sm">
                      contact@paroisse-ndreconciliation.ci
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">Horaires</p>
                    <p className="text-muted-foreground text-sm">
                      Lun-Ven: 9h00 - 18h00<br />
                      Sam-Dim: 9h00 - 12h00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section
            variants={itemVariants}
            className="text-center py-8"
          >
            <p className="text-muted-foreground mb-6">
              Avez des questions ou souhaitez-vous en savoir plus ?
            </p>
            <Button size="lg">Nous Écrire</Button>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
