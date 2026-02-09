# 📧 Quick Start : Système de Nettoyage des Emails

## 🧪 Tester localement

### 1. Lancer l'application

```bash
npm run dev
```

L'app démarre sur `http://localhost:5173`

### 2. Accéder à la page d'authentification

```
http://localhost:5173/auth
```

### 3. Tester les validations

#### ❌ Entrées à rejeter (taper et observer le message d'erreur)

- Domaine seul : `gmail.com` → Message : "Format incomplet"
- Avec @ seul : `@yahoo.fr` → Message : "Format email invalide"
- Sans domaine : `prenom@` → Message : "Domaine email manquant"
- Sans TLD : `prenom@domain` → Message : "Format email invalide"

#### ✅ Entrées à accepter

- Standard : `prenom.nom@gmail.com` → ✅ Accepté
- Avec chiffres : `user123@example.org` → ✅ Accepté
- Tirets dans domaine : `test@ex-ample.com` → ✅ Accepté

#### 🔧 Typos à autocorriger (observer la correction au blur)

- `prenom@gmial.com` → Corrigé en `prenom@gmail.com`
- `test@yahoo.co` → Corrigé en `test@yahoo.com`
- `user@hotmial.com` → Corrigé en `user@hotmail.com`

---

## 🧬 Tester les fonctions directement

### Ouverture de la console JavaScript (F12)

```javascript
// Importer le module (en environnement de test)
import { sanitizeEmail, isValidEmail, getRealTimeValidation } from '@/utils/emailSanitizer'

// Test 1 : Validation stricte
sanitizeEmail('gmail.com')
// Retourne: { cleaned: '', isValid: false, error: '...', suggestion: null }

// Test 2 : Email valide
sanitizeEmail('prenom@gmail.com')
// Retourne: { cleaned: 'prenom@gmail.com', isValid: true, error: null, suggestion: null }

// Test 3 : Typo avec suggestion
sanitizeEmail('prenom@gmial.com')
// Retourne: { cleaned: 'prenom@gmial.com', isValid: true, error: null, suggestion: 'prenom@gmail.com' }

// Test 4 : Validation en temps réel
getRealTimeValidation('yahoo.fr')
// Retourne: { isValid: false, isDomainOnly: true, isEmpty: false, message: '...' }

// Test 5 : RFC 5322 stricte
isValidEmail('prenom.nom@gmail.com')
// Retourne: true

isValidEmail('@gmail.com')
// Retourne: false
```

---

## 🧪 Lancer le test suite

### Exécuter tous les tests

```bash
npm run test
```

### Exécuter seulement les tests du sanitizer

```bash
npm run test src/utils/emailSanitizer.test.ts
```

### Exécuter avec couverture

```bash
npm run test -- --coverage
```

---

## 🔍 Déboguer

### Activer les logs dans le formulaire

Ajouter une log temporaire dans LoginForm.tsx :

```typescript
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const emailValidation = sanitizeEmail(email)
  console.log('Email validation:', {
    input: email,
    cleaned: emailValidation.cleaned,
    isValid: emailValidation.isValid,
    error: emailValidation.error,
    suggestion: emailValidation.suggestion,
  })

  // ... reste du code
}
```

### Vérifier les types TypeScript

```bash
npm run type-check
```

---

## 📊 Cas de test essentiels

| Entrée                 | Attendu             | Status |
| ---------------------- | ------------------- | ------ |
| `gmail.com`            | Rejeté              | ❌     |
| `@gmail.com`           | Rejeté              | ❌     |
| `prenom@`              | Rejeté              | ❌     |
| `prenom@gmail.com`     | Accepté ✅          | ✅     |
| `PRENOM@GMAIL.COM`     | Normalisé           | ✅     |
| `prenom@gmial.com`     | Correction suggérée | ✅     |
| `  test@example.org  ` | Trimmé              | ✅     |

---

## 🐛 Troubleshooting

### Erreur : "sanitizeEmail is not defined"

**Solution** : Vérifier que l'import est correct :

```typescript
import { sanitizeEmail } from '@/utils/emailSanitizer'
```

### Email valide rejeté

**Vérifier** :

1. L'email contient `@` ? ✅
2. L'email a une partie locale (avant `@`) ? ✅
3. Le domaine contient un point (`.`) ? ✅
4. Le TLD a au moins 2 caractères ? ✅

### Typo pas corrigée

**Vérifier** :

1. Le typo est dans `DOMAIN_CORRECTIONS` ? (voir line 24-40 dans emailSanitizer.ts)
2. L'orthographe du typo correspond exactement ? ⚠️ Sensible à la casse

---

## 📝 Checklist de validation

Avant de déployer en production :

- [ ] Tous les tests passent ✅
- [ ] Aucun warning TypeScript ✅
- [ ] Les emails invalides sont rejetés ✅
- [ ] Les emails valides sont acceptés ✅
- [ ] Les typos sont corrigés ✅
- [ ] Les messages d'erreur sont clairs ✅
- [ ] Le code est committé ✅

---

## 🚀 Déploiement

### Build pour production

```bash
npm run build
```

### Vérifier la build

```bash
npm run preview
```

---

## 📞 Besoin d'aide ?

Consulter :

- 📖 [docs/EMAIL_SANITIZER_IMPLEMENTATION.md](../docs/EMAIL_SANITIZER_IMPLEMENTATION.md)
- 🧪 [src/utils/emailSanitizer.test.ts](../src/utils/emailSanitizer.test.ts)
- 💻 [src/utils/emailSanitizer.ts](../src/utils/emailSanitizer.ts)

---

**Created** : 9 février 2026  
**Version** : 1.0.0  
**Status** : Ready ✅
