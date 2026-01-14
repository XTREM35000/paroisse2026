# Configuration complète de l'authentification - Mise à jour

## 📋 Résumé des modifications

Tous les éléments ont été ajustés et améliorés pour supporter les fonctionnalités d'authentification complètes incluant **Facebook OAuth** et la **gestion des profils utilisateur**.

---

## 🔧 Modifications apportées

### 1. **useAuth Hook** (`src/hooks/useAuth.tsx`)

#### Modifications :

- ✅ Ajout de **"facebook"** au type `signInWithProvider`
- ✅ Ajout de la méthode `resetPassword(email: string)` pour la réinitialisation de mot de passe

```typescript
// Avant
signInWithProvider: (provider: 'google' | 'github') => Promise<unknown>

// Après
signInWithProvider: (provider: 'google' | 'github' | 'facebook') => Promise<unknown>
resetPassword: (email: string) => Promise<unknown>
```

#### Nouvelles fonctionnalités :

```typescript
const resetPassword = async (email: string) => {
  const res = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (res.error) throw res.error
  return res
}
```

---

### 2. **Nouveau composant : ForgotPasswordForm** (`src/components/ForgotPasswordForm.tsx`)

- ✅ Formulaire dédiée à la réinitialisation de mot de passe
- ✅ Affichage d'un message de confirmation après soumission
- ✅ Bouton pour revenir à la connexion

**Utilisation** :

```typescript
<ForgotPasswordForm
  onSuccess={() => console.log('Email envoyé')}
  onSwitchToLogin={() => setTab('login')}
/>
```

---

### 3. **Auth.tsx modernisé** (`src/pages/Auth.tsx`)

#### Avant :

```typescript
// Boutons simples sans onglets
<div className='space-x-2'>
  <button onClick={() => setMode('login')}>Connexion</button>
  <button onClick={() => setMode('register')}>Inscription</button>
</div>
```

#### Après :

```typescript
// Utilisation de Tabs de shadcn/ui
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className='grid grid-cols-3'>
    <TabsTrigger value='login'>Connexion</TabsTrigger>
    <TabsTrigger value='register'>Inscription</TabsTrigger>
    <TabsTrigger value='forgot-password'>Mot de passe</TabsTrigger>
  </TabsList>
  <TabsContent value='login'>
    <LoginForm onForgotPassword={() => setActiveTab('forgot-password')} />
  </TabsContent>
  ...
</Tabs>
```

**Améliorations** :

- ✅ 3 onglets (Connexion, Inscription, Mot de passe oublié)
- ✅ Structure propre avec Tabs de shadcn/ui
- ✅ Transition fluide entre les onglets

---

### 4. **LoginForm améliorisé** (`src/components/LoginForm.tsx`)

#### Ajouts :

- ✅ Import de `Separator` et `Facebook` icon (lucide-react)
- ✅ Bouton Facebook OAuth
- ✅ Séparateur "Ou continuer avec"
- ✅ Boutons Google et Facebook côte à côte

```typescript
<Separator className="my-2" />
<div className="flex flex-col gap-2">
  <p className="text-xs text-muted-foreground text-center">Ou continuer avec</p>
  <div className="flex gap-2">
    <Button onClick={() => signInWithProvider('facebook')}>
      <Facebook className="w-4 h-4" />
      Facebook
    </Button>
    <Button onClick={() => signInWithProvider('google')}>Google</Button>
  </div>
</div>
```

---

### 5. **RegisterForm améliorisé** (`src/components/RegisterForm.tsx`)

#### Ajouts :

- ✅ Import de `Separator` et `Facebook` (lucide-react)
- ✅ Ajout de `signInWithProvider` au hook useAuth
- ✅ Mêmes boutons OAuth que LoginForm
- ✅ Cohérence visuelle

