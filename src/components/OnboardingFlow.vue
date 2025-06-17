<template>
    <div class="onboarding-flow">
        <!-- 第1步：欢迎引导 -->
        <div v-if="currentStep === 'welcome'" class="onboarding-step welcome-step">
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

        <!-- 第2步：投资风格选择 (原偏好设置第1步) -->
        <div v-if="currentStep === 'assessment'" class="onboarding-step">
            <div class="step-header">
                <h2 class="step-title">选择投资风格</h2>
                <p class="step-subtitle">您希望投资收益高一些，还是稳一些？选择最适合您的投资方式</p>
            </div>

            <div class="step-content">
                <div class="risk-options-grid">
                    <div v-for="option in riskOptions" :key="option.value" class="risk-option-card"
                        :class="{ 'selected': userAnswers[0] === option.value }"
                        @click="selectRiskOption(option.value)">
                        <div class="option-header">
                            <div class="option-icon">{{ option.icon }}</div>
                            <div class="option-title">{{ option.title }}</div>
                            <div class="risk-level-indicator">
                                <span v-for="i in 5" :key="i" class="risk-dot"
                                    :class="{ 'active': i <= option.riskLevel }"></span>
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
                        <div class="selection-indicator" v-if="userAnswers[0] === option.value">✓</div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <el-button @click="goToPreviousStep" class="action-btn secondary">上一步</el-button>
                <el-button @click="goToNextStep" type="primary" class="action-btn primary"
                    :disabled="!userAnswers[0]">下一步</el-button>
            </div>
        </div>

        <!-- 第3步：投资经验 (原偏好设置第2步) -->
        <div v-if="currentStep === 'demo'" class="onboarding-step">
            <div class="step-header">
                <h2 class="step-title">投资经验</h2>
                <p class="step-subtitle">告诉我们您的投资经验，帮助我们推荐合适的投资方案</p>
            </div>

            <div class="step-content">
                <div class="experience-options-grid">
                    <div v-for="option in experienceOptions" :key="option.value" class="experience-option-card"
                        :class="{ 'selected': userAnswers[1] === option.value }"
                        @click="selectExperienceOption(option.value)">
                        <div class="experience-header">
                            <span class="experience-icon">{{ option.icon }}</span>
                            <div class="experience-title">{{ option.title }}</div>
                        </div>
                        <div class="experience-label">{{ option.label }}</div>
                        <div class="experience-desc">{{ option.desc }}</div>
                        <div class="selection-indicator" v-if="userAnswers[1] === option.value">✓</div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <el-button @click="goToPreviousStep" class="action-btn secondary">上一步</el-button>
                <el-button @click="goToNextStep" type="primary" class="action-btn primary"
                    :disabled="!userAnswers[1]">下一步</el-button>
            </div>
        </div>

        <!-- 第4步：用户特征 (原偏好设置第3步) -->
        <div v-if="currentStep === 'tutorial'" class="onboarding-step">
            <div class="step-header">
                <h2 class="step-title">用户特征</h2>
                <p class="step-subtitle">帮助我们了解您的投资偏好，为您量身定制投资方案</p>
            </div>

            <div class="step-content">
                <div class="traits-container">
                    <div class="traits-hint">
                        <div class="hint-icon">💡</div>
                        <div class="hint-text">
                            <strong>新手提示：</strong>如果不确定如何选择，我们已为您设置了适合新手的默认选项，您可以直接使用或根据个人情况调整
                        </div>
                    </div>

                    <div class="traits-list">
                        <div v-for="trait in userTraits" :key="trait.id" class="trait-item">
                            <div class="trait-header">
                                <div class="trait-left">
                                    <span class="trait-icon">{{ trait.icon }}</span>
                                    <div class="trait-info">
                                        <div class="trait-title">{{ trait.title }}</div>
                                        <div class="trait-desc">{{ trait.desc }}</div>
                                    </div>
                                </div>
                                <div class="trait-current-value">
                                    {{ userAnswers[2][trait.id] }}分
                                </div>
                            </div>

                            <div class="trait-slider-container">
                                <div class="slider-track">
                                    <div class="slider-progress"
                                        :style="{ width: (userAnswers[2][trait.id] / 5) * 100 + '%' }">
                                    </div>
                                </div>
                                <div class="slider-options">
                                    <div v-for="option in trait.options" :key="option.value" class="slider-option"
                                        :class="{ 'active': userAnswers[2][trait.id] === option.value }"
                                        @click="userAnswers[2][trait.id] = option.value" :title="option.desc">
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

            <div class="step-actions">
                <el-button @click="goToPreviousStep" class="action-btn secondary">上一步</el-button>
                <el-button @click="goToNextStep" type="primary" class="action-btn primary">下一步</el-button>
            </div>
        </div>

        <!-- 第5步：关注板块 (原偏好设置第4步) -->
        <div v-if="currentStep === 'briefing'" class="onboarding-step">
            <div class="step-header">
                <h2 class="step-title">关注板块</h2>
                <p class="step-subtitle">请选择您关注的投资板块（可多选）</p>
            </div>

            <div class="step-content">
                <div class="sectors-container">
                    <div class="sectors-layout">
                        <!-- 左侧：大分类选择 -->
                        <div class="left-panel">
                            <div class="section-header">
                                <h4 class="section-title">
                                    <span class="section-icon">📊</span>
                                    选择大分类
                                    <span class="section-limit">(至少选择1个，最多2个)</span>
                                </h4>
                                <div class="section-counter">
                                    已选择 {{ userAnswers[3].majorCategories.length }}/2
                                </div>
                            </div>

                            <div class="major-sectors-list">
                                <div v-for="option in majorSectorOptions" :key="option.value"
                                    class="major-sector-option" :class="{
                                        'selected': userAnswers[3].majorCategories.includes(option.value),
                                        'disabled': !userAnswers[3].majorCategories.includes(option.value) && userAnswers[3].majorCategories.length >= 2
                                    }" @click="toggleMajorSector(option.value)">
                                    <div class="sector-icon" :style="{ color: option.color }">{{ option.icon }}</div>
                                    <div class="sector-content">
                                        <div class="sector-label">{{ option.label }}</div>
                                        <div class="sector-desc">{{ option.desc }}</div>
                                    </div>
                                    <div class="sector-check"
                                        v-if="userAnswers[3].majorCategories.includes(option.value)">
                                        ✓
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 右侧：细分行业选择 -->
                        <div class="right-panel">
                            <div v-if="userAnswers[3].majorCategories.length > 0">
                                <div class="section-header">
                                    <h4 class="section-title">
                                        <span class="section-icon">🎯</span>
                                        选择细分行业
                                        <span class="section-limit">(至少选择1个，最多4个)</span>
                                    </h4>
                                    <div class="section-counter">
                                        已选择 {{ userAnswers[3].subCategories.length }}/4
                                    </div>
                                </div>

                                <div class="sub-sectors-container">
                                    <div v-for="majorCategory in userAnswers[3].majorCategories" :key="majorCategory"
                                        class="sub-sector-group">
                                        <div class="group-title">
                                            <span class="group-icon">{{ getMajorSectorIcon(majorCategory) }}</span>
                                            {{ getMajorSectorLabel(majorCategory) }}
                                        </div>

                                        <div class="sub-sectors-grid">
                                            <div v-for="subOption in getSubSectorsByParent(majorCategory)"
                                                :key="subOption.value" class="sub-sector-option" :class="{
                                                    'selected': userAnswers[3].subCategories.includes(subOption.value),
                                                    'disabled': !userAnswers[3].subCategories.includes(subOption.value) && userAnswers[3].subCategories.length >= 4
                                                }" @click="toggleSubSector(subOption.value)">
                                                <div class="sub-sector-icon">{{ subOption.icon }}</div>
                                                <div class="sub-sector-content">
                                                    <div class="sub-sector-label">{{ subOption.label }}</div>
                                                    <div class="sub-sector-desc">{{ subOption.desc }}</div>
                                                    <div class="sub-sector-examples">{{ subOption.examples }}</div>
                                                </div>
                                                <div class="sub-sector-check"
                                                    v-if="userAnswers[3].subCategories.includes(subOption.value)">
                                                    ✓
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 选择提示 -->
                            <div class="sectors-hint" v-else>
                                <div class="hint-icon">💡</div>
                                <div class="hint-text">
                                    请先在左侧选择您感兴趣的大分类板块，然后在这里选择具体的细分行业
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <el-button @click="goToPreviousStep" class="action-btn secondary">上一步</el-button>
                <el-button @click="completeOnboarding" type="primary" class="action-btn primary"
                    :disabled="userAnswers[3].majorCategories.length === 0 || userAnswers[3].subCategories.length === 0">完成设置</el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 定义事件
