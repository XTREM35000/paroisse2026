const ROLE_ALIASES: Record<string, string> = {
  administrateur: 'admin',
  admin: 'admin',
  membre: 'member',
  member: 'member',
  moderator: 'moderator',
  moderateur: 'moderator',
  super_admin: 'super_admin',
  superadmin: 'super_admin',
  'super-admin': 'super_admin',
};

const ROLE_ORDER: Record<string, number> = {
  guest: 0,
  member: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

function normalizeRole(role?: string) {
  if (!role) return undefined;
  const lower = String(role).toLowerCase().trim();
  return ROLE_ALIASES[lower] ?? lower;
}

export function roleRank(role?: string) {
  const norm = normalizeRole(role);
  if (!norm) return 0;
  return ROLE_ORDER[norm] ?? 0;
}

export function canAccess(userRole: string | undefined, requiredRole: string) {
  return roleRank(userRole) >= roleRank(requiredRole);
}

export function isAdmin(role?: string) {
  return roleRank(role) >= roleRank('admin');
}

export default { roleRank, canAccess, isAdmin };
