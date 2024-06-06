<template>
  <my-loading v-if="loading"></my-loading>
  <div class="home" v-else>
    <div class="images" v-if="images.list.length">
      <div class="img" v-for="(item, i) in images.list" :key="item.image_id">
        <div class="del" v-if="loginstatus">
          <el-icon @click="delImage"><CloseBold /></el-icon>
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
              <el-image :src="im"></el-image>
            </div> </template
        ></el-image>
        <div class="img-title">{{ item.name }}</div>
      </div>
    </div>
    <div class="empty" v-else>
      <el-empty :image-size="200" />
    </div>
    <my-page
      :total="images.total"
      :currentPage="query.pagenum"
      :page-size="query.pagesize"
      @currentChange="currentChange"
    ></my-page>

    <client-only>
      <el-dialog
        v-model="upload.uploadDialog"
        title="图片上传"
        class="upload-dialog"
        :close-on-click-modal="false"
        @close="closeUpload"
      >
        <el-tabs
          type="border-card"
          v-if="!upload.uploadSuccess"
          v-model="uploadType"
          class="tabs"
        >
          <el-tab-pane label="图片上传" name="file-upload">
            <div class="upload-form">
              <div class="uploader">
                <el-select
                  class="select"
                  v-model="uploadCategoryId"
                  placeholder="Select"
                >
                  <el-option
                    v-for="item in imagesCategories"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
                <div
                  class="uploader-box"
                  v-for="(item, i) in upload.files"
                  :key="i"
                >
                  <div class="uploader-img">
                    <el-image :src="item.temp.imgUrl" fit="cover"></el-image>
                    <div class="model" v-if="item.temp.loading">
                      <el-icon
                        class="uploading"
                        v-if="item.temp.loading == 'uploading'"
                      >
                        <Loading />
                      </el-icon>
                      <el-icon
                        class="err"
                        v-else-if="item.temp.loading == 'err'"
                        @click="reUpload(item, i as unknown as keyof uVal)"
                      >
                        <Refresh />
                      </el-icon>
                      <el-icon v-else>
                        <Check />
                      </el-icon>
                    </div>
                  </div>

                  <el-input v-model="item.name" type="text"></el-input>
                </div>
                <div class="uploader-input" v-show="!upload.files.length">
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
          </el-tab-pane>
          <el-tab-pane label="网络地址上传" name="url-upload">
            <el-select
              class="select"
              v-model="uploadCategoryId"
              placeholder="Select"
            >
              <el-option
                v-for="item in imagesCategories"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <div class="tab-title">网络地址:</div>
            <el-input v-model="imageUrl" placeholder="Please image url" />
            <div class="image">
              <el-image v-if="imageUrl" fit="cover" :src="imageUrl"></el-image>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="upload-success" v-else>
          <!-- <div class="upload-success-img">
            <div class="success-img">
              <el-image
                fit="cover"
                src="https://images.bloniea.com/imagesThumbnail/20220618014019_1694695354630_163.jpeg"
              ></el-image>
            </div>
            <div class="url-input">
              <el-input value="123456789" readonly></el-input>
              <el-button @click="copyUrl('1111111111')">复制</el-button>
            </div>
          </div> -->

          <div
            class="upload-success-img"
            v-for="(item, i) in upload.files"
            :key="item.name"
          >
            <div class="success-img">
              <el-image fit="cover" :src="item.temp.imgUrl"></el-image>
            </div>
            <div class="url-input">
              <el-input
                :value="config.url + item.uploadedUrl"
                readonly
              ></el-input>
              <el-button @click="copyUrl(config.url + '/' + item.uploadedUrl)"
                >复制</el-button
              >
            </div>
          </div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="closeUpload">关闭</el-button>
            <el-button
              type="primary"
              @click="conUpload"
              v-if="upload.uploadSuccess"
            >
              继续上传
            </el-button>

            <el-button
              type="primary"
              :loading="btnloading"
              @click="startUpload"
              v-else
            >
              上传
            </el-button>
          </span>
        </template>
      </el-dialog>
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import { h, render } from "vue"
import {
  CopyDocument,
  Delete,
  Plus,
  Loading,
  Refresh,
  Check,
  CloseBold,
} from "@element-plus/icons-vue"
import type { TabPaneName } from "element-plus"
const uploader = ref()
const loading = ref(true)
const loginstatus = useLoginStatus()
const delImage = async () => {
  ElMessageBox.confirm("确认删除？", "Warning", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    const elm = ElMessage({
      type: "info",
      message: "删除中,请稍后...",
      duration: 0,
    })
    const data = images.list[images.initialIndex]
    const body = {
      path: data.path,
      sha: data.sha,
      thumbnailSha: data.thumbnailsha,
      thumbnailPath: data.thumbnailpath,
      repo: config.repo,
      owner: config.owner,
      _id: data.image_id,
    }
    const del = await delImageApi(body, data.image_id)
    elm.close()
    if (del.status == 1) {
      ElMessage({
        type: "success",
        message: "删除成功",
      })
      await getImages()
    } else if (del.statusCode == 404) {
      ElMessage.error("资源不存在")
    }
  })
}
const showViewer = () => {
  if (process.client) {
    nextTick(async () => {
      const element = document.querySelector(
        ".el-image-viewer__actions__inner"
      ) as HTMLElement
      // 往预览图下面添加复制图标CopyDocument和删除图标delete

      const copyIcon = h("div", { class: "addIcon" }, [
        h(
          "i",
          {
            class: "el-icon",
            onClick: async () => {
              images.initialIndex
              await copyUrl(config.url + images.list[images.initialIndex].path)
            },
          },
          h(CopyDocument)
        ),
        loginstatus.value
          ? h(
              "i",
              {
                class: "el-icon",
                onClick: async () => {
                  await delImage()
                },
              },
              h(Delete)
            )
          : "",
      ])
      render(copyIcon, element)
    })
  }
}
const route = useRoute()
const pagenum = route.query.pagenum as string
const keyword = route.query.keyword
const im = "/load.gif"
const query = reactive({
  pagesize: 24, // 每页个数
  pagenum: pagenum && !isNaN(parseInt(pagenum)) ? parseInt(pagenum) : 1, // 初始页码
  keyword: keyword ? keyword : "",
})
watch(
  async () => route.query.keyword,
  async (v, o) => {
    // console.log(await v)
    const nv = await v
    const no = await o

    if (nv === "") return
    nv ? (query.keyword = nv) : (query.keyword = "")
    await getImages()
  }
)
const downEnter = useDownEnter()
watch(
  () => downEnter.value,
  async (n) => {
    // console.log(n)
    if (n) {
      await getImages()
      downEnter.value = false
    }
  }
)
// 图片数据接口
interface ImagesData {
  created_at: string
  image_id: number
  name: string
  path: string
  sha: string
  size: string | number
  thumbnailpath: string
  thumbnailsha: string
}
const images = reactive({
  // 图片数组
  list: [] as ImagesData[],
  // 预览图片初始索引值
  initialIndex: 0,
  total: 0,
})
interface obj {
  code: number
  data: []
}
const previewList = computed(() => {
  return images.list.map((item) => {
    return config.url + item.path
  })
})

