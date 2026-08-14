<script setup>
// ============================================================
// AdminLoginView · Login dedicado del administrador (ruta /admin/login)
// Pantalla dividida: panel de marca (logo) + formulario glass.
// No aparece en ningún menú: solo se accede escribiendo la URL.
// ============================================================
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/services/auth'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const emailInput = ref(null)

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

// Aviso cuando un usuario logueado (no admin) intenta entrar al panel
const denied = computed(() => route.query.denied === '1')

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/invalid-email': 'El email no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/network-request-failed': 'Error de red. Revisa tu conexión.',
}

onMounted(() => emailInput.value?.focus())

async function onSubmit() {
  error.value = ''

  if (!emailValid.value) {
    error.value = 'Introduce un email válido.'
    return
  }
  if (!password.value) {
    error.value = 'Introduce la contraseña.'
    return
  }

  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    const redirect = route.query.redirect
    router.push(redirect ? { path: redirect } : { name: 'dashboard' })
  } catch (err) {
    error.value = ERROR_MESSAGES[err?.code] || err?.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <!-- Panel de marca -->
    <aside class="login__brand">
      <span class="login__aura login__aura--1" />
      <span class="login__aura login__aura--2" />
      <span class="login__aura login__aura--3" />

        <div class="login__brand-inner">
          <img class="login__logo" src="/images/logo.png" alt="Auloava" />
          <h1 class="login__claim">Tu panel de<br />administración.</h1>
          <p class="login__lead">Gestiona el catálogo curado de AliExpress, Amazon y Alibaba en un solo lugar.</p>

          <ul class="login__features">
            <li>
              <span class="login__check" />
              Añade y edita productos del catálogo
            </li>
            <li>
              <span class="login__check" />
              Controla precios, valoraciones y comisiones
            </li>
            <li>
              <span class="login__check" />
              Publicación automática en GitHub Pages
            </li>
          </ul>

          <p class="login__sign">Auloava · Admin</p>
        </div>
    </aside>

    <!-- Panel de formulario -->
    <main class="login__panel">
      <form class="login__card" @submit.prevent="onSubmit" novalidate>
        <img class="login__card-logo" src="/images/logo-white.png" alt="Auloava" />

        <h2 class="login__title">Inicia sesión</h2>
        <p class="login__subtitle">Accede a tu cuenta de Auloava</p>

        <Transition name="fade">
          <p v-if="denied" class="login__error">
            No tienes permiso de administrador. Accede con la cuenta autorizada.
          </p>
        </Transition>

        <label class="login__field" :class="{ 'is-invalid': error && !emailValid }">
          <span>Email</span>
          <input
            ref="emailInput"
            v-model="email"
            type="email"
            autocomplete="username"
            inputmode="email"
            spellcheck="false"
              placeholder="ejemplo@correo.com"
          />
        </label>

        <label class="login__field">
          <span>Contraseña</span>
          <div class="login__password">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="login__toggle"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3 3.6M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.2-.8M2 2l20 20M9.5 9.5a3 3 0 0 0 4.2 4.2" /></svg>
            </button>
          </div>
        </label>

        <Transition name="fade">
          <p v-if="error" class="login__error">{{ error }}</p>
        </Transition>

        <button class="login__submit" type="submit" :disabled="loading">
          <span v-if="loading" class="login__spinner" aria-hidden="true" />
          {{ loading ? 'Entrando…' : 'Iniciar sesión' }}
        </button>

        <p class="login__switch">
          ¿No tienes cuenta?
          <RouterLink :to="{ name: 'register' }">Regístrate</RouterLink>
        </p>

        <p class="login__foot">Conexión segura · Auloava</p>
      </form>
    </main>
  </div>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
}

/* ===== Panel de marca (invertido: claro) ===== */
.login__brand {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--green-900);
  background: var(--off-white);
  border-right: 1px solid var(--line);
}

.login__aura {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  animation: float 14s ease-in-out infinite;
}
.login__aura--1 {
  width: 360px;
  height: 360px;
  background: #2fe39a;
  top: -90px;
  left: -70px;
}
.login__aura--2 {
  width: 300px;
  height: 300px;
  background: #1aa8ff;
  bottom: -80px;
  right: -60px;
  animation-delay: -5s;
}
.login__aura--3 {
  width: 220px;
  height: 220px;
  background: #b6ff3c;
  top: 55%;
  left: 40%;
  opacity: 0.3;
  animation-delay: -9s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -28px) scale(1.08); }
}

