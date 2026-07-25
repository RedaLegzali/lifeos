# Feuille de route LifeOS

Suivi du projet, versionné dans le dépôt : chaque `git pull` donne l'état à jour.
Voir [CLAUDE.md](CLAUDE.md) pour les règles de travail et [README.md](README.md) pour l'architecture.

## Principes non négociables

1. **0 €/mois.** Aucune API payante obligatoire. Local-first : les données restent sur l'appareil.
2. **Jamais de donnée fictive ni d'écran vide.** Un widget sans données affiche une invitation qui explique son bénéfice.
3. **Petites étapes.** Un module terminé, testé et validé avant le suivant. Ne jamais casser l'existant.
4. **Widgets autonomes.** Ajouter un widget = un dossier `src/widgets/<id>/` + une ligne dans le registre.

## Fait

### Socle (v0.1 – v0.3)
- [x] Vite + React 19 + TypeScript strict + Tailwind 4
- [x] Design system « Nuit » — tokens CSS, primitives (`src/design/`)
- [x] Système de widgets : registre, contrat `WidgetManifest`, chargement paresseux
- [x] Navigation (rail, routes générées), raccourcis clavier 1–7
- [x] Recherche globale ⌘K (Fuse.js), alimentée par tous les widgets
- [x] Stockage local : Dexie (IndexedDB) + zustand/persist
- [x] Onboarding 4 étapes, relançable depuis les Réglages
- [x] PWA installable (manifest, service worker, icônes)
- [x] Drag & drop des widgets, ordre persisté
- [x] Coach progressif : une suggestion par jour, reportable
- [x] CI GitHub Actions (lint, tests, build) + déploiement Cloudflare

### Modules
- [x] **Semaine** — anniversaires réels, ajout rapide par lien de parenté
- [x] **Tâches** — todo persistée
- [x] **Abonnements** — bibliothèque de 27 services, édition en ligne
- [x] **Argent étape 1** — import de relevés PDF SG, catégories, règles utilisateur
- [x] **Argent étape 2** — détection automatique des abonnements dans les relevés

## En cours

- [ ] **Argent étape 3** — prévision des prélèvements des 30 prochains jours

## Ensuite

- [ ] **Calendrier** — mois/semaine, jours fériés (calculés en local), ponts, congés,
      prélèvements prévus, anniversaires, météo (Open-Meteo, gratuit sans clé)

## Gelé (volontairement)

Reportés pour garder peu de modules mais solides : Notes, Voyages (type Tricount),
Gaming, bibliothèque d'abonnements élargie, partage multi-comptes.

Le partage exige un backend (comptes, synchronisation, conflits) — prévu en V3 sur
Cloudflare Workers + D1, en gardant le modèle local-first. Les modèles de données
prévoient déjà cette évolution.

## Dette connue

- `npm audit` signale `brace-expansion` via `vite-plugin-pwa` → `ejs` → `jake`.
  Vulnérabilité de **build uniquement**, absente du code livré. Le correctif amont
  impose une régression de `vite-plugin-pwa` : on attend une version corrigée.
- Le parseur de relevés ne lit que les PDF **Société Générale**. Prévoir un import
  CSV générique pour les autres banques.
- `wrangler.jsonc` absent de `main` (PR `cloudflare/workers-autoconfig` non mergée) :
  vérifier que le Worker sert bien les routes de la SPA (`/argent`, `/taches`…).

## Commandes

```bash
npm install
npm run dev      # serveur local (--host pour y accéder depuis le téléphone)
npm test         # 56 tests
npm run build    # typecheck + build de production
npm run lint
```
