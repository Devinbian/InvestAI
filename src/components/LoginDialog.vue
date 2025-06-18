<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false" width="720px"
        class="auth-dialog">
        <template #header>
            <div></div>
        </template>

        <div class="auth-container">
            <!-- LOGO区域 -->
            <div class="auth-logo-section">
                <div class="auth-logo">
                    <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                </div>
                <h1 class="auth-main-title">{{ isRegisterMode ? '注册智投小助' : '登录智投小助' }}</h1>
                <p class="auth-main-subtitle">{{ isRegisterMode ? '创建您的智投小助账号' : '使用您的账号登录智投小助' }}</p>
            </div>

            <!-- 表单区域 -->
            <div class="auth-form-wrapper">
                <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="auth-form">
                    <el-form-item prop="username" class="auth-form-item">
                        <el-input v-model="loginForm.username" placeholder="用户名" class="auth-input" size="large" />
                    </el-form-item>

                    <el-form-item v-if="isRegisterMode" prop="phone" class="auth-form-item">
                        <el-input v-model="loginForm.phone" placeholder="手机号" class="auth-input" size="large" />
                    </el-form-item>

                    <el-form-item prop="password" class="auth-form-item">
                        <el-input v-model="loginForm.password" type="password" placeholder="密码" class="auth-input"
                            size="large" show-password />
                    </el-form-item>

                    <el-form-item v-if="isRegisterMode" prop="confirmPassword" class="auth-form-item">
                        <el-input v-model="loginForm.confirmPassword" type="password" placeholder="确认密码"
                            class="auth-input" size="large" show-password />
                    </el-form-item>

                    <!-- 主按钮 -->
                    <el-button class="auth-submit-btn" type="primary" size="large" @click="handleLogin"
                        :loading="loginLoading">
                        {{ isRegisterMode ? '创建账号' : '继续登录' }}
                    </el-button>
                </el-form>

                <!-- 第三方登录分割线 -->
                <div class="auth-divider">
                    <span class="divider-text">或</span>
                </div>

                <!-- 第三方登录按钮 -->
                <div class="third-party-login">
                    <el-button class="wechat-login-btn" @click="handleWechatLogin" :loading="wechatLoginLoading">
                        <div class="wechat-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.900 7.6.5.5-3.187-2.75-6.876-8.372-6.876zm-3.488 5.69c-.865 0-1.566-.701-1.566-1.565 0-.865.701-1.566 1.566-1.566.865 0 1.565.701 1.565 1.566 0 .864-.7 1.565-1.565 1.565zm5.194 0c-.865 0-1.566-.701-1.566-1.565 0-.865.701-1.566 1.566-1.566.865 0 1.565.701 1.565 1.566 0 .864-.7 1.565-1.565 1.565z" />
                                <path
                                    d="M15.293 9.025c-.328 0-.66.018-.99.057-.931.110-1.831.402-2.65.859-2.301 1.283-3.677 3.449-3.677 5.303 0 3.765 3.186 6.822 7.094 6.822.402 0 .805-.027 1.201-.08a.805.805 0 0 1 .68.097l1.77 1.034c.027.016.06.025.094.025.12 0 .215-.097.215-.215 0-.054-.022-.105-.035-.158l-.365-1.378a.548.548 0 0 1 .198-.62c1.7-1.251 2.765-3.047 2.765-5.125 0-3.765-3.186-6.821-7.094-6.821h-.206zm-2.43 4.565c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565zm4.565 0c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565z" />
                            </svg>
                        </div>
                        <span>微信登录</span>
                    </el-button>
                </div>

                <!-- 切换模式 -->
                <div class="auth-mode-switch">
                    <span class="switch-text">{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
                    <el-button type="text" class="switch-link" @click="toggleAuthMode">
                        {{ isRegisterMode ? '立即登录' : '立即注册' }}
                    </el-button>
                </div>

                <!-- 账号找回 -->
                <div v-if="!isRegisterMode" class="auth-recovery">
                    <el-button type="text" class="recovery-link" @click="showPasswordRecovery">
                        忘记密码？
                    </el-button>
                </div>

                <!-- 取消按钮 -->
                <div class="auth-footer">
                    <el-button class="cancel-btn" @click="closeDialog">取消</el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    registerMode: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'login-success', 'show-recovery']);

// Store
const userStore = useUserStore();

// Refs
const loginFormRef = ref(null);
const loginLoading = ref(false);
const wechatLoginLoading = ref(false);
const isRegisterMode = ref(props.registerMode);

// 响应式数据
const loginForm = reactive({
    username: '',
    password: '',
    phone: '',
    confirmPassword: ''
});

