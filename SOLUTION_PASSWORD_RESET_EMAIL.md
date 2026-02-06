# 📧 Guide de Correction - Réinitialisation Mot de Passe (Email non envoyé)

## 🎯 Problème Identifié

L'email de réinitialisation du mot de passe n'est pas envoyé lors du formulaire "Mot de passe oublié" sur la page `/auth`.

- **Route affectée**: `/auth` → Formulaire "Mot de passe oublié"
- **Fichiers concernés**:
  - `/src/components/ForgotPasswordModal.tsx`
  - `/src/components/ForgotPasswordForm.tsx`
  - `/src/hooks/useAuth.tsx` → méthode `resetPassword`
  - `/src/pages/ResetPasswordPage.tsx`

## 🔍 Causes Probables

### Priorité 1: **Supabase Email Auth Non Configuré** ⚠️ (TRÈS PROBABLE)

Par défaut, Supabase n'envoie **AUCUN EMAIL** sans configuration explicite d'un fournisseur d'email.

**Symptômes:**

- La demande de réinitialisation est acceptée (pas d'erreur dans les logs)
- L'email n'arrive jamais
- Console: `✅ Email accepté par Supabase` mais aucun email reçu

**Solution:**

```
1. Aller à: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email
2. Cliquer sur "Email Provider"
3. Choisir l'une de ces options:

   Option A: SMTP Custom (Gmail, Outlook, etc.)
   - Remplir Host, Port, User, Password

   Option B: SendGrid (recommandé)
   - Générer une clé API SendGrid
   - Ajouter la clé dans Supabase

   Option C: Mailgun
   - Configuration similaire à SendGrid
```

### Priorité 2: **URL de Redirection Non Autorisée**

L'URL du lien de réinitialisation peut ne pas être dans la liste des URLs autorisées.

**Symptômes:**

- Erreur Supabase: "Redirect URL not authorized"

**Configuration Requise:**

```
Aller à: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration

Ajouter sous "Redirect URLs":
- http://localhost:5173/reset-password (développement)
- https://faith-flix.vercel.app/reset-password (production)
- https://faith-flix.vercel.app/auth (si besoin)
```

### Priorité 3: **Template Email Non Activé**

Le template d'email de réinitialisation peut ne pas être activé ou mal configuré.

**Solution:**

```
Aller à: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/templates

Vérifier que:
1. "Password reset" template est activé (toggle ON)
2. Le contenu contient: {{ .ConfirmationURL }}
3. Le sujet et le contenu sont appropriés
```

## ✅ Checklist de Dépannage

- [ ] **Vérifier Supabase Email Provider est configuré**
  - Dashboard → Authentication → Email Provider
  - Doit avoir SMTP ou SendGrid/Mailgun configuré

- [ ] **Vérifier les URLs autorisées**
  - Dashboard → Authentication → URL Configuration
  - Ajouter `/reset-password` avec le bon domaine

- [ ] **Vérifier le template Email**
  - Dashboard → Authentication → Templates
  - S'assurer que "Password reset" est activé

- [ ] **Vérifier l'email de test**
  - Utiliser `/dev/test-password-reset` pour tester
  - Email doit être enregistré dans Supabase

- [ ] **Vérifier les logs Supabase**
  - Dashboard → Authentication → Logs
  - Chercher les erreurs de `resetPasswordForEmail`

- [ ] **Vérifier la console du navigateur**
  - Ouvrir DevTools (F12)
  - Chercher le groupe de logs "🔍 DIAGNOSTIC - MOT DE PASSE OUBLIÉ"
  - Vérifier si des erreurs sont affichées

## 🧪 Tester la Réinitialisation

### Via la Page de Test

```
1. Aller à: http://localhost:5173/dev/test-password-reset
2. Entrer une email test (doit être enregistré)
3. Cliquer "Tester l'envoi d'email"
4. Vérifier la réponse:
   - ✅ Succès: Email accepté par Supabase
   - ❌ Erreur: Voir le message d'erreur spécifique
```

### Via les Logs Console

```typescript
// Ouvrir DevTools (F12) et faire une demande de réinitialisation
// Les logs afficheront:

🔍 DIAGNOSTIC - MOT DE PASSE OUBLIÉ
📧 Email saisi: test@example.com
🌐 URL de redirection: http://localhost:5173/reset-password
🔑 Supabase Project ID: cghwsbkxcjsutqwzdbwe
🌍 Supabase URL: https://cghwsbkxcjsutqwzdbwe.supabase.co
📤 Envoi de la demande de réinitialisation...

// Résultats possibles:
✅ Email accepté par Supabase  → Les emails ne sont probablement pas configurés
❌ Erreur Supabase            → Voir le message d'erreur spécifique
```

## 🛠️ Solutions Implémentées dans le Code

### 1. Diagnostic Amélioré

Fichier: `/src/components/ForgotPasswordModal.tsx`

**Améliorations:**

- ✅ Logging détaillé avec diagnostics
- ✅ Gestion d'erreurs robuste
- ✅ Messages d'erreur explicites pour l'utilisateur
- ✅ Suggestions de configuration dans la console

```tsx
// Logs affichés:
⚠️ NOTE: Vérifiez que Supabase Email Auth est configuré avec SMTP/SendGrid/Mailgun
💡 ASTUCE: Si l'email n'arrive pas, Supabase Email Auth n'est probablement pas configuré
📋 Configuration requise: Dashboard Supabase → Authentication → Email Provider
```

### 2. Page de Test

Fichier: `/src/pages/PasswordResetTestPage.tsx`

**Fonctionnalités:**

- ✅ Interface de test simple
- ✅ Affichage des configurations
- ✅ Liens directs vers Supabase Dashboard
- ✅ Résultats détaillés avec solutions

**Accès:**

```
http://localhost:5173/dev/test-password-reset
```

### 3. Composant de Diagnostic (optionnel)

Fichier: `/src/components/SupabaseEmailDiagnostics.tsx`

**Peut être intégré dans:**

- DevTools
- Page Admin
- Page de Profil
- Page d'Aide

## 📋 Configuration Finale Requise

### Dans Supabase Dashboard

```
Project: cghwsbkxcjsutqwzdbwe
```

#### 1. Email Provider Setup

**Route:** https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email

Exemple avec SendGrid:

```
✓ Email Provider: SendGrid
✓ SendGrid API Key: [votre_clé_sendgrid]
✓ From Email Address: noreply@faith-flix.com
```

#### 2. URL Configuration

**Route:** https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration

```
Redirect URLs:
- http://localhost:5173/reset-password
- https://faith-flix.vercel.app/reset-password
- https://faith-flix.vercel.app/auth
```

#### 3. Email Templates

**Route:** https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/templates

Vérifier "Password reset" template:

```
Subject: Réinitialiser votre mot de passe
Body: Contient {{ .ConfirmationURL }} ou {{ .ConfirmationLink }}
Status: Enabled (toggleON)
```

## 🚀 Étapes de Déploiement

1. **Configuration Supabase** (CRITIQUE)
   - Configurer Email Provider
   - Ajouter URLs de redirection
   - Vérifier templates

2. **Test Local**

   ```bash
   npm run dev
   # Aller à: http://localhost:5173/dev/test-password-reset
   ```

3. **Test Production**

   ```bash
   # Déployer sur Vercel
   git push origin main
   # Tester à: https://faith-flix.vercel.app/dev/test-password-reset
   ```

4. **Monitoring**
   - Dashboard Supabase → Authentication → Logs
   - Chercher les tentatives de `resetPasswordForEmail`
   - Vérifier les erreurs/succès

## 📞 Ressources Supabase

- [Email Auth Documentation](https://supabase.com/docs/guides/auth/auth-email)
- [Email Provider Setup](https://supabase.com/docs/guides/auth/auth-email-selfsigned)
- [SendGrid Integration](https://supabase.com/docs/guides/auth/auth-email-sendgrid)
- [Mailgun Integration](https://supabase.com/docs/guides/auth/auth-email-mailgun)

## 📝 Fichiers Modifiés

- ✅ `/src/components/ForgotPasswordModal.tsx` → Diagnostic amélioré
- ✅ `/src/pages/PasswordResetTestPage.tsx` → Page de test créée
- ✅ `/src/components/SupabaseEmailDiagnostics.tsx` → Composant de diagnostic créé
- ✅ `/src/App.tsx` → Route `/dev/test-password-reset` ajoutée
- ✅ `/DIAGNOS_EMAIL_RESET.md` → Documentation créée

## 🎯 Résumé

**Le problème:** Supabase Email Auth probablement non configuré

**La solution:** Configurer un Email Provider (SMTP/SendGrid/Mailgun) dans Supabase Dashboard

**Pour tester:** Aller à `/dev/test-password-reset` après configuration

**Support:** Voir les logs console pour diagnostics détaillés
