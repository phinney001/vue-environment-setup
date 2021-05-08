import { Layout, Menu, Breadcrumb, Dropdown, message, Avatar } from 'ant-design-vue'
import { LogoutOutlined, SettingOutlined } from '@ant-design/icons-vue'
import config from '../config'
import { access, getRedirectPath, getUserName, loginPath, toLogin } from '@/access'
import { RouteProps } from '@/routes'
import { isNotEmptyArray } from 'phinney-toolkit'
import styles from './index.module.less'
import DynamicForm, { DynamicFormItem } from '@/components/DynamicForm'
import { changePassword } from '@/pages/Login/service'
import { modal } from '@/components/CustomModal'
import { EventEmitter } from 'events'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { defineComponent, ref, watch } from 'vue'

export const event = new EventEmitter()
const { Header, Content, Footer, Sider } = Layout

// 侧边栏收起/展开事件名称
export const COLLAPSED_EVENT_NAME = 'COLLAPSED_TOGGLE'

export default defineComponent((props: any, { slots, attrs }) => {
  const { routes }: any = attrs || {}
  // 菜单收起
  const collapsed = ref(false)
  // 路由实例
  const router = useRouter()
  const route = useRoute()
  // 修改密码表单实例
  let passwordForm: any = ref()

  // 设置全局router
  if (!window.router) {
    window.router = router
  }

  // 退出登录
  const loginOut = () => {
    // 判断当前是否是登录页
    if (window.location.pathname !== loginPath) {
      message.success('退出成功！')
      toLogin()
    }
  }

  // 下拉项点击事件
  const onMenuClick = ({ key }: any = {}) => {
    if (key === 'logout') {
      loginOut()
      return
    }
    if (key === 'modify') {
      const formItems: DynamicFormItem[] = [
        {
          type: 'password',
          name: 'prePassword',
          label: '原密码',
          required: true,
        },
        {
          type: 'password',
          name: 'updatePassword',
          label: '新密码',
          required: true,
        },
      ]
      modal({
        title: '修改密码',
        content: defineComponent(() => () => (
          <div style={{ padding: '0 30px' }}>
            <DynamicForm onRef={(refs: any) => passwordForm = refs} formItems={formItems} />
          </div>
        )),
        onOk: async () => {
          if (passwordForm?.form?.value) {
            try {
              const values = await passwordForm.form.value.validateFields()
              const res = await changePassword(values)
              if (res) {
                message.success('修改成功！')
                return true
              }
            } catch { }
          }
          return false
        },
      })
    }
  }

  // 下拉菜单
  const AvatarMenu = (
    <Menu class={styles.pageDropdownMenu} onClick={onMenuClick}>
      <Menu.Item key="modify">
        <SettingOutlined />
        修改密码
      </Menu.Item>
      <Menu.Item key="logout">
        <LogoutOutlined />
        退出登录
      </Menu.Item>
    </Menu>
  )

  // 页面菜单
  const handleMenu = (params: RouteProps[]) => {
    return (
      params?.map((item) => {
        // 不需要展示的菜单
        if (item?.layout === 'passport' || item?.hideInMenu) {
          return null
        }
        return (
          access(item) ? (
            isNotEmptyArray(item?.routes)
              ? <Menu.SubMenu
                key={item?.path}
                title={(
                  <>
                    {item.icon || <></>}
                    <span>{item.name}</span>
                  </>
                )}
              >
                {handleMenu(item.routes)}
              </Menu.SubMenu>
              : <Menu.Item
                key={item?.path}
              >
                {item.icon || <></>}
                <span>{item.name}</span>
              </Menu.Item>
          ) : null
        )
      })
    )
  }

  // 面包屑
  const handleBreadcrumb = (params: any[]) => {
    return (
      <>
        <Breadcrumb.Item>
          <RouterLink to={getRedirectPath()}>首页</RouterLink>
        </Breadcrumb.Item>
        {
          params?.map?.((item: any) => (
            <Breadcrumb.Item key={item.path}>
              <RouterLink to={item.path}>{item.name}</RouterLink>
            </Breadcrumb.Item>
          ))
        }
      </>
    )
  }

  // 获取默认展开菜单key
  const getDefaultOpenKeys = () => {
    const urlList = route.path.split('/').filter(Boolean)

    return urlList.splice(0, urlList.length - 1).map(x => `/${x}`)
  }

  // 侧边栏展开收起监听
  watch(collapsed, () => {
    event.emit(COLLAPSED_EVENT_NAME, collapsed.value)
  })

  return () => (
    <Layout class={styles.pageLayout}>
      {/* 侧边栏 */}
      <Sider
        class={styles.pageSider}
        collapsible
        collapsed={collapsed.value}
        onCollapse={(c) => collapsed.value = c}
      >
        {/* 图标 */}
        <RouterLink to="/" class={styles.pageLogo}>
          <img src={config.logoShort} alt="图标" />
          {!collapsed.value && <h1>{config.titleShort}</h1>}
        </RouterLink>
        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={getDefaultOpenKeys()}
          selectedKeys={[route.path]}
          onClick={({ key }: any) => {
            router.replace(key)
          }}
        >
          {handleMenu(routes)}
        </Menu>
      </Sider>
      <Layout>
        {/* 页头 */}
        <Header class={styles.pageHeader}>
          <div class={styles.pageHeaderMain}>
            <div class={styles.pageHeaderLeft}></div>
            <div class={styles.pageHeaderRight}>
              {/* 用户信息 */}
              <Dropdown overlay={AvatarMenu}>
                <div class={styles.pageUserInfo}>
                  <Avatar
                    size='small'
                    class={styles.pageAvatar}
                    src={config.avatar}
                    alt="头像"
                  />
                  {/* 用户名 */}
                  <strong class={styles.pageUserName}>
                    {getUserName()}
                  </strong>
                </div>
              </Dropdown>
            </div>
          </div>
          {/* 面包屑 */}
          <Breadcrumb class={styles.pageBreadcrumb}>
            {handleBreadcrumb(route.meta.breadcrumb as any)}
          </Breadcrumb>
          {/* 页面标题 */}
          <h2 class={styles.pageTitle}>{route.meta.title}</h2>
        </Header>
        <Content class={styles.pageContent}>
          {slots.default?.()}
        </Content>
        {/* 页脚 */}
        <Footer class={styles.pageFooter}>{config.copyright}</Footer>
      </Layout>
    </Layout>
  )
})