const emit = defineEmits(['complete', 'analyze-stock', 'execute-action']);

// 状态管理
const currentStep = ref('welcome');
const currentQuestion = ref(0);
const assessmentProgress = ref(0);
const userAnswers = ref(['', '', {
    risk_tolerance: 3,
    active_participation: 3,
    learning_willingness: 3,
    strategy_dependency: 2,
    trading_frequency: 2,
    innovation_trial: 3
}, { majorCategories: [], subCategories: [] }]);
const currentTask = ref(1);
const totalPoints = ref(0);

// Main.vue中的完整配置数据
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

// 大分类配置（最多选择2个）
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
        desc: '包含新能源、环保、军工等新兴战略性行业',
        color: '#06b6d4'
    }
];

// 小分类配置（可选择3-4个）
const subSectorOptions = [
    // 科技板块下的小分类
    {
        value: 'internet',
        label: '互联网',
        parent: 'technology',
        icon: '🌐',
        desc: '电商、社交、搜索、云服务等互联网公司',
        examples: '腾讯、阿里巴巴、百度'
    },
    {
        value: 'chips',
        label: '芯片半导体',
        parent: 'technology',
        icon: '🔬',
        desc: '芯片设计、制造、封测等半导体产业链',
        examples: '中芯国际、韦尔股份、紫光国微'
    },
    {
        value: 'software',
        label: '软件服务',
        parent: 'technology',
        icon: '💾',
        desc: '企业软件、游戏、教育软件等',
        examples: '用友网络、恒生电子、三六零'
    },
    {
        value: 'ai',
        label: '人工智能',
        parent: 'technology',
        icon: '🤖',
        desc: 'AI算法、机器学习、智能硬件等',
        examples: '科大讯飞、海康威视、大华股份'
    },

    // 金融板块下的小分类
    {
        value: 'banks',
        label: '银行',
        parent: 'finance',
        icon: '🏛️',
        desc: '国有银行、股份制银行、城商行等',
        examples: '招商银行、平安银行、宁波银行'
    },
    {
        value: 'insurance',
        label: '保险',
        parent: 'finance',
        icon: '🛡️',
        desc: '人寿保险、财产保险等保险公司',
        examples: '中国平安、中国人寿、新华保险'
    },
    {
        value: 'securities',
        label: '证券',
        parent: 'finance',
        icon: '📈',
        desc: '证券公司、基金公司等',
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

// 使用Main.vue中的风险测试问题配置
const questions = ref([
    {
        title: '您希望的投资收益方式？',
        options: [
            {
                value: 'conservative',
                icon: '🛡️',
                label: '求稳型',
                desc: '像存银行一样稳，但收益比存款高一点',
                simpleDesc: '投1万元，一年大概赚300-600元'
            },
            {
                value: 'stable',
                icon: '🏦',
                label: '稳健型',
                desc: '选择知名大公司，收益稳定有保障',
                simpleDesc: '投1万元，一年大概赚600-1000元'
            },
            {
                value: 'balanced',
                icon: '⚖️',
                label: '均衡型',
                desc: '稳健和成长兼顾，适合大多数人',
                simpleDesc: '投1万元，一年大概赚1000-1500元'
            },
            {
                value: 'growth',
                icon: '🚀',
                label: '成长型',
                desc: '追求更高收益，选择有潜力的公司',
                simpleDesc: '投1万元，一年大概赚1500-2500元'
            },
            {
                value: 'aggressive',
                icon: '⚡',
                label: '进取型',
                desc: '追求最高收益，但风险也最大',
                simpleDesc: '投1万元，一年可能赚2500元以上'
            }
        ]
    },
    {
        title: '您的投资经验？',
        options: [
            {
                value: 'beginner',
                icon: '🌱',
                label: '投资新手',
                desc: '刚开始接触投资，希望从简单稳健的方式开始',
                simpleDesc: '我是投资新手，想稳步学习'
            },
            {
                value: 'experienced',
                icon: '📈',
                label: '有投资经验',
                desc: '已经有过投资经历，了解市场波动，能接受一定风险',
                simpleDesc: '我有一定投资经验，可以承担风险'
            }
        ]
    },
    {
        title: '您感兴趣的投资板块？（先选大类）',
        options: [
            {
                value: 'tech',
                icon: '💻',
                label: '科技板块',
                desc: '包含互联网、软件、硬件、人工智能等科技相关行业',
                simpleDesc: '关注科技创新，看好未来发展'
            },
            {
                value: 'finance',
                icon: '🏦',
                label: '金融板块',
                desc: '包含银行、保险、证券、支付等金融服务行业',
                simpleDesc: '稳定分红，抗通胀能力强'
            },
            {
                value: 'consumer',
                icon: '🛍️',
                label: '消费板块',
                desc: '包含食品饮料、服装、家电、零售等消费相关行业',
                simpleDesc: '日常消费，容易理解和跟踪'
            },
            {
                value: 'healthcare',
                icon: '🏥',
                label: '医疗板块',
                desc: '包含医药、医疗器械、生物技术等医疗健康行业',
                simpleDesc: '人口老龄化，长期增长趋势'
            },
            {
                value: 'industrial',
                icon: '🏭',
                label: '工业板块',
                desc: '包含制造业、建筑、交通运输等传统工业',
                simpleDesc: '经济复苏受益，基建投资拉动'
            }
        ]
    },
    {
        title: '请选择您最感兴趣的细分领域',
        options: [] // 动态根据上一步选择生成
    }
]);

// 新手任务
const tutorialTasks = ref([
    {
        id: 1,
        icon: "🔍",
        title: "AI诊断体验",
        desc: "查看您的投资风格分析，了解个人风险偏好",
        reward: 10,
        completed: false
    },
    {
        id: 2,
        icon: "💰",
        title: "模拟交易",
        desc: "模拟买入一只推荐股票，体验交易流程",
        reward: 20,
        completed: false
    },
    {
        id: 3,
        icon: "⚠️",
        title: "风控设置",
        desc: "设置一个止损提醒，学会控制风险",
        reward: 30,
        completed: false
    },
    {
        id: 4,
        icon: "📊",
        title: "市场分析",
        desc: "学习看懂K线图和技术指标，掌握基本分析",
        reward: 25,
        completed: false
    },
    {
        id: 5,
        icon: "📈",
        title: "趋势跟踪",
        desc: "关注市场热点，学会识别投资机会",
        reward: 15,
        completed: false
    }
]);

// 计算属性
const userProfile = computed(() => {
    const riskLevel = userAnswers.value[0] || 'moderate';
    const experience = userAnswers.value[1] || 'beginner';
    const sector = userAnswers.value[2] || 'tech';

    const profiles = {
        conservative: {
            riskLabel: "稳健型",
            description: "注重资金安全，追求稳定收益",
            strategy: "高股息股票和债券基金",
            focusSector: getSectorName(sector)
        },
        moderate: {
            riskLabel: "平衡型",
            description: "追求收益与风险的平衡",
            strategy: "蓝筹股和成长股组合",
            focusSector: getSectorName(sector)
        },
        aggressive: {
            riskLabel: "进取型",
            description: "追求高收益，能承担较高风险",
            strategy: "成长股和科技股",
            focusSector: getSectorName(sector)
        }
    };

    return profiles[riskLevel] || profiles.moderate;
});

const demoPortfolio = computed(() => {
    const riskLevel = userAnswers.value[0] || 'moderate';
    const portfolios = {
        conservative: [
            { code: "600036", name: "招商银行", reason: "高股息蓝筹股", weight: 40 },
            { code: "000858", name: "五粮液", reason: "消费龙头股", weight: 35 },
            { code: "000001", name: "平安银行", reason: "金融稳健股", weight: 25 }
        ],
        moderate: [
            { code: "000858", name: "五粮液", reason: "消费龙头", weight: 35 },
            { code: "300750", name: "宁德时代", reason: "新能源龙头", weight: 35 },
            { code: "600036", name: "招商银行", reason: "金融蓝筹", weight: 30 }
        ],
        aggressive: [
            { code: "300750", name: "宁德时代", reason: "新能源龙头", weight: 40 },
            { code: "000001", name: "深科技", reason: "科技成长股", weight: 35 },
            { code: "600519", name: "贵州茅台", reason: "消费白马股", weight: 25 }
        ]
    };
    return portfolios[riskLevel] || portfolios.moderate;
});

const personalizedRecommendations = computed(() => {
    const sector = userAnswers.value[2] || 'tech';
    const recommendations = {
        tech: [
            { code: "300750", name: "宁德时代", reason: "新能源汽车产业链核心标的" },
            { code: "000001", name: "深科技", reason: "AI+制造业双重概念" }
        ],
        traditional: [
            { code: "600036", name: "招商银行", reason: "金融板块龙头，股息率稳定" },
            { code: "000858", name: "五粮液", reason: "白酒行业龙头，品牌价值突出" }
        ],
        healthcare: [
            { code: "300760", name: "迈瑞医疗", reason: "医疗器械龙头，业绩稳定增长" },
            { code: "000661", name: "长春高新", reason: "生物医药细分领域龙头" }
        ]
    };
    return recommendations[sector] || recommendations.tech;
});

const personalizedNews = computed(() => {
    const sector = userAnswers.value[2] || 'tech';
    const news = {
        tech: [
            { id: 1, sector: "新能源", title: "政策利好频出，新能源汽车渗透率持续提升" },
            { id: 2, sector: "人工智能", title: "AI芯片需求旺盛，相关公司业绩预期向好" }
        ],
        traditional: [
            { id: 1, sector: "银行", title: "央行降准释放流动性，银行板块估值有望修复" },
            { id: 2, sector: "白酒", title: "春节消费旺季来临，白酒企业备货积极" }
        ],
        healthcare: [
            { id: 1, sector: "医药", title: "创新药审批加速，生物医药行业迎来发展机遇" },
            { id: 2, sector: "医疗器械", title: "国产替代趋势明显，医疗器械企业受益" }
        ]
    };
    return news[sector] || news.tech;
});

const todaySuggestion = computed(() => {
    const riskLevel = userAnswers.value[0] || 'moderate';
    const suggestions = {
        conservative: "当前适合定投，建议分批买入优质蓝筹股",
        moderate: "市场震荡期，可考虑低位加仓成长股",
        aggressive: "科技股调整到位，可关注超跌反弹机会"
    };
    return suggestions[riskLevel];
});

const suggestionAction = computed(() => "一键设置");

const allTasksCompleted = computed(() => {
    return tutorialTasks.value.every(task => task.completed);
});

// 方法
const getSectorName = (sector) => {
    const names = {
        tech: "科技",
        traditional: "金融",
        healthcare: "医疗"
    };
    return names[sector] || "科技";
};

const startAssessment = () => {
    currentStep.value = 'assessment';
    // 模拟进度条动画
    const timer = setInterval(() => {
        assessmentProgress.value += 2;
        if (assessmentProgress.value >= 100) {
            clearInterval(timer);
        }
    }, 50);
};

const selectOption = (value) => {
    userAnswers.value[currentQuestion.value] = value;

    // 如果是第三个问题（板块选择），动态生成第四个问题的选项
    if (currentQuestion.value === 2) {
        const selectedSector = value;
        if (secondaryOptions[selectedSector]) {
            questions.value[3].options = secondaryOptions[selectedSector];
        }
    }

    setTimeout(() => {
        if (currentQuestion.value < questions.value.length - 1) {
            currentQuestion.value++;
        } else {
            currentStep.value = 'demo';
        }
    }, 300);
};

const startTutorial = () => {
    currentStep.value = 'tutorial';
};

const executeTask = (task) => {
    if (task.completed) return;

    task.completed = true;
    totalPoints.value += task.reward;

    ElMessage.success(`任务完成！获得${task.reward}积分`);

    // 模拟任务执行
    emit('execute-action', {
        type: getTaskType(task.id),
        task: task
    });

    if (allTasksCompleted.value) {
        setTimeout(() => {
            currentStep.value = 'briefing';
        }, 1000);
    }
};

const getTaskType = (taskId) => {
    const types = {
        1: 'diagnosis',
        2: 'mock-trade',
        3: 'risk-control'
    };
    return types[taskId];
};

const enterMainInterface = () => {
    currentStep.value = 'briefing';
};

const analyzeStock = (stock) => {
    emit('analyze-stock', stock);
};

const handleSuggestionAction = () => {
    emit('execute-action', {
        type: 'auto-invest',
        suggestion: todaySuggestion.value
    });
};

const completeBriefing = () => {
    // 保存用户偏好到本地存储
    const userPreferences = {
        riskLevel: userAnswers.value[0],
        experience: userAnswers.value[1],
        focusSector: userAnswers.value[2],
        completedAt: new Date().toISOString()
    };

    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    localStorage.setItem('onboardingCompleted', 'true');

    ElMessage.success('个性化设置完成，明天将为您推送专属简报！');

    emit('complete', {
        preferences: userPreferences,
        profile: userProfile.value
    });
};

const formatTime = (date) => {
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
};

// 组件挂载时检查是否已完成引导
onMounted(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (completed) {
        emit('complete');
    }

    // 添加body类名确保滚动可用
    document.body.classList.add('onboarding-mode');
});

// 组件销毁时移除body类名
onUnmounted(() => {
    document.body.classList.remove('onboarding-mode');
});

// 新增的方法函数
const selectRiskOption = (value) => {
    userAnswers.value[0] = value;
};

const selectExperienceOption = (value) => {
    userAnswers.value[1] = value;
    // 选择后自动跳转到下一步
    setTimeout(() => {
        goToNextStep();
    }, 300); // 稍微延迟让用户看到选择效果
};

const goToPreviousStep = () => {
    if (currentStep.value === 'assessment') {
        currentStep.value = 'welcome';
    } else if (currentStep.value === 'demo') {
        currentStep.value = 'assessment';
    } else if (currentStep.value === 'tutorial') {
        currentStep.value = 'demo';
    } else if (currentStep.value === 'briefing') {
        currentStep.value = 'tutorial';
    }
};

const goToNextStep = () => {
    if (currentStep.value === 'welcome') {
        currentStep.value = 'assessment';
    } else if (currentStep.value === 'assessment') {
        currentStep.value = 'demo';
    } else if (currentStep.value === 'demo') {
        currentStep.value = 'tutorial';
    } else if (currentStep.value === 'tutorial') {
        currentStep.value = 'briefing';
    }
};

// 用户特征描述
const getCurrentTraitDescription = (traitId) => {
    const trait = userTraits.find(t => t.id === traitId);
    if (!trait) return '';

    const currentValue = userAnswers.value[2][traitId];
    const option = trait.options.find(opt => opt.value === currentValue);
    return option ? option.desc : '';
};

// 板块选择相关方法
const toggleMajorSector = (value) => {
    const index = userAnswers.value[3].majorCategories.indexOf(value);
    if (index > -1) {
        // 移除选择
        userAnswers.value[3].majorCategories.splice(index, 1);
        // 同时移除相关的子分类
        userAnswers.value[3].subCategories = userAnswers.value[3].subCategories
            .filter(subValue => !getSubSectorsByParent(value).find(sub => sub.value === subValue));
    } else {
        // 添加选择
        if (userAnswers.value[3].majorCategories.length < 2) {
            userAnswers.value[3].majorCategories.push(value);
        }
    }
};

const toggleSubSector = (value) => {
    const index = userAnswers.value[3].subCategories.indexOf(value);
    if (index > -1) {
        userAnswers.value[3].subCategories.splice(index, 1);
    } else {
        if (userAnswers.value[3].subCategories.length < 4) {
            userAnswers.value[3].subCategories.push(value);
        }
    }
};

const getMajorSectorIcon = (majorCategory) => {
    const option = majorSectorOptions.find(opt => opt.value === majorCategory);
    return option ? option.icon : '📊';
};

const getMajorSectorLabel = (majorCategory) => {
    const option = majorSectorOptions.find(opt => opt.value === majorCategory);
    return option ? option.label : majorCategory;
};

const getSubSectorsByParent = (parentValue) => {
    return subSectorOptions.filter(option => option.parent === parentValue);
};

const completeOnboarding = () => {
    // 保存用户偏好到本地存储
    const userPreferences = {
        riskLevel: userAnswers.value[0],
        experience: userAnswers.value[1],
        userTraits: userAnswers.value[2],
        sectors: userAnswers.value[3],
        completedAt: new Date().toISOString()
    };

    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    localStorage.setItem('onboardingCompleted', 'true');

    ElMessage.success('个性化设置完成！');

    emit('complete', {
        preferences: userPreferences,
        profile: userProfile.value
    });
};
</script>

<style scoped>
.onboarding-flow {
    width: 100vw;
    height: calc(100vh - 56px);
    background: #fafbfc;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    box-sizing: border-box;
    position: relative;
}

.onboarding-step {
    background: white;
    border-radius: 20px;
    max-width: 1200px;
    width: 100%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    animation: slideIn 0.5s ease-out;
    margin: 0 auto;
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 96px);
    overflow: hidden;
}

