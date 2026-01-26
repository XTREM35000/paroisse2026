# 🔑 Facebook OAuth - Credentials & URLs de Référence

**IMPORTANT** : Ce fichier contient des informations sensibles. À manipuler avec soin.

---

## 📋 Credentials Facebook Fournis

| Champ           | Valeur                                                 |
| --------------- | ------------------------------------------------------ |
| **App ID**      | `3041743659361307`                                     |
| **App Secret**  | `7c52e7ad39f5e959853729127775b730` ⚠️ **CONFIDENTIEL** |
| **API Version** | `v24.0`                                                |
| **Platform**    | Facebook.com                                           |

---

## 🔒 Où Stocker Chaque Credential

| Credential      | Où Stocker                          | Où **PAS** Stocker       |
| --------------- | ----------------------------------- | ------------------------ |
| **App ID**      | ✅ Frontend (index.html)            | ❌ N/A (public)          |
| **App Secret**  | ✅ **Supabase Dashboard SEULEMENT** | ❌ ❌ ❌ JAMAIS Frontend |
| **API Version** | ✅ Frontend (index.html)            | ❌ N/A (public)          |

---

## 🌐 URLs Importantes

### Facebook Developers

| Ressource          | URL                                                                   |
| ------------------ | --------------------------------------------------------------------- |
| **Dashboard**      | https://developers.facebook.com                                       |
| **Vos Apps**       | https://developers.facebook.com/apps                                  |
| **App Settings**   | https://developers.facebook.com/apps/3041743659361307/settings/basic/ |
| **Facebook Login** | https://developers.facebook.com/docs/facebook-login                   |
| **Graph API**      | https://developers.facebook.com/docs/graph-api                        |

### Supabase

| Ressource               | URL                                                              |
| ----------------------- | ---------------------------------------------------------------- |
| **Dashboard**           | https://supabase.com/dashboard                                   |
| **Providers**           | https://supabase.com/dashboard/project/[ID]/auth/providers       |
| **OAuth Documentation** | https://supabase.com/docs/guides/auth/social-login               |
| **Facebook Auth Guide** | https://supabase.com/docs/guides/auth/social-login/auth-facebook |

### Votre Application

| Page          | URL (Dev)                   | URL (Prod)                   |
| ------------- | --------------------------- | ---------------------------- |
| **Auth Page** | http://localhost:5173/#auth | https://faith-flix.com/#auth |
| **Home**      | http://localhost:5173       | https://faith-flix.com       |
| **Admin**     | http://localhost:5173/admin | https://faith-flix.com/admin |

---

## ✅ OAuth Redirect URI (À Configurer)

### URL Supabase de Redirection

Après activation du provider Facebook dans Supabase, vous verrez :

```
https://[PROJECT_ID].supabase.co/auth/v1/callback?provider=facebook
```

**Cette URL doit être copiée dans Facebook Developers :**

1. Aller à https://developers.facebook.com/apps/3041743659361307
2. **Settings** → **Facebook Login** → **Settings**
3. **Valid OAuth Redirect URIs** → Ajouter l'URL ci-dessus
4. **Save Changes**

---

## 🔍 Configuration Actuelle (Checklist)

### Frontend (index.html)

```html
<!-- ✅ App ID: 3041743659361307 (OK) -->
<!-- ✅ API Version: v24.0 (OK) -->
<!-- ❌ App Secret: Ne JAMAIS ajouter ici -->
```

### LoginForm.tsx

```typescript
// ✅ Bouton Facebook présent
// ✅ handleFacebookLogin() implémentée
// ✅ signInWithProvider('facebook') appelée
// ✅ ensureProfileExists() appelée après connexion
```

### Supabase Dashboard

```
Authentication → Providers → Facebook
├─ Status: ⏳ À configurer
│  ├─ Client ID: À remplir (3041743659361307)
│  ├─ Client Secret: À remplir (7c52e7ad39f5e959853729127775b730)
│  └─ Save
│
└─ Résultat: Une URL de redirection apparaît
   ├─ À copier
   └─ À ajouter dans Facebook Developers
```

### Facebook Developers

```
App Settings (3041743659361307)
├─ Settings → Basic
│  ├─ App ID: 3041743659361307 ✅ Vérifier
│  ├─ App Secret: 7c52e7ad39f5e959853729127775b730 ✅ Vérifier
│  │
│  └─ App Domains: À remplir
│     ├─ localhost
│     ├─ localhost:5173
│     └─ faith-flix.com (ou votre domaine)
│
└─ Products → Facebook Login → Settings
   ├─ Valid OAuth Redirect URIs: À remplir
   │  └─ [URL de Supabase]
   │
   └─ Permissions
      ├─ public_profile ✅ (par défaut)
      └─ email ✅ (ajouter si absent)
```

---

## 🔐 Checklist de Sécurité

### ❌ À JAMAIS FAIRE

- [ ] Exposer `7c52e7ad39f5e959853729127775b730` en frontend
- [ ] Commiter le secret dans Git
- [ ] Partager le secret par email/chat
- [ ] Utiliser le secret en JavaScript côté client
- [ ] Hardcoder le secret dans le code source

