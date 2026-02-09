# Guide des Providers d'Authentification

Ce document centralise les méthodes de connexion disponibles dans la modale `/auth` de la plateforme paroissiale. Il vise à aider les décideurs (conseil paroissial) et les développeurs à comprendre les avantages concrets pour les utilisateurs et les implications techniques.

> Note importante : Le provider Facebook est actuellement en attente d'un correctif technique de la part de Meta. L'application fonctionne pleinement avec Email, Google et OTP.

| Provider             |        Statut | Avantages pour le Paroissien                                                             | Avantages pour la Paroisse / Technique                                     |                                                                                                    Coût d'exploitation |
| -------------------- | ------------: | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------: |
| Email / Mot de passe |      ✅ Actif | Contrôle total sur son compte ; Indépendance vis‑à‑vis des réseaux sociaux ; Familiarité | Gestion autonome des comptes ; Pas de dépendance externe ; Gratuit         |                                                                                                                Gratuit |
| Google               |      ✅ Actif | Connexion en 1 clic ; Pas de mot de passe à retenir ; Confiance élevée                   | Moins d'abandons à l'inscription ; Sécurité déléguée à Google ; Gratuit    |                                                                                                                Gratuit |
| Téléphone (OTP SMS)  |      ✅ Actif | Très simple et intuitif ; Pas de mot de passe ; Fonctionne sur tout mobile               | Taux de conversion élevé ; Idéal pour publics moins à l'aise avec la tech  | Pay‑as‑you‑go — ~0,4397 $/SMS vers la CI ; Est. ~45 $/mois pour 100 inscriptions (SMS + location éventuelle de numéro) |
| Facebook             | ⚠️ En attente | Connexion rapide pour les utilisateurs Facebook                                          | Intégration prête côté application ; activation dépend d'un correctif Meta |                                                                    Gratuit (nécessite validation/activation côté Meta) |

## Détails par Provider

## Email / Mot de passe

Statut : ✅ Actif

Comment ça marche ? : L'utilisateur crée un compte avec son adresse e‑mail et un mot de passe, puis se connecte avec ces identifiants.

Les principaux avantages :

- Permet de garder le contrôle total sur son compte sans recourir à un réseau social.
- Familiarité : méthode connue de la majorité des utilisateurs.
- Indépendance technique : pas de dépendance à un fournisseur tiers pour l'authentification.

Points d'attention :

- Nécessité d'une bonne gestion des mots de passe (réinitialisation, sécurité).
- Risque d'abandons si le formulaire est perçu comme long — optimiser l'UX.

## Google

Statut : ✅ Actif

Comment ça marche ? : L'utilisateur clique sur « Se connecter avec Google », autorise l'accès et est immédiatement authentifié.

Les principaux avantages :

- Connexion rapide en un clic, sans création ni mémorisation de mot de passe.
- Confiance : Google gère l'authentification et la sécurité.
- Réduction des inscriptions abandonnées grâce à la simplicité.

Points d'attention :

- Dépendance à un fournisseur externe pour l'authentification (mais sans coût direct).
- Respecter la politique de confidentialité et informer les utilisateurs des données partagées.

## Téléphone (OTP SMS)

Statut : ✅ Actif

Comment ça marche ? : L'utilisateur saisit son numéro de téléphone, reçoit un code (OTP) par SMS et le saisit pour se connecter.

Les principaux avantages :

- Simplicité maximale : aucun mot de passe à créer ou retenir.
- Accès large : fonctionne sur tout téléphone mobile, sans application supplémentaire.
- Confiance : utilise un identifiant personnel (le numéro) facile à reconnaître pour l'utilisateur.

Points d'attention :

- Coût opérationnel : modèle "pay‑as‑you‑go" — environ 0,4397 $ par SMS vers la Côte d'Ivoire ; coût estimé pour 100 inscriptions ≈ 45 $/mois (incluant l'envoi des SMS et la location éventuelle d'un numéro).
- Dépendance à la délivrabilité des opérateurs mobiles ; parfois des retards ou blocages de SMS.

Option de test : Le compte Twilio Trial permet de tester sans coût (quelques numéros vérifiés), utile pour validation avant mise en production.

## Facebook

Statut : ⚠️ En attente

Comment ça marche ? : L'utilisateur clique sur « Se connecter avec Facebook », autorise l'application et est authentifié via son compte Facebook.

Les principaux avantages :

- Connexion rapide et familière pour les personnes actives sur Facebook.
- Peut réduire la friction pour les utilisateurs déjà connectés sur leur appareil.

Points d'attention :

- Dépend d'un correctif de l'API Facebook/Meta. Notre intégration est prête et sera activée dès que la solution technique sera disponible de leur côté.
- Dépendance à la politique et aux changements d'API de Meta ; peut nécessiter maintenance supplémentaire.

## Recommandations synthétiques

- Prioriser l'OTP SMS et Google pour maximiser l'adoption : l'OTP pour l'accessibilité, Google pour la rapidité.
- Conserver l'Email/Mot de passe comme option de secours et pour les utilisateurs souhaitant l'autonomie.
- Surveiller la situation Facebook : garder l'intégration prête mais n'en dépendre pas pour le lancement.
- Documenter clairement les coûts opérationnels (SMS) dans le budget de la paroisse et prévoir un petit volant pour l'expérimentation.

---

Document rédigé pour servir de référence aux décideurs et aux développeurs. Pour modifications ou ajouts (ex. autres providers), ouvrir une demande dans le suivi de projet.
