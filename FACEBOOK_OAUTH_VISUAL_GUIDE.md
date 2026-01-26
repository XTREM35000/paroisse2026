# 🎬 Facebook OAuth - Guide Visuel Étape par Étape

## 📺 Screenshots & Guides Visuels

### Étape 1 : Supabase Dashboard - Ajouter Facebook Provider

#### 1.1 - Accéder à Authentication

```
https://supabase.com/dashboard
│
├─ Sélectionner votre projet "Paroisse"
│  │
│  └─ Sidebar → Authentication
│     │
│     └─ Cliquer sur "Providers"
```

**À voir** : Une liste de providers (Google, GitHub, Facebook, etc.)

#### 1.2 - Configurer Facebook

```
Providers → Facebook
│
└─ Cliquer sur "Facebook" (ou son toggle)
   │
   ├─ Toggle: ON (Activer)
   │
   ├─ Client ID: 3041743659361307
   │
   ├─ Client Secret: 7c52e7ad39f5e959853729127775b730
   │
   └─ Save
```

**Résultat attendu** :

- Vous voyez une URL de redirection affichée (copier cette URL !)
- Exemple : `https://xxxxx.supabase.co/auth/v1/callback?provider=facebook`

---

### Étape 2 : Facebook Developers - Configurer OAuth

#### 2.1 - Aller à Facebook Developers

```
https://developers.facebook.com
│
└─ Sign In (avec votre compte Facebook)
   │
   └─ Sélectionner l'App avec ID: 3041743659361307
      │
      ├─ Settings → Basic
      │  │
      │  └─ Vérifier :
      │     ├─ App ID: 3041743659361307 ✅
      │     └─ App Secret: 7c52e7ad39f5e959853729127775b730 ✅
      │
      └─ Products → Facebook Login → Settings
         │
         └─ Cliquer sur ⚙️ Settings (sous Facebook Login)
```

#### 2.2 - Ajouter Valid OAuth Redirect URI

```
Facebook Login → Settings
│
├─ Trouver: "Valid OAuth Redirect URIs"
│
└─ Ajouter :
   ├─ https://xxxxx.supabase.co/auth/v1/callback?provider=facebook
   │  (L'URL copiée de Supabase)
   │
   └─ Save Changes
```

#### 2.3 - Configurer App Domains

```
Settings → Basic
│
├─ Trouver: "App Domains"
│
└─ Ajouter :
   ├─ localhost
   ├─ localhost:5173
   ├─ 127.0.0.1
   └─ faith-flix.com (ou votre domaine production)

   Save
```

#### 2.4 - Vérifier les Permissions

```
Products → Facebook Login → Permissions
│
├─ Vérifier "public_profile" ✅ (par défaut)
├─ Ajouter "email" ✅ (si absent)
│
└─ Save
```

---

### Étape 3 : Test Local

#### 3.1 - Démarrer l'application

```bash
# Terminal à la racine du projet
npm run dev
# ou
bun run dev

# Vous devriez voir :
# ➜  Local:   http://localhost:5173/
```

#### 3.2 - Naviguer vers la page Auth

```
Ouvrir http://localhost:5173
│
└─ Chercher le lien vers la page Auth
   └─ Exemple : Cliquer sur "Se connecter" ou aller à http://localhost:5173/auth
```

#### 3.3 - Tester le Bouton Facebook

```
Page Auth
│
├─ Localiser le bouton "Facebook" (bleu)
│
└─ Cliquer dessus
   │
   └─ Une POPUP s'ouvre (popup Facebook de connexion)
      │
      └─ Vous voyez un formulaire "Facebook Login"
```

**Si vous voyez une popup, c'est bon !** ✅

#### 3.4 - Se Connecter avec Facebook

```
Popup Facebook Login
│
├─ Entrer vos identifiants Facebook
│  ├─ Email/Téléphone
│  └─ Mot de passe
│
└─ Cliquer "Connexion"
   │
   └─ Facebook demande les permissions
      │
      ├─ "Continuer en tant que [Votre Nom]"
      │
      └─ Cliquer pour autoriser
```

**Résultat attendu** :

- La popup se ferme
- Redirection vers `/` (accueil) ou `/admin` (si admin)
- Vous êtes authentifié ! ✅

