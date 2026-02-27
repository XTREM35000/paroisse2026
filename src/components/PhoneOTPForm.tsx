import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ensureProfileExists } from '@/utils/ensureProfileExists';

type PhoneOTPStep = 'initial' | 'code_sent' | 'verified';

interface PhoneOTPFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PhoneOTPForm: React.FC<PhoneOTPFormProps> = ({ onSuccess, onCancel }) => {
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
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Vérification par téléphone</h3>
          <p className="text-sm text-gray-600">
            Entrez votre numéro de téléphone pour recevoir un code de vérification
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => onCancel && onCancel()} className="text-sm text-gray-600 hover:text-gray-900">Revenir</button>
            <button type="button" onClick={() => onCancel && onCancel()} className="text-sm text-gray-600 hover:text-gray-900">Fermer</button>
          </div>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Numéro de téléphone
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">+</span>
              </div>
              <input
                type="tel"
                placeholder="XX XX XX XX XX"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isLoading}
                className="block w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                autoComplete="tel"
              />
            </div>
            <p className="text-xs text-gray-500">
              Format international recommandé. Exemple: +225 07 12 34 56 78
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Recevoir le code par SMS
              </span>
            )}
          </Button>
        </form>
      </div>
    );
  }

  // Step 2: OTP code input
  if (step === 'code_sent') {
    return (
      <div className="space-y-4 min-h-[520px]">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Code de vérification</h3>
          <p className="text-sm text-gray-600">
            Entrez le code à 6 chiffres envoyé au
          </p>
          <p className="text-sm font-medium text-gray-900">{phoneNumber}</p>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={handleReset} className="text-sm text-gray-600 hover:text-gray-900">Revenir</button>
            <button type="button" onClick={() => onCancel && onCancel()} className="text-sm text-gray-600 hover:text-gray-900">Fermer</button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Le code SMS peut prendre quelques secondes à arriver. Vérifiez vos messages.
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Code de vérification
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[index] || ''}
                  onChange={(e) => {
                    const newOtp = otpCode.split('');
                    newOtp[index] = e.target.value.replace(/\D/g, '');
                    const newOtpStr = newOtp.join('');
                    setOtpCode(newOtpStr);
                    
                    // Auto-focus next input
                    if (e.target.value && index < 5) {
                      const nextInput = document.getElementById(`otp-input-${index + 1}`);
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-input-${index - 1}`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  disabled={isLoading}
                  id={`otp-input-${index}`}
                  className="w-12 h-12 text-center text-lg font-semibold text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all duration-200"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Entrez les 6 chiffres reçus par SMS
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Vérification...
                </span>
              ) : (
                'Vérifier le code'
              )}
            </Button>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                variant="outline"
                className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Changer de numéro
              </Button>
              
              <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={isLoading}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Renvoyer le code
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Step 3: Success state
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">Connexion réussie !</h3>
        <p className="text-sm text-gray-600">
          Votre numéro <span className="font-medium text-gray-900">{phoneNumber}</span> a été vérifié
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={handleReset} className="text-sm text-gray-600 hover:text-gray-900">Revenir</button>
          <button type="button" onClick={() => onCancel && onCancel()} className="text-sm text-gray-600 hover:text-gray-900">Fermer</button>
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-green-800">Redirection en cours...</p>
        </div>
      </div>
    </div>
  );
};

export default PhoneOTPForm;