// 当前分类id
const categoryId = useCategoryId()
const imagesCategories = useImagesCategories()
const getImages = async () => {
  try {
    loading.value = true
    const resData = await getImagesApi(categoryId.value, {
      pagesize: query.pagesize,
      pagenum: query.pagenum,
      keyword: query.keyword,
    })
    // console.log(resData)
    if (resData.status === 1) {
      loading.value = false
      images.total = Number(resData.data.total)
      images.list = resData.data.result
    }
  } catch (e) {
    console.log(e)
  }
}
onMounted(() => {
  if (categoryId.value) getImages()
})

watch(categoryId, (n: any) => {
  getImages()
})
// 设置预览图下标
const setIndex = (i: number) => {
  images.initialIndex = i
}
// 换页
const currentChange = async (page: number) => {
  query.pagenum = page
  await getImages()
}

interface uVal {
  owner: string
  repo: string
  path: string
  thumbnailPath: string
  message: string
  content: string | ArrayBuffer | null
  name: string
  type: string
  temp: {
    imgUrl: string
    loading: boolean | string
  }
  category_name: string
  uploadedUrl?: string
}
const upload = reactive({
  uploadDialog: useUploadDialog(),

  files: [] as uVal[],
  uploadSuccess: false,
})
// 关闭时是否有图片已上传成功
const isUploadSuccess = ref<boolean>(false)
// 获取图片后缀名
const getTypeName = (name: String) => {
  const index = name.lastIndexOf(".")
  return name.substring(index + 1)
}

