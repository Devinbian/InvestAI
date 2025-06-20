<template>
    <div class="onboarding-flow" :class="[
        `theme-${currentTheme}`,
        { 'is-mobile': deviceInfo.isMobile },
        { 'is-tablet': deviceInfo.isTablet },
        { 'is-touch': deviceInfo.isTouch },
        { 'prefers-reduced-motion': deviceInfo.prefersReducedMotion },
        { 'prefers-dark': deviceInfo.prefersDark }
    ]">
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
import { ref, reactive, computed, toRaw, onMounted, watch } from 'vue';
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

// 动态主题系统 - 根据用户偏好调整界面
const currentTheme = ref('default');
const userPersonality = computed(() => {
    const riskLevel = preferences.riskLevel;
    const traits = preferences.userTraits;

    // 基于用户特征计算个性化主题
    if (riskLevel === 'aggressive' && traits.innovation_trial >= 4) {
        return 'dynamic'; // 动感主题
    } else if (riskLevel === 'conservative' && traits.risk_tolerance <= 2) {
        return 'calm'; // 沉稳主题
    } else if (traits.learning_willingness >= 4) {
        return 'vibrant'; // 活力主题
    } else {
        return 'default'; // 默认主题
    }
});

// 监听用户偏好变化，动态调整主题
watch([() => preferences.riskLevel, () => preferences.userTraits], () => {
    currentTheme.value = userPersonality.value;
    applyThemeToDocument();
}, { deep: true });

// 应用主题到文档
const applyThemeToDocument = () => {
    const root = document.documentElement;
    root.classList.remove('theme-default', 'theme-dynamic', 'theme-calm', 'theme-vibrant');
    root.classList.add(`theme-${currentTheme.value}`);
};

// 检测设备和用户偏好
const deviceInfo = reactive({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    prefersReducedMotion: false,
    prefersDark: false
});

const detectDeviceInfo = () => {
    deviceInfo.isMobile = window.innerWidth <= 768;
    deviceInfo.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    deviceInfo.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    deviceInfo.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    deviceInfo.prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
};

onMounted(() => {
    detectDeviceInfo();
    applyThemeToDocument();

    // 监听屏幕变化
    window.addEventListener('resize', detectDeviceInfo);

    // 监听主题偏好变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectDeviceInfo);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', detectDeviceInfo);
});


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
    /* 移动端支持 */
    -webkit-overflow-scrolling: touch;
    overflow-y: auto;
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
    /* 移动端阴影优化 */
    transition: all 0.3s ease;
}

