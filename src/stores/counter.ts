import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/utils/types'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
interface Categoey {
  id: number
  name: string
}
interface State {
  user: User | undefined
  token: string
  refresh_token: string
  loginStatus: boolean
  categories: Categoey[]
  categoryId: number | null
  keyWord: string | null
  searchCategoryId: number
  uploadDialog: boolean
  upload_token: string
}
export const useUserStore = defineStore('user', {
  state: (): State => {
    let userInfo: User | undefined
    let loginStatus: boolean
    const user = window.localStorage.getItem('userInfo')
    const refresh_token = window.localStorage.getItem('refresh_token')
    const token = window.localStorage.getItem('token')
    const upload_token = window.localStorage.getItem('upload_token')
    if (
      user &&
      user !== 'undefined' &&
      ((token && token !== 'undefined') || (refresh_token && refresh_token !== 'undefined')) &&
      upload_token &&
      upload_token !== 'undefined'
    ) {
      userInfo = JSON.parse(user)
      loginStatus = true
    } else {
      userInfo = undefined
      loginStatus = false
    }
    return reactive({
      user: userInfo as User | undefined,
      token: (token && token !== 'undefined' ? token : '') as string,
      refresh_token: (refresh_token && refresh_token !== 'undefined'
        ? refresh_token
        : '') as string,
      loginStatus: loginStatus as boolean,
      categories: [] as Categoey[],
      categoryId: 0 as number | null,
      keyWord: null as string | null,
      searchCategoryId: 0 as number,
      uploadDialog: false as boolean,
      upload_token: (upload_token && upload_token !== 'undefined' ? upload_token : '') as string
    })
  },
  actions: {
    stateUpdate<K extends keyof State>(name: K, val: State[K]) {
      this.$state[name] = val
    },
    clearLoginStatus() {
      this.stateUpdate('loginStatus', false)
      this.stateUpdate('token', 'false')
      this.stateUpdate('user', undefined)
      this.stateUpdate('upload_token', '')
    }
  }
})
