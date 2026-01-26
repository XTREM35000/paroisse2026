# 🔥 Facebook OAuth - 30 Secondes

**Status** : ✅ Code prêt

---

## ✅ Fait (Côté Code)

- SDK Facebook → `index.html` ✅
- Bouton + Fonction → `LoginForm.tsx` ✅
- Profil auto → `ensureProfileExists()` ✅
- Sécurité → Clé Secrète dans Supabase ✅

---

## ⏳ À Faire (30 min)

1. **Supabase** (5 min)

   ```
   Auth → Providers → Facebook
   Client ID: 3041743659361307
   Secret: 7c52e7ad39f5e959853729127775b730
   Save → Copy URL
   ```

2. **Facebook Dev** (10 min)

   ```
   Settings → Facebook Login → Settings
   Add OAuth Redirect URI (l'URL de Supabase)
   Add App Domains: localhost, localhost:5173, faith-flix.com
   Save
   ```

3. **Test** (5 min)

   ```bash
   npm run dev
   Click Facebook → Popup → ✅
   ```

4. **Deploy** (10 min)
   ```
   Push code → Test prod → Done
   ```

---

## 📚 Docs Rapides

- **Démarrer** → [README_FACEBOOK_OAUTH.md](README_FACEBOOK_OAUTH.md)
- **Config** → [FACEBOOK_OAUTH_SETUP.md](FACEBOOK_OAUTH_SETUP.md)
- **Erreur** → [FACEBOOK_OAUTH_VISUAL_GUIDE.md](FACEBOOK_OAUTH_VISUAL_GUIDE.md)
- **Code** → [FACEBOOK_OAUTH_CODE_REFERENCE.md](FACEBOOK_OAUTH_CODE_REFERENCE.md)
- **Tout** → [FACEBOOK_OAUTH_INDEX.md](FACEBOOK_OAUTH_INDEX.md)

---

## 🚀 Go Live in 30 min!

**Créé par** : GitHub Copilot | 26/01/2026 | ✅ Prêt
