# Documentation : Refonte ChatPage - Design WhatsApp-like

## 📋 Vue d'ensemble

Cette refonte complète de `ChatPage.tsx` crée une interface de chat moderne et professionnelle inspirée par WhatsApp Web, parfaitement intégrée à votre architecture Supabase et suivant la charte graphique du projet.

## 🏗️ Architecture des fichiers

### Nouveaux composants créés

```
src/components/chat/
├── index.ts                  # Exports centralisés
├── ChatHeader.tsx           # En-tête de la conversation
├── ConversationItem.tsx     # Élément unique de conversation
├── ConversationList.tsx     # Sidebar avec liste des conversations
├── MessageBubble.tsx        # Composant de bulle de message
└── MessageInput.tsx         # Zone de saisie des messages
```

### Pages modifiées

```
src/pages/ChatPage.tsx      # Page principale refondée
```

## 🎯 Fonctionnalités implémentées

### 1. **Layout WhatsApp-like**
- **Sidebar gauche (30%)** : Liste des conversations
  - Recherche intégrée
  - Bouton pour créer une nouvelle conversation (optionnel)
  - Affichage du dernier message avec horodatage
  - Badge de messages non-lus (structure en place)
  - Tri par date du dernier message
  
- **Zone chat droite (70%)** : Interface de conversation
  - En-tête avec avatar, nom et infos de la salle
  - Historique des messages avec auto-scroll
  - Bulles de messages avec styles différents (envoyés/reçus)
  - Zone de saisie avec support Enter/Shift+Enter
  - Indicateurs de chargement

### 2. **Responsive Design**
- Sur mobile : masquage automatique de la sidebar lors de la sélection d'une conversation
- Sur desktop : layout en deux colonnes permanent
- Bouton de retour visible sur mobile pour revenir à la liste

### 3. **Intégration Supabase complète**
- Récupération des salles de chat (`chat_rooms`)
- Chargement des messages (`chat_messages`)
- Récupération des profils des envoyeurs
- Subscriptions en temps réel (INSERT, UPDATE, DELETE)
- Marquage des messages comme lus (mise à jour `last_read_messages_at`)

### 4. **Charte graphique du projet**
- Utilisation exclusive de composants shadcn/ui
- Palettes de couleurs Tailwind (primary, muted, foreground)
- Cohérence typographique avec le reste de l'application
- Animations fluides avec Framer Motion

## 📱 Structure du composant principal

### États du composant

```typescript
// Données principales
const [rooms, setRooms] = useState<ExtendedChatRoom[]>([]);
const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
const [newMessage, setNewMessage] = useState('');

// États de chargement
const [loadingRooms, setLoadingRooms] = useState(true);
const [loadingMessages, setLoadingMessages] = useState(false);
const [sendingMessage, setSendingMessage] = useState(false);

// États d'erreur
const [error, setError] = useState<string | null>(null);
```

### Fonctions principales

1. **`fetchChatRooms()`**
   - Récupère les salles de chat non-privées
   - Enrichit chaque salle avec le dernier message et son horodatage
   - Sélectionne la première salle par défaut

2. **`fetchMessages(roomId)`**
   - Charge les messages d'une salle (100 derniers)
   - Joint les informations des envoyeurs (profils)
   - Marque tous les messages comme lus pour l'utilisateur

3. **`handleSendMessage()`**
   - Insère le message dans Supabase
   - Met à jour `last_message_at` de la salle
   - Réinitialise la zone de saisie
   - Gère les erreurs avec notifications

4. **`subscribeToRoomsUpdates()`**
   - Écoute les modifications des salles
   - Rafraîchit la liste automatiquement

5. **`subscribeToMessageUpdates(roomId)`**
   - Écoute INSERT/UPDATE/DELETE sur les messages
   - Ajoute/met à jour/supprime les messages en temps réel
   - Enrichit les nouveaux messages avec les infos du profil

## 🔌 Intégration Supabase

### Tables utilisées

1. **`chat_rooms`**
   ```sql
   - id: UUID (clé primaire)
   - name: TEXT
   - description: TEXT
   - type: TEXT (default: 'group')
   - is_private: BOOLEAN (default: false)
   - created_by: UUID
   - member_count: INTEGER
   - last_message_at: TIMESTAMPTZ
   - created_at: TIMESTAMPTZ
   ```

2. **`chat_messages`**
   ```sql
   - id: UUID (clé primaire)
   - room_id: UUID (clé étrangère)
   - sender_id: UUID (clé étrangère)
   - content: TEXT
   - type: TEXT (default: 'text')
   - attachment_url: TEXT
   - is_edited: BOOLEAN (default: false)
   - is_deleted: BOOLEAN (default: false)
   - reply_to_id: UUID (nullable)
   - created_at: TIMESTAMPTZ
   - updated_at: TIMESTAMPTZ
   ```

3. **`profiles`**
   - Utilisée pour récupérer `full_name`, `avatar_url`
   - Mise à jour du champ `last_read_messages_at`

### Subscriptions en temps réel

- **Channel `public:chat_rooms:updates`**
  - Écoute tous les changements sur `chat_rooms`
  - Déclenche un rafraîchissement complet

- **Channel `public:chat_messages:room_{roomId}`**
  - Filtrée par `room_id`
  - Écoute INSERT, UPDATE, DELETE
  - Mise à jour en temps réel de l'interface

