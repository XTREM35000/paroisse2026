# Pièges fréquents dans les scripts SQL « paroisses »

## UUID de la paroisse SYSTEM (Faith-Flix)

Dans ce dépôt, la paroisse interne **SYSTEM** utilise en général :

```text
00000000-0000-0000-0000-000000000001
```

L’UUID **`11111111-1111-1111-1111-111111111111`** est réservé au **compte developer** (`auth.users` / `profiles`), **pas** à la ligne SYSTEM dans `public.paroisses`.  
Les mélanger casse les FK (`profiles.paroisse_id`, triggers, edge `create-developer`).

## `is_active` pour SYSTEM

Les migrations / edges utilisent souvent **`is_active = false`** pour la paroisse `slug = 'system'` (elle ne doit pas apparaître comme paroisse « choisissable » pour le public).  
Mettre **`true`** (comme dans certains scripts ad hoc) peut faire réapparaître SYSTEM dans des listes « paroisses actives ».

## `public.parishes` vs `public.paroisses`

Référence du projet : **`public.paroisses`**.  
Éviter de renommer ou supprimer `parishes` sans vérifier qu’aucune contrainte ou vue ne dépend encore de ce nom.

## Vérifications après script

```sql
SELECT id, nom, slug, is_active FROM public.paroisses WHERE slug = 'system';
SELECT id, email, role, paroisse_id FROM public.profiles WHERE role IN ('developer', 'super_admin') ORDER BY role;
```