```typescript
const { register, signInWithProvider } = useAuth();

// Dans le JSX
<Separator className="my-2" />
<div className="flex gap-2">
  <Button onClick={() => signInWithProvider('facebook')}>
    <Facebook className="w-4 h-4" />
    Facebook
  </Button>
  <Button onClick={() => signInWithProvider('google')}>Google</Button>
</div>
```

---

### 6. **Nouveau hook : useEnsureOAuthProfile** (`src/hooks/useEnsureOAuthProfile.ts`)

Cette fonction crée automatiquement un profil utilisateur après une connexion OAuth :

```typescript
useEnsureOAuthProfile()
```

**Logique** :

1. ✅ Vérifie si un profil existe pour l'utilisateur connecté
2. ✅ Si le profil n'existe pas, le crée avec les données OAuth
3. ✅ Récupère `full_name` et `avatar_url` depuis `user_metadata`
4. ✅ Affecte le rôle "membre" par défaut

**Avantages** :

- Pas besoin d'ajouter les données manuellement
- Fonctionne automatiquement pour Facebook et Google
- Respecte les contraintes RLS de Supabase

---

### 7. **Layout.tsx mis à jour** (`src/components/Layout.tsx`)

```typescript
import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile'

const Layout = ({ children }) => {
  // ...
  useEnsureOAuthProfile() // Appel du hook
  // ...
}
```

**Effet** :

- Le hook s'exécute automatiquement pour tous les utilisateurs connectés
- Garantit que le profil existe dès la connexion OAuth

---

### 8. **Nouveau composant : UserProfileDisplay** (`src/components/UserProfileDisplay.tsx`)

Affiche les informations du profil utilisateur connecté :

**Caractéristiques** :

- ✅ Avatar avec fallback aux initiales
- ✅ Affichage du nom complet et email
- ✅ Numéro de téléphone (si disponible)
- ✅ Rôle utilisateur
- ✅ Date d'adhésion
- ✅ Boutons "Modifier le profil" et "Se déconnecter"

```typescript
<UserProfileDisplay onLogoutSuccess={() => console.log('Déconnecté')} />
```

---

### 9. **Nouveau composant : AuthContainer** (`src/components/AuthContainer.tsx`)

**Composant unifiée qui gère l'affichage intelligent** :

1. **Si l'utilisateur est en cours de chargement** → Affiche un spinner
2. **Si l'utilisateur est connecté** → Affiche `UserProfileDisplay`
3. **Si l'utilisateur n'est pas connecté** → Affiche les 3 onglets d'authentification

**Utilisation** :

```typescript
<AuthContainer initialMode='login' onAuthSuccess={() => navigate('/')} />
```

**Avantages** :

- Composant unique et réutilisable
- Gère automatiquement tous les états
- Interface propre et professionnelle

---

## 🔌 Configuration Supabase requise

### 1. **Facebook OAuth Provider**

```
Settings → Authentication → Providers → Facebook
- Enable Facebook
- Client ID: [votre ID Client Facebook]
- Client Secret: [votre Secret Client]
```

### 2. **Google OAuth Provider** (déjà configuré)

```
Settings → Authentication → Providers → Google
```

### 3. **Row Level Security (RLS) sur la table `profiles`**

```sql
-- Permettre aux utilisateurs de lire/modifier leur propre profil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Permettre l'insertion automatique après signup
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
WITH CHECK (true);
```

### 4. **Storage Bucket pour les avatars** (optionnel)

```
Storage → Buckets → avatars
- Create new bucket: "avatars"
- Public: false (ou true si vous voulez que les avatars soient publics)
```

---

## 🎯 Flux utilisateur

### Connexion classique (Email/Password)

1. Utilisateur clique sur l'onglet "Connexion"
2. Entre email et mot de passe
3. Clique "Se connecter"
4. **Redirect** vers `/` ou `/admin` selon le rôle
5. Profil affiché automatiquement

### Connexion Facebook/Google

