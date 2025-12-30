import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import BaseModal from './base-modal';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, isOpen]);

  // Empêcher le scroll de la page quand le modal est ouvert
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <BaseModal open={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-md md:max-w-2xl max-h-[90vh] bg-background/95 backdrop-blur-sm rounded-lg shadow-2xl border border-border/50 flex flex-col overflow-hidden"
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="h-6 w-6 text-muted-foreground hover:text-foreground" />
        </motion.button>

        <div className="overflow-y-auto flex-1 px-4 py-4 md:px-6 md:py-6">
          <div className="flex gap-6 items-stretch">
            {/* Branding Section */}
            <div className="hidden md:flex flex-col items-center justify-center w-1/3">
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src="/logo.png"
                alt="Paroisse"
                className="w-24 h-24 object-contain"
              />
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-xl font-semibold text-center"
              >
                Paroisse
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground mt-2 text-center"
              >
                Connectez-vous ou créez un compte
              </motion.p>
            </div>

            {/* Form Section */}
            <div className="w-full md:w-2/3 flex flex-col min-h-[300px]" style={{ minWidth: 280 }}>
              {/* Tabs */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">{mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode('login')}
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-300 ${
                      mode === 'login' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Connexion
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode('register')}
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-300 ${
                      mode === 'register' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Inscription
                  </motion.button>
                </div>
              </div>

              {/* Form Content with Smooth Transition */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1"
                >
                  {mode === 'login' ? <LoginForm onSuccess={onClose} /> : <RegisterForm onSuccess={onClose} />}
                </motion.div>
              </AnimatePresence>

              {/* Cancel Button */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 flex justify-end">
                <Button variant="outline" onClick={onClose} className="px-6" size="sm">
                  Annuler
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </BaseModal>
  );
};

export default AuthModal;
