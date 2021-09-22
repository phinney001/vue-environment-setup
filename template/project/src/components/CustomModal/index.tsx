import { Modal } from 'ant-design-vue'
import { EventEmitter } from 'events'
import { ModalFuncProps } from 'ant-design-vue/lib/modal'
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { isFunction } from 'phinney-toolkit'

const event = new EventEmitter()
// 新增弹窗事件名称
export const MODAL_EVENT_NAME = 'MODAL_CREATE'

/**
 * 弹窗配置
 * @param id 弹窗ID
 * @param origin 弹窗原始数据
 * @param content 弹窗内容
 */
export interface CustomModalProps extends ModalFuncProps {
  id?: string,
  origin?: string,
  content?: {
    state?: Record<string, any>
    onInit?: (vm: any) => void,
    render?: (vm: any, getModalRef: () => any) => any
  } | ((vm: any) => any) | any
  [key: string]: any
}

// 新增弹窗
export function modal(options: CustomModalProps) {
  event.emit(MODAL_EVENT_NAME, options)
  return options
}

// 自定义弹窗组件
const CustomModal = defineComponent(() => {
  // 弹窗列表
  const modalList = ref([])

  const setModalList = (value: any) => {
    modalList.value = isFunction(value) ? value(modalList.value) : value
  }

  // 更新props
  const updateProps = (id: string, props?: any) => {
    setModalList((modals: any = []) => {
      return modals.map((item: any) => {
        if (item.id === id) {
          if (props && Object.keys(props)?.length) {
            return getOptions({
              ...item.origin,
              ...props,
              id,
            })
          }
        }
        return item
      })
    })
  }

  // 关闭弹窗
  const closeModal = (options: any = {}) => {
    setModalList((modals: any = []) => {
      return modals.map((item: any) => {
        if (item.id === options.id) {
          return {
            ...item,
            visible: false,
          }
        }
        return item
      })
    })
    setTimeout(() => {
      setModalList((modals: any = []) => {
        return modals.filter((item: any) => {
          return item.id !== options.id
        })
      })
    }, 200)
  }

  // 获取初始化配置
  function getOptions(options: any) {
    options.origin = { ...options }
    if (!options) options = {}
    const { onOk, onCancel } = options
    if (!Reflect.has(options, 'id')) {
      options.id = `modal_${Date.now()}`
    }
    if (!Reflect.has(options, 'visible')) {
      options.visible = true
    }
    if (!Reflect.has(options, 'destroyOnClose')) {
      options.destroyOnClose = true
    }
    if (!Reflect.has(options, 'maskClosable')) {
      options.maskClosable = false
    }
    if (!Reflect.has(options, 'width')) {
      options.width = 500
    }
    // 全屏后挂载父级元素
    if (document.fullscreenElement) {
      options.getContainer= () => document.fullscreenElement
    }
    // 取消
    options.onCancel = async (e: any) => {
      const bool = await onCancel?.(e, (props: any) => {
        updateProps(options.id, props)
      })
      bool !== false && closeModal(options)
    }
    // 提交
    options.onOk = async (e: any) => {
      const bool = await onOk?.(e, (props: any) => {
        updateProps(options.id, props)
      })
      bool !== false && closeModal(options)
    }
    // 弹窗关闭事件
    options.close = () => {
      closeModal(options)
    }
    // 更新弹窗props
    options.update = (props: any) => {
      updateProps(options.id, props)
    }
    return options
  }

  // 打开弹窗
  const openModal = (options: any) => {
    setModalList((modals: any = []) => {
      return [...modals, getOptions(options)]
    })
  }

  onMounted(() => {
    event.on(MODAL_EVENT_NAME, openModal)
  })
  onUnmounted(() => {
    event.off(MODAL_EVENT_NAME, openModal)
  })

  return () => (
    modalList?.value?.map((m: any) => {
      const Content = m.content

      return (
        <Modal key={m.id} {...m}>
          <Content />
        </Modal>
      )
    })
  )
})

export default CustomModal
