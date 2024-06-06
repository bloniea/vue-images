import QS from 'qs'

import type { User } from '@/utils/types'

import { clearStore, deletePropertyAndReturn } from './functions'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/counter'

const pinia = createPinia()
setActivePinia(pinia)
const userStore = useUserStore()

// api 返回值接口
interface FetchJson {
  status: number
  statusCode: number
  message: string
  refresh?: string
  data?: any
}
/**
 *
 * @param url 请求地址
 * @param obt 请求参数
 * @returns 返回信息
 */
export const fetchApi = async (url: string, obt: any = {}): Promise<FetchJson | any> => {
  try {
    let headerData
    if (userStore.loginStatus && userStore.user) {
      headerData = {
        authorization: userStore.token,
        user_id: userStore.user.image_user_id
      }
    } else {
      headerData = {}
    }
    if ((!obt.method || obt.method == 'get') && obt.params) {
      url = url + '?' + QS.stringify(obt.params)
    }
    delete obt.params
    // 获取obt.headers ,并移除obt.headers
    const h = deletePropertyAndReturn(obt, 'headers')
    const res: Response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        ...headerData,
        ...h
      },
      ...obt
    })
    const dataJson: FetchJson = await res.json()
    dataJson.statusCode = res.status
    // 返回401
    if (res.status === 401) {
      // 已登录
      if (userStore.loginStatus) {
        const refreshVal = window.localStorage.getItem('refresh')
        // refreshVal 存在则请求刷新返回401,refresh_token失效,退出登录
        if (refreshVal) {
          clearStore()
          userStore.user = undefined
          userStore.loginStatus = false
          window.localStorage.removeItem('refresh')
          return ElMessage.error('登录失效')
        }

        let refresh_token = window.localStorage.getItem('refresh_token')
        // refresh_token 不存在退出登录
        if (!refresh_token) {
          userStore.token = ''
          userStore.loginStatus = false
          userStore.user = undefined
          clearStore()
          return ElMessage.error('登录失效')
        }
        window.localStorage.setItem('refresh', '1')
        refresh_token = refresh_token.replace('Bearer ', '')
        // 保存上一次请求
        window.sessionStorage.setItem('obt', JSON.stringify(obt))
        window.sessionStorage.setItem('url', url)

        const d = { refresh_token: refresh_token }
        await fetchApi('api/refresh?' + QS.stringify(d), { method: 'post' })
      }
    }

    // 返回200
    if (res.status === 200) {
      const refreshVal = window.localStorage.getItem('refresh')
      if (refreshVal) {
        const url = window.sessionStorage.getItem('url')
        const obt = window.sessionStorage.getItem('obt')
        window.localStorage.setItem('token', dataJson.data.token)
        window.localStorage.setItem('refresh_token', dataJson.data.refresh_token)
        window.localStorage.removeItem('refresh')
        userStore.token = dataJson.data.token
        if (url && obt) {
          await fetchApi(url, JSON.parse(obt))
        }
      }
    }

    return dataJson
  } catch (err) {
    console.error(err)
    throw ElMessage.error('网络超时')
  }
}

export const getImagesApi = async (id: number | string, obt: object) => {
  const data = await fetchApi('/api/images/' + id, {
    method: 'get',
    params: obt
  })
  return data
}

export const uploadImagesApi = async (id: number | string, obt: object): Promise<any> => {
  const data = await fetchApi('/api/images/' + id, {
    method: 'post',
    body: JSON.stringify(obt)
  })
  return data
  // fetchApi("/openapi/images", {
  //   method: "post",
  //   body: JSON.stringify(obt),
  // })
  // fetchApi("/openapi/images", {
  //   method: "post",
  //   body: JSON.stringify(obt),
  // })
  // fetchApi("/openapi/images", {
  //   method: "post",
  //   body: JSON.stringify(obt),
  // })
}

export const loginApi = async (obt: object) => {
  const data = await fetchApi('/api/login', {
    method: 'post',
    body: JSON.stringify(obt)
  })
  return data
}
export const editPasswordApi = async (obt: object, url = '') => {
  const data = await fetchApi('/api/reset', {
    method: 'put',
    body: JSON.stringify(obt)
  })
  return data
}
export const delImageApi = async (obt: object, id: number) => {
  const data = await fetchApi(`/api/del?image_id=${id}`, {
    method: 'delete',
    body: JSON.stringify(obt)
  })
  return data
}

export const getImagesCategoriesApi = async () => {
  const data = await fetchApi(`/api/categories`)
  return data
}
