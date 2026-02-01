# Normalisation des chemins vidéo

Ce dossier contient `normalize-video-paths.ts` : un script TypeScript qui recherche, corrige et met à jour les `video_storage_path` manquants/précisément nommés dans la table `videos`.

## But

- Détecter les entrées `video_storage_path` qui ne contiennent que le nom du fichier (ex: `1769....mp4`) et remplacer par le chemin réel dans le bucket (`videos/1769....mp4` ou `public/...`) si l'objet existe.

## Pré-requis

- Node.js installé
- Variables d'environnement définies :
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (clé `service_role` ou une clé ayant droit de lister & générer signed urls)

## Installer

```bash
npm install -D ts-node typescript @supabase/supabase-js node-fetch@2
```

## Usage

- Dry run (vérification seulement) :

```bash
npx ts-node scripts/normalize-video-paths.ts --dry
```

- Application (écriture en base) :

```bash
npx ts-node scripts/normalize-video-paths.ts
```

Le script affichera un tableau de correspondances : `id`, `before`, `found`, `status`.

## Bonnes pratiques

- Toujours lancer en `--dry` d'abord et vérifier le résultat.
- Backup : si nécessaire, faire un dump ou copier les valeurs à corriger dans une table temporaire avant d'appliquer.

## Si le fichier n'est pas trouvé

- Vérifier Supabase Studio > Storage > `paroisse-files` pour confirmer l'emplacement réel.
- Uploader manuellement le fichier (ou via un script) sous le chemin attendu.

---
