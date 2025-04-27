import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import {createPinia} from 'pinia'
import addFilters from './filter'
import addPlugins from './plugin'
import './assets/style.scss'

const app = createApp(App)
addPlugins(app)
addFilters(app)

app.use(createPinia()).use(router).mount('#app')
