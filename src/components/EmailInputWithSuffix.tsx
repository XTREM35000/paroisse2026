import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { stripAndNormalize } from '@/utils/emailSanitizer';

interface EmailInputWithSuffixProps {
  email: string;
  onEmailChange: (email: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  error?: string;
}

const EmailInputWithSuffix: React.FC<EmailInputWithSuffixProps> = ({
  email,
  onEmailChange,
  onValidationChange,
  error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    // STRIP MODE: Extract only the part before @
    const identifier = stripAndNormalize(value);
    
    onEmailChange(identifier);
    
    // Mark as valid if there's content
    if (identifier.trim()) {
      onValidationChange?.(true);
    } else {
      onValidationChange?.(false);
    }
  };

  const handleBlur = () => {
    // No auto-correction needed in strip mode
    // Just trim and normalize on blur
    if (email) {
      const normalized = stripAndNormalize(email);
      if (normalized !== email) {
        onEmailChange(normalized);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // No suggestions needed in strip mode
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="identifiant (ex: prenom.nom)"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          autoComplete="username"
          className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          aria-invalid={Boolean(error)}
        />
      </div>
      
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default EmailInputWithSuffix;