#### 3.5 - Vérifier dans Supabase

```
https://supabase.com/dashboard
│
├─ Votre projet "Paroisse"
│  │
│  ├─ Authentication → Users
│  │  │
│  │  └─ Vous devriez voir votre nouvel utilisateur
│  │     ├─ Email : [Email de votre compte Facebook]
│  │     ├─ Provider : facebook
│  │     └─ User Metadata : contient les infos Facebook
│  │
│  └─ Table "profiles"
│     │
│     └─ Une nouvelle ligne créée avec :
│        ├─ ID : correspond à l'user
│        ├─ name : votre nom Facebook
│        └─ email : votre email Facebook
```

---

## 🧪 Cas de Test

### Test 1 : Connexion Réussie ✅

**Scénario** :

1. Cliquer sur le bouton Facebook
2. Se connecter avec un compte Facebook valide
3. Autoriser les permissions

**Résultat attendu** :

- Redirection vers la page d'accueil
- Session créée (vous pouvez voir "Déconnexion" au lieu de "Connexion")
- Profil créé dans Supabase

---

### Test 2 : Annulation de la Connexion

**Scénario** :

1. Cliquer sur le bouton Facebook
2. Fermer la popup (X) ou cliquer "Annuler"

**Résultat attendu** :

- Vous restez sur la page Auth
- Pas d'erreur en console
- Popup simplement fermée

---

### Test 3 : Erreur de Token

**Scénario** :

1. Modifier manuellement le token dans les logs de la console
2. Essayer une connexion invalide

**Résultat attendu** :

- Message d'erreur Toast : "Erreur de connexion Facebook"
- Vous restez sur la page Auth
- Pas d'authentification créée

---

## 🛠️ Dépannage Visuel

### Symptôme : "Popup bloquée"

**Cause** : Le navigateur bloque la popup  
**Solution** :

1. Vérifier la barre d'adresse pour un icône "popup bloquée"
2. Cliquer dessus et "Autoriser les popups pour ce site"
3. Réessayer

```
Icône popup bloquée (🚫)
    │
    └─ Cliquer
       │
       └─ "Toujours autoriser les popups pour localhost:5173"
```

---

### Symptôme : "Invalid OAuth Redirect URI"

**Cause** : L'URL dans Facebook ne correspond pas à celle de Supabase  
**Solution** :

```
1. Supabase Dashboard
   │
   └─ Authentication → Providers → Facebook
      │
      └─ Copier exactement l'URL affichée

2. Facebook Developers
   │
   └─ Settings → Valid OAuth Redirect URIs
      │
      └─ Coller EXACTEMENT l'URL copiée
```

**Vérifier que** :

- ❌ Pas d'espace au début/fin
- ❌ Pas de typo
- ✅ URL commence par `https://`
- ✅ URL contient `?provider=facebook`

---

### Symptôme : "App ID manquant ou incorrect"

**Cause** : L'ID n'est pas configuré correctement  
**Solution** :

```
Supabase Dashboard → Authentication → Providers → Facebook
│
├─ Client ID: 3041743659361307 (vérifier)
│
└─ Si vide ou mal écrit, remplir et Save
```

---

### Symptôme : Console affiche "Email not provided"

**Cause** : Le scope `email` n'est pas configuré  
**Solution** :

```
Facebook Developers
│
└─ Products → Facebook Login → Permissions
   │
   └─ Ajouter "email" aux scopes disponibles
      │
      └─ Save
```

---

## 📊 Vérification Progressive

### Avant de Tester

```bash
# 1. Valider les fichiers
pwsh facebook-oauth-validation.ps1  # Windows
bash facebook-oauth-validation.sh   # Linux/Mac

# Résultat attendu : "✅ Intégration Facebook OAuth valide !"
```

### Lors du Test

```
1. Ouvrir DevTools (F12)
   │
   └─ Console (Ctrl+Shift+J)
      │
      └─ Vérifier pas d'erreurs rouges

2. Cliquer sur Facebook
   │
   └─ Chercher dans Console :
      ✅ "Token Facebook reçu" (si logs sont actifs)
      ✅ ou "Redirection OAuth"

3. Après connexion
   │
   └─ Vérifier :
      ✅ URL = http://localhost:5173/
      ✅ Pas d'erreur 404
      ✅ Session active (visible dans le profil)
```

