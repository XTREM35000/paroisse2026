# 📖 Page Annuaire - Documentation

## Vue d'ensemble

La page **Annuaire** (`/directory`) est une plateforme de répertoire complète pour afficher et gérer les services, le clergé et les membres de la paroisse.

## Fonctionnalités

### 👥 Pour les visiteurs

- **Recherche intuitive** : Barre de recherche pour filtrer par nom, description, email
- **Affichage par catégories** :
  - 🏢 Services (Messes, Confessions, Catéchèse, etc.)
  - ⛪ Clergé (Prêtres, Diacres)
  - 👨‍👩‍👧‍👦 Membres
- **Cartes détaillées** avec :
  - Photo/Avatar
  - Description
  - Email (cliquable)
  - Téléphone (cliquable)
  - Boutons de contact directs
- **Design responsive** : Mobile, Tablet, Desktop

### ⚙️ Pour les administrateurs

**Route d'administration** : `/admin/directory`

#### Fonctionnalités
- ✅ Créer des éléments d'annuaire
- ✏️ Éditer les informations
- 🖼️ Upload d'images (avec aperçu)
- 🗑️ Supprimer des éléments
- 📋 Gérer l'ordre d'affichage

#### Données gérables
- Nom (requis)
- Description
- Catégorie (Service / Clergé / Membre)
- Email
- Téléphone
- Site Web
- Image (avatar)
- Ordre d'affichage

## Architecture

### Hooks React

```typescript
// Récupérer tous les éléments
const { data: items, isLoading } = useDirectory();

// Organiser par catégorie
const organized = organizeByCategory(items);
// Résultat:
// {
//   services: DirectoryItem[],
//   clergy: DirectoryItem[],
//   members: DirectoryItem[]
// }
```

### Composants

1. **DirectoryCard** - Affiche un élément individuel
2. **DirectorySection** - Section catégorisée
3. **Directory** (Page) - Page publique
4. **AdminDirectoryEditor** (Page) - Interface d'administration

### Base de données

Table : `public.directory`

```sql
-- Colonnes principales
id: UUID (Primary Key)
name: VARCHAR(100) -- Requis
description: TEXT
category: VARCHAR(50) -- 'service' | 'member' | 'clergy'
email: VARCHAR(100)
phone: VARCHAR(20)
website: VARCHAR(255)
image_url: TEXT
is_active: BOOLEAN (DEFAULT TRUE)
display_order: INT (Pour trier les éléments)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
updated_by: UUID (Référence à auth.users)
```

### Stockage (Storage)

Bucket : `directory-images`
- Utilisé pour uploader les photos/avatars
- Accès public (lecture) / Admin seulement (écriture/suppression)
- URL publique automatiquement générée

## Sécurité (RLS)

### Lecture
```
✅ Tout le monde peut voir les éléments actifs
```

### Écriture
```
✅ Admins et Super_admins seulement
```

### Stockage Images
```
✅ Public en lecture
✅ Admins en upload/suppression
```

## Intégrations

### Navigation
- Lien dans le **Sidebar** (admin)
- Lien dans le **Footer** (tous les visiteurs)
- Route `/directory` (publique)
- Route `/admin/directory` (admin protégée)

### Autres pages
- Utilise le même système `HeroBanner` que d'autres pages
- Même design et animations que `EventsPage`, `GalleryPage`

## Configuration de déploiement

### Migrations à exécuter
```bash
# 1. Créer la table directory
supabase db push  # Exécute 017_create_directory.sql

# 2. Configurer les buckets
supabase db push  # Exécute 018_create_storage_buckets.sql
```

### Données d'exemple
La migration 017 insère automatiquement :
- 6 services (Messes, Confessions, etc.)
- 2 membres du clergé (Curé, Diacre)

## Améliorations futures

- [ ] Filtres avancés (par jour/heure pour les messes)
- [ ] Export d'annuaire (PDF, vCard)
- [ ] Notifications de changement
- [ ] Integration avec calendrier
- [ ] Horaires détaillés des services
- [ ] Carte interactive pour localiser les services

## Dépannage

### Les images ne s'affichent pas
- Vérifier que le bucket `directory-images` existe
- Vérifier les RLS policies de storage

### La page est vide
- Vérifier que des éléments existent dans la table `directory`
- Vérifier que `is_active = TRUE`
- Vérifier la connexion Supabase

### Les admins ne peuvent pas modifier
- Vérifier le rôle de l'utilisateur (`admin` ou `super_admin`)
- Vérifier les RLS policies

## Support

Pour toute question ou problème, vérifiez :
1. Les logs de la console (F12)
2. Les RLS policies dans Supabase
3. Les permissions de l'utilisateur
