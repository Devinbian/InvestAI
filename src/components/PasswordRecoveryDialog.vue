<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false" width="500px"
        class="recovery-dialog">
        <template #header>
            <div></div>
        </template>

        <div class="recovery-container">
            <div class="recovery-header">
                <div class="recovery-logo">
                    <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                </div>
                <h1 class="recovery-title">找回账号</h1>
                <p class="recovery-subtitle">请输入您的注册手机号或邮箱，我们将发送验证码帮您重置密码</p>
            </div>

            <div class="recovery-form-wrapper">
                <el-form :model="recoveryForm" :rules="recoveryRules" ref="recoveryFormRef" class="recovery-form">
                    <el-form-item prop="contact" class="recovery-form-item">
                        <el-input v-model="recoveryForm.contact" placeholder="手机号或邮箱" class="recovery-input"
                            size="large" />
                    </el-form-item>

                    <el-form-item v-if="recoveryStep === 2" prop="verifyCode" class="recovery-form-item">
                        <div class="verify-code-row">
                            <el-input v-model="recoveryForm.verifyCode" placeholder="验证码" class="recovery-input"
                                size="large" />
                            <el-button class="send-code-btn" @click="sendVerifyCode" :disabled="codeCountdown > 0"
                                :loading="sendingCode">
                                {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : '发送验证码' }}
                            </el-button>
                        </div>
                    </el-form-item>

                    <el-form-item v-if="recoveryStep === 3" prop="newPassword" class="recovery-form-item">
                        <el-input v-model="recoveryForm.newPassword" type="password" placeholder="新密码"
                            class="recovery-input" size="large" show-password />
                    </el-form-item>

                    <el-form-item v-if="recoveryStep === 3" prop="confirmNewPassword" class="recovery-form-item">
                        <el-input v-model="recoveryForm.confirmNewPassword" type="password" placeholder="确认新密码"
                            class="recovery-input" size="large" show-password />
                    </el-form-item>

                    <!-- 主按钮 -->
                    <el-button class="recovery-submit-btn" type="primary" size="large" @click="handleRecoveryStep"
                        :loading="recoveryLoading">
                        {{ getRecoveryButtonText() }}
                    </el-button>
                </el-form>

                <!-- 返回登录 -->
                <div class="recovery-back">
                    <span class="back-text">想起密码了？</span>
                    <el-button type="text" class="back-link" @click="backToLogin">
                        返回登录
                    </el-button>
                </div>

                <!-- 取消按钮 -->
                <div class="recovery-footer">
                    <el-button class="cancel-btn" @click="closeDialog">取消</el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'back-to-login', 'recovery-success']);

// Refs
const recoveryFormRef = ref(null);
const recoveryStep = ref(1); // 1: 输入联系方式, 2: 验证码, 3: 重置密码
const recoveryLoading = ref(false);
const sendingCode = ref(false);
const codeCountdown = ref(0);
let countdownTimer = null;

// 响应式数据
const recoveryForm = reactive({
    contact: '',
    verifyCode: '',
    newPassword: '',
    confirmNewPassword: ''
});

// 表单验证规则
const recoveryRules = {
    contact: [
        { required: true, message: '请输入手机号或邮箱', trigger: 'blur' },
        {
            validator: (rule, value) => {
                const phoneRegex = /^1[3-9]\d{9}$/;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!phoneRegex.test(value) && !emailRegex.test(value)) {
                    return Promise.reject('请输入有效的手机号或邮箱');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ],
    verifyCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmNewPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value !== recoveryForm.newPassword) {
                    return Promise.reject('两次输入的密码不一致');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ]
};

// 计算属性
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 方法
const getRecoveryButtonText = () => {
    switch (recoveryStep.value) {
        case 1: return '发送验证码';
        case 2: return '验证并继续';
        case 3: return '重置密码';
        default: return '下一步';
    }
};

const handleRecoveryStep = async () => {
    if (!recoveryFormRef.value) return;

    const fieldsToValidate = [];
    switch (recoveryStep.value) {
        case 1:
            fieldsToValidate.push('contact');
            break;
        case 2:
            fieldsToValidate.push('verifyCode');
            break;
        case 3:
            fieldsToValidate.push('newPassword', 'confirmNewPassword');
            break;
    }

    try {
        await recoveryFormRef.value.validateField(fieldsToValidate);
        recoveryLoading.value = true;

        // 模拟API调用
        setTimeout(() => {
            switch (recoveryStep.value) {
                case 1:
                    // 发送验证码
                    ElMessage.success('验证码已发送，请查收');
                    recoveryStep.value = 2;
                    startCountdown();
                    break;
                case 2:
                    // 验证验证码
                    if (recoveryForm.verifyCode === '123456') { // 模拟验证码
                        ElMessage.success('验证成功');
                        recoveryStep.value = 3;
                    } else {
                        ElMessage.error('验证码错误');
                    }
                    break;
                case 3:
                    // 重置密码
                    ElMessage.success('密码重置成功，请使用新密码登录');
                    closeDialog();
                    emit('recovery-success');
                    break;
            }
            recoveryLoading.value = false;
        }, 1000);
    } catch (error) {
        console.log('验证失败:', error);
    }
};

const sendVerifyCode = async () => {
    if (!recoveryForm.contact) {
        ElMessage.warning('请先输入手机号或邮箱');
        return;
    }

    sendingCode.value = true;

    // 模拟发送验证码
    setTimeout(() => {
        ElMessage.success('验证码已重新发送');
        startCountdown();
        sendingCode.value = false;
    }, 1000);
};

const startCountdown = () => {
    codeCountdown.value = 60;
    countdownTimer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
    }, 1000);
};

