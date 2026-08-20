// ============================================================
// AULOAVA · Store de productos (Pinia)
// Estado global de productos, filtros, carga y CRUD.
// Ejemplo de integración del store con las vistas.
// ============================================================
import { defineStore } from 'pinia'
import { productService } from '@/services/productService'
import { formatCompact } from '@/utils/formatters'

export const useProductStore = defineStore('products', {
  state: () => ({
    products: [],
    loading: false,
    saving: false,
    error: null,
    // Filtros de la vista de productos
    filters: {
      search: '',
      platform: 'all',
      category: 'all',
    },
  }),

  getters: {
    /** Productos filtrados por búsqueda, plataforma y categoría */
    filteredProducts: (state) => {
      const q = state.filters.search.trim().toLowerCase()
      return state.products.filter((p) => {
        const cat = (p.category || '').toLowerCase()
        const title = (p.title || '').toLowerCase()
        const platform = (p.platform || '').toLowerCase()
        const matchSearch = !q || title.includes(q) || cat.includes(q) || platform.includes(q)
        const matchPlatform =
          state.filters.platform === 'all' || platform === state.filters.platform
        const matchCategory =
          state.filters.category === 'all' || cat === state.filters.category.toLowerCase()
        return matchSearch && matchPlatform && matchCategory
      })
    },

    /** Total de productos en catálogo */
    totalProducts: (state) => state.products.length,

    /** Valor de inventario estimado (precio × stock) */
    inventoryValue: (state) =>
      state.products.reduce((acc, p) => acc + p.price * p.stock, 0),

    /** Clicks totales acumulados */
    totalClicks: (state) => state.products.reduce((acc, p) => acc + p.clicks, 0),

    /** Comisión media ponderada */
    averageCommission: (state) => {
      if (!state.products.length) return 0
      return (
        state.products.reduce((acc, p) => acc + p.commission, 0) /
        state.products.length
      )
    },

    /** Ingresos estimados = clicks × precio × comisión */
    estimatedRevenue: (state) =>
      state.products.reduce(
        (acc, p) => acc + p.clicks * p.price * (p.commission / 100),
        0,
      ),

    /** Top 5 productos por clicks */
    topProducts: (state) =>
      [...state.products].sort((a, b) => b.clicks - a.clicks).slice(0, 5),

    /** Desglose por plataforma */
    platformBreakdown: (state) => {
      const map = {}
      state.products.forEach((p) => {
        map[p.platform] = (map[p.platform] || 0) + 1
      })
      return Object.entries(map).map(([platform, count]) => ({
        platform,
        count,
        percent: state.products.length
          ? Math.round((count / state.products.length) * 100)
          : 0,
      }))
    },

    /** Estadísticas compactas para las tarjetas del dashboard */
    stats: function () {
      return [
        {
          label: 'Productos',
          value: this.totalProducts,
          icon: 'box',
          hint: 'en catálogo',
        },
        {
          label: 'Clicks',
          value: formatCompact(this.totalClicks),
          icon: 'cursor',
          hint: 'totales',
        },
        {
          label: 'Ingresos est.',
          value: this.estimatedRevenue,
          icon: 'coin',
          hint: 'por comisiones',
          currency: true,
        },
        {
          label: 'Comisión media',
          value: this.averageCommission,
          icon: 'percent',
          hint: '% por venta',
          percent: true,
        },
      ]
    },
  },

  actions: {
    /** Carga todos los productos desde el servicio */
    async fetchProducts() {
      this.loading = true
      this.error = null
      try {
        this.products = await productService.getAll()
      } catch (error) {
        this.error = error?.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /** Obtiene un producto concreto */
    async fetchProduct(id) {
      return productService.getById(id)
    },

    /** Crea un producto y lo añade al estado */
    async createProduct(payload) {
      this.saving = true
      try {
        const product = await productService.create(payload)
        this.products.unshift(product)
        return product
      } finally {
        this.saving = false
      }
    },

    /** Actualiza un producto en el estado */
    async updateProduct(id, payload) {
      this.saving = true
      try {
        const updated = await productService.update(id, payload)
        const index = this.products.findIndex((p) => p.id === id)
        if (index !== -1) this.products[index] = updated
        return updated
      } finally {
        this.saving = false
      }
    },

    /** Elimina un producto del estado */
    async deleteProduct(id) {
      await productService.remove(id)
      this.products = this.products.filter((p) => p.id !== id)
    },

    /**
     * Registra un click en un producto: incrementa el contador de forma
     * optimista en el estado local y lo persiste (+1 atómico) en Firebase.
     */
    async registerClick(id) {
      const index = this.products.findIndex((p) => p.id === id)
      if (index !== -1) {
        const current = Number(this.products[index].clicks) || 0
        this.products[index].clicks = current + 1
      }
      try {
        await productService.registerClick(id)
      } catch {
        /* el contador local ya se actualizó de forma optimista */
      }
    },

    /** Reinicia los filtros */
    resetFilters() {
      this.filters.search = ''
      this.filters.platform = 'all'
      this.filters.category = 'all'
    },
  },
})
