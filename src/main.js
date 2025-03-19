import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './vuetify/vuetify'

const app = createApp(App)
app.use(createPinia()) // ← Должно быть
app.use(router)
app.use(vuetify)
app.mount('#app')
