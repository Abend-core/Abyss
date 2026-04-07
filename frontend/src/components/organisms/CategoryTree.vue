<script setup>
import { ref } from 'vue'

defineOptions({ name: 'CategoryTree' })

const props = defineProps({
  categories: { type: Array, default: () => [] },
  level:       { type: Number, default: 0 },
})
const emit = defineEmits(['move-up', 'move-down', 'indent', 'dedent', 'nest', 'delete', 'edit'])

/* ─── Desktop drag & drop (HTML5) ─────────────────────────
 * dragSrcId est au scope module = partagé entre toutes
 * les instances récursives (un seul drag actif à la fois). */
let dragSrcId = null

function onDragStart(e, id) {
  dragSrcId = id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  requestAnimationFrame(() => e.target.classList.add('is-dragging'))
}
function onDragEnd(e) {
  e.target.classList.remove('is-dragging')
  dragSrcId = null
  document.querySelectorAll('.is-drag-over').forEach(el => el.classList.remove('is-drag-over'))
}
function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  e.currentTarget.classList.add('is-drag-over')
}
function onDragLeave(e) {
  // évite le flickering quand la souris passe sur un enfant du card
  if (e.currentTarget.contains(e.relatedTarget)) return
  e.currentTarget.classList.remove('is-drag-over')
}
function onDrop(e, targetId) {
  e.preventDefault()
  e.stopPropagation()
  e.currentTarget.classList.remove('is-drag-over')
  const srcId = dragSrcId ?? e.dataTransfer.getData('text/plain')
  dragSrcId = null
  if (srcId && srcId !== targetId) emit('nest', { id: srcId, parentId: targetId })
}

/* ─── Mobile / Touch drag & drop ──────────────────── */
const touchSrcId  = ref(null)
const touchOverId = ref(null)
const touchMoving = ref(false)

function onTouchStart(e, id) {
  touchSrcId.value  = id
  touchMoving.value = false
}

function onTouchMove(e) {
  if (!touchSrcId.value) return
  touchMoving.value = true
  const t    = e.touches[0]
  const el   = document.elementFromPoint(t.clientX, t.clientY)
  const card = el?.closest('[data-cat-id]')
  touchOverId.value = card ? card.dataset.catId : null
}

function onTouchEnd() {
  const src = touchSrcId.value
  const tgt = touchOverId.value
  if (touchMoving.value && src && tgt && src !== tgt) {
    emit('nest', { id: src, parentId: tgt })
  }
  touchSrcId.value  = null
  touchOverId.value = null
  touchMoving.value = false
}
</script>

<template>
  <div class="ct">
    <div v-for="(cat, index) in categories" :key="cat.id" class="ct__item">

      <!-- Carte -->
      <div
        class="ct__card"
        :class="{
          'is-dragging':  touchSrcId === cat.id,
          'is-drag-over': touchOverId === cat.id && touchOverId !== touchSrcId,
        }"
        :style="{ marginLeft: `${level * 22}px` }"
        :data-cat-id="cat.id"
        draggable="true"
        @dragstart="onDragStart($event, cat.id)"
        @dragend="onDragEnd"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop($event, cat.id)"
        @touchstart.passive="onTouchStart($event, cat.id)"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
        <span class="ct__handle" aria-hidden="true">⠿</span>
        <span v-if="cat.color" class="ct__color-preview" :style="{ backgroundColor: cat.color }"></span>
        <span class="ct__name">{{ cat.name }}</span>
        <span v-if="cat.itemCount" class="ct__count" :title="`${cat.itemCount} opération${cat.itemCount > 1 ? 's' : ''}`">
          {{ cat.itemCount }}
        </span>

        <div class="ct__actions">
          <button v-if="index > 0" class="ct__btn ct__btn--move"   title="Monter"                @click.stop="$emit('move-up',   cat)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="ct__btn ct__btn--move"   title="Descendre"             @click.stop="$emit('move-down', cat)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button v-if="cat.parentId" class="ct__btn ct__btn--indent" title="Sortir du groupe"      @click.stop="$emit('dedent',    cat)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button v-if="!cat.parentId && !cat.children?.length" class="ct__btn ct__btn--indent" title="Mettre en sous-groupe" @click.stop="$emit('indent',    cat)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="ct__btn ct__btn--edit" title="Modifier"             @click.stop="$emit('edit', cat)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="ct__btn ct__btn--delete" title="Supprimer"             @click.stop="$emit('delete',    cat.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>

      <!-- Enfants récursifs -->
      <CategoryTree
        v-if="cat.children?.length"
        :categories="cat.children"
        :level="level + 1"
        @move-up="$emit('move-up',   $event)"
        @move-down="$emit('move-down', $event)"
        @indent="$emit('indent',   $event)"
        @dedent="$emit('dedent',   $event)"
        @nest="$emit('nest',     $event)"
        @delete="$emit('delete',   $event)"
        @edit="$emit('edit',       $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.ct { display:flex; flex-direction:column; gap:8px; }
.ct__item { display:flex; flex-direction:column; gap:6px; }

.ct__card {
  display:flex; align-items:center; gap:10px;
  padding:12px 14px;
  background:var(--color-bg-surface);
  border:1.5px solid var(--color-border);
  border-radius:12px;
  min-height:56px;
  user-select:none;
  cursor:grab;
  transition:border-color .15s, background .15s, box-shadow .15s;
  touch-action: none;
}
.ct__card:active { cursor:grabbing; }

.ct__card.is-dragging  { opacity:.4; border-color:var(--color-primary,#6366f1); }
.ct__card.is-drag-over {
  border-color:var(--color-primary,#6366f1); border-style:dashed;
  background:rgba(99,102,241,.1);
  box-shadow:0 0 0 3px rgba(99,102,241,.2);
}

.ct__handle {
  font-size:1.2rem; color:var(--color-text-muted,#999);
  flex-shrink:0; letter-spacing:-2px;
}
.ct__color-preview {
  width:12px; height:12px; border-radius:3px;
  flex-shrink:0; border:1px solid rgba(0,0,0,.1);
}
.ct__name {
  flex:1; font-weight:500; font-size:.95rem;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.ct__count {
  font-size:.72rem; font-weight:600;
  color:var(--color-text-muted,#999);
  background:var(--color-bg-base,#eee);
  border:1px solid var(--color-border);
  border-radius:20px;
  padding:1px 7px;
  flex-shrink:0; min-width:22px; text-align:center;
}

.ct__actions { display:flex; align-items:center; gap:5px; flex-shrink:0; }

.ct__btn {
  display:flex; align-items:center; justify-content:center;
  width:38px; height:38px;
  border-radius:8px; border:1.5px solid var(--color-border);
  background:var(--color-bg-base,#f5f5f5);
  color:var(--color-text-secondary,#555);
  cursor:pointer; padding:0;
  transition:all .15s; flex-shrink:0;
}
.ct__btn svg { width:17px; height:17px; display:block; }
.ct__btn:active { transform:scale(.88); }

.ct__btn--move:hover   { background:#ede9fe; border-color:#6366f1; color:#6366f1; }
.ct__btn--indent:hover { background:#ecfdf5; border-color:#10b981; color:#10b981; }
.ct__btn--edit:hover   { background:#eff6ff; border-color:#3b82f6; color:#3b82f6; }
.ct__btn--delete:hover { background:#fef2f2; border-color:#ef4444; color:#ef4444; }
.ct__btn:disabled { opacity:.28; cursor:not-allowed; pointer-events:none; }
</style>
