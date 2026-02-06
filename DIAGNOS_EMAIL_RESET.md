# Diagnostic - Problème de Réinitialisation du Mot de Passe

## Problème

L'email de réinitialisation du mot de passe n'est pas envoyé lors du formulaire "Mot de passe oublié" sur la page `/auth`.

## Causes Probables

### 1. **Supabase Email Auth Non Configuré** ⚠️ (TRÈS PROBABLE)

- Supabase a besoin d'un **SMTP custom** ou **SendGrid/Mailgun** pour envoyer les emails
- Par défaut, Supabase n'envoie pas les emails (test mode)
- Solution: Aller dans Supabase Dashboard → Authentication → Email Provider

### 2. **URL de Redirection Non Autorisée**

- L'URL `{window.location.origin}/reset-password` doit être ajoutée à la liste des URLs autorisées dans Supabase
- Actuellement utilisé: `https://faith-flix.vercel.app` ou `http://localhost:5173`
- Solution: Ajouter dans Supabase → Authentication → URL Configuration → Redirect URLs

### 3. **Problème d'Authentification du Client**

- Les credentials Supabase dans `.env` peuvent être invalides ou mal configurées

## Vérifications à Faire

### ✅ Étape 1: Vérifier les Variables d'Environnement

```bash
# Dans .env:
VITE_SUPABASE_URL=https://cghwsbkxcjsutqwzdbwe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### ✅ Étape 2: Configurer SMTP dans Supabase

1. Aller sur: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email
2. Aller à "Email Provider"
3. Cocher "Enable Custom SMTP" OU utiliser "SendGrid/Mailgun"
4. Ajouter credentials SMTP

### ✅ Étape 3: Ajouter les URLs de Redirection

1. Aller sur: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration
2. Ajouter sous "Redirect URLs":
   - `http://localhost:5173/reset-password` (développement)
   - `https://faith-flix.vercel.app/reset-password` (production)
   - `https://faith-flix.vercel.app/auth` (production)

### ✅ Étape 4: Vérifier les Template Emails

1. Aller sur: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/templates
2. Vérifier que "Password reset" template est activé
3. Vérifier que le lien contient `{{ .ConfirmationURL }}`

## Solutions Recommandées

### Solution Rapide: Utiliser Email Resend

```typescript
// Installation
npm install resend

// Usage
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@faith-flix.com',
  to: email,
  subject: 'Réinitialisez votre mot de passe',
  html: `<a href="${resetUrl}">Réinitialiser le mot de passe</a>`
});
```

### Solution Production: SMTP Custom

Configurer un serveur SMTP (Gmail, SendGrid, Mailgun, etc.) dans Supabase

### Solution Alternative: Edge Function

Créer une edge function Supabase pour gérer l'envoi d'email via un service externe

## Fichiers Affectés

- `/src/components/ForgotPasswordModal.tsx` - Appel `resetPasswordForEmail`
- `/src/hooks/useAuth.tsx` - Méthode `resetPassword`
- `/src/components/ForgotPasswordForm.tsx` - Formulaire
