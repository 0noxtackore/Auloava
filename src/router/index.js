// ============================================================
// AULOAVA · Router
// Rutas de la aplicación con lazy-loading de vistas.
//  - meta.title -> título del documento
// ============================================================
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/public/LandingView.vue'),
    meta: { title: 'Inicio' },
  },

  // ===== Catálogo público (enlace en inglés) =====
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/views/public/CatalogView.vue'),
    meta: { title: 'Catálogo' },
  },

  // ===== Área principal =====
  {
    path: '/app',
    component: MainLayout,
    children: [
      { path: '', redirect: { name: 'dashboard' } },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/private/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/views/private/ProductsView.vue'),
        meta: { title: 'Productos' },
      },
      {
        path: 'products/new',
        name: 'product-create',
        component: () => import('@/views/private/ProductFormView.vue'),
        meta: { title: 'Nuevo producto' },
      },
      {
        path: 'products/:id/edit',
        name: 'product-edit',
        component: () => import('@/views/private/ProductFormView.vue'),
        meta: { title: 'Editar producto' },
      },
    ],
  },

  // ===== Login oculto de administrador (sin enlaces en la UI) =====
  {
    path: '/login',
    name: 'admin-login',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: { title: 'Iniciar sesión' },
  },

  // ===== Registro de nuevos usuarios =====
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Crear cuenta' },
  },

  // ===== 404 =====
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/public/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

// Actualiza el título del documento en cada navegación
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Auloava` : 'Auloava'
})

// Guard: el área privada (/app) exige sesión de administrador.
// Si no hay sesión, redirige al login oculto (/login).
// Firebase sólo se carga al entrar al área privada o al login,
// para no penalizar la carga de las páginas públicas.
router.beforeEach(async (to) => {
  const requiresAuth = to.path.startsWith('/app')

  if (requiresAuth) {
    const { auth, authReady } = await import('@/services/auth')
    await authReady
    if (!auth.currentUser) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
  }

  // Si ya está logueado y entra al login, lo mandamos al panel
  if (to.name === 'admin-login') {
    const { auth, authReady } = await import('@/services/auth')
    await authReady
    if (auth.currentUser) {
      return { name: 'dashboard' }
    }
  }
})

export default router
