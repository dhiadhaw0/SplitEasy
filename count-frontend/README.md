# SplitEasy — Frontend

Application Angular du projet **SplitEasy** : partage de dépenses entre amis (voyage, colocation,
événement), calcul des soldes et des remboursements suggérés.

## Stack

Angular 18 (standalone components, signals, nouvelle syntaxe `@if`/`@for`) · Angular Material
(thème vert/cyan, structure des composants) · Tailwind CSS (mise en page et style fin, préflight
désactivé pour ne pas entrer en conflit avec Material) · Motion (micro-interactions : apparition
en cascade des listes, transition douce entre les pages) · ng2-charts / Chart.js · SCSS.

## Prérequis

- **Node.js** 20+ (le projet a été généré et testé avec Node 24)
- Le **backend SplitEasy** démarré sur `http://localhost:8080` (voir `count-backend/README.md`)

## Installation

```bash
cd count-frontend
npm install
```

## Lancer en développement

```bash
npm start
# équivalent à : ng serve
```

L'application est servie sur **http://localhost:4200**.

### Configuration de l'URL de l'API

L'URL de l'API est définie dans `src/environments/environment.ts` (développement) et
`src/environments/environment.prod.ts` (production) :

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

Modifiez `apiUrl` si votre backend écoute ailleurs.

## Build de production

```bash
npm run build
# équivalent à : ng build
```

Le résultat est généré dans `dist/spliteasy-web/browser`. `environment.prod.ts` est
automatiquement utilisé à la place de `environment.ts` (voir `fileReplacements` dans
`angular.json`).

## Tests

```bash
npm test
# équivalent à : ng test
```

Lance la suite Karma/Jasmine (tests unitaires du calcul des parts, des services HTTP via
`HttpTestingController`, du guard d'authentification et de l'intercepteur JWT).

## Structure du projet

```
src/app/
├── core/          modèles, services, intercepteurs, guards, utilitaires (calcul des parts)
├── shared/        composants réutilisables (dialogues, états vides, pipes) et pipes
├── layout/        toolbar + mise en page principale
├── features/
│   ├── auth/          connexion, inscription
│   ├── groups/        liste, détail (onglets), paramètres, création/édition
│   ├── participants/  liste, ajout/renommage, "C'est moi"
│   ├── expenses/      liste, formulaire (aperçu en direct), détail
│   ├── balances/      soldes, remboursements suggérés
│   ├── stats/         graphiques (ng2-charts)
│   └── join/          rejoindre un groupe via un code d'invitation
├── app.routes.ts
├── app.config.ts
└── app.component.ts
```

## Parcours de test manuel

1. Démarrer le backend (`count-backend`) et vérifier `http://localhost:8080/swagger-ui.html`.
2. `npm start` puis ouvrir `http://localhost:4200`.
3. Créer un compte, créer un groupe (vous devenez automatiquement participant).
4. Ajouter un ou deux participants supplémentaires (onglet Participants).
5. Ajouter une dépense (onglet Dépenses) et observer l'aperçu de répartition en direct.
6. Consulter l'onglet Équilibre : soldes et remboursements suggérés.
7. Copier le lien d'invitation (bouton "Inviter") et l'ouvrir dans une navigation privée pour
   tester le parcours "Rejoindre un groupe" avec un second compte.
