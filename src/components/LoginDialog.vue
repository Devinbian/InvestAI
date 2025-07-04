<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="true"
        :width="dialogWidth" class="auth-dialog" :class="{ 'wechat-env': isWechat }" :z-index="500">
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
                            <svg width="40" height="40" viewBox="0 0 1024 1024" fill="currentColor">
                                <path
                                    d="M690.1 377.4c5.9 0 11.8 0.2 17.6 0.5-15.8-73.3-102.2-127.9-204.1-127.9-114.9 0-208.7 77.3-208.7 172.5 0 55.4 30.2 100.8 80.7 136.1l-20.2 60.5 70.4-35.2c25.1 5 45.2 10.1 70.4 10.1 6.5 0 13-0.3 19.4-0.8-4.1-14.1-6.4-28.9-6.4-44.2 0-88.8 75.1-160.6 180.9-160.6z m-114.3-41.9c15.1 0 25.1 10.1 25.1 25.1 0 15-10.1 25.1-25.1 25.1-15.1 0-30.2-10.1-30.2-25.1 0-15 15.1-25.1 30.2-25.1z m-125.7 50.2c-15.1 0-30.2-10.1-30.2-25.1 0-15 15.1-25.1 30.2-25.1 15 0 25.1 10.1 25.1 25.1 0 15-10.1 25.1-25.1 25.1z" />
                                <path
                                    d="M866.7 579.1c0-75.1-75.1-135.1-165.5-135.1-95.5 0-165.5 60-165.5 135.1 0 75.1 70 135.1 165.5 135.1 20.1 0 40.2-5 60.3-10.1l55.3 30.2-15.1-50.2c35.2-25.1 65.5-60.3 65.5-105z m-220.7-25.1c-10.1 0-20.1-10.1-20.1-20.1 0-10.1 10.1-20.1 20.1-20.1 10.1 0 20.1 10.1 20.1 20.1 0 10.1-10.1 20.1-20.1 20.1z m110.4 0c-10.1 0-20.1-10.1-20.1-20.1 0-10.1 10.1-20.1 20.1-20.1 10.1 0 20.1 10.1 20.1 20.1 0 10.1-10.1 20.1-20.1 20.1z" />
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import { login, register } from '@/api/api';
import { riskOptions, experienceOptions } from '../config/userPortrait';

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
const isWechat = ref(false);

// 响应式对话框宽度
const dialogWidth = computed(() => {
    if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 480) return '95%';
        if (width < 768) return '90%';
        if (width < 1024) return '600px';
        return '720px';
    }
    return '720px';
});

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

    await loginFormRef.value.validate(async (valid) => {
        if (valid) {
            loginLoading.value = true;
            try {
                let res = {};
                let isNewUser = false;
                if (isRegisterMode.value) {
                    // 注册操作
                    res = await register({
                        account: loginForm.username.trim(),
                        password: loginForm.password.trim(),
                        confirmPassword: loginForm.confirmPassword.trim(),
                        phone: loginForm.phone.trim()
                    });
                    isNewUser = true;
                } else {
                    // 登录操作
                    res = await login({
                        account: loginForm.username.trim(),
                        password: loginForm.password.trim()
                    });
                }

                if (res && res.data && res.data.success) {
                    let userPortrait = res.data.data.userPortrait || {};

                    // 关注板块
                    let sectors = JSON.parse(res.data.data.userPortrait?.focusIndustry || null) || [];
                    let majorCategories = [];
                    let subCategories = [];
                    sectors.forEach(item => {
                        majorCategories.push({ value: item.value, label: item.label });
                        subCategories = subCategories.concat(item.children);
                    });

                    // 对于新用户，不设置preferences，让他们进入引导流程
                    let preferences = null;
                    if (!isNewUser) {
                        // 只有老用户才从API获取偏好设置
                        // 检查是否有完整的偏好设置数据
                        if (userPortrait.investExperience && userPortrait.investStyle && userPortrait.completeUserPortraitFlag) {
                            preferences = {
                                experience: userPortrait.investExperience, // 投资经验
                                riskLevel: userPortrait.investStyle, // 投资风格
                                userTraits: {
                                    active_participation: userPortrait.involveLevel,
                                    innovation_trial: userPortrait.innovationAcceptance,
                                    learning_willingness: userPortrait.learnIntention,
                                    risk_tolerance: userPortrait.riskTolerance,
                                    strategy_dependency: userPortrait.strategyComplexity,
                                    trading_frequency: userPortrait.tradeFrequency,
                                },
                                sectors: {
                                    majorCategories: majorCategories,
                                    subCategories: subCategories,
                                    categories: sectors
                                },
                                completed: userPortrait.completeUserPortraitFlag, // 用户画像是否完成设置
                                currentStep: userPortrait.userPortraitStep, // 用户画像设置阶段，取值为0-4，0-未开始设置，4-全部完成设置
                            };
                        }
                    }

                    let userInfo = {
                        nickname: res.data.data.nickname,
                        phone: res.data.data.phone,
                        isNewUser: isNewUser,
                        token: res.data.data.token,
                        preferences: preferences
                    };
                    userStore.setUserInfo(userInfo);
                    userStore.setToken(res.data.data.token);

                    closeDialog();

                    emit('login-success', {
                        isNewUser: isNewUser,
                        userInfo: userInfo
                    });
                } else {
                    // 处理登录/注册失败的情况
                    ElMessage.error(res?.message || (isRegisterMode.value ? '注册失败，请重试' : '登录失败，请检查用户名和密码'));
                }
            } catch (error) {
                // 处理网络错误或其他异常
                console.error('登录/注册错误:', error);
                if (error.message && error.message.includes('CORS')) {
                    ElMessage.error('网络连接错误，请联系管理员解决跨域问题');
                } else {
                    ElMessage.error(isRegisterMode.value ? '注册失败，请重试' : '登录失败，请重试');
                }
            } finally {
                loginLoading.value = false;
            }
        }
    });
};

