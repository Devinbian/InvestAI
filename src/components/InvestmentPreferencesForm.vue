<template>
    <div class="preferences-form-container">
        <!-- 步骤1: 投资经验 -->
        <div v-if="currentStep === 0" class="step-content" data-step="0">
            <h3 class="step-title">{{ preferenceSteps[0].title }}</h3>
            <p class="step-desc">{{ preferenceSteps[0].desc }}</p>

            <div class="step-content-scrollable">
                <div class="experience-options">
                    <div v-for="option in experienceOptions" :key="option.value" class="experience-option"
                        :class="{ selected: localPreferencesForm.experience === option.value }"
                        @click="localPreferencesForm.experience = option.value">
                        <div class="option-radio">
                            <div class="radio-dot"
                                :class="{ checked: localPreferencesForm.experience === option.value }">
                            </div>
                        </div>
                        <div class="experience-content">
                            <div class="experience-header">
                                <span class="experience-icon">{{ option.icon }}</span>
                                <div class="experience-title">{{ option.title }}</div>
                            </div>
                            <div class="experience-label">{{ option.label }}</div>
                            <div class="experience-desc">{{ option.desc }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 步骤2: 选择投资风格 -->
        <div v-if="currentStep === 1" class="step-content" data-step="1">
            <h3 class="step-title">{{ preferenceSteps[1].title }}</h3>
            <p class="step-desc">{{ preferenceSteps[1].desc }}</p>

            <div class="step-content-scrollable">
                <div class="risk-options">
                    <div v-for="option in riskOptions" :key="option.value" class="risk-option"
                        :class="{ selected: localPreferencesForm.riskLevel === option.value }"
                        @click="localPreferencesForm.riskLevel = option.value">
                        <div class="option-radio">
                            <div class="radio-dot"
                                :class="{ checked: localPreferencesForm.riskLevel === option.value }">
                            </div>
                        </div>
                        <div class="option-content">
                            <div class="option-header">
                                <div class="option-title">
                                    <span class="option-icon">{{ option.icon }}</span>
                                    {{ option.title }}
                                </div>
                                <div class="risk-level-indicator">
                                    <span v-for="i in 5" :key="i" class="risk-dot"
                                        :class="{ active: i <= option.riskLevel }"></span>
                                </div>
                            </div>
                            <div class="option-desc">{{ option.desc }}</div>
                            <div class="simple-desc">{{ option.simpleDesc }}</div>
                            <div class="option-metrics">
                                <div class="metric-item">
                                    <span class="metric-label">💰 可能收益:</span>
                                    <span class="metric-value return">{{ option.expectedReturn }}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">⚠️ 可能亏损:</span>
                                    <span class="metric-value loss">{{ option.maxLoss }}</span>
                                </div>
                            </div>
                            <div class="option-examples">
                                <span class="examples-label">📈 投资什么:</span>
                                <span class="examples-text">{{ option.examples }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 步骤3: 用户特征 -->
        <div v-if="currentStep === 2" class="step-content" data-step="2">
            <h3 class="step-title">{{ preferenceSteps[2].title }}</h3>
            <p class="step-desc">{{ preferenceSteps[2].desc }}</p>

            <div class="step-content-scrollable">
                <div class="traits-container">
                    <div class="traits-hint">
                        <div class="hint-icon">💡</div>
                        <div class="hint-text">
                            <strong>新手提示：</strong>如果不确定如何选择，我们已为您设置了适合新手的默认选项，您可以直接使用或根据个人情况调整
                        </div>
                    </div>

                    <div class="traits-list">
                        <div v-for="trait in userTraits" :key="trait.id" class="trait-item-compact">
                            <div class="trait-header-compact">
                                <div class="trait-left">
                                    <span class="trait-icon">{{ trait.icon }}</span>
                                    <div class="trait-info">
                                        <div class="trait-title">{{ trait.title }}</div>
                                        <div class="trait-desc">{{ trait.desc }}</div>
                                    </div>
                                </div>
                                <div class="trait-current-value">
                                    {{ localPreferencesForm.userTraits[trait.id] }}分
                                </div>
                            </div>

                            <div class="trait-slider-container">
                                <div class="slider-track">
                                    <div class="slider-progress"
                                        :style="{ width: (localPreferencesForm.userTraits[trait.id] / 5) * 100 + '%' }">
                                    </div>
                                </div>
                                <div class="slider-options">
                                    <div v-for="option in trait.options" :key="option.value" class="slider-option"
                                        :class="{ active: localPreferencesForm.userTraits[trait.id] === option.value }"
                                        @click="localPreferencesForm.userTraits[trait.id] = option.value"
                                        :title="option.desc">
                                        <div class="option-dot"></div>
                                        <div class="option-label">{{ option.value }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="trait-description">
                                {{ getCurrentTraitDescription(trait.id) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 步骤4: 关注板块 -->
        <div v-if="currentStep === 3" class="step-content" data-step="3">
            <h3 class="step-title">{{ preferenceSteps[3].title }}</h3>
            <p class="step-desc">{{ preferenceSteps[3].desc }}</p>

            <div class="step-content-scrollable">
                <div class="sectors-container-compact">
                    <!-- 顶部搜索和统计 -->
                    <div class="sectors-header">
                        <div class="search-section">
                            <el-input v-model="sectorSearchQuery" placeholder="搜索行业名称，如：新能源、医药..."
                                class="compact-search" clearable @input="handleSectorSearch">
                                <template #prefix>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor"
                                            stroke-width="2" fill="none" />
                                    </svg>
                                </template>
                            </el-input>
                        </div>
                        <div class="stats-section">
                            <span class="stat-chip">
                                大分类 {{ localPreferencesForm.sectors.majorCategories.length }}/2
                            </span>
                            <span class="stat-chip">
                                细分 {{ localPreferencesForm.sectors.subCategories.length }}/4
                            </span>
                        </div>
                    </div>

                    <!-- 左右分栏内容 -->
                    <div class="sectors-content">
                        <!-- 搜索结果模式 -->
                        <div v-if="sectorSearchQuery && filteredSubSectors.length > 0" class="search-mode">
                            <div class="search-header">
                                🔍 找到 {{ filteredSubSectors.length }} 个匹配行业
                            </div>
                            <div class="search-grid">
                                <div v-for="sector in filteredSubSectors" :key="sector.value" class="sector-card"
                                    :class="{
                                        selected: localPreferencesForm.sectors.subCategories.includes(sector.value),
                                        disabled: !localPreferencesForm.sectors.subCategories.includes(sector.value) && localPreferencesForm.sectors.subCategories.length >= 4,
                                    }" @click="toggleSubSectorFromSearch(sector)">
                                    <div class="card-icon">{{ sector.icon }}</div>
                                    <div class="card-content">
                                        <div class="card-title" v-html="highlightSearchTerm(sector.label)"></div>
                                        <div class="card-desc" v-html="highlightSearchTerm(sector.desc)"></div>
                                        <div class="card-parent">{{ getMajorSectorLabel(sector.parent) }}</div>
                                    </div>
                                    <div class="card-check"
                                        v-if="localPreferencesForm.sectors.subCategories.includes(sector.value)">
                                        ✓
                                    </div>
                                </div>
                            </div>

                            <!-- 无搜索结果 -->
                            <div v-if="sectorSearchQuery && filteredSubSectors.length === 0" class="no-results">
                                <div class="no-results-icon">🔍</div>
                                <div class="no-results-text">未找到匹配的行业</div>
                                <div class="no-results-hint">请尝试其他关键词，如"科技"、"医药"、"消费"等</div>
                            </div>
                        </div>

                        <!-- 选择模式 -->
                        <div v-else class="selection-mode">
                            <!-- PC端左右分栏布局 -->
                            <div class="desktop-layout" v-if="!isMobile && !isTablet">
                                <div class="left-panel">
                                    <div class="section-title">📊 选择关注的大分类 (最多2个)</div>
                                    <div class="major-grid-desktop">
                                        <div v-for="major in majorSectors" :key="major.value" class="major-card-desktop"
                                            :class="{
                                                selected: localPreferencesForm.sectors.majorCategories.includes(major.value),
                                                disabled: !localPreferencesForm.sectors.majorCategories.includes(major.value) && localPreferencesForm.sectors.majorCategories.length >= 2
                                            }" @click="toggleMajorSector(major.value)">
                                            <div class="major-icon">{{ major.icon }}</div>
                                            <div class="major-name">{{ major.label }}</div>
                                            <div class="major-check"
                                                v-if="localPreferencesForm.sectors.majorCategories.includes(major.value)">
                                                ✓
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="right-panel">
                                    <div class="section-title">🎯 选择具体关注的行业 (最多4个)</div>
                                    <div v-if="availableSubSectors.length > 0" class="sub-grid-desktop">
                                        <div v-for="group in groupedSubSectors" :key="group.major"
                                            class="sub-group-desktop">
                                            <div class="group-header-desktop">{{ getMajorSectorLabel(group.major) }}
                                            </div>
                                            <div class="sub-cards-desktop">
                                                <div v-for="sector in group.sectors" :key="sector.value"
                                                    class="sub-card-desktop" :class="{
                                                        selected: localPreferencesForm.sectors.subCategories.includes(sector.value),
                                                        disabled: !localPreferencesForm.sectors.subCategories.includes(sector.value) && localPreferencesForm.sectors.subCategories.length >= 4
                                                    }" @click="toggleSubSector(sector.value)">
                                                    <div class="sub-icon">{{ sector.icon }}</div>
                                                    <div class="sub-name">{{ sector.label }}</div>
                                                    <div class="sub-check"
                                                        v-if="localPreferencesForm.sectors.subCategories.includes(sector.value)">
                                                        ✓
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="selection-hint-desktop">
                                        <div class="hint-icon">👆</div>
                                        <div class="hint-text">请先选择左侧的大分类</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 移动端布局 -->
                            <div class="mobile-layout" v-else>
                                <!-- 大分类选择 -->
                                <div class="major-section">
                                    <div class="section-title">📊 选择关注的大分类 (最多2个)</div>
                                    <div class="major-grid">
                                        <div v-for="major in majorSectors" :key="major.value" class="major-card" :class="{
                                            selected: localPreferencesForm.sectors.majorCategories.includes(major.value),
                                            disabled: !localPreferencesForm.sectors.majorCategories.includes(major.value) && localPreferencesForm.sectors.majorCategories.length >= 2
                                        }" @click="toggleMajorSector(major.value)">
                                            <div class="major-icon">{{ major.icon }}</div>
                                            <div class="major-name">{{ major.label }}</div>
                                            <div class="major-check"
                                                v-if="localPreferencesForm.sectors.majorCategories.includes(major.value)">
                                                ✓
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 子分类选择 -->
                                <div class="sub-section" v-if="availableSubSectors.length > 0">
                                    <div class="section-title">🎯 选择具体关注的行业 (最多4个)</div>
                                    <div v-for="group in groupedSubSectors" :key="group.major" class="sub-group">
                                        <div class="group-header">{{ getMajorSectorLabel(group.major) }}</div>
                                        <div class="sub-cards">
                                            <div v-for="sector in group.sectors" :key="sector.value" class="sub-card"
                                                :class="{
                                                    selected: localPreferencesForm.sectors.subCategories.includes(sector.value),
                                                    disabled: !localPreferencesForm.sectors.subCategories.includes(sector.value) && localPreferencesForm.sectors.subCategories.length >= 4
                                                }" @click="toggleSubSector(sector.value)">
                                                <div class="sub-icon">{{ sector.icon }}</div>
                                                <div class="sub-name">{{ sector.label }}</div>
                                                <div class="sub-check"
                                                    v-if="localPreferencesForm.sectors.subCategories.includes(sector.value)">
                                                    ✓
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 选择提示 -->
                                    <div v-if="availableSubSectors.length === 0" class="selection-hint">
                                        <div class="hint-icon">👆</div>
                                        <div class="hint-text">请先选择上方的大分类，然后选择具体关注的行业</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="showActions" class="action-buttons">
            <el-button v-if="currentStep > 0" class="action-btn" @click="handlePrevious">
                上一步
            </el-button>
            <el-button class="action-btn primary" @click="handleNext" :disabled="!isStepValid">
                {{ isLastStep ? '完成' : '下一步' }}
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
// import InvestmentPreferencesForm from './InvestmentPreferencesForm.vue'; // Self import is not needed

