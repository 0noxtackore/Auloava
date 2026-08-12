<script setup>
// ============================================================
// BaseModal · Modal reutilizable con teleport
// v-model para abrir/cerrar, cierre con ESC y overlay.
// Slots: title, default, footer
// ============================================================
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
  closeOnOverlay: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const sizeClass = computed(() => `modal--${props.size}`)

function close() {
  emit('close')
  show.value = false
}

// Cierra con la tecla Escape
function onKeydown(event) {
  if (event.key === 'Escape' && show.value) close()
}

function onOverlay() {
  if (props.closeOnOverlay) close()
}

// Bloquea el scroll del body mientras el modal está abierto
watch(show, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal__overlay" @click.self="onOverlay">
        <div class="modal" :class="sizeClass" role="dialog" aria-modal="true">
          <header class="modal__header">
            <h3 class="modal__title">
              <slot name="title">{{ title }}</slot>
            </h3>
            <button class="modal__close" aria-label="Cerrar" @click="close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <div class="modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(16, 35, 26, 0.55);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal--sm { max-width: 420px; }
.modal--md { max-width: 560px; }
.modal--lg { max-width: 760px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.modal__title {
  font-size: 1.15rem;
  color: var(--green-800);
}

.modal__close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: var(--muted);
  transition: background var(--transition), color var(--transition);
}
.modal__close:hover {
  background: var(--green-100);
  color: var(--green-700);
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  background: var(--green-50);
}

/* Transición */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(16px) scale(0.97);
}
</style>
