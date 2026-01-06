import { motion } from "framer-motion";
import { HelpCircle, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const HelpPage = () => {
  const navigate = useNavigate();
  const faqItems = [
    {
      question: "Comment me connecter?",
      answer: "Cliquez sur l'icône utilisateur en haut à droite du header pour ouvrir le formulaire d'authentification."
    },
    {
      question: "Comment regarder les vidéos?",
      answer: "Allez à la section 'Vidéos' dans le sidebar ou le header pour accéder à tous nos contenus vidéo."
    },
    {
      question: "Comment faire un don?",
      answer: "Rendez-vous à la section 'Donations' > 'Faire un don' pour contribuer à notre paroisse."
    },
    {
      question: "Puis-je me désabonner?",
      answer: "Vous pouvez accéder à vos paramètres de compte dans votre profil pour gérer vos préférences."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Centre d'aide</h1>
          <p className="text-lg text-muted-foreground">
            Trouver des réponses à vos questions
          </p>
        </motion.div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4 mb-12">
          {faqItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {item.question}
              </h3>
              <p className="text-muted-foreground">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <div className="max-w-2xl mx-auto bg-accent/5 border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Besoin d'aide supplémentaire?
          </h2>
          <p className="text-muted-foreground mb-6">
            Contactez-nous via le chat en direct ou envoyez-nous un email.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="default" size="lg" className="gap-2" onClick={() => navigate('/chat')}>
              <MessageSquare className="h-5 w-5" />
              Chat en direct
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Mail className="h-5 w-5" />
              Email
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpPage;