// Props
const props = defineProps({
    currentStep: {
        type: Number,
        required: true
    },
    preferencesForm: {
        type: Object,
        required: true
    },
    showActions: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits(['update:preferencesForm', 'previous', 'next', 'complete']);

const sectorSearchQuery = ref('');
const filteredSubSectors = ref([]);

// 响应式检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);
const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024);

// Store
const userStore = useUserStore();

// Local reactive state for the form
const localPreferencesForm = reactive({
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

// Sync from parent to local state
watch(() => props.preferencesForm, (newValue) => {
    Object.assign(localPreferencesForm, newValue);
}, { deep: true, immediate: true });

// Sync from local state to parent
watch(localPreferencesForm, (newValue) => {
    emit('update:preferencesForm', newValue);
}, { deep: true });


// 步骤配置
const preferenceSteps = [
    {
        title: '投资经验',
        desc: '告诉我们您的投资经验，帮助我们推荐合适的投资方案'
    },
    {
        title: '选择投资风格',
        desc: '您希望投资收益高一些，还是稳一些？选择最适合您的投资方式'
    },
    {
        title: '用户特征',
        desc: '帮助我们了解您的投资偏好，为您量身定制投资方案'
    },
    {
        title: '关注板块',
        desc: '请选择您关注的投资板块（可多选）'
    }
];

// Validation
const isStepValid = computed(() => {
    switch (props.currentStep) {
        case 0:
            return !!localPreferencesForm.experience;
        case 1:
            return !!localPreferencesForm.riskLevel;
        case 2:
            return true;
        case 3:
            return localPreferencesForm.sectors.subCategories.length > 0;
        default:
            return false;
    }
});

const isLastStep = computed(() => props.currentStep === preferenceSteps.length - 1);

function handlePrevious() {
    emit('previous');
}

function handleNext() {
    if (isStepValid.value) {
        if (isLastStep.value) {
            emit('complete');
        } else {
            emit('next');
        }
    }
}

// All the data options (riskOptions, experienceOptions, userTraits, etc.) are kept here as they are part of the form's definition.
// 风险偏好选项
const riskOptions = [
    {
        value: 'conservative',
        title: '求稳型',
        desc: '像存银行一样稳，但收益比存款高一点',
        simpleDesc: '投1万元，一年大概赚300-600元',
        maxLoss: '最多亏500元',
        examples: '大银行股票（工商银行、建设银行）',
        maxDrawdown: '5%',
        expectedReturn: '3-6%',
        riskLevel: 1,
        icon: '🛡️'
    },
    {
        value: 'stable',
        title: '稳健型',
        desc: '选择知名大公司，收益稳定有保障',
        simpleDesc: '投1万元，一年大概赚600-1000元',
        maxLoss: '最多亏1000元',
        examples: '知名品牌（茅台、招商银行、美的）',
        maxDrawdown: '10%',
        expectedReturn: '6-10%',
        riskLevel: 2,
        icon: '🏦'
    },
    {
        value: 'balanced',
        title: '均衡型',
        desc: '稳健和成长兼顾，适合大多数人',
        simpleDesc: '投1万元，一年大概赚1000-1500元',
        maxLoss: '最多亏1500元',
        examples: '优质公司组合（银行+白酒+新能源）',
        maxDrawdown: '15%',
        expectedReturn: '10-15%',
        riskLevel: 3,
        icon: '⚖️'
    },
    {
        value: 'growth',
        title: '成长型',
        desc: '追求更高收益，选择有潜力的公司',
        simpleDesc: '投1万元，一年大概赚1500-2500元',
        maxLoss: '最多亏2000元',
        examples: '热门科技股（比亚迪、宁德时代）',
        maxDrawdown: '20%',
        expectedReturn: '15-25%',
        riskLevel: 4,
        icon: '🚀'
    },
    {
        value: 'aggressive',
        title: '进取型',
        desc: '追求最高收益，但风险也最大',
        simpleDesc: '投1万元，一年可能赚2500元以上',
        maxLoss: '可能亏3000元以上',
        examples: '新兴小公司股票（创业板、科创板）',
        maxDrawdown: '30%+',
        expectedReturn: '25%+',
        riskLevel: 5,
        icon: '⚡'
    }
];

// 投资经验选项
const experienceOptions = [
    {
        value: 'beginner',
        title: '投资新手',
        label: '我是投资新手，想稳步学习',
        desc: '刚开始接触投资，希望从简单稳健的方式开始',
        icon: '🌱'
    },
    {
        value: 'experienced',
        title: '有投资经验',
        label: '我有一定投资经验，可以承担风险',
        desc: '已经有过投资经历，了解市场波动，能接受一定风险',
        icon: '📈'
    }
];

// 用户特征配置
const userTraits = [
    {
        id: 'risk_tolerance',
        title: '风险承受',
        desc: '您能接受多大的投资波动？',
        icon: '🛡️',
        options: [
            { value: 1, label: '1分', desc: '完全不能接受亏损，只要保本' },
            { value: 2, label: '2分', desc: '可接受很小的波动，亏损不超过5%' },
            { value: 3, label: '3分', desc: '可接受适度波动，亏损不超过15%' },
            { value: 4, label: '4分', desc: '可接受较大波动，亏损不超过25%' },
            { value: 5, label: '5分', desc: '可接受高风险，亏损超过30%也能承受' }
        ],
        defaultValue: 3
    },
    {
        id: 'active_participation',
        title: '主动参与',
        desc: '您希望多深度参与投资决策？',
        icon: '🎯',
        options: [
            { value: 1, label: '1分', desc: '完全不想管，全部交给专业人士' },
            { value: 2, label: '2分', desc: '偶尔关注，主要听专业建议' },
            { value: 3, label: '3分', desc: '适度参与，听建议但自己决定' },
            { value: 4, label: '4分', desc: '积极参与，自己研究后做决策' },
            { value: 5, label: '5分', desc: '完全主导，所有决策都自己做' }
        ],
        defaultValue: 3
    },
    {
        id: 'learning_willingness',
        title: '学习意愿',
        desc: '您愿意花多少时间学习投资？',
        icon: '📚',
        options: [
            { value: 1, label: '1分', desc: '完全没时间学习投资知识' },
            { value: 2, label: '2分', desc: '偶尔看看新闻，了解大概' },
            { value: 3, label: '3分', desc: '定期看资讯，学习基础知识' },
            { value: 4, label: '4分', desc: '主动学习，研究投资策略' },
            { value: 5, label: '5分', desc: '深度学习，钻研各种投资理论' }
        ],
        defaultValue: 3
    },
    {
        id: 'strategy_dependency',
        title: '策略复杂度',
        desc: '您更倾向于哪种投资策略？',
        icon: '📊',
        options: [
            { value: 1, label: '1分', desc: '最简单策略，买了就长期持有' },
            { value: 2, label: '2分', desc: '简单策略，偶尔调整持仓' },
            { value: 3, label: '3分', desc: '中等策略，定期优化投资组合' },
            { value: 4, label: '4分', desc: '复杂策略，使用多种投资工具' },
            { value: 5, label: '5分', desc: '高级策略，运用各种量化模型' }
        ],
        defaultValue: 2
    },
    {
        id: 'trading_frequency',
        title: '交易频次',
        desc: '您计划多久调整一次投资？',
        icon: '⏰',
        options: [
            { value: 1, label: '1分', desc: '很少交易，半年以上才调整' },
            { value: 2, label: '2分', desc: '低频交易，2-3个月调整一次' },
            { value: 3, label: '3分', desc: '中频交易，每月都会看看调整' },
            { value: 4, label: '4分', desc: '高频交易，每周都关注调整' },
            { value: 5, label: '5分', desc: '超高频，几乎每天都在交易' }
        ],
        defaultValue: 2
    },
    {
        id: 'innovation_trial',
        title: '创新接受度',
        desc: '您对新的投资产品态度如何？',
        icon: '🚀',
        options: [
            { value: 1, label: '1分', desc: '非常保守，只投最传统的产品' },
            { value: 2, label: '2分', desc: '比较保守，只投成熟稳定的产品' },
            { value: 3, label: '3分', desc: '适度开放，了解清楚后会尝试' },
            { value: 4, label: '4分', desc: '比较开放，愿意尝试新兴产品' },
            { value: 5, label: '5分', desc: '非常开放，积极尝试各种新产品' }
        ],
        defaultValue: 3
    }
];

// 大分类配置
const majorSectors = [
    {
        value: 'technology',
        label: '科技板块',
        icon: '💻',
        desc: '包含互联网、软件、硬件、人工智能等科技相关行业',
        color: '#3b82f6'
    },
    {
        value: 'finance',
        label: '金融板块',
        icon: '🏦',
        desc: '包含银行、保险、证券、支付等金融服务行业',
        color: '#10b981'
    },
    {
        value: 'consumer',
        label: '消费板块',
        icon: '🛍️',
        desc: '包含食品饮料、服装、家电、零售等消费相关行业',
        color: '#f59e0b'
    },
    {
        value: 'healthcare',
        label: '医疗板块',
        icon: '🏥',
        desc: '包含医药、医疗器械、生物技术等医疗健康行业',
        color: '#ef4444'
    },
    {
        value: 'industrial',
        label: '工业板块',
        icon: '🏭',
        desc: '包含制造业、基建、能源、材料等传统工业行业',
        color: '#8b5cf6'
    },
    {
        value: 'emerging',
        label: '新兴板块',
        icon: '🚀',
        desc: '包含新能源、环保、军工等新兴产业',
        color: '#06b6d4'
    }
];

// 子分类配置
const subSectors = [
    // 科技板块下的小分类
    {
        value: 'internet',
        label: '互联网',
        parent: 'technology',
        icon: '🌐',
        desc: '电商、社交、搜索、云计算等',
        examples: '腾讯控股、阿里巴巴、百度'
    },
    {
        value: 'software',
        label: '软件服务',
        parent: 'technology',
        icon: '💾',
        desc: '企业软件、安全软件、游戏等',
        examples: '用友网络、恒生电子、三六零'
    },
    {
        value: 'hardware',
        label: '电子硬件',
        parent: 'technology',
        icon: '🔌',
        desc: '半导体、消费电子、通信设备等',
        examples: '中芯国际、立讯精密、海康威视'
    },
    {
        value: 'ai',
        label: '人工智能',
        parent: 'technology',
        icon: '🤖',
        desc: 'AI芯片、机器学习、自动驾驶等',
        examples: '科大讯飞、寒武纪、四维图新'
    },

    // 金融板块下的小分类
    {
        value: 'banking',
        label: '银行',
        parent: 'finance',
        icon: '🏛️',
        desc: '国有银行、股份制银行、城商行等',
        examples: '招商银行、平安银行、兴业银行'
    },
    {
        value: 'insurance',
        label: '保险',
        parent: 'finance',
        icon: '🛡️',
        desc: '人寿保险、财产保险等',
        examples: '中国平安、中国人寿、新华保险'
    },
    {
        value: 'securities',
        label: '证券',
        parent: 'finance',
        icon: '📊',
        desc: '证券公司、期货公司等',
        examples: '中信证券、华泰证券、东方财富'
    },

    // 消费板块下的小分类
    {
        value: 'food_beverage',
        label: '食品饮料',
        parent: 'consumer',
        icon: '🍷',
        desc: '白酒、饮料、食品加工等',
        examples: '贵州茅台、五粮液、伊利股份'
    },
    {
        value: 'retail',
        label: '零售',
        parent: 'consumer',
        icon: '🏪',
        desc: '超市、百货、电商零售等',
        examples: '永辉超市、苏宁易购、王府井'
    },
    {
        value: 'appliances',
        label: '家电',
        parent: 'consumer',
        icon: '📺',
        desc: '白色家电、黑色家电等',
        examples: '美的集团、格力电器、海尔智家'
    },

    // 医疗板块下的小分类
    {
        value: 'pharma',
        label: '医药制造',
        parent: 'healthcare',
        icon: '💊',
        desc: '化学药、中药、生物药等',
        examples: '恒瑞医药、云南白药、片仔癀'
    },
    {
        value: 'medical_devices',
        label: '医疗器械',
        parent: 'healthcare',
        icon: '🩺',
        desc: '医疗设备、体外诊断等',
        examples: '迈瑞医疗、鱼跃医疗、乐普医疗'
    },

    // 工业板块下的小分类
    {
        value: 'manufacturing',
        label: '先进制造',
        parent: 'industrial',
        icon: '⚙️',
        desc: '机械设备、精密制造等',
        examples: '三一重工、中联重科、徐工机械'
    },
    {
        value: 'materials',
        label: '基础材料',
        parent: 'industrial',
        icon: '🏗️',
        desc: '钢铁、有色金属、化工等',
        examples: '宝钢股份、紫金矿业、万华化学'
    },
    {
        value: 'infrastructure',
        label: '基础设施',
        parent: 'industrial',
        icon: '🌉',
        desc: '建筑、交通、公用事业等',
        examples: '中国建筑、中国中铁、长江电力'
    },

    // 新兴板块下的小分类
    {
        value: 'new_energy',
        label: '新能源',
        parent: 'emerging',
        icon: '🔋',
        desc: '光伏、风电、储能、新能源车等',
        examples: '宁德时代、比亚迪、隆基绿能'
    },
    {
        value: 'environmental',
        label: '环保',
        parent: 'emerging',
        icon: '🌱',
        desc: '污水处理、固废处理、大气治理等',
        examples: '碧水源、启迪环境、龙净环保'
    },
    {
        value: 'military',
        label: '军工',
        parent: 'emerging',
        icon: '🛡️',
        desc: '军工装备、航空航天等',
        examples: '中航沈飞、航发动力、中直股份'
    }
];

// 计算属性
const availableSubSectors = computed(() => {
    return subSectors.filter(sub =>
        localPreferencesForm.sectors.majorCategories.includes(sub.parent)
    );
});

const groupedSubSectors = computed(() => {
    const groups = {};
    availableSubSectors.value.forEach(sector => {
        if (!groups[sector.parent]) {
            groups[sector.parent] = {
                major: sector.parent,
                sectors: []
            };
        }
        groups[sector.parent].sectors.push(sector);
    });
    return Object.values(groups);
});

// Methods
const getCurrentTraitDescription = (traitId) => {
    const trait = userTraits.find(t => t.id === traitId);
    if (!trait) return '';

    const currentValue = localPreferencesForm.userTraits[traitId];
    const option = trait.options.find(opt => opt.value === currentValue);
    return option ? option.desc : '';
};

const toggleMajorSector = (value) => {
    const index = localPreferencesForm.sectors.majorCategories.indexOf(value);
    if (index > -1) {
        localPreferencesForm.sectors.majorCategories.splice(index, 1);
        const subSectorsToRemove = subSectors
            .filter(sub => sub.parent === value)
            .map(sub => sub.value);
        localPreferencesForm.sectors.subCategories = localPreferencesForm.sectors.subCategories
            .filter(sub => !subSectorsToRemove.includes(sub));
    } else {
        if (localPreferencesForm.sectors.majorCategories.length < 2) {
            localPreferencesForm.sectors.majorCategories.push(value);
        }
    }
};

const toggleSubSector = (value) => {
    const index = localPreferencesForm.sectors.subCategories.indexOf(value);
    if (index > -1) {
        localPreferencesForm.sectors.subCategories.splice(index, 1);
    } else {
        if (localPreferencesForm.sectors.subCategories.length < 4) {
            localPreferencesForm.sectors.subCategories.push(value);
        }
    }
};

const getMajorSectorIcon = (value) => {
    const sector = majorSectors.find(s => s.value === value);
    return sector ? sector.icon : '';
};

const getMajorSectorLabel = (value) => {
    const sector = majorSectors.find(s => s.value === value);
    return sector ? sector.label : '';
};

const getSubSectorsByParent = (parentValue) => {
    return subSectors.filter(sub => sub.parent === parentValue);
};

const handleSectorSearch = () => {
    if (!sectorSearchQuery.value.trim()) {
        filteredSubSectors.value = [];
        return;
    }

    const query = sectorSearchQuery.value.toLowerCase().trim();
    filteredSubSectors.value = subSectors.filter(sector => {
        return sector.label.toLowerCase().includes(query) ||
            sector.desc.toLowerCase().includes(query) ||
            sector.examples.toLowerCase().includes(query);
    });
};

const highlightSearchTerm = (text) => {
    if (!sectorSearchQuery.value.trim()) return text;

    const query = sectorSearchQuery.value.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

const toggleSubSectorFromSearch = (subOption) => {
    if (!localPreferencesForm.sectors.majorCategories.includes(subOption.parent)) {
        if (localPreferencesForm.sectors.majorCategories.length < 2) {
            localPreferencesForm.sectors.majorCategories.push(subOption.parent);
        } else {
            ElMessage.warning('请先移除一个大分类，再选择此细分行业');
            return;
        }
    }
    toggleSubSector(subOption.value);
};

const getRiskLevelText = (level) => {
    const map = {
        'conservative': '保守型',
        'stable': '稳健型',
        'balanced': '平衡型',
        'growth': '成长型',
        'aggressive': '激进型'
    };
    return map[level] || '未设置';
};

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

</script>

<style scoped>
/* ===== 基础容器样式 ===== */
.preferences-form-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: transparent;
    padding: 0;
}

.step-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding: 0;
}

.step-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 8px 0;
    text-align: center;
    line-height: 1.3;
}

.step-desc {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0 0 20px 0;
    text-align: center;
    line-height: 1.4;
}

/* ===== PC端样式优化 - 充分利用宽度 ===== */
@media (min-width: 768px) {
    .preferences-form-container {
        padding: 0;
        max-width: none;
        width: 100%;
    }

    .step-content {
        padding: 0 16px;
        width: 100%;
        max-width: none;
    }

    .step-title {
        font-size: 1.4rem;
        margin-bottom: 12px;
    }

    .step-desc {
        font-size: 1rem;
        margin-bottom: 24px;
    }

    /* PC端特别增加滚动容器的底部间距 */
    .step-content-scrollable {
        padding: 0 4px 32px 4px;
        /* PC端增加更多底部间距 */
    }
}

/* ===== 经验选项样式 - 完整的卡片设计 ===== */
.experience-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
}

