# ⚡ AIDE-MÉMOIRE ADMIN - Accès rapide

## 🚀 ACCÈS RAPIDE AUX PAGES ADMIN

| Besoin                   | Où aller                           | Raccourci URL          |
| ------------------------ | ---------------------------------- | ---------------------- |
| **Gérer vidéos**         | Admin → Tableau de bord            | `/admin/dashboard`     |
| **Modérer commentaires** | Admin → Tableau de bord            | `/admin/dashboard`     |
| **Créer événement**      | Admin → Gestion des événements     | `/admin/events`        |
| **Créer affiche**        | Admin → Publicité                  | `/admin/ads`           |
| **Gérer utilisateurs**   | Admin → Utilisateurs               | `/admin/users`         |
| **Éditer accueil**       | Admin → Paramètres → Page À propos | `/admin/homepage`      |
| **Éditer À propos**      | Admin → Paramètres → Page À propos | `/admin/about`         |
| **Éditer Annuaire**      | Admin → Paramètres → Annuaire      | `/admin/directory`     |
| **Voir stats**           | Dashboard → Analytics              | `/dashboard/analytics` |
| **Configurer**           | Admin → Paramètres généraux        | `/admin/settings`      |
| **Paramètres EN LIGNE**  | Admin → En Ligne                   | `/admin/live`          |

---

## 🎬 LES 5 ACTIONS PRINCIPALES

### 1️⃣ AJOUTER UNE VIDÉO

```
Admin → Tableau de bord
  ↓
Remplir: Titre, Description, Catégorie
  ↓
[Télécharger]
  ✅ Apparaît sur /videos
```

### 2️⃣ CRÉER UN ÉVÉNEMENT

```
Admin → Gestion des événements
  ↓
[+ Ajouter un événement]
  ↓
Remplir: Nom, Date, Lieu
  ↓
[Créer l'événement]
  ✅ Apparaît sur /evenements
```

### 3️⃣ CRÉER UNE AFFICHE

```
Admin → Publicité
  ↓
[+ Ajouter une affiche]
  ↓
Remplir: Titre, Image, Contenu
  ↓
[Créer l'affiche]
  ✅ Popup à l'accueil + /publicite
```

### 4️⃣ AJOUTER UN UTILISATEUR

```
Admin → Utilisateurs
  ↓
[+ Ajouter un utilisateur]
  ↓
Email + Rôle
  ↓
☑️ Envoyer invitation
  ✅ Email envoyé
```

### 5️⃣ MODÉRER UN COMMENTAIRE

```
Admin → Tableau de bord → Commentaires
  ↓
[✅ Approuver] ou [🗑️ Supprimer]
  ✅ Immédiat
```

---

## 🔧 ACTIONS RAPIDES

### Changer le rôle d'un utilisateur

Admin → Utilisateurs → [⋮] → Modifier le rôle

### Réinitialiser mot de passe

Admin → Utilisateurs → [⋮] → Réinitialiser

### Désactiver un compte

Admin → Utilisateurs → [⋮] → Désactiver

### Modifier une vidéo

Admin → Tableau de bord → [✏️]

### Supprimer un événement

Admin → Gestion des événements → [⋮] → Supprimer

### Éditer la page d'accueil

Admin → Paramètres → Page À propos (ou direct `/admin/homepage`)

---

## ⚠️ POINTS D'ATTENTION

| ⚠️ Action              | Conséquence                  | Solution              |
| ---------------------- | ---------------------------- | --------------------- |
| Supprimer vidéo        | **Permanente**               | Vérifiez 2x avant     |
| Désactiver user        | Ne peut plus se connecter    | Réactivable           |
| Changer date événement | Changement immédiat sur site | Notifiez participants |
| Affiche expire         | Plus visible publiquement    | Vérifiez les dates    |

---

## 📱 SUR MOBILE

Le **menu Admin** existe aussi sur mobile :

1. En haut à gauche, cliquez sur **☰ (3 lignes)**
2. Scrollez jusqu'à **Administration**
3. Même fonctionnalités qu'en desktop

---

## 🔍 RECHERCHE RAPIDE

**Dans chaque tableau** : Utilisez le champ `[🔍 Rechercher...]`

- Chercher un utilisateur par email ✅
- Chercher une vidéo par titre ✅
- Chercher un événement par nom ✅

---

## 🆘 EN CAS DE BLOCAGE

| Problème             | Essai #1          | Essai #2                        | Essai #3         |
| -------------------- | ----------------- | ------------------------------- | ---------------- |
| Page blanche         | Rechargez F5      | Ctrl+Shift+R                    | Autre navigateur |
| Bouton ne répond pas | Attendez 3s       | Cliquez ailleurs puis recliquéz | Reconnectez-vous |
| Upload échoue        | Vérifiez taille   | Essayez autre format            | Contactez IT     |
| Data ne sauve pas    | Relancez l'action | Vérifiez les champs rouges      | Videz cache      |

---

## 📞 CONTACTS URGENTS

```
🚨 ERREUR SYSTÈME          → IT: XXX
⚠️ MODÉRATION URGENT       → Responsable: YYY
📧 EMAILS NE PASSENT PAS   → Email admin: ZZZ
🔐 OUBLI MOT DE PASSE      → IT: XXX
```

---

## 📚 LIEN VERS GUIDE COMPLET

**Pour plus de détails**, consultez : [`docs/ADMINproc.md`](ADMINproc.md)

---

**Bonne administration ! ✨**

_Dernière mise à jour: 8 janvier 2026_
