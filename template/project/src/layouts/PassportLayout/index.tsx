import styles from './index.module.less'
import config from '../config'
import { getRedirectPath } from '@/access'
import { defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { Layout } from 'ant-design-vue'

const { Footer } = Layout

export default defineComponent((props, { slots }) => {
  return () => (
    <>
      <main class={styles.passportContainer}>
        <div class={styles.passportContent}>
          <div class={styles.passportTop}>
            {/* 标题 */}
            <RouterLink to={getRedirectPath()} class={styles.passportHeader}>
              <img class={styles.passportLogo} src={config.logo} alt="图标" />
              <h1 class={styles.passportTitle}>{config.title}</h1>
            </RouterLink>
            {/* 描述 */}
            <div class={styles.passportDesc}>{config.description}</div>
          </div>
          <div class={styles.passportMain}>
            {slots.default?.()}
          </div>
        </div>
        {/* 页脚 */}
        <Footer class={styles.passportFooter}>{config.copyright}</Footer>
      </main>
    </>
  )
})
