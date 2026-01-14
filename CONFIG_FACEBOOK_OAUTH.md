# Configuration d'environnement pour l'authentification Facebook

# Ajouter ces variables à votre fichier .env.local

## Supabase Configuration (déjà existant)

VITE_SUPABASE_URL=https://[votre-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[votre-anon-key]

## Facebook OAuth (nouveau)

# Récupérez ces valeurs depuis https://developers.facebook.com/apps

VITE_FACEBOOK_APP_ID=[votre-facebook-app-id]
VITE_FACEBOOK_APP_SECRET=[votre-facebook-app-secret]

## Google OAuth (existant - vérifier)

VITE_GOOGLE_CLIENT_ID=[votre-google-client-id]
VITE_GOOGLE_CLIENT_SECRET=[votre-google-client-secret]

## Application URLs

VITE_APP_URL=http://localhost:5173
VITE_PRODUCTION_URL=https://paroisse-ten.vercel.app

## Email Configuration (optionnel - si vous utilisez SMTP personnalisé)

VITE_SMTP_HOST=smtp.mailtrap.io
VITE_SMTP_PORT=2525
VITE_SMTP_USER=[votre-mailtrap-user]
VITE_SMTP_PASSWORD=[votre-mailtrap-password]
VITE_SMTP_FROM=noreply@paroisse-ten.vercel.app

---

# Instructions de configuration Facebook Developer

## Étape 1 : Créer une application Facebook

1. Aller à https://developers.facebook.com
2. Cliquer sur "My Apps" → "Create App"
3. Choisir "Consumer" comme type
4. Remplir les détails de l'app

## Étape 2 : Récupérer les identifiants

1. Dans les paramètres de l'app, aller à "Settings" → "Basic"
2. Copier "App ID" → VITE_FACEBOOK_APP_ID
3. Copier "App Secret" → VITE_FACEBOOK_APP_SECRET

## Étape 3 : Configurer Facebook Login

1. Aller à "Products" et ajouter "Facebook Login"
2. Choisir "Web"
3. Passer les étapes de configuration rapide

## Étape 4 : Configurer OAuth Redirect URLs

1. Aller à "Facebook Login" → "Settings"
2. Dans "Valid OAuth Redirect URIs", ajouter :
   ```
   http://localhost:5173/auth/callback
   https://paroisse-ten.vercel.app/auth/callback
   ```

## Étape 5 : Configurer les permissions

1. Aller à "Tools" → "Graph API Explorer"
2. S'assurer que ces permissions sont activées :
   - email
   - public_profile
   - user_photos (pour les avatars)

## Étape 6 : Configurer dans Supabase

1. Aller à Supabase Dashboard
2. Authentication → Providers → Facebook
3. Renseigner :
   - Enabled: ON
   - Client ID: [votre VITE_FACEBOOK_APP_ID]
   - Client Secret: [votre VITE_FACEBOOK_APP_SECRET]
4. Ajouter les Redirect URLs :
   - https://[votre-project-id].supabase.co/auth/v1/callback?provider=facebook

---

# Vérification en local

Après avoir configuré les variables .env.local :

```bash
# 1. Redémarrer le serveur de développement
npm run dev

# 2. Ouvrir le navigateur
http://localhost:5173

# 3. Tester les formulaires d'authentification
# - Cliquer sur "Facebook"
# - Devrait rediriger vers Facebook
# - Devrait revenir à l'app après autorisation
```

---

# Configuration Supabase (résumé)

## Dans le Dashboard Supabase

### Authentication Settings

```
Settings → Authentication

Project URL: https://[votre-project-id].supabase.co
API Key (anon): [votre-anon-key]

Providers:
- Facebook: ✓ Enabled
- Google: ✓ Enabled

URL Configuration:
Authorized redirect URLs:
  - http://localhost:5173
  - http://localhost:5173/auth/callback
  - https://paroisse-ten.vercel.app
  - https://paroisse-ten.vercel.app/auth/callback

Email Redirection Endpoints:
  - Confirmation URL: https://paroisse-ten.vercel.app/email-confirmed
  - Password reset URL: https://paroisse-ten.vercel.app/reset-password
```

### Database RLS

```sql
-- Table: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (Read own)
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: INSERT (Create own)
CREATE POLICY "create_own_profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- Policy: UPDATE (Update own)
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

# Dépannage courant

## "Invalid OAuth Redirect URI"

**Cause** : L'URL n'est pas configurée dans Facebook et/ou Supabase
**Solution** : Vérifier les redirect URLs dans les deux dashboards

## "App Not Set Up"

**Cause** : L'app Facebook n'a pas Facebook Login activé
**Solution** : Aller à Products → Add → Facebook Login

## "CORS Error"

**Cause** : Les origines ne sont pas autorisées
**Solution** : Vérifier les paramètres CORS dans Supabase Settings

## Profile not created after OAuth

**Cause** : Policies RLS empêchent l'insertion
**Solution** : Vérifier que la policy INSERT existe et est correcte

## Email not sending

**Cause** : SMTP non configuré ou incorrectement configuré
**Solution** :

1. Vérifier Supabase → Auth → Email → SMTP Settings
2. Ou utiliser le service email fourni par Supabase

---

# Checklist finale

- [ ] Variables .env.local configurées
- [ ] App Facebook créée et configurée
- [ ] Identifiants Facebook copiés dans .env.local
- [ ] Supabase Facebook Provider activé
- [ ] Redirect URLs configurées partout
- [ ] Politiques RLS sur profiles créées
- [ ] SMTP configuré pour les emails
- [ ] Serveur de dev redémarré après .env changes
- [ ] Tested connexion Facebook en local
- [ ] Tested Gmail/Google Auth en local
- [ ] Tested password reset en local
- [ ] Prêt à déployer sur Vercel