.experience-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-height: auto;
    text-align: left;
}

.experience-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.experience-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.option-radio {
    flex-shrink: 0;
    margin-top: 2px;
}

.radio-dot {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    transition: all 0.2s ease;
    position: relative;
}

.radio-dot.checked {
    border-color: #18181b;
    background: #18181b;
}

.radio-dot.checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
}

.experience-content {
    flex: 1;
}

.experience-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.experience-icon {
    font-size: 1.2rem;
}

.experience-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #18181b;
}

.experience-label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
}

.experience-desc {
    font-size: 0.825rem;
    color: #6b7280;
    line-height: 1.4;
}

/* ===== 风险选项样式 - 完整的卡片设计 ===== */
.risk-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 10px;
}

/* PC端3栏布局 */
@media (min-width: 768px) {
    .risk-options {
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        max-width: 1200px;
        padding: 0 16px;
    }
}

.risk-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    text-align: left;
    min-height: auto;
    box-sizing: border-box;
}

.risk-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.option-content {
    flex: 1;
}

.option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}

.option-title {
    font-weight: 600;
    color: #18181b;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 6px;
}

.option-icon {
    font-size: 1.1rem;
}

.risk-level-indicator {
    display: flex;
    gap: 3px;
    align-items: center;
}

.risk-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: all 0.2s ease;
}

