import PassportLayout from '@/layouts/PassportLayout'
import UserLayout from '@/layouts/UserLayout'
import PageNotPermission from '@/components/Exception/403'
import PageNotFound from '@/components/Exception/404'
import { access, getRedirectPath, isLogin, loginPath } from '@/access'
import { getArray, getString, isString } from 'phinney-toolkit'
import CustomModal from '@/components/CustomModal'
import routes, { RouteProps } from '@/routes'
import config from '@/layouts/config'
import WaterMark from '@/components/WaterMark'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { defineComponent } from '@vue/runtime-core'

/**
 * 处理路由列表
 * @param routeList 路由列表
 * @param level 路由层级
 */
function handleRoutes (routeList: RouteProps[], level = 0, breadcrumb?: any): RouteRecordRaw[] {
  return routeList.reduce((total: RouteRecordRaw[], current: RouteProps, index: number) => {
    const { path, layout, ...others } = current
    // 是否是最后一个路由
    const isLast = index === (getArray(routeList).length - 1)
    // 是否含有重定向
    const hasRedirect = isString(path) && !index && level > 0
    // 无公共布局
    const NoneLayout = defineComponent(() => () => (
      <router-view></router-view>
    ))
    // 公共布局
    const Layout = layout === 'passport' ? PassportLayout : (
      layout === 'none' ? NoneLayout : UserLayout
    )
    // 面包屑
    const newBreadcrumb = [...getArray(breadcrumb), {
      name: others?.name,
      path
    }]
    // 组件权限验证
    const Component = access(others) ? others.component : PageNotPermission

    // 返回新路由
    const newRoutes: any = [
      ...total,
      ...(hasRedirect ? [
        {
          path: `/${path?.split('/')?.[1]}`,
          redirect: path,
        }
      ] : []),
      {
        path: level ? path?.split('/').pop() : path,
        ...others,
        ...(level ? { component: Component } : {
          component: defineComponent(() => {
            return () => (
              <WaterMark content={config.waterMark} gapX={200} gapY={100}>
                <Layout {...(['passport', 'none'].includes(getString(layout)) ? {} :  { routes })}>
                  {Boolean(others.routes?.length) && <router-view></router-view>}
                  {Boolean(others.component) && <Component />}
                  <CustomModal />
                </Layout>
              </WaterMark>
            )
          })
        }),
        meta: {
          title: others?.name,
          access: others?.access,
          layout: layout || 'user',
          breadcrumb: newBreadcrumb,
          ...others.meta
        },
        ...(others?.routes ? { children: handleRoutes(others.routes, level + 1, newBreadcrumb) } : {})
      },
      ...((isLast && !level) ? [
        {
          path: '/404',
          component: defineComponent(() => () => {
            return (
              <WaterMark content={config.waterMark} gapX={200} gapY={100}>
                {
                  isLogin()
                    ? <UserLayout routes={routes}>
                      <PageNotFound />
                    </UserLayout>
                    : <PassportLayout>
                      <PageNotFound />
                    </PassportLayout>
                }
              </WaterMark>
            )
          }),
          meta: {
            title: '页面不存在',
            breadcrumb: [{ name: '页面不存在', path: '/404' }]
          },
          hideInMenu: true,
        },
        {
          path: '/',
          redirect: () => {
            return isLogin() ? getRedirectPath() : loginPath
          }
        }
      ] : [])
    ]

    return newRoutes
  }, [])
}

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes: handleRoutes(routes),
})


// 路由守卫
router.beforeEach(({ matched, name, meta, path }, from, next) => {
  // 设置标题
  document.title = `${config.title} - ${String(name)}`

  // 没有登录重定向登录页
  if (meta.layout === 'user' && !isLogin()) {
    next({ path: loginPath })
    return
  }
  // 无匹配重定向404
  if (!matched.length) {
    next({ path: '/404' })
    return
  }

  next()
})

export default router