import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import ReserveSage from './ReserveSage.vue'
import router from './router'

const app = createApp(ReserveSage)
app.use(ElementPlus)
app.use(router)
app.mount('#app') // 修改后的挂载点