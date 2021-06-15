import { getToken, toLogin } from '@/access'
import { message, notification } from 'ant-design-vue'
import { getString, isFunction, objectMerge } from 'phinney-toolkit'
import moment from 'moment'

/**
 * 请求配置
 * @param data 请求体数据
 * @param params url拼接数据
 * @param formData FormData类型数据，和data只能存在一个
 * @param responseType 获取服务器数据类型 text: 文本字符串 | json: JSON对象 | blob: 二进制Blob对象 | formData: FormData表单对象 | arrayBuffer: 二进制ArrayBuffer对象
 * @param download 当服务器数据类型为blob时是否自动下载
 * @param contentType 请求数据类型 json: JSON数据格式 | form: 表单默认提交数据格式 | 其它
 * @param process 文件上传进度方法
 */
interface RequestOption extends RequestInit {
  data?: any
  params?: any
  formData?: any
  responseType?: 'text' | 'json' | 'blob' | 'formData' | 'arrayBuffer'
  download?: boolean
  contentType?: 'json' | 'form' | string
  process?: (progress: number) => void
  [key: string]: any
}

/**
 * 请求服务
 */
class Http {
  // 请求地址前缀
  baseUrl = '/api'
  // 错误信息列表
  messageList: string[] = []
  // 错误信息处理定时器
  messageTimer: any = null

  /**
 * 处理错误信息
 * @param msg 错误信息
 */
  dealMsg(msg: string) {
    this.messageList.push(msg)
    this.messageList = [...new Set(this.messageList)]
    if (this.messageTimer) {
      clearInterval(this.messageTimer)
    }
    this.messageTimer = setInterval(() => {
      while (this.messageList.length) {
        message.error(this.messageList[0])
        this.messageList.shift()
      }
    }, 100)
  }

  /**
   * 请求之前处理
   * @param url 请求路径
   * @param options 请求配置
   */
  requestBefore(url = '', options: RequestOption = {}): Request {
    // moment日期少一天解决
    moment.fn.toISOString = function () {
      return this.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    }
    // 请求路径处理
    const newUrl = Object.entries({
      ...options?.params
    }).reduce((t, [key, value]: any[], i) => {
      return t += `${i ? '&' : '?'}${key}=${getString(value)}`
    }, url.startsWith('http') ? url : (this.baseUrl + url))

    // 请求体数据处理
    if (options.data) {
      if (options.contentType === 'form') {
        options.body = Object.entries({
          ...options?.data
        }).reduce((t, [key, value]: any[], i) => {
          return t += `${i ? '&' : ''}${key}=${getString(value)}`
        }, '')
      } else {
        if (options.data instanceof FormData) {
          options.contentType = ''
          options.body = options.data
        } else {
          options.contentType = 'json'
          options.body = JSON.stringify(options.data)
        }
      }
    }

    // formData表单数据处理
    if (options.formData) {
      options.contentType = ''
      options.body = Object.entries({
        ...options?.formData
      }).reduce((t, [key, value]: any[]) => {
        t.append(key, value)
        return t
      }, new FormData())
    }

    // 公共请求头
    const contentTypeMap: Record<string, string> = {
      json: 'application/json;charset:utf-8;',
      form: 'application/x-www-form-urlencoded;charset:utf-8;',
    }
    options.headers = new Headers({
      ...options.headers,
      ...(options.contentType ? {
        'Content-Type': contentTypeMap[options.contentType] || options.contentType
      } : {}),
      Authorization: getToken()
    })

    return new Request(newUrl, options)
  }

