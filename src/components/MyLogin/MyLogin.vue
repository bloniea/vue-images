<template>
  <div class="login">
    <el-dialog
      class="loginDialog"
      :model-value="loginDialog"
      title="Login"
      @close="close(ruleFormRef)"
    >
      <el-form
        ref="ruleFormRef"
        status-icon
        label-width="80px"
        class="login-ruleForm"
        label-position="left"
        :model="ruleForm"
        :rules="rules"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="ruleForm.username" type="text" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="ruleForm.password" type="password" autocomplete="off" />
        </el-form-item>
        <el-form-item label="验证码" prop="identifyCode">
          <el-input type="text" maxlength="4" v-model="ruleForm.identifyCode" />
        </el-form-item>
        <el-form-item>
          <Identify :identifyCode="identifyCode" @click="refreshCode"></Identify>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeLoginDialog(ruleFormRef)">Cancel</el-button>
          <el-button type="primary" @click="submitForm(ruleFormRef)" v-loading="btnLoading">
            Login
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/counter'
import type { User } from '@/utils/types'
import { reactive, ref, type Ref } from 'vue'
import { cryptoPassword, saveStorage } from '@/utils/functions'
import { loginApi, setHeaders } from '@/utils/fetchApi'

const userStore = useUserStore()

const props = defineProps({
  loginDialog: Boolean
})
const emit = defineEmits(['close'])

const close = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  emit('close')
}

const identifyCodes = 'abcdefghijklnmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
// 随机数
const randomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min)
}
// 刷新
const refreshCode = () => {
  identifyCode.value = ''
  identifyCode.value = makeCode(identifyCodes, 4)
}
// 生成验证码
const makeCode = (o: string, l: number) => {
  let code = ''
  for (let i = 0; i < l; i++) {
    code += o[randomNum(0, o.length)]
  }
  return code
}
const identifyCode = ref(makeCode(identifyCodes, 4))

interface RuleForm {
  username: string
  password: string
  identifyCode: string
}
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  username: '',
  password: '',
  identifyCode: ''
})

const validateIdentifyCode = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入验证码'))
  } else if (value !== ruleForm.identifyCode) {
    callback(new Error("Two inputs don't match!"))
  } else {
    if (value.length < 4) {
      callback(new Error('请输入4位验证码'))
    } else if (value.toUpperCase() != identifyCode.value.toUpperCase()) {
      callback(new Error('验证码错误'))
    } else callback()
  }
}
const rules = reactive<FormRules<RuleForm>>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  identifyCode: [{ validator: validateIdentifyCode, required: true, trigger: 'change' }]
})

const btnLoading = ref<boolean>(false)
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      btnLoading.value = true

      const loginD = {
        username: ruleForm.username,
        password: await cryptoPassword(ruleForm.password),
        identifyCode: ruleForm.identifyCode
      }

      const login = await loginApi(loginD)
      btnLoading.value = false
      if (login.success === 1) {
        saveStorage('token', login.data?.token)
        saveStorage('refresh_token', login.data!.refresh_token)
        saveStorage('userInfo', {
          image_user_id: login.data!.image_user_id,
          username: login.data!.username
        })
        // localStorage.setItem('token', 'Bearer ' + login.data?.token)
        // localStorage.setItem('refresh_token', 'Bearer ' + login.data?.refresh_token)
        // localStorage.setItem(
        //   'userInfo',
        //   JSON.stringify({
        //     image_user_id: login.data?.image_user_id,
        //     username: login.data?.username
        //   })
        // )
        userStore.loginStatus = true
        userStore.user = {
          image_user_id: login.data!.image_user_id,
          username: login.data!.username
        } as User

        userStore.token = login.data!.token
        setHeaders(login.data!.token, login.data!.image_user_id)
        formEl.resetFields()
        emit('close')
      } else {
        refreshCode()
        ElMessage.error('用户或密码错误')
      }
    } else {
      refreshCode()
      console.error('error submit!', fields)
    }
  })
}
// const emit = defineEmits(["close"])
// 关闭登陆表单
const closeLoginDialog = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  emit('close')
}
</script>

<style lang="stylus" scoped>
@import './MyLogin.styl'
</style>
