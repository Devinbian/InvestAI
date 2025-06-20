<template>
    <div class="onboarding-flow">
        <!-- 第1步：欢迎引导 -->
        <div v-if="currentStepName === 'welcome'" class="onboarding-step welcome-step">
            <div class="welcome-hero">
                <div class="hero-icon">🎯</div>
                <h1 class="hero-title">嗨！我是您的AI投资小助手</h1>
                <p class="hero-subtitle">接下来只需1分钟，让我更懂您的投资风格~</p>
                <div class="hero-features">
                    <div class="feature-item">
                        <span class="feature-icon">🔍</span>
                        <span class="feature-text">智能分析</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">💡</span>
                        <span class="feature-text">个性推荐</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">⚡</span>
                        <span class="feature-text">智能交易</span>
                    </div>
                </div>
                <el-button type="primary" size="large" @click="startAssessment" class="start-btn">
                    开始了解我
                </el-button>
            </div>
        </div>

        <!-- 步骤2-5: 投资偏好表单 -->
        <div v-if="isAssessmentStep" class="onboarding-step">
            <div class="form-container">
                <InvestmentPreferencesForm :currentStep="formStep" :preferencesForm="preferences"
                    @update:preferencesForm="handlePreferencesUpdate" @previous="goToPreviousStep" @next="goToNextStep"
                    @complete="goToNextStep" show-actions />
            </div>
        </div>

        <!-- 第6步：完成 -->
        <div v-if="currentStepName === 'complete'" class="onboarding-step complete-step">
            <div class="complete-container">
                <div class="complete-icon">🎉</div>
                <h1 class="complete-title">您的专属投资画像已生成!</h1>
                <p class="complete-subtitle">基于您的偏好，我们为您定制了如下投资策略起点：</p>
                <div class="summary-card-compact">
                    <div class="summary-row">
                        <div class="summary-item-compact">
                            <div class="item-header">
                                <span class="item-icon">{{ getExperienceIcon(preferences.experience) }}</span>
                                <span class="item-label">投资经验</span>
                            </div>
                            <div class="item-value">{{ getExperienceText(preferences.experience) }}</div>
                        </div>
                        <div class="summary-item-compact">
                            <div class="item-header">
                                <span class="item-icon">{{ getRiskLevelIcon(preferences.riskLevel) }}</span>
                                <span class="item-label">风险风格</span>
                            </div>
                            <div class="item-value">{{ getRiskLevelText(preferences.riskLevel) }}</div>
                        </div>
                    </div>
                    <div class="summary-row-full">
                        <div class="item-header">
                            <span class="item-icon">🎯</span>
                            <span class="item-label">重点关注</span>
                        </div>
                        <div class="item-value tags">
                            <span v-for="sector in preferences.sectors.subCategories" :key="sector" class="tag-new">{{
                                getSectorLabel(sector) }}</span>
                        </div>
                    </div>
                    <div class="summary-row-full">
                        <div class="item-header">
                            <span class="item-icon">🧠</span>
                            <span class="item-label">投资性格</span>
                        </div>
                        <div class="item-value tags">
                            <span v-for="(value, key) in preferences.userTraits" :key="key" class="tag-new">
                                {{ getTraitDescription(key, value) }}
                            </span>
                        </div>
                    </div>
                </div>
                <el-button type="primary" size="large" @click="finishOnboarding" class="finish-btn">
                    开启智能投资
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, toRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import InvestmentPreferencesForm from './InvestmentPreferencesForm.vue';

const emit = defineEmits(['complete']);
const router = useRouter();
const userStore = useUserStore();

// --- State Management ---
const STEPS = ['welcome', 'form-step-0', 'form-step-1', 'form-step-2', 'form-step-3', 'complete'];
const currentStepIndex = ref(0);

// --- Computed Properties ---
const currentStepName = computed(() => STEPS[currentStepIndex.value]);
const isAssessmentStep = computed(() => currentStepName.value.startsWith('form-step'));

// The current step number to pass to the form component (0, 1, 2, 3)
const formStep = computed(() => {
    if (isAssessmentStep.value) {
        return parseInt(currentStepName.value.split('-').pop());
    }
    return -1; // Not in a form step
});

// --- Form Data ---
const preferences = reactive({
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
        majorCategories: ['technology', 'emerging'],
        subCategories: ['internet', 'ai', 'new_energy']
    }
});

// --- Validation ---
const isStepValid = computed(() => {
    if (!isAssessmentStep.value) return false;

    switch (formStep.value) {
        case 0:
            return !!preferences.experience;
        case 1:
            return !!preferences.riskLevel;
        case 2:
            return true;
        case 3:
            return preferences.sectors.subCategories.length > 0;
        default:
            return false;
    }
});

// --- Navigation Functions ---
function startAssessment() {
    currentStepIndex.value = 1;
}

function goToNextStep() {
    if (currentStepIndex.value < STEPS.length - 1) {
        currentStepIndex.value++;
    }
}

function goToPreviousStep() {
    if (currentStepIndex.value > 1) {
        currentStepIndex.value--;
    } else if (currentStepName.value === 'form-step-0') {
        currentStepIndex.value = 0;
    }
}

function handlePreferencesUpdate(newPrefs) {
    Object.assign(preferences, newPrefs);
}

// --- Final Data Preparation & Emission ---
const summaryData = computed(() => {
    const riskLabel = getRiskLevelText(preferences.riskLevel);
    const finalPreferences = toRaw(preferences);

    return {
        preferences: {
            ...finalPreferences,
            completedAt: new Date().toISOString()
        },
        profile: {
            riskLabel: riskLabel,
            experienceLabel: getExperienceText(preferences.experience)
        }
    };
});

const finishOnboarding = () => {
    emit('complete', summaryData.value);
};