.login__brand-inner {
  position: relative;
  z-index: 1;
  max-width: 420px;
}

.login__logo {
  display: block;
  width: 132px;
  height: auto;
  margin: 0 auto 28px;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.25));
}

.login__claim {
  font-size: 2.1rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
  color: var(--green-900);
}

.login__lead {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(16, 35, 26, 0.72);
  margin: 0 0 28px;
}

.login__features {
  list-style: none;
  margin: 0 0 36px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login__features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: rgba(16, 35, 26, 0.85);
}

.login__check {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(20, 99, 63, 0.12);
  position: relative;
}
.login__check::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 4px;
  width: 6px;
  height: 11px;
  border: solid var(--green-600);
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.login__sign {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(16, 35, 26, 0.5);
}

/* ===== Panel de formulario (invertido: verde) ===== */
.login__panel {
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(140deg, #0c3527 0%, #14663f 48%, #1c7a4f 100%);
}

.login__card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 22px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: card-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.login__card-logo {
  display: block;
  width: 116px;
  height: auto;
  margin: 0 auto 6px;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.25));
}

.login__title {
  font-size: 1.4rem;
  margin: 4px 0 0;
  color: var(--white);
}

.login__subtitle {
  margin: 0 0 8px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.78);
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--white);
}

.login__field input {
  padding: 12px 14px;
  border: 1.5px solid transparent;
  border-radius: var(--radius);
  font-size: 0.95rem;
  font-weight: 400;
  background: rgba(255, 255, 255, 0.92);
  color: var(--green-900);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.login__field input::placeholder {
  color: rgba(16, 35, 26, 0.45);
}

.login__field input:focus {
  outline: none;
  border-color: var(--white);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.25);
}

.login__field.is-invalid input {
  border-color: var(--danger);
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.28);
}

.login__password {
  position: relative;
  display: flex;
  align-items: center;
}

.login__password input {
  width: 100%;
  padding-right: 46px;
}

.login__toggle {
  position: absolute;
  right: 8px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
.login__toggle:hover {
  background: rgba(255, 255, 255, 0.16);
  color: var(--white);
}

.login__error {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #ffd9de;
  background: rgba(220, 53, 69, 0.28);
  border-radius: var(--radius);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.login__submit {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--white);
  color: var(--green-800);
  font-size: 0.97rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
  transition: transform var(--transition), box-shadow var(--transition);
}
.login__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}
.login__submit:disabled {
  opacity: 0.75;
  cursor: default;
}

.login__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(20, 99, 63, 0.3);
  border-top-color: var(--green-700);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.login__foot {
  margin: 6px 0 0;
  text-align: center;
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.7);
}

.login__switch {
  margin: 4px 0 0;
  text-align: center;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.8);
}
.login__switch a {
  color: var(--white);
  font-weight: 600;
  text-decoration: none;
}
.login__switch a:hover {
  text-decoration: underline;
}

/* ===== Responsive ===== */
@media (max-width: 920px) {
  .login {
    grid-template-columns: 1fr;
  }
  .login__brand {
    padding: 38px 24px 30px;
    min-height: auto;
    text-align: center;
  }
  .login__brand-inner {
    max-width: 520px;
    margin: 0 auto;
  }
  .login__logo {
    width: 150px;
    margin-bottom: 18px;
  }
  .login__claim {
    font-size: 1.7rem;
  }
  .login__lead {
    margin-bottom: 22px;
  }
  .login__title,
  .login__subtitle {
    text-align: center;
  }
  .login__features {
    align-items: center;
    margin-bottom: 0;
  }
  .login__sign {
    display: none;
  }
  .login__panel {
    min-height: auto;
    padding: 24px 16px 32px;
  }
}

@media (max-width: 560px) {
  .login__brand {
    padding: 30px 20px 24px;
  }
  .login__logo {
    width: 132px;
  }
  .login__features {
    display: none;
  }
  .login__panel {
    padding: 16px 14px 28px;
  }
  .login__card {
    padding: 30px 22px;
    border-radius: 18px;
  }
  .login__card-logo {
    width: 128px;
  }
  .login__title {
    font-size: 1.25rem;
  }
  .login__subtitle {
    font-size: 0.84rem;
  }
}

@media (max-width: 360px) {
  .login__card {
    padding: 26px 16px;
  }
  .login__field input {
    padding: 11px 12px;
  }
}
</style>
