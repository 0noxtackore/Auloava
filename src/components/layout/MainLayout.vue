<script setup>
// ============================================================
// MainLayout · Layout principal del área privada
// Composición: Sidebar (nav) + Header (topbar) + contenido.
// ============================================================
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

// Controla la apertura del sidebar en móvil
const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="layout">
    <!-- Capa oscura en móvil -->
    <div v-if="sidebarOpen" class="layout__backdrop" @click="closeSidebar" />

    <AppSidebar :open="sidebarOpen" @close="closeSidebar" />

    <div class="layout__main">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="layout__content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade-up" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--off-white);
}

.layout__backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(16, 35, 26, 0.4);
  backdrop-filter: blur(2px);
}

.layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout__content {
  flex: 1;
  padding: 32px;
  max-width: 1280px;
  width: 100%;
  margin-inline: auto;
}

/* Transición de vistas internas */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 900px) {
  .layout__content {
    padding: 20px;
  }
}
</style>