  /**
   * 请求之后处理
   * @param response 请求响应数据
   */
  async requestAfter(response: Response, options: RequestOption) {
    // 接口响应成功
    if (response.ok) {
      try {
        // 响应数据类型
        const responseType = options?.responseType || 'json'
        const res: any = await response.clone()[responseType]()

        // 是否自动下载文件
        const autoDownload = responseType === 'blob' && options?.download
        if (autoDownload) {
          const disposition: any = response.headers.get('content-disposition') || ''
          res.filename = decodeURI(disposition.split('filename=').pop())
          this.download(res)
          return res
        }

        // 文件上传进度
        if (isFunction(options.process)) {
          const reader = response?.body?.getReader()
          const contentLength = Number(response?.headers?.get?.('Content-Length'))
          let receivedLength = 0
          reader?.read().then((result: any) => {
            if (result.done) {
              options?.process?.(100)
            }
            receivedLength += result.value.length
            options?.process?.(receivedLength / contentLength * 100)
          })
        }

        // 登录失效
        if (res?.httpStatus === 401) {
          toLogin()
        }

        // 其他报错
        if (res?.httpStatus && res?.httpStatus !== 200) {
          this.dealMsg(res.msg)
        }

        // 接口调用成功
        if (res?.httpStatus === 200) {
          return Reflect.has(res, 'data') ? res.data || true : res
        }
      } catch { }
    } else {
      // 接口响应失败
      const codeMessage: Record<string, string> = {
        200: '服务器成功返回请求的数据。',
        201: '新建或修改数据成功。',
        202: '一个请求已经进入后台排队（异步任务）。',
        204: '删除数据成功。',
        400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
        401: '用户没有权限（令牌、用户名、密码错误）。',
        403: '用户得到授权，但是访问是被禁止的。',
        404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
        406: '请求的格式不可得。',
        410: '请求的资源被永久删除，且不会再得到的。',
        422: '当创建一个对象时，发生一个验证错误。',
        500: '服务器发生错误，请检查服务器。',
        502: '网关错误。',
        503: '服务不可用，服务器暂时过载或维护。',
        504: '网关超时。',
      }
      if (response?.status) {
        const errortext = codeMessage[response.status.toString()] || response.statusText
        const { status, url } = response

        notification.error({
          message: `请求错误 ${status}: ${url}`,
          description: errortext,
        })
      } else {
        notification.error({
          description: '您的网络发生异常，无法连接服务器',
          message: '网络异常',
        })
      }
    }
    return false
  }

  /**
   * 基础请求
   * @param url 请求路径
   * @param options 请求配置
   */
  async base(url: string, options?: RequestOption) {
    const response = await fetch(this.requestBefore(url, options))
    const finalRes = await this.requestAfter(response, {
      url,
      ...options
    })
    return finalRes
  }

  /**
   * get请求
   * @param url 请求路径
   * @param params 请求参数
   * @param options 请求配置
   */
  get(url: string, params?: Record<string, any>, options?: RequestOption) {
    return this.base(url, objectMerge({
      params
    }, options))
  }

  /**
   * post请求
   * @param url 请求路径
   * @param data 请求参数
   * @param options 请求配置
   */
  post(url: string, data?: any, options?: RequestOption) {
    return this.base(url, objectMerge({
      method: 'POST',
      data,
    }, options))
  }

  /**
   * put请求
   * @param url 请求路径
   * @param data 请求参数
   * @param options 请求配置
   */
  put(url: string, data?: any, options?: RequestOption) {
    return this.base(url, objectMerge({
      method: 'PUT',
      data,
    }, options))
  }

  /**
   * delete请求
   * @param url 请求路径
   * @param data 请求参数
   * @param options 请求配置
   */
  delete(url: string, data?: any, options?: RequestOption) {
    return this.base(url, objectMerge({
      method: 'DELETE',
      data,
    }, options))
  }

  /**
   * 下载文件
   * @param blobData 文件数据
   * @param filename 文件名称
   */
  download(blobData: any, filename?: string) {
    const objectUrl = URL.createObjectURL(blobData)
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.setAttribute('style', 'display:none')
    a.setAttribute('href', objectUrl)
    a.setAttribute('download', filename || blobData.filename)
    a.click()
    document.body.removeChild(a)
    // 释放URL地址
    URL.revokeObjectURL(objectUrl)
  }

}


export default new Http()