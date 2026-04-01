/**
 * Affiche un label lisible pour un rôle utilisateur
 * Supporte les 5 rôles système + rôles dynamiques
 */
export const displayRole = (role?: string | null): string => {
  if (!role) return 'Invité';

  const lower = role.toLowerCase();

  // Rôles système
  if (lower === 'developer') return 'Développeur';
  if (lower === 'super_admin') return 'Super Admin';
  if (lower === 'admin') return 'Administrateur';
  if (lower === 'member') return 'Membre';
  if (lower === 'guest') return 'Invité';

  // Compatibilité anciennes valeurs (si encore présentes)
  if (lower === 'membre') return 'Membre';
  if (['moderator', 'moderateur'].includes(lower)) return 'Modérateur';
  if (['pretre', 'priest'].includes(lower)) return 'Prêtre';
  if (['diacre'].includes(lower)) return 'Diacre';

  // Rôle dynamique (créé par super admin)
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const getAvailableRoles = (includeGuest: boolean = true): { value: string; label: string }[] => {
  const roles = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'member', label: 'Membre' },
  ];

  if (includeGuest) {
    roles.push({ value: 'guest', label: 'Invité' });
  }

  return roles;
};

export const roleLabels: Record<string, string> = {
  developer: 'Développeur',
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  member: 'Membre',
  guest: 'Invité',
};

export const getRoleLabel = (roleName: string): string => {
  return roleLabels[roleName] || roleName;
};
