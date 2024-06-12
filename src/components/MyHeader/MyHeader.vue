<template>
  <div class="header">
    <div class="header-container">
      <div class="name-box">
        <div class="name">bloniea 姉さま的图床</div>
      </div>

      <div class="btns">
        <!-- 切换分类 -->
        <div class="item">
          <el-select
            class="select"
            v-model="useUserStore().categoryId"
            @change="switchCategory"
            placeholder="Select"
          >
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
        <div class="item">
          <!-- <el-input
            class="search"
            v-model="keyword"
            placeholder="search"
            :suffix-icon="Search"
            @keyup.enter="toSearch"
            width="100"
          /> -->

          <Search class="search" @click="searchDialogForm = true" />
        </div>

        <div class="item pc" v-if="userStore.loginStatus">
          <div class="upload" @click="showUploadDialog">
            <el-icon> <UploadFilled /> </el-icon>上传
          </div>
        </div>
        <div class="item pc" v-if="userStore.loginStatus">
          <el-dropdown trigger="hover">
            <div class="avatar">
              <el-avatar :src="config.avatar" />
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showResetForm">更改密码</el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="item app" v-if="userStore.loginStatus">
          <el-dropdown trigger="click">
            <span class="user">
              <div class="avatar">
                <el-avatar :src="config.avatar" />
              </div>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showUploadDialog">上传</el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu>
                <el-dropdown-item @click="showResetForm">更改密码</el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="item" v-if="!userStore.loginStatus || !userStore.user">
          <div @click="login" class="login">Login</div>
        </div>

        <!-- ---- -->
        <!-- <div class="item menu app">
        <el-dropdown trigger="click">
          <el-icon>
            <Menu />
          </el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="uploadDialogVisible">
                <el-icon> <UploadFilled /> </el-icon>上传
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div> -->
      </div>
    </div>
    <!--login- diglog -->
    <MyLogin :loginDialog="loginDialog" @close="closeLogin"></MyLogin>
    <my-reset-pass :resetPass="resetpassDialog" @close="closeReset"></my-reset-pass>
    <!-- resetPssword dialog -->

    <!-- 搜索对话框 -->

    <el-dialog v-model="searchDialogForm" title="搜索">
      <el-form :model="searchForm" label-position="left">
        <el-form-item label="标题" label-width="80">
          <el-input v-model="searchForm.name" placeholder="名字" />
        </el-form-item>
        <el-form-item label="分类" label-width="80">
          <el-select v-model="searchForm.categoryId" placeholder="选择分类">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="searchDialogForm = false">取消</el-button>
          <el-button type="primary" @click="toSearch"> 搜索 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { UploadFilled, Search } from '@element-plus/icons-vue'
import { onMounted, reactive, ref, type Ref } from 'vue'
import { config } from '@/utils/config'
import { useUserStore } from '@/stores/counter'
import type { Category } from '@/utils/types'
import { getImagesCategories } from '@/utils/fetchApi'
import { clearStore, switchCategory } from '@/utils/functions'

const userStore = useUserStore()

const loginDialog: Ref<boolean> = ref(false)

const login = () => {
  loginDialog.value = true
}

const logout = () => {
  clearStore()
}

const showUploadDialog = () => {
  userStore.uploadDialog = true
}
const closeLogin = () => {
  loginDialog.value = false
}

const resetpassDialog: Ref<boolean> = ref(false)
const showResetForm = () => {
  resetpassDialog.value = true
}

const closeReset = () => {
  resetpassDialog.value = false
}

const categories: Ref<Category[]> = ref<Category[]>([])

onMounted(() => {
  getCategories()
})
// 获取分类
const getCategories = async () => {
  try {
    const res = await getImagesCategories()

    if (res.success === 1) {
      userStore.categories = res.data!.result
      categories.value = [...res.data!.result, ...[{ id: 0, name: 'all' }]]

      // 解析 URL，获取参数部分
      const paramsString = window.location.search
      // 将参数字符串解析为对象
      const searchParams = new URLSearchParams(paramsString)
      // 获取特定参数的值
      const category = searchParams.get('category')
      const paramsId = searchParams.get('id')
      const id = paramsId && parseInt(paramsId)
      if ((id && !isNaN(id)) || category) {
        const activeCategory =
          (id && res.data!.result.find((c: Category) => c.id === id)) ||
          (category && res.data!.result.find((c: Category) => c.name === category))

        userStore.categoryId =
          activeCategory && activeCategory.id ? activeCategory.id : config.defaultCategoryId
      } else {
        userStore.categoryId = config.defaultCategoryId
      }
    }
  } catch (error) {
    console.error(error)
    ElMessage.closeAll()
    ElMessage.error('网络超时')
  }
}

const searchDialogForm: Ref<boolean> = ref(false)
const searchForm = reactive({
  name: '',
  categoryId: 0
})
const emits = defineEmits(['searchName'])
// // 搜索
const toSearch = async () => {
  if (!searchForm.name) return
  // userStore.searchCategoryId = searchForm.categoryId
  // userStore.keyWord = searchForm.name
  emits('searchName', searchForm.categoryId, searchForm.name)
  searchDialogForm.value = false
  // downEnter.value = true
  // await navigateTo({
  //   path: '/',
  //   query: {
  //     keyword: keyword.value
  //   }
  // })
}
</script>

<style lang="stylus" scoped>

@import ('./MyHeader.styl');
</style>
