<template>
  <div>
    <el-dialog
      v-model="userStore.uploadDialog"
      title="图片上传"
      class="upload-dialog"
      :close-on-click-modal="false"
      @close="closeUpload"
    >
      <el-tabs
        type="border-card"
        v-if="!upload.uploadSuccess"
        v-model="upload.uploadMode"
        class="tabs"
      >
        <el-tab-pane label="图片上传" name="file-upload">
          <FileUpload
            ref="fileUploadRef"
            @updateValue="updateValue"
            @successUpload="successUpload"
          ></FileUpload>
        </el-tab-pane>
        <el-tab-pane label="剪贴板方式上传" name="clipboard-upload">
          <ClipboardUpload ref="clipboardUploadRef" @updateValue="updateValue"></ClipboardUpload>
        </el-tab-pane>
      </el-tabs>

      <div class="upload-success" v-else>
        <!-- <div class="upload-success-img" v-for="i in 3" :key="i">
          <div class="success-img">
            <el-image
              fit="cover"
              src="https://images.bloniea.com/images/web/20220808001937_1717646741672_570.jpg"
            ></el-image>
          </div>
          <div class="url-input">
            <el-input value="123456789" readonly></el-input>
            <el-button @click="copyUrl('1111111111')">复制</el-button>
          </div>
        </div> -->

        <div class="upload-success-img" v-for="item in upload.files" :key="item.name">
          <div class="success-img">
            <el-image fit="cover" :src="item.temp!.imgUrl"></el-image>
          </div>
          <div class="url-input">
            <el-input :value="config.url + item.uploadedUrl" readonly></el-input>
            <el-button @click="copyUrl(config.url + '/' + item.uploadedUrl)">复制</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeUpload">关闭</el-button>
          <el-button @click="resetFiles">重置</el-button>
          <el-button type="primary" @click="resetFiles" v-if="upload.uploadSuccess">
            继续上传
          </el-button>

          <el-button type="primary" :loading="upload.btnloading" @click="startUpload" v-else>
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/counter'
import { h, reactive, ref, render } from 'vue'
import FileUpload from '@/components/FileUpload/FileUpload.vue'
import ClipboardUpload from '@/components/ClipboardUpload/ClipboardUpload.vue'
import type { FileData } from '@/utils/types'
import { config } from '@/utils/config'
const userStore = useUserStore()

const upload = reactive({
  uploadSuccess: false,
  uploadMode: 'file-upload',
  uploadCategoryId: null as null | number,
  files: [] as FileData[],
  btnloading: false,
  issetUpload: false
})

// 改变上传按钮状态
const updateValue = (btn: boolean) => {
  upload.btnloading = btn
}

const fileUploadRef = ref<InstanceType<typeof FileUpload> | null>(null)
const clipboardUploadRef = ref<InstanceType<typeof ClipboardUpload> | null>(null)
const startUpload = () => {
  // upload.btnloading = true
  const type = upload.uploadMode
  if (type === 'file-upload') {
    fileUploadRef.value && fileUploadRef.value.startUpload()
  } else if (type === 'clipboard-upload') {
    clipboardUploadRef.value && clipboardUploadRef.value.startUpload()
  }
}
// 上传完成回调
const successUpload = (files: FileData[], status: boolean, id: number) => {
  upload.files = files
  upload.uploadSuccess = status
  upload.issetUpload = true
  upload.uploadCategoryId = id
}
const emit = defineEmits(['issetUpload'])
const closeUpload = () => {
  userStore.stateUpdate('uploadDialog', false)
  fileUploadRef.value && fileUploadRef.value.clearFiles()
  clipboardUploadRef.value && clipboardUploadRef.value.clearFiles()
  if (upload.issetUpload) {
    emit('issetUpload', upload.uploadCategoryId)
  }
}
// 重置
const resetFiles = () => {
  const type = upload.uploadMode
  if (type === 'file-upload') {
    fileUploadRef.value && fileUploadRef.value.clearFiles()
  } else if (type === 'clipboard-upload') {
    clipboardUploadRef.value && clipboardUploadRef.value.clearFiles()
  }
  upload.uploadSuccess = false
}
// 复制方法
const copyUrl = async (textToCopy: string) => {
  try {
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
      element.removeChild(textInput)
      return ElMessage.success('复制成功')
    }
    return ElMessage.error('复制失败,手动复制吧')
  } catch (e) {
    console.error(e)
    return ElMessage.error('复制失败,手动复制吧')
  }
}
</script>

<style lang="stylus" scoped>
@import './MyUpload.styl'
</style>
