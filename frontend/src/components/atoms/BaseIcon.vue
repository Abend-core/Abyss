<script setup>
/**
 * BaseIcon — SVG inline icons (subset)
 * Utilise des paths SVG simples pour éviter une dépendance externe.
 */
const ICONS = {
  home:       'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  server:     'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.68 0C7.5 20.5 4 17 4 12V6.5a2 2 0 0 1 1.75-2L12 3l6.25 1.5A2 2 0 0 1 20 6.5z',
  settings:   'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6z M12 8v4l3 3',
  check:      'M20 6L9 17l-5-5',
  close:      'M18 6L6 18M6 6l12 12',
  alert:      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  wifi:       'M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01',
  wifi_off:   'M1 1l22 22 M16.72 11.06A10.94 10.94 0 0 1 19 12.55 M5 12.55a10.94 10.94 0 0 1 5.17-2.39 M10.71 5.05A16 16 0 0 1 22.56 9 M1.42 9a15.91 15.91 0 0 1 4.7-2.88 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01',
  database:   'M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5z M2 7v5c0 2.76 4.48 5 10 5s10-2.24 10-5V7 M2 12v5c0 2.76 4.48 5 10 5s10-2.24 10-5v-5',
  chart:      'M2 22h20 M4 18v-4 M10 18v-8 M16 18v-5 M22 18v-10',
  refresh:    'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  info:       'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-9v4 M12 8h.01',
  external:   'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
  trash:      'M3 6h18 M8 6V4h8v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  edit:       'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  logout:     'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  arrow_left: 'M19 12H5 M12 19l-7-7 7-7',
  light_mode: 'M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  dark_mode:  'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  plus:       'M12 5v14 M5 12h14',
  filter:     'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
}

const props = defineProps({
  name:        { type: String, required: true },
  size:        { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 },
  color:       { type: String, default: 'currentColor' },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
  >
    <template v-for="(path, i) in (ICONS[name] ?? '').split(' M ').filter(Boolean)" :key="i">
      <path :d="i === 0 ? path : 'M ' + path" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
