# 🚀 GUIDE DÉPLOIEMENT SMS-HOOK ORANGE

## ✅ ÉTAPES COMPLÈTES

### Phase 1: Préparation ✔

- ✅ Code Edge Function créé: `supabase/functions/sms-hook/index.ts`
- ✅ Documentation complète: `supabase/functions/sms-hook/README.md`
- ✅ **Aucune modification du frontend** — `PhoneOTPForm.tsx` inchangé
- ✅ **Aucune modification de l'Auth** — Twilio reste par défaut

### Phase 2: Déployer sur Supabase

#### 2.1 Déployer la fonction

```bash
cd c:\axe\faith-flix
supabase functions deploy sms-hook
```

**Résultat attendu:**

```
✓ Function sms-hook deployed
✓ URL: https://[project-ref].supabase.co/functions/v1/sms-hook
```

#### 2.2 Ajouter les secrets Orange

```bash
supabase secrets set ORANGE_CLIENT_ID="NrqkTdjEi6FvO0LbO6lOqi3akgJO5YIY"
supabase secrets set ORANGE_CLIENT_SECRET="XSn04aYoIElSgckwDYZElRdzulgAiUQABcLtyupD5KxX"
supabase secrets set ORANGE_SENDER_ADDRESS="tel:+2250000"
supabase secrets set ORANGE_SENDER_NAME="PAROISSE"
```

#### 2.3 Configurer le webhook dans Supabase Dashboard

1. Aller à **Authentication > Hooks** dans [supabase.com](https://supabase.com)
2. Créer un **"Send SMS Hook"**
3. URL: `https://[project-ref].supabase.co/functions/v1/sms-hook`
   - (remplacer `[project-ref]` par votre projet)
4. Copier le **Signing Secret** généré par Supabase
5. **⚠️ IMPORTANT:** Ne prendre que la partie après `whsec_`

**Exemple:**

- Secret générée: `v1,whsec_xyz789abc123`
- Configurer: `xyz789abc123`

```bash
supabase secrets set SEND_SMS_HOOK_SECRET="xyz789abc123"
```

### Phase 3: Vérifier le déploiement

```bash
# Voir les logs en temps réel
supabase functions logs sms-hook --tail

# Tester: Depuis le frontend, essayer OTP SMS
# → Logs devraient montrer:
#   "[Fonction sms-hook appelée]"
#   "[useAuth.login] signInWithPassword called with email..."
#   Etc.
```

---

## 📊 Architecture: Avant vs Après

### AVANT (Twilio uniquement)

```
Auth OTP → Twilio → SMS
```

### APRÈS (Orange avec fallback Twilio)

```
Auth OTP
  ↓
SMS-Hook (Orange)
  ├─ ✅ Orange OK → SMS via Orange
  └─ ❌ Orange Erreur (502/500) → Twilio automatique (fallback)
```

---

## 🔍 Débogage

### Logs de la fonction

```bash
supabase functions logs sms-hook --tail
```

### Chercher les erreurs:

- `Signature invalide` → Vérifier `SEND_SMS_HOOK_SECRET`
- `Configuration manquante` → Vérifier variables d'env
- `Orange OAuth Error` → Vérifier credentials Orange

---

## 📝 CHECKLIST FINALE

- [ ] Code déployé: `supabase functions deploy sms-hook`
- [ ] Secrets Orange configurés (4 variables)
- [ ] SMS Hook créé dans Supabase Dashboard
- [ ] `SEND_SMS_HOOK_SECRET` configuré
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Test OTP SMS depuis le frontend
- [ ] SMS reçu sur téléphone (ou fallback Twilio observé)

---

## 🎯 Points de vérification POST-DÉPLOIEMENT

1. **Frontend intacte?** → Oui, aucune modif requise
2. **Twilio toujours actif?** → Oui, comme fallback
3. **Logs affichant Orange?** → Oui, voir `supabase functions logs sms-hook`
4. **OTP reçu?** → Oui (via Orange ou Twilio en fallback)

---

## 📞 Support

Pour debuguer:

1. Regarder les logs `supabase functions logs sms-hook --tail`
2. Vérifier chaque secret: `supabase secrets list`
3. Consulter le [README.md](./README.md) fourni

---

**Date création:** 9 février 2026  
**Statut:** ✅ Prêt au déploiement
