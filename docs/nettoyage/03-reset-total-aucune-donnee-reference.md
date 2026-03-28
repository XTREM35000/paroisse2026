# Nettoyage total — ni rôle référent, ni paroisse, ni données métier

## Objectif

Repartir d’une base **vide côté données applicatives** :

- **Aucune** ligne utile dans les tables **`public`** que tu considères comme métier (selon ta liste blanche/grise).
- **Pas** de conservation ciblée de `roles`, **pas** de paroisse SYSTEM, **pas** de profil developer résiduel.
- Option **extrême** : tronquer aussi **`auth.users`** (et tables Auth associées) pour un environnement 100 % vierge — **tous les comptes sont perdus**.

## Quand utiliser ce scénario

- Environnement jetable (CI, démo, bac à sable).
- Réinitialisation complète avant une **nouvelle installation** (setup wizard, `init_system`, etc.).
- Après une erreur de migration irrécupérable, en ayant un **dump de secours**.

## Prérequis

- **Backup obligatoire** : ce scénario est destructif.
- Liste des tables à inclure / exclure (ex. garder des tables de **paramétrage technique** vides mais pas les données utilisateur).

## Étapes conceptuelles

1. **Couper** le trafic applicatif (maintenance).
2. Pour **`public`** :
   - identifier toutes les tables avec données ;
   - **`TRUNCATE … CASCADE`** par groupes, ou **script généré** à partir de `information_schema`/pg_catalog ;
   - vérifier **séquences** (`RESTART IDENTITY` si besoin).
3. **Auth** (optionnel mais « vrai » reset total) :
   - dans Supabase hébergé, la manipulation directe de `auth.*` est sensible ; préférer **outils officiels** ou procédures documentées par Supabase ;
   - minimum : supprimer utilisateurs via **Dashboard** ou API Admin.
4. **Storage** : vider buckets concernés (sinon fichiers orphelins).
5. **Vérification** : comptages à zéro sur les tables critiques ; tester **inscription** et **setup** depuis zéro.

## Ce que tu ne récupères pas

- Historique utilisateurs, contenus, donations, logs métier, etc.
- Toute référence **ORPHAN** côté client (URLs, caches navigateur) peut casser jusqu’au prochain déploiement / purge cache.

## Après un reset total

- Relancer les **migrations** si tu recrées l’instance, ou appliquer un **schema baseline**.
- Recréer **secrets** (clés API, `DEV_PASSWORD`, webhooks).
- Enchaîner éventuellement le scénario **`02-`** si tu veux un **developer + SYSTEM** propres juste après.

## Nom de fichier conservé

`03-reset-total-aucune-donnee-reference.md`
