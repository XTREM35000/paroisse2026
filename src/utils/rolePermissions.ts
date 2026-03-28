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
  developer: 'developer',
  developper: 'developer',
};

const ROLE_ORDER: Record<string, number> = {
  guest: 0,
  member: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
  /** Plateforme : mêmes pouvoirs UI que super_admin (voir toutes les paroisses, master, etc.) */
  developer: 5,
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

/** Accès aux écrans / actions réservés au super_admin (inclut developer). */
export function isSuperAdminLevel(role?: string) {
  return roleRank(role) >= roleRank('super_admin');
}

/** Rôle effectif : le plus élevé entre le profil DB et les métadonnées JWT (corrige profil resté « membre »). */
export function mergeEffectiveRole(
  profileRole: string | null | undefined,
  user: { user_metadata?: object; app_metadata?: object } | null | undefined,
): string | null {
  const meta = (user?.user_metadata || {}) as Record<string, unknown>;
  const app = (user?.app_metadata || {}) as Record<string, unknown>;
  const fromJwt = [meta.role, app.role].find((v) => typeof v === 'string' && String(v).trim()) as string | undefined;
  const candidates = [profileRole, fromJwt].filter((v) => v != null && String(v).trim() !== '') as string[];

  let best: string | null = null;
  let bestRank = -1;
  for (const c of candidates) {
    const r = roleRank(c);
    if (r > bestRank) {
      bestRank = r;
      best = normalizeRole(c) ?? String(c).toLowerCase().trim();
    }
  }
  return best;
}

/** Libellé court pour affichage (profil, menus). */
export function formatRoleLabelForUi(role?: string | null): string {
  const n = normalizeRole(role ?? undefined) ?? String(role ?? '').toLowerCase().trim();
  switch (n) {
    case 'developer':
      return 'Développeur plateforme';
    case 'super_admin':
      return 'Super administrateur';
    case 'admin':
      return 'Administrateur';
    case 'moderator':
      return 'Modérateur';
    case 'member':
      return 'Membre';
    default:
      return role && String(role).trim() ? String(role) : 'Membre';
  }
}

export default { roleRank, canAccess, isAdmin, isSuperAdminLevel, mergeEffectiveRole, formatRoleLabelForUi };
