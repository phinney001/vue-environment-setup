import { getRedirectPath } from '@/access'
import { defineComponent } from 'vue'
import { Button, Result } from 'ant-design-vue'
import { useRouter } from 'vue-router'

export default defineComponent(() => {
  // 路由实例
  const router = useRouter()

  return () => (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有访问权限。"
      extra={
        <Button type="primary" onClick={() => router.push(getRedirectPath())}>
          返回首页
        </Button>
      }
    />
  )
})