// 选择上传的图片
const selectFile = async (e: Event) => {
  upload.files = []
  const eTarget = e.target as HTMLInputElement
  const files = eTarget.files
  const maxLen = config.maxLen
  const maxsize = config.maxsize
  let errSize = false
  if (files && files.length) {
    const filesAsArray = Array.from(files)
    for (let i = 0, len = filesAsArray.length; i < len; i++) {
      if (i >= maxLen) {
        return ElMessage.error("单次最多上传" + maxLen + "张")
      }

      if (!/image/.test(filesAsArray[i].type)) {
        ElMessage({
          type: "error",
          message: "请不要选择非图片文件",
        })
        uploader.value.value = ""
        return
      }
      if (filesAsArray[i].size > maxsize * 1024 * 1024) {
        if (i === filesAsArray.length - 1) {
          uploader.value.value = ""
          ElMessage({
            type: "error",
            message: `最大支持${maxsize}mb`,
          })

          return
        }
        errSize = true
        continue
      }
      const reader = new FileReader()
      reader.readAsDataURL(filesAsArray[i])
      reader.onload = async () => {
        const obj = {
          owner: config.owner,
          repo: config.repo,
          path: config.path,
          thumbnailPath: config.thumbnailPath,
          message: config.message,
          content: reader.result,
          category_name: getCategoryName(
            uploadCategoryId.value,
            imagesCategories.value
          ),
          name: filesAsArray[i].name,
          type: getTypeName(filesAsArray[i].name),
          temp: {
            imgUrl: URL.createObjectURL(filesAsArray[i]),
            loading: false,
          },
        }
        // console.log(obj)
        upload.files.push(obj)
        // console.log(upload.files)
        // console.log(upload.files)
        // const upRes = await uploadImagesApi(obj)
        // console.log(upRes)
        if (i === filesAsArray.length - 1) {
          if (errSize) {
            ElMessage({
              type: "error",
              message: "最大支持10mb",
            })

            uploader.value.value = ""
            errSize = false
          }
        }

        uploader.value.value = ""
      }
    }
  }
}

// 开关闭dialog初始化数据
watch(
  () => upload.uploadDialog,
  (nval) => {
    upload.files = []
    if (!nval) upload.uploadSuccess = false
  }
)
// 关闭上传表单dialog
const closeUpload = () => {
  btnloading.value = false
  if (isUploadSuccess.value) {
    categoryId.value = uploadCategoryId.value
    getImages()
  }
  isUploadSuccess.value = false

  upload.uploadDialog = false
}
// 继续上传
const conUpload = () => {
  upload.files = []
  upload.uploadSuccess = false
}
const btnloading = ref(false)
const userInfo = useInfo()
// 要上传的目标分类
const uploadCategoryId = ref<number | string>("")

