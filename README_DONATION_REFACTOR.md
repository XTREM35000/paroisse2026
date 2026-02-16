# 🎯 Refonte Module Dons - Documentation Complète

## 📋 Vue d'ensemble

Refonte complète du module Dons pour supporter :

- ✅ Paiements par carte (Stripe)
- ✅ Paiements par Mobile Money
- ✅ Paiements en espèces (validation admin)
- ✅ Génération reçus électroniques
- ✅ Campagnes de dons
- ✅ Compatibilité 100% avec données existantes

---

## 🗂️ Structure des fichiers

### Pages

```
src/pages/
  ├── Donate.tsx              # Page principale dons (refactorisée)
  └── DonationSuccess.tsx     # Page de confirmation
```

### Composants

```
src/components/donations/
  ├── DonationHero.tsx            # Hero banner
  ├── PaymentMethodSelector.tsx   # Sélecteur méthodes paiement
  ├── DonationModal.tsx           # Modal formulaire
  └── DonationSummary.tsx         # Résumé confirmation
```

### Hooks

```
src/hooks/
  ├── useDonationMethods.ts      # Récupérer méthodes
  ├── useCreateDonation.ts       # Créer donation
  ├── useConfirmDonation.ts      # Confirmer paiement
  └── useGenerateReceipt.ts      # Générer reçu
```

### Queries Supabase

```
src/lib/supabase/
  └── donationPaymentsQueries.ts  # Queries de base
```

### Migrations

```
supabase/migrations/
  └── add_payment_methods.sql    # Migration SQL
```

---

## 📊 Schéma SQL

### Table `payment_methods`

```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,           -- 'card', 'mobile_money', 'cash'
  label TEXT,                 -- Label affiché
  icon TEXT,                  -- Nom icône Lucide
  description TEXT,
  is_active BOOLEAN,
  requires_validation BOOLEAN -- Nécessite validation admin
);
```

### Extensions `donations`

```sql
ALTER TABLE donations ADD COLUMN IF NOT EXISTS:
  - payment_method TEXT        -- Référence à payment_methods.code
  - payment_status TEXT        -- 'pending' | 'confirmed' | 'failed' | 'refunded'
  - provider TEXT              -- 'stripe', 'wave', etc.
  - transaction_ref TEXT       -- Référence unique du paiement
  - currency TEXT DEFAULT 'XOF'
  - payer_email TEXT
  - payer_phone TEXT
  - updated_at TIMESTAMP
```

### Extensions `receipts`

```sql
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS:
  - payment_method TEXT
  - pdf_url TEXT
  - qr_code_data TEXT
```

### Table `donation_audit_log`

```sql
CREATE TABLE donation_audit_log (
  id UUID PRIMARY KEY,
  donation_id UUID REFERENCES donations(id),
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMP
);
```

---

## 🔄 Flux de paiement

### 1. Carte Bancaire (Stripe)

```
Utilisateur → Modal Donation → Create Donation (pending)
  ↓
Redirect Stripe Checkout → Paiement → Webhook Stripe
  ↓
Webhook Update Status (confirmed) → Generate Receipt
  ↓
Réussite Page (DonationSuccess)
```

### 2. Mobile Money

```
Utilisateur → Modal Donation → Create Donation (pending)
  ↓
Show Instructions (SMS/WhatsApp) → User Complête paiement
  ↓
Admin Dashboard → Valide paiement → Update Status (confirmed)
  ↓
Generate Receipt → User reçoit email
```

### 3. Espèces

```
Admin → Create Donation (via admin panel)
  ↓
Confirm Immediately → Status (confirmed)
  ↓
Generate Receipt → Archive
```

---

## 🪝 Utilisation des Hooks

### useDonationMethods

```typescript
const { methods, loading, error } = useDonationMethods()

// methods = [
//   { code: 'card', label: 'Carte Bancaire', ... },
//   { code: 'mobile_money', label: 'Mobile Money', ... },
//   { code: 'cash', label: 'Espèces', ... }
// ]
```

### useCreateDonation

```typescript
const { createDonation, loading, error } = useCreateDonation()

const donation = await createDonation({
  amount: 50000,
  currency: 'XOF',
  payment_method: 'card',
  payer_name: 'Jean Dupont',
  payer_email: 'jean@example.com',
  // ...
})
```