/* 步骤布局样式 */
.step-header {
    flex-shrink: 0;
    padding: 30px 30px 0 30px;
    text-align: center;
}

.step-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 30px;
    /* 自定义滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
}

.step-content::-webkit-scrollbar {
    width: 6px;
}

.step-content::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 3px;
}

.step-content::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
}

.step-content::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}

.step-actions {
    flex-shrink: 0;
    padding: 24px 30px 32px 30px;
    border-top: 1px solid #e2e8f0;
    background: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 新手训练营特殊样式 */
.tutorial-step {
    max-height: none;
    padding: 40px;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 欢迎页面样式 */
.welcome-hero {
    text-align: center;
}

.hero-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.hero-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 16px;
}

.hero-subtitle {
    font-size: 1.2rem;
    color: #718096;
    margin-bottom: 40px;
}

.hero-features {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-bottom: 40px;
}

.feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.feature-icon {
    font-size: 2rem;
}

.feature-text {
    font-weight: 600;
    color: #4a5568;
}

.start-btn {
    padding: 16px 32px;
    font-size: 1.1rem;
    border-radius: 12px;
    margin-bottom: 40px;
}

/* 评估测试样式 */
.assessment-header {
    text-align: center;
    margin-bottom: 40px;
}

.assessment-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 20px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    margin-bottom: 12px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-text {
    color: #718096;
    font-weight: 600;
}

