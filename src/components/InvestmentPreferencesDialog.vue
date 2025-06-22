<template>
    <!-- PC端弹窗 -->
    <el-dialog v-if="!isMobile" v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false"
        :width="dialogWidth" class="preferences-dialog" append-to-body>
        <template #header>
            <div></div>
        </template>

        <div class="preferences-container">
            <!-- LOGO和标题区域 -->
            <div class="preferences-header">
                <div class="preferences-logo">
                    <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                </div>
                <h1 class="preferences-title">完善投资偏好</h1>
                <p class="preferences-subtitle">帮助我们为您提供更精准的投资建议</p>

                <!-- 步骤指示器 -->
                <div class="step-indicator">
                    <div v-for="(step, index) in totalSteps" :key="index" class="step-dot" :class="{
                        active: currentStep === index,
                        completed: currentStep > index,
                    }">
                        <span v-if="currentStep > index">✓</span>
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                </div>
            </div>

            <!-- 表单内容区域 -->
            <div class="preferences-form-wrapper">
                <InvestmentPreferencesForm v-if="visible" :currentStep="currentStep" :preferencesForm="localPreferences"
                    @update:preferencesForm="handlePreferencesUpdate"
                    @update:currentStep="(newStep) => currentStep = newStep" />
            </div>

            <!-- 底部操作按钮 -->
            <div class="preferences-actions">
                <el-button v-if="currentStep > 0" class="preferences-back-btn" @click="previousStep">
                    上一步
                </el-button>

                <el-button v-if="currentStep < totalSteps - 1" class="preferences-next-btn" type="primary"
                    @click="nextStep" :disabled="!isStepValid">
                    下一步
                </el-button>

                <el-button v-if="currentStep === totalSteps - 1" class="preferences-submit-btn" type="primary"
                    @click="handlePreferencesSubmit" :loading="preferencesLoading" :disabled="!isStepValid">
                    完成设置
                </el-button>

                <el-button class="preferences-skip-btn" @click="skipPreferences">
                    跳过
                </el-button>
            </div>
        </div>
    </el-dialog>

    <!-- 移动端原生弹窗 -->
    <div v-else-if="visible" class="mobile-preferences-overlay" @click="skipPreferences">
        <div class="mobile-preferences-container" @click.stop>
            <!-- 移动端头部 -->
            <div class="mobile-preferences-header">
                <div class="header-drag-handle"></div>
                <div class="header-title-bar">
                    <h3>完善投资偏好</h3>
                    <button class="mobile-close-btn" @click="skipPreferences">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </button>
                </div>
                <p class="header-subtitle">帮助我们为您提供更精准的投资建议</p>

                <!-- 步骤指示器 -->
                <div class="mobile-step-indicator">
                    <div v-for="(step, index) in totalSteps" :key="index" class="mobile-step-dot" :class="{
                        active: currentStep === index,
                        completed: currentStep > index,
                    }">
                        <span v-if="currentStep > index">✓</span>
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                </div>
            </div>

            <!-- 移动端表单内容区域 -->
            <div class="mobile-preferences-content">
                <InvestmentPreferencesForm v-if="visible" :currentStep="currentStep" :preferencesForm="localPreferences"
                    @update:preferencesForm="handlePreferencesUpdate"
                    @update:currentStep="(newStep) => currentStep = newStep" />
            </div>

            <!-- 移动端底部操作按钮 -->
            <div class="mobile-preferences-actions">
                <button v-if="currentStep > 0" class="mobile-back-btn" @click="previousStep">
                    上一步
                </button>

                <button v-if="currentStep < totalSteps - 1" class="mobile-next-btn" @click="nextStep"
                    :disabled="!isStepValid">
                    下一步
                </button>

                <button v-if="currentStep === totalSteps - 1" class="mobile-submit-btn" @click="handlePreferencesSubmit"
                    :disabled="!isStepValid || preferencesLoading">
                    <span v-if="preferencesLoading">提交中...</span>
                    <span v-else>完成设置</span>
                </button>

                <button class="mobile-skip-btn" @click="skipPreferences">
                    跳过
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import InvestmentPreferencesForm from './InvestmentPreferencesForm.vue';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'preferences-completed', 'preferences-skipped']);

// Store
const userStore = useUserStore();

// 响应式检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024);

// 对话框响应式配置
const dialogWidth = computed(() => {
    if (isMobile.value) return '95%';
    if (isTablet.value) return '85%';
    return '900px';
});

// Reactive data - 首先定义所有响应式变量
const visible = computed({
    get: () => {
        console.log('InvestmentPreferencesDialog visible getter:', props.modelValue);
        return props.modelValue;
    },
    set: (value) => {
        console.log('InvestmentPreferencesDialog visible setter:', value);
        emit('update:modelValue', value);
    }
});

// 调整弹窗位置的函数（简化版）
const adjustDialogPosition = () => {
    // 简化处理，主要依靠CSS
    if (!visible.value) return;

    nextTick(() => {
        const dialogElement = document.querySelector('.preferences-dialog');
        if (dialogElement) {
            // 简单的动态调整，确保弹窗在视口内
            const rect = dialogElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (rect.height > viewportHeight * 0.9) {
                dialogElement.style.marginTop = '20px';
                dialogElement.style.marginBottom = '20px';
            }
        }
    });
};

// 窗口大小监听
const handleResize = () => {
    windowWidth.value = window.innerWidth;
    // 延迟调整弹窗位置，确保DOM更新完成
    nextTick(() => {
        adjustDialogPosition();
    });
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// 定义所有基本响应式变量
const preferencesLoading = ref(false);
const currentStep = ref(0);
const totalSteps = 4; // Total number of steps in the form

// 监听弹窗显示状态
watch(visible, (newValue) => {
    console.log('Dialog visibility changed:', newValue);
    if (newValue) {
        // 弹窗打开时初始化偏好设置
        initializePreferences();
        setTimeout(() => {
            adjustDialogPosition();
        }, 100);
    } else {
        // 弹窗关闭时重置步骤
        setTimeout(() => {
            currentStep.value = 0;
        }, 200);
    }
});

// 定义偏好设置数据
const localPreferences = reactive({
    riskLevel: '',
    experience: '',
    userTraits: {
        risk_tolerance: 3,
        active_participation: 3,
        learning_willingness: 3,
        strategy_dependency: 2,
        trading_frequency: 2,
        innovation_trial: 3
    },
    sectors: {
        majorCategories: [],
        subCategories: []
    }
});

// Computed property to check if the current step is valid for proceeding
const isStepValid = computed(() => {
    switch (currentStep.value) {
        case 0:
            return localPreferences.experience !== '';
        case 1:
            return localPreferences.riskLevel !== '';
        case 2:
            return true;
        case 3:
            // Step 4 (sectors) requires at least one sub-category
            return localPreferences.sectors.subCategories.length > 0;
        default:
            return false;
    }
});

// 监听步骤变化
watch(currentStep, () => {
    setTimeout(() => {
        adjustDialogPosition();
    }, 100);
});

// Initialize with existing user preferences when dialog opens
const initializePreferences = () => {
    const existingPreferences = userStore.userInfo?.preferences;
    console.log('Loading existing preferences:', existingPreferences);

    if (existingPreferences) {
        // Load existing preferences
        Object.assign(localPreferences, {
            riskLevel: existingPreferences.riskLevel || '',
            experience: existingPreferences.experience || '',
            userTraits: {
                risk_tolerance: existingPreferences.userTraits?.risk_tolerance || 3,
                active_participation: existingPreferences.userTraits?.active_participation || 3,
                learning_willingness: existingPreferences.userTraits?.learning_willingness || 3,
                strategy_dependency: existingPreferences.userTraits?.strategy_dependency || 2,
                trading_frequency: existingPreferences.userTraits?.trading_frequency || 2,
                innovation_trial: existingPreferences.userTraits?.innovation_trial || 3
            },
            sectors: {
                majorCategories: existingPreferences.sectors?.majorCategories || [],
                subCategories: existingPreferences.sectors?.subCategories || []
            }
        });
        console.log('Loaded preferences:', localPreferences);
    } else {
        // Initialize with default values for new users
        Object.assign(localPreferences, {
            riskLevel: '',
            experience: '',
            userTraits: { risk_tolerance: 3, active_participation: 3, learning_willingness: 3, strategy_dependency: 2, trading_frequency: 2, innovation_trial: 3 },
            sectors: { majorCategories: [], subCategories: [] }
        });
        console.log('No existing preferences found, using defaults');
    }
};

function handlePreferencesUpdate(newPrefs) {
    Object.assign(localPreferences, newPrefs);
}

// Methods
const nextStep = () => {
    if (isStepValid.value && currentStep.value < totalSteps - 1) {
        currentStep.value++;
    }
};

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
};

const handlePreferencesSubmit = async () => {
    if (!isStepValid.value) return;
    preferencesLoading.value = true;

    setTimeout(() => {
        const preferences = {
            ...localPreferences,
            completedAt: new Date().toISOString()
        };

        const currentUser = userStore.userInfo;
        userStore.setUserInfo({
            ...currentUser,
            preferences
        });

        localStorage.setItem('onboardingCompleted', 'true');
        ElMessage.success('投资偏好设置完成！');
        visible.value = false;
        preferencesLoading.value = false;
        currentStep.value = 0; // Reset for next time

        emit('preferences-completed', preferences);
    }, 1000);
};

const skipPreferences = () => {
    visible.value = false;
    currentStep.value = 0;
    ElMessage.info('您可以稍后在设置中完善投资偏好');
    emit('preferences-skipped');
};

// Watch for dialog open/close
watch(visible, (newValue) => {
    if (newValue) {
        // Dialog is opening - load existing preferences
        initializePreferences();
    } else {
        // Dialog is closing - reset step
        setTimeout(() => {
            currentStep.value = 0;
        }, 200); // Delay to allow fade-out animation
    }
});
</script>

<style scoped>
/* 投资偏好弹窗样式 - 参考登录弹窗设计 */
:deep(.preferences-dialog) {
    border-radius: 24px !important;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

/* 强制覆盖Element Plus的默认样式 */
:deep(.el-dialog.preferences-dialog) {
    border-radius: 24px !important;
}

:deep(.preferences-dialog.el-dialog) {
    border-radius: 24px !important;
}

/* 针对Element Plus的具体DOM结构 */
:deep(.el-overlay .preferences-dialog) {
    border-radius: 24px !important;
}

:deep(.preferences-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.preferences-dialog .el-dialog__body) {
    padding: 0;
    overflow: hidden;
}

/* 移动端底部弹出样式 */
@media (max-width: 767px) {
    :deep(.preferences-dialog.mobile-bottom-sheet) {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 85vh !important;
        max-height: 85vh !important;
        margin: 0 !important;
        border-radius: 20px 20px 0 0 !important;
        position: fixed !important;
        bottom: 0 !important;
        top: auto !important;
        left: 0 !important;
        right: 0 !important;
        transform: none !important;
        animation: slideUpFromBottom 0.3s ease-out !important;
    }

    :deep(.el-dialog.preferences-dialog.mobile-bottom-sheet) {
        border-radius: 20px 20px 0 0 !important;
        margin: 0 !important;
        position: fixed !important;
        bottom: 0 !important;
        top: auto !important;
        left: 0 !important;
        transform: none !important;
    }

    :deep(.preferences-dialog.mobile-bottom-sheet.el-dialog) {
        border-radius: 20px 20px 0 0 !important;
    }

    /* 移动端底部弹出动画 */
    @keyframes slideUpFromBottom {
        from {
            transform: translateY(100%);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    /* 移动端遮罩层优化 */
    :deep(.el-overlay) {
        backdrop-filter: blur(4px);
        background-color: rgba(0, 0, 0, 0.4);
    }
}

/* PC端弹窗 */
@media (min-width: 768px) {
    :deep(.preferences-dialog) {
        width: 90% !important;
        max-width: 1200px !important;
        max-height: calc(100vh - 40px) !important;
        margin: 20px auto !important;
    }
}



.preferences-container {
    padding: 20px 16px;
    background: white;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

/* 移动端进一步优化内边距 */
@media (max-width: 767px) {
    .preferences-container {
        padding: 0 16px 20px 16px;
        height: 100%;
        border-radius: 20px 20px 0 0;
    }
}

/* PC端增加内容宽度，减少左右边距 */
@media (min-width: 768px) {
    .preferences-container {
        padding: 24px 20px;
        max-width: none;
    }
}

.preferences-header {
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
}

/* 移动端header优化 */
@media (max-width: 767px) {
    .preferences-header {
        margin-bottom: 12px;
        padding: 12px 0 12px 0;
        border-bottom: 1px solid #f3f4f6;
    }
}

.preferences-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

/* 移动端logo优化 */
@media (max-width: 767px) {
    .preferences-logo {
        margin-bottom: 6px;
    }
}

.logo-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 确保对话框显示在最顶层 */
:deep(.el-dialog) {
    z-index: 9999 !important;
}

:deep(.el-overlay) {
    z-index: 9998 !important;
}

.preferences-dialog {
    z-index: 10000 !important;
}

/* 移动端logo尺寸优化 */
@media (max-width: 767px) {
    .logo-image {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        padding: 4px;
    }
}

.preferences-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 6px 0;
    color: #18181b;
    letter-spacing: -0.025em;
}

/* 移动端标题优化 */
@media (max-width: 767px) {
    .preferences-title {
        font-size: 1.25rem;
        margin: 0 0 4px 0;
    }
}

.preferences-subtitle {
    font-size: 0.875rem;
    margin: 0 0 12px 0;
    color: #6b7280;
    font-weight: 400;
    line-height: 1.4;
}

/* 移动端副标题优化 */
@media (max-width: 767px) {
    .preferences-subtitle {
        font-size: 0.8rem;
        margin: 0 0 8px 0;
    }
}

/* 步骤指示器 - 改为黑色主题 */
.step-indicator {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 0;
}

/* 移动端指示器优化 */
@media (max-width: 767px) {
    .step-indicator {
        gap: 8px;
    }
}

.step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid #e5e7eb;
    background: #f9fafb;
    color: #9ca3af;
}

/* 移动端步骤圆点优化 */
@media (max-width: 767px) {
    .step-dot {
        width: 28px;
        height: 28px;
        font-size: 0.7rem;
    }
}

.step-dot.active {
    background: #18181b;
    border-color: #18181b;
    color: white;
    transform: scale(1.05);
}

.step-dot.completed {
    background: #374151;
    border-color: #374151;
    color: white;
}

.preferences-form-wrapper {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.preferences-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px 0 0 0;
    margin-top: auto;
    flex-shrink: 0;
    border-top: 1px solid #f3f4f6;
}

/* 移动端底部按钮优化 */
@media (max-width: 767px) {
    .preferences-actions {
        padding: 16px 0 0 0;
        gap: 8px;
    }
}

/* 移动端按钮优化 */
@media (max-width: 767px) {
    .preferences-actions .el-button {
        flex: 1;
        min-width: 0;
        max-width: 120px;
        padding: 10px 16px;
        font-size: 0.875rem;
    }
}

.preferences-back-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
    font-weight: 500;
}

.preferences-back-btn:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #4b5563;
}

.preferences-next-btn,
.preferences-submit-btn {
    background: #18181b;
    border-color: #18181b;
    color: white;
    font-weight: 500;
}

.preferences-next-btn:hover,
.preferences-submit-btn:hover {
    background: #374151;
    border-color: #374151;
}

.preferences-skip-btn {
    background: transparent;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    font-weight: 400;
}

.preferences-skip-btn:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #4b5563;
}

/* 移动端安全区域适配 */
@media (max-width: 767px) {
    .preferences-actions {
        padding-bottom: env(safe-area-inset-bottom, 0);
    }
}

/* ================ 移动端原生弹窗样式 ================ */
.mobile-preferences-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.4) !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    animation: fadeIn 0.2s ease-out !important;
}

.mobile-preferences-container {
    width: 100% !important;
    max-width: 100vw !important;
    height: 95vh !important;
    background: #ffffff !important;
    border-radius: 16px 16px 0 0 !important;
    overflow: hidden !important;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
    animation: slideUpModal 0.3s ease-out !important;
    display: flex !important;
    flex-direction: column !important;
}

/* 移动端头部 */
.mobile-preferences-header {
    flex-shrink: 0 !important;
    padding: 12px 20px 16px 20px !important;
    background: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.header-drag-handle {
    width: 40px !important;
    height: 4px !important;
    background: #d1d5db !important;
    border-radius: 2px !important;
    margin: 0 auto 16px auto !important;
}

.header-title-bar {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 8px !important;
}

.header-title-bar h3 {
    font-size: 1.125rem !important;
    font-weight: 600 !important;
    color: #18181b !important;
    margin: 0 !important;
}

.mobile-close-btn {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    background: #f8fafc !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #6b7280 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.mobile-close-btn:active {
    background: #f1f5f9 !important;
    transform: scale(0.95) !important;
}

.header-subtitle {
    font-size: 0.8rem !important;
    color: #6b7280 !important;
    margin: 0 0 12px 0 !important;
    line-height: 1.4 !important;
}

/* 移动端步骤指示器 */
.mobile-step-indicator {
    display: flex !important;
    justify-content: center !important;
    gap: 8px !important;
    margin: 0 !important;
}

.mobile-step-dot {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0.7rem !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
    border: 2px solid #e5e7eb !important;
    background: #f9fafb !important;
    color: #9ca3af !important;
}

.mobile-step-dot.active {
    background: #18181b !important;
    border-color: #18181b !important;
    color: white !important;
    transform: scale(1.05) !important;
}

.mobile-step-dot.completed {
    background: #374151 !important;
    border-color: #374151 !important;
    color: white !important;
}

/* 移动端内容区域 */
.mobile-preferences-content {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 0 !important;
}

/* 移动端底部按钮 */
.mobile-preferences-actions {
    display: flex !important;
    justify-content: center !important;
    gap: 8px !important;
    padding: 16px 20px !important;
    padding-bottom: calc(16px + env(safe-area-inset-bottom, 0)) !important;
    margin-top: auto !important;
    flex-shrink: 0 !important;
    border-top: 1px solid #f3f4f6 !important;
    background: #ffffff !important;
}

.mobile-back-btn,
.mobile-next-btn,
.mobile-submit-btn,
.mobile-skip-btn {
    flex: 1 !important;
    max-width: 120px !important;
    padding: 12px 16px !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    border: none !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.mobile-back-btn {
    background: #f3f4f6 !important;
    color: #6b7280 !important;
}

.mobile-back-btn:active {
    background: #e5e7eb !important;
    transform: scale(0.98) !important;
}

.mobile-next-btn,
.mobile-submit-btn {
    background: #18181b !important;
    color: white !important;
}

.mobile-next-btn:active,
.mobile-submit-btn:active {
    background: #374151 !important;
    transform: scale(0.98) !important;
}

.mobile-next-btn:disabled,
.mobile-submit-btn:disabled {
    background: #9ca3af !important;
    cursor: not-allowed !important;
    transform: none !important;
}

.mobile-skip-btn {
    background: transparent !important;
    color: #6b7280 !important;
    border: 1px solid #e5e7eb !important;
}

.mobile-skip-btn:active {
    background: #f9fafb !important;
    transform: scale(0.98) !important;
}

/* 动画定义 */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUpModal {
    from {
        transform: translateY(100%);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>

<!-- 全局样式来强制覆盖Element Plus -->
<style>
.preferences-dialog {
    border-radius: 24px !important;
}

.el-dialog.preferences-dialog {
    border-radius: 24px !important;
}

@media (max-width: 767px) {
    .preferences-dialog {
        border-radius: 20px !important;
    }

    .el-dialog.preferences-dialog {
        border-radius: 20px !important;
    }
}
</style>