const backToLogin = () => {
    closeDialog();
    emit('back-to-login');
};

const closeDialog = () => {
    visible.value = false;
    resetForm();
};

const resetForm = () => {
    recoveryStep.value = 1;
    // 重置表单
    Object.keys(recoveryForm).forEach(key => {
        recoveryForm[key] = '';
    });
    if (recoveryFormRef.value) {
        recoveryFormRef.value.clearValidate();
    }
    // 清除倒计时
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        codeCountdown.value = 0;
    }
};

// 监听对话框显示状态，重置表单
watch(visible, (newVal) => {
    if (newVal) {
        resetForm();
    }
});
</script>

<style scoped>
/* 账号找回对话框样式 */
:deep(.recovery-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.recovery-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.recovery-dialog .el-dialog__body) {
    padding: 0;
}

.recovery-container {
    padding: 32px 40px;
    background: white;
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.recovery-header {
    text-align: center;
    margin-bottom: 32px;
}

.recovery-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.recovery-logo .logo-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recovery-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #18181b;
    letter-spacing: -0.025em;
}

.recovery-subtitle {
    font-size: 0.875rem;
    margin: 0;
    color: #6b7280;
    font-weight: 400;
    line-height: 1.5;
    max-width: 360px;
    margin: 0 auto;
}

.recovery-form-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.recovery-form {
    margin-bottom: 20px;
}

.recovery-form-item {
    margin-bottom: 16px;
    text-align: left;
}

.recovery-form-item:last-child {
    margin-bottom: 0;
}

/* 验证码输入行 */
.verify-code-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.verify-code-row .recovery-input {
    flex: 1;
}

.send-code-btn {
    height: 44px;
    padding: 0 16px;
    border-radius: 8px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.send-code-btn:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
    color: #1f2937;
}

.send-code-btn:disabled {
    background: #f9fafb;
    border-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
}

/* 强制覆盖Element Plus的默认样式 */
:deep(.recovery-input) {
    --el-input-border-color: #6b7280 !important;
    --el-input-hover-border-color: #374151 !important;
    --el-input-focus-border-color: #18181b !important;
}

:deep(.recovery-input .el-input__wrapper) {
    height: 44px !important;
    border-radius: 8px !important;
    border: 2px solid #6b7280 !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
    padding: 0 14px !important;
}

:deep(.recovery-input .el-input__wrapper:hover) {
    border-color: #374151 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.recovery-input.is-focus .el-input__wrapper) {
    border-color: #18181b !important;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.recovery-input .el-input__inner) {
    font-size: 1rem;
    color: #18181b;
    font-weight: 400;
    height: 100%;
}

:deep(.recovery-input .el-input__inner::placeholder) {
    color: #9ca3af;
    font-weight: 400;
}

.recovery-submit-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: #18181b;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: white;
    transition: all 0.2s ease;
    margin-bottom: 20px;
}

.recovery-submit-btn:hover {
    background: #000000;
}

.recovery-submit-btn:active {
    transform: scale(0.98);
}

.recovery-back {
    text-align: center;
    margin-bottom: 16px;
}

.back-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 4px;
}

.back-link {
    color: #18181b;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
}

.back-link:hover {
    color: #000000;
    background: transparent;
}

.recovery-footer {
    text-align: center;
    border-top: 1px solid #f3f4f6;
    padding-top: 16px;
    margin-top: auto;
}

.cancel-btn {
    color: #6b7280;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    background: transparent;
    transition: all 0.2s ease;
}

.cancel-btn:hover {
    color: #374151;
    background: #f9fafb;
}
</style>