.hero-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    /* 添加动画效果 */
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.hero-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    /* 渐变色标题 */
    background: linear-gradient(135deg, #18181b, #374151);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.hero-features {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
    /* 移动端自动换行 */
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
    /* 移动端触摸优化 */
    transition: all 0.2s ease;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.feature-item:hover {
    background-color: #e2e8f0;
    transform: translateY(-2px);
}

.start-btn {
    height: 50px;
    font-size: 1.1rem;
    border-radius: 12px;
    background-color: #18181b;
    border-color: #18181b;
    /* 触摸优化 */
    min-width: 200px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.start-btn:hover {
    background-color: #3f3f46;
    border-color: #3f3f46;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(24, 24, 27, 0.15);
}

.start-btn:active {
    transform: translateY(0);
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
    /* 庆祝动画 */
    animation: bounce 1s ease-in-out;
}

@keyframes bounce {

    0%,
    20%,
    53%,
    80%,
    100% {
        transform: translateY(0);
    }

    40%,
    43% {
        transform: translateY(-15px);
    }

    70% {
        transform: translateY(-8px);
    }

    90% {
        transform: translateY(-3px);
    }
}

.complete-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #18181b, #059669);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.complete-subtitle {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 1.5rem;
    line-height: 1.6;
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
    /* 移动端优化 */
    transition: all 0.3s ease;
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
    /* 移动端触摸优化 */
    transition: all 0.2s ease;
    cursor: pointer;
    user-select: none;
}

.tag-new:hover {
    background-color: #e2e8f0;
    transform: translateY(-1px);
}

.finish-btn {
    height: 50px;
    font-size: 1.1rem;
    border-radius: 12px;
    background-color: #18181b;
    border-color: #18181b;
    min-width: 200px;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.finish-btn:hover {
    background-color: #3f3f46;
    border-color: #3f3f46;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(24, 24, 27, 0.15);
}

.finish-btn:active {
    transform: translateY(0);
}

.form-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    overflow: visible;
    /* 确保内容和按钮都能正确显示 */
    display: flex;
    flex-direction: column;
    /* 高度自适应，上下添加安全间隔 */
    min-height: auto;
    max-height: calc(100vh - 120px);
    /* 上下各60px安全间隔 */
    margin: 60px 0;
    padding: 30px 0;
    /* 上下安全间距 */
    /* 移动端滚动优化 */
    -webkit-overflow-scrolling: touch;
}

/* Deep override for buttons inside the form */
.form-container :deep(.action-btn.primary) {
    background-color: #18181b;
    border-color: #18181b;
    transition: all 0.2s ease;
}

.form-container :deep(.action-btn.primary:hover) {
    background-color: #3f3f46;
    border-color: #3f3f46;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 24, 27, 0.15);
}

.form-container :deep(.action-buttons) {
    flex-shrink: 0;
    margin-top: auto;
    /* 确保按钮能够使用全宽并有正确的左右间距 */
    margin-left: -20px;
    /* 抵消form-container的内边距 */
    margin-right: -20px;
    /* 抵消form-container的内边距 */
    width: calc(100% + 40px);
    /* 补偿被抵消的宽度 */
}

/* 移动端专用优化 */
@media (max-width: 768px) {
    .onboarding-flow {
        padding: 12px;
        padding-top: 3vh;
        /* 减少顶部间距 */
        padding-bottom: 3vh;
        /* 添加底部安全间距 */
        min-height: auto;
        height: auto;
    }

    .onboarding-step {
        width: 100%;
        max-width: none;
    }

    /* 欢迎页面移动端优化 */
    .welcome-step {
        padding: 20px 0;
    }

    .welcome-hero {
        padding: 32px 20px;
        border-radius: 20px;
        margin: 0 4px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .hero-icon {
        font-size: 2.5rem;
        margin-bottom: 0.8rem;
    }

    .hero-title {
        font-size: 1.5rem;
        margin-bottom: 0.4rem;
        line-height: 1.3;
    }

    .hero-subtitle {
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        padding: 0 8px;
    }

    .hero-features {
        gap: 0.8rem;
        margin-bottom: 2rem;
        justify-content: center;
    }

    .feature-item {
        font-size: 0.8rem;
        padding: 6px 12px;
        border-radius: 12px;
        /* 移动端触摸目标优化 */
        min-height: 36px;
        min-width: 80px;
        justify-content: center;
    }

    .start-btn {
        height: 48px;
        font-size: 1rem;
        min-width: 160px;
        width: 90%;
        max-width: 280px;
        border-radius: 12px;
        /* 移动端按钮触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    /* 完成页面移动端优化 */
    .complete-container {
        padding: 32px 20px;
        border-radius: 20px;
        margin: 0 4px;
    }

    .complete-icon {
        font-size: 2.5rem;
        margin-bottom: 0.8rem;
    }

    .complete-title {
        font-size: 1.4rem;
        margin-bottom: 0.4rem;
        line-height: 1.3;
    }

    .complete-subtitle {
        font-size: 0.9rem;
        margin-bottom: 1.2rem;
        padding: 0 8px;
    }

    .summary-card-compact {
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        max-width: none;
        margin-left: 4px;
        margin-right: 4px;
    }

    .summary-row {
        flex-direction: column;
        gap: 1rem;
        padding-bottom: 0.8rem;
    }

    .summary-item-compact {
        gap: 0.3rem;
    }

    .item-header {
        gap: 6px;
    }

    .item-icon {
        font-size: 1rem;
    }

    .item-label {
        font-size: 0.8rem;
    }

    .item-value {
        font-size: 1rem;
    }

    .item-value.tags {
        gap: 6px;
        margin-top: 0.2rem;
    }

    .tag-new {
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        /* 移动端触摸目标优化 */
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .finish-btn {
        height: 48px;
        font-size: 1rem;
        min-width: 160px;
        width: 90%;
        max-width: 280px;
        border-radius: 12px;
    }

    .form-container {
        border-radius: 20px;
        margin: 20px 4px;
        /* 添加上下安全间距 */
        height: auto;
        min-height: auto;
        max-height: calc(100vh - 80px);
        /* 移动端上下各40px安全间隔 */
        overflow-y: visible;
    }

    /* 移动端按钮样式调整 */
    .form-container :deep(.action-buttons) {
        /* 移动端使用更小的抵消值 */
        margin-left: -16px;
        margin-right: -16px;
        width: calc(100% + 32px);
    }
}

/* 超小屏幕优化 (小于480px) */
@media (max-width: 480px) {
    .onboarding-flow {
        padding: 8px;
        padding-top: 2vh;
        /* 进一步减少顶部间距 */
        padding-bottom: 2vh;
        /* 添加底部安全间距 */
    }

    .welcome-hero,
    .complete-container {
        padding: 24px 16px;
        border-radius: 16px;
        margin: 0 2px;
    }

    .hero-title,
    .complete-title {
        font-size: 1.25rem;
    }

    .hero-subtitle,
    .complete-subtitle {
        font-size: 0.85rem;
        padding: 0 4px;
    }

    .hero-features {
        gap: 0.6rem;
        margin-bottom: 1.5rem;
    }

    .feature-item {
        font-size: 0.75rem;
        padding: 5px 10px;
        min-height: 32px;
        min-width: 70px;
    }

    .start-btn,
    .finish-btn {
        height: 44px;
        font-size: 0.95rem;
        width: 95%;
        max-width: 240px;
    }

    .summary-card-compact {
        padding: 12px;
        margin-left: 2px;
        margin-right: 2px;
    }

    .tag-new {
        padding: 3px 6px;
        font-size: 0.7rem;
        min-height: 24px;
    }

    .form-container {
        margin: 15px 2px;
        /* 超小屏幕减小安全间距 */
        height: auto;
        min-height: auto;
        max-height: calc(100vh - 60px);
        /* 超小屏幕上下各30px安全间隔 */
        overflow: visible;
    }

    /* 超小屏幕按钮样式调整 */
    .form-container :deep(.action-buttons) {
        /* 超小屏幕使用最小的抵消值 */
        margin-left: -12px;
        margin-right: -12px;
        width: calc(100% + 24px);
        padding: 16px 12px;
        /* 减少上下padding */
        gap: 8px;
        /* 进一步减小按钮间距 */
    }

    /* 超小屏幕按钮精细化 */
    .form-container :deep(.action-btn) {
        height: 38px !important;
        /* 更小的按钮高度 */
        font-size: 0.85rem !important;
        /* 更小的字体 */
        border-radius: 8px !important;
        /* 更小的圆角 */
        min-width: 85px !important;
        /* 更小的最小宽度 */
        padding: 0 12px !important;
        /* 减少水平内边距 */
    }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
    .onboarding-flow {
        padding-top: 2vh;
    }

    .welcome-hero,
    .complete-container {
        padding: 20px 16px;
    }

    .hero-features {
        margin-bottom: 1.2rem;
    }

    .summary-card-compact {
        margin-bottom: 1rem;
    }

    .form-container {
        height: auto;
        min-height: 40vh;
        max-height: 70vh;
        overflow: visible;
    }
}

/* 高对比度和可访问性优化 */
@media (prefers-contrast: high) {

    .welcome-hero,
    .complete-container,
    .form-container {
        border: 2px solid #374151;
    }

    .feature-item,
    .tag-new {
        border: 1px solid #6b7280;
    }

    .start-btn,
    .finish-btn {
        border: 2px solid #18181b;
    }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
    .onboarding-flow {
        background-color: #111827;
    }

    .welcome-hero,
    .complete-container,
    .form-container {
        background: #1f2937;
        border-color: #374151;
    }

    .hero-title,
    .complete-title {
        background: linear-gradient(135deg, #f9fafb, #d1d5db);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .hero-subtitle,
    .complete-subtitle {
        color: #9ca3af;
    }

    .feature-item {
        background-color: #374151;
        color: #e5e7eb;
    }

    .summary-card-compact {
        background-color: #1f2937;
        border-color: #374151;
    }

    .item-value {
        color: #e5e7eb;
    }

    .tag-new {
        background-color: #374151;
        color: #d1d5db;
        border-color: #4b5563;
    }
}

/* 触摸设备专用优化 */
@media (hover: none) and (pointer: coarse) {

    .feature-item:hover,
    .tag-new:hover {
        transform: none;
        background-color: initial;
    }

    .feature-item:active {
        background-color: #e2e8f0;
        transform: scale(0.98);
    }

    .tag-new:active {
        background-color: #e2e8f0;
        transform: scale(0.98);
    }

    .start-btn:active,
    .finish-btn:active {
        transform: scale(0.98);
    }
}

/* 大字体支持 */
@media (min-resolution: 2dppx) {

    .hero-title,
    .complete-title {
        font-weight: 600;
        /* 在高分辨率屏幕上稍微减轻字重 */
    }
}

/* 减少动画的用户偏好 */
@media (prefers-reduced-motion: reduce) {

    .onboarding-step,
    .hero-icon,
    .complete-icon,
    .feature-item,
    .tag-new,
    .start-btn,
    .finish-btn {
        animation: none;
        transition: none;
    }

    .start-btn:hover,
    .finish-btn:hover,
    .feature-item:hover,
    .tag-new:hover {
        transform: none;
    }
}

/* 动态主题系统 - 根据用户偏好个性化界面 */

/* 动感主题 - 适合激进投资者和创新爱好者 */
.onboarding-flow.theme-dynamic {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.theme-dynamic .welcome-hero,
.theme-dynamic .complete-container,
.theme-dynamic .form-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.theme-dynamic .hero-title,
.theme-dynamic .complete-title {
    background: linear-gradient(135deg, #1e40af, #7c3aed, #dc2626);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.theme-dynamic .feature-item {
    background: linear-gradient(135deg, #ddd6fe, #bfdbfe);
    border: 1px solid #c7d2fe;
}

.theme-dynamic .start-btn,
.theme-dynamic .finish-btn {
    background: linear-gradient(135deg, #1e40af, #7c3aed);
    border: none;
    position: relative;
    overflow: hidden;
}

.theme-dynamic .start-btn::before,
.theme-dynamic .finish-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.8s ease;
}

.theme-dynamic .start-btn:hover::before,
.theme-dynamic .finish-btn:hover::before {
    left: 100%;
}

/* 沉稳主题 - 适合保守投资者 */
.onboarding-flow.theme-calm {
    background: #fafaf9;
}

.theme-calm .welcome-hero,
.theme-calm .complete-container,
.theme-calm .form-container {
    background: #ffffff;
    border: 2px solid #e7e5e4;
    box-shadow: 0 4px 16px rgba(68, 64, 60, 0.1);
}

.theme-calm .hero-title,
.theme-calm .complete-title {
    color: #44403c;
    background: none;
    -webkit-text-fill-color: initial;
}

.theme-calm .feature-item {
    background: #f5f5f4;
    color: #57534e;
    border: 1px solid #e7e5e4;
}

.theme-calm .start-btn,
.theme-calm .finish-btn {
    background: #44403c;
    border-color: #44403c;
    box-shadow: 0 2px 8px rgba(68, 64, 60, 0.2);
}

.theme-calm .start-btn:hover,
.theme-calm .finish-btn:hover {
    background: #57534e;
    border-color: #57534e;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(68, 64, 60, 0.3);
}

.theme-calm .tag-new {
    background: #f5f5f4;
    color: #57534e;
    border-color: #e7e5e4;
}

/* 活力主题 - 适合学习意愿强的用户 */
.onboarding-flow.theme-vibrant {
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%);
}

.theme-vibrant .welcome-hero,
.theme-vibrant .complete-container,
.theme-vibrant .form-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(251, 191, 36, 0.3);
    box-shadow: 0 8px 32px rgba(251, 191, 36, 0.1);
}

.theme-vibrant .hero-title,
.theme-vibrant .complete-title {
    background: linear-gradient(135deg, #f59e0b, #ef4444, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.theme-vibrant .feature-item {
    background: linear-gradient(135deg, #fef3c7, #fed7aa);
    color: #92400e;
    border: 1px solid #fbbf24;
}

.theme-vibrant .start-btn,
.theme-vibrant .finish-btn {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    border: none;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.theme-vibrant .start-btn:hover,
.theme-vibrant .finish-btn:hover {
    background: linear-gradient(135deg, #d97706, #dc2626);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
}

.theme-vibrant .tag-new {
    background: linear-gradient(135deg, #fef3c7, #fed7aa);
    color: #92400e;
    border-color: #fbbf24;
}

/* 移动端主题适配 */
@media (max-width: 768px) {

    .theme-dynamic .welcome-hero,
    .theme-dynamic .complete-container {
        background: #ffffff;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
    }

    .theme-calm .welcome-hero,
    .theme-calm .complete-container {
        box-shadow: 0 2px 12px rgba(68, 64, 60, 0.08);
    }

    .theme-vibrant .welcome-hero,
    .theme-vibrant .complete-container {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 4px 20px rgba(251, 191, 36, 0.08);
    }
}

/* 触摸设备主题优化 */
.is-touch.theme-dynamic .start-btn:active,
.is-touch.theme-dynamic .finish-btn:active {
    transform: scale(0.96);
    background: linear-gradient(135deg, #1e3a8a, #6b21a8);
}

.is-touch.theme-calm .start-btn:active,
.is-touch.theme-calm .finish-btn:active {
    transform: scale(0.96);
    background: #292524;
}

.is-touch.theme-vibrant .start-btn:active,
.is-touch.theme-vibrant .finish-btn:active {
    transform: scale(0.96);
    background: linear-gradient(135deg, #b45309, #b91c1c);
}

/* 暗色模式下的主题适配 */
@media (prefers-color-scheme: dark) {
    .theme-dynamic {
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    }

    .theme-dynamic .welcome-hero,
    .theme-dynamic .complete-container,
    .theme-dynamic .form-container {
        background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
        border-color: #4b5563;
    }

    .theme-calm {
        background: #1c1917;
    }

    .theme-calm .welcome-hero,
    .theme-calm .complete-container,
    .theme-calm .form-container {
        background: #292524;
        border-color: #44403c;
    }

    .theme-vibrant {
        background: linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #7f1d1d 100%);
    }

    .theme-vibrant .welcome-hero,
    .theme-vibrant .complete-container,
    .theme-vibrant .form-container {
        background: rgba(41, 37, 36, 0.95);
        border-color: rgba(251, 191, 36, 0.2);
    }

    .theme-vibrant .hero-title,
    .theme-vibrant .complete-title {
        background: linear-gradient(135deg, #fbbf24, #f87171, #fb7185);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
}

/* 高对比度模式下的主题适配 */
@media (prefers-contrast: high) {

    .theme-dynamic .welcome-hero,
    .theme-dynamic .complete-container,
    .theme-dynamic .form-container,
    .theme-calm .welcome-hero,
    .theme-calm .complete-container,
    .theme-calm .form-container,
    .theme-vibrant .welcome-hero,
    .theme-vibrant .complete-container,
    .theme-vibrant .form-container {
        border-width: 3px;
        border-style: solid;
    }

    .theme-dynamic .start-btn,
    .theme-dynamic .finish-btn,
    .theme-calm .start-btn,
    .theme-calm .finish-btn,
    .theme-vibrant .start-btn,
    .theme-vibrant .finish-btn {
        border-width: 2px;
        border-style: solid;
        font-weight: 600;
    }
}

/* 动画偏好适配 */
.prefers-reduced-motion .theme-dynamic .start-btn::before,
.prefers-reduced-motion .theme-dynamic .finish-btn::before {
    display: none;
}

.prefers-reduced-motion.theme-vibrant .start-btn:hover,
.prefers-reduced-motion.theme-vibrant .finish-btn:hover {
    transform: none;
}

/* 智能提示系统 */
.onboarding-flow.theme-dynamic .step-desc::after {
    content: " 💡 您的个性化界面已根据您的投资风格调整";
    color: #6366f1;
    font-size: 0.8em;
    font-weight: 500;
}

.onboarding-flow.theme-calm .step-desc::after {
    content: " 🛡️ 界面已优化为稳健风格";
    color: #44403c;
    font-size: 0.8em;
    font-weight: 500;
}

.onboarding-flow.theme-vibrant .step-desc::after {
    content: " 🌟 界面已调整为学习优化模式";
    color: #f59e0b;
    font-size: 0.8em;
    font-weight: 500;
}

/* 移动端提示优化 */
@media (max-width: 768px) {

    .onboarding-flow.theme-dynamic .step-desc::after,
    .onboarding-flow.theme-calm .step-desc::after,
    .onboarding-flow.theme-vibrant .step-desc::after {
        display: block;
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        font-size: 0.75em;
    }
}
</style>
