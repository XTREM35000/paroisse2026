/** Pseudo : minuscules, 3–30 caractères, lettres, chiffres, underscore, point */
export function validateUsername(username: string): string | null {
  const t = username.trim().toLowerCase();
  const regex = /^[a-z0-9._]{3,30}$/;
  if (!regex.test(t)) {
    return 'Format invalide (3-30 caractères, a-z, 0-9, _, .)';
  }
  return null;
}
