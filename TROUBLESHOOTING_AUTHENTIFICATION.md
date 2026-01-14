# 🆘 Guide de dépannage complet - Authentification

## 📋 Index rapide des problèmes

1. [Problèmes de compilation](#problèmes-de-compilation)
2. [Problèmes d'authentification](#problèmes-dauthentification)
3. [Problèmes OAuth](#problèmes-oauth)
4. [Problèmes de profil](#problèmes-de-profil)
5. [Problèmes d'email](#problèmes-demail)
6. [Problèmes d'interface](#problèmes-dinterface)
7. [Problèmes de déploiement](#problèmes-de-déploiement)

---

## 🔴 Problèmes de compilation

### ❌ "Module not found: useAuth"

```
Error: Cannot find module '@/hooks/useAuth'
```

**Cause** : Hook non importé ou chemin incorrect  
**Solution** :

1. Vérifier que le fichier existe : `src/hooks/useAuth.tsx`
2. Vérifier l'import : `import { useAuth } from '@/hooks/useAuth'`
3. Redémarrer le serveur dev : `npm run dev`

---

### ❌ "Cannot find name 'useEnsureOAuthProfile'"

```
Error: Cannot find name 'useEnsureOAuthProfile'
```

**Cause** : Fichier non créé ou non importé  
**Solution** :

1. Vérifier que le fichier existe : `src/hooks/useEnsureOAuthProfile.ts`
2. Vérifier l'import dans Layout.tsx : `import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile'`
3. Utiliser le hook dans le composant : `useEnsureOAuthProfile()`

---

### ❌ "Separator is not exported from @/components/ui/separator"

```
Error: Separator is not exported from '@/components/ui/separator'
```

**Cause** : Composant shadcn/ui manquant  
**Solution** :

```bash
npx shadcn-ui@latest add separator
```

---

### ❌ "'Facebook' is not exported from 'lucide-react'"

```
Error: 'Facebook' is not exported from 'lucide-react'
```

**Cause** : Icon lucide-react mal orthographiée ou non disponible  
**Solution** :

1. Utiliser l'icon correcte : `import { Facebook } from 'lucide-react'`
2. Alternative : utiliser une image ou SVG

```typescript
// Alternative si l'icon n'existe pas
<img src='/facebook-icon.svg' alt='Facebook' className='w-4 h-4' />
```

---

## 🔴 Problèmes d'authentification

### ❌ "signInWithProvider is not a function"

```
Error: signInWithProvider is not a function
```

**Cause** : Hook useAuth non utilisé correctement  
**Solution** :

```typescript
// ❌ Mauvais
const handleFacebook = () => {
  signInWithProvider('facebook') // Erreur: not defined
}

// ✅ Bon
const MyComponent = () => {
  const { signInWithProvider } = useAuth()

  const handleFacebook = () => {
    signInWithProvider('facebook') // OK
  }
}
```

---

### ❌ "resetPassword is not a function"

```
Error: resetPassword is not a function
```

**Cause** : Ancienne version du hook useAuth sans resetPassword  
**Solution** :

1. Vérifier que useAuth.tsx contient la méthode resetPassword
2. Vérifier que l'export inclut resetPassword dans le type
3. Redémarrer le serveur dev

**Vérifier dans useAuth.tsx** :

```typescript
const resetPassword = async (email: string) => {
  // ...
}

const value: AuthContextValue = {
  user,
  loading,
  login,
  register,
  signInWithProvider,
  signOut,
  resetPassword, // ✓
}
```

---

### ❌ "User is always null after login"

```
user === null après login
```

**Cause** : État d'authentification non mis à jour  
**Solution** :

1. Vérifier que AuthProvider enveloppe l'application
2. Vérifier que AuthContext.Provider est dans App.tsx
3. Attendre le loading: `if (loading) return <LoadingSpinner />`

```typescript
// Dans App.tsx
<AuthProvider>
  <BrowserRouter>
    <Routes>{/* Vos routes */}</Routes>
  </BrowserRouter>
</AuthProvider>
```

---

### ❌ "Cannot login with correct credentials"

```
Email/password correct mais erreur d'authentification
```

**Cause** : Plusieurs possibilités  
**Solution** :

1. **Vérifier l'email** : Est-il confirmé dans Supabase?

   ```sql
   SELECT email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
   ```

2. **Vérifier l'utilisateur** : Existe-t-il vraiment?

   ```sql
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   ```

3. **Réinitialiser le password** via Supabase Dashboard

4. **Vérifier les logs** : Dashboard Supabase → Auth → Logs

---

## 🔴 Problèmes OAuth

### ❌ "Invalid OAuth Redirect URI"

```
Error: The redirect_uri is not allowlisted
```

**Cause** : URL de redirection non configurée  
**Solution** :

**1. Dans Supabase** :

```
Dashboard → Authentication → URL Configuration
Add Authorized redirect URLs:
  - http://localhost:5173
  - http://localhost:5173/auth/callback
  - https://paroisse-ten.vercel.app
  - https://paroisse-ten.vercel.app/auth/callback
```

**2. Dans Facebook Developer** :

```
App Settings → Facebook Login → Settings
Valid OAuth Redirect URIs:
  - http://localhost:5173/auth/callback
  - https://paroisse-ten.vercel.app/auth/callback
```

---

### ❌ "Facebook button doesn't work"

```
Clique sur le bouton Facebook → Rien ne se passe
```

**Cause** : Facebook Provider non activé  
**Solution** :

1. Supabase Dashboard → Authentication → Providers
2. Vérifier que Facebook est "Enabled" (vert)
3. Vérifier que Client ID et Client Secret sont remplis
4. Redémarrer l'app

```typescript
// Vérifier le bouton
<Button onClick={() => signInWithProvider('facebook')}>Facebook</Button>

// Vérifier que signInWithProvider accepte 'facebook'
// (Doit être dans la liste: 'google' | 'github' | 'facebook')
```

---

### ❌ "OAuth redirect loop"

```
Boucle infinie : App → Facebook → App → Facebook...
```

**Cause** : URL de redirection incorrecte  
**Solution** :

1. Vérifier que Supabase et Facebook ont les **mêmes URLs**
2. La URL doit être exacte (avec protocole, sans slash final)
3. Exemple correct : `https://paroisse-ten.vercel.app`
4. Exemple incorrect : `https://paroisse-ten.vercel.app/` (slash final)

```typescript
// Vérifier dans useAuth.tsx
signInWithProvider: async (provider: 'google' | 'facebook') => {
  await supabase.auth.signInWithOAuth({ provider })
  // Supabase gère la redirection automatiquement
}
```

---

### ❌ "Profile not created after Facebook login"

```
Facebook login fonctionne mais profil vide
```

**Cause** : Hook useEnsureOAuthProfile n'est pas utilisé  
**Solution** :

1. Vérifier que Layout.tsx appelle le hook :

```typescript
import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile'

const Layout = ({ children }) => {
  useEnsureOAuthProfile() // ✓ Doit être ici
  // ...
}
```

2. Vérifier que les politiques RLS permettent l'insertion :

```sql
CREATE POLICY "Allow insert for authenticated"
ON profiles FOR INSERT
WITH CHECK (true);
```

3. Vérifier que la table `profiles` existe et a les colonnes :
   - `id` (uuid, PRIMARY KEY)
   - `full_name` (text)
   - `avatar_url` (text)
   - `role` (text)

---

### ❌ "CORS error with Facebook"

```
Error: Access to XMLHttpRequest blocked by CORS policy
```

**Cause** : CORS non configuré  
**Solution** :

1. Vérifier que les origines sont autorisées dans Supabase
2. Ajouter dans CORS settings :
   - `http://localhost:5173`
   - `https://paroisse-ten.vercel.app`

```typescript
// Alternative : utiliser le proxy Supabase
// Supabase gère automatiquement les CORS pour OAuth
```

---

## 🔴 Problèmes de profil

### ❌ "Profil utilisateur ne s'affiche pas"

```
Après connexion, pas de profil visible
```

**Cause** : Plusieurs possibilités  
**Solution** :

1. Vérifier que le profil existe dans Supabase :

```sql
SELECT * FROM profiles WHERE id = 'user-uuid';
```

2. Vérifier que RLS policy permet la lecture :

```sql
CREATE POLICY "Allow select own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

3. Vérifier que UserProfileDisplay est utilisé
4. Vérifier que l'utilisateur est connecté : `user !== null`

---

### ❌ "Avatar ne s'affiche pas"

```
Avatar manquant ou broken image
```

**Cause** : URL d'avatar incorrecte ou fichier manquant  
**Solution** :

1. Vérifier l'URL :

```typescript
console.log('Avatar URL:', profile?.avatar_url)
```

2. Vérifier que le fichier existe dans Storage
3. Vérifier que la URL est publique ou accessible
4. Utiliser le fallback aux initiales :

```typescript
<AvatarFallback>{initials}</AvatarFallback>
```

---

### ❌ "Avatar upload fails"

```
Erreur lors du téléchargement de l'avatar
```

**Cause** : Bucket storage non configuré  
**Solution** :

1. Créer le bucket dans Supabase Storage :

```
Dashboard → Storage → Buckets → New bucket → avatars
```

2. Configurer les politiques RLS :

```sql
CREATE POLICY "Allow users to upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
```

3. Vérifier l'upload dans RegisterForm
4. Vérifier le code d'upload dans sessionStorage

---

## 🔴 Problèmes d'email

### ❌ "Email de confirmation non reçu"

```
Après inscription, aucun email
```

**Cause** : SMTP non configuré  
**Solution** :

1. Vérifier la configuration SMTP dans Supabase :

```
Dashboard → Authentication → Email → SMTP Settings
```

2. Options :

   - **Option A** : Configurer SMTP personnalisé
   - **Option B** : Utiliser le service email Supabase (plus simple)

3. Vérifier les logs :

```
Dashboard → Authentication → Logs
```

4. Tester l'email :

```sql
SELECT auth.send_email_verification('user@example.com');
```

---

### ❌ "Email reset password ne s'envoie pas"

```
"Mot de passe oublié" ne fonctionne pas
```

**Cause** : SMTP ou resetPassword mal configuré  
**Solution** :

1. Vérifier la méthode resetPassword dans useAuth :

```typescript
const resetPassword = async (email: string) => {
  const res = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (res.error) throw res.error
  return res
}
```

2. Vérifier la route `/reset-password` existe
3. Vérifier que SMTP est configuré
4. Vérifier les logs Supabase

---

### ❌ "Emails vont en spam"

```
Les utilisateurs reçoivent les emails en spam
```

**Cause** : Configuration d'email insuffisante  
**Solution** :

1. Configurer SPF, DKIM, DMARC
2. Utiliser un domaine configuré
3. Vérifier l'adresse "From"
4. Ajouter des informations de branding

**Configuration dans Supabase** :

```
Email → Settings
- From Address: noreply@paroisse-ten.vercel.app
- Subject: Vérification d'email
```

---

## 🔴 Problèmes d'interface

### ❌ "Tabs ne changent pas d'onglet"

```
Cliquer sur un TabsTrigger ne change rien
```

**Cause** : État du composant Tabs non synchronisé  
**Solution** :

```typescript
// ✅ Bon
const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">("login");

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsContent value="login">...</TabsContent>
</Tabs>

// ❌ Mauvais
<Tabs defaultValue="login"> {/* Pas de onValueChange */}
```

---

### ❌ "Formulaire de login disparaît après soumission"

```
Après cliquer "Se connecter", le formulaire disparaît
```

**Cause** : Redirection trop rapide  
**Solution** :

1. Vérifier les timeouts dans LoginForm
2. Ajouter un délai avant navigation :

```typescript
setTimeout(() => {
  navigate('/')
}, 500) // Attendre 500ms avant redirection
```

3. Afficher un loading state pendant la redirection

---

### ❌ "Buttons désactivés/enabled de manière étrange"

```
Les boutons restent grisés ou ne réagissent pas
```

**Cause** : État `loading` bloqué  
**Solution** :

1. Vérifier que `loading` est remis à false dans le finally :

```typescript
try {
  // logique
} catch (err) {
  // gestion erreur
} finally {
  setLoading(false) // ✓ Toujours
}
```

2. Vérifier que le disabled est basé sur loading :

```typescript
<Button disabled={loading}>{loading ? 'Connexion...' : 'Se connecter'}</Button>
```

---

## 🔴 Problèmes de déploiement

### ❌ "Variables d'environnement non définies en production"

```
ReferenceError: VITE_SUPABASE_URL is not defined
```

**Cause** : .env.local non configuré en production  
**Solution** :

1. Dans Vercel Dashboard :

   - Project Settings → Environment Variables
   - Ajouter :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_FACEBOOK_APP_ID` (optionnel)

2. Redéployer après ajout des variables

---

### ❌ "OAuth ne fonctionne qu'en local"

```
En production: "Invalid redirect URI"
```

**Cause** : Redirect URLs incomplètes  
**Solution** :

1. Ajouter l'URL de production dans Supabase :

```
Dashboard → Authentication → URL Configuration
Add: https://paroisse-ten.vercel.app
```

2. Ajouter dans Facebook App :

```
Facebook App → Settings → Facebook Login → Settings
Valid OAuth Redirect URIs:
  - https://paroisse-ten.vercel.app/auth/callback
```

3. Redéployer

---

### ❌ "Erreur 500 en production"

```
L'app fonctionne en local mais erreur 500 en production
```

**Cause** : Plusieurs possibilités  
**Solution** :

1. Vérifier les logs Vercel :

```
Vercel Dashboard → Deployments → Logs
```

2. Vérifier les logs Supabase :

```
Supabase Dashboard → Logs
```

3. Vérifier la console du navigateur (DevTools)

4. Commun :
   - Variables d'environnement manquantes
   - Policies RLS trop restrictives
   - CORS mal configuré

---

## ✅ Checklist de diagnostic

Avant de faire un rapport de bug, vérifier :

- [ ] NPM/Node.js à jour
- [ ] Dépendances installées : `npm install`
- [ ] Serveur de dev redémarré : `npm run dev`
- [ ] Cache cleared : `Ctrl+Shift+Delete` (navigateur)
- [ ] Localhost:5173 accessible
- [ ] Supabase Dashboard accessible
- [ ] Variables .env.local configurées
- [ ] Facebook App créée et configurée
- [ ] RLS policies créées
- [ ] SMTP configuré ou email Supabase activé
- [ ] Logs Supabase consultés
- [ ] Console navigateur sans erreurs
- [ ] Network tab (DevTools) vérifiée

---

## 🆘 Aide supplémentaire

### Ressources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Facebook Login](https://developers.facebook.com)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev)

### Signaler un bug

Si vous trouvez un bug non listé ici :

1. Consulter les documents de documentation
2. Vérifier la console du navigateur
3. Vérifier les logs Supabase
4. Créer un ticket détaillé avec :
   - Étapes pour reproduire
   - Erreur exacte
   - Logs Supabase
   - Version des packages

---

**Version** : 1.0  
**Dernière mise à jour** : 14 janvier 2026
