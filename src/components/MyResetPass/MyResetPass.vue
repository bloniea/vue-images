<template>
  <div class="resetPass">
    <el-dialog
      :model-value="props.resetPass"
      title="更改密码"
      width="30%"
      class="resetPassDialog"
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
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="ruleForm.oldPassword" type="password" autocomplete="off" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="ruleForm.password" type="password" autocomplete="off" />
        </el-form-item>
        <el-form-item label="确认密码" prop="repeatPassword">
          <el-input type="password" v-model="ruleForm.repeatPassword" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="close(ruleFormRef)">Cancel</el-button>
          <el-button type="primary" :loading="btnloading" @click="resetpassSubmit(ruleFormRef)">
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { editPasswordApi } from '@/utils/fetchApi'
import { cryptoPassword } from '@/utils/functions'
import { type FormInstance, type FormRules } from 'element-plus'
import { reactive, ref } from 'vue'

const props = defineProps({
  resetPass: Boolean
})
const ruleFormRef = ref<FormInstance>()
const emit = defineEmits(['close'])

const close = async (formEl: FormInstance | undefined) => {
  emit('close')
  if (!formEl) return
  formEl.resetFields()
}

const ruleForm = reactive({
  oldPassword: '',
  password: '',
  repeatPassword: ''
})
interface RuleForm {
  oldPassword: string
  password: string
  repeatPassword: string
}
const validateRepeatPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== ruleForm.password) {
    callback(new Error('两次输入的密码不相同'))
  } else {
    callback()
  }
}
const rules = reactive<FormRules<RuleForm>>({
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 12, message: '请输入6-12位密码', trigger: 'blur' }
  ],
  repeatPassword: [{ validator: validateRepeatPassword, required: true, trigger: 'blur' }]
})

const btnloading = ref(false)
const resetpassSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      const resetD = {
        oldPassword: await cryptoPassword(ruleForm.oldPassword),
        password: await cryptoPassword(ruleForm.password),
        repeatPassword: await cryptoPassword(ruleForm.repeatPassword)
      }
      btnloading.value = true
      try {
        const resetRes = await editPasswordApi(resetD)

        if (resetRes.success === 1) {
          formEl.resetFields()
          ElMessage.success('修改成功')
          emit('close')
        } else if (resetRes.status === 401 && resetRes.data?.repeat === 1) {
          ElMessage.error('两次输入的密码不相同')
        } else if (resetRes.status === 401 && resetRes.data?.old === 1) {
          ElMessage.error('旧密码不正确')
        } else if (resetRes.status === 404) {
          ElMessage.error('用户不存在')
        }
      } catch (e) {
        console.error(e)
      } finally {
        btnloading.value = false
      }
    }
  })
}
</script>

<style lang="stylus" scoped>
@import './MyResetPass.styl'
</style>
