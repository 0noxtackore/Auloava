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
  scrollBehavior: () => ({ top: 0 }),
})

// Actualiza el título del documento en cada navegación
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Auloava` : 'Auloava'
})

export default router
