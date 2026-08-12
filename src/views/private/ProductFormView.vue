<script setup>
// ============================================================
// ProductFormView · Crear / Editar producto
// Formulario validado con estados de carga y error.
// Funciona para ambas rutas: /products/new y /products/:id/edit
// ============================================================
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/store/products'
import { PLATFORMS, CATEGORIES } from '@/constants'
import { validate, validators } from '@/utils/validators'
import { formatPrice } from '@/utils/formatters'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseLoader from '@/components/ui/BaseLoader.vue'

const route = useRoute()
const router = useRouter()
const store = useProductStore()

const isEdit = computed(() => Boolean(route.params.id))

const form = reactive({
  title: '',
  description: '',
  platform: 'aliexpress',
  category: 'Electrónica',
  price: '',
  originalPrice: '',
  commission: 10,
  rating: 4.5,
  stock: 0,
  affiliateUrl: '',
})

const errors = reactive({
  title: '',
  price: '',
  commission: '',
  rating: '',
  affiliateUrl: '',
})

const loadingProduct = ref(false)
const formError = ref('')
const saved = ref(false)

/** Valida el formulario antes de enviar */
function validateForm() {
  errors.title =
    validate([
      { fn: validators.required, value: form.title },
      { fn: validators.minLength, value: form.title, arg: 4 },
      { fn: validators.maxLength, value: form.title, arg: 80 },
    ]) || ''
  errors.price =
    validate([
      { fn: validators.required, value: form.price },
      { fn: validators.positive, value: form.price },
    ]) || ''
  errors.commission =
    validate([
      { fn: validators.required, value: form.commission },
      { fn: validators.between, value: form.commission, arg: [0, 100] },
    ]) || ''
  errors.rating =
    validate([
      { fn: validators.between, value: form.rating, arg: [0, 5] },
    ]) || ''
  errors.affiliateUrl =
    validate([{ fn: validators.url, value: form.affiliateUrl }]) || ''
  return !Object.values(errors).some(Boolean)
}

async function handleSubmit() {
  formError.value = ''
  saved.value = false
  if (!validateForm()) return

  const payload = {
    ...form,
    price: Number(form.price),
    originalPrice: form.originalPrice === '' ? null : Number(form.originalPrice),
    commission: Number(form.commission),
    rating: Number(form.rating),
    stock: Number(form.stock),
  }

  try {
    if (isEdit.value) {
      await store.updateProduct(route.params.id, payload)
    } else {
      await store.createProduct(payload)
    }
    saved.value = true
    setTimeout(() => router.push({ name: 'products' }), 900)
  } catch (error) {
    formError.value = error?.response?.data?.message || 'No se pudo guardar'
  }
}

onMounted(async () => {
  if (!isEdit.value) return
  loadingProduct.value = true
  try {
    const product = await store.fetchProduct(route.params.id)
    Object.assign(form, {
      title: product.title,
      description: product.description || '',
      platform: product.platform,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || '',
      commission: product.commission,
      rating: product.rating,
      stock: product.stock,
      affiliateUrl: product.affiliateUrl || '',
    })
  } catch (error) {
    formError.value = error?.response?.data?.message || 'No se pudo cargar el producto'
    router.replace({ name: 'products' })
  } finally {
    loadingProduct.value = false
  }
})
</script>

