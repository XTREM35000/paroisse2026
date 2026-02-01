# Copier des fichiers entre buckets

Ce script aide à copier des objets d'un bucket Supabase vers un autre en utilisant la clé `service_role`.

## Usage

- Dry run (vérifie ce qui serait copié) :

```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx ts-node scripts/copy-files-between-buckets.ts --dry --from=video-files --to=paroisse-files --pattern=Paroisse01
```

- Application (copie effective) :

```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npx ts-node scripts/copy-files-between-buckets.ts --from=video-files --to=paroisse-files --pattern=1769984630459
```

Options :

- `--dry` : ne fait qu'afficher ce qui serait fait.
- `--from` : bucket source (par défaut `video-files`).
- `--to` : bucket cible (par défaut `paroisse-files`).
- `--pattern` : sous-chaîne (ou plusieurs séparées par `,`) pour filtrer les noms d'objets.
- `--prefix` : préfixe à ajouter dans le bucket de destination (ex: `videos/`).

## Recommandation

- Toujours lancer en `--dry` d'abord.
- Vérifier que la clé `SUPABASE_SERVICE_KEY` a les droits nécessaires.
