# Inventaire des services externes — Paroisse NDC

**Objectif :** Gestion budgétaire des abonnements et coûts liés aux API, fournisseurs et plateformes utilisés par l’application.

**Périodicité des mises à jour :** À réviser au moins une fois par an ou à chaque changement de prestataire.

---

## Tableau récapitulatif

| Service | Type | Coût mensuel (estimation) | Périodicité | Utilité | Niveau de criticité |
|---------|------|---------------------------|-------------|---------|---------------------|
| **Supabase** | Hébergement / Auth / DB / Storage | 0–25 USD (Free) à 25+ USD (Pro) | Mensuel | Base de données, auth (email/OAuth), stockage fichiers, Edge Functions | Critique |
| **Vercel** | Hébergement frontend | 0–20 USD (Hobby/Pro) | Mensuel | Déploiement du site (www.nd-compassion.ci) | Critique |
| **CinetPay** | Paiement Mobile Money | Commission par transaction (~1–2,5 % + frais fixes) | Par transaction | Dons Orange Money, MTN, Moov, Wave | Critique |
| **Stripe** | Paiement carte | 0 + commission (~1,5 % + 0,25 €/transaction EU) | Par transaction | Dons par carte bancaire | Critique |
| **Resend** | Email transactionnel | 0–20 USD (3 000 emails/mois gratuits) | Mensuel ou à l’usage | Envoi des reçus de don par email | Élevée |
| **Google OAuth** | Authentification | Gratuit (quota élevé) | — | Connexion « Se connecter avec Google » | Élevée |
| **Facebook OAuth / Live** | Authentification + streaming | Gratuit (OAuth) ; Live gratuit (partage possible de revenus pub) | — | Connexion « Se connecter avec Facebook » ; diffusion Facebook Live | Élevée |
| **YouTube** | Streaming / tutoriels | Gratuit (embed) | — | Tutoriels (embed), source live possible | Moyenne |
| **Twitch** | Streaming | Gratuit (embed) | — | Source live possible (embed) | Moyenne |
| **Restream** | Multidiffusion | 0–16+ USD/mois (plans payants) | Mensuel | Multidiffusion (YouTube + Facebook + site) | Optionnel |
| **Nom de domaine** | DNS | ~10–30 USD/an (selon TLD) | Annuel | nd-compassion.ci | Critique |
| **Emails pro / SMTP** | Email | 0 (Supabase par défaut) ou 5–15 USD/mois (SendGrid, etc.) | Mensuel | Envoi emails auth (magic link, reset) ; optionnel si SMTP custom | Élevée |
| **SMS / OTP** | Vérification téléphone | À l’usage (Twilio ~0,05–0,10 USD/SMS ; opérateurs CI variables) | Par envoi | OTP connexion/inscription si activé (PhoneOTPForm) | Optionnel |

*Les montants sont en USD sauf indication (FCFA, €). Les fourchettes reflètent un usage type paroisse (trafic modéré).*

---

## 1. Authentification et utilisateurs

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **Supabase Auth** | Inclus dans l’abonnement Supabase | Mensuel | Connexion email/mot de passe, sessions, JWT. |
| **Google OAuth** | Gratuit (quota Google Cloud) | — | Bouton « Se connecter avec Google » (LoginForm). Pas d’abonnement requis pour un usage standard. |
| **Facebook OAuth** | Gratuit | — | Bouton « Se connecter avec Facebook » (LoginForm). App Facebook gratuite. |
| **Vérification téléphone (SMS OTP)** | Non implémenté avec un fournisseur payant dans le code ; si activé plus tard : Twilio, Orange SMS API, etc. | À l’usage | Composant `PhoneOTPForm` présent ; coût uniquement si vous activez l’auth SMS et souscrivez à une API SMS. |

**Synthèse :** Auth repose sur Supabase + OAuth Google/Facebook (gratuits). Coût fixe auth = partie Supabase uniquement.

---