<template>
  <div class="pform">
    <header class="pform__head">
      <div>
        <h1 class="pform__title">{{ isEdit ? 'Editar producto' : 'Nuevo producto' }}</h1>
        <p class="pform__subtitle">
          {{ isEdit ? 'Actualiza los datos de tu producto afiliado.' : 'Añade un nuevo producto a tu catálogo.' }}
        </p>
      </div>
      <BaseButton variant="ghost" @click="router.push({ name: 'products' })">
        ← Volver
      </BaseButton>
    </header>

    <BaseLoader v-if="loadingProduct" full label="Cargando producto..." />

    <form v-else class="pform__card" novalidate @submit.prevent="handleSubmit">
      <div v-if="formError" class="pform__alert" role="alert">{{ formError }}</div>
      <div v-if="saved" class="pform__alert pform__alert--success" role="status">
        ✔ Producto guardado correctamente. Redirigiendo...
      </div>

      <!-- ===== Datos básicos ===== -->
      <section class="pform__section">
        <h2>Datos del producto</h2>

        <BaseInput
          v-model="form.title"
          label="Título del producto"
          name="title"
          placeholder="Ej. Auriculares Bluetooth Pro"
          :error="errors.title"
          :required="true"
        />

        <div class="pform__grid">
          <div class="pform__field">
            <label class="pform__label" for="platform">Plataforma <span class="pform__req">*</span></label>
            <select id="platform" v-model="form.platform" class="pform__select">
              <option v-for="p in PLATFORMS" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="pform__field">
            <label class="pform__label" for="category">Categoría <span class="pform__req">*</span></label>
            <select id="category" v-model="form.category" class="pform__select">
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <label class="pform__label" for="description">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          class="pform__textarea"
          rows="3"
          placeholder="Breve descripción del producto (opcional)"
        />
      </section>

      <!-- ===== Precio y comisión ===== -->
      <section class="pform__section">
        <h2>Precio y comisión</h2>

        <div class="pform__grid">
          <BaseInput
            v-model="form.price"
            label="Precio (USD)"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            :error="errors.price"
            :required="true"
          />

          <BaseInput
            v-model="form.originalPrice"
            label="Precio original (opcional)"
            name="originalPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />

          <BaseInput
            v-model="form.commission"
            label="Comisión (%)"
            name="commission"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="10"
            :error="errors.commission"
            :required="true"
          />

          <BaseInput
            v-model="form.rating"
            label="Valoración (0 - 5)"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="4.5"
            :error="errors.rating"
          />
        </div>

        <div v-if="form.price" class="pform__preview">
          Precio: <strong>{{ formatPrice(form.price) }}</strong>
          <span v-if="form.originalPrice"> · Antes: <s>{{ formatPrice(form.originalPrice) }}</s></span>
          <span v-if="form.commission > 0"> · Comisión: <strong>{{ form.commission }}%</strong></span>
        </div>
      </section>

      <!-- ===== Inventario y enlace ===== -->
      <section class="pform__section">
        <h2>Inventario y enlace</h2>

        <div class="pform__grid">
          <BaseInput
            v-model="form.stock"
            label="Stock disponible"
            name="stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
          />

          <BaseInput
            v-model="form.affiliateUrl"
            label="URL de afiliado"
            name="affiliateUrl"
            placeholder="https://..."
            :error="errors.affiliateUrl"
          />
        </div>
      </section>

      <!-- ===== Acciones ===== -->
      <div class="pform__actions">
        <BaseButton variant="ghost" @click="router.push({ name: 'products' })">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="store.saving" :disabled="store.saving">
          {{ isEdit ? 'Guardar cambios' : 'Crear producto' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.pform {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pform__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.pform__title {
  font-size: 1.8rem;
  color: var(--green-900);
}

.pform__subtitle {
  color: var(--muted);
  margin-top: 4px;
}

.pform__card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 860px;
}

.pform__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pform__section h2 {
  font-size: 1.1rem;
  color: var(--green-800);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.pform__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.pform__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pform__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--green-800);
}

.pform__req {
  color: var(--danger);
}

.pform__select,
.pform__textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--ink);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.pform__select:focus,
.pform__textarea:focus {
  outline: none;
  border-color: var(--green-500);
  box-shadow: 0 0 0 4px var(--green-100);
}

.pform__textarea {
  resize: vertical;
  min-height: 84px;
}

.pform__preview {
  padding: 14px 18px;
  border-radius: var(--radius);
  background: var(--green-50);
  color: var(--green-800);
  font-size: 0.95rem;
}
.pform__preview strong {
  color: var(--green-600);
}

.pform__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.pform__alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.88rem;
  font-weight: 500;
}

.pform__alert--success {
  background: var(--green-100);
  color: var(--green-700);
}

@media (max-width: 640px) {
  .pform__grid {
    grid-template-columns: 1fr;
  }
  .pform__card {
    padding: 20px;
  }
}
</style>
