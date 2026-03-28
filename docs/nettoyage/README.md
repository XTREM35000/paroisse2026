# Documentation — procédures de nettoyage / reset

| Fichier | Résumé |
|--------|--------|
| `00-quelle-table-paroisses-parishes.md` | Décision **paroisses** vs **parishes** + note sur **`public.roles`** |
| `01-reset-donnees-conserver-uniquement-role-developer.md` | Vider le public, garder **une** ligne rôle **developer** dans **`roles`** |
| `02-reset-donnees-role-developer-plus-system-et-compte-developer.md` | Comme **01** + **SYSTEM** dans **`paroisses`** + compte **developer** (Auth + **profiles**) |
| `03-reset-total-aucune-donnee-reference.md` | Tout effacer (y compris références rôles / paroisses), reset maximal |

Ce sont des **guides procéduraux** (comme des ébauches de migrations documentées), pas des scripts exécutables tels quels : adapte les noms de tables et l’ordre des `TRUNCATE` à ta base.
