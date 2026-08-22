<script setup>
// ============================================================
// OnboardingModal · Recorrido paso a paso tras crear la cuenta.
// El usuario elige de 1 a todos los nichos (categorías). Puede
// crear un nicho nuevo, que se guarda como sugerencia para todos.
// ============================================================
import { ref, watch, computed } from 'vue'
import { profileService } from '@/services/profile'

const props = defineProps({
  visible: { type: Boolean, default: false },
  user: { type: Object, default: () => ({ uid: '', email: '' }) },
})
const emit = defineEmits(['done', 'close'])

const step = ref(0) // 0: bienvenida · 1: nichos · 2: listo
const niches = ref([])
const selected = ref([])
const customName = ref('')
const loading = ref(false)
const error = ref('')

const total = 3
const canNext = computed(() => (step.value === 1 ? selected.value.length >= 1 : true))
const allSelected = computed(
  () => niches.value.length > 0 && selected.value.length === niches.value.length,
)

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      step.value = 0
      selected.value = []
      customName.value = ''
      error.value = ''
      loading.value = true
      try {
        niches.value = await profileService.listNiches()
      } catch {
        niches.value = []
      } finally {
        loading.value = false
      }
    }
  },
)

function toggle(n) {
  const i = selected.value.indexOf(n)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(n)
}
function selectAll() {
  selected.value = [...niches.value]
}
function clearAll() {
  selected.value = []
}
async function addNiche() {
  const name = customName.value.trim()
  if (!name) return
  if (niches.value.includes(name)) {
    if (!selected.value.includes(name)) selected.value.push(name)
    customName.value = ''
    return
  }
  loading.value = true
  error.value = ''
  try {
    const list = await profileService.createNiche(name)
    niches.value = list
    if (!selected.value.includes(name)) selected.value.push(name)
    customName.value = ''
  } catch (e) {
    error.value = e?.message || 'No se pudo crear el nicho'
  } finally {
    loading.value = false
  }
}
function next() {
  if (!canNext.value) return
  if (step.value < total - 1) step.value++
}
function back() {
  if (step.value > 0) step.value--
}
async function finish() {
  if (!props.user.uid) {
    emit('done')
    return
  }
  loading.value = true
  try {
    await profileService.save(props.user.uid, props.user.email, selected.value)
    emit('done')
  } catch (e) {
    error.value = e?.message || 'No se pudo guardar tu perfil'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Transition name="ob-fade">
    <div v-if="visible" class="ob" @click.self="emit('close')">
      <div class="ob__card" role="dialog" aria-modal="true">
        <!-- Indicador de pasos -->
        <div class="ob__steps">
          <span
            v-for="n in total"
            :key="n"
            class="ob__step"
            :class="{ 'is-active': n - 1 === step, 'is-done': n - 1 < step }"
          />
        </div>

        <!-- Paso 0: bienvenida -->
        <div v-if="step === 0" class="ob__body">
          <div class="ob__emoji">👋</div>
          <h2 class="ob__title">¡Bienvenido a Auloava!</h2>
          <p class="ob__text">
            Vamos a personalizar tu experiencia. En el siguiente paso eliges los
            <strong>nichos</strong> que te interesan y tu catálogo se llenará solo
            con lo que de verdad te gusta.
          </p>
          <button class="ob__btn" type="button" @click="next">Empecemos</button>
        </div>

        <!-- Paso 1: nichos -->
        <div v-else-if="step === 1" class="ob__body">
          <h2 class="ob__title">Elige tus nichos</h2>
          <p class="ob__text">
            Selecciona al menos 1. Puedes elegir todos los que quieras
            (o todos). Si no ves el tuyo, créalo abajo.
          </p>

          <div class="ob__chips">
            <button
              v-for="n in niches"
              :key="n"
              type="button"
              class="ob__chip"
              :class="{ 'is-on': selected.includes(n) }"
              @click="toggle(n)"
            >
              {{ n }}
            </button>
            <p v-if="!niches.length && !loading" class="ob__empty">
              Cargando nichos…
            </p>
          </div>

          <div class="ob__custom">
            <input
              v-model="customName"
              type="text"
              placeholder="Crear un nicho nuevo…"
              @keyup.enter="addNiche"
            />
            <button
              type="button"
              class="ob__btn ob__btn--ghost"
              :disabled="loading || !customName.trim()"
              @click="addNiche"
            >
              Crear
            </button>
          </div>

          <div class="ob__row">
            <button type="button" class="ob__link" @click="selectAll">Todos</button>
            <button type="button" class="ob__link" @click="clearAll">Ninguno</button>
            <span class="ob__count">Seleccionados: {{ selected.length }}</span>
          </div>

          <p v-if="error" class="ob__error">{{ error }}</p>

          <div class="ob__actions">
            <button type="button" class="ob__btn ob__btn--ghost" @click="back">
              Atrás
            </button>
            <button
              type="button"
              class="ob__btn"
              :disabled="!canNext"
              @click="next"
            >
              Continuar
            </button>
          </div>
        </div>

        <!-- Paso 2: listo -->
        <div v-else class="ob__body">
          <div class="ob__emoji">🎉</div>
          <h2 class="ob__title">¡Listo!</h2>
          <p class="ob__text">
            Guardamos tus <strong>{{ selected.length }}</strong> nicho(s). Tu catálogo
            ahora es exclusivo y propio: solo verás lo que elegiste.
          </p>
          <button class="ob__btn" type="button" :disabled="loading" @click="finish">
            {{ loading ? 'Guardando…' : 'Entrar a mi catálogo' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ob {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(8, 30, 22, 0.55);
  backdrop-filter: blur(4px);
}
.ob__card {
  width: 100%;
  max-width: 480px;
  background: var(--white);
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  padding: 28px 26px 26px;
  animation: ob-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes ob-in {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ob__steps {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 18px;
}
.ob__step {
  width: 34px;
  height: 5px;
  border-radius: 999px;
  background: var(--line);
  transition: background var(--transition);
}
.ob__step.is-active,
.ob__step.is-done {
  background: var(--green-600);
}
.ob__body {
  text-align: center;
}
.ob__emoji {
  font-size: 2.6rem;
  margin-bottom: 6px;
}
.ob__title {
  font-size: 1.4rem;
  color: var(--green-900);
  margin: 0 0 8px;
}
.ob__text {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 18px;
}
.ob__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}
.ob__chip {
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--line);
  background: var(--off-white);
  color: var(--ink);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}
.ob__chip:hover {
  border-color: var(--green-500);
}
.ob__chip.is-on {
  background: var(--green-600);
  border-color: var(--green-600);
  color: var(--white);
}
.ob__empty {
  color: var(--muted);
  font-size: 0.85rem;
}
.ob__custom {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.ob__custom input {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-full);
  font-size: 0.9rem;
}
.ob__custom input:focus {
  outline: none;
  border-color: var(--green-500);
}
.ob__row {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.82rem;
  color: var(--muted);
  margin-bottom: 8px;
}
.ob__link {
  background: none;
  border: none;
  color: var(--green-700);
  font-weight: 600;
  cursor: pointer;
  font-size: 0.82rem;
}
.ob__count {
  margin-left: auto;
}
.ob__error {
  color: var(--danger);
  font-size: 0.82rem;
  margin: 4px 0 0;
}
.ob__actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.ob__btn {
  flex: 1;
  padding: 12px 18px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--green-600), var(--green-700));
  color: var(--white);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition);
}
.ob__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
.ob__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.ob__btn--ghost {
  background: var(--off-white);
  color: var(--green-700);
  border: 1.5px solid var(--green-300);
}
.ob-fade-enter-active,
.ob-fade-leave-active {
  transition: opacity 0.25s ease;
}
.ob-fade-enter-from,
.ob-fade-leave-to {
  opacity: 0;
}
</style>