// --- Helper Functions for Summary Page ---
function getExperienceText(experience) {
    const map = {
        'beginner': '投资新手',
        'experienced': '有投资经验'
    };
    return map[experience] || '未设置';
}

function getExperienceIcon(experience) {
    const map = {
        'beginner': '🌱',
        'experienced': '📈'
    };
    return map[experience] || '🤔';
}

function getRiskLevelText(level) {
    const map = {
        'conservative': '保守型', 'stable': '稳健型', 'balanced': '平衡型',
        'growth': '成长型', 'aggressive': '激进型'
    };
    return map[level] || '未设置';
}

function getRiskLevelIcon(level) {
    const map = {
        'conservative': '🛡️',
        'stable': '🏦',
        'balanced': '⚖️',
        'growth': '🚀',
        'aggressive': '⚡'
    };
    return map[level] || '🤔';
}

const sectorLabels = {
    internet: '互联网', ai: '人工智能', new_energy: '新能源', software: '软件服务',
    hardware: '电子硬件', banking: '银行', insurance: '保险', securities: '证券',
    food_beverage: '食品饮料', retail: '零售', appliances: '家电', pharma: '医药制造',
    medical_devices: '医疗器械', manufacturing: '先进制造', materials: '基础材料',
    infrastructure: '基础设施', environmental: '环保', military: '军工'
};

function getSectorsSummary(sectors) {
    if (sectors && sectors.subCategories && sectors.subCategories.length > 0) {
        const names = sectors.subCategories.map(s => sectorLabels[s] || s);
        return names.slice(0, 5).join('、') + (names.length > 5 ? '...' : '');
    }
    return '未选择';
}

function getSectorLabel(sector) {
    return sectorLabels[sector] || sector;
}

const traitDefinitions = {
    risk_tolerance: [
        { value: 1, desc: '保守' }, { value: 2, desc: '偏保守' }, { value: 3, desc: '中性' }, { value: 4, desc: '偏进取' }, { value: 5, desc: '非常进取' }
    ],
    active_participation: [
        { value: 1, desc: '依赖AI' }, { value: 2, desc: 'AI辅助' }, { value: 3, desc: '自主决策' }, { value: 4, desc: '积极研究' }, { value: 5, 'desc': '主导策略' }
    ],
    learning_willingness: [
        { value: 1, desc: '无意学习' }, { value: 2, desc: '偶尔了解' }, { value: 3, desc: '愿意学习' }, { value: 4, desc: '主动研究' }, { value: 5, desc: '深度钻研' }
    ],
    strategy_dependency: [
        { value: 1, desc: '简单策略' }, { value: 2, desc: '常规策略' }, { value: 3, desc: '中等策略' }, { value: 4, desc: '复杂策略' }, { value: 5, desc: '高级策略' }
    ],
    trading_frequency: [
        { value: 1, desc: '长期持有' }, { value: 2, desc: '低频交易' }, { value: 3, desc: '中频交易' }, { value: 4, desc: '高频交易' }, { value: 5, desc: '超高频交易' }
    ],
    innovation_trial: [
        { value: 1, desc: '不试新' }, { value: 2, desc: '谨慎尝试' }, { value: 3, desc: '开放尝试' }, { value: 4, desc: '拥抱创新' }, { value: 5, desc: '积极试新' }
    ]
};

function getTraitDescription(traitId, value) {
    const trait = traitDefinitions[traitId];
    if (!trait) return '';
    const option = trait.find(opt => opt.value === value);
    return option ? option.desc : '';
}
</script>

<style scoped>
/* Main container for the entire flow */
.onboarding-flow {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    background-color: #f8fafc;
    padding: 20px;
    padding-top: 10vh;
    box-sizing: border-box;
}

/* Base for each step */
.onboarding-step {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Welcome Step */
.welcome-step {
    text-align: center;
    padding: 40px 20px;
}

.welcome-hero {
    background: white;
    padding: 40px 30px;
    border-radius: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.hero-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.hero-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 2rem;
}

.hero-features {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #334155;
    background-color: #f1f5f9;
    padding: 8px 16px;
    border-radius: 16px;
}

.start-btn {
    height: 50px;
    font-size: 1.1rem;
    border-radius: 12px;
    background-color: #18181b;
    border-color: #18181b;
}

.start-btn:hover {
    background-color: #3f3f46;
    border-color: #3f3f46;
}

/* Complete Step */
.complete-step {
    text-align: center;
}

.complete-container {
    background: white;
    padding: 40px 30px;
    border-radius: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.complete-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.complete-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.complete-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 1.5rem;
}

.summary-card-compact {
    background-color: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 2rem;
    text-align: left;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #f1f5f9;
}

.summary-row-full {
    padding-top: 1rem;
}

.summary-row-full+.summary-row-full {
    margin-top: 1rem;
}

.summary-item-compact {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.item-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.item-icon {
    font-size: 1.1rem;
}

.item-label {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 500;
}

.item-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    padding-left: 0;
}

.item-value.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-left: 0;
    margin-top: 0.25rem;
}

.tag-new {
    background-color: #f1f5f9;
    color: #334155;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid #e2e8f0;
}

.finish-btn {
    height: 50px;
    font-size: 1.1rem;
    border-radius: 12px;
    background-color: #18181b;
    border-color: #18181b;
}

.finish-btn:hover {
    background-color: #3f3f46;
    border-color: #3f3f46;
}

.form-container {
    background: white;
    border-radius: 24px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

/* Deep override for buttons inside the form */
.form-container :deep(.action-btn.primary) {
    background-color: #18181b;
    border-color: #18181b;
}

.form-container :deep(.action-btn.primary:hover) {
    background-color: #3f3f46;
    border-color: #3f3f46;
}
</style>
