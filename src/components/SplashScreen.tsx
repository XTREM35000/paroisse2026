import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      <div className="text-center">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Paroisse NDC
        </h1>
        <p className="text-muted-foreground mt-2">Plateforme paroissiale</p>
        <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-primary" />
      </div>
    </motion.div>
  );
};

