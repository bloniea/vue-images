export interface User {
  image_user_id: number
  username: string
}
export interface Category {
  id: number
  name: string
}

// 图片数据接口
export interface ImagesData {
  category_id: number
  created_at: string
  image_id: number
  name: string
  path: string
  sha: string
  size: string | number
  thumbnailpath: string
  thumbnailsha: string
}
export interface FileData {
  owner: string
  repo: string
  path: string
  thumbnailPath: string
  message: string
  content: string | ArrayBuffer | null
  category_name: string
  category_id: number | null
  name: string
  type: string | undefined
  temp?: {
    imgUrl: string
    loading: string | boolean
  }
  number?: number
  hashId?: string
  length?: number
  input?: boolean
  uploadedUrl?: string
}
