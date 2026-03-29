import { supabase } from '@/integrations/supabase/client';

const DEVELOPER_EMAIL = 'dibothierrygogo@gmail.com';
const DEVELOPER_PASSWORD = 'P2024Mano"';

const CREATE_DEV_FN = 'create-developer';

export const ensureDeveloperAccount = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
      return;
    }
    if (session?.user) {
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: DEVELOPER_EMAIL,
      password: DEVELOPER_PASSWORD,
    });

    if (!signInError) {
      return;
    }

    const msg = String(signInError.message ?? '');
    const looksLikeMissingUser =
      msg.includes('Invalid login credentials') ||
      msg.toLowerCase().includes('invalid');

    if (looksLikeMissingUser) {
      const { error: fnError } = await supabase.functions.invoke(CREATE_DEV_FN, {
        body: {
          email: DEVELOPER_EMAIL,
          password: DEVELOPER_PASSWORD,
          full_name: 'Thierry Gogo',
          phone: '+2250758966156',
        },
      });
      if (fnError) throw fnError;
      console.log('[Init] Developer account created');
    } else {
      console.warn('[Init] Developer sign-in skipped:', msg);
    }
  } catch (error) {
    console.error('[Init] Developer account error:', error);
  }
};
