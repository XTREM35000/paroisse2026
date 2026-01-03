// // src/hooks/useHeroBanner.ts
// import { supabase } from '@/integrations/supabase/client';
// import { useQuery } from '@tanstack/react-query';

// // Définir l'interface localement
// export interface HeroBannerData {
//   id: string;
//   path: string;
//   title: string;
//   subtitle: string;
//   background_image: string;
//   buttons?: Array<{
//     text: string;
//     link: string;
//     variant: 'primary' | 'secondary' | 'outline';
//   }>;
//   is_active: boolean;
//   created_at: string;
//   updated_at: string;
// }

// export const useHeroBanner = (path: string) => {
//   return useQuery({
//     queryKey: ['hero-banner', path],
//     queryFn: async (): Promise<HeroBannerData | null> => {
//       try {
//         // Utiliser une requête directe avec type casting
//         const { data, error } = await supabase
//           .from('page_hero_banners')
//           .select('*')
//           .eq('path', path)
//           .eq('is_active', true)
//           .single();
        
//         if (error) {
//           // Si pas de bannière trouvée, retourner null
//           if (error.code === 'PGRST116') {
//             return null;
//           }
//           throw error;
//         }
        
//         // Cast vers le type correct
//         return data as HeroBannerData;
//       } catch (error) {
//         console.error('Erreur lors de la récupération de la bannière:', error);
//         return null;
//       }
//     },
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };