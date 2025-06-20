<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false"
        :width="dialogWidth" class="preferences-dialog">
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
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
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

// 窗口大小监听
const handleResize = () => {
    windowWidth.value = window.innerWidth;
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

// Reactive data
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const preferencesLoading = ref(false);
const currentStep = ref(0);
const totalSteps = 4; // Total number of steps in the form

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

function handlePreferencesUpdate(newPrefs) {
    Object.assign(localPreferences, newPrefs);
}

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

// Initialize preferences on component mount if dialog is already visible
if (visible.value) {
    initializePreferences();
}
</script>

<style scoped>
/* 投资偏好弹窗样式 - 参考登录弹窗设计 */
:deep(.preferences-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.preferences-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.preferences-dialog .el-dialog__body) {
    padding: 0;
    overflow: hidden;
}

/* 移动端弹窗优化 - 减少间距，充分利用屏幕空间 */
@media (max-width: 767px) {
    :deep(.preferences-dialog) {
        margin: 8px !important;
        width: calc(100vw - 16px) !important;
        max-width: none !important;
        max-height: calc(100vh - 16px) !important;
        border-radius: 12px;
    }
}

/* PC端弹窗居中但稍微向上 */
@media (min-width: 768px) {
    :deep(.preferences-dialog) {
        margin-top: 8vh !important;
        margin-bottom: 8vh !important;
        max-height: 84vh !important;
        width: 90% !important;
        max-width: 1200px !important;
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
        padding: 16px 12px;
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
        padding-bottom: 8px;
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
    border-top: 1px solid #f3f4f6;
    margin-top: 12px;
    flex-shrink: 0;
}

/* 移动端操作按钮优化 */
@media (max-width: 767px) {
    .preferences-actions {
        padding: 10px 0 0 0;
        margin-top: 10px;
        gap: 8px;
    }
}

.preferences-back-btn,
.preferences-next-btn,
.preferences-submit-btn,
.preferences-skip-btn {
    min-width: 80px;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

/* 移动端按钮优化 */
@media (max-width: 767px) {

    .preferences-back-btn,
    .preferences-next-btn,
    .preferences-submit-btn,
    .preferences-skip-btn {
        min-width: 70px;
        height: 36px;
        font-size: 0.85rem;
        border-radius: 6px;
    }
}

.preferences-back-btn {
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
}

.preferences-back-btn:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    color: #374151;
}

.preferences-next-btn,
.preferences-submit-btn {
    background: #18181b;
    border-color: #18181b;
    color: white;
}

.preferences-next-btn:hover,
.preferences-submit-btn:hover {
    background: #000000;
    border-color: #000000;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 24, 27, 0.4);
}

.preferences-skip-btn {
    background: transparent;
    border: 2px solid transparent;
    color: #9ca3af;
}

.preferences-skip-btn:hover {
    color: #6b7280;
    background: #f9fafb;
}
</style>
