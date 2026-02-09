# SMS Hook - Intégration Orange SMS

## 📋 Vue d'ensemble

Cette fonction Edge Supabase (`sms-hook`) remplace Twilio par l'API Orange SMS pour envoyer les OTP en Côte d'Ivoire, **sans casser l'existant**.

### 🔄 Architecture

```
Supabase Auth (OTP demand)
        ↓
  SMS Hook (cette fonction)
        ↓
    Orange API (succès) ✅ → SMS envoyé
        ↓
    Échec / Erreur (502/500)
        ↓
    Fallback Twilio (existant) ✅
```

## 🚀 Déploiement pas à pas

### 1️⃣ Déployer la fonction Edge

```bash
# Depuis la racine du projet
supabase functions deploy sms-hook
```

**Sortie attendue:**

```
✓ Function sms-hook deployed
✓ URL: https://[project-ref].supabase.co/functions/v1/sms-hook
```

### 2️⃣ Configurer les secrets Orange

```bash
# Credentials API Orange
supabase secrets set ORANGE_CLIENT_ID="NrqkTdjEi6FvO0LbO6lOqi3akgJO5YIY"
supabase secrets set ORANGE_CLIENT_SECRET="XSn04aYoIElSgckwDYZElRdzulgAiUQABcLtyupD5KxX"

# Configuration SMS
supabase secrets set ORANGE_SENDER_ADDRESS="tel:+2250000"
supabase secrets set ORANGE_SENDER_NAME="PAROISSE"
```

### 3️⃣ Configurer le SMS Hook dans Supabase Dashboard

#### Sur supabase.com > Votre Projet > Authentication > Hooks

1. Cliquez **"Send SMS"**
2. Entrez l'URL: `https://[project-ref].supabase.co/functions/v1/sms-hook`
   - Remplacez `[project-ref]` par votre référence projet
3. Supabase génère automatiquement un **Signing Secret**
4. **⚠️ IMPORTANT:** Copiez **uniquement la partie après `whsec_`** du secret

#### Exemple:

- Secret généré par Supabase: `v1,whsec_abc123def456`
- À configurer: `abc123def456`

```bash
supabase secrets set SEND_SMS_HOOK_SECRET="abc123def456"
```

### 4️⃣ Vérifier le déploiement

```bash
# Voir les logs de la fonction (en temps réel)
supabase functions logs sms-hook --tail

# Ou consulter les logs passés
supabase functions logs sms-hook
```

## ✅ Checklist de déploiement

- [ ] Fonction déployée: `supabase functions deploy sms-hook`
- [ ] Secrets Orange configurés (CLIENT_ID, CLIENT_SECRET)
- [ ] Secrets nom/adresse SMS configurés
- [ ] SMS Hook créé dans Supabase Dashboard
- [ ] Secret du webhook configuré: `SEND_SMS_HOOK_SECRET`
- [ ] Logs vérifiés et pas d'erreurs

## 📊 Fonctionnement

### Succès (Orange répond)

```
→ Récupère token Orange
→ Envoie SMS via Orange API
→ Retourne 200 OK
✅ SMS reçu par l'utilisateur
```

### Fallback (Orange en panne)

```
→ Erreur Orange (502/500)
→ Retourne 502 avec "fallback: true"
→ Supabase détecte l'erreur
→ Utilise Twilio (provider par défaut)
✅ SMS reçu via Twilio
```

## 🔍 Débogage

### Voir les logs en temps réel:

```bash
supabase functions logs sms-hook --tail
```

### Tester manuellement (curl):

```bash
# Remplacer les valeurs en pointillés
curl -X POST "https://[project-ref].supabase.co/functions/v1/sms-hook" \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms.send",
    "event": {
      "sms": {
        "otp": "123456",
        "phone": "+22501234567"
      }
    },
    "created_at": "2026-02-09T10:00:00Z"
  }'
```

### Erreurs courantes:

| Erreur                        | Cause                             | Solution                                              |
| ----------------------------- | --------------------------------- | ----------------------------------------------------- |
| `Signature invalide`          | Secret mal configuré              | Vérifier `SEND_SMS_HOOK_SECRET` dans les secrets      |
| `Configuration manquante`     | `SEND_SMS_HOOK_SECRET` non défini | `supabase secrets set SEND_SMS_HOOK_SECRET="..."`     |
| `Orange OAuth Error: 401`     | Credentials Orange invalides      | Vérifier `ORANGE_CLIENT_ID` et `ORANGE_CLIENT_SECRET` |
| `Échec envoi SMS Orange: 400` | Numéro mal formaté                | Le formatting automatique devrait corriger            |

## 🎯 Points clés

- ✅ **Pas de modification du frontend** — `PhoneOTPForm.tsx` reste inchangé
- ✅ **Pas de modification de l'auth** — Twilio reste provider par défaut
- ✅ **Zéro downtime** — Fallback automatique en cas d'erreur
- ✅ **Sécurité** — Validation de signature des webhooks
- ✅ **Performance** — Cache des tokens Orange (50 min)
- ✅ **Logs détaillés** — Pour le monitoring et débogage

## 📚 Liens utiles

- [Documentation Orange SMS API](https://developer.orange.com/apis/sms-rest/overview)
- [Supabase Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)
- [Standard Webhooks](https://www.standardwebhooks.com/)
