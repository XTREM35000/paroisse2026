import HeroBanner from '@/components/HeroBanner';
import { OfficiantManager } from '@/components/admin/OfficiantManager';

export default function AdminOfficiants() {
  return (
    <>
      <HeroBanner pageKey="/admin/officiants" />
      <OfficiantManager />
    </>
  );
}
