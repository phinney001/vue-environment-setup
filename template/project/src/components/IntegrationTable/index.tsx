import DynamicForm, { DynamicFormItem, locationName } from '../DynamicForm'
import {
  PlusOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons-vue'
import {
  Button,
  message,
  Popconfirm,
  Divider,
  Table,
  Card,
  Space,
  Tooltip
} from 'ant-design-vue'
import request from '@/utils/request'
import {
  getArray,
  getNumber,
  getObject,
  getString,
  isEmptyArray,
  isFunction,
  isNotEmptyArray,
  isNotNullOrUndefined,
  isNumber,
  isString,
  objectMerge,
  sum
} from 'phinney-toolkit'
import { CustomModalProps, modal } from '../CustomModal'
import FilterForm, { FilterFormProps } from '../FilterForm'
import { Component, defineComponent, isVNode, ref, watch } from 'vue'
import { FormProps } from 'ant-design-vue/lib/form'
import { TableProps } from 'ant-design-vue/lib/table/interface'

/**
 * 弹窗配置
 * @param width 弹窗宽度
 * @param title 弹窗标题
 * @param formProps 弹窗表单props
 * @param formItems 弹窗表单配置列表
 * @param stateHandle 弹窗state处理方法
 * @param formItemsHandle 弹窗表单项处理方法
 * @param formValuesHandle 弹窗数据处理方法
 * @param openBefore 弹窗打开之前处理方法
 */
export interface ModalProps extends CustomModalProps {
  width?: number
  title?: string
  formProps?: FormProps
  formItems?: DynamicFormItem[]
  stateHandle?: (state: any) => Record<string, any>
  formItemsHandle?: (formItems: any, vm: any) => DynamicFormItem[]
  formValuesHandle?: (params: any) => any
  openBefore?: (params: any) => void
  [key: string]: any
}

/**
 * 请求配置
 * @param url 请求地址
 * @param method 请求方式
 * @param urlHandle 请求地址处理
 * @param paramsHandle 请求参数处理
 * @param responseHandle 请求结果处理
 * @param requestBefore 请求之前处理方法
 * @param requestAfter 请求之后处理方法
 * @param requestFunc 自定义request方法
 * @param requestType 请求参数类型
 * @param contentType 请求头类型
 * @param btnText 按钮显示文字
 * @param btnClick 按钮点击事件(仅支持自定义操作项)
 * @param loadingMsg 请求中提示文字
 * @param successMsg 请求成功提示文字
 * @param modalProps 弹窗props
 * @param popProps 删除提示窗props
 * @param aProps a标签props方法
 * @param effect 请求成功是否会影响数据数量
 */
export interface RequestConfig {
  url?: string
  method?: string
  urlHandle?: (params: any, record: any) => any
  paramsHandle?: (params: any, record: any) => any
  responseHandle?: (res: any) => any
  requestBefore?: (params: any, record: any) => void
  requestAfter?: (res: any) => void
  requestFunc?: (url?: string, options?: any) => any
  requestType?: 'params' | 'data'
  contentType?: 'json' | 'form'
  btnText?: string | ((record: any) => string)
  btnClick?: (record?: any, callback?: () => void) => void
  loadingMsg?: string
  successMsg?: string
  modalProps?: ModalProps
  popProps?: any
  aProps?: (record: any) => any
  effect?: boolean
  [key: string]: any
}

/**
 * 操作项配置
 * @param type 按钮类型
 * @param props 按钮请求配置
 */
export interface OperatingItem {
  type: 'pop' | 'modal' | 'custom' | string
  props?: RequestConfig
}

/**
 * 表格实例接口
 * @param reload 重新加载表格
 * @param setSelected 设置表格行选中项id
 * @param getSelected 获取表格行选中项id
 * @param getSelectedRows 获取表格行选中项
 * @param clearSelected 清空表格行选中项
 * @param reset 清除过滤表单
 */
export interface ActionRefProps {
  reload?: (page?: number, extraParams?: any) => void
  setSelected?: (keys: any) => void
  getSelected?: () => any[]
  getSelectedRows?: () => any[]
  clearSelected?: () => void
  reset?: () => void
}

/**
 * 一体化表格refs接口
 * @param filterForm 搜索表单实例
 * @param modalForm 弹窗表单实例
 * @param actionRef 表格实例
 */
export interface IntegrationTableRefs {
  filterForm?: any
  modalForm?: any
  actionRef?: ActionRefProps
}

/**
 * 一体化表格props接口
 * @param listProps 列表数据配置
 * @param addProps 添加数据配置
 * @param updateProps 更新数据配置
 * @param deleteProps 删除数据配置
 * @param headerTitle 标题&操作按钮
 * @param toolBarRender 表格工具栏
 * @param handleOperating 处理/新增操作项
 * @param formItems 新增/编辑弹窗表单配置列表
 * @param filterItems 过滤表单配置列表
 * @param filterProps 过滤表单props
 */
export interface IntegrationTableProps extends TableProps {
  listProps?: RequestConfig
  addProps?: RequestConfig
  updateProps?: RequestConfig
  deleteProps?: RequestConfig
  headerTitle?: string | ((addButton: Component, actionRef: ActionRefProps) => Component)
  toolBarRender?: false | ((setting: Component[], actionRef: ActionRefProps) => Component[])
  handleOperating?: (data: OperatingItem[]) => OperatingItem[]
  formItems?: DynamicFormItem[]
  filterItems?: DynamicFormItem[]
  filterProps?: FilterFormProps
  pagination?: any
  rowSelection?: any
  columns?: any
  [key: string]: any
}

const IntegrationTable = defineComponent((props, { attrs }: { attrs: IntegrationTableProps, [key: string]: any }) => {
  let {
    listProps,
    addProps,
    updateProps,
    deleteProps,
    handleOperating,
    formItems,
    filterItems,
    filterProps,
    onRef,
    ...otherProps
  } = attrs

  // 内容区域元素
  const containerRef: any = ref()

  // 表格数据
  const tableData = ref([])
  // 表格loading
  const tableLoading = ref(false)
  // 表格分页配置
  const tablePagination = ref({
    current: 1,
    pageSize: 10
  })
  // 表格行选中项key配置
  const selectedRowKeys: any = ref([])
  // 表格行选中项配置
  const selectedRows: any = ref([])
  // 表格是否全屏显示
  const fullscreen = ref(false)

  // 过滤表单实例
  const filterForm: any = ref()

  // 弹窗表单数据
  const formValues = ref()
  // 弹窗表单类型
  const formType = ref()
  // 弹窗动态表单实例
  let modalForm: any = ref()

  // 过滤表单配置
  filterProps = {
    onRef: (fForm: any) => {
      filterForm.value = fForm
    },
    isInCard: true,
    formItems: getArray(filterItems),
    resetProps: {
      onClick: ({ values }: any) => {
        getTableData({
          ...tablePagination.value,
          current: 1,
          ...values
        })
      }
    },
    submitProps: {
      loading: tableLoading,
      onClick: ({ values }: any) => {
        getTableData({
          ...tablePagination.value,
          current: 1,
          ...values
        })
      }
    },
    ...filterProps
  }

  // 表格实例
  const actionRef: ActionRefProps = {
    // 重新加载表格
    reload: (current?: number, extraParams?: any) => {
      getTableData({
        ...tablePagination.value,
        ...filterForm.value?.getFieldsValue?.(),
        ...(isNumber(current) ? { current } : {}),
        ...extraParams,
      })
    },
    // 获取表格行选中项
    getSelected: () => {
      return selectedRowKeys.value
    },
    // 设置表格行选中项id
    setSelected: (keys: any) => {
      selectedRowKeys.value = keys
    },
    // 获取表格行选中项
    getSelectedRows: () => {
      return selectedRows.value
    },
    // 清空表格行选中项
    clearSelected: () => {
      selectedRowKeys.value = []
    },
    // 清除过滤表单
    reset: () => {
      filterForm.value?.resetFields?.()
    }
  }

  // 获取table props
  function getTableProps() {
    return {
      ...otherProps,
      // 表格分页
      ...(otherProps?.pagination !== false ? {
        pagination: {
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total: number, range: number[]) => (
            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
          ),
          ...tablePagination.value,
          ...(otherProps?.pagination)
        }
      } : {}),
      // 表格行选中项
      ...(otherProps?.rowSelection ? {
        rowSelection: {
          selectedRowKeys: selectedRowKeys.value,
          preserveSelectedRowKeys: true,
          onChange: (keys: any, rows: any) => {
            selectedRowKeys.value = keys
            selectedRows.value = rows
          },
          ...otherProps?.rowSelection,
        }
      } : {}),
      // 表格数据
      dataSource: tableData.value,
      // 表格loading
      loading: tableLoading.value,
      // 分页、排序、筛选变化事件
      onChange: async (pagination: any, filters: any, sorter: any, extra: any) => {
        if (tableProps.pagination) {
          getTableData({
            ...pagination,
          })
        }
        otherProps.onChange?.(
          { ...pagination, actionRef },
          { ...filters, actionRef },
          { ...sorter, actionRef },
          { ...extra, actionRef },
        )
      }
    }
  }
  // 表格props
  const tableProps: any = getTableProps()

  const { rowKey } = tableProps

  // 表格项
  const columns = ref(getArray(tableProps?.columns))

  // 暴露给父组件数据
  onRef?.({
    filterForm,
    modalForm,
    actionRef
  })

  // 请求处理
  async function handleRequest(requestProps: RequestConfig = {}, data?: any, record?: any) {
    const { url, method, requestBefore, requestAfter, urlHandle, paramsHandle, responseHandle } = requestProps
    // 请求之前处理方法
    await requestBefore?.(data, record)
    // 请求参数处理
    const params = paramsHandle ? await paramsHandle?.(data, record) : data
    // 请求地址处理
    const requestUrl = urlHandle ? await urlHandle?.(data, record) : getString(url)
    if (!requestProps.requestType) requestProps.requestType = 'data'
    const requestFunc: any = requestProps?.requestFunc || ((url: any, options: any) => request.base(url, options))
    const res = await requestFunc(requestUrl, {
      method,
      [requestProps.requestType]: params,
      contentType: requestProps.contentType
    })
    // 请求之后处理方法
    await requestAfter?.(res)
    // 请求结果处理
    const result = responseHandle ? await responseHandle?.(res) : res
    return result
  }

  // 获取弹窗标题
  function getModalTitle(requestProps?: RequestConfig, prefixText: string = '') {
    if (requestProps?.modalProps?.title) return requestProps?.modalProps?.title
    return prefixText
  }

  // 打开表单弹窗
  async function openModal(requestProps?: RequestConfig) {
    const modalProps = requestProps?.modalProps
    // 弹窗打开之前调用
    await modalProps?.openBefore?.(formValues.value)
    const record = {
      ...((await modalProps?.formValuesHandle?.(formValues.value)) || formValues.value)
    }
    // 动态表单元素
    const modalFormItems = modalProps?.formItems
    let modalFormContent: any
    let formState: Record<string, any> = {}
    if (modalFormItems || modalProps?.formItemsHandle) {
      formState = {
        formItems: modalFormItems,
        formProps: modalProps?.formProps,
        formValues: record,
      }
      modalFormContent = (vm: any) => {
        const { formItems, formProps, formValues } = vm
        return (
          <DynamicForm
            onRef={(refs: any) => (modalForm.value = refs)}
            formItems={isFunction(modalProps?.formItemsHandle)
              ? modalProps?.formItemsHandle?.(formItems, vm)
              : formItems}
            formProps={formProps}
            formValues={formValues}
          />
        )
      }
    }

    // 状态
    let state: Record<string, any> = {
      record,
      actionRef,
      ...formState,
    }
    // 方法
    let funcs = {}
    // 渲染方法
    let render: any = modalFormContent
    if (isVNode(modalProps?.content)) {
      render = () => modalProps?.content
    } else if (isFunction(modalProps?.content)) {
      render = modalProps?.content
    } else {
      const { state: newState, render: newRender, ...methods } = getObject(modalProps?.content)
      state = objectMerge(state, newState)
      if (newRender) {
        render = newRender
      }
      funcs = {
        ...methods
      }
    }
    if (isFunction(modalProps?.stateHandle)) {
      state = {
        ...modalProps?.stateHandle(state)
      }
    }

    // 弹窗实例
    let modalRef: any
    // 打开弹窗
    modalRef = modal({
      bodyStyle: { padding: '32px 40px 48px' },
      ...modalProps,
      onOk: async () => {
        if (isFunction(modalProps?.onOk)) {
          const modalParams: any = {
            form: modalForm.value?.form,
            record,
            actionRef,
            modalRef
          }
          const okReturn = await modalProps?.onOk(modalParams)
          if (okReturn) {
            formType.value = null
            formValues.value = null
          }
          return okReturn
        }
        // 如果有表单发起请求
        if (modalForm.value?.form) {
          try {
            const formData = await modalForm.value.form?.validateFields?.()
            const hide = message.loading(requestProps?.loadingMsg || '正在操作')
            const res = await handleRequest(
              requestProps,
              {
                ...modalForm.value?.formState?.['extraParams'],
                ...formData,
                ...modalForm.value?.formState?.[locationName],
                ...(isString(rowKey) && record[rowKey]
                  ? { [rowKey]: record[rowKey] }
                  : {}),
              },
              record,
            )
            if (res) {
              hide()
              if (requestProps?.effect && tableData.value.length === 1) {
                actionRef.reload?.(1)
              } else {
                actionRef.reload?.()
              }
              message.success(requestProps?.successMsg || '操作成功！')
              formType.value = null
              formValues.value = null
              return true
            }
            hide()
          } catch (e) {
            console.error(e)
          }
          return false
        }
        return true
      },
      onCancel: () => {
        if (isFunction(modalProps?.onCancel)) {
          modalProps?.onCancel({
            form: modalForm.value?.form,
            record,
            actionRef,
            modalRef
          } as any)
        }
        formType.value = null
        formValues.value = null
      },
      content: defineComponent({
        data() {
          return {
            ...state
          }
        },
        setup() {
          return (vm: any) => {
            vm.onInit?.(vm)
            return render?.(vm, () => {
              return modalRef
            })
          }
        },
        methods: {
          ...funcs
        }
      })
    })
  }

  // 是否有新增操作
  if (addProps || tableProps?.headerTitle) {
    const headerTitle: any = tableProps.headerTitle
    const modalFormItems = addProps?.modalProps?.formItems || formItems
    addProps = {
      method: 'POST',
      btnText: '新增',
      loadingMsg: '正在新增',
      successMsg: '新增成功！',
      requestType: 'data',
      ...addProps,
      modalProps: {
        ...addProps?.modalProps,
        ...(modalFormItems ? { formItems: modalFormItems } : {}),
        title: getModalTitle(addProps, '新增'),
      },
    }
    const addButton = (
      <Button
        type="primary"
        onClick={() => {
          formType.value = 'add'
          formValues.value = {}
        }}
      >
        <PlusOutlined /> {addProps.btnText}
      </Button>
    )
    tableProps.headerTitle = isFunction(headerTitle)
      ? headerTitle?.(addButton, actionRef)
      : addButton
  }

  // 是否有更新操作
  if (updateProps) {
    const modalFormItems = updateProps?.modalProps?.formItems || formItems
    updateProps = {
      method: 'PUT',
      btnText: '编辑',
      loadingMsg: '正在更新',
      successMsg: '更新成功！',
      requestType: 'data',
      ...updateProps,
      modalProps: {
        ...updateProps?.modalProps,
        ...(modalFormItems ? { formItems: modalFormItems } : {}),
        title: getModalTitle(updateProps, '更新'),
      },
    }
  }

  // 是否有删除操作
  if (deleteProps) {
    deleteProps = {
      method: 'DELETE',
      btnText: '删除',
      loadingMsg: '正在删除',
      successMsg: '删除成功！',
      requestType: 'data',
      ...deleteProps,
      popProps: {
        title: '确定删除此条记录?',
        placement: 'topRight',
        ...deleteProps?.popProps,
      },
    }
  }

  // 是否有列表请求
  if (listProps) {
    listProps = {
      method: 'GET',
      requestType: 'params',
      ...listProps,
    }
    tableProps.request = async (params: any = {}) => {
      const { pageSize, current, total, ...other } = params

      const res = await handleRequest(listProps, {
        page: current,
        size: pageSize,
        ...other,
      })

      let data = res?.records || (res instanceof Array ? res : [])
      // 没有rowKey时自定义成序列号
      if (
        isNotEmptyArray(data) &&
        data.every((e: any) => isString(rowKey) && !e[rowKey])
      ) {
        data = data.map((item: any, index: number) => ({
          ...item,
          ...(isString(rowKey) ? { [rowKey]: index + 1 } : {}),
        }))
      }

      return {
        data,
        total: res?.total,
        current,
        pageSize
      }
    }
  }

  // 设置全屏
  function fullscreenChange() {
    if (document.fullscreenEnabled && containerRef?.value) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
        fullscreen.value = false
      } else {
        containerRef.value.requestFullscreen()
        fullscreen.value = true
      }
    }
  }

  // 工具栏
  tableProps.toolBarRender = [
    <Tooltip title="刷新" getPopupContainer={() => containerRef.value}>
      <ReloadOutlined onClick={() => actionRef.reload?.()} />
    </Tooltip>,
    <Tooltip title={fullscreen.value ? '退出全屏' : '全屏'} getPopupContainer={() => containerRef.value}>
      {fullscreen.value
        ? <FullscreenOutlined onClick={fullscreenChange} />
        : <FullscreenExitOutlined onClick={fullscreenChange} />}
    </Tooltip>,
  ]
  if (isFunction(otherProps.toolBarRender)) {
    tableProps.toolBarRender = otherProps.toolBarRender(tableProps.toolBarRender, actionRef)
  }
  if (otherProps.toolBarRender === false) {
    tableProps.toolBarRender = []
  }

  // 获取表格数据
  async function getTableData({ showSizeChanger, showQuickJumper, showTotal, ...params }: any = {}) {
    tableLoading.value = true
    
    // 过滤表单数据
    const filterValues = await filterForm.value?.getFieldsValue?.()
    // 去除空值
    params = Object.entries(getObject({
      ...params,
      ...filterValues
    }))
      .reduce((t, [key, value]) => {
        return {
          ...t,
          ...(isNotNullOrUndefined(value) ? { [key]: value } : {})
        }
      }, {})
    const res = await tableProps.request?.(params)
    const { data, ...pagination } = getObject(res)

    tableData.value = data
    tablePagination.value = pagination

    tableLoading.value = false
  }

  // 操作项列表
  let operatingItems: OperatingItem[] = [
    { type: 'modal', props: updateProps },
    { type: 'pop', props: deleteProps },
  ].filter((f: OperatingItem) => f.props)
  operatingItems = handleOperating?.(operatingItems) || operatingItems
  // 列表是否含有操作项
  const operating = [
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      fixed: 'right',
      width: sum(
        operatingItems,
        (data: any, index: number) => {
          const btnText = isFunction(data?.props?.btnText)
            ? data?.props?.btnText(false)
            : data?.props?.btnText
          return getNumber(btnText?.length) * 14 + (index ? 20 : 0)
        },
        20 * 2,
      ),
      customRender: ({record}: any) => {
        return (
          <>
            {operatingItems.map((item, index) => {
              let btnElement
              const btnText = isFunction(item?.props?.btnText)
                ? item?.props?.btnText(record)
                : item?.props?.btnText
              const hasPrevBtn = operatingItems.slice(0, index).some((x) => {
                return Boolean(
                  isFunction(x?.props?.btnText) ? x?.props?.btnText(record) : x?.props?.btnText,
                )
              })
              const onConfirm = item?.props?.popProps?.onConfirm
              const onCancel = item?.props?.popProps?.onCancel
              const cParams: any = {
                record,
                table: actionRef,
              }
              switch (item.type) {
                // 编辑
                case 'modal':
                  btnElement = (
                    <a
                      onClick={() => {
                        formType.value = item.type + index
                        formValues.value = record
                      }}
                      {...item?.props?.aProps?.(record)}
                    >
                      {btnText}
                    </a>
                  )
                  break
                // 删除
                case 'pop':
                  btnElement = (
                    <Popconfirm
                      title=""
                      {...item?.props?.popProps}
                      onConfirm={async () => {
                        if (isFunction(onConfirm)) {
                          onConfirm?.(cParams)
                          return
                        }
                        try {
                          const hide = message.loading(item?.props?.loadingMsg || '正在操作')
                          const res = await handleRequest(
                            item?.props,
                            {
                              ...(isString(rowKey) && record[rowKey]
                                ? { [rowKey]: record[rowKey] }
                                : {}),
                            },
                            record,
                          )
                          if (res) {
                            if ((item?.props?.effect || btnText?.includes('删除')) && tableData.value.length === 1) {
                              actionRef.reload?.(1)
                            } else {
                              actionRef.reload?.()
                            }
                            message.success(item?.props?.successMsg || '操作成功！')
                          }
                          hide()
                        } catch { }
                      }}
                      onCancel={() => onCancel?.(cParams)}
                    >
                      <a {...item?.props?.aProps?.(record)}>{btnText}</a>
                    </Popconfirm>
                  )
                  break
                // 自定义
                case 'custom':
                  btnElement = (
                    <a
                      onClick={() => item?.props?.btnClick?.(record)}
                      {...item?.props?.aProps?.(record)}
                    >
                      {btnText}
                    </a>
                  )
                  break
                default:
                  break
              }
              return (
                <span key={index}>
                  {hasPrevBtn && btnText && <Divider type="vertical" />}
                  {btnElement}
                </span>
              )
            })}
          </>
        )
      },
    },
  ]

  if (operatingItems.length) {
    const newColumns: any = columns.value instanceof Array ? columns.value : []
    columns.value = [...newColumns, ...operating]
  }

  // 初始化获取数据
  watch([filterForm], () => {
    if (!filterProps?.formItems || isEmptyArray(filterProps?.formItems) || filterForm.value) {
      getTableData({
        ...tablePagination.value,
      })
    }
  })


  // 弹窗数据变动及打开
  watch([formValues, formType], () => {
    if (formValues.value && formType.value) {
      const formTypeMap = {
        add: addProps,
        ...operatingItems.reduce((t: any, c: OperatingItem, cIndex) => {
          if (c.type === 'modal') {
            return {
              ...t,
              [c.type + cIndex]: c.props,
            }
          }
          return t
        }, {}),
      }
      openModal(formTypeMap[formType.value])
    }
  })

  return () => (
    <div ref={containerRef} style={{ background: '#fff' }}>
      <Card bordered={false}>
        {/* 过滤表单 */}
        {
          isNotEmptyArray(filterProps?.formItems) &&
          <div style={{ margin: '10px 0 20px' }}>
            <FilterForm {...filterProps} />
          </div>
        }
        {/* 操作栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          {/* 表格标题&操作按钮 */}
          <div>
            <Space>
              {
                isFunction(tableProps.headerTitle)
                  ? tableProps.headerTitle()
                  : tableProps.headerTitle
              }
            </Space>
          </div>
          {/* 工具栏 */}
          <div>
            <Space size={12} style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '6px'
            }}>
              {
                tableProps.toolBarRender?.map((item: any, index: number) => (
                  <div key={index} style={{
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '0 4px',
                    lineHeight: 'normal'
                  }}>{item}</div>
                ))
              }
            </Space>
          </div>
        </div>
        {/* 表格选中项统计条 */}
        {
          isNotEmptyArray(selectedRowKeys.value) &&
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '48px',
            padding: '0 9px 0 24px',
            border: '1px solid #91d5ff',
            background: '#e6f7ff',
            marginBottom: '16px',
            transition: 'all .5s'
          }}>
            <span>已选择 {selectedRowKeys.value.length} 项</span>
            <Button type="link" onClick={actionRef.clearSelected}>取消选择</Button>
          </div>
        }
        {/* 表格 */}
        <Table {...getTableProps()} columns={columns.value} />
      </Card>
    </div>
  )
})

export default IntegrationTable
