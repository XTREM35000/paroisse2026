import HeroBanner from '@/components/HeroBanner';
import { RoleManager } from '@/components/admin/RoleManager';

export default function AdminRoles() {
  return (
    <>
      <HeroBanner pageKey="/admin/roles" />
      <RoleManager />
    </>
  );
}
