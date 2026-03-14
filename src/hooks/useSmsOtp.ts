// src/hooks/useSmsOtp.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useSmsOtp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAndSendOtp = useCallback(async (phoneNumber: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Générer un code OTP (6 chiffres)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Stocker le code dans Supabase avec expiration
      const { error: dbError } = await supabase
        .from('otp_codes')
        .upsert({
          phone_number: phoneNumber,
          code: otpCode,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          used: false
        }, {
          onConflict: 'phone_number'
        });

      if (dbError) throw dbError;

      // 3. Envoyer le SMS via la fonction Edge
      const { error: fnError } = await supabase.functions.invoke('send-sms-otp', {
        body: { phoneNumber, code: otpCode }
      });

      if (fnError) throw fnError;

      toast({
        title: "Code envoyé",
        description: `Un code de confirmation a été envoyé au ${phoneNumber}`,
      });

      return true;

    } catch (err) {
      const message = err.message || 'Erreur lors de l\'envoi du code';
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return false;

    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyOtp = useCallback(async (phoneNumber: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Vérifier le code en base
      const { data, error } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error('Code invalide ou expiré');
      }

      // Marquer le code comme utilisé
      await supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', data.id);

      // Authentifier l'utilisateur avec Supabase
      const { error: signInError } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (signInError) throw signInError;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur la Paroisse NDC !",
      });

      return true;

    } catch (err) {
      const message = err.message || 'Code incorrect';
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return false;

    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    generateAndSendOtp,
    verifyOtp,
    loading,
    error
  };
};