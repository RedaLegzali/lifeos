# LifeOS — instructions projet

Application personnelle d'Omar (francophone — toujours répondre en français). Voir README.md pour la stack et l'architecture.

## Règles de travail

- **Design d'abord, premium, minimaliste.** Dark mode uniquement. Références : Apple, Linear, Arc, Things 3, Raycast. Ne jamais dégrader le design pour aller plus vite.
- **0 €/mois.** Aucune API payante ni service à abonnement obligatoire. Local-first : IndexedDB (Dexie) pour les données, localStorage pour les préférences. Les intégrations payantes sont facultatives, remplaçables ou reportées.
- **Petites étapes.** Un module à la fois : terminé, testé (`npm test`), validé par Omar avant le suivant. Ne jamais casser l'existant.
- **Widgets autonomes.** Tout nouveau widget = un dossier `src/widgets/<id>/` + une ligne dans `src/core/widgets/registry.ts`. Ne pas coupler les widgets entre eux ; ils communiquent via leurs contrats (`WidgetManifest` : carte, brief, recherche).
- **Montants en centimes** (entiers), formatés via `src/lib/format.ts`. Dates via `src/lib/dates.ts` (pas de librairie de dates).
- **Tokens de design** dans `src/styles/index.css` (`@theme`). Jamais de couleur en dur dans les composants — passer par les tokens (`--color-*`, teinte du widget via `--tint`).
- **Données fictives** : chaque `mock.ts` est clairement marqué et sera remplacé lors du développement du module correspondant.
- Chaînes françaises : attention aux apostrophes dans les strings TS (utiliser des guillemets doubles).

## Vérification

`npm test` puis `npm run build` doivent passer avant toute livraison.
