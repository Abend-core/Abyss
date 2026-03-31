# Rules — Frontend (Vue.js PWA)

## Stack
- **Vue 3** (Composition API, `<script setup>`)
- **Vite** + **vite-plugin-pwa** (Workbox)
- **Pinia** — state management
- **Vue Router** — navigation SPA
- **Atomic Design** — structure des composants

---

## PWA
- `registerType: 'autoUpdate'` — mise à jour silencieuse du service worker
- Workbox avec stratégie `NetworkFirst` pour l'API, `CacheFirst` pour les assets
- Manifest complet (nom, icônes, theme_color, display standalone)
- L'app doit fonctionner en mode offline (fallback sur cache)

---

## Mobile First — OBLIGATOIRE
- Styles de base = **mobile** (aucun media query)
- Ajout de styles via `@media (min-width: Xpx)` pour écrans plus grands
- Breakpoints :
  ```
  sm: 640px
  md: 768px
  lg: 1024px
  xl: 1280px
  ```
- Navigation mobile via bottom navbar
- Touch targets minimum **44px × 44px** (WCAG)
- Pas de `hover` seul — toujours un fallback accessible

---

## Structure des dossiers

```
src/
  assets/
    styles/
      _variables.css      # CSS custom properties
      _reset.css          # CSS reset mobile-first
      _typography.css     # Typographie
      main.css            # Import global
  components/
    atoms/                # Composants indivisibles (Button, Input, Badge…)
    molecules/            # Combinaisons d'atomes (FormField, NavItem…)
    organisms/            # Composants complexes (Header, Navbar, Grid…)
  composables/            # Logique réutilisable (useApi, useBreakpoint…)
  pages/                  # Vues associées aux routes (HomePage, SettingsPage…)
  router/
    index.js              # Définition des routes
  stores/
    app.store.js          # État global de l'app
    services.store.js     # État des services Docker
```

---

## Composants

### Règles générales
- Préfixe `Base` pour les atomes : `BaseButton.vue`, `BaseInput.vue`
- `<script setup>` obligatoire
- Props typées avec `defineProps`
- Emits déclarés avec `defineEmits`
- Un composant = un seul rôle

### Atomic Design
| Niveau     | Rôle                                           | Exemples                         |
|------------|------------------------------------------------|----------------------------------|
| Atom       | Élément UI de base, indivisible                | BaseButton, BaseInput, BaseBadge |
| Molecule   | Combinaison d'atomes avec une fonction propre  | FormField, ServiceCard, NavItem  |
| Organism   | Section complète de l'interface                | AppHeader, AppNavbar, ServiceGrid|
| Page       | Vue complète rattachée à une route             | HomePage, ServicesPage           |

---

## Stores (Pinia)
- Un store par domaine fonctionnel
- Utiliser `defineStore` avec Options API ou Composition API
- Les stores ne font pas d'import d'autres stores dans `state`
- Les actions sont `async` si elles font des appels réseau
- Persister les préférences utilisateur avec `localStorage`

---

## Layouts

Deux layouts distincts, sélectionnés via `route.meta.layout` :

| Layout | Fichier | Utilisé pour | Chrome |
|--------|---------|--------------|--------|
| `default` | `src/layouts/DefaultLayout.vue` | Pages app (home, services, settings…) | Header + Footer (avec nav) |
| `auth` | `src/layouts/AuthLayout.vue` | Login, Register | Aucun |

### Structure `DefaultLayout`
```
<AppHeader />              ← sticky top
<main>                     ← flex: 1, padding-bottom pour la nav mobile fixe
  <RouterView />
</main>
<AppFooter />              ← contient la navigation ; position: fixed bottom sur mobile,
                              static en bas sur desktop
```

### Définir le layout d'une route
```js
{ path: '/ma-page', component: ..., meta: { layout: 'default' } }  // ou 'auth'
```

---

## Navigation (AppFooter)
- Bottom navbar mobile (position: fixed) → top bar desktop (static)
- Liens via `NavItem` molecule (RouterLink + icône + label)
- Icône **minimum 44×44px** de touch target

## CSS / Styles
- Nommage BEM pour les classes locales
- `scoped` styles dans chaque composant
- Pas de framework CSS externe (pas de Tailwind, pas de Bootstrap)
- Variables de couleur, espacement et typographie centralisées

---

## Routing
- Lazy loading des pages : `() => import('./pages/...')`
- `meta.requiresAuth` pour les routes protégées
- Titre de page mis à jour via `router.afterEach`

---

## Performance
- Lazy loading des composants lourds
- `v-memo` pour les listes longues
- Images au format SVG ou WebP
- Preconnect sur l'URL de l'API dans `index.html`
