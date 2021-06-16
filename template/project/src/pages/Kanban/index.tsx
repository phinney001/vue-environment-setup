import IntegrationTable, { IntegrationTableProps } from '@/components/IntegrationTable'
import { DynamicFormItem } from '@/components/DynamicForm'
import { ColumnProps } from 'ant-design-vue/lib/table/interface'
import { defineComponent, onMounted } from 'vue'

// @page 看板
const Kanban = defineComponent(() => {

  // 表格项
  const columns: ColumnProps[] = [
    {
      title: '用户名',
      dataIndex: 'user',
    },
  ]

  // 过滤表单项
  const filterItems: DynamicFormItem[] = [
    {
      type: 'text',
      label: '用户名',
      name: 'user',
    },
  ]

  // 新增&编辑表单项
  const formItems: DynamicFormItem[] = [
    {
      type: 'text',
      label: '用户名',
      name: 'user',
      required: true,
    },
  ]

  // 一体化表格props
  const tableProps: IntegrationTableProps = {
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
    <IntegrationTable {...tableProps} />
  )
})

export default Kanban
