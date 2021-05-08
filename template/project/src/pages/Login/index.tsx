import { message, Tabs } from 'ant-design-vue'
import DynamicForm, { DynamicFormItem } from '@/components/DynamicForm'
import { UserOutlined, LockTwoTone, MobileTwoTone, MailTwoTone } from '@ant-design/icons-vue'
import { treeToObject } from 'phinney-toolkit'
import { getRedirectPath, setMenus, setUserInfo } from '@/access'
import styles from './index.module.less'
import { login, queryMenus } from './service'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { defineComponent } from 'vue'

export default defineComponent(() => {
  // 登录方式选中项
  const tabActive = ref('1')
  // 登录loading
  const submitLoading = ref(false)
  // 路由实例
  const router = useRouter()


  // 登录提交
  const submit = async (form: any) => {
    if (form) {
      try {
        submitLoading.value = true

        const values: any = await form.validateFields()
        const res = await login(values)

        if (res?.access_token) {
          setUserInfo({
            username: values.username,
            ...res
          })

          // 获取菜单
          const menuRes = await queryMenus()
          setMenus(treeToObject(menuRes, {
            value: 'path',
            handleValue: () => true
          }))

          message.success('登录成功！')
          submitLoading.value = false

          // 跳转首页
          router.push(getRedirectPath())
        }
      } catch(e) {
        console.error(e)
      }

      submitLoading.value = false
    }
  }

  // 账号登录表单项
  const accoutFormItems: DynamicFormItem[] = [
    {
      type: 'text',
      name: 'username',
      label: '账号',
      labelHidden: true,
      required: true,
      fieldProps: {
        size: 'large',
        onEnter: submit,
        prefix: <UserOutlined class={styles.loginIcon} style={{ color: '#1890ff' }} />,
      }
    },
    {
      type: 'password',
      name: 'password',
      label: '密码',
      labelHidden: true,
      required: true,
      fieldProps: {
        size: 'large',
        onEnter: submit,
        prefix: <LockTwoTone class={styles.loginIcon} />,
      }
    },
    {
      type: 'button',
      name: 'submit1',
      label: '登录',
      fieldProps: {
        size: 'large',
        type: 'primary',
        onClick: submit,
        loading: submitLoading.value,
        style: { marginTop: 24, width: '100%' },
      }
    },
  ]
  // 手机号登录表单项
  const phoneFormItems: DynamicFormItem[] = [
    {
      type: 'phone',
      name: 'mobile',
      label: '手机号',
      labelHidden: true,
      required: true,
      fieldProps: {
        size: 'large',
        onEnter: submit,
        prefix: <MobileTwoTone class={styles.loginIcon} />,
      }
    },
    {
      type: 'captcha',
      name: 'captcha',
      label: '验证码',
      labelHidden: true,
      required: true,
      getCaptcha: async () => {
        message.success('获取验证码成功！')
        return true
      },
      fieldProps: {
        size: 'large',
        onEnter: submit,
        prefix: <MailTwoTone class={styles.loginIcon} />,
      }
    },
    {
      type: 'button',
      name: 'submit2',
      label: '登录',
      fieldProps: {
        size: 'large',
        type: 'primary',
        onClick: submit,
        loading: submitLoading.value,
        style: { marginTop: 24, width: '100%' },
      }
    },
  ]

  return () => (
    <div class={styles.loginContainer}>
      <Tabs
        destroyInactiveTabPane
        animated={false}
        activeKey={tabActive.value}
        onChange={(activeKey: string) => {
          tabActive.value = activeKey
        }}
      >
        <Tabs.TabPane tab="账户密码登录" key="1"></Tabs.TabPane>
        <Tabs.TabPane tab="手机号登录" key="2"></Tabs.TabPane>
      </Tabs>
      <DynamicForm v-show={tabActive.value === '1'} formItems={accoutFormItems} />
      <DynamicForm v-show={tabActive.value === '2'} formItems={phoneFormItems} />
    </div>
  )
})
