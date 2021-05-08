import {
  Form,
  Input,
  Select,
  Button,
  InputNumber,
  DatePicker,
  TimePicker,
  Cascader,
  Row,
  Col,
  message,
  Switch,
  Radio,
  Checkbox,
} from 'ant-design-vue'
import FormDragger from './FormDragger'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
import { checkPhone } from './FormValidate'
import FormUpload from './FormUpload'
import FormLocation, { FormLocationRefs } from './FormLocation'
import { getArray, isNotEmptyArray } from 'phinney-toolkit'
import { modal } from '../CustomModal'
import { Rule } from 'ant-design-vue/lib/form/interface'
import { FormProps } from 'ant-design-vue/lib/form'
import { ColProps } from 'ant-design-vue/lib/grid/Col'
import { Component, defineComponent, reactive, ref, watch } from 'vue'

const { TextArea } = Input
/**
 * 动态表单表单项接口
 * @param type 表单类型
 * @param label 表单标签
 * @param labelHidden 是否隐藏表单标签
 * @param name 表单字段名
 * @param span 表单所占空间
 * @param required 是否必填
 * @param rules 验证规则
 * @param requiredType 必填验证类型
 * @param options 下拉框、多选框数据
 * @param countDown 验证码倒计时时间
 * @param formItemProps 表单项props
 * @param fieldProps 表单元素props
 * @param colProps 表单空间props
 * @param beforeRender 表单前面附加元素方法
 * @param afterRender 表单后面附件元素方法
 * @param render 表单渲染方法
 */
export interface DynamicFormItem {
  type: string
  label?: string
  labelHidden?: boolean
  name?: string
  span?: number
  required?: boolean
  rules?: Rule[]
  requiredType?: string
  countDown?: number
  options?: any[]
  formItemProps?: any
  fieldProps?: any
  colProps?: ColProps
  beforeRender?: () => any
  afterRender?: () => any
  render?: (form?: any, formValues?: any) => any
  [key: string]: any
}

/**
 * 动态表单props接口
 * @param formValues 表单form元素数值
 * @param rowProps 表单行元素props
 * @param formProps 表单form元素props
 * @param formItems 表单项元素列表
 */
export interface DynamicFormProps {
  formValues?: any
  rowProps?: any
  formProps?: FormProps
  formItems?: DynamicFormItem[]
  [key: string]: any
}

/**
 * 动态表单refs接口
 * @param form 表单实例
 * @param formState 表单数据
 * @param formRules 表单规则
 * @param locationRef 选点地图实例
 */
export interface DynamicFormRefs {
  form?: any
  formState?: any
  formRules?: any
  locationRef: FormLocationRefs
}

// 地图选点数据名称
export const locationName = 'LOCATION_VALUE'

const FormItem = Form.Item
const { RangePicker: DateRangePicker } = DatePicker
const { Password } = Input

/**
 * 输入类型表单
 * @param text 文本框
 * @param password 密码框
 * @param textarea 多行文本框
 * @param phone 手机文本框
 * @param captcha 验证码文本框
 * @param number 数值框
 */
const enterMap: Record<string, Component> = {
  text: Input,
  password: Password,
  textarea: TextArea,
  phone: Input,
  captcha: Input,
  number: InputNumber,
}

/**
 * 选择类型表单
 * @param date 日期选择框
 * @param dateRange 开始&结束日期选择框
 * @param time 时间选择框
 * @param select 下拉选择框
 * @param cascader 多级选择框
 * @param location 位置选择框
 * @param checkbox 多选框
 * @param radio 单选框
 * @param switch 开关
 * @param upload 上传文件框
 * @param dragger 拖拽上传框
 */
const selectMap: Record<string, Component> = {
  date: DatePicker,
  dateRange: DateRangePicker,
  time: TimePicker,
  select: Select,
  cascader: Cascader,
  location: Input,
  checkbox: Checkbox.Group,
  radio: Radio.Group,
  switch: Switch,
  upload: FormUpload,
  dragger: FormDragger,
}

/**
 * 其他类型表单
 * @param button 按钮
 * @param custom 自定义
 */
const otherMap: Record<string, Component> = {
  button: Button,
  custom: Input,
}

