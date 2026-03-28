# Wipe total — aucun rôle réservé, aucune paroisse, aucune donnée métier

## Objectif

Repartir d’une base **vide côté applicatif** :

- pas de profil developer imposé ;
- pas de paroisse SYSTEM ;
- pas de ligne « spéciale » dans une table `roles` (si elle existe chez vous).

Utile pour un **environnement jetable**, des tests destructifs, ou avant une **restauration complète** depuis un dump.

## Avertissements

- **Irréversible** sans sauvegarde.
- `auth.users` : vider ou non selon votre besoin ; une base sans aucun utilisateur **impose** de recréer un compte (Dashboard ou Auth Admin) avant toute connexion.
- Sur Supabase, **ne supprimez pas** les schémas système (`auth`, `storage`, `extensions`) ni les tables internes critiques sans savoir ce que vous faites.

## Ordre général

1. Désactiver ou supprimer temporairement les triggers métier qui **réinjectent** des profils / paroisses.
2. `TRUNCATE … CASCADE` ou `DELETE` sur les tables **`public`** dans le bon ordre (ou CASCADE depuis des tables racines listées dans vos migrations type `reset_all_data`).
3. Optionnel : **`DELETE FROM auth.users`** (ou subset) si vous voulez aussi **aucun login**.
4. Ne **rien** réinsérer (pas de SYSTEM, pas de developer), sauf contraintes FK qui obligent à garder une table vide.

## Exemple de squelette SQL

```sql
BEGIN;

DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_add_developer_to_parish ON public.paroisses;
-- … autres triggers à adapter

SET session_replication_role = replica;  -- si autorisé

-- Lister toutes vos tables public à tronquer (compléter depuis information_schema ou migrations)
TRUNCATE TABLE
  public.parish_members,
  public.footer_config,
  public.header_config,
  public.profiles,
  public.paroisses,
  public.videos,
  public.events
  -- , …
CASCADE;

DELETE FROM auth.users;  -- optionnel : aucun compte

SET session_replication_role = DEFAULT;

-- Recréer les triggers si la base doit rester utilisable pour de nouveaux signups
-- CREATE TRIGGER …

COMMIT;
```

## Après un wipe total

- L’app Faith-Flix attend en général au moins **une paroisse réelle** pour le flux normal (wizard / sélecteur).
- Pensez à **`init_system`** / wizard, ou à une restauration backup, pour retrouver un état utilisable.

## Schéma paroisse

Toujours **`public.paroisses`** pour ce projet (voir `00-parishes-vs-paroisses.md`).
