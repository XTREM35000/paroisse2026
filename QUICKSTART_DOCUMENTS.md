# 🚀 QUICK START - Module Documents

**Démarrage rapide en 5 minutes**

---

## ⚡ 5 Étapes pour Commencer

### Étape 1: Exécuter la Migration SQL (2 min)

**File**: `MIGRATION_MEMBER_CARDS_CERTIFICATES.sql`

```bash
# Dans Supabase Console:
# 1. Aller à SQL Editor
# 2. Copier tout le contenu du fichier
# 3. Coller dans l'éditeur
# 4. Cliquer "Run"
```

✅ 3 tables créées avec RLS automatique

---

### Étape 2: Accéder aux Pages (0 min)

Les pages sont **déjà routées** et intégrées!

```
/admin/member-cards     → Gérer les cartes
/admin/certificates    → Gérer les certificats
```

Disponibles dans le menu Sidebar > Administration

---

### Étape 3: Utiliser dans un Composant (2 min)

```typescript
import { useMemberCards, MemberCardPreview } from '@/modules/documents';

export default function MyComponent() {
  // Récupère les données automatiquement
  const { data: cards, loading } = useMemberCards();
  const { settings } = useDocumentSettings();

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <MemberCardPreview key={card.id} card={card} settings={settings} />
      ))}
    </div>
  );
}
```

---

### Étape 4: Créer une Carte (1 min)

```typescript
import { useMemberCards } from '@/modules/documents';

export default function CreateCard() {
  const { createCard } = useMemberCards();

  const handleCreate = async () => {
    await createCard({
      full_name: 'Jean Dupont',
      role: 'Paroissien',
      member_number: 'MEM-001',
      photo_url: 'https://example.com/photo.jpg',
      signature_url: 'https://example.com/sig.jpg',
      issued_by: 'Père Église',
    });
  };

  return <button onClick={handleCreate}>Créer Carte</button>;
}
```

---

### Étape 5: Imprimer (0 min)

```typescript
const handlePrint = (card) => {
  // L'aperçu s'affiche
  // Puis Ctrl+P pour imprimer
  // Le CSS @media print s'applique automatiquement
  window.print()
}
```

---

## 🎯 Cas d'Usage Courants

### Afficher un Aperçu

```typescript
import { MemberCardPreview } from '@/modules/documents';

<MemberCardPreview card={myCard} settings={settings} size="large" />
```

### Lister Toutes les Cartes

```typescript
import { useMemberCards } from '@/modules/documents'

const { data: cards } = useMemberCards()
cards.forEach((card) => console.log(card.full_name))
```

### Créer un Certificat

```typescript
import { useCertificates } from '@/modules/documents'

const { createCert } = useCertificates()

await createCert({
  full_name: 'Marie Martin',
  certificate_type: 'diplôme',
  mention: 'Avec distinction',
  issued_by: 'Église Parish',
})
```

### Mettre à Jour une Carte

```typescript
const { updateCard } = useMemberCards()

await updateCard(cardId, {
  full_name: 'Jean Martin',
  role: 'Diacre',
})
```

### Supprimer une Carte

```typescript
const { deleteCard } = useMemberCards()

await deleteCard(cardId)
```

### Changer les Paramètres

```typescript
import { useDocumentSettings } from '@/modules/documents'

const { save } = useDocumentSettings()

await save({
  parish_name: 'Église Notre-Dame',
  authority_name: 'Père Jean',
})
```

---

## 🖼️ Formats Prédefinis

### Carte de Membre

```
┌─────────────────────┐
│  Logo    │  Paroisse│
├─────────────────────┤
│ [Photo] │ Jean Dupont│
│         │ Paroissien │
│         │ MEM-001    │
│         │ Active     │
├─────────────────────┤
│  Signature   16/02  │
└─────────────────────┘

Format: 85mm × 55mm
(Carte bancaire standard)
```

### Certificat

```
┌──────────────────────────────┐
│                              │
│        Logo Paroisse         │
│                              │
│      CERTIFICAT              │
│ ─────────────────────────────│
│  Décerné à                   │
│  Jean Dupont                 │
│                              │
│  Diplôme                     │
│  Avec distinction            │
│                              │
│  Signature      16 février   │
└──────────────────────────────┘

Format: A4 (210mm × 297mm)
```

---

## 📚 API Rapide

```typescript
// CARTES
const cards = await getMemberCards();
const card = await createMemberCard({...});
await updateMemberCard(id, {...});
await deleteMemberCard(id);

// CERTIFICATS
const certs = await getCertificates();
const cert = await createCertificate({...});
await updateCertificate(id, {...});
await deleteCertificate(id);

// PARAMÈTRES
const settings = await getDocumentSettings();
await upsertDocumentSettings({...});
```

---

## 🎨 Tailles de Prévisualisation

```typescript
// Petit écran
<MemberCardPreview size="small" />  // w-48 h-32

// Normal (recommandé)
<MemberCardPreview size="medium" /> // w-80 h-52

// Grand (pour modales)
<MemberCardPreview size="large" />  // w-96 h-60
```

---

## ✅ Checklist Démarrage

- [ ] Migration SQL exécutée
- [ ] Accès à `/admin/member-cards`
- [ ] Accès à `/admin/certificates`
- [ ] Créer une première carte
- [ ] Tester l'aperçu
- [ ] Tester l'impression
- [ ] Modifier une carte
- [ ] Supprimer une carte

---

## 🆘 Troubleshooting

### Erreur: "Tables not found"

→ Vérifier que la migration SQL a été exécutée

### Erreur: "Accès refusé"

→ Vérifier que vous êtes logué comme admin

### Amérisage ne s'affiche pas

→ Vérifier les URLs des images (photo, signature, logo)

### Impression ne fonctionne pas

→ Vérifier que `print.css` est importé

---

## 🔗 Liens Rapides

- **Documentation**: `src/modules/documents/README.md`
- **Types**: `src/modules/documents/types/documents.ts`
- **Services**: `src/modules/documents/services/documentService.ts`
- **Admin Cartes**: `/admin/member-cards`
- **Admin Certificats**: `/admin/certificates`

---

## ⚡ Commandes Utiles

```bash
# Voir les logs
npm run dev

# Build pour production
npm run build

# Test (si disponible)
npm run test

# Lint
npm run lint
```

---

## 🎯 Prochaines Étapes

1. ✅ Migrations exécutées
2. ✅ Module intégré
3. **→ Tester les pages Admin**
4. **→ Uploader des images**
5. **→ Créer les premiers documents**
6. **→ Personnaliser les paramètres**

---

## 📞 Support

Pour plus de détails:

- Voir `README.md` du module
- Lire `MODULE_DOCUMENTS_SUMMARY.md`
- Consulter les comments du code

---

**Vous êtes prêt!** 🚀

Accédez à `/admin/member-cards` pour commencer.
