import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WELCOME_SPLASH_SESSION_KEY } from '@/lib/welcomeSplashStorage';

interface WelcomeModalProps {
  onClose?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
  autoCloseDelayMs?: number;
}

export default function WelcomeModal({
  onClose,
  autoCloseDelayMs = 10000,
}: WelcomeModalProps) {
  const [visible, setVisible] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);

  // Évite de relancer l'effet à chaque rendu parent (onClose inline) → timer réinitialisé en boucle.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    setVisible(false);
    try {
      sessionStorage.setItem(WELCOME_SPLASH_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    onCloseRef.current?.();
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WELCOME_SPLASH_SESSION_KEY)) {
        // Déjà affiché pendant cette session: informer le parent qu'on est terminé.
        onCloseRef.current?.();
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
    setSecondsLeft(Math.ceil(autoCloseDelayMs / 1000));
    requestAnimationFrame(() => setFadeIn(true));

    const closeTimer = setTimeout(handleClose, autoCloseDelayMs);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(closeTimer);
      clearInterval(interval);
    };
  }, [autoCloseDelayMs, handleClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
      aria-modal="true"
      aria-label="Bienvenue"
    >
      <div
        className="flex flex-col items-center justify-center px-8 max-w-md text-center"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s',
        }}
      >
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20">
          <img src="/logo.png" alt="Logo" className="h-20 w-20 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3">
          Heureux de vous accueillir 🙏
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-2">
          Retrouvez les dernières vidéos de messes, homélies et événements
          de votre paroisse.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          Connectez-vous pour commenter, sauvegarder vos vidéos
          et rester informé des nouvelles publications.
        </p>

        {/* Compteur 3D */}
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 text-white shadow-2xl"
          style={{
            boxShadow:
              '0 20px 40px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 1px 0 rgba(255,255,255,0.2) inset',
            textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
          }}
        >
          <span
            className="text-4xl font-black tabular-nums"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            {secondsLeft}
          </span>
          <div
            className="absolute inset-0 rounded-2xl opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          seconde{secondsLeft !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}