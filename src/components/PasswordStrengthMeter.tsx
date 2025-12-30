import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (pwd: string) => {
    let strength = 0;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(pwd),

    };

    if (checks.length) strength += 25;
    if (checks.uppercase) strength += 25;
    if (checks.number) strength += 25;
    if (checks.special) strength += 25;

    return { strength, checks };
  };

  const { strength, checks } = calculateStrength(password);

  const getColor = (str: number) => {
    if (str < 25) return 'bg-red-500';
    if (str < 50) return 'bg-orange-500';
    if (str < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = (str: number) => {
    if (str === 0) return '';
    if (str < 25) return 'Faible';
    if (str < 50) return 'Moyen';
    if (str < 75) return 'Fort';
    return 'Très fort';
  };

  const getEmoji = (str: number) => {
    if (str === 0) return '';
    if (str < 25) return '🔴';
    if (str < 50) return '🟡';
    if (str < 75) return '🟢';
    return '💚';
  };

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Barre de progression */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor(strength)}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {/* Label et critères */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">
          {getEmoji(strength)} {getLabel(strength)}
        </p>
      </div>

      {/* Checklist des critères */}
      <div className="text-xs space-y-1">
        <div className={`flex items-center gap-2 ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.length ? '✓' : '○'}</span>
          <span>Au moins 8 caractères</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.uppercase ? '✓' : '○'}</span>
          <span>Une lettre majuscule</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.number ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.number ? '✓' : '○'}</span>
          <span>Un chiffre</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.special ? 'text-green-600' : 'text-gray-400'}`}>
          <span>{checks.special ? '✓' : '○'}</span>
          <span>Un caractère spécial (!@#$%...)</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
