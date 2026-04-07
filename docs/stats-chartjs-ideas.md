# Idées de statistiques avec Chart.js

Ce document présente des propositions de graphiques pour la page `Stats` en utilisant Chart.js.
Le but est de rendre les informations visuelles, actionnables et faciles à lire.

## 1. Répartition des dépenses par catégorie

- Type : `doughnut` ou `pie`
- Données : montant total par catégorie
- Utilité : voir immédiatement quelles catégories absorbent le plus de budget
- Options Chart.js : `tooltip`, `legend.position: 'bottom'`, couleurs de catégories

## 2. Évolution mensuelle des dépenses vs revenus

- Type : `line`
- Données : totals mensuels pour `expense` et `credit`
- Utilité : suivre la tendance et repérer les mois excédentaires ou déficitaires
- Options Chart.js : `time` sur l'axe X, `fill: false`, `pointRadius: 3`, `borderWidth: 2`

## 3. Comparaison des types d'opérations

- Type : `bar` ou `horizontalBar`
- Données : total `dépense` vs total `crédit` sur une période donnée
- Utilité : évaluer l'équilibre financier à court terme
- Options Chart.js : `scales.y.beginAtZero`, `stacked: false`

## 4. Dépenses par période de la journée/semaine

- Type : `bar`
- Données : somme des dépenses par plage horaire ou par jour de la semaine
- Utilité : identifier les moments où les dépenses sont les plus élevées
- Options Chart.js : catégories personnalisées sur l'axe X, couleurs distinctes

## 5. Top 5 catégories les plus coûteuses

- Type : `bar`
- Données : montants des 5 premières catégories
- Utilité : focus sur les leviers d'économies les plus efficaces
- Options Chart.js : barres triées par montant décroissant, `data.labels` courts

## 6. Catégories avec sous-catégories

- Type : `polarArea` ou `bubble`
- Données : répartitions entre catégorie parent et sous-catégories
- Utilité : visualiser la contribution des sous-catégories dans un cadre hiérarchique
- Options Chart.js : `legend.position`, couleurs semi-transparentes

## 7. Jeu de données mixtes pour performance

- Exemple : combiner `bar` et `line` dans un même graphique
- Données : dépenses totales (barres) + moyenne mobile (ligne)
- Utilité : comparer volume et tendance simultanément
- Options Chart.js : `type: 'bar'` avec `datasets` de types différents

## 8. Indicateurs clés

- Carte de KPI en haut de page (non Chart.js)
- Exemples : solde net, montant mensuel moyen, nombre d'opérations, part des dépenses récurrentes
- Utilité : résumé rapide avant les graphiques détaillés

## Architecture proposée pour la page Stats

1. En-tête avec titre et résumé
2. KPI cards
3. Graphique de répartition par catégorie
4. Graphique d'évolution mensuelle
5. Graphique dépenses vs revenus
6. Graphique top catégories ou expériences horaires

## Notes d'implémentation Chart.js

- Installer `chart.js` (déjà ajouté)
- Utiliser `vue-chartjs` si besoin pour des composants Vue plus simples, mais Chart.js natif suffit
- Prévoir un composant `StatsChart.vue` réutilisable
- Gérer les thèmes clair/sombre via `options.plugins.legend.labels.color` et `options.scales.*.ticks.color`
- Support responsive : `responsive: true`, `maintainAspectRatio: false`
