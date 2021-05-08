import { Input, Spin, message, Modal, Upload } from 'ant-design-vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import 'ant-design-vue/lib/upload/style/index.less'
import request from '@/utils/request'
import { getToken } from '@/access'
import { ref } from 'vue'
import { defineComponent, watch } from 'vue'
import { getArray } from 'phinney-toolkit'

const { Dragger } = Upload

export interface FormDraggerProps {
  only?: boolean
  icon?: any
  text?: string
  hint?: string
  onChange?: (fileList: any[]) => void
  [key: string]: any
}

const FormDragger = defineComponent((props, { attrs }: { attrs: FormDraggerProps, [key: string]: any }) => {
  const {
    only = true,
    icon,
    text = '将文件拖到此处，或点击上传',
    hint = '只能上传 jpg/png 文件',
    fileChange,
    ...otherProps
  } = attrs

  const uploading = ref(false)
  const previewImage = ref('')
  const previewTitle = ref('')
  const previewVisible = ref(false)
  const files: any = ref(getArray(otherProps.fileList))

  const draggerProps = {
    name: 'file',
    // listType: 'picture',
    showUploadList: !only,
    action: `${request.baseUrl}/image/upload`,
    headers: {
      Authorization: getToken(),
    },
    onPreview: async (file: any) => {
      if (!file.url && !file.preview) {
        const preview = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file.originFileObj)
          reader.onload = () => resolve(reader.result)
          reader.onerror = (error) => reject(error)
        })
        if (typeof preview === 'string') {
          file.preview = preview
        }
      }
      previewImage.value = file.url || file.preview
      previewVisible.value = true
      previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1)
    },
    beforeUpload: (file: any) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error('只能上传 jpg/png 文件！')
      }
      // const isLt5M = file.size / 1024 / 1024 < 5
      // if (!isLt5M) {
      //   message.error('图片大小不能超过 5MB!')
      // }
      return isJpgOrPng
    },
    ...otherProps,
  }

  // 改变原始change方法
  const originChange: any = draggerProps.onChange
  draggerProps.onChange = ({ file, fileList }: any) => {
    originChange?.()
    if (only && fileList.length > 1) {
      fileList = [fileList.pop()]
    }
    fileList = fileList.map((fe: any) => {
      if (fe.xhr && fe.xhr.status === 200) {
        const response = JSON.parse(fe.xhr.response)
        fe.url = response.data
      }
      return fe
    })
    if (file.status === 'uploading' && only) {
      uploading.value = true
    }
    if (['done', 'removed'].includes(file.status)) {
      files.value = fileList
      fileChange?.(fileList)
      if (only) {
        uploading.value = false
      }
    }
  }

  return () => (
    <>
      <Input type="hidden" />
      <Dragger {...draggerProps}>
        <Spin spinning={uploading.value} tip="上传中...">
          {only && files.value?.[0]?.url ? (
            <img src={files.value[0].url} style={{ width: '100%', objectFit: 'cover' }}></img>
          ) : (
              <>
                <p class="ant-upload-drag-icon">{icon ? icon : <InboxOutlined />}</p>
                <p class="ant-upload-text">{text}</p>
                <p class="ant-upload-hint">{hint}</p>
              </>
            )}
        </Spin>
      </Dragger>
      <Modal
        visible={previewVisible.value}
        title={previewTitle.value}
        footer={null}
        onCancel={() => {
          previewVisible.value = false
        }}
      >
        <img style={{ width: '100%' }} src={previewImage.value} />
      </Modal>
    </>
  )
})

export default FormDragger
