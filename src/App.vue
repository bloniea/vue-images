<template>
  <el-container>
    <el-header>
      <MyHeader @searchName="searchName"></MyHeader>
    </el-header>
    <el-main>
      <my-loading v-if="loading"></my-loading>
      <div class="home" v-else>
        <div class="searchName" v-if="images.query.keyword">
          serch: <i>{{ images.query.keyword }}</i>
          <Close class="del" @click="cancelSearch" />
        </div>

        <div class="images" v-if="images.list.length">
          <div class="img" v-for="(item, i) in images.list" :key="item.image_id">
            <div class="del" v-if="userStore.loginStatus">
              <el-icon @click="delImage(item)"><CloseBold /></el-icon>
            </div>
            <el-image
              :src="config.url + item.thumbnailpath"
              @show="showViewer"
              :preview-src-list="previewList"
              :initial-index="images.initialIndex"
              @click="setIndex(i)"
              @switch="setIndex"
              :lazy="true"
              :z-index="9"
              fit="cover"
              loading="lazy"
            >
              <template #placeholder>
                <div class="image-slot">
                  <el-image :src="im" fit="cover"></el-image>
                </div> </template
            ></el-image>
            <div class="img-title">{{ item.name }}</div>
          </div>
        </div>
        <div class="empty" v-else>
          <el-empty :image-size="200" />
        </div>
        <MyPagination
          :total="images.total"
          :currentPage="images.query.pagenum"
          :page-size="images.query.pagesize"
          @currentChange="currentChange"
        ></MyPagination>
        <MyUpload @issetUpload="issetUpload"></MyUpload>
      </div>
    </el-main>
    <el-footer>
      <MyFooter></MyFooter>
    </el-footer>
  </el-container>
  <div id="bg"></div>
</template>

<script lang="ts" setup>
import { computed, h, nextTick, reactive, ref, render, watch, type Ref } from 'vue'
import type { ImagesData } from './utils/types'
import { useUserStore } from './stores/counter'
import { delImageApi, getImagesApi } from './utils/fetchApi'
import { config } from '@/utils/config'
import { CopyDocument, Delete, Close } from '@element-plus/icons-vue'
import { CloseBold } from '@element-plus/icons-vue'
import { deleteImage, switchCategory } from './utils/functions'
const userStore = useUserStore()
const loading: Ref<boolean> = ref(true)
const im = '/load.gif'

// import { ref } from 'vue'
// import MyFooter from '@/components/MyFooter/MyFooter.vue'
const images = reactive({
  // 图片数组
  list: [] as ImagesData[],
  // 预览图片初始索引值
  initialIndex: 0,
  total: 0,
  query: {
    pagesize: 24,
    pagenum: 1,
    keyword: '',
    category_id: 1
  }
})