// 图片字符串数组转上传图片file对象
export const imgUrlToUploadFile = (imgs: string[]) => {
  const images = getArray(imgs).filter(Boolean)
  if (isNotEmptyArray(images)) {
    return images.map((img: string, index: number) => ({
      uid: index,
      name: img.split('/').pop(),
      status: 'done',
      url: img,
    }))
  }
  return []
}

const DynamicForm = defineComponent((props, { attrs }: { attrs: DynamicFormProps, [key: string]: any }) => {
  // 选点地图实例数据
  let locationRef: any = ref()
  // 验证码相关state
  const count: any = ref(60)
  const countDown: any = ref(60)
  const timing = ref(false)
  // 表单值
  const formState = reactive({
    ...attrs.formValues
  })
  // 表单规则
  const formRules = reactive(attrs?.formItems?.reduce(((t: any, c: any) => ({
    ...t,
    [c.name]: buildRules(c)
  })), {}))
  // 表单实例
  const form: any = ref()

  // 暴露给父组件数据
  attrs.onRef?.({
    form,
    formState,
    formRules,
    locationRef,
  })

  // 验证码倒计时
  watch(timing, () => {
    let interval: number = 0
    if (timing) {
      interval = window.setInterval(() => {
        const preSecond = count.value
        if (preSecond <= 1) {
          timing.value = false
          clearInterval(interval)
          // 重置秒数
          count.value = countDown
        }
        count.value = preSecond - 1
      }, 1000)
    }
    return () => {
      clearInterval(interval)
    }
  })

  // 根据表单类型获取提示前缀
  function getTipPrefixByType(type: string) {
    if (enterMap[type]) {
      return '请输入'
    }
    if (selectMap[type] && !type.endsWith('Range')) {
      return '请选择'
    }
    return ''
  }

  // 构建表单元素
  function buildField(item: DynamicFormItem) {
    const { label, type, fieldProps, render } = item
    const tipPrefix = getTipPrefixByType(type)
    const defaultProps = {
      ...(tipPrefix ? { placeholder: `${tipPrefix}${label}` } : {}),
    }
    const prop = Object.assign(defaultProps, fieldProps)
    const FormField: any = enterMap[type] || selectMap[type] || otherMap[type]
    const clickFunc = prop.onClick
    const changeFunc = prop.onChange
    const enterFunc = prop.onEnter

    // 重组click事件
    if (clickFunc) {
      prop.onClick = () => {
        clickFunc(form.value, item)
      }
    }
    // 重组变化事件
    if (changeFunc) {
      prop.onChange = (event: any) => {
        changeFunc(event, form.value, item, attrs.formItems)
      }
    }
    // 回车事件
    if (enterFunc && !prop.onPressEnter) {
      prop.onPressEnter = (event: any) => {
        if (event.keyCode === 13) {
          enterFunc(form.value, item, event)
        }
      }
      Reflect.deleteProperty(prop, 'onEnter')
    }

    if (type === 'button') {
      return <FormField {...prop}>{label}</FormField>
    }
    if (type === 'switch') {
      return (
        <>
          <Input type="hidden" />
          <FormField v-model={[formState[item.name || ''], 'checked']} {...prop} />
        </>
      )
    }
    if (['upload', 'dragger'].includes(type)) {
      return (
        <FormField v-model={[formState[item.name || ''], 'fileList']} {...prop} />
      )
    }
    if (type === 'custom') {
      return (
        <>
          <Input type="hidden" />
          {render?.(form.value, attrs.formValues)}
        </>
      )
    }

    return <FormField v-model={[formState[item.name || ''], 'value']} {...prop} />
  }

  // 构建表单验证规则
  function buildRules({ rules = [], required, type, label, requiredType }: DynamicFormItem) {
    if (type === 'phone') {
      rules = [
        ...rules,
        { pattern: checkPhone, message: `${label}格式不正确！` }
      ]
    }
    const typeMap: Record<string, string> = {
      number: 'number',
      date: 'date',
      dateRange: 'array',
      time: 'date',
      cascader: 'array',
      checkbox: 'array',
      switch: 'number',
      upload: 'array',
      dragger: 'array',
    }
    if (required) {
      return [{
        required: true,
        message: `${getTipPrefixByType(type)}${label}!`,
        trigger: 'change',
        type: requiredType || (typeMap[type] || 'string')
      }, ...rules]
    }
    return rules
  }

  // 处理表单项默认值
  function handleField(item: DynamicFormItem) {
    switch (item.type) {
      // 文本框
      case 'text':
      // 密码框
      case 'password':
      // 多行文本框
      case 'textarea':
        break
      // 手机文本框
      case 'phone':
        break
      // 验证码
      case 'captcha':
        item.formItemProps = {
          style: { width: 'calc(100% - 126px)' },
        }
        item.colProps = {
          style: { display: 'flex', justifyContent: 'space-between' },
        }
        if (item.countDown) {
          countDown.value = item.countDown
          count.value = item.countDown
        }
        item.afterRender = () => {
          return (
            <>
              <Button
                disabled={timing.value}
                style="width: 120px"
                size="large"
                onClick={async () => {
                  const bool = await item.getCaptcha?.()
                  if (bool) {
                    timing.value = true
                  }
                }}
              >
                {timing.value ? `${count.value} 秒` : '获取验证码'}
              </Button>
            </>
          )
        }
        break
      // 数值框
      case 'number':
      // 日期选择框
      case 'date':
      // 开始&结束日期选择框
      case 'dateRange':
      // 时间选择框
      case 'time':
      // 下拉选择框
      case 'select':
      // 多选框
      case 'checkbox':
      // 单选框
      case 'radio':
        item.fieldProps = {
          options: item?.options || [],
          ...item?.fieldProps,
        }
        break
      // 多级选择框
      case 'cascader':
        item.fieldProps = {
          options: item?.options || [],
          changeOnSelect: true,
          ...item?.fieldProps,
        }
        break
      // 位置选择框
      case 'location':
        item.fieldProps = {
          style: { width: 'calc(100% - 32px)' },
          ...item?.fieldProps,
        }
        item.afterRender = () => {
          return (
            <>
              <EnvironmentOutlined
                style={{ position: 'absolute', right: '12px', top: '5px', fontSize: '22px' }}
                onClick={() => {
                  const point = formState[locationName] || attrs.formValues
                  let mapProps = {
                    ...item?.mapProps,
                    ...(point ? { point } : {}),
                  }
                  if (item.searchText) {
                    const searchText = formState[item.searchText]
                    mapProps = {
                      ...mapProps,
                      ...(searchText && !point ? { searchText } : {}),
                    }
                  }
                  modal({
                    width: 1000,
                    title: '选择地址',
                    content: (
                      <FormLocation onRef={(refs: any) => (locationRef = refs)} {...mapProps} />
                    ),
                    onOk: () => {
                      if (!locationRef?.coord?.value) {
                        message.error('请先在地图上选择地址！')
                        return false
                      }
                      formState[item.name || ''] = locationRef?.address.value
                      formState[locationName] = locationRef?.coord.value
                      return true
                    },
                  })
                }}
              />
            </>
          )
        }
        break
      // 上传文件框
      case 'upload':
      // 拖拽上传框
      case 'dragger':
        item.fieldProps = {
          ...item?.fieldProps,
          fileChange: (fileList: any) => {
            formState[item?.name || ''] = getArray(fileList)
          },
        }
        break
      // 按钮
      case 'button':
        item.labelHidden = true
        item.fieldProps = {
          style: { width: '100%' },
          ...item?.fieldProps,
        }
        break
      // 开关
      case 'switch':
        item.fieldProps = {
          onChange: (e: any, forms: any) => {
            formState[item?.name || ''] = e ? 1 : 0
          },
          ...item?.fieldProps,
        }
        break
      // 自定义
      case 'custom':
        item.fieldProps = {
          type: 'hidden',
          ...item?.fieldProps,
        }
        break
      default:
        break
    }
  }

  // 渲染表单元素
  function renderFormItem() {
    return attrs.formItems?.map((item: DynamicFormItem, index: number) => {
      handleField(item)
      return (
        <Col
          span={item.span || 24}
          key={index}
          style={{ position: 'relative' }}
          {...item.colProps}
        >
          {item.beforeRender?.()}
          <FormItem
            label={item.labelHidden ? false : item.label}
            name={item.name}
            {...item.formItemProps}
          >
            {buildField(item)}
          </FormItem>
          {item.afterRender?.()}
        </Col>
      )
    })
  }

  return () => (
    <Form ref={form} model={formState} rules={formRules} {...attrs.formProps}>
      <Row gutter={24} style={{ margin: 0 }} {...attrs.rowProps}>{renderFormItem()}</Row>
    </Form>
  )
}
)

export default DynamicForm
