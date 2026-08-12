<script setup>
// ============================================================
// BaseBadge · Etiqueta de estado
// - variant: soft | solid | outline
// - color: green | red | amber | blue | custom
// - platform: si se indica, colorea según el marketplace
// ============================================================
import { computed } from 'vue'
import { PLATFORMS } from '@/constants'

const props = defineProps({
  variant: { type: String, default: 'soft' }, // soft | solid | outline
  color: { type: String, default: 'green' }, // green | red | amber | blue
  platform: { type: String, default: '' }, // aliexpress | amazon | alibaba
})

const isPlatform = computed(() => Boolean(props.platform && PLATFORMS[props.platform]))

const style = computed(() => {
  if (isPlatform.value) {
    return { backgroundColor: `${PLATFORMS[props.platform].color}1a` }
  }
  return {}
})

const classes = computed(() => [
  'badge',
  `badge--${props.variant}`,
  isPlatform.value
    ? 'badge--platform'
    : `badge--${props.color}`,
])
</script>

<template>
  <span :class="classes" :style="style">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  letter-spacing: 0.02em;
}

/* Variantes */
.badge--solid {
  color: var(--white);
  background: var(--green-600);
}
.badge--solid.badge--red { background: var(--danger); }
.badge--solid.badge--amber { background: var(--warning); }
.badge--solid.badge--blue { background: var(--info); }

.badge--soft {
  color: var(--green-700);
  background: var(--green-100);
}
.badge--soft.badge--red { color: var(--danger); background: var(--danger-soft); }
.badge--soft.badge--amber { color: var(--warning); background: var(--warning-soft); }
.badge--soft.badge--blue { color: var(--info); background: #e7f1f9; }

.badge--outline {
  color: var(--green-600);
  background: transparent;
  border: 1.5px solid var(--green-300);
}
.badge--outline.badge--red { color: var(--danger); border-color: #e6b4ad; }
.badge--outline.badge--amber { color: var(--warning); border-color: #ecd9a8; }
.badge--outline.badge--blue { color: var(--info); border-color: #bcd7ec; }

.badge--platform {
  color: var(--ink);
  border: 1.5px solid var(--line);
}
</style>