## 2. Paiements et dons

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **CinetPay** | Pas d’abonnement fixe ; commission par transaction (ordre de grandeur : 1–2,5 % + frais par transaction selon contrat). | Par transaction | Mobile Money (OM, MTN, Moov, Wave) ; Edge Function `create-cinetpay-payment` + webhook. |
| **Stripe** | Pas de frais mensuels au démarrage ; ~1,5 % + 0,25 € par transaction (EU) ; autres devises selon pays. | Par transaction | Paiement par carte ; Edge Functions `create-payment`, `stripe-webhook`, `verify-payment`. |
| **Génération de reçus / emails** | Inclus dans Resend (voir ci‑dessous). | — | Function `send-receipt` envoie le reçu par email après don. |

**Synthèse :** Coût paiement = uniquement variable (commissions CinetPay + Stripe). Pas d’abonnement obligatoire pour démarrer.

---

## 3. Médias et streaming

| Service | Type d’usage | Coût | Périodicité | Utilité |
|---------|----------------|------|-------------|---------|
| **YouTube** | Embed (lecteur sur le site) | Gratuit | — | Tutoriels (YouTubePlayer), liens vidéo ; possible source de live. Pas de partage de revenus pour simple embed. |
| **Facebook Live** | Embed / page Facebook | Gratuit (côté app) | — | Source live possible ; revenus pub Facebook éventuels côté page Facebook, pas côté app. |
| **Twitch** | Embed | Gratuit | — | Source live possible (embed chaîne). |
| **Instagram / TikTok** | Embed | Gratuit | — | Sources live/embed supportées dans les providers. |
| **Restream.io** | Multidiffusion | Gratuit (limité) à 16+ USD/mois | Mensuel | Si la paroisse diffuse vers YouTube + Facebook + site en même temps ; optionnel. |
| **Hébergement vidéo / stockage** | Supabase Storage (buckets `video-files`, `videos`, etc.) | Inclus dans Supabase (quotas selon plan) | Mensuel | Fichiers vidéo, galerie, avatars, documents. |

**Synthèse :** Pas de coût fixe pour les plateformes d’embed (YouTube, Facebook, Twitch). Coût média = Supabase Storage + éventuellement Restream si multidiffusion.

---

## 4. SMS et notifications (email)

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **Resend** | 3 000 emails/mois gratuits ; au‑delà, forfaits payants (~20 USD/mois typique). | Mensuel ou à l’usage | Envoi des reçus de don (Edge Function `send-receipt` avec `RESEND_API_KEY`). |
| **Supabase (emails Auth)** | Inclus (limité sur plan Free) | — | Magic link, reset password, confirmation email. Peut être remplacé par SMTP custom (SendGrid, etc.). |
| **SendGrid / Mailgun / SMTP** | 0 (free tier) à 15+ USD/mois | Mensuel | Si vous configurez un SMTP personnalisé pour les emails auth (mention dans ForgotPasswordModal). |
| **SMS (Orange, Twilio, etc.)** | À l’usage (ex. Twilio ~0,05–0,10 USD/SMS) | Par envoi | OTP / alertes SMS uniquement si vous activez l’auth SMS ou des notifications SMS. |

**Synthèse :** Coût email = Resend (reçus) + optionnel SMTP/SMS si vous dépassez ou personnalisez.

---

## 5. Hébergement et infrastructure

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **Supabase** | Free : 0 USD ; Pro : 25 USD/mois et plus (DB, Auth, Storage, Edge Functions, bande passante). | Mensuel | Backend complet : base de données, authentification, stockage (avatars, galerie, vidéos, documents), Edge Functions (paiements, webhooks, reçus). |
| **Vercel** | Hobby : 0 USD ; Pro : 20 USD/mois (équipe, bande passante, builds). | Mensuel | Hébergement du frontend (React/Vite) ; production = www.nd-compassion.ci (cf. DEPLOY.md). |
| **CDN** | Inclus dans Vercel + Supabase Storage (bande passante selon plan). | — | Livraison des assets et des fichiers. |

**Synthèse :** Coût fixe principal = Supabase + Vercel. En « tout gratuit » (Free / Hobby), coût = 0 jusqu’aux limites des quotas.

---

