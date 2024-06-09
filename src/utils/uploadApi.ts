import httpFetch from './fetch'
import { useUserStore } from '@/stores/counter'
import pinia from '@/stores/piniaInstance'
import { computed, watch } from 'vue'
import { config } from './config'
import qs from 'qs'

const http = new httpFetch()
const userStore = useUserStore(pinia)
// 初始化请求属性
const token = computed(() => userStore.upload_token)
const headers: { [key: string]: string } = { accept: 'application/vnd.github+json' }
if (userStore.loginStatus && userStore.user) {
  headers.authorization = 'Bearer ' + token.value
}

watch(
  () => token.value,
  (n: string) => {
    if (n) {
      headers.authorization = 'Bearer ' + n
    } else {
      delete headers.authorization
    }
  }
)
http.fetchOpts = {
  headers: headers,
  timeout: config.timeout,
  retry: config.retry
}
interface UploadContent {
  content: string
  message: string
}
export interface UploadRes {
  content: {
    sha: string
    path: string
  }
  code: number
}
const apiUrl = `/upload/repos/${config.owner}/${config.repo}`
export const uploadImageFileApi = async (url: string, data: UploadContent): Promise<UploadRes> => {
  url = `${apiUrl}/contents/${url}`
  const res = await http.put(url, data)
  const resJson = await res.json()
  const returnData = <UploadRes>{ code: res.status, ...resJson }
  return returnData
}

interface DeleteContent {
  sha: string
  message: string
}

interface DeleteRes {
  content: null
}
export const delImageApi = async (url: string, data: DeleteContent): Promise<DeleteRes> => {
  url = `${apiUrl}/contents/${url}?${qs.stringify(data)}`
  const res = await http.delete(url)
  const resJson = await res.json()
  return <DeleteRes>{ code: res.status, ...resJson }
}