.risk-dot.active {
    background: #ef4444;
}

.option-desc {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.3;
    margin-bottom: 4px;
}

.simple-desc {
    font-size: 0.8rem;
    color: #059669;
    font-weight: 600;
    background: #f0fdf4;
    padding: 4px 6px;
    border-radius: 4px;
    margin-bottom: 6px;
    border-left: 3px solid #10b981;
    line-height: 1.25;
}

.option-metrics {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 6px;
}

.metric-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.metric-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    flex: 1;
}

.metric-value {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 3px 6px;
    border-radius: 4px;
    white-space: nowrap;
}

.metric-value.return {
    color: #059669;
    background: #d1fae5;
}

.metric-value.loss {
    color: #dc2626;
    background: #fee2e2;
}

.option-examples {
    margin-top: 6px;
    padding-top: 4px;
    border-top: 1px solid #f3f4f6;
}

.examples-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
}

.examples-text {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    display: block;
    margin-top: 2px;
}

/* ===== 用户特征样式 - 完整的滑块设计 ===== */
.traits-container {
    max-width: 1000px;
    margin: 0 auto;
}

.traits-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 4px 6px;
    margin-bottom: 10px;
}

.hint-icon {
    font-size: 0.8rem;
    flex-shrink: 0;
}

.hint-text {
    font-size: 0.7rem;
    color: #0c4a6e;
    line-height: 1.25;
}

