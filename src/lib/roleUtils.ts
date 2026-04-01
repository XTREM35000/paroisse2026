import { supabase } from '@/integrations/supabase/client';
import { SystemRole } from '@/types/roles';

const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  developer: 'Développeur',
  super_admin: 'Super Admin',
  admin: 'Administrateur',
  member: 'Membre',
  guest: 'Invité',
};

export const SYSTEM_ROLES: SystemRole[] = ['developer', 'super_admin', 'admin', 'member', 'guest'];

export const displayRole = (role?: string | null): string => {
  if (!role) return 'Invité';

  const lower = role.toLowerCase();

  if (lower === 'developer') return SYSTEM_ROLE_LABELS.developer;
  if (lower === 'super_admin') return SYSTEM_ROLE_LABELS.super_admin;
  if (lower === 'admin') return SYSTEM_ROLE_LABELS.admin;
  if (lower === 'member') return SYSTEM_ROLE_LABELS.member;
  if (lower === 'guest') return SYSTEM_ROLE_LABELS.guest;

  if (lower === 'membre') return 'Membre';
  if (['moderator', 'moderateur'].includes(lower)) return 'Modérateur';
  if (['pretre', 'priest'].includes(lower)) return 'Prêtre';
  if (['diacre'].includes(lower)) return 'Diacre';

  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const getAvailableRoles = async (
  includeGuest: boolean = true,
): Promise<{ value: string; label: string; isSystem: boolean }[]> => {
  const roles: { value: string; label: string; isSystem: boolean }[] = [];

  const systemRoles = ['super_admin', 'admin', 'member'];
  if (includeGuest) systemRoles.push('guest');

  for (const role of systemRoles) {
    roles.push({
      value: role,
      label: SYSTEM_ROLE_LABELS[role as SystemRole],
      isSystem: true,
    });
  }

  try {
    const { data: dynamicRoles, error } = await supabase
      .from('roles')
      .select('name, description')
      .eq('is_system', false)
      .order('name');

    if (!error && dynamicRoles) {
      for (const role of dynamicRoles) {
        roles.push({
          value: role.name,
          label: displayRole(role.name),
          isSystem: false,
        });
      }
    }
  } catch (e) {
    console.warn('Erreur chargement rôles dynamiques:', e);
  }

  return roles;
};

export const isSystemRole = (roleName: string): boolean => {
  return SYSTEM_ROLES.includes(roleName as SystemRole);
};

export const normalizeRoleName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
};

export const validateRoleName = (name: string): { valid: boolean; error?: string } => {
  const normalized = normalizeRoleName(name);

  if (normalized.length < 3) {
    return { valid: false, error: 'Le nom du rôle doit contenir au moins 3 caractères' };
  }

  if (normalized.length > 50) {
    return { valid: false, error: 'Le nom du rôle ne doit pas dépasser 50 caractères' };
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return {
      valid: false,
      error: 'Le nom du rôle ne peut contenir que des lettres minuscules, des chiffres et des underscores',
    };
  }

  if (SYSTEM_ROLES.includes(normalized as SystemRole)) {
    return { valid: false, error: 'Ce nom est réservé aux rôles système' };
  }

  return { valid: true };
};

export const roleLabels: Record<string, string> = SYSTEM_ROLE_LABELS;

export const getRoleLabel = (roleName: string): string => {
  return roleLabels[roleName] || displayRole(roleName);
};