.question-card {
    text-align: center;
}

.question-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 30px;
}

.question-options {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.option-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.option-card:hover {
    border-color: #667eea;
    background: #f7faff;
    transform: translateY(-2px);
}

.option-icon {
    font-size: 2rem;
    flex-shrink: 0;
}

.option-content {
    text-align: left;
    flex: 1;
}

.option-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 4px;
}

.option-desc {
    color: #718096;
}

/* 演示页面样式 */
.demo-header {
    text-align: center;
    margin-bottom: 40px;
}

.demo-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.demo-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 20px;
}

.user-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.profile-tag {
    background: #667eea;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
}

.profile-desc {
    color: #718096;
}

.demo-portfolio {
    margin-bottom: 40px;
}

.portfolio-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 20px;
    text-align: center;
}

.portfolio-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.portfolio-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f7faff;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.stock-name {
    font-weight: 600;
    color: #1a202c;
}

.stock-reason {
    font-size: 0.9rem;
    color: #718096;
}

.stock-weight {
    font-weight: 700;
    color: #667eea;
    font-size: 1.1rem;
}

.ai-strategy-demo {
    background: #e6fffa;
    padding: 16px;
    border-radius: 10px;
    border-left: 4px solid #38b2ac;
}

.strategy-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.strategy-icon {
    font-size: 1.5rem;
}

