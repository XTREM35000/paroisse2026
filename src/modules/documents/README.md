# 📚 Module Documents Officiels Paroisse

Gestion complète des **cartes de membres** et **certificats/diplômes** avec aperçu, impression et intégration Supabase.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Structure du projet](#structure-du-projet)
- [Installation & Configuration](#installation--configuration)
- [Utilisation](#utilisation)
- [API & Services](#api--services)
- [Composants](#composants)
- [Pages Admin](#pages-admin)
- [Impression](#impression)
- [Permissions & Sécurité](#permissions--sécurité)

---

## 📊 Vue d'ensemble

Ce module fournit une solution complète pour :

✅ **Créer** des cartes de membres avec photo, numéro et signature  
✅ **Générer** des certificats et diplômes professionnels  
✅ **Afficher** des aperçus haute résolution  
✅ **Imprimer** au format standard (85x55mm pour cartes, A4 pour certificats)  
✅ **Gérer** les paramètres globaux (logo, signature autorité, etc.)  
✅ **Contrôler** l'accès par rôles (admin, super_admin, curé)

---

## 📁 Structure du projet

```
src/modules/documents/
├── types/
│   └── documents.ts           # Types TypeScript
├── services/
│   └── documentService.ts     # Requêtes Supabase
├── hooks/
│   ├── useMemberCards.ts      # Hook cartes membres
│   ├── useCertificates.ts     # Hook certificats
│   ├── useDocumentSettings.ts # Hook paramètres
│   └── index.ts               # Exports
├── components/
│   ├── MemberCardPreview.tsx  # Aperçu carte
│   ├── CertificatePreview.tsx # Aperçu certificat
│   ├── MemberCardTable.tsx    # Table cartes
│   ├── CertificateTable.tsx   # Table certificats
│   └── index.ts               # Exports
├── styles/
│   └── print.css              # Styles impression
├── index.ts                   # Export principal
└── README.md                  # Documentation

Pages Admin:
src/pages/
├── AdminMemberCards.tsx       # Admin cartes membres
└── AdminCertificates.tsx      # Admin certificats
```

---

## 🚀 Installation & Configuration

### 1️⃣ Créer les tables Supabase

Exécuter la migration SQL:

```bash
# Fichier: MIGRATION_MEMBER_CARDS_CERTIFICATES.sql
# Copiez et exécutez dans l'éditeur SQL Supabase
```

Tables créées:

- `member_cards` - Cartes de membres
- `certificates` - Certificats et diplômes
- `document_settings` - Paramètres globaux

### 2️⃣ Importer le module

```typescript
import {
  useMemberCards,
  useCertificates,
  useDocumentSettings,
  MemberCardPreview,
  CertificatePreview,
} from '@/modules/documents'
```

### 3️⃣ Importer les styles impression

Les styles sont importés automatiquement via `src/modules/documents/index.ts`

---

## 💻 Utilisation

### Utiliser les hooks

```typescript
// Cartes de membres
const { data, loading, error, createCard, updateCard, deleteCard } = useMemberCards()

// Certificats
const { data, loading, error, createCert, updateCert, deleteCert } = useCertificates()

// Paramètres globaux
const { settings, save } = useDocumentSettings()
```

### Créer une carte

```typescript
await createCard({
  full_name: 'Jean Dupont',
  role: 'Paroissien',
  member_number: 'MEM-001',
  photo_url: 'https://...',
  signature_url: 'https://...',
  issued_by: 'Père Église',
  issued_at: new Date().toISOString(),
})
```

### Créer un certificat

```typescript
await createCert({
  full_name: 'Marie Martin',
  certificate_type: 'diplôme',
  mention: 'Avec distinction',
  description: 'Formation complète',
  issued_by: 'Église Paroisse',
  signature_url: 'https://...',
})
```

### Afficher un aperçu

```typescript
<MemberCardPreview
  card={card}
  settings={settings}
  size="large"
/>

<CertificatePreview
  certificate={cert}
  settings={settings}
  size="large"
/>
```

---

## 🔧 API & Services

### `documentService.ts`

#### Cartes de membres

```typescript
// Lister
const cards = await getMemberCards(filter)

// Détacher
const card = await getMemberCard(id)

// Créer
const newCard = await createMemberCard(formData)

// Mettre à jour
const updated = await updateMemberCard(id, formData)

// Supprimer
await deleteMemberCard(id)

// Compter
const count = await countMemberCards()
```

#### Certificats

```typescript
// Lister
const certs = await getCertificates(filter)

// Détacher
const cert = await getCertificate(id)

// Créer
const newCert = await createCertificate(formData)

// Mettre à jour
const updated = await updateCertificate(id, formData)

// Supprimer
await deleteCertificate(id)

// Compter
const count = await countCertificates()
```

#### Paramètres

```typescript
// Obtenir
const settings = await getDocumentSettings()

// Créer/Mettre à jour
const updated = await upsertDocumentSettings({
  parish_name: 'Paroisse Notre-Dame',
  logo_url: 'https://...',
  authority_name: 'Père Église',
  authority_signature_url: 'https://...',
})
```

---

## ⚛️ Composants

### `MemberCardPreview`

Affiche une carte de membre au format 85x55mm.

```typescript
<MemberCardPreview
  card={memberCard}
  settings={documentSettings}
  size="medium" // small | medium | large
  className="..."
/>
```

### `CertificatePreview`

Affiche un certificat au format A4.

```typescript
<CertificatePreview
  certificate={cert}
  settings={documentSettings}
  size="large"
  className="..."
/>
```

### `MemberCardTable`

Table avec action pour les cartes.

```typescript
<MemberCardTable
  cards={cards}
  loading={loading}
  onView={handlePreview}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onPrint={handlePrint}
/>
```

### `CertificateTable`

Table avec actions pour les certificats.

```typescript
<CertificateTable
  certificates={certs}
  loading={loading}
  onView={handlePreview}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

---

## 📄 Pages Admin

### `/admin/member-cards`

Gestion complète des cartes de membres:

- ✏️ **Créer** une nouvelle carte
- 👁️ **Voir** l'aperçu
- 🖨️ **Imprimer** la carte
- ✏️ **Modifier** les informations
- 🗑️ **Supprimer** une carte

### `/admin/certificates`

Gestion complète des certificats:

- ✏️ **Créer** un nouveau certificat
- 👁️ **Voir** l'aperçu
- 🖨️ **Imprimer** le certificat
- ✏️ **Modifier** les informations
- 🗑️ **Supprimer** un certificat

**Accès**: Admin uniquement (avec role check)

---

## 🖨️ Impression

### Formats supportés

**Cartes de membres**:

- Largeur: 85mm
- Hauteur: 55mm
- Format: Carte bancaire standard

**Certificats**:

- Largeur: 210mm (A4)
- Hauteur: 297mm (A4)
- Format: Portrait

### Imprimer une carte

```typescript
const handlePrint = (card: MemberCard) => {
  selectCard(card)
  window.print()
}
```

### Styles CSS pour impression

Les styles sont définis dans `src/modules/documents/styles/print.css`:

```css
@media print {
  body * {
    visibility: hidden;
  }

  #member-card-preview,
  #certificate-preview {
    visibility: visible;
  }
}
```

---

## 🔐 Permissions & Sécurité

### Row Level Security (RLS)

Les tables utilisent RLS pour contrôler l'accès:

- **Admin/Super Admin/Curé**: Accès complet (CRUD)
- **Users authentifiés**: Lecture seule
- **Non authentifiés**: Aucun accès

### Validation des rôles

```typescript
// Dans les pages admin
const { isAdmin } = useRoleCheck();

if (!isAdmin) {
  return <div>Accès refusé</div>;
}
```

---

## 📊 Types TypeScript

### MemberCard

```typescript
interface MemberCard {
  id: string
  profile_id?: string | null
  full_name: string
  role?: string | null
  member_number: string
  photo_url?: string | null
  signature_url?: string | null
  issued_by?: string | null
  issued_at: string
  status: 'active' | 'inactive' | 'expired' | 'revoked'
  created_at: string
}
```

### Certificate

```typescript
interface Certificate {
  id: string
  full_name: string
  certificate_type: 'diplôme' | 'certificat' | 'mention' | 'honneur' | string
  mention?: string | null
  description?: string | null
  issued_by?: string | null
  signature_url?: string | null
  logo_url?: string | null
  issued_at: string
  created_at: string
}
```

### DocumentSettings

```typescript
interface DocumentSettings {
  id: string
  parish_name?: string | null
  parish_address?: string | null
  logo_url?: string | null
  banner_url?: string | null
  authority_name?: string | null
  authority_title?: string | null
  authority_signature_url?: string | null
  footer_text?: string | null
}
```

---

## 🎯 Exemple complet

```typescript
import React from 'react';
import { useMemberCards, useDocumentSettings, MemberCardPreview } from '@/modules/documents';

export default function DocumentsDemo() {
  const { data: cards } = useMemberCards();
  const { settings } = useDocumentSettings();

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <MemberCardPreview
          key={card.id}
          card={card}
          settings={settings}
          size="medium"
        />
      ))}
    </div>
  );
}
```

---

## ✨ Bonnes pratiques

✅ Toujours vérifier `isAdmin` avant d'afficher les pages d'administration  
✅ Utiliser les hooks pour l'accès aux données (pas d'appels directs)  
✅ Importer les styles CSS pour l'impression  
✅ Fournir des aperçus avant impression  
✅ Valider les formulaires avant soumission  
✅ Gérer les erreurs avec `toast` notifications

---

## 📝 Notes de développement

- Les images (photos, signatures, logos) doivent être uploadées sur Supabase Storage
- Les URLs sont stockées en base de données
- Les aperçus utilisent Tailwind CSS pour le responsive
- L'impression utilise CSS @media print
- Les permissions sont gérées via RLS Supabase

---

## 🆘 Support et Questions

Pour toute question ou problème:

1. Vérifiez les types TypeScript
2. Vérifiez que les tables Supabase sont créées
3. Vérifiez les permissions RLS
4. Vérifiez les logs de la console

---

**Dernière mise à jour**: 16 février 2026  
**Version**: 1.0.0  
**Auteur**: Copilot AI
