<template>
  <div class="phone-binding-overlay" v-if="visible" @click="handleClose">
    <div class="phone-binding-container" :class="{ 'mobile-bottom': isMobile }" @click.stop>
      <!-- 头部 -->
      <div class="binding-header">
        <h3>{{ isBinding ? '绑定手机号' : '更换手机号' }}</h3>
        <button class="close-btn" @click="handleClose">
          <el-icon>
            <Close />
          </el-icon>
        </button>
      </div>

      <!-- 内容 -->
      <div class="binding-content">
        <!-- 当前手机号显示（更换时） -->
        <div v-if="!isBinding && currentPhone" class="current-phone">
          <div class="current-phone-label">当前手机号</div>
          <div class="current-phone-value">{{ formatPhone(currentPhone) }}</div>
        </div>

        <!-- 输入新手机号 -->
        <div class="form-section">
          <div class="form-item">
            <label class="form-label">{{ isBinding ? '手机号' : '新手机号' }}</label>
            <div class="input-wrapper">
              <input
                v-model="formData.phone"
                type="tel"
                :placeholder="isBinding ? '请输入手机号' : '请输入新手机号'"
                class="form-input"
                :class="{ 'error': errors.phone }"
                @input="validatePhone"
                @blur="validatePhone"
                maxlength="11"
              />
            </div>
            <div v-if="errors.phone" class="error-message">{{ errors.phone }}</div>
          </div>

          <!-- 验证码输入 -->
          <div class="form-item">
            <label class="form-label">验证码</label>
            <div class="code-input-wrapper">
              <input
                v-model="formData.code"
                type="text"
                placeholder="请输入验证码"
                class="form-input code-input"
                :class="{ 'error': errors.code }"
                @input="validateCode"
                @blur="validateCode"
                maxlength="6"
              />
              <button
                class="send-code-btn"
                :class="{ 'disabled': !canSendCode }"
                :disabled="!canSendCode"
                @click="sendCode"
              >
                {{ codeButtonText }}
              </button>
            </div>
            <div v-if="errors.code" class="error-message">{{ errors.code }}</div>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="tips">
          <div class="tip-item">
            <el-icon class="tip-icon">
              <InfoFilled />
            </el-icon>
            <span>验证码将发送至您的手机，请注意查收</span>
          </div>
          <div class="tip-item">
            <el-icon class="tip-icon">
              <Lock />
            </el-icon>
            <span>绑定手机号后可用于登录和找回密码</span>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="binding-footer">
        <button class="cancel-btn" @click="handleClose">取消</button>
        <button 
          class="confirm-btn" 
          :class="{ 'loading': loading, 'disabled': !canSubmit }"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <span v-if="loading">{{ isBinding ? '绑定中...' : '更换中...' }}</span>
          <span v-else>{{ isBinding ? '确认绑定' : '确认更换' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, InfoFilled, Lock } from '@element-plus/icons-vue'
import { sendPhoneCode, bindPhone } from '@/api/api'

// 检测是否为移动端
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
})

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentPhone: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'success'])

// 是否为绑定模式（true: 绑定新手机, false: 更换手机）
const isBinding = computed(() => !props.currentPhone)

// 表单数据
const formData = reactive({
  phone: '',
  code: ''
})

// 错误信息
const errors = reactive({
  phone: '',
  code: ''
})

// 状态管理
const loading = ref(false)
const countdown = ref(0)
const codeSent = ref(false)

// 验证码按钮文本
const codeButtonText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}s后重发`
  }
  return codeSent.value ? '重新发送' : '发送验证码'
})

// 是否可以发送验证码
const canSendCode = computed(() => {
  return formData.phone && 
         !errors.phone && 
         countdown.value === 0 && 
         !loading.value
})

// 是否可以提交
const canSubmit = computed(() => {
  return formData.phone && 
         formData.code && 
         !errors.phone && 
         !errors.code && 
         !loading.value
})

// 格式化手机号显示
const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
}

// 验证手机号
const validatePhone = () => {
  const phone = formData.phone.trim()
  if (!phone) {
    errors.phone = '请输入手机号'
    return false
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    errors.phone = '请输入正确的手机号'
    return false
  }
  if (phone === props.currentPhone) {
    errors.phone = '新手机号不能与当前手机号相同'
    return false
  }
  errors.phone = ''
  return true
}

// 验证验证码
const validateCode = () => {
  const code = formData.code.trim()
  if (!code) {
    errors.code = '请输入验证码'
    return false
  }
  if (!/^\d{6}$/.test(code)) {
    errors.code = '验证码为6位数字'
    return false
  }
  errors.code = ''
  return true
}

// 发送验证码
const sendCode = async () => {
  if (!validatePhone()) return

  try {
    loading.value = true
    const response = await sendPhoneCode({
      phone: formData.phone,
      type: isBinding.value ? 'bind' : 'change'
    })

    if (response.success) {
      ElMessage.success('验证码发送成功')
      codeSent.value = true
      startCountdown()
    } else {
      ElMessage.error(response.message || '验证码发送失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('验证码发送失败，请重试')
  } finally {
    loading.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 提交绑定
const handleSubmit = async () => {
  if (!validatePhone() || !validateCode()) return

  try {
    loading.value = true
    const response = await bindPhone({
      phone: formData.phone,
      code: formData.code,
      type: isBinding.value ? 'bind' : 'change'
    })

    if (response.success) {
      ElMessage.success(isBinding.value ? '手机号绑定成功' : '手机号更换成功')
      emit('success', formData.phone)
      handleClose()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('绑定手机号失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 重置表单
const resetForm = () => {
  formData.phone = ''
  formData.code = ''
  errors.phone = ''
  errors.code = ''
  loading.value = false
  countdown.value = 0
  codeSent.value = false
}

// 监听显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
  }
})
</script>

<style scoped>
.phone-binding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.phone-binding-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUpFromBottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.binding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.binding-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #18181b;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #18181b;
}

.binding-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.current-phone {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.current-phone-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.current-phone-value {
  font-size: 1rem;
  font-weight: 500;
  color: #18181b;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  height: 48px;
  padding: 0 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 100px;
}

.send-code-btn:hover:not(.disabled) {
  background: #2563eb;
}

.send-code-btn.disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error-message {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 4px;
}

.tips {
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #64748b;
}

.tip-icon {
  flex-shrink: 0;
  font-size: 1rem;
  color: #3b82f6;
}

.binding-footer {
  padding: 20px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  height: 48px;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.confirm-btn {
  flex: 2;
  height: 48px;
  background: #18181b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(.disabled):not(.loading) {
  background: #000000;
}

.confirm-btn.disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.confirm-btn.loading {
  background: #6b7280;
  cursor: not-allowed;
}

/* 移动端底部弹出样式 */
.phone-binding-container.mobile-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: none;
  border-radius: 16px 16px 0 0;
  animation: slideUpFromBottom 0.3s ease-out;
  max-height: 85vh;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .phone-binding-overlay {
    align-items: flex-end;
  }
  
  .phone-binding-container {
    width: 95%;
    margin: 0 auto;
  }
  
  .phone-binding-container.mobile-bottom {
    width: 100%;
    margin: 0;
  }
  
  .binding-content {
    padding: 20px;
  }
  
  .binding-header {
    padding: 16px 20px;
  }
  
  .binding-footer {
    padding: 16px 20px;
  }
  
  .form-input, .send-code-btn {
    height: 44px;
  }
  
  .send-code-btn {
    min-width: 90px;
    font-size: 0.8rem;
  }
}
</style> 