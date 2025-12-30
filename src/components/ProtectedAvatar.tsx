import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedAvatarProps {
  path?: string | null;
  alt?: string;
  className?: string;
  fallback?: string;
}

const ProtectedAvatar: React.FC<ProtectedAvatarProps> = ({ path, alt = 'Avatar', className, fallback = '/images/avatar-default.png' }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>(fallback);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!path) {
        setAvatarUrl(fallback);
        return;
      }

      try {
        const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';
        const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = data?.publicUrl;
        if (!publicUrl) {
          setAvatarUrl(fallback);
          return;
        }

        // Vérifier que l'image existe
        const img = new Image();
        img.onload = () => {
          if (mounted) setAvatarUrl(publicUrl);
        };
        img.onerror = () => {
          if (mounted) setAvatarUrl(fallback);
        };
        img.src = publicUrl;
      } catch (err) {
        console.error('Error loading avatar:', err);
        if (mounted) setAvatarUrl(fallback);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [path, fallback]);

  return <img src={avatarUrl} alt={alt} className={className} />;
};

export default ProtectedAvatar;