## 🎨 Composants enfants - Détails

### 1. **ConversationList.tsx**
```tsx
<ConversationList
  conversations={rooms}
  selectedRoomId={selectedRoomId}
  onSelectConversation={handleSelectConversation}
  isLoading={loadingRooms}
/>
```
- Gère la recherche locale des conversations
- Affiche les conversions triées avec badge de non-lus

### 2. **ConversationItem.tsx**
```tsx
<ConversationItem
  room={room}
  isSelected={isSelected}
  onClick={onClick}
/>
```
- Composant de chaque conversation
- Avatar avec initiales
- Dernier message et horodatage

### 3. **ChatHeader.tsx**
```tsx
<ChatHeader
  room={selectedRoom}
  memberCount={selectedRoom.member_count}
  showBackButton={true}
  onBack={() => setSelectedRoomId(null)}
/>
```
- En-tête de la conversation sélectionnée
- Avatar et infos de la salle
- Bouton de retour sur mobile

### 4. **MessageBubble.tsx**
```tsx
<MessageBubble
  content={message.content}
  isOwn={isOwn}
  senderName={senderName}
  senderAvatar={senderAvatar}
  timestamp={new Date(message.created_at)}
  showAvatar={true}
/>
```
- Bulle de message avec styles adaptés
- Alignement et couleur selon le propriétaire
- Affichage du nom de l'envoyeur (reçus uniquement)
- Horodatage formaté

### 5. **MessageInput.tsx**
```tsx
<MessageInput
  value={newMessage}
  onChange={setNewMessage}
  onSend={handleSendMessage}
  isLoading={sendingMessage}
  placeholder="Écrivez votre message..."
/>
```
- Textarea avec auto-hauteur
- Bouton d'envoi avec état loading
- Support Enter pour envoyer, Shift+Enter pour nouvelle ligne
- Désactivation intelligente

## 🔐 Sécurité & RLS

Le système s'appuie sur les RLS (Row Level Security) définies dans Supabase :

- Les utilisateurs ne voient que les salles publiques ou celles dont ils sont membres
- Seuls les membres peuvent envoyer des messages
- Les messages supprimés sont marqués comme `is_deleted = true`
- La mise à jour de `last_read_messages_at` s'effectue de manière sécurisée

## 📊 Types TypeScript

### ExtendedChatRoom
```typescript
interface ExtendedChatRoom extends ChatRoom {
  lastMessage?: string;
  unreadCount?: number;
  lastMessageTime?: Date;
}
```

### ExtendedChatMessage
```typescript
interface ExtendedChatMessage extends ChatMessage {
  sender?: Profile | null;
}
```

## 🚀 Utilisation

### Import et utilisation

```tsx
import ChatPage from '@/pages/ChatPage';

// Dans votre routeur
<Route path="/chat" element={<ChatPage />} />
```

### Dépendances

```typescript
// Hooks utilisés
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useNotification } from '@/components/ui/notification-system';

// Composants shadcn/ui utilisés
- Avatar
- Badge
- Button
- Input
- ScrollArea
- Textarea (implicite dans MessageInput)

// Utilitaires
import { cn } from '@/lib/utils';
import type { ChatRoom, ChatMessage, Profile } from '@/types/database';
```

## 🎯 Points clés de l'implémentation

1. **Subscriptions intelligentes**
   - Se déclenchent uniquement quand une room est sélectionnée
   - Nettoyage automatique lors du changement de room
   - Rechargement des rooms après chaque modification

2. **Performance**
   - Limite de 100 messages par salle
   - Enrichissement des données en parallèle
   - Utilisation d'une Map pour les profils (O(1) lookup)

3. **UX**
   - Auto-scroll vers le dernier message
   - Loading states clairs
   - Messages d'erreur avec notifications
   - Responsive design optimal

4. **Design cohérent**
   - Utilisation des couleurs du projet (primary pour envoyés, muted pour reçus)
   - Animations Framer Motion pour la fluidité
   - Espacing et border radius cohérents avec le reste de l'app

## 📝 Extensions futures

1. **Recherche globale** : Ajouter une recherche sur tous les messages
2. **Réactions** : Implémenter les réactions d'emoji comme WhatsApp
3. **Typing indicators** : Afficher "En train d'écrire..."
4. **Édition/Suppression** : Permettre la modification des messages envoyés
5. **Pièces jointes** : Intégrer le téléchargement de fichiers
6. **Lectures partagées** : Afficher qui a lu les messages
7. **Groupes privés** : Créer et gérer des conversations privées
8. **Statuts en ligne** : Afficher le statut des utilisateurs

## ✅ Checklist de déploiement

- [ ] Vérifier que les types `ChatRoom` et `ChatMessage` sont présents dans `src/types/database.ts`
- [ ] Vérifier que la table `chat_rooms` est accessible et correctement configurée
- [ ] Vérifier que la table `chat_messages` est accessible et correctement configurée
- [ ] Tester l'authentification avec `useAuth` et `useUser`
- [ ] Tester l'envoi et la réception de messages
- [ ] Vérifier les subscriptions en temps réel
- [ ] Tester le responsive design sur mobile et desktop
- [ ] Vérifier les performances avec de nombreux messages
- [ ] Tester les cas d'erreur et les notifications