1. Utilisateur clique sur "Facebook" ou "Google"
2. Redirection vers le fournisseur OAuth
3. Authentification complétée
4. Retour à l'application avec session
5. **Hook `useEnsureOAuthProfile`** crée automatiquement le profil
6. **Redirect** vers `/` ou `/admin`

### Inscription

1. Utilisateur clique sur l'onglet "Inscription"
2. Remplit le formulaire (prénom, nom, email, mot de passe, etc.)
3. Clique "Créer mon compte"
4. **Email de confirmation** envoyé
5. Confirmation automatique possible
6. **Redirect** vers la page de connexion
7. Utilisateur peut maintenant se connecter

### Réinitialisation de mot de passe

1. Utilisateur clique sur "Mot de passe oublié"
2. Entre son email
3. Clique "Envoyer le lien"
4. **Email de réinitialisation** envoyé
5. Utilise le lien pour réinitialiser
6. Peut à nouveau se connecter avec le nouveau mot de passe

---

## 📦 Dépendances requises

Assurez-vous que les packages suivants sont installés :

```bash
npm install @supabase/supabase-js
npm install react-router-dom
npm install lucide-react
npm install @radix-ui/react-tabs
```

---

## ✅ Checklist d'intégration

- [ ] Vérifier que Facebook OAuth est configuré dans Supabase
- [ ] Vérifier que Google OAuth est configuré dans Supabase
- [ ] Vérifier que la table `profiles` existe avec les colonnes :
  - `id` (uuid, PRIMARY KEY)
  - `full_name` (text)
  - `phone` (text, optional)
  - `avatar_url` (text, optional)
  - `role` (text, default: 'membre')
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- [ ] Vérifier les politiques RLS sur `profiles`
- [ ] Tester la connexion email/password
- [ ] Tester la connexion Facebook
- [ ] Tester la connexion Google
- [ ] Tester la réinitialisation de mot de passe
- [ ] Tester l'affichage du profil après connexion
- [ ] Vérifier que les avatars s'affichent correctement
- [ ] Déployer sur Vercel

---

## 🐛 Dépannage

### Le profil n'est pas créé après OAuth

**Cause** : Les politiques RLS ne permettent pas l'insertion automatique.

**Solution** :

```sql
CREATE POLICY "Allow auto profile creation for authenticated users"
ON profiles FOR INSERT
WITH CHECK (true);
```

### Les boutons OAuth ne fonctionnent pas

**Cause** : URL de redirection mal configurée.

**Solution** : Dans Supabase Settings → Authentication → URL Configuration

- Ajouter `https://paroisse-ten.vercel.app` à "Authorized redirect URLs"

### L'email de réinitialisation ne s'envoie pas

**Cause** : Configuration SMTP non complétée.

**Solution** : Dans Supabase Settings → Authentication → Email → SMTP Settings

- Renseigner les paramètres SMTP ou utiliser le service email fourni

---

## 🎨 Personnalisation optionnelle

### Modifier les couleurs des boutons OAuth

Dans `LoginForm.tsx` ou `RegisterForm.tsx` :

```typescript
// Bouton Facebook bleu
<Button
  variant="outline"
  className="bg-[#1877F2] hover:bg-[#165FDB] text-white"
>
  <Facebook className="w-4 h-4" />
  Facebook
</Button>

// Bouton Google avec logo
<Button
  variant="outline"
  className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
>
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    {/* SVG du logo Google */}
  </svg>
  Google
</Button>
```

### Ajouter plus de fournisseurs OAuth

Supabase supporte également :

- GitHub
- GitLab
- Microsoft
- Discord
- Twitch
- Apple

Ajoutez-les simplement à l'énumération `signInWithProvider` :

```typescript
signInWithProvider: (provider: 'google' | 'facebook' | 'github' | 'discord') => Promise<unknown>
```

---

## 📞 Support

Pour toute question sur l'intégration, consultez :

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Documentation shadcn/ui](https://ui.shadcn.com)
- [React Router](https://reactrouter.com)
