# Quelle table conserver : `public.paroisses` ou `public.parishes` ?

## Recommandation pour **Faith-Flix**

**À garder et à considérer comme canonique : `public.paroisses`.**

### Pourquoi

- Le code applicatif (contexte paroisse, requêtes Supabase, edge functions) et la **majorité des migrations** du dépôt utilisent **`public.paroisses`** (nom en français, aligné avec le métier).
- L’outil d’initialisation (`appInitializer`, comptage des paroisses) teste d’abord `paroisses`, puis éventuellement `parishes` pour tolérer d’anciens schémas — signe que **`paroisses`** est la cible normale.
- **`public.parishes`** n’apparaît que dans des bribes isolées (ex. certaines fonctions SQL de migrations « gestion développeur ») et peut être **hors synchro** avec le reste du projet. Mieux vaut **ne pas** standardiser sur `parishes` dans ce dépôt sans migration explicite de renommage.

### En pratique

- Nouvelles migrations, scripts de nettoyage, documentation : parler de **`public.paroisses`**.
- Si ta base contient encore les **deux** tables (héritage), il faudra un chantier de fusion / dépréciation avant de fiabiliser les procédures de reset ; ce dossier `docs/nettoyage/` part du modèle **une seule table `paroisses`**.

---

## Table `public.roles` dans ce projet

Les migrations consultées pour Faith-Flix modélisent surtout le rôle dans **`public.profiles.role`** (texte ou enum selon ta version), pas une table **`public.roles`** séparée.

Les fichiers `01-` et `02-` incluent donc **à la fois** :

- le scénario « une table `roles` avec une seule ligne developer » **si tu l’as ajoutée dans ton instance** ;
- et le rappel d’aligner **`profiles.role`** pour que l’app affiche bien le compte développeur.

Si tu n’as **pas** de table `public.roles`, ignore les étapes qui la mentionnent et concentre-toi sur `profiles` + Auth.
