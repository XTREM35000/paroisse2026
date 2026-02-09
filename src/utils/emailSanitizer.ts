/**
 * Email Sanitizer & Validator
 * Centralizes email cleaning, normalization and validation logic
 * Prevents invalid emails like: gmail.com, @gmail.com, gmailcom, etc.
 */

/**
 * STRIP MODE: Extract only the part before @ (identifier only)
 * This is the PRIMARY function for the new simplified approach
 * 
 * Examples:
 * - "test@gmail.com" → "test"
 * - "prenom.nom@outlook.com" → "prenom.nom"
 * - "gmail.com" → "gmail.com" (no @ so no stripping)
 * - "abc@xyz@domain.com" → "abc" (first @ only)
 * 
 * @param input - Raw user input
 * @returns - Only the part before the first @, or the whole input if no @
 */
export function stripEmailDomain(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Trim whitespace
  const trimmed = input.trim();
  
  // Find first @ and return only the part before it
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) {
    // No @ found, return as-is (could be "gmail.com" or any other input)
    return trimmed;
  }
  
  // Return only the part before the first @
  return trimmed.substring(0, atIndex);
}

/**
 * Normalize identifier (for username/email local part)
 * Lowercase and trim whitespace
 */
export function normalizeIdentifier(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

/**
 * Combined: Strip domain AND normalize
 * Use this in form handlers (onChange, onBlur, onSubmit)
 */
export function stripAndNormalize(input: string): string {
  const stripped = stripEmailDomain(input);
  return normalizeIdentifier(stripped);
}

// ========== Legacy functions (kept for backward compatibility, but not recommended) ==========

// Common email domains to block (when entered as full domain only)
const BLOCKED_DOMAINS = new Set([
  'gmail.com', 'gmailcom',
  'yahoo.com', 'yahoo.fr', 'yahoofr',
  'hotmail.com', 'hotmail.fr', 'hotmailcom',
  'outlook.com', 'outlook.fr', 'outlookcom',
  'icloud.com', 'icloudcom',
  'live.com', 'livecom',
]);

// Common typos and domain variations
const DOMAIN_CORRECTIONS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmial.fr': 'gmail.fr',
  'gmai.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'otmail.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outcook.com': 'outlook.com',
  'iclou.com': 'icloud.com',
  'lve.com': 'live.com',
};

/**
 * Retourne la liste consolidée des domaines connus (bloqués, corrections et valeurs courantes)
 */
export function getKnownDomains(): string[] {
  const set = new Set<string>()
  BLOCKED_DOMAINS.forEach(d => set.add(d))
  Object.keys(DOMAIN_CORRECTIONS).forEach(k => set.add(k))
  Object.values(DOMAIN_CORRECTIONS).forEach(v => set.add(v))
  const extras = [
    'gmail.com',
    'yahoo.com',
    'yahoo.fr',
    'hotmail.com',
    'hotmail.fr',
    'outlook.com',
    'outlook.fr',
    'icloud.com',
    'live.com',
  ]
  extras.forEach(e => set.add(e))
  return Array.from(set)
}

/**
 * Validate email against RFC 5322 basic pattern
 * Returns true only for properly formatted emails: localpart@domain.tld
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Must contain @ and at least one dot in domain
  if (!email.includes('@') || email.split('@').length !== 2) return false;

  const [localPart, domain] = email.split('@');

  // Local part: 1-64 chars, no consecutive dots, no leading/trailing dots
  if (!localPart || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;

  // Domain: must contain at least one dot, valid chars
  if (!domain || domain.length < 5) return false; // min: a@b.co
  if (!domain.includes('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false;

  // Check valid characters (alphanumeric, dots, hyphens)
  const validChars = /^[a-zA-Z0-9._-]+$/;
  if (!validChars.test(localPart)) return false;
  if (!validChars.test(domain)) return false;

  // TLD must have at least 2 chars
  const parts = domain.split('.');
  if (parts[parts.length - 1].length < 2) return false;

  return true;
}

/**
 * Normalize email: trim, lowercase, remove leading/trailing spaces
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize email: clean up common input errors
 * - Remove leading @ or space before domain
 * - Prevent domain-only inputs
 * - Suggest corrections for typos
 */