// 上传
const startUpload = async () => {
  if (uploadType.value === "file-upload") {
    await fileUpload()
  } else if (uploadType.value === "url-upload") {
    await urlUpload()
  }
}
// 文件上传
const fileUpload = async () => {
  let files = upload.files as Array<uVal>
  if (!files.length) return
  if (!uploadCategoryId.value) {
    ElMessage.error("请选择分类")
    return
  }
  let status = true
  const user = userInfo.value
  btnloading.value = true
  for (let i = 0, len = files.length; i < len; i++) {
    upload.files[i].temp.loading = "uploading"

    const result = await uploadImagesApi(uploadCategoryId.value, files[i])

    upload.files[i].temp.loading = "uploading"
    if (result.status === 1) {
      isUploadSuccess.value = true
      upload.files[i].temp.loading = "success"
      upload.files[i].uploadedUrl = result.data.img_url
    } else {
      status = false
      upload.files[i].temp.loading = "err"
    }
    if (i == files.length - 1) {
      btnloading.value = false
    }
  }
  if (status) {
    upload.uploadSuccess = true
  }
}
// 重新上传
const reUpload = async <T extends object, K extends keyof T>(
  _obj: T,
  _index: K
) => {
  try {
    ;(upload.files as any)[_index].temp.loading = "uploading"
    const result = await uploadImagesApi(uploadCategoryId.value, _obj)
    if (result.status === 1) {
      isUploadSuccess.value = true
      ;(upload.files as any)[_index].temp.loading = "success"
    } else {
      ;(upload.files as any)[_index].temp.loading = "err"
      return ElMessage.error("网络超时")
    }
    let status = true
    const files = upload.files
    for (let i = 0; i < files.length; i++) {
      if (files[i].temp.loading != "success") {
        status = false
      }
    }
    if (status) {
      upload.uploadSuccess = true
    }
  } catch (e) {
    ;(upload.files as any)[_index].temp.loading = "err"
  }
}
// tabs activeName 改变时触发

const uploadType = ref<string>("file-upload")
const imageUrl = ref("")
// url上传
const urlUpload = async () => {
  console.log("网络地址")
  upload.files = []
  try {
    const response = await fetch(imageUrl.value)
    if (!response.ok) {
      throw new Error("Network response was not ok")
    }
    const blob = await response.blob()
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onload = async () => {
      const obj: uVal = {
        owner: config.owner,
        repo: config.repo,
        path: config.path,
        thumbnailPath: config.thumbnailPath,
        message: config.message,
        content: reader.result,
        category_name: getCategoryName(
          uploadCategoryId.value,
          imagesCategories.value
        ),
        name: extractDataFromURL(imageUrl.value),
        type: getBase64Type(reader.result as string),
        temp: {
          imgUrl: URL.createObjectURL(blob),
          loading: false,
        },
      }

      const result = await uploadImagesApi(uploadCategoryId.value, obj)
      if (result.status === 1) {
        upload.uploadSuccess = true
        imageUrl.value = ""
        obj.uploadedUrl = result.data.img_url
        upload.files.push(obj)
      }
    }
  } catch (error) {
    ElMessage.error("网络超时或链接不支持")
    console.error("Error fetching image:", error)
  }
}
// 复制地址
const copyUrl = async (textToCopy: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy)
    return ElMessage.success("复制成功")
  } else if (document.execCommand("copy")) {
    const element = document.querySelector("body") as HTMLElement
    const textD = h(
      "textarea",
      {
        class: "copy-textarea",
        style: {
          position: "absolute",
          opacity: 0,
          left: "-999999px",
          top: "-999999px",
        },
      },
      textToCopy
    )
    render(textD, element)
    const textInput = document.querySelector(
      ".copy-textarea"
    ) as HTMLTextAreaElement
    textInput.value = textToCopy
    textInput.focus()
    textInput.select()
    document.execCommand("copy")
    // element.removeChild(textInput)
    return ElMessage.success("复制成功")
  }
  return ElMessage.error("复制失败,手动复制吧")
}
</script>

<style lang="stylus" scoped>
@import './index.styl'
</style>