.strategy-text {
    color: #1a202c;
    line-height: 1.5;
}

.experience-btn {
    width: 100%;
    padding: 16px;
    font-size: 1.1rem;
    border-radius: 12px;
}

/* 训练营样式 */
.tutorial-header {
    text-align: center;
    margin-bottom: 30px;
}

.tutorial-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
}

.tutorial-subtitle {
    color: #718096;
    margin-bottom: 20px;
    font-size: 0.95rem;
}

.tutorial-progress {
    display: flex;
    justify-content: center;
    gap: 20px;
}

.progress-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #718096;
    transition: all 0.3s ease;
}

.progress-circle.completed {
    background: #48bb78;
    color: white;
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 30px;
}

.task-card {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    height: auto;
    min-height: auto;
    overflow: visible;
    word-wrap: break-word;
}

.task-card:hover {
    border-color: #667eea;
    background: #f7faff;
}

.task-card.completed {
    background: #f0fff4;
    border-color: #48bb78;
}

.task-card.active {
    border-color: #667eea;
    background: #f7faff;
}

.task-icon {
    font-size: 2rem;
    flex-shrink: 0;
    margin-top: 2px;
    line-height: 1;
}

.task-content {
    flex: 1;
    min-width: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.task-title {
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 6px;
    line-height: 1.4;
}

.task-desc {
    color: #718096;
    margin-bottom: 10px;
    line-height: 1.4;
    word-wrap: break-word;
}

.task-reward {
    color: #ed8936;
    font-weight: 600;
    font-size: 0.9rem;
    margin-top: auto;
}

.task-status {
    flex-shrink: 0;
}

.task-check {
    color: #48bb78;
    font-size: 1.5rem;
}

.completion-reward {
    text-align: center;
    background: #f0fff4;
    padding: 30px;
    border-radius: 12px;
    border: 2px solid #48bb78;
}

/* 简报样式 */
.briefing-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
}

