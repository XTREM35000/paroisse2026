import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";import { useQueryClient } from '@tanstack/react-query';import HeroBanner from "@/components/HeroBanner";
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { useGalleryImages } from "@/hooks/useGalleryImages";
import { useAuthContext } from '@/hooks/useAuthContext';
import GalleryCard from "@/components/GalleryCard";
import GalleryGrid from "@/components/GalleryGrid";
import FileUploadZone from '@/components/FileUploadZone';
import ArchiveCard from '@/components/ArchiveCard';
import useArchives from '@/hooks/useArchives';
import type { GalleryImage } from '@/types/database';

const GalleryPage = () => {
  const { images, loading } = useGalleryImages(100);
  const { user } = useAuthContext();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  const categories = useMemo(
    () =>
      Array.from(
          new Set(
            (images as GalleryImage[])
              ?.map((img) => img.category?.name ?? null)
              .filter(Boolean) ?? []
          )
        ).sort(),
    [images]
  );

  const filteredImages = useMemo(() => {
    if (!images) return [];

    return (images as GalleryImage[]).filter((img) => {
      const title = img.title || '';
      const desc = img.description || '';
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase());
      const imgCategory = img.category?.name ?? 'all';
      const matchesCategory = selectedCategory === 'all' || imgCategory === selectedCategory;
      // Chacun voit ses propres images (même pending) + les images approuvées + admin voit tout
      const isVisible = isAdmin || img.status === 'approved' || img.user_id === user?.id;
      return matchesSearch && matchesCategory && isVisible;
    });
  }, [images, searchTerm, selectedCategory, isAdmin, user?.id]);

function GalleryArchivesList({ mediaType }: { mediaType?: string }) {
  const { useList } = useArchives();
  const { data: archives, isLoading } = useList(mediaType);

  if (isLoading) return <div>Chargement des archives...</div>;

  return (
    <div className="space-y-3">
      {archives?.length ? (
        (archives as any[]).map((a) => <ArchiveCard key={a.id} archive={a} />)
      ) : (
        <div className="text-sm text-muted-foreground">Aucune archive partagée pour le moment.</div>
      )}
    </div>
  );
}

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header provided by Layout */}
      
      <HeroBanner
        title="Galerie"
        subtitle="Découvrez nos plus beaux moments et événements"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher dans la galerie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-muted/30"
            />
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Tous
              </motion.button>
              {categories.map((cat: string) => (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upload zone & archives (admins) */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {(isAdmin) ? (
                <FileUploadZone mediaType="images" onUploaded={() => queryClient.invalidateQueries({ queryKey: ['archives', 'images'] })} />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Seuls les administrateurs peuvent téléverser des archives ZIP.</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Archives partagées</h3>
              <GalleryArchivesList mediaType="images" />
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <GalleryGrid
          images={filteredImages as GalleryImage[]}
          loading={loading}
          onOpen={(img) => {
            /* TODO: open modal/lightbox */
            console.log('Open image', img.id);
          }}
        />
      </div>

      {/* Footer provided by Layout */}
    </div>
  );
};

export default GalleryPage;
