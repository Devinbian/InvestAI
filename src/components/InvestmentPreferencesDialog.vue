<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false" width="1000px"
        class="preferences-dialog" top="10vh">
        <template #header>
            <div></div>
        </template>

        <InvestmentPreferencesForm v-if="visible" :currentStep="currentStep" :preferencesForm="localPreferences"
            @update:preferencesForm="handlePreferencesUpdate"
            @update:currentStep="(newStep) => currentStep = newStep" />

        <div class="preferences-actions">
            <el-button v-if="currentStep > 0" class="preferences-back-btn" @click="previousStep">
                上一步
            </el-button>

            <el-button v-if="currentStep < totalSteps - 1" class="preferences-next-btn" type="primary" @click="nextStep"
                :disabled="!isStepValid">
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
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
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

// Reset state when dialog is closed
watch(visible, (newValue) => {
    if (!newValue) {
        // Only reset if the dialog is being hidden
        setTimeout(() => {
            currentStep.value = 0;
            Object.assign(localPreferences, {
                riskLevel: '',
                experience: '',
                userTraits: { risk_tolerance: 3, active_participation: 3, learning_willingness: 3, strategy_dependency: 2, trading_frequency: 2, innovation_trial: 3 },
                sectors: { majorCategories: [], subCategories: [] }
            });
        }, 200); // Delay to allow fade-out animation
    }
});
</script>

<style scoped>
/* Scoped styles for the dialog container and buttons */
.preferences-dialog :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
    max-height: 90vh;
}

.preferences-dialog :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
}

.preferences-dialog :deep(.el-dialog__body) {
    padding: 0;
}

.preferences-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 16px 24px 24px;
    border-top: 1px solid #f3f4f6;
    background-color: white;
}

.preferences-back-btn,
.preferences-next-btn,
.preferences-submit-btn,
.preferences-skip-btn {
    min-width: 90px;
    height: 38px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
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
    border: 2px solid #18181b;
    color: white;
    font-weight: 600;
}

.preferences-next-btn:hover,
.preferences-submit-btn:hover {
    background: #000000;
    border-color: #000000;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 24, 27, 0.25);
}

.preferences-next-btn:disabled,
.preferences-submit-btn:disabled {
    background: #e5e7eb;
    border-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.preferences-skip-btn {
    background: transparent;
    border: none;
    color: #6b7280;
}

.preferences-skip-btn:hover {
    background: #f3f4f6;
    color: #374151;
}
</style>