export function sanitizeEmail(email: string): {
  cleaned: string;
  isValid: boolean;
  error: string | null;
  suggestion: string | null;
} {
  const cleaned = normalizeEmail(email);

  // Empty check
  if (!cleaned) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Veuillez entrer votre adresse email',
      suggestion: null,
    };
  }

  // Check if input is just a domain (e.g., "gmail.com", "@yahoo.fr")
  if (cleaned.startsWith('@') || !cleaned.includes('@')) {
    const potentialDomain = cleaned.startsWith('@') ? cleaned.substring(1) : cleaned;
    if (BLOCKED_DOMAINS.has(potentialDomain)) {
      return {
        cleaned: '',
        isValid: false,
        error: `Émail incomplet. Veuillez saisir une adresse email complète (ex: prenom.nom@${potentialDomain})`,
        suggestion: null,
      };
    }
    // Not recognized as blocked domain, but still missing local part
    if (!cleaned.includes('@')) {
      return {
        cleaned: '',
        isValid: false,
        error: 'Veuillez saisir une adresse email complète et valide (ex: prenom.nom@gmail.com)',
        suggestion: null,
      };
    }
  }

  // Check for leading @
  if (cleaned.startsWith('@')) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Format email invalide. Veuillez saisir une adresse email complète (ex: prenom.nom@gmail.com)',
      suggestion: null,
    };
  }

  const [localPart, domain] = cleaned.split('@');

  // Check for missing local part
  if (!localPart || localPart.length === 0) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Veuillez saisir une adresse email complète (exemple: prenom.nom@gmail.com)',
      suggestion: null,
    };
  }

  // Check for missing domain
  if (!domain || domain.length === 0) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Domaine email manquant (exemple: prenom.nom@gmail.com)',
      suggestion: null,
    };
  }

  // Check for typos in domain and suggest corrections
  let correctedDomain = domain;
  let suggestion = null;

  if (DOMAIN_CORRECTIONS[domain]) {
    correctedDomain = DOMAIN_CORRECTIONS[domain];
    suggestion = `${localPart}@${correctedDomain}`;
  }

  const finalEmail = `${localPart}@${correctedDomain}`;

  // Validate the final email
  if (!isValidEmail(finalEmail)) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Format email invalide. Veuillez vérifier votre adresse (ex: prenom.nom@gmail.com)',
      suggestion,
    };
  }

  return {
    cleaned: finalEmail,
    isValid: true,
    error: null,
    suggestion,
  };
}

/**
 * Check if input is a known domain entered alone
 * Used for real-time validation during typing
 */
export function isDomainOnly(input: string): boolean {
  const cleaned = normalizeEmail(input);
  if (!cleaned) return false;

  // Remove leading @ if present
  const domainToCheck = cleaned.startsWith('@') ? cleaned.substring(1) : cleaned;

  // If input contains @, it's not domain-only
  if (cleaned.includes('@')) return false;

  // Check if it matches a blocked domain
  return BLOCKED_DOMAINS.has(domainToCheck);
}

/**
 * Get real-time validation state during typing
 * Used by form components for immediate feedback
 */
export function getRealTimeValidation(input: string): {
  isValid: boolean;
  isDomainOnly: boolean;
  isEmpty: boolean;
  message: string;
} {
  const cleaned = normalizeEmail(input);

  if (!cleaned) {
    return {
      isValid: false,
      isDomainOnly: false,
      isEmpty: true,
      message: '',
    };
  }

  const isDomOnly = isDomainOnly(cleaned);
  if (isDomOnly) {
    const domain = cleaned.startsWith('@') ? cleaned.substring(1) : cleaned;
    return {
      isValid: false,
      isDomainOnly: true,
      isEmpty: false,
      message: `Format incomplet. Complétez avec: prenom.nom@${domain}`,
    };
  }

  if (!cleaned.includes('@')) {
    return {
      isValid: false,
      isDomainOnly: false,
      isEmpty: false,
      message: 'Email incomplet (manque: @domaine.com)',
    };
  }

  const fullValidation = sanitizeEmail(cleaned);
  return {
    isValid: fullValidation.isValid,
    isDomainOnly: false,
    isEmpty: false,
    message: fullValidation.error || '',
  };
}

/**
 * Autocorrect common mistakes in email
 * Returns corrected email or original if no correction found
 */
export function autocorrectEmail(email: string): string {
  const sanitized = sanitizeEmail(email);

  if (sanitized.suggestion) {
    return sanitized.suggestion;
  }

  return sanitized.cleaned || email;
}

/**
 * Detect and separate domain accidentally typed in local part
 * Example: "20214dibogmail.com" → { localPart: "20214dibog", domain: "gmail.com" }
 * Returns null if no domain detected
 */
export function detectAndSeparateDomain(input: string): {
  localPart: string;
  domain: string;
} | null {
  if (!input || !input.includes('.')) return null;

  const parts = input.split('.');
  const lastPart = parts[parts.length - 1];

  // Check if last part looks like a TLD (2-6 chars, letters only)
  if (lastPart.length < 2 || lastPart.length > 6) return null;
  if (!/^[a-z]+$/.test(lastPart)) return null;

  // Try to find a known domain ending
  const knownDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.fr',
    'hotmail.com',
    'hotmail.fr',
    'outlook.com',
    'outlook.fr',
    'icloud.com',
    'live.com',
  ];

  // Check if last 2 parts form a known domain
  if (parts.length >= 2) {
    const lastTwoParts = [parts[parts.length - 2], parts[parts.length - 1]].join('.');
    if (knownDomains.includes(lastTwoParts)) {
      const localPart = parts.slice(0, -2).join('.');
      return localPart ? { localPart, domain: lastTwoParts } : null;
    }
  }

  // If TLD is 2 or 3 chars (likely real TLD), separate it
  if (lastPart.length === 2 || lastPart.length === 3) {
    const secondLastPart = parts[parts.length - 2];
    if (secondLastPart && /^[a-z0-9-]+$/.test(secondLastPart)) {
      const localPart = parts.slice(0, -2).join('.');
      const domain = [secondLastPart, lastPart].join('.');
      return localPart ? { localPart, domain } : null;
    }
  }

  return null;
}
