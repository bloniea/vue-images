<template>
  <div class="clipboard-upload">
    <el-form
      :model="uploadForm"
      label-width="auto"
      label-position="top"
      :rules="rules"
      ref="ruleFormRef"
    >
      <el-form-item label="分类:" prop="categoryId">
        <el-select class="select" v-model="uploadForm.categoryId" placeholder="选择分类">
          <el-option
            v-for="item in userStore.categories"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图片内容:">
        <el-button :loading="upload.btn" type="success" @click="getClipboardImageData"
          >获取图片</el-button
        >
      </el-form-item>
      <el-form-item label="图片名称:" prop="name">
        <el-input v-model="uploadForm.name" placeholder="图片名称"></el-input>
      </el-form-item>
      <el-form-item label="图片预览:">
        <el-image
          class="img"
          v-if="uploadForm.imageUrl"
          fit="cover"
          :src="uploadForm.imageUrl"
        ></el-image>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useUserStore } from '@/stores/counter'
import { config } from '@/utils/config'
import { getCategoryName, uploadFile } from '@/utils/functions'
import type { FileData } from '@/utils/types'
// import { uploadSubsectionApi } from '@/utils/fetchApi'
import type { FormInstance, FormRules } from 'element-plus'
const userStore = useUserStore()
const upload = reactive({
  uploadCategoryId: null as number | null,
  dataVal: '',
  btn: false,
  files: [] as FileData[]
})
const ruleFormRef = ref<FormInstance>()
interface RuleForm {
  name: string
  categoryId: null | number
  imageUrl: string
}
const uploadForm = reactive<RuleForm>({
  name: '',
  categoryId: null,
  imageUrl: ''
})
const rules = reactive<FormRules<RuleForm>>({
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
})

const emit = defineEmits(['updateValue', 'successUpload'])
const getClipboardImageData = async () => {
  emit('updateValue', true)
  upload.btn = true
  try {
    const clipboardItems = await navigator.clipboard.read()
    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (/^image\//.test(type)) {
          const blob = await clipboardItem.getType(type)
          await processImage(blob)
          emit('updateValue', false)
          return // 如果找到了图片类型，就不再检查其他类型
        }
      }
    }
    ElMessage.closeAll()
    return ElMessage.error('剪贴板不存在图片')
  } catch (error) {
    console.error('获取剪贴板内容失败：', error)
  } finally {
    upload.btn = false
    emit('updateValue', false)
  }
}
const processImage = async (blob: Blob): Promise<void> => {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  reader.onload = async () => {
    const url = URL.createObjectURL(blob)
    uploadForm.imageUrl = url
    const obj = {
      path: config.path,
      thumbnailPath: config.thumbnailPath,
      message: config.message,
      content: reader.result,
      thumbnailContent: '',
      category_name: getCategoryName(uploadForm.categoryId, userStore.categories),
      category_id: uploadForm.categoryId,
      name: '',
      type: blob.type.split('/').pop(),
      temp: {
        imgUrl: url,
        loading: false
      },
      input: false,
      uploadedUrl: ''
    }
    upload.files = [obj]
  }
}
const status = reactive({
  upload: 'uploading',
  err: 'err',
  success: true
})

const startUpload = async (): Promise<any> => {
  if (!ruleFormRef.value) return
  return await ruleFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        const file = upload.files[0]
        if (!file) {
          ElMessage.closeAll()
          throw ElMessage.error('图片呢')
        }

        file.category_name = getCategoryName(uploadForm.categoryId, userStore.categories)
        file.temp!.loading = status.upload
        emit('updateValue', true)
        const resStatus = await uploadFile(file, uploadForm.categoryId!, status)
        if (resStatus === true) {
          emit('successUpload', [file], true, uploadForm.categoryId)
        }
        // if (res && res.success === 1) {
        //   file.uploadedUrl = res.data && res.data.img_url
        //   file.input = true
        //   emit('successUpload', [file], true)
        // } else {

        //   file.input = false
        //   ElMessage.error('上传超时')
        // }
      } finally {
        emit('updateValue', false)
      }
    } else {
      console.error('error submit!', fields)
    }
  })
}

const clearFiles = () => {
  upload.files = []
  uploadForm.name = ''
  uploadForm.imageUrl = ''
}
defineExpose({
  startUpload,
  clearFiles
})
</script>

<style lang="stylus" scoped>
.clipboard-upload
    .img
        height 20rem
</style>
