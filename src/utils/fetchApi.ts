import qs from 'qs'
import { httpReq } from './fetch'
import type { FileData, ImagesData } from './types'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/counter'
import { clearStore, cryptoPassword, delStorage, getStorage, saveStorage } from './functions'
import { config } from './config'

const pinia = createPinia()
setActivePinia(pinia)
const userStore = useUserStore()

export const setHeaders = (token: string, id?: number) => {
  const headers = {
    authorization: 'Bearer ' + token,

    image_user_id: String(id)
  }
  httpReq.fetchOpts = {
    headers: {
      ...headers
    },
    timeout: config.timeout,
    retry: config.retry
  }
}

if (userStore.loginStatus && userStore.user) {
  setHeaders(userStore.token, userStore.user.image_user_id)
}

// api 返回值接口
interface FetchJson<T> {
  success: number
  status: number
  message: string
  refresh?: string
  data?: T
}

interface QueryData {
  pagesize: number
  pagenum: number
  keyword: string
}
interface ImageData {
  result: ImagesData[]
  total: number
}
/**
 * 获取图片数组数据
 * @param params 请求参数
 * @returns 返回响应
 */
export const getImagesApi = async (params: QueryData): Promise<FetchJson<ImageData>> => {
  const query = qs.stringify(params)
  const res = await httpReq.get(`/api/images?${query}`)
  const resJson: FetchJson<ImageData> = await res.json()
  return resJson
}

interface CategoryData {
  result: {
    id: number
    name: string
  }[]
}
/**
 * 获取分类
 * @returns 返回响应
 */
export const getImagesCategories = async (): Promise<FetchJson<CategoryData>> => {
  const res = await httpReq.get('/api/categories')
  const resJson: FetchJson<CategoryData> = await res.json()
  return resJson
}

interface userData {
  image_user_id: number
  username: string
  token: string
  refresh_token: string
}
/**
 *
 * @param data 请求登录数据
 * @param obt 其他参数
 * @returns 返回响应
 */
export const loginApi = async (
  data: { username: string; password: string },
  obt = {}
): Promise<FetchJson<userData>> => {
  console.log(data)
  const res = await httpReq.post('/api/login', data, obt)
  const resJson: FetchJson<userData> = await res.json()
  return resJson
}
interface PassData {
  oldPassword: string
  password: string
  repeatPassword: string
}
interface ResetData {
  repeat?: string | number
  old?: string | number
}
/**
 *
 * @param data 请求数据
 * @param obt 其他请求参数
 * @returns 返回响应
 */
export const editPasswordApi = async (data: PassData, obt = {}): Promise<FetchJson<ResetData>> => {
  const url = '/api/reset'
  const res = await httpReq.post(url, data, obt)
  saveStorage('saveReq', { type: 'post', url, data, obt })
  return refreshToken<ResetData>(res)
}
interface RefreshData {
  token: string
  refresh_token: string
  refresh: number
}
interface SaveReq {
  type: string
  url: string
  data: any
  obt: any
}
/**
 * 刷新token
 * @param res 同等为Response返回的响应数据
 * @returns 返回响应数据
 */
const refreshToken = async <T>(res: Response): Promise<FetchJson<T>> => {
  const resJson: FetchJson<T> = await res.json()
  if (resJson.status === 401 && resJson.data === 'Token invalid') {
    console.log('Token invalid')
    const refresh_token = getStorage('refresh_token')
    if (!refresh_token) {
      console.log('refresh_token 不存在')
    }
    const refreshRes = await httpReq.post(
      '/api/refresh',
      { refresh_token: 'Bearer ' + refresh_token },
      {}
    )
    const refreshResJson: FetchJson<RefreshData> = await refreshRes.json()
    if (refreshResJson.success === 1) {
      // window.localStorage.setItem('token', refreshResJson.data!.token)
      saveStorage('token', refreshResJson.data!.token)
      saveStorage('refresh_token', refreshResJson.data!.refresh_token)
      // window.localStorage.setItem('refresh_token', refreshResJson.data!.refresh_token)
      userStore.token = refreshResJson.data!.token
      // httpReq.fetchOpts.headers!.authorization = 'Bearer ' + refreshResJson.data!.token
      setHeaders(refreshResJson.data!.token, userStore.user?.image_user_id)
      const saveReq = <SaveReq | null>getStorage('saveReq')
      if (saveReq) {
        const newRes = await httpReq[saveReq.type](saveReq.url, saveReq.data, saveReq.obt)
        const newResJson: FetchJson<T> = await newRes.json()
        return newResJson
      }
    } else {
      userStore.loginStatus = false
      userStore.user = undefined
      userStore.token = ''
      clearStore()
    }

    console.log(refreshRes)
  }
  delStorage('saveReq')
  return resJson
}

interface UploadData {
  img_url?: string
}
/**
 * 将文件进行分段上传
 * @param data 请求的对象
 * @returns 返回uploadImage方法的响应
 */
export const uploadSubsectionApi = async (
  data: FileData
): Promise<FetchJson<UploadData> | null> => {
  if (!data.content) return null
  const binaryData = new Uint8Array(data.content as ArrayBuffer)
  const size = config.subsectionSize * 1024 * 1024
  const time = String(Date.now())
  // 生成哈希值作为文件唯一id
  data.hashId = (await cryptoPassword(binaryData)) + '_' + time
  const len = binaryData.byteLength
  // 有多少段
  data.length = Math.ceil(len / size)

  let lastResult: FetchJson<UploadData> | null = null
  let number: number = 0
  for (let i = 0; i < len; i += size) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ['temp']: temp, ...newData } = data
    newData.content = binaryData.slice(i, i + size).buffer
    newData.number = ++number
    const result = await uploadImage(newData)
    if (result.success !== 1) return result
    lastResult = result
  }
  return lastResult
}

/**
 * 将键值对对象转换为formData对象
 * @param data 键值对对象
 * @returns 返回formData对象
 */
const convertToFormData = (data: { [key: string]: any }): FormData => {
  const formData = new FormData()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ['content']: content, ...otherData } = data
  for (const key in otherData) {
    if (Object.prototype.hasOwnProperty.call(otherData, key)) {
      formData.append(key, otherData[key])
    }
  }
  const blob = new Blob([content])
  formData.append('content', blob)
  return formData
}
/**
 *
 * @param data 要请求的键值对对象
 * @param obt 请求属性
 * @returns 返回响应数据
 */
export const uploadImage = async (data: FileData, obt = {}): Promise<FetchJson<UploadData>> => {
  const newData = convertToFormData(data)
  const url = '/api/upload'
  const res = await httpReq.post(url, newData, {})
  const obj = { type: 'post', url, formData: newData, obt }
  saveStorage('saveReq', obj)
  return refreshToken<UploadData>(res)
}
interface delParamsData {
  owner: string
  repo: string
  thumbnailPath: string
  path: string
  thumbnailSha: string
  sha: string
}

export const delImageApi = async (id: number, params: delParamsData): Promise<FetchJson<null>> => {
  const query = qs.stringify(params)
  const res = await httpReq.delete(`/api/delete/${id}?${query}`)
  const resJson: FetchJson<null> = await res.json()
  return resJson
}