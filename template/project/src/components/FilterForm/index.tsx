import DynamicForm, { DynamicFormItem, DynamicFormProps } from '../DynamicForm'
import { COLLAPSED_EVENT_NAME, event } from '@/layouts/UserLayout'
import { getArray, getNumber, getString, isNotEmptyArray, objectMerge } from 'phinney-toolkit'
import { Button, Space } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'
import { ButtonProps } from 'ant-design-vue/lib/button/buttonTypes'
import { Component, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * @param formItemWith 表单元素宽度
 * @param formLabelWidth 表单标签宽度
 * @param resetProps 表单重置按钮props
 * @param submitProps 表单提交按钮props
 * @param handleButton 处理按钮元素
 * @param isInCard 是否在卡片中
 */
export interface FilterFormProps extends DynamicFormProps {
  formItemWidth?: number
  formLabelWidth?: number
  resetProps?: ButtonProps
  submitProps?: ButtonProps
  handleButton?: (btns: Component, filterForm: any) => Component
  isInCard?: boolean
}

const FilterForm = defineComponent((props, { attrs }: { attrs: FilterFormProps, [key: string]: any }) => {
  // 过滤表单主要区域元素
  const filterMain = ref()
  // 显示按钮
  const btnShow = ref(false)
  // 展开/收起
  const collapsed = ref(false)
  // 表单宽度
  const formWidth = ref(500)
  // 表单按钮排序
  const order = ref(0)
  // 过滤表单实例
  let filterForm = ref()

  const {
    formItemWith = 260,
    formLabelWidth,
    rowProps,
    formProps,
    formItems,
    resetProps,
    submitProps,
    handleButton,
    isInCard,
    onRef,
    ...otherProps
  } = attrs

  // 暴露给父组件数据
  onRef?.({
    // 获取表单数据
    getFieldsValue: async () => {
      const values = await filterForm?.value?.getFieldsValue?.()
      return values
    },
    // 清除表单数据
    resetFields: () => {
      filterForm?.value?.resetFields?.()
    }
  })

  /**
   * 获取字符串宽度
   * @param text 字符串
   * @param fontSize 字体大小
   */
  function getTextWidth(text: string, fontSize: number): number {
    const result = { width: 0, height: 0 }
    const span: HTMLSpanElement = document.createElement('span')
    span.innerHTML = text
    span.style.visibility = 'hidden'
    span.style.fontSize = fontSize + 'px'
    document.body.appendChild(span)
    result.width = span.offsetWidth
    result.height = span.offsetHeight
    span.parentNode?.removeChild(span)
    return getNumber(result.width)
  }

  // 表单label最大宽度
  const maxLabelWidth = formLabelWidth || Math.max(...getArray(formItems)?.map((item: DynamicFormItem) => {
    return getTextWidth(`${item.required ? '*' : ''}${getString(item?.label)}：`, 14)
  }))

  // 过滤表单宽度变化
  const handleResize = () => {
    setTimeout(() => {
      // 表单项宽度
      const itemWidth = getNumber(formItemWith) + maxLabelWidth + 24
      // 总宽度
      const totalWidth = getNumber(filterMain?.value?.offsetWidth)
      // 按钮排序
      const btnOrder = Math.floor(totalWidth / itemWidth) - 1

      btnShow.value = true
      if (btnOrder < 1) {
        collapsed.value = true
      }
      order.value = btnOrder
      formWidth.value = totalWidth
    }, 200)
  }

  // 按钮props
  const btnProps: any = {
    // 重置
    resetProps: {
      ...resetProps,
      onClick: async () => {
        filterForm?.value.resetFields?.()
        const values = await filterForm?.value.getFieldsValue?.()
        resetProps?.onClick?.({ values, filterForm } as any)
      }
    },
    // 查询
    submitProps: {
      ...submitProps,
      onClick: async () => {
        const values = await filterForm?.value.validateFields?.()
        submitProps?.onClick?.({ values, filterForm } as any)
      }
    },
  }

  // 获取表单项
  const getFormItems = () => {
    return [
      ...getArray(formItems).map((item: DynamicFormItem, index: number) => ({
        ...objectMerge({
          colProps: {
            style: {
              position: 'relative',
              flex: '0 0 auto',
              marginBottom: '24px',
              order: index + 1,
              width: `${100 / (order.value + 1)}%`
            },
          },
          formItemProps: {
            style: {
              margin: 0,
              width: (getNumber(formItemWith) + maxLabelWidth) + 'px',
            },
            labelCol: {
              flex: `0 0 ${maxLabelWidth}px`,
            }
          },
          fieldProps: {
            style: {
              width: getNumber(formItemWith) + 'px'
            },
          }
        }, item)
      })),
      // 按钮
      {
        type: 'custom',
        colProps: {
          style: {
            flex: '0 0 auto',
            marginLeft: 'auto',
            width: `${100 / (order.value + 1)}%`,
            order: collapsed.value ? formItems?.length : order.value
          },
        },
        formItemProps: {
          style: {
            margin: 0,
            width: (getNumber(formItemWith) + maxLabelWidth) + 'px',
          },
        },
        render: () => {
          const buttons = (
            <>
              <Button {...btnProps.resetProps}>重置</Button>
              <Button type="primary" {...btnProps.submitProps} loading={btnProps.submitProps?.loading?.value}>查询</Button>
            </>
          )
          return (
            (btnShow.value && isNotEmptyArray(formItems)) &&
            <Space style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              {handleButton ? handleButton?.(buttons, filterForm) : buttons}
              <a
                style={{ marginLeft: '6px', userSelect: 'none' }}
                onClick={() => {
                  collapsed.value = !collapsed.value
                }}>
                {
                  (order.value >= 1 && formItems?.length !== order.value && formItems?.length > order.value) &&
                  <>
                    {collapsed.value ? '收起' : '展开'}
                    <DownOutlined style={{
                      marginLeft: '7px',
                      transition: 'all 0.3s ease 0s',
                      transform: `rotate(${collapsed.value ? 0.5 : 0}turn)`
                    }} />
                  </>
                }
              </a>
            </Space>
          )
        }
      }
    ]
  }

  // 动态表单props
  const dynamicFormProps = {
    // 表单props
    formProps: objectMerge({ layout: 'inline' }, formProps),
    // 行
    rowProps: objectMerge({
      style: {
        width: '100%',
        margin: 0
      }
    }, rowProps),
    onRef: (refs: any) => {
      filterForm = refs?.form
    },
    ...otherProps,
  }

  // 窗口变化监听&销毁
  onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    event.on(COLLAPSED_EVENT_NAME, handleResize)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    event.off(COLLAPSED_EVENT_NAME, handleResize)
  })

  return () => (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        padding: isInCard ? 0 : '24px',
        paddingBottom: (!collapsed.value || !(getArray(formItems)?.length % (order.value + 1))) ? '24px' : 0,
        overflow: 'hidden'
      }}
    >
      <div ref={filterMain}>
        <div style={{
          width: collapsed.value ? '100%' : formWidth.value + 'px',
          height: collapsed.value ? 'auto' : '40px',
          overflow: btnShow.value ? 'initial': 'hidden'
        }}>
          <DynamicForm {...dynamicFormProps} formItems={getFormItems()} />
        </div>
      </div>
    </div>
  )
})

export default FilterForm
