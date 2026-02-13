# Guide administrateur — Création et activation d'un direct

Objectif : procédure pas-à-pas pour créer un direct (TV ou Radio), choisir un fournisseur parmi la liste supportée, activer le direct et vérifier la diffusion sur la page `TV Paroisse Direct`.

Prérequis

- Compte admin sur l'application.
- Accès à la page d'administration des directs (`Gestion des Directs`).
- (Optionnel) Accès à l'interface Supabase pour vérifier la table `live_streams`.

Fournisseurs supportés

- `restream` (préféré comme player principal) — accepte `embed` (iframe) ou `hls` (.m3u8) ou `url`.
- `app.restream` — même comportement que `restream`.
- `youtube` — entrée : URL YouTube ou ID vidéo (11 caractères). Utilisé principalement comme destination (embed), non recommandé comme unique playback si HLS disponible.
- `api_video` — entrée : URL d'embed API.Video.
- `radio_stream` — flux audio (mp3/aac/ogg, ou URL audio).

Étapes de création d'un direct (UI)

1. Aller dans l'administration → `Gestion des Directs`.
2. Cliquer sur `Nouveau Direct`.
3. Remplir le `Titre` (ex: "Messe Dominicale - 14:00").
4. Choisir le `Type de diffusion`: `TV` (vidéo) ou `Radio` (audio).
5. Sélectionner le `Fournisseur` dans la liste.
6. Renseigner les champs spécifiques au fournisseur :
   - `restream` / `app.restream` : coller l'`embed iframe` (recommandé) OU l'`URL HLS` `.m3u8` OU une `url` publique.
   - `youtube` : coller l'URL YouTube complète ou l'ID (11 caractères).
   - `api_video` : coller l'URL d'embed fournie par API.Video.
   - `radio_stream` : coller l'URL du flux audio (ex: `https://.../live.mp3`).
7. (Optionnel) Programmer la date/heure de diffusion (`Programmation`).
8. Activer `Activer ce direct` si vous voulez qu'il soit immédiatement visible. Note : l'activation désactive automatiquement les autres directs.
9. Cliquer `Enregistrer`.

Comportement et validations

- L'UI effectue une validation légère : YouTube exige un ID/URL valide ; Restream exige au moins une des sources (`embed` | `hls` | `url`).
- L'application enregistre un objet `stream_sources` (JSON) dans la table `live_streams` et conserve aussi un champ `stream_url` pour compatibilité descendante.

Exemple `stream_sources` stocké

```json
{
  "embed": "<iframe src=\"https://restream.io/player/live/KEY\" ...></iframe>",
  "hls": "https://live.restream.io/live/KEY/index.m3u8",
  "url": "https://fallback.example.com/stream"
}
```

Vérifier la diffusion (page publique `TV Paroisse Direct`)

1. Ouvrir la page publique `TV Paroisse Direct` (site → section TV en direct).
2. Actualiser la page après avoir activé le direct en admin.
3. Vérifier que le titre apparaît et que l'indicateur `● EN DIRECT` est visible pour les admins/public selon la logique du site.
4. Vérifier le lecteur :
   - Si `embed` : la page doit afficher l'iframe (contrôles YouTube/Restream selon fournisseur).
   - Si `hls` : la balise `<video>` doit lancer le flux ; en cas de navigateur sans support natif, hls.js est chargé dynamiquement (fallback automatique).
   - Si `audio` : le lecteur audio doit fonctionner.

Points d'attention / dépannage

- YouTube : si l'embed est bloqué (politique d'iframe), utilisez l'ID ou configurez la destination uniquement sur YouTube et préférez Restream/HLS pour le playback.
- HLS : problèmes courants = CORS sur le manifest `.m3u8` ou segments. Assurez-vous que le CDN/server autorise l'origine du site.
- Si HLS ne démarre pas sur mobile : vérifier console du navigateur et forcer le rechargement ; hls.js se charge automatiquement si nécessaire.
- Si le lecteur affiche une erreur, vérifier `stream_sources` en base :
  ```sql
  SELECT id, title, stream_url, stream_sources FROM live_streams WHERE id = '<ID>' LIMIT 1;
  ```

Comment désactiver ou remplacer un direct

- Pour désactiver : `Modifier` le direct et décocher `Activer ce direct`, puis `Enregistrer`.
- Pour remplacer : créer un nouveau direct et l'activer ; le système désactivera automatiquement l'ancien.

Bonnes pratiques

- Préférer `restream`/`app.restream` comme player principal (ils fournissent souvent HLS et embed robustes).
- Réserver `youtube`/`facebook` comme destinations de diffusion (ils reçoivent la sortie mais ne sont pas fiables comme fallback principal si vous avez HLS disponible).
- Tester le flux 10–15 minutes avant l'événement sur mobile et desktop.

Support technique

- Si vous avez besoin d'aide pour la migration ou la validation des flux, contactez l'administrateur technique et fournissez : ID du direct (table `live_streams`), exemple de `stream_sources`, et capture console réseau si possible.

Fichier(s) utiles

- Code admin : `src/pages/AdminLiveEditor.tsx`
- Player : `src/components/VideoPlayer.tsx`
- Normalisation providers : `src/lib/providers.ts`
- Requêtes supabase : `src/lib/supabase/mediaQueries.ts`
