import { Upload, Modal, Button } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import request from '@/utils/request'
import { getToken } from '@/access'
import { ref } from 'vue'
import { defineComponent, watch } from 'vue'
import { getArray, getNumber } from 'phinney-toolkit'

export interface FormUploadProps {
  limit?: number
  onChange?: (values: any[]) => void
  [key: string]: any
}

const FormUpload = defineComponent((props, { attrs }: { attrs: FormUploadProps, [key: string]: any }) => {
  const { limit = Infinity, fileChange, ...otherProps } = attrs

  const previewImage = ref('')
  const previewTitle = ref('')
  const previewVisible = ref(false)
  const files: any = ref(getArray(otherProps.fileList))

  const uploadProps: any = {
    name: 'file',
    listType: 'picture-card',
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
    ...otherProps,
  }

  // 改变原始change方法
  const originChange = uploadProps.onChange
  uploadProps.onChange = ({ file, fileList }: any) => {
    originChange?.()
    fileList = fileList.map((fe: any) => {
      if (fe.xhr && fe.xhr.status === 200) {
        const response = JSON.parse(fe.xhr.response)
        fe.url = response.data
      }
      return fe
    })
    if (['done', 'removed'].includes(file.status)) {
      files.value = fileList
      fileChange?.(fileList)
    }
  }

  const uploadButton =
    uploadProps?.listType === 'text' ? (
      <Button>
        <UploadOutlined /> {uploadProps?.btnText || '上传'}
      </Button>
    ) : (
      <div>
        <PlusOutlined />
        <div class="ant-upload-text">{uploadProps?.btnText || '上传'}</div>
      </div>
    )
  return () => (
    <div class="clearfix">
      <Upload {...uploadProps}>{files.value?.length >= getNumber(limit) ? null : uploadButton}</Upload>
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
    </div>
  )
})

export default FormUpload