## 6. Outils de développement et maintenance

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **Cursor / VS Code** | Cursor : abonnement possible ; VS Code : gratuit. | Mensuel ou annuel | IDE pour développer l’application. |
| **Sentry** | Non référencé dans le code ; si ajouté : free tier puis payant. | Mensuel | Monitoring des erreurs en production (optionnel). |
| **Backups** | Supabase Pro inclut des sauvegardes ; solutions externes en supplément si besoin. | Mensuel / annuel | Sauvegarde base de données. |
| **GitHub / Git** | Gratuit (repos privés). | — | Versioning et déploiement (Vercel lié au repo). |

**Synthèse :** Coût dev = surtout licences IDE et éventuellement monitoring/backup avancés.

---

## 7. Nom de domaine et emails

| Service | Coût | Périodicité | Utilité |
|---------|------|-------------|---------|
| **Nom de domaine (.ci ou autre)** | Variable (ex. 10–30 USD/an pour .ci). | Annuel | nd-compassion.ci (ou domaine actuel). |
| **Google Workspace / email pro** | ~6–12 USD/utilisateur/mois | Mensuel | Emails @nd-compassion.ci (optionnel, non géré par l’app). |

**Synthèse :** Coût annuel garanti = renouvellement du domaine. Emails pro = optionnel.

---

## Synthèse par catégorie de coût

### Coût fixe mensuel (abonnements récurrents)

- **Supabase** : 0 USD (Free) ou 25+ USD (Pro).
- **Vercel** : 0 USD (Hobby) ou 20 USD (Pro).
- **Resend** : 0 USD (free tier) ou ~20 USD selon volume.
- **Restream** : 0 USD (gratuit limité) ou 16+ USD/mois si multidiffusion.

### Coût variable (à l’usage)

- **CinetPay** : commission par transaction (Mobile Money).
- **Stripe** : commission par transaction (carte).
- **SMS** (si activé) : par SMS envoyé.

### Coût annuel

- **Nom de domaine** : renouvellement (ex. 10–30 USD/an).
- **Licences** : Cursor ou autres (si applicable).

---

## Recommandations

### Services à privilégier selon l’usage

- **Petite paroisse / démarrage :** Rester en Supabase Free + Vercel Hobby + Resend free tier. CinetPay + Stripe en commission seule. Domaine = seul coût annuel fixe.
- **Croissance (trafic, dons, stockage) :** Passer Supabase Pro si limites atteintes ; Vercel Pro si besoin d’équipe ou de bande passante ; Resend payant si > 3 000 reçus/mois.
- **Streaming :** YouTube / Facebook Live / Twitch en embed = gratuit. Restream uniquement si multidiffusion multi‑plateformes nécessaire.

### Alternatives gratuites ou low‑cost

- **Emails transactionnels :** Resend free tier, ou Supabase Auth (emails inclus), ou SendGrid free tier.
- **Streaming :** Ne pas souscrire à Restream si un seul flux (YouTube ou Facebook) suffit ; utiliser l’embed direct.
- **Hébergement :** Netlify en alternative à Vercel (free tier similaire).

### Seuils indicatifs (à ajuster selon vos tarifs réels)

- **Supabase Pro** : rentable dès que vous dépassez les quotas Free (DB size, bande passante, Edge invocations) ou avez besoin de backups inclus.
- **Resend payant** : rentable si vous dépassez 3 000 reçus/mois (ou équivalent en autres emails).
- **CinetPay / Stripe** : toujours « rentables » en coût marginal si les dons couvrent la commission (typiquement 1–2 % du don).

---

## Variables d’environnement liées (référence)

Pour suivre les services actifs côté projet :

- **Supabase :** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ; côté Supabase : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
- **CinetPay :** `VITE_CINETPAY_*` (frontend) ; `CINETPAY_API_KEY`, `CINETPAY_API_PASSWORD`, `CINETPAY_BASE_URL` (Edge).
- **Stripe :** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Edge).
- **Resend :** `RESEND_API_KEY` (Edge, function `send-receipt`).
- **Vercel :** configuré dans le dashboard Vercel (build & env).

---

*Document généré pour la gestion budgétaire Paroisse NDC. À mettre à jour lors de tout changement de fournisseur ou de plan.*
