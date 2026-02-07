import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureProfileExists } from '@/utils/ensureProfileExists';

type PhoneOTPStep = 'initial' | 'code_sent' | 'verified';

interface PhoneOTPFormProps {
  onSuccess?: () => void;
}

const PhoneOTPForm: React.FC<PhoneOTPFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<PhoneOTPStep>('initial');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset messages when user starts typing
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    setErrorMessage('');
  };

  // Step 1: Send OTP via SMS
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setErrorMessage('Veuillez entrer un numéro de téléphone');
      return;
    }

    // Basic phone validation: must be international format or at least 8 digits
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setErrorMessage('Le numéro de téléphone doit contenir au moins 8 chiffres');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('[OTP] Envoi du code vers:', phoneNumber);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        console.error('[OTP] Erreur lors de l\'envoi:', error.message);
        setErrorMessage(error.message || 'Erreur lors de l\'envoi du code SMS');
        return;
      }

      console.log('[OTP] Code SMS envoyé avec succès');
      setSuccessMessage('Code SMS envoyé ! Vérifiez votre téléphone.');
      setStep('code_sent');
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      console.error('[OTP] Erreur d\'envoi:', err);
      const errorMsg = (err as Record<string, unknown>)?.message || 'Erreur lors de l\'envoi du code';
      setErrorMessage(String(errorMsg));
      toast({
        title: '❌ Erreur d\'envoi SMS',
        description: String(errorMsg),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP code
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim()) {
      setErrorMessage('Veuillez entrer le code à 6 chiffres');
      return;
    }

    if (otpCode.replace(/\D/g, '').length !== 6) {
      setErrorMessage('Le code doit contenir exactement 6 chiffres');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('[OTP] Vérification du code');
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: 'sms',
      });

      if (error) {
        console.error('[OTP] Erreur de vérification:', error.message);
        setErrorMessage(error.message || 'Code invalide ou expiré');
        return;
      }

      if (data?.user?.id) {
        console.log('[OTP] Authentification réussie, user ID:', data.user.id);
        setSuccessMessage('Connexion réussie !');
        
        // Ensure profile exists
        try {
          await ensureProfileExists(data.user.id);
        } catch (profileErr) {
          console.error('[OTP] Erreur lors de la création du profil:', profileErr);
          // Continue even if profile creation fails - user is still authenticated
        }

        setStep('verified');
        
        // Notify parent and trigger redirect
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1000);
      }
    } catch (err: unknown) {
      console.error('[OTP] Erreur de vérification:', err);
      const errorMsg = (err as Record<string, unknown>)?.message || 'Erreur lors de la vérification';
      setErrorMessage(String(errorMsg));
      toast({
        title: '❌ Erreur de vérification',
        description: String(errorMsg),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to initial state
  const handleReset = () => {
    setStep('initial');
    setPhoneNumber('');
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Step 1: Phone number input
  if (step === 'initial') {
    return (
      <form onSubmit={handlePhoneSubmit} className="space-y-3 w-full">
        <div>
          <label className="block text-xs font-medium mb-2 text-neutral-900">Numéro de téléphone</label>
          <input
            type="tel"
            placeholder="+225 10 XX XX XX XX"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-neutral-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Format international recommandé: +225 XX XX XX XX XX</p>
        </div>

        {errorMessage && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            {successMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !phoneNumber.trim()}
          className="w-full h-10 text-xs flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 active:bg-green-800"
        >
          <Phone className="w-4 h-4" />
          {isLoading ? 'Envoi du code...' : 'Envoyer le code par SMS'}
        </Button>
      </form>
    );
  }

  // Step 2: OTP code input
  if (step === 'code_sent') {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-3 w-full">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Un code à 6 chiffres a été envoyé au <strong>{phoneNumber}</strong>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 text-neutral-900">Code de vérification</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={otpCode}
            onChange={(e) => handleOtpChange(e.target.value.replace(/\D/g, ''))}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-neutral-900 placeholder:text-gray-500 text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Entrez les 6 chiffres reçus par SMS</p>
        </div>

        {errorMessage && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            {successMessage}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading || otpCode.length !== 6}
            className="flex-1 h-10 text-xs bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          >
            {isLoading ? 'Vérification...' : 'Vérifier le code'}
          </Button>
          <Button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1 h-10 text-xs bg-gray-300 text-gray-700 hover:bg-gray-400"
          >
            Retour
          </Button>
        </div>
      </form>
    );
  }

  // Step 3: Success state (brief display)
  return (
    <div className="space-y-3 w-full text-center">
      <div className="p-3 bg-green-50 border border-green-200 rounded">
        <p className="text-xs text-green-700 font-medium">✓ Connexion réussie !</p>
        <p className="text-xs text-green-600 mt-1">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default PhoneOTPForm;