.traits-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 900px;
    margin: 0 auto;
}

.trait-item-compact {
    border: 2px solid #f3f4f6;
    border-radius: 10px;
    padding: 8px;
    background: #fafafa;
    transition: all 0.2s ease;
}

.trait-item-compact:hover {
    border-color: #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.trait-header-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.trait-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.trait-icon {
    font-size: 1rem;
    flex-shrink: 0;
}

.trait-info {
    flex: 1;
}

.trait-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 0;
}

.trait-desc {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.2;
}

.trait-current-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #18181b;
    background: #e0f2fe;
    border: none;
    border-radius: 16px;
    padding: 1px 8px;
    min-width: auto;
    text-align: center;
}

.trait-slider-container {
    position: relative;
    margin-bottom: 2px;
    height: 35px;
}

.slider-track {
    height: 2px;
    background: #e5e7eb;
    border-radius: 1px;
    position: absolute;
    left: 10px;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    margin: 0;
}

.slider-progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #0ea5e9 50%, #8b5cf6 100%);
    border-radius: 1px;
    transition: width 0.3s ease;
}

.slider-options {
    display: flex;
    justify-content: space-between;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
}

.slider-option {
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.option-dot {
    width: 12px;
    height: 12px;
    border: 1px solid #d1d5db;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.2s ease;
    z-index: 2;
}

.slider-option:hover .option-dot {
    border-color: #18181b;
    transform: translate(-50%, -50%) scale(1.1);
}

.slider-option.active .option-dot {
    border-color: #18181b;
    background: #18181b;
    transform: translate(-50%, -50%) scale(1.2);
}

.option-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #6b7280;
    position: absolute;
    top: calc(50% + 10px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    transition: color 0.2s ease;
}

.slider-option.active .option-label {
    color: #18181b;
}

.trait-description {
    font-size: 0.75rem;
    color: #4b5563;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 4px 6px;
    text-align: center;
    font-style: italic;
    line-height: 1.2;
}

/* ===== 板块选择样式 - 完整的卡片布局 ===== */
.sectors-container-compact {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

/* 顶部搜索和统计栏 */
.sectors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    padding: 6px 10px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}

.search-section {
    flex: 1;
    max-width: 300px;
}

:deep(.compact-search .el-input__wrapper) {
    border-radius: 8px !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
}

:deep(.compact-search .el-input__wrapper:hover) {
    border-color: #9ca3af !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.compact-search.is-focus .el-input__wrapper) {
    border-color: #18181b !important;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.15) !important;
}

:deep(.compact-search .el-input__inner::placeholder) {
    color: #c1c7cd !important;
    font-size: 0.8rem !important;
    font-weight: 400 !important;
    opacity: 0.75 !important;
}

.stats-section {
    display: flex;
    gap: 8px;
}

.stat-chip {
    font-size: 0.75rem;
    color: #059669;
    font-weight: 600;
    background: #d1fae5;
    padding: 4px 10px;
    border-radius: 16px;
    white-space: nowrap;
}

/* 主要内容区域 */
.sectors-content {
    min-height: auto;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    overflow: hidden;
}

/* 搜索模式 */
.search-mode {
    padding: 8px;
}

.search-header {
    background: #18181b;
    color: white;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 4px;
    margin-bottom: 6px;
}

.search-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 6px;
}