.briefing-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
}

.briefing-time {
    color: #718096;
}

.briefing-section {
    margin-bottom: 30px;
}

.section-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 16px;
}

.recommendation-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.rec-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f7faff;
    border-radius: 10px;
    border-left: 4px solid #667eea;
}

.rec-name {
    font-weight: 600;
    color: #1a202c;
}

.rec-reason {
    font-size: 0.9rem;
    color: #718096;
}

.news-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.news-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f7faff;
    border-radius: 8px;
}

.news-tag {
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.news-text {
    color: #1a202c;
}

.suggestion-card {
    background: #fff5f5;
    padding: 20px;
    border-radius: 10px;
    border-left: 4px solid #f56565;
    text-align: center;
}

.suggestion-text {
    margin-bottom: 16px;
    color: #1a202c;
    line-height: 1.5;
}

.briefing-footer {
    text-align: center;
    padding-top: 20px;
    border-top: 2px solid #e2e8f0;
}

.continue-btn {
    padding: 16px 32px;
    font-size: 1.1rem;
    border-radius: 12px;
}

/* Web端适配样式 */
.web-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    max-width: 1300px;
    margin: 0 auto;
    align-items: start;
    grid-auto-rows: auto;
}

/* 特殊处理：当有5个选项时强制单行显示 */
.web-options:has(.web-option-card:nth-child(5)) {
    grid-template-columns: repeat(5, 1fr);
    max-width: 1400px;
    align-items: stretch;
}

/* 如果浏览器不支持:has，使用媒体查询作为后备 */
@supports not selector(:has(div)) {
    .web-options {
        grid-template-columns: repeat(5, minmax(200px, 1fr));
        max-width: 1400px;
        align-items: stretch;
    }
}

