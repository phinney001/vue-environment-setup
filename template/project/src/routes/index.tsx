import { loginPath } from '@/access'
import { defineComponent } from 'vue'
import Login from '@/pages/Login'
import Kanban from '@/pages/Kanban'
import { DashboardOutlined, SettingOutlined } from '@ant-design/icons-vue'

/**
 * 路由接口
 * @param path 路由路径
 * @param icon 菜单图标
 * @param component 组件
 * @param layout 页面公共布局：未登录|登录后|不设置 默认登录后布局
 * @param routes 子路由列表
 * @param access 是否允许访问
 * @param hideInMenu 是否在菜单内隐藏
 */
 export interface RouteProps {
  path?: string
  icon?: any
  component?: any
  layout?: 'passport' | 'user' | 'none'
  routes?: RouteProps[]
  access?: string
  hideInMenu?: boolean
  [key: string]: any
}

// 路由列表
const routes: RouteProps[] = [
  {
    name: '登录',
    path: loginPath,
    layout: 'passport',
    component: Login,
  },
  {
    name: '看板',
    path: '/kanban',
    icon: <DashboardOutlined />,
    component: Kanban,
  },
  {
    name: '设置',
    path: '/setting',
    icon: <SettingOutlined />,
    routes: [
      {
        path: '/setting/user',
        name: '用户设置',
        component: defineComponent(() => () => {
          return (
            <span>2332</span>
          )
        }),
      }
    ]
  },
]



export default routes