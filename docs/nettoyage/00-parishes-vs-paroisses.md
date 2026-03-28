# Parishes vs paroisses — table à retenir (Faith-Flix)

## Conclusion

**À garder comme référence : `public.paroisses`.**

### Pourquoi

- L’application (ex. `ParoisseContext`, comptages dans `appInitializer`, edge `create-developer`, migrations récentes `20260325`, `20260326_reset_all_data_complete`, etc.) s’appuie sur **`public.paroisses`** (colonnes `nom`, `slug`, `is_active`, paroisse SYSTEM `slug = 'system'`).
- Le dépôt mentionne **`public.parishes`** dans **`supabase/migrations/20260327_add_developer_management.sql`** (RPC `delete_parish`, triggers). C’est très probablement un **jeu de noms hors schéma principal** ou une ébauche non alignée : en l’état, il ne doit pas servir de source de vérité pour ce projet.
- Le client teste parfois les deux noms pour tolérer un ancien schéma (`countRowsFromFirstExistingTable(['paroisses', 'parishes'])`), mais l’ordre privilégie **`paroisses`**.

### En pratique

- Nouveaux scripts SQL, nettoyages, seeds : utiliser **`public.paroisses`**.
- Si votre base ne contient que `parishes` et pas `paroisses`, il s’agit d’un déploiement divergent : à migrer vers `paroisses` ou à adapter les scripts localement (non documenté ici).

### Table `public.roles`

Les migrations standard du repo **ne définissent pas** de table `public.roles` dédiée. Les rôles métier sont portés par :

- **`public.profiles.role`** (texte / enum selon migrations),
- parfois **`parish_members.role`** pour le contexte par paroisse.

Les guides `01` et `02` du dossier `nettoyage` parlent de « garder le rôle developer » : cela signifie **conserver un profil (et compte Auth) developer**, pas nécessairement une ligne dans une table `roles` inexistante. Si vous ajoutez une table `roles` dans votre instance, les mêmes guides restent valables en adaptant le nom de table.
