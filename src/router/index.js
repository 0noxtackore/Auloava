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

  // ===== Área de administrador =====
  {
    path: '/admin',
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

  // ===== Login dedicado del administrador (bajo /admin) =====
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/AdminLoginView.vue'),
    meta: { title: 'Admin · Iniciar sesión' },
  },

  // El antiguo /login redirige al login de administrador
  { path: '/login', redirect: '/admin/login' },

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

// Redirige el área privada anterior (/app) a la nueva (/admin)
routes.unshift({ path: '/app/:pathMatch(.*)*', redirect: '/admin' })

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

// Solo estos emails (VITE_ADMIN_EMAIL, separados por comas) pueden entrar
// al panel. Si está vacío, cualquier sesión válida tiene acceso.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const isAdmin = (user) =>
  !!user && (!ADMIN_EMAILS.length || ADMIN_EMAILS.includes((user.email || '').toLowerCase()))

// Guard: el área privada (/admin, excepto /admin/login) exige sesión
// de administrador. Si no hay sesión o no es admin, redirige al login
// dedicado (/admin/login). Firebase sólo se carga al entrar al área
// privada o al login, para no penalizar la carga de las páginas públicas.
router.beforeEach(async (to) => {
  const requiresAuth = to.path.startsWith('/admin') && to.name !== 'admin-login'

  if (requiresAuth) {
    const { auth, authReady } = await import('@/services/auth')
    await authReady
    const user = auth.currentUser
    if (!user) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
    if (!isAdmin(user)) {
      return { name: 'admin-login', query: { denied: '1' } }
    }
  }

  // Si ya está logueado (y es admin) y entra al login, lo mandamos al panel
  if (to.name === 'admin-login') {
    const { auth, authReady } = await import('@/services/auth')
    await authReady
    if (isAdmin(auth.currentUser)) {
      return { name: 'dashboard' }
    }
  }
})

export default router
