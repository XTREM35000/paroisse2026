/**
 * Splash d'accueil (compteur) — une fois par onglet (sessionStorage).
 * Doit rester aligné avec `WelcomeModal`.
 */
export const WELCOME_SPLASH_SESSION_KEY = 'welcome-splash-shown';

export function hasWelcomeSplashBeenShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(WELCOME_SPLASH_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
