import { supabase } from '@/integrations/supabase/client';
import { runFullSystemClean } from '@/lib/fullSystemClean';

const CREATE_DEV_FN = 'create-developer';

/**
 * Nettoyage serveur (RPC), recréation du compte développeur, vidage du stockage local, puis redirection dure.
 * Utilisé par le bouton CLEAN du SetupWizard et le flux « nettoyage RPC » côté admin master.
 */
export async function performFullCleanup(): Promise<void> {
  const res = await runFullSystemClean(supabase);
  if (!res.ok) {
    throw new Error(`Échec du nettoyage RPC : ${res.message}`);
  }

  const { error: devError } = await supabase.functions.invoke(CREATE_DEV_FN, {
    body: {
      email: 'dibothierrygogo@gmail.com',
      password: 'P2024Mano"',
      full_name: 'Thierry Gogo',
      phone: '+2250758966156',
    },
  });

  if (devError) {
    throw devError;
  }

  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  window.location.href = '/';
}
