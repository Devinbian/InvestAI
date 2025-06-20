<template>
    <el-dialog v-model="visible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false" width="1000px"
        class="preferences-dialog" top="10vh">
        <template #header>
            <div></div>
        </template>

        <div class="preferences-container">
            <div class="preferences-header">
                <div class="preferences-logo">
                    <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                </div>
                <h1 class="preferences-title">完善投资偏好</h1>
                <p class="preferences-subtitle">帮助我们为您提供更精准的投资建议</p>

                <!-- 步骤指示器 -->
                <div class="step-indicator">
                    <div v-for="(step, index) in preferenceSteps" :key="index" class="step-dot" :class="{
                        active: index === currentStep,
                        completed: index < currentStep,
                    }">
                        <span v-if="index < currentStep">✓</span>
                        <span v-else>{{ index + 1 }}</span>
                    </div>
                </div>
            </div>

            <div class="preferences-form-wrapper">
                <!-- 步骤1: 投资经验 -->
                <div v-if="currentStep === 0" class="step-content">
                    <h3 class="step-title">{{ preferenceSteps[0].title }}</h3>
                    <p class="step-desc">{{ preferenceSteps[0].desc }}</p>

                    <div class="experience-options">
                        <div v-for="option in experienceOptions" :key="option.value" class="experience-option"
                            :class="{ selected: preferencesForm.experience === option.value }"
                            @click="preferencesForm.experience = option.value">
                            <div class="option-radio">
                                <div class="radio-dot"
                                    :class="{ checked: preferencesForm.experience === option.value }"></div>
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

                <!-- 步骤2: 选择投资风格 -->
                <div v-if="currentStep === 1" class="step-content">
                    <h3 class="step-title">{{ preferenceSteps[1].title }}</h3>
                    <p class="step-desc">{{ preferenceSteps[1].desc }}</p>

                    <div class="risk-options">
                        <div v-for="option in riskOptions" :key="option.value" class="risk-option"
                            :class="{ selected: preferencesForm.riskLevel === option.value }"
                            @click="preferencesForm.riskLevel = option.value">
                            <div class="option-radio">
                                <div class="radio-dot" :class="{ checked: preferencesForm.riskLevel === option.value }">
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

                <!-- 步骤3: 用户特征 -->
                <div v-if="currentStep === 2" class="step-content">
                    <h3 class="step-title">{{ preferenceSteps[2].title }}</h3>
                    <p class="step-desc">{{ preferenceSteps[2].desc }}</p>

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
                                        {{ preferencesForm.userTraits[trait.id] }}分
                                    </div>
                                </div>

                                <div class="trait-slider-container">
                                    <div class="slider-track">
                                        <div class="slider-progress"
                                            :style="{ width: (preferencesForm.userTraits[trait.id] / 5) * 100 + '%' }">
                                        </div>
                                    </div>
                                    <div class="slider-options">
                                        <div v-for="option in trait.options" :key="option.value" class="slider-option"
                                            :class="{ active: preferencesForm.userTraits[trait.id] === option.value }"
                                            @click="preferencesForm.userTraits[trait.id] = option.value"
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

                <!-- 步骤4: 关注板块 -->
                <div v-if="currentStep === 3" class="step-content">
                    <h3 class="step-title">{{ preferenceSteps[3].title }}</h3>
                    <p class="step-desc">{{ preferenceSteps[3].desc }}</p>

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
                                    大分类 {{ preferencesForm.sectors.majorCategories.length }}/2
                                </span>
                                <span class="stat-chip">
                                    细分 {{ preferencesForm.sectors.subCategories.length }}/4
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
                                            selected: preferencesForm.sectors.subCategories.includes(sector.value),
                                            disabled: !preferencesForm.sectors.subCategories.includes(sector.value) && preferencesForm.sectors.subCategories.length >= 4,
                                        }" @click="toggleSubSectorFromSearch(sector)">
                                        <div class="card-icon">{{ sector.icon }}</div>
                                        <div class="card-content">
                                            <div class="card-title" v-html="highlightSearchTerm(sector.label)"></div>
                                            <div class="card-desc" v-html="highlightSearchTerm(sector.desc)"></div>
                                            <div class="card-parent">{{ getMajorSectorLabel(sector.parent) }}</div>
                                        </div>
                                        <div class="card-check"
                                            v-if="preferencesForm.sectors.subCategories.includes(sector.value)">
                                            ✓
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 无搜索结果 -->
                            <div v-else-if="sectorSearchQuery && filteredSubSectors.length === 0" class="no-results">
                                <div class="no-results-content">
                                    <div class="no-results-icon">🔍</div>
                                    <div class="no-results-text">未找到匹配的行业</div>
                                </div>
                            </div>

                            <!-- 正常模式：左右分栏 -->
                            <div v-else class="normal-layout">
                                <!-- 左侧：大分类 -->
                                <div class="left-section">
                                    <div class="section-title">📊 选择大分类 (最多2个)</div>
                                    <div class="major-grid">
                                        <div v-for="major in majorSectorOptions" :key="major.value" class="major-card"
                                            :class="{
                                                selected: preferencesForm.sectors.majorCategories.includes(major.value),
                                                disabled: !preferencesForm.sectors.majorCategories.includes(major.value) && preferencesForm.sectors.majorCategories.length >= 2,
                                            }" @click="toggleMajorSector(major.value)">
                                            <div class="major-icon" :style="{ color: major.color }">
                                                {{ major.icon }}
                                            </div>
                                            <div class="major-name">{{ major.label }}</div>
                                            <div class="major-check"
                                                v-if="preferencesForm.sectors.majorCategories.includes(major.value)">
                                                ✓
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 右侧：细分行业 -->
                                <div class="right-section">
                                    <div v-if="preferencesForm.sectors.majorCategories.length > 0">
                                        <div class="section-title">🎯 选择细分行业 (3-4个)</div>
                                        <div class="sub-grid">
                                            <div v-for="majorCategory in preferencesForm.sectors.majorCategories"
                                                :key="majorCategory" class="sub-group">
                                                <div class="group-header">
                                                    {{ getMajorSectorIcon(majorCategory) }}
                                                    {{ getMajorSectorLabel(majorCategory) }}
                                                </div>
                                                <div class="sub-cards">
                                                    <div v-for="sub in getSubSectorsByParent(majorCategory)"
                                                        :key="sub.value" class="sub-card" :class="{
                                                            selected: preferencesForm.sectors.subCategories.includes(sub.value),
                                                            disabled: !preferencesForm.sectors.subCategories.includes(sub.value) && preferencesForm.sectors.subCategories.length >= 4,
                                                        }" @click="toggleSubSector(sub.value)">
                                                        <div class="sub-icon">{{ sub.icon }}</div>
                                                        <div class="sub-name">{{ sub.label }}</div>
                                                        <div class="sub-check"
                                                            v-if="preferencesForm.sectors.subCategories.includes(sub.value)">
                                                            ✓
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="selection-hint">
                                        <div class="hint-icon">💡</div>
                                        <div class="hint-text">请先在左侧选择大分类</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 导航按钮 -->
                <div class="preferences-actions">
                    <el-button v-if="currentStep > 0" class="preferences-back-btn" @click="previousStep">
                        上一步
                    </el-button>

                    <el-button v-if="currentStep < preferenceSteps.length - 1" class="preferences-next-btn"
                        type="primary" @click="nextStep" :disabled="!canProceedToNext">
                        下一步
                    </el-button>

                    <el-button v-if="currentStep === preferenceSteps.length - 1" class="preferences-submit-btn"
                        type="primary" @click="handlePreferencesSubmit" :loading="preferencesLoading">
                        完成设置
                    </el-button>

                    <el-button class="preferences-skip-btn" @click="skipPreferences">
                        跳过
                    </el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';

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