.web-option-card {
    min-height: 180px;
    height: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    text-align: center;
    cursor: pointer;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    background: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: visible;
    word-wrap: break-word;
    word-break: break-word;
}

.web-option-card:hover {
    border-color: #667eea;
    background: #f7faff;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.web-option-card .option-icon {
    font-size: 2.2rem;
    margin-bottom: 12px;
    flex-shrink: 0;
}

.web-option-card .option-label {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
    flex-shrink: 0;
}

.web-option-card .option-desc {
    font-size: 0.85rem;
    color: #718096;
    line-height: 1.4;
    margin-bottom: 6px;
    flex: 1;
    display: flex;
    align-items: center;
    text-align: center;
}

.web-option-card .option-simple-desc {
    font-size: 0.8rem;
    color: #667eea;
    font-weight: 600;
    margin-top: auto;
    flex-shrink: 0;
}

.web-portfolio-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto 20px auto;
}

.web-portfolio-card {
    padding: 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.web-task-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 16px;
    max-width: 1200px;
    margin: 0 auto 20px auto;
    align-items: start;
    grid-auto-rows: auto;
}

.web-task-card {
    padding: 20px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    height: auto;
    min-height: auto;
    overflow: visible;
}

.web-task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.web-briefing-content {
    max-width: 1000px;
    margin: 0 auto;
}

.web-recommendation-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
}

.web-rec-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.web-news-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 12px;
}

.web-news-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.web-suggestion-card {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 1500px) {
    .web-options {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
        max-width: 1300px !important;
        align-items: stretch !important;
    }

    .web-option-card {
        min-height: 200px;
        padding: 24px 18px;
    }
}

@media (max-width: 1200px) {
    .web-options {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
        max-width: 1100px !important;
        align-items: stretch !important;
    }

    .web-option-card {
        min-height: 220px;
        padding: 20px 16px;
    }

    .web-option-card .option-desc {
        font-size: 0.8rem;
        line-height: 1.3;
    }

    .web-task-list {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 18px;
    }

    .web-task-card {
        padding: 20px;
    }

    .task-desc {
        font-size: 0.9rem;
    }
}

@media (max-width: 992px) {
    .web-options {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
        max-width: 900px !important;
        align-items: stretch !important;
    }

    .web-option-card {
        min-height: 240px;
        padding: 18px 14px;
    }

    .web-option-card .option-icon {
        font-size: 2rem;
    }

    .web-option-card .option-label {
        font-size: 1rem;
    }

    .web-option-card .option-desc {
        font-size: 0.75rem;
        line-height: 1.2;
    }

    .web-option-card .option-simple-desc {
        font-size: 0.75rem;
    }

    .web-task-list {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
    }

    .web-task-card {
        padding: 18px;
    }

    .task-icon {
        font-size: 1.8rem;
    }

    .task-title {
        font-size: 0.95rem;
    }

    .task-desc {
        font-size: 0.85rem;
    }

    .task-reward {
        font-size: 0.8rem;
    }
}

@media (max-width: 768px) {
    .onboarding-step {
        padding: 20px;
        margin: 10px;
    }

    .tutorial-step {
        padding: 20px;
    }

    .tutorial-header {
        margin-bottom: 20px;
    }

    .tutorial-title {
        font-size: 1.5rem;
        margin-bottom: 6px;
    }

    .tutorial-subtitle {
        font-size: 0.9rem;
        margin-bottom: 15px;
    }

    .hero-features {
        flex-direction: column;
        gap: 20px;
    }

    .web-options {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
        max-width: 100% !important;
        align-items: stretch !important;
    }

    .web-option-card {
        min-height: auto;
        height: auto;
        padding: 24px 20px;
        justify-content: flex-start;
    }

    .web-option-card .option-icon {
        font-size: 2.5rem;
        margin-bottom: 16px;
    }

    .web-option-card .option-label {
        font-size: 1.2rem;
        margin-bottom: 12px;
    }

    .web-option-card .option-desc {
        font-size: 0.9rem;
        line-height: 1.4;
        margin-bottom: 12px;
    }

    .web-option-card .option-simple-desc {
        font-size: 0.85rem;
        margin-top: 8px;
    }

    .web-portfolio-cards {
        grid-template-columns: 1fr;
    }

    .web-task-list {
        grid-template-columns: 1fr;
        gap: 16px;
        margin: 0 auto 20px auto;
    }

    .web-task-card {
        padding: 20px;
    }

    .web-recommendation-cards {
        grid-template-columns: 1fr;
    }

    .web-news-items {
        grid-template-columns: 1fr;
    }

    .task-card {
        flex-direction: column;
        text-align: center;
        gap: 12px;
        align-items: center;
        padding: 20px;
    }

    .web-task-card {
        padding: 20px;
        min-height: auto;
    }

    .task-content {
        text-align: center;
        width: 100%;
    }

    .task-icon {
        font-size: 2.2rem;
        margin-top: 0;
    }

    .task-title {
        font-size: 1.1rem;
        margin-bottom: 8px;
    }

    .task-desc {
        font-size: 0.9rem;
        line-height: 1.5;
        margin-bottom: 12px;
    }

    .task-reward {
        font-size: 0.85rem;
        margin-top: 4px;
    }
}

/* Web端新增样式 */
.step-header {
    text-align: center;
    margin-bottom: 40px;
}

.step-title {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 16px;
}

.step-subtitle {
    font-size: 1.1rem;
    color: #718096;
}



.action-btn {
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 600;
}

