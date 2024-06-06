import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入全局css
import '@/assets/stylus/main.styl'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
