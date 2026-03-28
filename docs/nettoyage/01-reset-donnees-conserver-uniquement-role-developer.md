# Nettoyage des données — conserver uniquement le rôle `developer` (table `roles`)

## Objectif

- Vider (ou truncater) **toutes les tables applicatives** du schéma **`public`** qui contiennent des données métier (profils, paroisses, contenus, etc.).
- **Conserver dans `public.roles` une seule ligne** correspondant au rôle applicatif **`developer`** (à adapter au schéma réel de ta table : `name`, `slug`, `id`, etc.).

## Prérequis

- Sauvegarde complète (dump SQL ou backup Supabase) avant toute exécution.
- Exécution idéalement en **maintenance**, hors production critique.
- Comprendre l’**ordre des contraintes de clés étrangères** : souvent `TRUNCATE … CASCADE` ou suppression dans l’ordre inverse des dépendances.

## Attention — Faith-Flix

Dans ce dépôt, le rôle utilisateur est surtout porté par **`public.profiles.role`**. Si tu n’as **pas** de table dédiée `public.roles`, ce document décrit surtout une **cible conceptuelle** : après nettoyage, tu recrées **une** entrée de référentiel rôles `developer`, et tu aligneras **`profiles`** lors d’une étape ultérieure (voir fichier `02-`).

## Étapes recommandées (logique, pas un script unique)

1. **Lister les tables `public`** à nettoyer (exclure les tables purement système si tu en as).
2. **Désactiver temporairement** les triggers métiers si nécessaires (reset, notifications) pour éviter des effets de bord.
3. Pour chaque groupe de tables liées par FK :
   - soit **`TRUNCATE table1, table2, … RESTART IDENTITY CASCADE`** (PostgreSQL),
   - soit **`DELETE`** en respectant l’ordre des dépendances.
4. **Table `public.roles`** :
   - `TRUNCATE` ou `DELETE` selon les FK qui pointent vers elle ;
   - **`INSERT` une seule ligne** `developer` (ex. `slug = 'developer'`, libellé libre).
5. **Ne pas** supprimer les fonctions / policies RLS sauf si tu refais une install vierge : ici on parle **données**, pas schéma.
6. **Vérifier** : `SELECT COUNT(*) FROM public.roles;` → attendu **1** ; autres tables métier → **0** lignes (ou seulement ce que tu as explicitement décidé de garder).

## Hors scope volontaire

- Contenu de **`auth.users`**, **`auth.identities`**, **`auth.sessions`** : en général **non vidé** dans ce scénario si tu veux garder des comptes ; sinon les utilisateurs ne peuvent plus se connecter. Précise dans ton runbook interne si tu tronques aussi Auth.
- Buckets **Storage** : fichiers orphelins à traiter à part.

## Fichiers liés dans le repo

- Migrations de type reset partiel : chercher `reset_all_data`, `DELETE FROM public.paroisses`, etc.
- Edge function **`create-developer`** : peut recréer profil / memberships après un reset ciblé (selon ta procédure).

## Nom de fichier conservé

`01-reset-donnees-conserver-uniquement-role-developer.md`