// 表单验证规则
const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value !== loginForm.password) {
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
const handleLogin = async () => {
    if (!loginFormRef.value) return;

    await loginFormRef.value.validate((valid) => {
        if (valid) {
            loginLoading.value = true;

            // 模拟API调用
            setTimeout(() => {
                const token = 'mock-token-' + Date.now();
                const userInfo = {
                    username: loginForm.username,
                    nickname: loginForm.username,
                    isNewUser: isRegisterMode.value
                };

                userStore.setToken(token);
                userStore.setUserInfo(userInfo);

                if (isRegisterMode.value) {
                    ElMessage.success('注册成功！');
                } else {
                    ElMessage.success('登录成功！');
                }

                loginLoading.value = false;
                closeDialog();

                // 触发登录成功事件
                emit('login-success', {
                    isNewUser: isRegisterMode.value,
                    userInfo
                });
            }, 1000);
        }
    });
};

const handleWechatLogin = async () => {
    wechatLoginLoading.value = true;

    try {
        ElMessage.info('正在启动微信登录...');

        // 模拟微信登录API调用
        setTimeout(() => {
            const token = 'mock-wechat-token-' + Date.now();
            const userInfo = {
                username: 'wechat_user_' + Date.now(),
                nickname: '微信用户',
                avatar: '/logo.png',
                loginType: 'wechat',
                openid: 'mock_openid_' + Date.now()
            };

            userStore.setToken(token);
            userStore.setUserInfo(userInfo);

            ElMessage.success('微信登录成功！');
            wechatLoginLoading.value = false;
            closeDialog();

            // 触发登录成功事件
            emit('login-success', {
                isNewUser: false,
                userInfo
            });
        }, 2000);

    } catch (error) {
        ElMessage.error('微信登录失败，请重试');
        console.error('微信登录错误:', error);
        wechatLoginLoading.value = false;
    }
};

const toggleAuthMode = () => {
    isRegisterMode.value = !isRegisterMode.value;
    // 清空表单
    Object.keys(loginForm).forEach(key => {
        loginForm[key] = '';
    });
    if (loginFormRef.value) {
        loginFormRef.value.clearValidate();
    }
};

const showPasswordRecovery = () => {
    closeDialog();
    emit('show-recovery');
};

const closeDialog = () => {
    visible.value = false;
    // 重置表单
    Object.keys(loginForm).forEach(key => {
        loginForm[key] = '';
    });
    if (loginFormRef.value) {
        loginFormRef.value.clearValidate();
    }
};

// 监听 registerMode prop 变化
watch(() => props.registerMode, (newVal) => {
    isRegisterMode.value = newVal;
});
</script>

<style scoped>
/* 认证弹窗样式 - v0风格 */
:deep(.auth-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.auth-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.auth-dialog .el-dialog__body) {
    padding: 0;
}

.auth-container {
    padding: 32px 40px;
    background: white;
    display: flex;
    align-items: center;
    gap: 40px;
    min-height: 400px;
}

.auth-logo-section {
    flex: 1;
    text-align: center;
    padding-right: 20px;
}

.auth-logo {
    width: 80px;
    height: 80px;
    background: #18181b;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.logo-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.auth-main-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #18181b;
    letter-spacing: -0.025em;
}

.auth-main-subtitle {
    font-size: 0.95rem;
    margin: 0;
    color: #6b7280;
    font-weight: 400;
    line-height: 1.4;
}

.auth-form-wrapper {
    flex: 1;
    max-width: 280px;
    padding-left: 20px;
    border-left: 1px solid #f3f4f6;
}

.auth-form {
    margin-bottom: 20px;
}

.auth-form-item {
    margin-bottom: 14px;
    text-align: left;
}

.auth-form-item:last-child {
    margin-bottom: 0;
}

/* 强制覆盖Element Plus的默认样式 */
:deep(.auth-input) {
    --el-input-border-color: #6b7280 !important;
    --el-input-hover-border-color: #374151 !important;
    --el-input-focus-border-color: #18181b !important;
}

:deep(.auth-input .el-input__wrapper) {
    height: 44px !important;
    border-radius: 8px !important;
    border: 2px solid #6b7280 !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
    padding: 0 14px !important;
}

:deep(.auth-input .el-input__wrapper:hover) {
    border-color: #374151 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.auth-input.is-focus .el-input__wrapper) {
    border-color: #18181b !important;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.auth-input .el-input__inner) {
    font-size: 1rem;
    color: #18181b;
    font-weight: 400;
    height: 100%;
}

:deep(.auth-input .el-input__inner::placeholder) {
    color: #9ca3af;
    font-weight: 400;
}

.auth-submit-btn {
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

.auth-submit-btn:hover {
    background: #000000;
}

.auth-submit-btn:active {
    transform: scale(0.98);
}

/* 第三方登录样式 */
.auth-divider {
    position: relative;
    text-align: center;
    margin: 20px 0;
}

.auth-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
}

.divider-text {
    background: white;
    padding: 0 12px;
    color: #9ca3af;
    font-size: 0.875rem;
    position: relative;
    z-index: 1;
}

.third-party-login {
    margin-bottom: 20px;
}

.wechat-login-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: #07c160;
    border: 1px solid #07c160;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.wechat-login-btn:hover {
    background: #06ad56;
    border-color: #06ad56;
    color: white;
}

.wechat-login-btn:active {
    transform: scale(0.98);
}

.wechat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-mode-switch {
    text-align: center;
    margin-bottom: 16px;
}

.switch-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 4px;
}

.switch-link {
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

.switch-link:hover {
    color: #000000;
    background: transparent;
}

.auth-footer {
    text-align: center;
    border-top: 1px solid #f3f4f6;
    padding-top: 16px;
    margin-top: 16px;
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

/* 账号找回链接样式 */
.auth-recovery {
    text-align: center;
    margin-bottom: 16px;
}

.recovery-link {
    color: #6b7280;
    font-weight: 400;
    font-size: 0.875rem;
    padding: 0;
    text-decoration: none;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
}

.recovery-link:hover {
    color: #18181b;
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
