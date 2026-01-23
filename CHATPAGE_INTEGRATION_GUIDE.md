# Guide d'intégration - ChatPage refondée

## 🔧 Configuration requise

### 1. Vérifier que les hooks existent et fonctionnent

#### `useAuth.tsx`
```typescript
const { user } = useAuth(); // Doit retourner user: User | null
```

**Vérification :**
```bash
# Vérifier que le fichier existe
ls -la src/hooks/useAuth.tsx
```

#### `useUser.tsx`
```typescript
const { profile } = useUser(); // Doit retourner profile: Profile | null
```

**Vérification :**
```bash
ls -la src/hooks/useUser.tsx
```

#### `useNotification.tsx`
```typescript
const { notifyError, notifySuccess } = useNotification();
```

**Vérification :**
```bash
ls -la src/components/ui/notification-system
```

### 2. Vérifier les types Supabase

Les types suivants doivent être définis dans `src/types/database.ts` :

```typescript
export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_private: boolean;
  created_by: string | null;
  member_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: string;
  attachment_url: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile | null;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  // ... autres champs
}
```

### 3. Vérifier les tables Supabase

```sql
-- Vérifier que la table chat_rooms existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'chat_rooms'
);

-- Vérifier que la table chat_messages existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'chat_messages'
);
```

### 4. Composants shadcn/ui requis

Vérifier que les composants suivants sont présents :

```bash
# Vérifier l'existence des composants
ls -la src/components/ui/avatar.tsx
ls -la src/components/ui/badge.tsx
ls -la src/components/ui/button.tsx
ls -la src/components/ui/input.tsx
ls -la src/components/ui/scroll-area.tsx
ls -la src/components/ui/textarea.tsx
```

Si l'un de ces composants est manquant, l'installer avec shadcn-ui CLI :

```bash
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add textarea
```

## 🛠️ Étapes d'intégration

### Étape 1 : Ajouter les composants chat à votre arborescence

Les fichiers suivants doivent être créés dans `src/components/chat/` :

```
✅ ChatHeader.tsx
✅ ConversationItem.tsx
✅ ConversationList.tsx
✅ MessageBubble.tsx
✅ MessageInput.tsx
✅ index.ts
```

*(Tous les fichiers ont déjà été créés)*

### Étape 2 : Remplacer ChatPage.tsx

Le fichier `src/pages/ChatPage.tsx` a été complètement refondu.

**Avant de mettre à jour :**
```bash
# Faire une sauvegarde (optionnel)
cp src/pages/ChatPage.tsx src/pages/ChatPage.tsx.backup
```

### Étape 3 : Vérifier les imports

Vérifier que tous les imports fonctionnent correctement :

```bash
# Vérifier que les chemins d'import sont corrects
grep -r "@/components/chat" src/pages/ChatPage.tsx
grep -r "@/types/database" src/pages/ChatPage.tsx
grep -r "@/lib/utils" src/pages/ChatPage.tsx
```

### Étape 4 : Vérifier la configuration Supabase

Assurez-vous que votre client Supabase est correctement configuré dans `src/integrations/supabase/client.ts`.

### Étape 5 : Tester la page

```bash
# Démarrer le serveur de développement
npm run dev
# ou
bun dev

# Naviguer vers /chat
# http://localhost:5173/chat (ou votre port)
```

## 🧪 Tests de vérification

### Test 1 : Authentification
```typescript
// La page doit afficher un message si l'utilisateur n'est pas connecté
// Si connecté, afficher les conversations
```

### Test 2 : Chargement des conversations
```typescript
// Attendre 2-3 secondes
// Les conversations doivent s'afficher avec :
// - Avatar avec initiales
// - Nom de la conversation
// - Dernier message (tronqué)
// - Horodatage
```

### Test 3 : Sélection d'une conversation
```typescript
// Cliquer sur une conversation
// Doit afficher :
// - L'en-tête avec le nom de la salle
// - L'historique des messages
// - La zone de saisie
```

### Test 4 : Envoi de message
```typescript
// Saisir du texte
// Appuyer sur Enter
// Le message doit apparaître à droite avec couleur primaire
// Les messages reçus doivent apparaître à gauche avec couleur muted
```

### Test 5 : Temps réel
```typescript
// Ouvrir la page dans 2 onglets
// Envoyer un message depuis un onglet
// Il doit apparaître instantanément dans l'autre onglet
```

### Test 6 : Responsive design
```typescript
// Réduire la fenêtre à <1024px
// La sidebar doit se masquer quand une conversation est sélectionnée
// Un bouton de retour doit apparaître
// L'interface doit rester fonctionnelle
```

## 🐛 Dépannage

### Problème : "Cannot find module '@/components/chat'"

**Solution :**
```bash
# Vérifier que les fichiers existent
ls -la src/components/chat/

# Vérifier l'index.ts
cat src/components/chat/index.ts
```

### Problème : "Cannot find ChatRoom type"

**Solution :**
```typescript
// Vérifier src/types/database.ts
// S'assurer que ChatRoom est exporté
export interface ChatRoom { ... }
```

### Problème : Les messages ne s'envoient pas

**Vérifier :**
1. L'utilisateur est authentifié (useAuth retourne un user)
2. Au moins une conversation est sélectionnée
3. La table `chat_messages` existe dans Supabase
4. Les RLS permissions sont correctes

```sql
-- Vérifier la politique d'insertion
SELECT * FROM pg_policies 
WHERE tablename = 'chat_messages' 
AND policyname LIKE '%insert%';
```

### Problème : Les subscriptions ne fonctionnent pas

**Vérifier :**
1. Supabase client est correctement configuré
2. Realtime est activé pour les tables
3. Les filtres de subscription sont corrects

```sql
-- Activer realtime pour chat_messages si nécessaire
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### Problème : Les avatars ne s'affichent pas

**Vérifier :**
1. Les URLs d'avatar sont valides
2. Le composant `Avatar` de shadcn/ui est correctement installé
3. Les initiales s'affichent en fallback

## 📚 Ressources supplémentaires

### Documentation Supabase
- [Subscriptions en temps réel](https://supabase.com/docs/guides/realtime)
- [RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)
- [Types TypeScript](https://supabase.com/docs/guides/api/rest/generating-types)

### Documentation shadcn/ui
- [Avatar](https://ui.shadcn.com/docs/components/avatar)
- [Badge](https://ui.shadcn.com/docs/components/badge)
- [Button](https://ui.shadcn.com/docs/components/button)
- [Input](https://ui.shadcn.com/docs/components/input)
- [Textarea](https://ui.shadcn.com/docs/components/textarea)
- [ScrollArea](https://ui.shadcn.com/docs/components/scroll-area)

### Framer Motion
- [Animation docs](https://www.framer.com/motion/)
- [Variants](https://www.framer.com/motion/animation-controls/)

## 💡 Conseils d'optimisation

1. **Virtualisation des listes** : Pour les conversations > 100, ajouter une virtualisation avec `react-window`
2. **Pagination des messages** : Charger les messages par batch de 50 pour améliorer les performances
3. **Caching local** : Implémenter un cache pour éviter les requêtes redondantes
4. **Service Workers** : Ajouter un support offline-first pour les applications natives

## 📞 Support supplémentaire

Pour toute question spécifique à votre implémentation :
1. Vérifier les logs du navigateur (F12 > Console)
2. Vérifier les logs de la fonction Supabase (Dashboard Supabase)
3. Consulter la documentation fournie dans `CHATPAGE_DOCUMENTATION.md`
