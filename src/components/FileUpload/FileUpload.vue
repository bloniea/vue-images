<template>
  <div class="upload-form">
    <div class="uploader">
      <div class="tab-title">分类:</div>
      <el-select class="select" v-model="upload.uploadCategoryId" placeholder="Select">
        <el-option
          v-for="item in userStore.categories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <div class="uploader-content">
        <div class="uploader-box" v-for="(item, i) in upload.files" :key="i">
          <div class="uploader-img">
            <el-image :src="item.temp!.imgUrl" fit="cover"></el-image>
            <div class="model" v-if="item.temp!.loading">
              <el-icon class="uploading" v-if="item.temp!.loading == 'uploading'">
                <Loading />
              </el-icon>
              <el-icon class="err" v-else-if="item.temp!.loading == 'err'" @click="reUpload(item)">
                <Refresh />
              </el-icon>
              <el-icon v-else>
                <Check />
              </el-icon>
            </div>
          </div>
          <el-input v-model="item.name" type="text" :disabled="item.input"></el-input>
        </div>
        <div class="uploader-input" v-if="upload.files.length < config.maxLen">
          <el-icon class="uploader-icon"><Plus /></el-icon>
          <input
            type="file"
            class="uploader-input-file"
            ref="uploader"
            multiple
            @change="selectFile"
            draggable
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/counter'
import { reactive, ref, watch } from 'vue'
import { config } from '@/utils/config'
import { createThumbnail, getCategoryName, getName, setUploadCategoryName } from '@/utils/functions'
import type { FileData } from '@/utils/types'
import {
  CopyDocument,
  Delete,
  Plus,
  Loading,
  Refresh,
  Check,
  CloseBold
} from '@element-plus/icons-vue'
import type { MessageHandler } from 'element-plus'
import { delImageApi, uploadImageFileApi } from '@/utils/uploadApi'
import { uploadImageApi } from '@/utils/fetchApi'

const userStore = useUserStore()

const upload = reactive({
  uploadCategoryId: null as null | number,
  files: [] as FileData[],
  statusCode: false
})
const status = reactive({
  upload: 'uploading',
  err: 'err',
  success: true
})
// input file 上传html元素
const uploader = ref<HTMLInputElement | null>(null)

