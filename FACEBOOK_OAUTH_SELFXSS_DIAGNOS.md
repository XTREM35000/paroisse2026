# 🔧 Diagnostic Self-XSS Facebook OAuth

## ⚠️ Problème

Facebook affiche le warning : **"Stop ! Il s'agit d'une fonctionnalité de navigateur..."**

Cela signifie que Facebook détecte une **manipulation d'URL suspecte** ou une **configuration mal alignée**.

---

## ✅ Checklist de Configuration Facebook

### 1️⃣ Vérifier l'App Facebook

1. Allez sur **[developers.facebook.com](https://developers.facebook.com)**
2. Sélectionnez votre app
3. Aller à **Settings** → **Basic**
4. Vérifiez :
   - ✅ **App Domains** :
     - En dev : `localhost:8080`
     - En prod : `votre-domaine.com`
   - ✅ **Valid OAuth Redirect URIs** :
     - En dev : `http://localhost:8080/auth/callback`
     - En prod : `https://votre-domaine.com/auth/callback`

⚠️ **IMPORTANT** : L'URI doit être **exacte** (aucun slash supplémentaire, aucun port manquant).

### 2️⃣ Vérifier les Paramètres OAuth Facebook App

1. **Settings** → **Basic**
2. Scrollez vers **Audience de l'app**
   - ✅ Assurez-vous que l'app n'est pas en **Development mode** si vous testez en production
   - ✅ Si elle est en beta, activez "**Client OAuth Login**" et "**Web OAuth Login**"

### 3️⃣ Vérifier les Rôles & Accès

1. **Roles** → **Test Users** ou **App Roles**
2. Assurez-vous que votre compte de test a les permissions **"Can Use App"**

---

## 🔍 Diagnostic de l'URL

Ouvrez **DevTools** (F12) → **Network** et :

1. Cliquez sur **"Se connecter avec Facebook"**
2. Regardez les requêtes réseau :
   - Cherchez une requête vers `facebook.com` contenant :
     - `client_id` : doit correspondre à votre app ID
     - `redirect_uri` : doit correspondre à celle configurée dans Facebook
     - `response_type=code`
     - `scope` : doit contenir au minimum `email,public_profile`

3. Si une requête échoue (statut != 200), notez l'erreur

### Exemple d'URL correcte :

```
https://facebook.com/v18.0/dialog/oauth?
  client_id=YOUR_APP_ID&
  redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fcallback&
  response_type=code&
  scope=email%2Cpublic_profile&
  state=SOME_STATE_TOKEN
```

---

## 🛠️ Fixes Appliqués

### Dans `src/pages/AuthCallback.tsx` :

- ✅ Diagnostic d'URL complète au démarrage
- ✅ Délai de **500ms** avant de nettoyer l'URL (pour que Facebook finisse son traitement)
- ✅ `window.history.replaceState()` appelé **APRÈS** le signOut, pas avant
- ✅ Logging détaillé en console pour déboguer

### Dans `src/components/LoginForm.tsx` :

- ✅ Logging de l'URL de callback prévue
- ✅ Délai de **300ms** après signOut avant de nettoyer l'URL
- ✅ Plus de logs pour tracer le flux exact

---

## 🧪 Étapes de Test

### Test Local (dev)

```bash
# 1. Assurez-vous que le serveur dev tourne
npm run dev
# Doit écouter sur http://localhost:8080

# 2. Ouvrez http://localhost:8080 dans le navigateur

# 3. Cliquez sur "Se connecter avec Facebook"

# 4. Ouvrez DevTools (F12) → Console
# Cherchez les logs avec 🔵 et 🔍 pour voir les URLs

# 5. Si le warning "Stop!" apparaît :
#    - Vérifiez que http://localhost:8080/auth/callback est dans "Valid OAuth Redirect URIs"
#    - Vérifiez que localhost:8080 est dans "App Domains"
```

### En Cas d'Erreur "Stop!"

1. **Fermez tous les onglets** de Facebook/Instagram
2. **Videz le cache** du navigateur (Ctrl+Shift+Delete)
3. **Ouvrez une nouvelle fenêtre privée** (Incognito)
4. Retestez la connexion Facebook

---

## 📋 Configuration Supabase

Votre configuration actuelle :

```
Supabase Project ID: cghwsbkxcjsutqwzdbwe
Supabase URL: https://cghwsbkxcjsutqwzdbwe.supabase.co
Callback attendu: http://localhost:8080/auth/callback (en dev)
Scopes: email,public_profile
```

### Vérifier les Authorized Redirect URIs dans Supabase

1. Allez sur **[supabase.com](https://supabase.com)**
2. Sélectionnez votre projet : `cghwsbkxcjsutqwzdbwe`
3. **Settings** → **Authentication**
4. **Authorized redirect URIs** doit contenir :
   - `http://localhost:8080/auth/callback` (pour dev)
   - `https://votre-domaine-prod.com/auth/callback` (pour prod)

---

## 🚀 Solution Rapide (Si Vous Testez)

Si vous voyez toujours le warning après ces vérifications :

1. **Testez depuis une fenêtre incognito** (élimine les sessions corrompues)
2. **Déconnectez-vous de Facebook** (https://www.facebook.com/logout.php) avant le test
3. **Vérifiez l'heure serveur** (Facebook peut rejeter si le timestamp est trop décalé)

---

## 📞 Support

Si le problème persiste après la vérification de cette checklist, consultez :

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- Note l'URL exacte dans l'onglet Network et vérifie qu'elle correspond précisément à la configuration
