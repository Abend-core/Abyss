import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import router          from './router/index.js'
import App             from './App.vue'
import '@/assets/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('abyss_theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

app.mount('#app')

