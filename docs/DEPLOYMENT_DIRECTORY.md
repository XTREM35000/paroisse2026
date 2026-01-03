# 🚀 Guide de Déploiement - Page Annuaire

## Étapes de mise en production

### 1️⃣ Exécuter les migrations Supabase

```bash
# S'assurer d'être connecté à Supabase
supabase db push

# Cela va exécuter :
# - supabase/migrations/017_create_directory.sql
# - supabase/migrations/018_create_storage_buckets.sql
```

**Que cela fait** :

- Crée la table `directory` avec RLS policies
- Insère 8 éléments d'exemple
- Crée le bucket `directory-images`
- Configure les RLS policies pour le stockage

### 2️⃣ Vérifier dans Supabase Studio

Aller sur : https://supabase.com/dashboard

#### Table explorer

```
Aller à: Database > Tables > directory
Vérifier qu'il y a 8 lignes (6 services + 2 clergé)
```

#### Storage

```
Aller à: Storage > Buckets
Vérifier l'existence du bucket "directory-images"
```

#### RLS Policies

```
Aller à: Authentication > Policies
Vérifier les policies sur la table "directory"
```

### 3️⃣ Redémarrer l'application

```bash
# Terminal
npm run dev

# Attendre que Vite compile
# L'app devrait être accessible sur http://localhost:5173
```

### 4️⃣ Tester la page publique

```
URL : http://localhost:5173/directory

Vérifier :
✅ Page charge (pas d'erreur console)
✅ Hero Banner visible
✅ Barre de recherche présente
✅ 3 sections : Services, Clergé, Membres
✅ 8 éléments totaux
✅ Cartes affichent correctement les infos
✅ Boutons "Contacter" et "Appeler" fonctionnent
```

### 5️⃣ Tester l'interface admin

```
URL : http://localhost:5173/admin/directory

Prérequis :
✅ Être connecté comme admin
✅ Avoir le rôle 'admin' ou 'super_admin'

Vérifier :
✅ Liste des 8 éléments dans la table
✅ Bouton "+ Ajouter un élément"
✅ Boutons "Éditer" et "Supprimer" par ligne
```

### 6️⃣ Créer un nouvel élément (test)

```
1. Cliquer sur "+ Ajouter un élément"
2. Remplir le formulaire :
   - Nom: "Test Service"
   - Catégorie: "service"
   - Description: "Ceci est un test"
   - Email: "test@paroisse.fr"
   - Ordre d'affichage: 7
3. Cliquer "Créer"
4. Vérifier que la notification "Succès" apparaît
5. Rafraîchir la page
6. Vérifier que "Test Service" apparaît dans la liste
7. Aller sur /directory publique
8. Vérifier que l'élément aparaît dans la section Services
```

### 7️⃣ Tester l'upload d'image

```
1. Créer ou éditer un élément
2. Uploader une image (JPG/PNG)
3. Vérifier que l'aperçu apparaît
4. Sauvegarder
5. Vérifier que l'image s'affiche sur /directory
```

### 8️⃣ Tester la recherche

Sur la page `/directory` :

```
1. Entrer "messe" dans la barre de recherche
   → Seule "Messe Dominicale" doit apparaître
2. Effacer et entrer "curé"
   → Seul "Père Jean Dupont" doit apparaître
3. Entrer "compassion"
   → "Accompagnement Spirituel" doit apparaître
```

### 9️⃣ Vérifier la sécurité RLS

```
Cas 1 : Utilisateur NON connecté
- /directory : ✅ Doit voir les éléments
- /admin/directory : ❌ Doit être redirigé vers /auth

Cas 2 : Utilisateur connecté (rôle: member)
- /directory : ✅ Doit voir les éléments
- /admin/directory : ❌ Doit voir "Accès refusé"

Cas 3 : Admin (rôle: admin)
- /directory : ✅ Doit voir les éléments
- /admin/directory : ✅ Doit voir l'interface complète
```

## ⚠️ Dépannage

### Problème : "Table 'directory' not found"

```
Cause : Migrations non exécutées
Solution : supabase db push
```

### Problème : Les images ne s'affichent pas

```
Cause : Bucket 'directory-images' n'existe pas
Solution :
1. Vérifier dans Storage de Supabase Studio
2. Si absent : supabase db push
3. Ou créer manuellement le bucket
```

### Problème : Page admin vierge

```
Cause : Rôle utilisateur non 'admin'
Solution : Vérifier dans la table 'profiles' que role = 'admin'
```

### Problème : TypeError dans la console

```
Cause : Types TypeScript non mis à jour
Solution :
1. Vérifier src/integrations/supabase/types.ts
2. Doit avoir la table 'directory' définie
```

### Problème : RLS policy error

```
Cause : Policies mal configurées
Solution :
1. Aller dans Supabase Studio > Authentication > Policies
2. Vérifier que 'directory_updated_by_fkey' existe
3. Vérifier les CHECK conditions
```

## 📋 Checklist pré-production

- [ ] Migrations exécutées (`supabase db push`)
- [ ] Table `directory` créée (8 éléments visibles)
- [ ] Bucket `directory-images` créé
- [ ] RLS policies configurées
- [ ] Page `/directory` affiche les éléments
- [ ] Admin peut accéder à `/admin/directory`
- [ ] Admin peut créer/éditer/supprimer
- [ ] Images s'affichent correctement
- [ ] Recherche fonctionne
- [ ] Design responsive OK
- [ ] Aucune erreur console
- [ ] Notifications (toast) fonctionnent

## 🔄 Post-déploiement

### Personnaliser les données d'exemple

```sql
-- Modifier les données d'exemple dans la migration 017
-- OU exécuter directement dans Supabase :

UPDATE public.directory
SET name = 'Votre nom', email = 'votre-email@paroisse.fr'
WHERE id = '...'
```

### Configurer les images d'admin

1. Aller sur `/admin/directory`
2. Éditer chaque élément
3. Uploader une image appropriée
4. Cliquer "Mettre à jour"

### Ajouter des éléments personnalisés

1. Admin : Aller sur `/admin/directory`
2. Cliquer "+ Ajouter un élément"
3. Remplir les infos (nom requis)
4. Upload optionnel de photo
5. Sauvegarder

## 📞 Contact & Support

Pour toute question :

- Consulter [DIRECTORY_GUIDE.md](./DIRECTORY_GUIDE.md)
- Vérifier les logs console (F12)
- Consulter les RLS policies
- Vérifier les permissions d'utilisateur

---

**Date de création** : 3 janvier 2026
**Statut** : Prêt pour déploiement
