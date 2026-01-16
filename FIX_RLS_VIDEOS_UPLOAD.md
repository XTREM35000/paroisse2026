# Fix: Erreur 406 lors de la mise à jour des vidéos - Permissions RLS

## Problème

Vous recevez l'erreur suivante lors de la mise à jour d'une vidéo :

```
PATCH https://cghwsbkxcjsutqwzdbwe.supabase.co/rest/v1/videos?id=eq.b35065a0-576d-46d8-a58b-a1ea2572c849&select=* 406 (Not Acceptable)

updateVideo: aucune ligne affectée pour id b35065a0-576d-46d8-a58b-a1ea2572c849
Erreur lors de updateVideo: Error: Aucune ligne mise à jour — vérifiez les permissions (RLS) ou l'identifiant
```

## Cause Root

La politique RLS (Row Level Security) pour la table `videos` est trop restrictive :

```sql
CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);
```

Cette politique signifie : **Seul l'utilisateur qui a créé la vidéo peut la mettre à jour**.

Quand un administrateur ou un autre utilisateur essaie de mettre à jour la vidéo, la requête PATCH est rejetée par RLS, ce qui résulte en une erreur 406 (Not Acceptable) avec "aucune ligne affectée".

## Solution

### Étape 1: Appliquer le correctif RLS

Exécutez le script SQL suivant dans Supabase (SQL Editor) :

```sql
-- Drop existing video policies
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

-- Create improved policies
CREATE POLICY "Users can update own videos and admins can update all" ON videos
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can delete own videos and admins can delete all" ON videos
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

Ou exécutez le fichier de migration :

```bash
supabase migration up
# ou dans Supabase CLI
psql -h [host] -U postgres -d postgres -a -f supabase/migrations/010_fix_videos_rls.sql
```

### Étape 2: Vérifier que l'utilisateur a le rôle admin

Assurez-vous que l'utilisateur qui met à jour la vidéo a le rôle `admin` ou `super_admin` :

```sql
SELECT id, role FROM profiles WHERE id = 'user_id_here';

-- Si le rôle est null ou 'user', mettez-le à jour :
UPDATE profiles
SET role = 'admin'
WHERE id = 'user_id_here';
```

### Étape 3: Tester l'upload

1. Connectez-vous avec un compte administrateur
2. Uploadez une vidéo avec une miniature
3. L'update devrait maintenant fonctionner

## Résultats Attendus

Après l'application du correctif :

- ✅ Les utilisateurs peuvent mettre à jour leurs propres vidéos
- ✅ Les administrateurs peuvent mettre à jour toutes les vidéos
- ✅ L'upload de miniatures réussit sans erreur 406
- ✅ Les vidéos sont correctement mises à jour dans la base de données

## Diagnostic Supplémentaire

Si le problème persiste après l'application du correctif :

1. Vérifiez les permissions RLS actuelles :

```sql
SELECT * FROM pg_policies WHERE tablename = 'videos';
```

2. Vérifiez que RLS est activé :

```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'videos';
-- Devrait retourner: t (true)
```

3. Vérifiez le rôle de l'utilisateur authentifié :

```sql
SELECT
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as user_role;
```

4. Testez manuellement la politique :

```sql
-- Connectez-vous en tant qu'admin
-- Essayez une mise à jour directe
UPDATE videos
SET title = 'Test Update'
WHERE id = 'video_id_here';
```

## Fichiers Modifiés

- `supabase/migrations/010_fix_videos_rls.sql` - Nouveau script de migration pour corriger les politiques RLS
