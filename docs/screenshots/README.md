# Captures d’écran (démo commerciale)

Les fichiers `*.png` listés dans `docs/speech.md` sont des **placeholders** (image PNG 1×1 pixel transparent) générés pour que les liens Markdown fonctionnent.

## Remplacer par de vraies captures

1. Faites vos captures plein écran depuis [www.nd-compassion.ci](https://www.nd-compassion.ci).
2. Exportez au format **PNG** avec les noms exacts ci-dessous (dans ce dossier).

## Fichiers attendus

| Fichier | Contenu suggéré |
|---------|-----------------|
| `home-hero.png` | Accueil / bannière |
| `admin-dashboard.png` | Tableau de bord admin |
| `officiants-table.png` | Liste des officiants |
| `daily-officiant.png` | Officiant du jour + historique |
| `officiant-modal.png` | Fenêtre d’édition officiant |
| `donations.png` | Parcours dons |
| `donations-mm.png` | Étape Mobile Money |
| `live-streaming.png` | Live / direct |
| `events.png` | Agenda / événements |
| `announcements.png` | Annonces |
| `gallery.png` | Galerie |
| `pricing.png` | Grille tarifaire (si page dédiée) |

## Régénérer les placeholders (Windows)

Depuis la racine du dépôt :

```powershell
$b = [Convert]::FromBase64String((Get-Content docs/screenshots/min1x1.b64 -Raw))
Get-ChildItem docs/screenshots -Filter '*.png' | ForEach-Object { [IO.File]::WriteAllBytes($_.FullName, $b) }
```

Ou une seule fois pour créer tous les PNG :

```powershell
$b = [Convert]::FromBase64String((Get-Content docs/screenshots/min1x1.b64 -Raw))
@(
  'officiants-table.png','daily-officiant.png','donations.png','live-streaming.png',
  'events.png','announcements.png','gallery.png','admin-dashboard.png',
  'home-hero.png','officiant-modal.png','donations-mm.png','pricing.png'
) | ForEach-Object { [IO.File]::WriteAllBytes((Join-Path 'docs/screenshots' $_), $b) }
```