### Après la Connexion

```
1. Ouvrir Supabase Dashboard
   │
   └─ Authentication → Users
      │
      └─ Vérifier votre nouvel utilisateur présent

2. Vérifier la table "profiles"
   │
   └─ Supabase Dashboard → Table Editor → profiles
      │
      └─ Vérifier une ligne créée avec vos infos Facebook
```

---

## 🚨 Erreurs Courantes & Solutions

| Erreur                       | Cause                             | Solution                                          |
| ---------------------------- | --------------------------------- | ------------------------------------------------- |
| `Invalid OAuth Redirect URI` | URL mal configurée                | Vérifier exactitude URL Supabase dans Facebook    |
| `App ID manquant`            | Pas d'ID configuré dans Supabase  | Aller Supabase → Providers → Ajouter ID           |
| `Email not provided`         | Email scope absent                | Facebook Developers → Permissions → Ajouter email |
| Popup bloquée                | Popup non autorisée               | Autoriser les popups pour localhost               |
| Redirection infinie          | Problème de session               | Vider le cache/cookies, recommencer               |
| Profil non créé              | Erreur dans `ensureProfileExists` | Vérifier table `profiles` et RLS policies         |

---

## ✨ Vue d'ensemble Complète

### Flux Visuel Complet

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Page Auth                                          │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────┐      │   │
│  │  │ Bouton "Facebook"                        │      │   │
│  │  │ onClick → handleFacebookLogin()          │      │   │
│  │  └─────────┬──────────────────────────────┘      │   │
│  │            │                                       │   │
│  │            └─→ signInWithProvider('facebook')      │   │
│  └────────────────┼──────────────────────────────────┘   │
│                   │                                        │
└───────────────────┼────────────────────────────────────────┘
                    │
                    │ OAuth Request
                    │
┌───────────────────┼────────────────────────────────────────┐
│                   ▼                                         │
│         ┌──────────────────────┐                          │
│         │  Facebook Developers │                          │
│         │                      │                          │
│         │  Popup Login         │                          │
│         │  (User logs in)      │                          │
│         │                      │                          │
│         └──────┬───────────────┘                          │
│                │                                          │
│                │ OAuth Response                           │
│                │ (Token + Code)                           │
└────────────────┼──────────────────────────────────────────┘
                 │
┌────────────────┼──────────────────────────────────────────┐
│                │                                          │
│                ▼                                          │
│    ┌─────────────────────────┐                           │
│    │  Supabase Auth Server   │                           │
│    │                         │                           │
│    │  1. Verify Token        │                           │
│    │  2. Create User         │                           │
│    │  3. Create Session      │                           │
│    │                         │                           │
│    └────────────┬────────────┘                           │
│                 │                                         │
│                 │ Session Créée                           │
│                 │                                         │
└─────────────────┼──────────────────────────────────────────┘
                  │
┌─────────────────┼──────────────────────────────────────────┐
│                 ▼                                          │
│    ┌─────────────────────────────────────────┐            │
│    │  Frontend Callback                      │            │
│    │                                         │            │
│    │  ensureProfileExists()                  │            │
│    │  ├─ Créer/Mettre à jour profil        │            │
│    │  ├─ Récupérer le rôle                 │            │
│    │  └─ Redirection intelligente            │            │
│    │     ├─ Admin → /admin                  │            │
│    │     └─ User → /                        │            │
│    └─────────────────────────────────────────┘            │
│                                                           │
│                      ✅ Succès !                          │
└───────────────────────────────────────────────────────────┘
```

---

## 📚 Ressources Complémentaires

- [FACEBOOK_OAUTH_SETUP.md](FACEBOOK_OAUTH_SETUP.md) - Configuration Supabase
- [FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md](FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md) - Checklist complète
- [README_FACEBOOK_OAUTH.md](README_FACEBOOK_OAUTH.md) - Vue d'ensemble rapide

---

**Guide créé par** : GitHub Copilot  
**Date** : 26 janvier 2026  
**Pour l'app** : Paroisse (Faith-Flix)