.action-btn.secondary {
    background: #f7faff;
    border: 1px solid #e2e8f0;
    color: #718096;
}

.action-btn.primary {
    background: #667eea;
    border: 1px solid #667eea;
    color: white;
}

/* 风险选项样式 */
.risk-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    max-width: 1300px;
    margin: 0 auto;
}

.risk-option-card {
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
}

.risk-option-card.selected {
    border-color: #667eea;
    background: #f7faff;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.risk-option-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.option-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1a202c;
}

.risk-level-indicator {
    display: flex;
    gap: 4px;
}

.risk-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e2e8f0;
    transition: background 0.3s ease;
}

.risk-dot.active {
    background: #667eea;
}

.simple-desc {
    font-size: 0.9rem;
    color: #667eea;
    font-weight: 600;
    margin-bottom: 12px;
}

.option-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.metric-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
}

.metric-label {
    color: #718096;
}

.metric-value.return {
    color: #10b981;
    font-weight: 600;
}

.metric-value.loss {
    color: #ef4444;
    font-weight: 600;
}

.option-examples {
    font-size: 0.8rem;
    color: #718096;
}

.examples-label {
    font-weight: 600;
}

.selection-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 24px;
    height: 24px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

/* 投资经验样式 */
.experience-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.experience-option-card {
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    padding: 32px 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
    text-align: center;
}

.experience-option-card.selected {
    border-color: #667eea;
    background: #f7faff;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
}

.experience-option-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.1);
}

.experience-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
}

.experience-icon {
    font-size: 2.5rem;
}

.experience-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a202c;
}

.experience-label {
    font-size: 1rem;
    color: #667eea;
    font-weight: 600;
    margin-bottom: 12px;
}

.experience-desc {
    font-size: 0.9rem;
    color: #718096;
    line-height: 1.5;
}

/* 用户特征样式 */
.traits-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 10px;
}

.traits-hint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #fff5f5;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    border-left: 4px solid #f56565;
}

.hint-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.hint-text {
    font-size: 0.9rem;
    color: #1a202c;
    line-height: 1.5;
}

.traits-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.trait-item {
    background: #fafbfc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    position: relative;
}

.trait-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.trait-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.trait-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.trait-info {
    flex: 1;
}

.trait-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 4px;
}

.trait-desc {
    font-size: 0.9rem;
    color: #718096;
}

.trait-current-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #667eea;
}

.trait-slider-container {
    margin-bottom: -10px;
    position: relative;
    height: 70px;
    /* 确保有足够高度显示滑块和标签 */
}

.slider-track {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    position: relative;
    margin: 20px 0;
}

.slider-progress {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.slider-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 30%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    /* 精确将滑块球定位到轨道中心 */
}

.slider-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    padding-bottom: 35px;
    /* 为标签留出空间 */
}

.slider-option.active .option-dot {
    background: #667eea;
    transform: scale(1.3);
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.option-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #cbd5e0;
    border: 2px solid white;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-option:hover .option-dot {
    background: #a0aec0;
    transform: scale(1.1);
}

.option-label {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 600;
    white-space: nowrap;
    text-align: center;
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.trait-description {
    font-size: 0.85rem;
    color: #718096;
    font-style: italic;
    text-align: center;
    padding: 12px;
    background: #f7faff;
    border-radius: 8px;
}

/* 板块选择样式 */
.sectors-container {
    max-width: 1200px;
    margin: 0 auto;
}

.sectors-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
}

.section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a202c;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-limit {
    font-size: 0.85rem;
    color: #718096;
    font-weight: 400;
}

.section-counter {
    font-size: 0.9rem;
    color: #667eea;
    font-weight: 600;
}

.major-sectors-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.major-sector-option {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.major-sector-option.selected {
    border-color: #667eea;
    background: #f7faff;
}

.major-sector-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.major-sector-option:hover:not(.disabled) {
    border-color: #667eea;
    transform: translateY(-1px);
}

.sector-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.sector-content {
    flex: 1;
}

.sector-label {
    font-size: 1rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 4px;
}

.sector-desc {
    font-size: 0.85rem;
    color: #718096;
    line-height: 1.4;
}

.sector-check {
    width: 20px;
    height: 20px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
}

.sub-sectors-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.sub-sector-group {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
}

.group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

.sub-sectors-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
}

.sub-sector-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.sub-sector-option.selected {
    border-color: #667eea;
    background: #f7faff;
}

.sub-sector-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sub-sector-option:hover:not(.disabled) {
    border-color: #667eea;
}

.sub-sector-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.sub-sector-content {
    flex: 1;
}

.sub-sector-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 2px;
}

.sub-sector-desc {
    font-size: 0.8rem;
    color: #718096;
    margin-bottom: 4px;
}

.sub-sector-examples {
    font-size: 0.75rem;
    color: #667eea;
    font-weight: 500;
}

.sub-sector-check {
    width: 16px;
    height: 16px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.7rem;
    position: absolute;
    top: 8px;
    right: 8px;
}

.sectors-hint {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f7faff;
    padding: 24px;
    border-radius: 12px;
    border: 2px dashed #667eea;
    text-align: center;
}

@media (max-width: 768px) {
    .sectors-layout {
        grid-template-columns: 1fr;
        gap: 32px;
    }

    .risk-options-grid {
        grid-template-columns: 1fr;
    }

    .experience-options-grid {
        grid-template-columns: 1fr;
    }
}
</style>