### ✅ À TOUJOURS FAIRE

- [ ] Garder le secret dans Supabase Dashboard
- [ ] Utiliser HTTPS en production
- [ ] Vérifier les tokens via Supabase (pas le frontend)
- [ ] Limiter les scopes aux besoins (public_profile + email)
- [ ] Tester avec des tokens valides uniquement
- [ ] Vérifier les logs en cas d'erreur

---

## 🧪 Test des URLs de Redirection

### Test Local

```bash
# URL locale
http://localhost:5173/#auth

# Après clic Facebook, vous devriez être redirigé vers :
http://localhost:5173/
# ou
http://localhost:5173/admin
```

### Test Production

```
# URL production
https://faith-flix.com/#auth

# Après clic Facebook, vous devriez être redirigé vers :
https://faith-flix.com/
# ou
https://faith-flix.com/admin
```

---

## 📊 API Endpoints Facebook (pour référence)

Si vous devez appeler l'API Facebook directement (OPTIONNEL) :

### 1. Debug Token

```
GET https://graph.facebook.com/debug_token
?input_token=[ACCESS_TOKEN]
&access_token=[APP_ID]|[APP_SECRET]

Réponse:
{
  "data": {
    "app_id": "3041743659361307",
    "type": "USER",
    "application": "Paroisse",
    "data_access_expires_at": 1234567890,
    "expires_at": 1234567890,
    "is_valid": true,
    "issued_at": 1234567890,
    "scopes": ["public_profile", "email"],
    "user_id": "123456789"
  }
}
```

### 2. Get User Profile

```
GET https://graph.facebook.com/v24.0/me
?fields=id,name,email,picture
&access_token=[ACCESS_TOKEN]

Réponse:
{
  "id": "123456789",
  "name": "John Doe",
  "email": "john@example.com",
  "picture": {
    "data": {
      "height": 50,
      "is_silhouette": false,
      "url": "https://...",
      "width": 50
    }
  }
}
```

---

## 🚀 Configuration Étape par Étape (Copier-Coller)

### Étape 1 : Supabase Dashboard

**URL** : https://supabase.com/dashboard

```
1. Sélectionner projet "Paroisse"
2. Authentication → Providers
3. Cliquer sur Facebook
4. Toggle ON
5. Client ID: 3041743659361307
6. Client Secret: 7c52e7ad39f5e959853729127775b730
7. Save
8. ⚠️ Copier l'URL affichée
```

### Étape 2 : Facebook Developers

**URL** : https://developers.facebook.com/apps/3041743659361307

```
1. Settings → Basic
2. Vérifier App ID et Secret
3. App Domains → Ajouter:
   - localhost
   - localhost:5173
   - faith-flix.com

4. Products → Facebook Login → Settings
5. Valid OAuth Redirect URIs → Ajouter:
   - [L'URL copiée de Supabase]

6. Save Changes

7. Products → Facebook Login → Permissions
8. Vérifier public_profile
9. Ajouter email si absent
```

### Étape 3 : Test

```bash
npm run dev
# Ouvrir http://localhost:5173
# Cliquer sur Facebook
# ✅ Popup apparaît
# Connexion réussie = redirection vers /
```

---

## 📞 En Cas de Problème

### Erreur : "Invalid Redirect URI"

**Vérifier** :

```
✅ L'URL de Supabase est exactement copiée
✅ Pas d'espace au début/fin
✅ L'URL commence par https://
✅ L'URL contient ?provider=facebook
```

### Erreur : "Email not provided"

**Vérifier** :

```
✅ Email scope ajouté dans Facebook Developers
✅ Permissions → email présent
✅ Compte Facebook lié à un email (pas SMS seul)
```

### Erreur : "App ID incorrect"

**Vérifier** :

```
✅ 3041743659361307 dans Supabase Dashboard
✅ Provider Facebook ACTIVÉ (toggle ON)
✅ Pas de typo dans l'ID
```

---

## 🎯 Résumé des Credentials à Utiliser

| Lieu             | Credential     | Valeur                             |
| ---------------- | -------------- | ---------------------------------- |
| **index.html**   | appId          | `3041743659361307`                 |
| **index.html**   | version        | `v24.0`                            |
| **Supabase**     | Client ID      | `3041743659361307`                 |
| **Supabase**     | Client Secret  | `7c52e7ad39f5e959853729127775b730` |
| **Facebook Dev** | OAuth Redirect | [URL Supabase]                     |

---

## ✅ Avant le Déploiement

- [ ] Credentials configurés dans Supabase
- [ ] OAuth Redirect URI dans Facebook Developers
- [ ] App Domains complètes dans Facebook Developers
- [ ] Email scope activé
- [ ] Test local réussi
- [ ] Test en production scheduled

---

**Créé par** : GitHub Copilot  
**Date** : 26 janvier 2026  
**Confidentialité** : ⚠️ Contient des credentials (à sécuriser)
