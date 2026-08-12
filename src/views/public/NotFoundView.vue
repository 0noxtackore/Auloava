<script setup>
// ============================================================
// NotFoundView · Página 404
// ============================================================
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="nf">
    <div class="nf__code">404</div>
    <h1 class="nf__title">Página no encontrada</h1>
    <p class="nf__text">
      La página que buscas no existe o fue movida.
    </p>
    <div class="nf__actions">
      <button class="nf__btn" @click="router.push({ name: 'landing' })">
        Volver al inicio
      </button>
      <button class="nf__btn nf__btn--outline" @click="router.back()">
        Ir atrás
      </button>
    </div>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 24px;
  background:
    radial-gradient(600px 400px at 50% 0%, rgba(47, 107, 79, 0.10), transparent 60%),
    var(--off-white);
  gap: 10px;
}

.nf__code {
  font-family: var(--font-display);
  font-size: clamp(6rem, 18vw, 10rem);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(120deg, var(--green-600), var(--green-300));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.nf__title {
  font-size: 1.8rem;
  color: var(--green-900);
}

.nf__text {
  color: var(--muted);
  max-width: 400px;
}

.nf__actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
  justify-content: center;
}

.nf__btn {
  padding: 12px 24px;
  border-radius: var(--radius-full);
  background: var(--green-600);
  color: var(--white);
  font-weight: 600;
  transition: background var(--transition), transform var(--transition);
}
.nf__btn:hover {
  background: var(--green-700);
  transform: translateY(-1px);
}

.nf__btn--outline {
  background: transparent;
  color: var(--green-600);
  border: 1.5px solid var(--green-300);
}
.nf__btn--outline:hover {
  background: var(--green-50);
}
</style>
