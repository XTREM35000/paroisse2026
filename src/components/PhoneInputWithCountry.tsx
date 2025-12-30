import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const COUNTRIES = [
  { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+229', name: 'Bénin', flag: '🇧🇯' },
  { code: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: '+32', name: 'Belgique', flag: '🇧🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+44', name: 'Angleterre', flag: '🇬🇧' },
  { code: '+39', name: 'Italie', flag: '🇮🇹' },
  { code: '+49', name: 'Allemagne', flag: '🇩🇪' },
];

interface PhoneInputWithCountryProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
}

const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  phone,
  onPhoneChange,
  countryCode,
  onCountryChange,
}) => {
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={onCountryChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Pays" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                {country.flag} {country.code}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder="XX XX XX XX"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="flex-1"
      />
    </div>
  );
};

export default PhoneInputWithCountry;