const selectFile = async (e: Event) => {
  const eTarget = e.target as HTMLInputElement
  const files = eTarget.files as FileList
  const maxLen: number = config.maxLen
  const maxsize: number = config.maxsize
  if (files && files.length) {
    const filesAsArray = Array.from(files)
    for (let i = 0, len = filesAsArray.length; i < len; i++) {
      if (!/image/.test(filesAsArray[i].type)) {
        ElMessage.closeAll()
        ElMessage.error('请不要选择非图片文件')

        continue
      }
      console.log(upload.files)
      if (upload.files.length >= config.maxLen) {
        ElMessage.closeAll()
        ElMessage.error('单次最多上传' + maxLen + '张')
        break
      }

      if (filesAsArray[i].size > maxsize * 1024 * 1024) {
        if (i === filesAsArray.length - 1) {
          ElMessage.closeAll()
          ElMessage.error(`最大支持${maxsize}mb`)
        }
        continue
      }
      await processFile(filesAsArray[i])
    }
    uploader.value && (uploader.value.value = '')
  }
}
const processFile = async (file: File): Promise<void> => {
  return new Promise<void>((resolve) => {
    const reader = new FileReader()
    // reader.readAsArrayBuffer(file)
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const obj = {
        path: config.path,

        thumbnailPath: config.thumbnailPath,
        content: reader.result,
        thumbnailContent: '',
        category_name: getCategoryName(upload.uploadCategoryId, userStore.categories),
        category_id: upload.uploadCategoryId,
        name: file.name,
        type: file.name.split('.').pop(),
        temp: {
          imgUrl: URL.createObjectURL(file),
          loading: false
        },
        input: false
      }
      upload.files.push(obj)
      resolve()
    }
  })
}
const emit = defineEmits(['updateValue', 'successUpload'])
const startUpload = async (): Promise<MessageHandler | undefined | void> => {
  upload.files = setUploadCategoryName(upload.files, upload.uploadCategoryId, userStore.categories)
  const files: FileData[] = upload.files
  try {
    if (!upload.files.length) {
      ElMessage.closeAll()
      return ElMessage.error('请选择图片')
    }
    if (!upload.uploadCategoryId) {
      ElMessage.closeAll()
      return ElMessage.error('请选择分类')
    }

    for (const item of files) {
      if (item.temp && item.temp.loading === status.success) continue
      await uploadFile(item)
    }
    if (upload.statusCode) {
      ElMessage.closeAll()
      emit('successUpload', files, true, upload.uploadCategoryId)
      return ElMessage.success('上传完成')
    }
  } finally {
    emit('updateValue', false)
  }
}
const uploadFile = async (item: FileData): Promise<void> => {
  item.category_id = upload.uploadCategoryId
  item.temp!.loading = status.upload
  item.name = getName(item.name)

  try {
    if (!item.content || typeof item.content !== 'string') {
      console.error('FileReader result is not a string')
      throw ElMessage.error('未知错误,请重试')
    }
    const thumbnailImage = await createThumbnail(item.content)
    const thumbnailData = {
      content: thumbnailImage.split(',')[1],
      message: 'upload'
    }
    // 缩略图上传
    const thumbnailUrl = `${config.thumbnailPath}/${item.category_name}/${item.name}.jpeg`
    const thumbnaiRes = await uploadImageFileApi(thumbnailUrl, thumbnailData)
    if (thumbnaiRes.code !== 201) {
      throw ElMessage.error('上传超时')
    }
    // 上传原图
    const url = `${config.path}/${item.category_name}/${item.name}.${item.type}`
    const data = {
      content: (item.content as string).split(',')[1],
      message: 'upload'
    }
    const res = await uploadImageFileApi(url, data)
    const delThumbnailData = {
      message: 'del Thumbnail',
      sha: thumbnaiRes.content.sha
    }
    if (res.code !== 201) {
      delImageApi(thumbnailUrl, delThumbnailData)
      throw ElMessage.error('上传超时')
    }
    const uploadReq = {
      name: item.name,
      path: url,
      sha: res.content.sha,
      thumbnailPath: thumbnailUrl,
      thumbnailSha: thumbnaiRes.content.sha,
      category_id: upload.uploadCategoryId as number
    }
    const uploadRes = await uploadImageApi(uploadReq)
    if (uploadRes.success === 1) {
      upload.statusCode = true
    } else {
      const delSourceData = {
        message: 'del image',
        sha: res.content.sha
      }
      upload.statusCode = false
      await delImageApi(thumbnailUrl, delThumbnailData)
      await delImageApi(url, delSourceData)
    }
  } catch (error) {
    console.error(error)
    upload.statusCode = false
    ElMessage.error('未知错误,请重试')
  }

  // console.log(res)
  // const res = await uploadSubsectionApi(item)
  // if (res && res.success === 1) {
  //   item.temp!.loading = status.success
  //   item.uploadedUrl = res.data && res.data.img_url
  //   item.input = true
  //   upload.statusCode = true
  // } else {
  //   item.temp!.loading = status.err
  //   item.input = false
  //   upload.statusCode = false
  // }
}
const clearFiles = () => {
  uploader.value && (uploader.value.value = '')
  upload.files = []
}
const reUpload = async (file: FileData) => {
  try {
    emit('updateValue', true)
    await uploadFile(file)
    const files = upload.files
    for (const item of files) {
      if (item.temp && item.temp.loading !== status.success) {
        upload.statusCode = false
      }
    }
    if (upload.statusCode) {
      ElMessage.closeAll()
      emit('successUpload', files, true, upload.uploadCategoryId)
      return ElMessage.success('上传完成')
    }
  } finally {
    emit('updateValue', false)
  }
}
defineExpose({
  startUpload,
  clearFiles
})
// 监听模态框关闭
watch(
  () => userStore.uploadDialog,
  (val: boolean) => {
    if (!val) {
      upload.files = []
      uploader.value && (uploader.value.value = '')
    }
  }
)
</script>

<style lang="stylus" scoped>
@import './FileUpload.styl'
</style>