const getImages = async () => {
  loading.value = true
  const id = userStore.categoryId as number
  if (!isNaN(id)) {
    try {
      const res = await getImagesApi(images.query)
      if (res.success === 1) {
        if (!res.data) return
        images.total = Number(res.data.total)
        loading.value = false
        images.list = res.data.result
      }
    } catch (error) {
      console.error(error)
      ElMessage.closeAll()
      ElMessage.error('网络超时')
    }
  }
}
const issetUpload = (id: number) => {
  images.query.category_id = id
  images.query.pagenum = 1
  userStore.categoryId = id
  switchCategory(id)
  getImages()
}
watch(
  () => userStore.categoryId,
  (n: number | null) => {
    if (n !== null) {
      images.query.pagenum = 1
      images.query.category_id = n
      images.query.keyword = ''
      getImages()
    }
  }
)
// 搜索
const searchName = (id: number, keyword: string) => {
  images.query.category_id = id
  images.query.pagenum = 1
  images.query.keyword = keyword
  getImages()
}
const cancelSearch = () => {
  images.query.keyword = ''
  getImages()
}
const delImage = async (item: ImagesData) => {
  ElMessageBox.confirm('确认删除图片吗?', '提示', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(async () => {
    try {
      ElMessage.closeAll()
      ElMessage.info({
        message: '正在删除...',
        duration: 0
      })
      const res = await delImageApi(item.image_id)

      if (res.success === 1 && res.status === 200) {
        if (Math.ceil((images.total - 1) / images.query.pagesize) < images.query.pagenum) {
          images.query.pagenum--
        }
        getImages()
        ElMessage.closeAll()
        ElMessage.success('删除成功')
        await deleteImage(item.thumbnailpath, item.thumbnailsha, 'del Thumbnail')
        await deleteImage(item.path, item.sha, 'del image')
      } else if (res.success === 0 && res.status === 404) {
        ElMessage.closeAll()
        ElMessage.error('数据已不存在')
      } else {
        ElMessage.closeAll()
        ElMessage.error('网络超时')
      }
    } catch (error) {
      ElMessage.closeAll()
      ElMessage.error('网络超时')
    }
  })
}
const showViewer = () => {
  nextTick(async () => {
    const element = document.querySelector('.el-image-viewer__actions__inner') as HTMLElement
    // 往预览图下面添加复制图标CopyDocument和删除图标delete

    const copyIcon = h('div', { class: 'addIcon' }, [
      h(
        'i',
        {
          class: 'el-icon',
          onClick: async () => {
            images.initialIndex
            await copyUrl(config.url + images.list[images.initialIndex].path)
          }
        },
        h(CopyDocument)
      ),
      userStore.loginStatus
        ? h(
            'i',
            {
              class: 'el-icon',
              onClick: async () => {
                await delImage(images.list[images.initialIndex])
              }
            },
            h(Delete)
          )
        : ''
    ])
    render(copyIcon, element)
  })
}
// 复制地址
const copyUrl = async (textToCopy: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy)
    return ElMessage.success('复制成功')
  } else if (document.execCommand('copy')) {
    const element = document.querySelector('body') as HTMLElement
    const textD = h(
      'textarea',
      {
        class: 'copy-textarea',
        style: {
          position: 'absolute',
          opacity: 0,
          left: '-999999px',
          top: '-999999px'
        }
      },
      textToCopy
    )
    render(textD, element)
    const textInput = document.querySelector('.copy-textarea') as HTMLTextAreaElement
    textInput.value = textToCopy
    textInput.focus()
    textInput.select()
    document.execCommand('copy')
    // element.removeChild(textInput)
    return ElMessage.success('复制成功')
  }
  return ElMessage.error('复制失败,手动复制吧')
}

const previewList = computed(() => {
  return images.list.map((item) => {
    return config.url + item.path
  })
})

// 设置预览图下标
const setIndex = (i: number) => {
  images.initialIndex = i
}
// 改变页数
const currentChange = (page: number) => {
  images.query.pagenum = page
  getImages()
}
</script>

<style lang="stylus" scoped>
@import './app.styl'

.el-container
  height 100%
  min-height 100vh

  .el-header
    // background $headerColor
    padding 0
    // width 100%
    // height 100%
    position relative

    @media (max-width 557px)
      height 40px

  .el-main
    position relative
    // max-width 1170px
    margin 0 auto
    // background red
    height 100%
    padding 0
    overflow-x hidden

    // * 当页面大于 1200px 时，大屏幕，主要是 PC 端 */
    @media (min-width 1200px)
      width 1170px

    /* 在 992 和 1199 像素之间的屏幕里，中等屏幕，分辨率低的 PC */
    @media (min-width 990px) and (max-width 1200px)
      width 970px

    /* 在 768 和 991 像素之间的屏幕里，小屏幕，主要是 PAD */
    @media (min-width 767px) and (max-width 990px)
      width 750px

    /* 在 480 和 767 像素之间的屏幕里，超小屏幕，主要是手机 */
    @media (min-width 557px) and (max-width 767px)
      width 555px

    /* 在小于 480 像素的屏幕，微小屏幕，更低分辨率的手机 */
    @media (max-width 557px)
      width 100%

  .el-footer
    margin 0 auto
    height 40px

    @media (min-width 1200px)
      width 1170px

/*
超小屏幕（手机，小于 768px）：设置宽度为 100%
 小屏幕（平板，大于等于 768px）：设置宽度为 750px
 中等屏幕（桌面显示器，大于等于 992px）：宽度设置为 970px
 大屏幕（大桌面显示器，大于等于 1200px）：宽度设置为 1170px
*/
</style>
