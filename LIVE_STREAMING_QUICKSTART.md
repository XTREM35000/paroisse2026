# ⚡ Quick Start - Système de Diffusion Live

**Durée d'installation : 10 minutes**

---

## 🚀 Étapes Rapides

### ÉTAPE 1 : Créer la Table (2 min)

1. Ouvrez **Supabase Dashboard**
2. Allez dans **SQL Editor** → **New Query**
3. **Copiez-collez ce code :**

```sql
-- Copier/coller INTÉGRALEMENT ce bloc
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT NOT NULL CHECK (stream_type IN ('tv', 'radio')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_streams_select_authenticated"
  ON public.live_streams FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "live_streams_insert_admin"
  ON public.live_streams FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "live_streams_update_admin"
  ON public.live_streams FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "live_streams_delete_admin"
  ON public.live_streams FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_live_streams_is_active
  ON public.live_streams(is_active DESC, updated_at DESC);
```

4. **Cliquez** "Run"
5. ✅ Table créée !

---

### ÉTAPE 2 : Vérifier les Fichiers (1 min)

Les fichiers suivants ont été **créés/modifiés automatiquement** :

✅ `src/lib/supabase/mediaQueries.ts` - Fonctions Supabase  
✅ `src/pages/AdminLiveEditor.tsx` - Interface admin  
✅ `src/pages/Live.tsx` - Page publique  
✅ `supabase/migrations/20260124_create_live_streams.sql` - Migration SQL

**Aucune action nécessaire**, tout est déjà en place !

---

### ÉTAPE 3 : Tester en tant qu'Admin (5 min)

#### Préparation

1. Assurez-vous que votre utilisateur est **admin**
2. Allez sur **Supabase** → Table `profiles`
3. Trouvez votre ligne et vérifiez `role = 'admin'`

#### Test Admin

1. Allez à `http://localhost:5173/admin/live` (ou votre URL)
2. Cliquez **"Nouveau Direct"**
3. Remplissez :
   ```
   Titre: "Test - Messe 1er Février"
   Type: TV (Messe en direct)
   URL: https://youtube.com/watch?v=dQw4w9WgXcQ
   Actif: ✓ (switch ON)
   ```
4. Cliquez **"Enregistrer"**
5. ✅ Direct créé et visible dans la liste !

---

### ÉTAPE 4 : Tester en tant qu'Utilisateur (2 min)

#### Non Connecté

1. **Logout** ou ouvrez en incognito
2. Allez à `http://localhost:5173/live`
3. Si le direct est actif :
   - ✅ Bannière "EN DIRECT MAINTENANT" visible
   - ✅ Bouton "Regarder le Direct" visible
   - ❌ Au clic → Toast "Vous devez être connecté"

#### Connecté

1. **Login** avec un compte utilisateur normal (non-admin)
2. Allez à `http://localhost:5173/live`
3. Cliquez **"Regarder le Direct"**
4. ✅ Modal s'ouvre avec lecteur YouTube

---

## 📺 Scénarios Prêts à Tester

### Scénario 1 : Messe en Direct

```
Admin: Crée un direct TV avec URL YouTube
Utilisateur: Voit la bannière, regarde la messe
```

### Scénario 2 : Podcast en Direct

```
Admin: Crée un direct Radio avec URL audio
Utilisateur: Voit la bannière, écoute le podcast
```

### Scénario 3 : Accès Restreint

```
Visiteur non connecté: Voit l'info, ne peut pas cliquer
Visiteur connecté: Peut accéder au lecteur
```

---

## 🎯 URLs Principales

| Rôle            | URL           | Fonction                         |
| --------------- | ------------- | -------------------------------- |
| **Admin**       | `/admin/live` | Créer/Gérer directs              |
| **Utilisateur** | `/live`       | Regarder/Écouter                 |
| **Visiteur**    | `/live`       | Voir infos (pas d'accès lecteur) |

---

## 🔗 Exemples d'URLs YouTube

Testez avec ces URLs réelles (remplacez l'ID) :

```
✅ https://www.youtube.com/watch?v=VIDEOID
✅ https://youtu.be/VIDEOID
✅ VIDEOID (11 caractères seuls)
```

Trouvez des vidéos publiques sur YouTube et copiez l'ID.

---

## ✨ Ce qui Marche

- ✅ Création/modification directs (admin)
- ✅ Affichage conditionnel (actif/inactif)
- ✅ Lecteur YouTube responsive
- ✅ Lecteur audio HTML5
- ✅ Authentification requise
- ✅ Une seule diffusion active à la fois
- ✅ Design responsive mobile/tablet/desktop
- ✅ Animations Framer Motion
- ✅ Toast notifications

---

## 🚨 Si Ça Ne Marche Pas

### Problème : "403 Permission Denied"

**Solution :** Votre utilisateur n'est pas admin

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_ID';
```

### Problème : Lecteur YouTube vide

**Solution :** ID YouTube invalide (doit être 11 caractères)

### Problème : Table inexistante

**Solution :** Exécutez le SQL dans Supabase SQL Editor

### Problème : Routes non trouvées

**Solution :** Vérifiez que `/live` et `/admin/live` existent dans votre router

---

## 📊 Architecture en 30 Secondes

```
┌─────────────────────────────────────────┐
│        Supabase (Cloud DB)              │
│    ┌──────────────────────────────┐     │
│    │   Table: live_streams         │     │
│    │   - id, title, stream_url     │     │
│    │   - stream_type, is_active    │     │
│    └──────────────────────────────┘     │
└─────────────────────────────────────────┘
              ↑          ↓
    ┌─────────────────────────────────────┐
    │   React App (Frontend)              │
    ├─────────────────────────────────────┤
    │  Pages:                             │
    │  • /live → Affiche direct actif     │
    │  • /admin/live → Gère directs       │
    └─────────────────────────────────────┘
              ↑          ↓
    ┌─────────────────────────────────────┐
    │   External Streams                  │
    │  • YouTube (iframe)                 │
    │  • Audio Streams (HTML5 audio)      │
    └─────────────────────────────────────┘
```

---

## 🎬 Prêt à Lancer !

Vous avez maintenant un système complet de diffusion live :

✅ **Base de données** configurée  
✅ **Interface admin** pour gérer  
✅ **Page publique** pour regarder  
✅ **Sécurité** avec authentification et RLS  
✅ **Design** responsive et moderne

**Lancez vos tests pour le 1er février ! 🚀**

---

## 📖 Documentation Complète

- **Setup Détaillé** → `LIVE_STREAMING_SETUP_GUIDE.md`
- **Exemples de Code** → `LIVE_STREAMING_EXAMPLES.md`
- **Détails Techniques** → `LIVE_STREAMING_TECHNICAL_SUMMARY.md`

---

**Questions ?** Consultez les guides détaillés ou relancez l'IA avec vos questions spécifiques.

**Bon test !** 🎉
