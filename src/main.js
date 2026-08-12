import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { reveal } from './utils/directives'
import './assets/styles/main.css'

// Punto de entrada de la aplicación
const app = createApp(App)

// 1. Pinia: estado global
app.use(createPinia())

// 2. Vue Router: navegación
app.use(router)

// 3. Directiva personalizada "v-reveal" (animación al hacer scroll)
app.directive('reveal', reveal)

app.mount('#app')