.sector-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    min-height: auto;
}

.sector-card:hover:not(.disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sector-card.selected {
    background: rgba(24, 24, 27, 0.05);
    border-color: #18181b;
    box-shadow: 0 0 0 1px rgba(24, 24, 27, 0.2);
}

.sector-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.card-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    width: 32px;
    text-align: center;
}

.card-content {
    flex: 1;
    min-width: 0;
}

.card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
    line-height: 1.3;
}

.card-desc {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    margin-bottom: 2px;
}

.card-parent {
    font-size: 0.7rem;
    color: #9ca3af;
    background: rgba(107, 114, 128, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
    display: inline-block;
}

.card-check {
    width: 20px;
    height: 20px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    flex-shrink: 0;
}

/* 无搜索结果 */
.no-results {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
}

.no-results-content {
    text-align: center;
}

.no-results-icon {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.5;
}

.no-results-text {
    font-size: 1rem;
    color: #6b7280;
}

/* 正常模式：左右分栏 */
.normal-layout {
    display: flex;
    height: 100%;
    min-height: auto;
}

.left-section {
    flex: 0 0 45%;
    padding: 8px;
    border-right: 1px solid #e5e7eb;
    background: #fafafa;
}

.right-section {
    flex: 1;
    padding: 8px;
    background: white;
}

.section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 大分类网格 */
.major-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 4px;
}

