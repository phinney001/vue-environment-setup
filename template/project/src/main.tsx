import { createApp, defineComponent } from 'vue'
import router from './routes/RouteAuth'
import store from './store'
import antd, { ConfigProvider } from 'ant-design-vue'
import zhCN from 'ant-design-vue/lib/locale/zh_CN'
import 'moment/dist/locale/zh-cn'
import './main.less'

const app = createApp(defineComponent(() => () => (
  <ConfigProvider locale={zhCN}>
    <router-view></router-view>
  </ConfigProvider>
)))

app.use(store)
app.use(antd)
app.use(router)

app.mount('#app')
