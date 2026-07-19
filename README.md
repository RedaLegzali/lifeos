# LifeOS

Système d'exploitation personnel — une seule application, locale et gratuite, qui centralise la vie d'Omar : semaine, argent, abonnements, gaming, tâches.

**Principes non négociables**

- **0 €/mois** : local-first, aucun serveur, aucune API payante obligatoire.
- **Premium et minimaliste** : mieux vaut peu de fonctions magnifiques que tout faire moyennement.
- **Petites étapes** : chaque module est terminé, testé et validé avant le suivant.

## Stack

| Rôle | Choix | Pourquoi |
| --- | --- | --- |
| Build / dev | Vite + React 19 + TypeScript strict | Rapide, standard, durable |
| Styles | Tailwind CSS 4 (tokens dans `src/styles/index.css`) | Design system centralisé |
| Animations | Motion (`motion/react`) | Springs fluides, API simple |
| État UI / préférences | Zustand (+ `persist` → localStorage) | Léger, sans boilerplate |
| Données métier | Dexie (IndexedDB) | Volumes + requêtes, hors ligne |
| Recherche | Fuse.js | Fuzzy search sans serveur |
| Routing | React Router | Pages par widget |
| Tests | Vitest | Rapides, intégrés à Vite |

## Architecture

```
src/
  app/            Shell : App, Layout, Rail, Topbar, CommandPalette (⌘K)
  pages/          HomePage (brief + grille), WidgetPage, SettingsPage
  core/
    widgets/      Contrat WidgetManifest + registre central
    search/       Index de recherche globale (widgets + navigation)
    settings/     Préférences persistées (prénom, widgets masqués)
    ui/           État d'interface éphémère (palette ouverte…)
  design/         Tokens visuels : icônes SVG, primitives (Badge, WidgetHeader…)
  lib/            db (Dexie), dates, format (montants en centimes)
  widgets/        UN DOSSIER PAR WIDGET — 100 % autonome
    week/         manifest.tsx + WeekCard.tsx + mock.ts
    money/        idem
    subscriptions/ idem
    gaming/       idem
    tasks/        idem
```

### Ajouter un widget

1. Créer `src/widgets/<id>/` avec un `manifest.tsx` respectant `WidgetManifest`.
2. L'importer dans `src/core/widgets/registry.ts`.

C'est tout : navigation, accueil, brief du matin, recherche et réglages se mettent à jour automatiquement.

## Commandes

```bash
npm run dev     # serveur de développement
npm test        # tests unitaires (Vitest)
npm run build   # typecheck + build de production
```

## État actuel

Base v0.1 : shell, design system « Nuit », navigation, système de widgets, recherche ⌘K, réglages. **Les données des widgets sont fictives** (fichiers `mock.ts`) — elles seront remplacées module par module.
