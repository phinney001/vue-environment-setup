import { getRedirectPath } from '@/access'
import { defineComponent } from 'vue'
import { Button, Result } from 'ant-design-vue'
import { useRouter } from 'vue-router'

export default defineComponent(() => {
  // 路由实例
  const router = useRouter()

  return () => (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在。"
      extra={
        <Button type="primary" onClick={() => router.push(getRedirectPath())}>
          返回首页
        </Button>
      }
    />
  )
})