// 响应式数据
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const preferencesLoading = ref(false);
const currentStep = ref(0);
const sectorSearchQuery = ref('');
const filteredSubSectors = ref([]);

// 表单数据
const preferencesForm = reactive({
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
const majorSectorOptions = [
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
const subSectorOptions = [
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
const canProceedToNext = computed(() => {
    switch (currentStep.value) {
        case 0:
            return preferencesForm.experience !== '';
        case 1:
            return preferencesForm.riskLevel !== '';
        case 2:
            return true;
        case 3:
            return preferencesForm.sectors.majorCategories.length > 0 &&
                preferencesForm.sectors.subCategories.length >= 3;
        default:
            return false;
    }
});

// 方法
const nextStep = () => {
    if (canProceedToNext.value && currentStep.value < preferenceSteps.length - 1) {
        currentStep.value++;
    }
};

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
};

const getCurrentTraitDescription = (traitId) => {
    const trait = userTraits.find(t => t.id === traitId);
    if (!trait) return '';

    const currentValue = preferencesForm.userTraits[traitId];
    const option = trait.options.find(opt => opt.value === currentValue);
    return option ? option.desc : '';
};

const toggleMajorSector = (value) => {
    const index = preferencesForm.sectors.majorCategories.indexOf(value);
    if (index > -1) {
        preferencesForm.sectors.majorCategories.splice(index, 1);
        const subSectorsToRemove = subSectorOptions
            .filter(sub => sub.parent === value)
            .map(sub => sub.value);
        preferencesForm.sectors.subCategories = preferencesForm.sectors.subCategories
            .filter(sub => !subSectorsToRemove.includes(sub));
    } else {
        if (preferencesForm.sectors.majorCategories.length < 2) {
            preferencesForm.sectors.majorCategories.push(value);
        }
    }
};

const toggleSubSector = (value) => {
    const index = preferencesForm.sectors.subCategories.indexOf(value);
    if (index > -1) {
        preferencesForm.sectors.subCategories.splice(index, 1);
    } else {
        if (preferencesForm.sectors.subCategories.length < 4) {
            preferencesForm.sectors.subCategories.push(value);
        }
    }
};

const getMajorSectorIcon = (value) => {
    const sector = majorSectorOptions.find(s => s.value === value);
    return sector ? sector.icon : '';
};

const getMajorSectorLabel = (value) => {
    const sector = majorSectorOptions.find(s => s.value === value);
    return sector ? sector.label : '';
};

const getSubSectorsByParent = (parentValue) => {
    return subSectorOptions.filter(sub => sub.parent === parentValue);
};

const handleSectorSearch = () => {
    if (!sectorSearchQuery.value.trim()) {
        filteredSubSectors.value = [];
        return;
    }

    const query = sectorSearchQuery.value.toLowerCase().trim();
    filteredSubSectors.value = subSectorOptions.filter(sector => {
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
    if (!preferencesForm.sectors.majorCategories.includes(subOption.parent)) {
        if (preferencesForm.sectors.majorCategories.length < 2) {
            preferencesForm.sectors.majorCategories.push(subOption.parent);
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

const handlePreferencesSubmit = async () => {
    preferencesLoading.value = true;

    setTimeout(() => {
        const preferences = {
            riskLevel: preferencesForm.riskLevel,
            experience: preferencesForm.experience,
            userTraits: preferencesForm.userTraits,
            sectors: preferencesForm.sectors,
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
        currentStep.value = 0;

        emit('preferences-completed', preferences);
    }, 1000);
};

const skipPreferences = () => {
    visible.value = false;
    currentStep.value = 0;
    ElMessage.info('您可以稍后在设置中完善投资偏好');
    emit('preferences-skipped');
};
</script>

<style scoped>
:deep(.preferences-dialog .el-dialog) {
    margin-top: 50vh !important;
    transform: translateY(-50%) !important;
}

/* Base styles for the container */
.preferences-dialog {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
    max-height: 90vh;
}

:deep(.preferences-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.preferences-dialog .el-dialog__body) {
    padding: 0;
    overflow-y: auto;
    max-height: calc(90vh - 20px);
}

.preferences-container {
    padding: 16px 24px;
    background: white;
    min-height: auto;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    overflow-x: hidden;
}

.preferences-header {
    text-align: center;
    margin-bottom: 16px;
}

.preferences-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.preferences-logo .logo-image {
    width: 32px;
    height: 32px;
    object-fit: contain;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preferences-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.preferences-subtitle {
    font-size: 0.8rem;
    margin: 0;
    color: #6b7280;
}

.preferences-form-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    margin: 0 auto;
    width: 100%;
}

.step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 0;
}

.step-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.step-desc {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 0 0 16px 0;
}

/* 步骤指示器 */
.step-indicator {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
}

.step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid #e5e7eb;
    background: white;
    color: #9ca3af;
}

.step-dot.active {
    border-color: #18181b;
    background: #18181b;
    color: white;
}

.step-dot.completed {
    border-color: #10b981;
    background: #10b981;
    color: white;
}

/* 风险偏好选项 */
.risk-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 10px;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 10px;
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

/* 投资经验选项 */
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

/* 用户特征样式 */
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

/* 紧凑的左右分栏板块选择布局 */
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
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
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
    background: #3b82f6;
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
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
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
    background: #3b82f6;
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
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.major-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.major-icon {
    font-size: 1.3rem;
    margin-bottom: 2px;
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
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.sub-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    top: -4px;
    right: -4px;
    width: 14px;
    height: 14px;
    background: #10b981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 600;
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

/* 搜索高亮 */
:deep(.search-highlight) {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* 导航按钮 */
.preferences-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid #f3f4f6;
}

.preferences-back-btn {
    min-width: 90px;
    height: 38px;
    border: 2px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.preferences-back-btn:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    color: #374151;
}

.preferences-next-btn,
.preferences-submit-btn {
    min-width: 90px;
    height: 38px;
    background: #18181b;
    border: 2px solid #18181b;
    color: white;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.2s ease;
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
    min-width: 70px;
    height: 38px;
    background: transparent;
    border: none;
    color: #6b7280;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.preferences-skip-btn:hover {
    background: #f3f4f6;
    color: #374151;
}
</style>
