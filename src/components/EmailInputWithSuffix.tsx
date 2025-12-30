import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const EMAIL_SUFFIXES = ['gmail.com', 'outlook.fr', 'icloud.com', 'yahoo.fr'];

interface EmailInputWithSuffixProps {
  email: string;
  onEmailChange: (email: string) => void;
}

const EmailInputWithSuffix: React.FC<EmailInputWithSuffixProps> = ({
  email,
  onEmailChange,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuffixes, setFilteredSuffixes] = useState<string[]>(EMAIL_SUFFIXES);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (value: string) => {
    onEmailChange(value);

    if (value.includes('@')) {
      const parts = value.split('@');
      const suffix = parts[1]?.toLowerCase() || '';

      if (suffix.length > 0) {
        const filtered = EMAIL_SUFFIXES.filter(s => s.startsWith(suffix));
        setFilteredSuffixes(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setFilteredSuffixes(EMAIL_SUFFIXES);
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuffix = (suffix: string) => {
    const parts = email.split('@');
    onEmailChange(`${parts[0]}@${suffix}`);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="email"
        placeholder="votre@email.com"
        value={email}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => email.includes('@') && setShowSuggestions(true)}
      />

      <AnimatePresence>
        {showSuggestions && filteredSuffixes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 mt-1 overflow-hidden"
          >
            {filteredSuffixes.map((suffix, index) => (
              <motion.button
                key={suffix}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                type="button"
                onClick={() => selectSuffix(suffix)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors border-b border-border/50 last:border-b-0"
              >
                <span className="text-muted-foreground">@</span>
                <span className="font-medium">{suffix}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailInputWithSuffix;