const handleWechatLogin = async () => {
    wechatLoginLoading.value = true;

    try {
        ElMessage.info('正在启动微信登录...');

        // 模拟微信登录API调用
        setTimeout(() => {
            const openid = 'mock_openid_' + Date.now();
            const token = 'mock-wechat-token-' + Date.now();

            // 检查是否是第一次微信登录
            // 通过检查本地存储中是否有该openid的记录来判断
            const wechatLoginHistory = JSON.parse(localStorage.getItem('wechat_login_history') || '[]');
            const isNewUser = !wechatLoginHistory.includes(openid);

            const userInfo = {
                username: 'wechat_user_' + Date.now(),
                nickname: '微信用户',
                avatar: '/logo.png',
                loginType: 'wechat',
                openid: openid,
                isNewUser: isNewUser
            };

            // 如果是第一次登录，记录该openid
            if (isNewUser) {
                wechatLoginHistory.push(openid);
                localStorage.setItem('wechat_login_history', JSON.stringify(wechatLoginHistory));
            }

            userStore.setToken(token);
            userStore.setUserInfo(userInfo);

            ElMessage.success('微信登录成功！');
            wechatLoginLoading.value = false;
            closeDialog();

            // 触发登录成功事件，传递是否为新用户的标识
            emit('login-success', {
                isNewUser: isNewUser,
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

// 完全移除键盘检测逻辑
// 对话框采用固定尺寸方案，不需要键盘检测

// 生命周期钩子 - 简化版
onMounted(() => {
    if (typeof window !== 'undefined') {
        // 检测微信环境（仅用于样式类名）
        const ua = navigator.userAgent.toLowerCase();
        isWechat.value = ua.indexOf('micromessenger') !== -1;

        console.log('对话框挂载完成，微信环境:', isWechat.value);
    }
});

onUnmounted(() => {
    console.log('对话框卸载');
});

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

/* 键盘激活时的样式 */
:deep(.auth-dialog.keyboard-active) {
    position: fixed !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin-top: 0 !important;
}

/* 移动端对话框样式 - 简化版 */
@media (max-width: 768px) {
    :deep(.auth-dialog) {
        width: 90% !important;
        max-width: 380px !important;
        margin: 0 !important;
        border-radius: 12px !important;
    }
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

/* 响应式布局 */
/* 平板端适配 (768px - 1024px) */
@media (max-width: 1024px) {
    .auth-container {
        padding: 24px 32px;
        gap: 32px;
        min-height: 350px;
    }

    .auth-logo-section {
        padding-right: 16px;
    }

    .logo-image {
        width: 60px;
        height: 60px;
    }

    .auth-main-title {
        font-size: 1.5rem;
    }

    .auth-main-subtitle {
        font-size: 0.9rem;
    }

    .auth-form-wrapper {
        padding-left: 16px;
    }
}

/* 手机端适配 (小于768px) */
@media (max-width: 768px) {
    :deep(.auth-dialog) {
        margin: 0 !important;
        border-radius: 12px !important;
    }

    .auth-container {
        flex-direction: column;
        padding: 20px 20px;
        gap: 16px;
        min-height: auto;
        text-align: center;
    }

    .auth-logo-section {
        padding-right: 0;
        margin-bottom: 0;
    }

    .logo-image {
        width: 50px;
        height: 50px;
    }

    .auth-main-title {
        font-size: 1.25rem;
        margin-bottom: 4px;
    }

    .auth-main-subtitle {
        font-size: 0.8rem;
        margin-bottom: 0;
    }

    .auth-form-wrapper {
        max-width: 100%;
        padding-left: 0;
        border-left: none;
        border-top: 1px solid #f3f4f6;
        padding-top: 16px;
    }

    .auth-form-item {
        margin-bottom: 20px;
    }

    :deep(.auth-input .el-input__wrapper) {
        height: 48px !important;
    }

    .auth-submit-btn {
        height: 48px;
        font-size: 1.05rem;
        margin-bottom: 16px;
    }

    .wechat-login-btn {
        height: 48px;
        font-size: 1.05rem;
    }

    .auth-divider {
        margin: 16px 0;
    }

    .auth-mode-switch {
        margin-bottom: 12px;
    }

    .auth-footer {
        padding-top: 12px;
        margin-top: 12px;
    }

    /* 容器样式保持简洁 */
    .auth-container {
        padding: 20px 20px !important;
        gap: 16px !important;
        min-height: auto !important;
        height: auto !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        background: white !important;
        text-align: center !important;
    }

    /* logo区域样式 */
    .auth-logo-section {
        display: block !important;
        padding-right: 0 !important;
        margin-bottom: 0 !important;
    }

    /* 表单区域样式 */
    .auth-form-wrapper {
        max-width: 100% !important;
        padding-left: 0 !important;
        border-left: none !important;
        border-top: 1px solid #f3f4f6 !important;
        padding-top: 16px !important;
    }
}

/* 超小屏幕适配 (小于480px) */
@media (max-width: 480px) {
    .auth-container {
        padding: 16px 16px;
        gap: 12px;
    }

    .logo-image {
        width: 45px;
        height: 45px;
    }

    .auth-main-title {
        font-size: 1.125rem;
    }

    .auth-main-subtitle {
        font-size: 0.75rem;
    }

    .auth-form-wrapper {
        padding-top: 12px;
    }

    .auth-form-item {
        margin-bottom: 20px;
    }

    :deep(.auth-input .el-input__wrapper) {
        height: 44px !important;
        padding: 0 12px !important;
    }

    .auth-submit-btn {
        height: 44px;
        font-size: 1rem;
        margin-bottom: 12px;
    }

    .wechat-login-btn {
        height: 44px;
        font-size: 1rem;
    }

    .auth-divider {
        margin: 12px 0;
    }

    .switch-text,
    .switch-link {
        font-size: 0.8rem;
    }

    .recovery-link {
        font-size: 0.8rem;
    }

    .cancel-btn {
        font-size: 0.8rem;
    }

    /* 超小屏幕下保持正常样式 - 不需要键盘激活特殊处理 */
}

/* 横屏手机适配 */
@media (max-height: 600px) and (max-width: 768px) {
    .auth-container {
        flex-direction: row;
        padding: 16px 20px;
        gap: 20px;
        min-height: auto;
    }

    .auth-logo-section {
        flex: 0.6;
        padding-right: 16px;
        border-right: 1px solid #f3f4f6;
        text-align: left;
    }

    .logo-image {
        width: 40px;
        height: 40px;
    }

    .auth-main-title {
        font-size: 1.125rem;
        margin-bottom: 4px;
    }

    .auth-main-subtitle {
        font-size: 0.75rem;
    }

    .auth-form-wrapper {
        flex: 1.4;
        padding-left: 16px;
        padding-top: 0;
        border-top: none;
        border-left: none;
    }

    .auth-form-item {
        margin-bottom: 20px;
    }

    :deep(.auth-input .el-input__wrapper) {
        height: 40px !important;
    }

    .auth-submit-btn {
        height: 40px;
        font-size: 0.9rem;
        margin-bottom: 16px;
    }

    .wechat-login-btn {
        height: 40px;
        font-size: 0.9rem;
    }

    .auth-divider {
        margin: 16px 0;
    }

    .auth-mode-switch {
        margin-bottom: 12px;
    }

    .auth-footer {
        padding-top: 12px;
        margin-top: 12px;
    }
}

/* 确保Element Plus组件的z-index高于登录弹窗 */
:global(.el-message) {
    z-index: 3000 !important;
}

:global(.el-message-box) {
    z-index: 3000 !important;
}

:global(.el-tooltip__popper) {
    z-index: 2000 !important;
}

:global(.el-notification) {
    z-index: 4000 !important;
}

:global(.el-loading-mask) {
    z-index: 2500 !important;
}

:global(.el-overlay) {
    z-index: 2000 !important;
}
</style>
