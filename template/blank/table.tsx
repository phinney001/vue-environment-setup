import IntegrationTable, { IntegrationTableProps } from '@/components/IntegrationTable'
import { DynamicFormItem } from '@/components/DynamicForm'
import { ColumnProps } from 'ant-design-vue/lib/table/interface'
import { defineComponent, onMounted } from 'vue'

// @page HEADERTITLE
const COMPONENT = defineComponent(() => {

  // 表格项
  const columns: ColumnProps[] = [
    {
      title: 'title',
      dataIndex: 'dataIndex',
    },
  ]

  // 过滤表单项
  const filterItems: DynamicFormItem[] = [
    {
      type: 'text',
      label: 'label',
      name: 'name',
    },
  ]
  
  // 新增&编辑表单项
  const formItems: DynamicFormItem[] = [
    {
      type: 'text',
      label: 'label',
      name: 'name',
      required: true,
    },
  ]

  // 一体化表格props
  const tablePorps: IntegrationTableProps = {
    rowKey: 'index',
    scroll: { x: 1000 },
    columns,
    formItems,
    filterItems,
    listProps: {
      url: '/url',
    }
  }

  // 初始化加载数据
  onMounted(() => {

  })

  return () => (
    <IntegrationTable {...tablePorps} />
  )
})

export default COMPONENT