.major-card {
    position: relative;
    padding: 6px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    background: white;
    min-height: 65px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.major-card:hover:not(.disabled) {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.major-card.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.major-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    line-height: 1.2;
}

.major-icon {
    font-size: 1.3rem;
    margin-bottom: 2px;
    line-height: 1.2;
}

.major-name {
    font-size: 0.7rem;
    font-weight: 500;
    color: #374151;
    line-height: 1.2;
}

.major-check {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

/* 细分行业 */
.sub-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sub-group {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
}

.group-header {
    background: #f1f5f9;
    padding: 4px 8px;
    font-size: 0.7rem;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
}

.sub-cards {
    padding: 6px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 4px;
}

.sub-card {
    position: relative;
    padding: 4px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    background: white;
    min-height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.sub-card:hover:not(.disabled) {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.sub-card.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 2px 8px rgba(24, 24, 27, 0.1);
}

.sub-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    line-height: 1.1;
}

.sub-icon {
    font-size: 1rem;
    margin-bottom: 1px;
}

.sub-name {
    font-size: 0.65rem;
    font-weight: 500;
    color: #374151;
    line-height: 1.1;
}

.sub-check {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 16px;
    height: 16px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 选择提示 */
.selection-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    flex-direction: column;
    gap: 8px;
    color: #6b7280;
}

.hint-icon {
    font-size: 1rem;
    opacity: 0.5;
}

.hint-text {
    font-size: 0.85rem;
}

/* PC端左右分栏布局 */
.desktop-layout {
    display: flex;
    height: 100%;
    gap: 16px;
    overflow: hidden;
}

.left-panel {
    flex: 0 0 40%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e5e7eb;
    padding-right: 16px;
    overflow: hidden;
}

.right-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.major-grid-desktop {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    flex-shrink: 0;
}

.major-card-desktop {
    position: relative;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    background: white;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.major-card-desktop:hover:not(.disabled) {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.major-card-desktop.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.major-card-desktop.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sub-grid-desktop {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
}

.sub-group-desktop {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
    flex-shrink: 0;
}

.group-header-desktop {
    background: #f1f5f9;
    padding: 8px 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
}

.sub-cards-desktop {
    padding: 8px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
}

.sub-card-desktop {
    position: relative;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    background: white;
    min-height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.sub-card-desktop:hover:not(.disabled) {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.sub-card-desktop.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 2px 8px rgba(24, 24, 27, 0.1);
}

.sub-card-desktop.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.selection-hint-desktop {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    flex-direction: column;
    gap: 8px;
    color: #6b7280;
}

/* 移动端布局 */
.mobile-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
}

/* 滚动容器 */
.step-content-scrollable {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding: 0 4px 24px 4px;
    /* 添加底部24px padding */
}

/* 搜索高亮 */
:deep(.search-highlight) {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* 操作按钮区域 - PC端 */
.action-buttons {
    display: flex;
    justify-content: center;
    /* 按钮居中显示 */
    align-items: center;
    gap: 16px;
    /* 增加按钮间距 */
    padding: 24px 20px;
    /* 添加左右安全间隔 */
    border-top: 1px solid #e5e7eb;
    /* 添加顶部分割线 */
    margin-top: 32px;
    /* 增加与内容的间距 */
    flex-shrink: 0;
    position: static;
    /* 移除固定定位 */
    background: transparent;
}

.action-btn {
    height: 44px;
    font-size: 1rem;
    border-radius: 8px;
    min-width: 120px;
    transition: all 0.2s ease;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
}

.action-btn:hover {
    background: #f9fafb;
    border-color: #9ca3af;
}

.action-btn.primary {
    background: #18181b;
    border-color: #18181b;
    color: white;
}

.action-btn.primary:hover {
    background: #374151;
    border-color: #374151;
}

/* 移动端响应式优化 - 增强用户体验 */
@media (max-width: 767px) {
    .preferences-form-container {
        padding: 0;
        background: transparent;
        min-height: auto;
        height: auto;
    }

    .step-content {
        padding: 0;
        background: transparent;
        height: auto;
        min-height: auto;
        display: flex;
        flex-direction: column;
    }

    .step-title {
        font-size: 1.2rem;
        margin: 0 0 8px 0;
        font-weight: 600;
        color: #1f2937;
        text-align: center;
        padding: 0 16px;
    }

    .step-desc {
        font-size: 0.9rem;
        margin: 0 0 20px 0;
        color: #6b7280;
        text-align: center;
        line-height: 1.5;
        padding: 0 16px;
    }

    /* 滚动容器优化 */
    .step-content-scrollable {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding: 0 12px 30px 12px;
        /* 增加底部留白 */
        min-height: 0;
        height: auto;
        /* 内容高度自适应，移除最大高度限制 */
        scroll-behavior: smooth;
    }

    /* 针对内容较少的步骤（如投资经验）进行特殊处理 */
    .step-content[data-step="0"] .step-content-scrollable,
    .step-content[data-step="1"] .step-content-scrollable {
        display: block;
        /* 移除flex布局，让内容自然堆叠 */
    }

    /* 针对内容较多的步骤（如板块选择）也保持自适应高度 */
    .step-content[data-step="3"] .step-content-scrollable {
        max-height: none;
        /* 移除高度限制 */
        overflow-y: visible;
        /* 允许内容正常显示 */
    }

    /* 确保经验选项容器不会被拉伸 */
    .step-content[data-step="0"] {
        min-height: auto;
        height: auto;
        justify-content: flex-start;
    }

    .step-content[data-step="0"] .experience-options {
        margin-bottom: 20px;
    }

    /* 风险选项容器高度优化 */
    .step-content[data-step="1"] {
        min-height: auto;
        height: auto;
        justify-content: flex-start;
    }

    .step-content[data-step="1"] .risk-options {
        margin-bottom: 20px;
    }

    /* 经验选项移动端 - 增强卡片设计 */
    .experience-options {
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: none;
        padding: 0;
        /* 确保内容自适应高度 */
        height: auto;
        min-height: auto;
    }

    .experience-option {
        gap: 16px;
        padding: 20px;
        min-height: 100px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        background: #ffffff;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .experience-option:active {
        transform: scale(0.98);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .experience-option.selected {
        border-color: #18181b;
        background: #f8fafc;
        box-shadow: 0 4px 12px rgba(24, 24, 27, 0.1);
    }

    .experience-content {
        flex: 1;
    }

    .experience-header {
        margin-bottom: 12px;
    }

    .experience-icon {
        font-size: 1.2rem;
        margin-right: 12px;
    }

    .experience-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }

    .experience-label {
        font-size: 0.75rem;
        margin-bottom: 6px;
        color: #6b7280;
        font-weight: 500;
    }

    .experience-desc {
        font-size: 0.8rem;
        line-height: 1.4;
        color: #6b7280;
    }

    /* 风险选项移动端 - 增强卡片设计 */
    .risk-options {
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: none;
        padding: 0;
    }

    .risk-option {
        gap: 16px;
        padding: 20px;
        min-height: 140px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        background: #ffffff;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .risk-option:active {
        transform: scale(0.98);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .risk-option.selected {
        border-color: #18181b;
        background: #f8fafc;
        box-shadow: 0 4px 12px rgba(24, 24, 27, 0.1);
    }

    .option-header {
        margin-bottom: 12px;
    }

    .option-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 8px;
    }

    .option-icon {
        font-size: 1.2rem;
        margin-right: 8px;
    }

    .risk-level-indicator {
        margin-bottom: 8px;
    }

    .risk-dot {
        width: 8px;
        height: 8px;
        margin-right: 4px;
    }

    .option-desc {
        font-size: 0.8rem;
        color: #6b7280;
        line-height: 1.4;
        margin-bottom: 12px;
    }

    .simple-desc {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-bottom: 12px;
    }

    .option-metrics {
        gap: 8px;
        margin-bottom: 10px;
    }

    .metric-item {
        flex: 1;
        padding: 8px;
        border-radius: 8px;
        background: #f9fafb;
    }

    .metric-label {
        font-size: 0.7rem;
        display: block;
        margin-bottom: 2px;
    }

    .metric-value {
        font-size: 0.8rem;
        font-weight: 600;
    }

    .option-examples {
        margin-top: 8px;
    }

    .examples-label {
        font-size: 0.75rem;
        margin-right: 6px;
    }

    .examples-text {
        font-size: 0.75rem;
        color: #6b7280;
    }

    /* 用户特征移动端 - 增强滑块设计 */
    .traits-container {
        padding: 0;
    }

    .traits-hint {
        padding: 16px;
        margin-bottom: 20px;
        border-radius: 12px;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
    }

    .traits-list {
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: none;
    }

    .trait-item-compact {
        padding: 20px;
        min-height: 80px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .trait-header-compact {
        margin-bottom: 16px;
    }

    .trait-left {
        gap: 12px;
    }

    .trait-icon {
        font-size: 1.2rem;
    }

    .trait-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
    }

    .trait-desc {
        font-size: 0.8rem;
        color: #6b7280;
        line-height: 1.3;
    }

    .trait-current-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #18181b;
        background: #f1f5f9;
        padding: 6px 12px;
        border-radius: 8px;
        min-width: 50px;
        text-align: center;
    }

    .trait-slider-container {
        margin-bottom: 12px;
    }

    .slider-track {
        height: 6px;
        border-radius: 3px;
        margin-bottom: 12px;
    }

    .slider-options {
        gap: 12px;
    }

    .slider-option {
        flex: 1;
        padding: 12px 6px;
        border-radius: 8px;
        transition: all 0.2s ease;
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        min-height: 48px;
    }

    .slider-option:active {
        transform: scale(0.95);
    }

    .option-dot {
        width: 12px;
        height: 12px;
        margin-bottom: 4px;
    }

    .option-label {
        font-size: 0.9rem;
        font-weight: 600;
    }

    .trait-description {
        font-size: 0.8rem;
        color: #6b7280;
        text-align: center;
        padding: 8px 12px;
        background: #f9fafb;
        border-radius: 8px;
    }

    /* 板块选择移动端 - 增强卡片设计 */
    .sectors-container-compact {
        max-width: none;
        margin: 0;
        padding: 0;
    }

    .sectors-header {
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: #ffffff;
        border-radius: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .search-section {
        max-width: none;
        width: 100%;
    }

    .compact-search {
        border-radius: 12px;
    }

    .compact-search :deep(.el-input__wrapper) {
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        height: 44px;
        transition: all 0.2s ease;
    }

    .compact-search :deep(.el-input__wrapper:focus-within) {
        border-color: #18181b;
        box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.1);
    }

    .stats-section {
        justify-content: center;
        gap: 12px;
    }

    .stat-chip {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .sectors-content {
        padding: 0;
    }

    .selection-mode {
        background: transparent;
        padding: 0;
    }

    .selection-layout {
        flex-direction: column;
        gap: 16px;
    }

    .major-selector {
        width: 100%;
        margin-bottom: 16px;
    }

    .major-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    .major-card {
        padding: 16px;
        border-radius: 12px;
        min-height: 80px;
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .major-card:active {
        transform: scale(0.98);
    }

    .sub-selector {
        width: 100%;
    }

    .sub-cards {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .sub-card {
        padding: 12px;
        border-radius: 10px;
        min-height: 60px;
        font-size: 0.8rem;
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .sub-card:active {
        transform: scale(0.98);
    }

    .search-mode {
        padding: 0;
    }

    .search-header {
        padding: 16px;
        margin-bottom: 16px;
        background: #f8fafc;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
        text-align: center;
    }

    .search-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .sector-card {
        padding: 16px;
        border-radius: 12px;
        min-height: 80px;
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .sector-card:active {
        transform: scale(0.98);
    }

    .card-icon {
        font-size: 1.2rem;
        margin-bottom: 8px;
    }

    .card-title {
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .card-desc {
        font-size: 0.8rem;
        color: #6b7280;
        margin-bottom: 6px;
    }

    .card-parent {
        font-size: 0.7rem;
        color: #9ca3af;
    }

    .card-check {
        font-size: 1.2rem;
        color: #059669;
        font-weight: bold;
    }

    .no-results {
        padding: 40px 20px;
        text-align: center;
    }

    .no-results-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .no-results-text {
        font-size: 1.1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
    }

    .no-results-hint {
        font-size: 0.9rem;
        color: #6b7280;
        line-height: 1.4;
    }

    /* 操作按钮移动端优化 */
    .action-buttons {
        display: flex;
        justify-content: center;
        /* 移动端按钮也居中显示 */
        align-items: center;
        gap: 10px;
        /* 精细调整按钮间距 */
        padding: 18px 16px;
        /* 减少上下padding */
        background: transparent;
        border-top: 1px solid #e5e7eb;
        /* 添加顶部分割线 */
        position: static;
        /* 移除固定定位 */
        margin-top: 28px;
        /* 移动端增加与内容的间距 */
        margin-left: 0;
        /* 确保贴边 */
        margin-right: 0;
        /* 确保贴边 */
        flex-shrink: 0;
        /* 安全区域适配 */
        padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
    }

    .action-buttons .action-btn {
        height: 42px;
        /* 减小按钮高度 */
        font-size: 0.9rem;
        /* 减小字体 */
        border-radius: 10px;
        /* 减小圆角 */
        min-width: 100px;
        /* 减小最小宽度 */
        padding: 0 16px;
        /* 添加水平内边距 */
        font-weight: 500;
        /* 调整字重 */
        /* 触摸优化 */
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    .action-buttons .action-btn:active {
        transform: scale(0.98);
    }

    .action-buttons .action-btn.primary {
        background: #18181b;
        border-color: #18181b;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(24, 24, 27, 0.15);
        /* 添加细微阴影 */
    }

    .action-buttons .action-btn.primary:hover {
        background: #374151;
        border-color: #374151;
        box-shadow: 0 3px 12px rgba(24, 24, 27, 0.2);
        /* 悬停时增强阴影 */
    }

    /* 移动端二级按钮样式优化 */
    .action-buttons .action-btn:not(.primary) {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #6b7280;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        /* 添加轻微阴影 */
    }

    .action-buttons .action-btn:not(.primary):hover {
        background: #f9fafb;
        border-color: #9ca3af;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        /* 悬停时增强阴影 */
    }
}

/* 平板端优化 */
@media (min-width: 768px) and (max-width: 1023px) {

    .experience-options,
    .risk-options {
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: 600px;
    }

    .major-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .sub-cards {
        grid-template-columns: repeat(3, 1fr);
    }

    .search-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 大屏优化 */
@media (min-width: 1400px) {
    .preferences-form-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .sectors-container-compact {
        max-width: 1000px;
    }
}
</style>
