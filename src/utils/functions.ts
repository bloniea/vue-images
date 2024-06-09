import type { Category, FileData } from './types'
import { sha256 } from 'js-sha256'

export const generateRandomString = (length: number) => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const cryptoPassword = async (data: string | Uint8Array): Promise<string> => {
  // const dataArray = new TextEncoder().encode(data)
  // if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
  //   try {
  //     const hashBuffer = await crypto.subtle.digest('SHA-256', dataArray)
  //     const hashArray = Array.from(new Uint8Array(hashBuffer))
  //     const hashedData = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')

  //     return hashedData
  //   } catch (error) {
  //     console.error('加密出错:', error)
  //     throw error
  //   }
  // } else {
  //   throw new Error('浏览器环境不支持加密操作')
  // }
  return sha256(data)
}

export const clearStore = () => {
  delStorage('userInfo')
  delStorage('refresh_token')
  delStorage('token')
  delStorage('upload_token')
}

export const toNumber = (num: any) => {
  const t = parseInt(num)
  if (isNaN(t)) {
    return false
  }
  return t
}
// 获取文件名
export const getName = (name: string) => {
  const index = name.lastIndexOf('.')
  const nName = index > -1 ? name.substring(0, index) : name
  const time = new Date().getTime()
  const random = Math.floor(Math.random() * 1000)
  const fileName = nName + '_' + time + '_' + random
  return encodeURIComponent(fileName)
}

export const getCategoryName = (id: string | number | null, arrs: Category[]): string => {
  if (!id) return ''
  const obj = arrs.find((item: Category) => item.id === id)
  if (obj) return obj.name
  return ''
}
export const extractDataFromURL = (url: string) => {
  // 找到最后一个斜杠的索引
  const lastSlashIndex = url.lastIndexOf('/')
  // 找到问号的索引
  const questionMarkIndex = url.lastIndexOf('?')

  // 截取最后一个斜杠之后和问号之前的部分
  const data = url.substring(
    lastSlashIndex + 1,
    questionMarkIndex !== -1 ? questionMarkIndex : undefined
  )

  return data
}

export const getBase64Type = (base64Data: string) => {
  // 获取逗号的索引
  const commaIndex = base64Data.indexOf(',')

  // 截取逗号之前的部分（包括逗号）
  const header = base64Data.substring(0, commaIndex + 1)

  // 从 header 中提取编码类型
  const typeIndex = header.indexOf('/') // 找到第一个斜杠的位置
  const semicolonIndex = header.indexOf(';') // 找到分号的位置
  const imageType = header.substring(typeIndex + 1, semicolonIndex) // 提取斜杠和分号之间的部分

  return imageType
}

export const deletePropertyAndReturn = <T, K extends keyof T>(
  obj: T,
  prop: K
): T[K] | undefined => {
  if (Object.prototype.hasOwnProperty.call(obj, prop)) {
    const value = obj[prop] // 获取属性值
    delete obj[prop] // 删除属性
    return value // 返回被删除的属性值
  }
  return undefined // 如果属性不存在，返回undefined
}

export const saveStorage = (name: string, data: any) => {
  if (typeof data !== 'object') {
    if (data.formData) {
      data.formData = formDataToJson(data.formData)
    }
    window.localStorage.setItem(name, data)
  } else {
    window.localStorage.setItem(name, JSON.stringify(data))
  }
}
export const delStorage = (name: string) => {
  window.localStorage.removeItem(name)
}
export const getStorage = <T>(name: string): T | null => {
  const data = window.localStorage.getItem(name)

  if (data && data !== 'undefined') {
    try {
      const parsedData = JSON.parse(data) // 尝试解析对象字符串
      if (typeof parsedData === 'object' && parsedData !== null && 'formData' in parsedData) {
        parsedData.data = jsonToFormData(parsedData.formData)
        return parsedData
      } else {
        return parsedData
      }
    } catch (e) {
      return <T>data // 解析失败，返回原始字符串
    }
  } else {
    return null
  }
}
export const formDataToJson = (formData: FormData): string => {
  const object = {} as { [key: string]: any }
  formData.forEach((value, key) => {
    object[key] = value
  })
  return JSON.stringify(object)
}
export const jsonToFormData = (json: string) => {
  const formData = new FormData()
  const object = JSON.parse(json)
  for (const key in object) {
    formData.append(key, object[key])
  }
  return formData
}
export const setUploadCategoryName = (
  files: FileData[],
  id: number | null,
  categories: Category[]
): FileData[] => {
  return files.map((file: FileData) => {
    const obj = categories.find((category: Category) => category.id === id)
    if (obj) file.category_name = obj.name
    return file
  })
}
export const createThumbnail = async (base64Data: string) => {
  // 创建一个 Promise 以等待图片加载完成
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.src = base64Data
    image.onload = () => resolve(image)
    image.onerror = reject
  })

  // 创建 Canvas 并绘制图像
  const canvas = document.createElement('canvas')
  canvas.width = 400 // 缩略图宽度
  canvas.height = 400 // 缩略图高度
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2D context')
  }
  ctx.drawImage(img, 0, 0, 400, 400)

  // 将 Canvas 转换为 base64 编码的图片数据
  const thumbnail = canvas.toDataURL('image/jpeg')
  return thumbnail
}
