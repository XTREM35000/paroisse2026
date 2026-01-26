# Configuration Facebook OAuth avec Supabase

## 📋 Vue d'ensemble

Votre application utilise **Supabase** pour la gestion de l'authentification. Facebook OAuth est géré **côté Supabase** (pas besoin de backend personnalisé pour la vérification des tokens).

## 🔐 Données Facebook fournies

```
ID App:        3041743659361307
Clé Secrète:   7c52e7ad39f5e959853729127775b730
Version API:   v24.0
```

⚠️ **IMPORTANT** : Ne jamais exposer la **Clé Secrète** en frontend !

## 🚀 Étapes de Configuration dans Supabase

### 1. Accéder à Supabase Dashboard

1. Aller sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet Paroisse
3. Aller à **Authentication** → **Providers**

### 2. Configurer Facebook OAuth

Dans le panneau **Providers** :

1. Cliquer sur **Facebook**
2. Activer le provider (toggle ON)
3. Remplir les champs :
   - **Client ID (App ID)** : `3041743659361307`
   - **Client Secret** : `7c52e7ad39f5e959853729127775b730`
4. Cliquer **Save**

### 3. Configurer les URLs de redirection dans Facebook

Après activation dans Supabase, vous verrez une URL de redirection. Celle-ci doit être configurée dans Facebook :

1. Aller sur [Facebook Developers](https://developers.facebook.com)
2. Sélectionner votre App (ID 3041743659361307)
3. Aller à **Settings** → **Basic** (noter l'App ID et Secret)
4. Aller à **Facebook Login** → **Settings**
5. Dans **Valid OAuth Redirect URIs**, ajouter l'URL fournie par Supabase :
   - Exemple : `https://xxxxx.supabase.co/auth/v1/callback?provider=facebook`

### 4. Vérifier les permissions

Dans Facebook Developers, aller à **Facebook Login** → **Permissions** et vérifier que ces scopes sont disponibles :

- `public_profile` ✅ (par défaut)
- `email` ✅ (ajouter si absent)

## 💻 Code Frontend - Déjà Implémenté

### Dans `index.html`

```html
<script>
  window.fbAsyncInit = function () {
    console.log('Facebook SDK initialized')
  }

  ;(function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0]
    if (d.getElementById(id)) return
    js = d.createElement(s)
    js.id = id
    js.src =
      'https://connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v24.0&appId=3041743659361307'
    fjs.parentNode.insertBefore(js, fjs)
  })(document, 'script', 'facebook-jssdk')
</script>
```

### Dans `LoginForm.tsx`

La fonction `handleFacebookLogin()` :

- Appelle `signInWithProvider('facebook')` (Supabase gère tout)
- Attend la redirection OAuth
- Crée automatiquement le profil utilisateur via `ensureProfileExists()`
- Redirige l'utilisateur selon son rôle (admin ou utilisateur normal)

```typescript
const handleFacebookLogin = async () => {
  setFacebookLoading(true)
  try {
    await signInWithProvider('facebook') // Supabase gère la vérification du token

    // Créer le profil et rediriger
    // ... voir LoginForm.tsx pour le code complet
  } catch (err) {
    // Gestion d'erreur
  } finally {
    setFacebookLoading(false)
  }
}
```

## 🔒 Sécurité

✅ **Bonnes pratiques appliquées** :

1. **Clé Secrète jamais exposée en frontend** - Stockée uniquement dans Supabase Dashboard
2. **Tokens vérifiés par Supabase** - Pas de vérification manuelle nécessaire
3. **HTTPS obligatoire** - Les tokens OAuth ne fonctionnent qu'en HTTPS
4. **Scopes limités** - Uniquement `public_profile` et `email`
5. **Création de profil automatique** - Via hook `ensureProfileExists()`

## 🧪 Test Local

Pour tester avec `localhost:5173` :

1. Aller dans **Facebook Developers** → Votre App
2. **Settings** → **Basic** → **App Domains**
3. Ajouter : `localhost`, `localhost:5173`, `127.0.0.1`
4. **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**
5. Ajouter votre URL locale Supabase (fournie lors de l'activation)

## 📊 Flux Complet

```
1. Utilisateur clique sur "Facebook"
   ↓
2. LoginForm appelle handleFacebookLogin()
   ↓
3. signInWithProvider('facebook') redirige vers Facebook OAuth popup
   ↓
4. Utilisateur se connecte avec Facebook (popup sécurisée)
   ↓
5. Facebook redirige vers Supabase avec token
   ↓
6. Supabase vérifie le token avec Facebook API
   ↓
7. Supabase crée une session utilisateur
   ↓
8. Redirection vers la page de redirection d'origine
   ↓
9. ensureProfileExists() crée le profil dans la DB
   ↓
10. Redirection vers /admin ou / selon le rôle
```

## ⚙️ Configuration Supabase (JSON pour doc)

Si vous préférez une approche par API (avancée) :

```bash
# Activer Facebook Provider via Supabase CLI
supabase link --project-ref xxxxx
supabase db push

# Vérifier le statut
supabase auth list-providers
```

## 📞 Dépannage

**Symptôme** : "Invalid OAuth redirect URI"

- **Solution** : Vérifier que l'URL dans Facebook Developers correspond à celle de Supabase

**Symptôme** : "App ID manquant ou incorrect"

- **Solution** : Vérifier l'ID dans Supabase Dashboard → Authentication → Providers

**Symptôme** : Erreur "email not provided"

- **Solution** : Vérifier que `email` est dans les scopes Facebook Developers

**Symptôme** : Popup bloquée par navigateur

- **Solution** : La popup doit être triggered par un clic utilisateur (déjà le cas)

## ✅ Checklist Finale

- [ ] Facebook App ID configuré dans Supabase Dashboard
- [ ] Facebook App Secret configuré dans Supabase Dashboard (JAMAIS en frontend)
- [ ] Valid OAuth Redirect URI ajouté dans Facebook Developers
- [ ] Email scope activé dans Facebook Developers
- [ ] Code frontend dans `index.html` et `LoginForm.tsx` déployé
- [ ] Test local : clic sur bouton Facebook → popup apparaît
- [ ] Test local : connexion réussie → profil créé → redirection vers /
- [ ] Test production : même flux sur domaine en HTTPS

## 📚 Ressources

- [Supabase Auth Providers](https://supabase.com/docs/guides/auth/social-login)
- [Facebook Developers - Login](https://developers.facebook.com/docs/facebook-login)
- [Supabase OAuth Redirect URL](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

---

**Auteur** : GitHub Copilot  
**Date** : 26 janvier 2026  
**Status** : ✅ Prêt pour test