### useConfirmDonation

```typescript
const { confirmDonation, loading, error } = useConfirmDonation()

await confirmDonation(donationId, 'stripe_pi_12345')
```

### useGenerateReceipt

```typescript
const { generateReceipt, loading, error } = useGenerateReceipt()

const receipt = await generateReceipt(donationId, 'card')
// { receipt_number: 'REC-1708099200000-ABC123', ... }
```

---

## 🔐 RLS Policies

### payment_methods

- **SELECT** : Public (méthodes actives seulement)
- **UPDATE/DELETE** : Admin seulement

### donations

- **SELECT** : Propriétaire + Admin
- **INSERT** : Propriétaire (via hook)
- **UPDATE** : Admin + Webhook Stripe

### donation_audit_log

- **SELECT** : Propriétaire + Admin
- **INSERT** : Système + Webhook

---

## ⚙️ Configuration Stripe

### Webhook Endpoint

```
POST /api/webhooks/stripe
```

### Événements à gérer

```
payment_intent.succeeded
payment_intent.payment_failed
charge.refunded
```

### Variables d'environnement

```env
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📱 Composants UI

### DonationHero

- Hero banner avec mission statement
- Personnalisé via usePageHero

### PaymentMethodSelector

- Grille de 3 cartes (Carte, Mobile Money, Espèces)
- Toggle sélection
- Icons Lucide

### DonationModal

- Formulaire avec validation
- Champs : montant, email, téléphone, intention
- Modal style Admin Live

### DonationSummary

- Confirmation post-paiement
- Détails + reçu
- CTA téléchargement/retour

---

## 🧪 Tests

### Tests unitaires (à implémenter)

```typescript
// useDonationMethods.test.ts
test('devrait charger les méthodes de paiement actives', async () => {
  const { result } = renderHook(() => useDonationMethods())
  await waitFor(() => {
    expect(result.current.methods.length).toBeGreaterThan(0)
  })
})
```

### Tests E2E (à implémenter)

```typescript
// donation.e2e.test.ts
test('flux complet donation par carte', async () => {
  // 1. Aller sur /donate
  // 2. Sélectionner "Carte Bancaire"
  // 3. Ouvrir modal et remplir
  // 4. Submit → Redirect Stripe
  // 5. Simuler paiement
  // 6. Webhook notification
  // 7. Vérifier /donation/success
})
```

---

## 🚀 Déploiement

### Checklist

- [ ] Migration SQL appliquée
- [ ] Variables Stripe configurées
- [ ] Tests unitaires passent
- [ ] Tests E2E passent
- [ ] Webhook Stripe testé
- [ ] RLS policies activé
- [ ] Logs audit en place
- [ ] Documentation mise à jour

### Commandes

```bash
# Apply migration
supabase db push

# Test localement
npm run dev

# Build production
npm run build

# Deploy Vercel
vercel deploy
```

---

## 📧 Intégration Email

### Reçu donation

```
Pour: payer_email
Sujet: Reçu de donation #{receipt_number}
Corps:
  - Montant: XXX {currency}
  - Méthode: {payment_method}
  - Date: {created_at}
  - QR Code: [lien validation]
Attachement: receipt.pdf
```

### Notification admin (Mobile Money)

```
Pour: admin@paroisse.local
Sujet: Donation Mobile Money en attente
Corps:
  - Donateur: {payer_name}
  - Montant: {amount}
  - Référence: {donation_id}
Action: Bouton validation
```

---

## 🎓 Maintenance

### Monitoring

- Webhook Stripe logs
- Audit log des status changes
- Taux de conversion par méthode

### Support

- Documentation Stripe: https://stripe.com/docs
- Supabase Webhooks: https://supabase.io/docs/guides/webhooks
- Questions: dev@paroisse.local

---

## ✅ Checklist finale

- [x] Migration SQL
- [x] Hooks creada
- [x] Composants UI
- [x] Page Donate refactorisée
- [x] Page DonationSuccess
- [x] Queries Supabase
- [ ] Webhook Stripe
- [ ] Génération PDF reçus
- [ ] Tests E2E
- [ ] Documentation final

---

**Version**: 1.0.0  
**Date**: 2026-02-16  
**Auteur**: Copilot  
**Status**: Work in Progress ⚠️
