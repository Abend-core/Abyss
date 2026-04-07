# Idées de Statistiques pour Abyss

## Vue d'ensemble des statistiques

Cette page permettra aux utilisateurs de visualiser leurs dépenses et revenus sous forme de graphiques interactifs, facilitant l'analyse des habitudes financières.

## Statistiques proposées

### 1. **Répartition par catégories** (Pie Chart)
- **Type**: Camembert interactif
- **Données**: Pourcentage des dépenses par catégorie
- **Période**: Mois en cours / 3 derniers mois / année
- **Fonctionnalités**:
  - Clic sur une tranche pour filtrer les opérations
  - Légende avec couleurs des catégories
  - Affichage du montant total par catégorie

### 2. **Évolution temporelle** (Line Chart)
- **Type**: Courbe avec points
- **Données**: Dépenses/revenus par jour/semaine/mois
- **Période**: 6 derniers mois / année complète
- **Fonctionnalités**:
  - Ligne pour dépenses, ligne pour revenus
  - Zone colorée entre courbes (épargne)
  - Zoom sur périodes spécifiques

### 3. **Comparaison mois par mois** (Bar Chart)
- **Type**: Barres groupées
- **Données**: Comparaison des dépenses par catégorie entre mois
- **Période**: 6 derniers mois
- **Fonctionnalités**:
  - Barres colorées par catégorie
  - Ligne de tendance
  - Pourcentage d'évolution

### 4. **Budget vs Réel** (Progress Bars + Doughnut)
- **Type**: Barres de progression + camembert
- **Données**: Budget défini vs dépenses réelles par catégorie
- **Période**: Mois en cours
- **Fonctionnalités**:
  - Couleur verte si sous budget, rouge si dépassement
  - Pourcentage restant/écart
  - Alertes visuelles

### 5. **Analyse des récurrences** (Stacked Bar Chart)
- **Type**: Barres empilées
- **Données**: Répartition des dépenses récurrentes vs ponctuelles
- **Période**: Mois/année
- **Fonctionnalités**:
  - Séparation par type de récurrence (hebdomadaire, mensuel, etc.)
  - Montant total des récurrences

### 6. **Top dépenses** (Horizontal Bar Chart)
- **Type**: Barres horizontales
- **Données**: Les 10 plus grosses dépenses
- **Période**: Mois/année
- **Fonctionnalités**:
  - Tri par montant décroissant
  - Affichage de la date et catégorie
  - Clic pour voir le détail

### 7. **Évolution de l'épargne** (Area Chart)
- **Type**: Graphique en aires
- **Données**: Revenus - Dépenses cumulés
- **Période**: 12 derniers mois
- **Fonctionnalités**:
  - Zone colorée (verte pour épargne positive, rouge négative)
  - Ligne d'objectif d'épargne
  - Projections futures

### 8. **Analyse saisonnière** (Heatmap)
- **Type**: Carte thermique
- **Données**: Dépenses par jour du mois sur une année
- **Période**: Année complète
- **Fonctionnalités**:
  - Couleurs selon l'intensité des dépenses
  - Identification des patterns saisonniers

## Fonctionnalités transversales

### Filtres et contrôles
- **Sélecteur de période**: Aujourd'hui, 7j, 30j, 90j, 1an, Tout
- **Filtre par type**: Toutes, Dépenses, Crédits
- **Filtre par catégorie**: Toutes ou sélection multiple
- **Filtre par récurrence**: Toutes, Ponctuelles, Récurrentes

### Export et partage
- **Export PNG/PDF**: Pour intégrer dans rapports
- **Export CSV**: Données brutes pour analyse externe
- **Partage**: Lien direct vers un graphique spécifique

### Personnalisation
- **Thèmes**: Clair/sombre selon préférences utilisateur
- **Couleurs**: Utilisation des couleurs de catégories définies
- **Responsive**: Adaptation mobile/desktop

## Métriques clés à afficher

- **Total dépenses** du mois/année
- **Total revenus** du mois/année
- **Épargne** (revenus - dépenses)
- **Pourcentage épargne** sur revenus
- **Moyenne dépense** par jour/semaine/mois
- **Catégorie la plus dépensière**
- **Évolution** vs mois précédent

## Priorisation d'implémentation

1. **Phase 1** (MVP): Répartition par catégories + Évolution temporelle
2. **Phase 2**: Comparaison mois par mois + Budget vs Réel
3. **Phase 3**: Analyse récurrences + Top dépenses + Épargne
4. **Phase 4**: Heatmap saisonnière + exports avancés

## Technologies
- **Chart.js** avec plugins (zoom, annotations, datalabels)
- **Vue 3** Composition API
- **Responsive** avec breakpoints
- **Performance** avec virtualisation pour gros volumes</content>
<parameter name="filePath">/home/rxdy/dev/Abyss/docs/stats-ideas.md