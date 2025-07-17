<template>
    <el-dialog v-model="dialogVisible" title="AI委托交易设置" :width="isMobile ? '95vw' : '750px'"
        :top="isMobile ? '5vh' : '15vh'" class="ai-trading-dialog" :class="{ 'mobile-dialog': isMobile }"
        destroy-on-close append-to-body :z-index="11000" :close-on-click-modal="false"
        :modal-class="isMobile ? 'mobile-modal' : ''">
        <!-- 空状态处理 -->
        <div v-if="!stock" class="empty-stock-info">
            <div class="empty-icon">⚠️</div>
            <p>股票信息加载中...</p>
            <p class="debug-text">请确保已正确选择股票</p>
        </div>

        <!-- 量化分析加载状态 -->
        <div v-if="stock && isQuantAnalyzing" class="quant-analyzing-container">
            <div class="quant-analyzing-content">
                <div class="stock-info-mini">
                    <h3>{{ stock.name || '未知股票' }}</h3>
                    <span class="stock-code">{{ stock.code || '000000' }}</span>
                </div>

                <div class="analyzing-animation">
                    <div class="analyzing-icon">
                        <div class="spinner"></div>
                        <div class="analyzing-symbol">📊</div>
                    </div>
                    <div class="analyzing-text">
                        <h4>正在进行量化分析...</h4>
                        <p class="analyzing-desc">AI正在分析{{ stock.name }}的技术指标和基本面数据，为您制定最优交易策略</p>
                        <p class="real-analysis-hint">🤖 正在调用后台AI引擎进行实时量化分析</p>
                    </div>
                </div>

                <div class="analyzing-progress">
                    <div class="progress-steps">
                        <div class="step" :class="{ 'active': currentStep >= 1, 'completed': currentStep > 1 }">
                            <div class="step-icon">📈</div>
                            <span class="step-text">技术分析</span>
                        </div>
                        <div class="step" :class="{ 'active': currentStep >= 2, 'completed': currentStep > 2 }">
                            <div class="step-icon">💰</div>
                            <span class="step-text">基本面分析</span>
                        </div>
                        <div class="step" :class="{ 'active': currentStep >= 3, 'completed': currentStep > 3 }">
                            <div class="step-icon">🎯</div>
                            <span class="step-text">策略生成</span>
                        </div>
                        <div class="step" :class="{ 'active': currentStep >= 4, 'completed': currentStep > 4 }">
                            <div class="step-icon">✅</div>
                            <span class="step-text">完成</span>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                    </div>
                </div>

                <div class="analyzing-tips">
                    <div class="tip-item">
                        <span class="tip-icon">💡</span>
                        <span class="tip-text">{{ currentTip }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="stock && !isQuantAnalyzing" class="ai-trading-content">
            <!-- 股票信息头部 -->
            <div class="stock-header">
                <div class="stock-left">
                    <div class="stock-name-section">
                        <h3>{{ stock.name || '未知股票' }}</h3>
                        <span class="stock-code">{{ stock.code || '000000' }}</span>
                    </div>
                    <span class="current-price">¥{{ stock.price || stock.currentPrice || '0.00' }}</span>
                </div>
                <div class="stock-right">
                    <span class="cost-label">服务费用</span>
                    <div class="cost-pricing">
                        <span class="cost-original">3智点</span>
                        <span class="cost-promo">1智点</span>
                    </div>
                </div>
            </div>

            <!-- 滚动内容区域 -->
            <div class="dialog-scroll-content" :class="{ 'wechat-scroll': isWechat }" ref="scrollContainer">
                <!-- 交易设置表单 -->
                <el-form :model="form" class="ai-trading-form simple">
                    <!-- 基本交易参数 -->
                    <div class="form-section compact">
                        <h4 class="section-title">交易设置</h4>
                        <div class="simple-grid">
                            <div class="param-item">
                                <label class="param-label">交易方向</label>
                                <el-select v-model="form.action" class="param-input">
                                    <el-option label="买入" value="buy" />
                                    <el-option label="卖出" value="sell" />
                                </el-select>
                            </div>
                            <div class="param-item">
                                <label class="param-label">交易数量</label>
                                <el-input-number v-model="form.quantity" :min="100" :step="100" class="param-input"
                                    controls-position="right" />
                            </div>
                        </div>
                    </div>

                    <!-- 委托价格设置 -->
                    <div class="form-section compact">
                        <h4 class="section-title">委托价格</h4>
                        <div class="price-controls">
                            <div class="price-item">
                                <label class="param-label">
                                    <span v-if="form.action === 'buy'">最高买入价格</span>
                                    <span v-else>最低卖出价格</span>
                                </label>
                                <div class="price-input-container">
                                    <el-input-number v-model="form.limitPrice" :min="0.01" :precision="2" :step="0.01"
                                        class="price-input" controls-position="right" placeholder="请输入价格" />
                                    <span class="price-unit">元</span>
                                </div>
                            </div>
                            <div class="price-description">
                                <div class="price-desc-content">
                                    <div class="current-price-info">
                                        <span class="current-price-label">预计资金：</span>
                                        <span class="current-price-value">¥{{ estimatedAmount.toFixed(2) }}</span>
                                    </div>
                                    <div class="price-logic-desc">
                                        <span v-if="form.action === 'buy'" class="logic-text">
                                            💡 买入时，AI将在价格不超过此限价时执行交易
                                        </span>
                                        <span v-else class="logic-text">
                                            💡 卖出时，AI将在价格不低于此限价时执行交易
                                        </span>
                                        <!-- 显示价格调整信息 -->
                                        <div v-if="userAdjustedPrice && userPriceOffset[form.action] !== 0"
                                            class="price-adjustment-info">
                                            <span class="adjustment-icon">👤</span>
                                            <span class="adjustment-text">
                                                您已调整价格{{ userPriceOffset[form.action] > 0 ? '+' : '' }}{{
                                                    (userPriceOffset[form.action] * 100).toFixed(1) }}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 量化策略信息 -->
                    <div class="form-section compact" v-if="plan && (plan.strategy || plan.factors || plan.riskLevel)">
                        <h4 class="section-title">量化策略信息</h4>
                        <!-- 调试信息 -->
                        <div class="debug-info" v-if="false">
                            <p>plan对象: {{ JSON.stringify(plan) }}</p>
                            <p>显示条件: {{ !!(plan && (plan.strategy || plan.factors || plan.riskLevel)) }}</p>
                        </div>
                        <div class="strategy-info">
                            <div v-if="plan.strategy" class="strategy-item">
                                <div class="strategy-header">
                                    <span class="strategy-icon">🎯</span>
                                    <span class="strategy-title">交易策略</span>
                                </div>
                                <div class="strategy-content">
                                    {{ plan.strategy }}
                                </div>
                            </div>

                            <div v-if="plan.factors && plan.factors.length > 0" class="factors-item">
                                <div class="factors-header">
                                    <span class="factors-icon">📊</span>
                                    <span class="factors-title">量化因子</span>
                                </div>
                                <div class="factors-content">
                                    <div v-for="(factor, index) in plan.factors" :key="index" class="factor-item">
                                        <span class="factor-name">{{ factor.name }}</span>
                                        <span class="factor-value">{{ factor.value }}</span>
                                        <span v-if="factor.weight" class="factor-weight">权重: {{ factor.weight }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="plan.riskLevel" class="risk-info">
                                <div class="risk-header">
                                    <span class="risk-icon">⚠️</span>
                                    <span class="risk-title">风险等级</span>
                                </div>
                                <div class="risk-content">
                                    <el-tag :type="getRiskLevelColor(plan.riskLevel)" size="small">
                                        {{ plan.riskLevel }}
                                    </el-tag>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 委托设置 -->
                    <div class="form-section compact">
                        <h4 class="section-title">委托设置</h4>
                        <div class="order-settings">
                            <div class="order-item">
                                <label class="param-label">委托时效选择</label>
                                <div class="time-option-selector">
                                    <el-radio-group v-model="form.timeInForceType" class="time-options">
                                        <el-radio value="DAY" class="time-option" :disabled="isAfterMarketClose()">
                                            <div class="option-content"
                                                :class="{ 'disabled-option': isAfterMarketClose() }">
                                                <span class="option-title">当日有效</span>
                                                <span class="option-time">{{ getTodayEndTime() }}</span>
                                                <span v-if="isAfterMarketClose()"
                                                    class="disabled-reason">（已过收盘时间）</span>
                                            </div>
                                        </el-radio>
                                        <el-radio value="QUANT" class="time-option">
                                            <div class="option-content">
                                                <span class="option-title">量化有效期内</span>
                                                <span class="option-time">{{ getQuantValidityTime() }}</span>
                                            </div>
                                        </el-radio>
                                    </el-radio-group>
                                </div>

                                <!-- 实际有效期显示 -->
                                <div class="actual-validity-display">
                                    <div class="actual-validity-info">
                                        <span class="actual-label">实际有效期：</span>
                                        <span class="actual-time">{{ getActualValidityTime() }}</span>
                                        <span class="actual-reason">({{ getValidityReason() }})</span>
                                    </div>
                                    <div class="validity-note">
                                        <el-alert :title="getValidityDescription()" type="info" :closable="false"
                                            show-icon />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </el-form>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading">
                    <span class="confirm-text">确认委托 (1智点)</span>
                    <span class="confirm-text-mobile">确认 (1智点)</span>
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { getStockPlan, exeuteTradePlan } from '@/api/api.js';
import { ref, onMounted, reactive, watch, computed, nextTick } from 'vue';
import { useUserStore } from '../store/user';
import { useChatHistoryStore } from '../store/chatHistory';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { authFetchEventSource } from '@/utils/request';
import { processSSEData } from '@/utils/sseDecoder';
import { headUrl } from '@/config/baseUrl';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Object,
        default: null
    }
});

const plan = ref({
    buyPrice: null,
    sellPrice: null,
    expireDate: null,
    strategy: null,
    factors: [],
    riskLevel: null,
});

// 开始量化分析动画和真实分析
const startQuantAnalysis = () => {
    isQuantAnalyzing.value = true;
    currentStep.value = 0;
    progressPercent.value = 0;
    currentTip.value = analysisTips[0];
    analysisStartTime = Date.now(); // 记录开始时间

    // 步骤进度定时器
    stepTimer = setInterval(() => {
        if (currentStep.value < 4) {
            currentStep.value++;
            progressPercent.value = (currentStep.value / 4) * 100;

            if (currentStep.value <= analysisTips.length) {
                currentTip.value = analysisTips[currentStep.value - 1];
            }
        }
    }, 1000);

    // 真正调用后台量化分析接口
    if (props.stock && props.stock.code) {
        performRealQuantAnalysis(props.stock.code);
    }
};

// 执行真实的量化分析
const performRealQuantAnalysis = async (stockCode) => {
    try {
        console.log('🚀 AITradingDialog - starting real quant analysis for:', stockCode);

        // 获取当前会话ID，如果没有则创建新会话
        let conversationId = chatHistoryStore.currentChatId;
        if (!conversationId) {
            console.log('📊 AITradingDialog - 创建新会话用于量化分析');
            conversationId = await chatHistoryStore.getConversationId();
        }
        console.log('📊 AITradingDialog - 使用会话ID:', conversationId);

        let quantAnalysisCompleted = false;
        let quantAnalysisResult = '';

        // 完成量化分析的处理函数
        const finishQuantAnalysis = () => {
            if (!quantAnalysisCompleted) {
                quantAnalysisCompleted = true;

                // 确保动画至少运行4.5秒
                const minAnimationTime = 4500;
                const elapsedTime = Date.now() - analysisStartTime;
                const remainingTime = Math.max(0, minAnimationTime - elapsedTime);

                setTimeout(() => {
                    stopQuantAnalysis();

                    // 显示分析完成提示
                    console.log('✅ AITradingDialog - 量化分析完成，共接收数据:', quantAnalysisResult.length, '字符');

                    // 量化分析完成后，获取股票计划数据
                    loadQuantData(stockCode);
                }, remainingTime);
            }
        };

        // 调用真实的量化分析流式接口
        const abortController = new AbortController();

        authFetchEventSource(`${headUrl}/chat/analyzeStock?conversationId=${conversationId}&stock=${encodeURIComponent(stockCode)}`, {
            method: 'GET',
            signal: abortController.signal,
            retryInterval: 0,
            backoffMultiplier: 0,

            onopen: async (response) => {
                console.log('📊 AITradingDialog - quant analysis connection opened');
            },

            onmessage: (event) => {
                try {
                    const rawData = event.data;
                    const data = processSSEData(rawData, "量化分析");

                    if (data && data.content) {
                        quantAnalysisResult += data.content;
                        console.log('📈 AITradingDialog - receiving quant analysis data:', data.content.substring(0, 100) + '...');

                        // 根据接收到的内容更新进度提示
                        if (data.content.includes('技术指标') || data.content.includes('RSI') || data.content.includes('MACD')) {
                            currentTip.value = '正在分析技术指标RSI、MACD、KDJ...';
                        } else if (data.content.includes('基本面') || data.content.includes('财务') || data.content.includes('PE')) {
                            currentTip.value = '正在评估基本面财务指标...';
                        } else if (data.content.includes('风险') || data.content.includes('收益')) {
                            currentTip.value = '正在计算风险收益比...';
                        } else if (data.content.includes('策略') || data.content.includes('建议')) {
                            currentTip.value = '正在生成最优交易策略...';
                        }
                    }
                } catch (error) {
                    console.error('❌ AITradingDialog - error processing SSE data:', error);
                }
            },

            onerror: (error) => {
                console.error('❌ AITradingDialog - quant analysis error:', error);
                // 即使出错也要完成流程
                finishQuantAnalysis();
            },

            onclose: () => {
                console.log('✅ AITradingDialog - quant analysis completed');
                finishQuantAnalysis();
            }
        }).catch((error) => {
            console.error('❌ AITradingDialog - authFetchEventSource error:', error);
            finishQuantAnalysis();
        });

    } catch (error) {
        console.error('❌ AITradingDialog - performRealQuantAnalysis error:', error);
        // 出错时也要完成流程，避免界面卡住
        setTimeout(() => {
            stopQuantAnalysis();
            loadQuantData(stockCode);
        }, 2000);
    }
};

// 停止量化分析动画
const stopQuantAnalysis = () => {
    if (stepTimer) {
        clearInterval(stepTimer);
        stepTimer = null;
    }
    if (analysisTimer) {
        clearTimeout(analysisTimer);
        analysisTimer = null;
    }
    isQuantAnalyzing.value = false;
    currentStep.value = 0;
    progressPercent.value = 0;
};

// 加载量化数据
const loadQuantData = async (stockCode) => {
    try {
        console.log('📊 AITradingDialog - loading quant data for:', stockCode);

        const res = await getStockPlan(stockCode);
        console.log('📊 AITradingDialog - getStockPlan response:', res);

        if (res.data.success && res.data.data) {
            if (res.data.data.factors) {
                res.data.data.factors = JSON.parse(res.data.data.factors);
            }
            // 合并API数据和默认数据
            plan.value = {
                ...plan.value,
                ...res.data.data
            };
            console.log('✅ AITradingDialog - plan updated:', plan.value);

            // 保存量化分析的原始价格
            originalQuantPrice.value = {
                buy: plan.value.buyPrice ? parseFloat(plan.value.buyPrice) : null,
                sell: plan.value.sellPrice ? parseFloat(plan.value.sellPrice) : null
            };

            // 设置基准价格（用于计算用户偏移）
            const currentStockPrice = parseFloat(props.stock?.price || props.stock?.currentPrice || 0);
            basePrices.value = {
                buy: originalQuantPrice.value.buy || currentStockPrice,
                sell: originalQuantPrice.value.sell || currentStockPrice
            };

            // 只在初次加载时设置价格，避免覆盖用户调整
            if (!priceInitialized.value) {
                // 根据当前交易方向设置初始价格
                if (form.action === 'buy' && basePrices.value.buy) {
                    form.limitPrice = basePrices.value.buy;
                } else if (form.action === 'sell' && basePrices.value.sell) {
                    form.limitPrice = basePrices.value.sell;
                } else if (currentStockPrice > 0) {
                    // 如果没有量化价格，使用当前价格
                    form.limitPrice = currentStockPrice;
                }
                priceInitialized.value = true;
                console.log('💰 AITradingDialog - price initialized:', form.limitPrice);
            }
        }
    } catch (error) {
        console.error('❌ AITradingDialog - getStockPlan error:', error);
        // 即使API失败，也保持默认的策略信息

        // 如果API失败且价格未初始化，使用股票当前价格
        if (!priceInitialized.value && props.stock && props.stock.price) {
            form.limitPrice = parseFloat(props.stock.price || props.stock.currentPrice);
            priceInitialized.value = true;
        }
    }
};

watch(() => props.stock, (newStock) => {
    console.log('🔍 AITradingDialog - stock changed:', newStock);

    if (newStock && newStock.code) {
        // 重置价格状态
        priceInitialized.value = false;
        userAdjustedPrice.value = false;
        originalQuantPrice.value = { buy: null, sell: null };
        userPriceOffset.value = { buy: 0, sell: 0 };
        basePrices.value = { buy: null, sell: null };

        // 初始化限价（临时设置，最终以量化分析结果为准）
        const currentPrice = parseFloat(newStock.price || newStock.currentPrice || 0);
        if (currentPrice > 0) {
            form.limitPrice = currentPrice;
        }

        // 先设置默认的量化策略信息
        plan.value = {
            buyPrice: null,
            sellPrice: null,
            expireDate: null,
            strategy: `基于${newStock.name}的技术分析和基本面分析的多因子量化策略，结合RSI、MACD等技术指标和财务指标进行综合评估`,
            factors: [
                { name: "RSI指标", value: "62.5", weight: "25%" },
                { name: "MACD信号", value: "看涨", weight: "20%" },
                { name: "成交量", value: "活跃", weight: "15%" },
                { name: "PE估值", value: "合理", weight: "25%" },
                { name: "ROE", value: "15.2%", weight: "15%" }
            ],
            riskLevel: "中风险"
        };

        // 不直接调用API，而是先开始量化分析动画
        // 在动画结束后再调用API获取数据
    } else {
        console.warn('⚠️ AITradingDialog - invalid stock data:', newStock);
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'ai-trading-confirmed']);

// Store
const userStore = useUserStore();
const chatHistoryStore = useChatHistoryStore();

// 响应式数据
const loading = ref(false);
const scrollContainer = ref(null);
let timeCheckTimer = null;

// 量化分析状态
const isQuantAnalyzing = ref(false);
const currentStep = ref(0);
const progressPercent = ref(0);
const currentTip = ref('');

// 分析提示语
const analysisTips = [
    '正在获取实时市场数据...',
    '分析技术指标RSI、MACD、KDJ...',
    '评估基本面财务指标...',
    '计算风险收益比...',
    '生成最优交易策略...',
    '策略验证完成，准备委托设置'
];

let analysisTimer = null;
let stepTimer = null;
let analysisStartTime = null; // 记录分析开始时间

// 价格管理状态
const priceInitialized = ref(false); // 标记价格是否已初始化
const userAdjustedPrice = ref(false); // 标记用户是否手动调整过价格
const originalQuantPrice = ref({ buy: null, sell: null }); // 保存量化分析的原始价格
const userPriceOffset = ref({ buy: 0, sell: 0 }); // 保存用户的价格偏移偏好（相对于基准价格）
const basePrices = ref({ buy: null, sell: null }); // 保存基准价格（用于计算偏移）

// 检测移动端和微信浏览器
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

const isWechat = computed(() => {
    if (typeof window === 'undefined') return false;
    return /micromessenger/i.test(navigator.userAgent);
});

// 计算属性：对话框显示状态
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 表单数据
const form = reactive({
    // 核心参数（用户必须设置）
    action: 'buy', // buy, sell
    quantity: 100,

    // 委托价格设置
    limitPrice: 0.01, // 用户输入的最高买入价格或最低卖出价格

    // 委托设置
    timeInForce: 'DAY', // 固定为当日有效
    timeInForceType: 'DAY', // 用户选择的委托时效类型：DAY(当日有效) 或 QUANT(量化有效期内)
    orderType: 'limit', // 固定为限价单

    // 量化分析有效期（从消息中获取）
    quantValidityEndTime: null,
});

// 监听交易方向变化，智能更新限价
watch(() => form.action, (newAction, oldAction) => {
    console.log('🔄 AITradingDialog - action changed:', oldAction, '->', newAction, 'userAdjusted:', userAdjustedPrice.value);

    // 如果还没有初始化，跳过
    if (!priceInitialized.value) {
        return;
    }

    // 获取新方向的基准价格
    const newBasePrice = basePrices.value[newAction];
    if (!newBasePrice || newBasePrice <= 0) {
        console.warn('⚠️ AITradingDialog - no base price for action:', newAction);
        return;
    }

    let newPrice = newBasePrice;

    // 如果用户已经调整过这个方向的价格，应用用户的偏好
    if (userAdjustedPrice.value && userPriceOffset.value[newAction] !== 0) {
        // 应用用户之前在这个方向上的价格偏好
        newPrice = newBasePrice * (1 + userPriceOffset.value[newAction]);
        console.log('💡 AITradingDialog - applying user price preference:', {
            action: newAction,
            basePrice: newBasePrice,
            offset: (userPriceOffset.value[newAction] * 100).toFixed(2) + '%',
            newPrice: newPrice.toFixed(2)
        });
    } else {
        // 使用基准价格（量化分析推荐价格或股票当前价格）
        console.log('💰 AITradingDialog - using base price:', {
            action: newAction,
            basePrice: newBasePrice
        });
    }

    // 临时禁用价格监听，避免触发用户调整检测
    const tempDisableWatch = () => {
        priceInitialized.value = false;
        form.limitPrice = parseFloat(newPrice.toFixed(2));
        // 下一个tick重新启用监听
        nextTick(() => {
            priceInitialized.value = true;
        });
    };

    tempDisableWatch();
});

// 监听价格变化，检测用户是否手动调整并记录偏好
watch(() => form.limitPrice, (newPrice, oldPrice) => {
    // 如果价格已经初始化，且价格发生变化，说明用户手动调整了
    if (priceInitialized.value && oldPrice !== undefined && newPrice !== oldPrice) {
        userAdjustedPrice.value = true;

        // 计算并保存用户的价格偏移偏好
        const currentAction = form.action;
        const basePrice = basePrices.value[currentAction];

        if (basePrice && basePrice > 0) {
            // 计算相对偏移（百分比）
            const offset = (newPrice - basePrice) / basePrice;
            userPriceOffset.value[currentAction] = offset;

            console.log('👤 AITradingDialog - user adjusted price:', {
                action: currentAction,
                from: oldPrice,
                to: newPrice,
                basePrice: basePrice,
                offset: (offset * 100).toFixed(2) + '%'
            });
        }
    }
});

// 计算预计资金
const estimatedAmount = computed(() => {
    const price = parseFloat(form.limitPrice) || 0;
    const quantity = parseInt(form.quantity) || 0;
    return price * quantity;
});

// 从用户偏好初始化AI交易参数
const initAITradingFromPreferences = () => {
    const preferences = userStore.userInfo?.preferences;
    if (preferences) {
        // 根据用户风险偏好设置默认限价
        const currentPrice = parseFloat(props.stock?.price || props.stock?.currentPrice || 0);
        if (currentPrice > 0) {
            switch (preferences.riskLevel) {
                case 'conservative':
                    form.limitPrice = form.action === 'buy' ? currentPrice * 1.01 : currentPrice * 0.99; // 保守型用户，较小的价格偏移
                    break;
                case 'moderate':
                    form.limitPrice = form.action === 'buy' ? currentPrice * 1.02 : currentPrice * 0.98; // 稳健型用户，中等价格偏移
                    break;
                case 'aggressive':
                    form.limitPrice = form.action === 'buy' ? currentPrice * 1.03 : currentPrice * 0.97; // 激进型用户，较大的价格偏移
                    break;
                default:
                    form.limitPrice = currentPrice; // 默认为当前价格
                    break;
            }
        } else {
            form.limitPrice = 0.01; // 默认最小值
        }
    }
};

// 获取风险等级文本
const getRiskLevelText = (level) => {
    // 数值格式映射
    const riskLevelMap = {
        1: '求稳型',
        2: '稳健型',
        3: '均衡型',
        4: '成长型',
        5: '进取型'
    };

    // 字符串格式映射
    const riskValueMap = {
        'conservative': '求稳型',
        'stable': '稳健型',
        'balanced': '均衡型',
        'growth': '成长型',
        'aggressive': '进取型',
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'moderate': '稳健型'
    };

    // 先尝试数值格式
    if (typeof level === 'number' && riskLevelMap[level]) {
        return riskLevelMap[level];
    }

    // 再尝试字符串格式
    if (typeof level === 'string' && riskValueMap[level]) {
        return riskValueMap[level];
    }

    return '未设置';
};

// 获取风险等级颜色
const getRiskLevelColor = (level) => {
    const colorMap = {
        '低风险': 'success',
        '中风险': 'warning',
        '高风险': 'danger',
        '保守型': 'success',
        '稳健型': 'primary',
        '激进型': 'danger'
    };
    return colorMap[level] || 'info';
};

// 获取委托时效文本
const getTimeInForceText = (timeInForce) => {
    const timeInForceMap = {
        'GTC': '好价成交',
        'DAY': '当日有效',
        'IOC': '立即成交或取消',
        'GTD': '指定日期'
    };
    return timeInForceMap[timeInForce] || timeInForce;
};

// 判断当前时间是否已超过收盘时间
const isAfterMarketClose = () => {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(15, 0, 0, 0); // 设置为当日15:00收盘
    return now > todayEnd;
};

// 获取当日收盘时间
const getTodayEndTime = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 设置为当日15:00收盘
    return todayEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取量化分析有效期时间
const getQuantValidityTime = () => {
    if (plan.value && plan.value.expireDate) {
        const endTime = new Date(plan.value.expireDate);
        return endTime.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    // 默认3天后
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 3);
    defaultEnd.setHours(23, 59, 59, 999);
    return defaultEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取实际有效期时间（取两者较短时间）
const getActualValidityTime = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘

    let quantEnd;
    if (plan.value && plan.value.expireDate) {
        quantEnd = new Date(plan.value.expireDate);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }
    let actualEnd = todayEnd;
    if (form.timeInForceType === 'DAY') {
        actualEnd = todayEnd;
    } else {
        actualEnd = quantEnd;
    }
    // 取较短时间
    return actualEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getActualTime = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘

    let quantEnd;
    if (plan.value && plan.value.expireDate) {
        quantEnd = new Date(plan.value.expireDate);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }
    let actualEnd = todayEnd;
    if (form.timeInForceType === 'DAY') {
        actualEnd = todayEnd;
    } else {
        actualEnd = quantEnd;
    }
    return actualEnd.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).replace(/\//g, '-');
};

// 获取有效期描述
const getValidityDescription = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘

    let quantEnd;
    if (plan.value && plan.value.expireDate) {
        quantEnd = new Date(plan.value.expireDate);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }

    const userChoice = form.timeInForceType;
    const actualIsTodayEnd = todayEnd < quantEnd;

    if (userChoice === 'DAY') {
        if (actualIsTodayEnd) {
            return '您选择当日有效，委托将在今日收盘前有效';
        } else {
            return '您选择当日有效，但量化分析有效期更短，委托将在量化有效期结束时失效';
        }
    } else { // QUANT

        return '您选择量化有效期内有效，委托将在量化分析有效期结束时失效';

    }
};

// 获取有效期原因
const getValidityReason = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘

    let quantEnd;
    if (form.quantValidityEndTime) {
        quantEnd = new Date(form.quantValidityEndTime);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }

    if (todayEnd < quantEnd) {
        return '取当日收盘时间';
    } else if (todayEnd > quantEnd) {
        return '取量化有效期时间';
    } else {
        return '两者时间相同';
    }
};

// 启动时间检查定时器
const startTimeCheckTimer = () => {
    // 清除之前的定时器
    if (timeCheckTimer) {
        clearInterval(timeCheckTimer);
    }

    // 每分钟检查一次时间
    timeCheckTimer = setInterval(() => {
        // 如果当前选择的是当日有效，但已经超过收盘时间，自动切换
        if (form.timeInForceType === 'DAY' && isAfterMarketClose()) {
            form.timeInForceType = 'QUANT';
            ElMessage.warning('已超过收盘时间，自动切换为量化有效期内');
        }
    }, 60000); // 每分钟检查一次
};

// 停止时间检查定时器
const stopTimeCheckTimer = () => {
    if (timeCheckTimer) {
        clearInterval(timeCheckTimer);
        timeCheckTimer = null;
    }
};

// 处理取消
const handleCancel = () => {
    stopTimeCheckTimer();
    dialogVisible.value = false;
};

// 处理确认
const handleConfirm = async () => {
    // 检查智点余额
    if (userStore.smartPointsBalance < 1) {
        ElMessage.error('智点余额不足，请先充值');
        return;
    }

    // 表单验证
    if (!props.stock) {
        ElMessage.error('股票信息错误');
        return;
    }

    if (form.quantity < 100 || form.quantity % 100 !== 0) {
        ElMessage.error('交易数量必须是100的整数倍');
        return;
    }

    // 时间验证：如果选择当日有效但已超过收盘时间，阻止提交
    if (form.timeInForceType === 'DAY' && isAfterMarketClose()) {
        try {
            await ElMessageBox.confirm(
                '您选择的"当日有效"委托已超过收盘时间（15:00），无法提交。是否自动切换为"量化有效期内"并继续委托？',
                '委托时效已过期',
                {
                    confirmButtonText: '切换为量化有效期内',
                    cancelButtonText: '取消委托',
                    type: 'warning',
                    customClass: 'high-z-index-dialog',
                    appendTo: 'body'
                }
            );

            // 用户确认切换，自动切换到量化有效期内
            form.timeInForceType = 'QUANT';
            ElMessage.success('已自动切换为量化有效期内，继续委托流程');
        } catch {
            // 用户取消，停止委托流程
            return;
        }
    }

    // 支付确认提示
    try {
        await ElMessageBox.confirm(
            `AI委托交易 ${props.stock.name}(${props.stock.code}) 促销价仅需 1智点（原价3智点），是否确认支付并设置委托交易？`,
            '付费服务确认',
            {
                confirmButtonText: '确认支付 1智点',
                cancelButtonText: '取消',
                type: 'info',
                customClass: 'high-z-index-dialog',
                appendTo: 'body'
            }
        );

    } catch {
        // 用户取消支付
        return;
    }


    try {
        loading.value = true;

        // 扣除智点并记录交易
        if (userStore.deductSmartPoints(1)) {
            // 记录智点消费
            userStore.addSmartPointsTransaction({
                type: 'consumption',
                amount: 1,
                description: `AI委托交易 - ${props.stock.name}`,
                serviceType: 'ai-trading',
                stockInfo: {
                    name: props.stock.name,
                    code: props.stock.code,
                },
                balanceAfter: userStore.smartPointsBalance,
            });
            ElMessage.success('支付成功，正在设置AI委托交易...委托记录可在记录中心查看');
        } else {
            ElMessage.error('支付失败，智点余额不足');
            return;
        }

        // 使用用户最终确认的委托价格
        const finalPrice = form.limitPrice;

        exeuteTradePlan({
            code: props.stock.code,
            name: props.stock.name,
            action: form.action,
            quantity: form.quantity,
            orderType: form.orderType,
            price: finalPrice, // 买入时的委托价格
            sellPrice: finalPrice, // 卖出时的委托价格
            expireTime: getActualTime(),
        });

        console.log('📋 AITradingDialog - 委托执行参数:', {
            stock: props.stock.name,
            code: props.stock.code,
            action: form.action,
            quantity: form.quantity,
            finalPrice: finalPrice,
            userAdjusted: userAdjustedPrice.value,
            priceOffset: userAdjustedPrice.value ? userPriceOffset.value[form.action] : 'none'
        });

        // 关闭对话框
        stopTimeCheckTimer();
        dialogVisible.value = false;

        // // 发送事件给父组件，不再包含消息内容
        // emit('ai-trading-confirmed', {
        //     stock: props.stock,
        //     tradingParams: tradingParams
        // });

    } catch (error) {
        ElMessage.error('设置失败，请稍后重试');
        console.error('AI委托交易设置失败:', error);
    } finally {
        loading.value = false;
    }
};

// 滚动处理
const handleScroll = (event) => {
    console.log('滚动事件触发:', {
        scrollTop: event.target.scrollTop,
        scrollHeight: event.target.scrollHeight,
        clientHeight: event.target.clientHeight
    });
};



// 微信浏览器滚动修复
const fixWechatScroll = () => {
    if (!isWechat.value || !scrollContainer.value) return;

    const element = scrollContainer.value;

    // 微信浏览器需要特殊处理
    element.style.overflow = 'auto';
    element.style.overflowY = 'auto';
    element.style.webkitOverflowScrolling = 'touch';
    element.style.touchAction = 'pan-y';
    element.style.transform = 'translateZ(0)';
    element.style.position = 'relative';

    // 强制触发滚动事件来激活滚动功能
    setTimeout(() => {
        element.scrollTop = 1;
        setTimeout(() => {
            element.scrollTop = 0;
        }, 50);
    }, 100);

    // 添加触摸事件监听器来强制启用滚动
    const handleTouchStart = (e) => {
        e.stopPropagation();
    };

    const handleTouchMove = (e) => {
        e.stopPropagation();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    console.log('微信浏览器滚动修复已应用:', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        canScroll: element.scrollHeight > element.clientHeight,
        userAgent: navigator.userAgent
    });
};

// 监听对话框打开，初始化表单
watch(() => props.modelValue, (newVal) => {
    console.log('🔍 AITradingDialog - modelValue changed:', newVal, 'stock:', props.stock);

    if (newVal && props.stock) {
        console.log('✅ AITradingDialog - initializing with stock:', props.stock);
        initAITradingFromPreferences();

        // 确保策略信息已初始化
        if (!plan.value.strategy) {
            plan.value = {
                buyPrice: null,
                sellPrice: null,
                expireDate: null,
                strategy: `基于${props.stock.name}的技术分析和基本面分析的多因子量化策略，结合RSI、MACD等技术指标和财务指标进行综合评估`,
                factors: [
                    { name: "RSI指标", value: "62.5", weight: "25%" },
                    { name: "MACD信号", value: "看涨", weight: "20%" },
                    { name: "成交量", value: "活跃", weight: "15%" },
                    { name: "PE估值", value: "合理", weight: "25%" },
                    { name: "ROE", value: "15.2%", weight: "15%" }
                ],
                riskLevel: "中风险"
            };
        }

        // 初始化量化分析有效期（默认3天）
        const quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
        form.quantValidityEndTime = quantEnd.toISOString();

        // 检查是否超过收盘时间，如果是则自动选择量化有效期内
        if (isAfterMarketClose()) {
            form.timeInForceType = 'QUANT';
        } else {
            form.timeInForceType = 'DAY';
        }

        // 启动量化分析流程
        startQuantAnalysis();

        // 延迟应用微信浏览器滚动修复
        setTimeout(() => {
            fixWechatScroll();
        }, 5000); // 等量化分析完成后再应用滚动修复

        // 启动时间检查定时器，每分钟检查一次是否超过收盘时间
        startTimeCheckTimer();
    } else if (!newVal) {
        // 弹窗关闭时清理定时器和重置状态
        stopTimeCheckTimer();
        stopQuantAnalysis();

        // 重置价格管理状态，为下次打开做准备
        priceInitialized.value = false;
        userAdjustedPrice.value = false;
        originalQuantPrice.value = { buy: null, sell: null };
        userPriceOffset.value = { buy: 0, sell: 0 };
        basePrices.value = { buy: null, sell: null };
    }
});
</script>

<style scoped>
/* AI委托交易对话框样式 */
.ai-trading-dialog {
    border-radius: 16px;
    overflow: hidden;
}

.ai-trading-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    margin: 0;
}

.ai-trading-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 18px;
}

.ai-trading-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
    font-size: 20px;
}

.ai-trading-content {
    padding: 0;
}

/* 空状态样式 */
.empty-stock-info {
    padding: 40px 24px;
    text-align: center;
    color: #6b7280;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.debug-text {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
}

/* 调试信息样式 */
.debug-info {
    background: #f3f4f6;
    padding: 12px;
    margin: 16px 24px;
    border-radius: 8px;
    font-size: 12px;
    color: #374151;
    border-left: 4px solid #3b82f6;
}

.debug-info p {
    margin: 4px 0;
    word-break: break-all;
}

/* 量化分析加载界面样式 */
.quant-analyzing-container {
    padding: 24px;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quant-analyzing-content {
    text-align: center;
    max-width: 400px;
    width: 100%;
}

.stock-info-mini {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 32px;
    padding: 12px 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.stock-info-mini h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}

.stock-info-mini .stock-code {
    background: #e2e8f0;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
}

.analyzing-animation {
    margin-bottom: 32px;
}

.analyzing-icon {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
}

.spinner {
    width: 80px;
    height: 80px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.analyzing-symbol {
    font-size: 48px;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
    position: relative;
    z-index: 2;
    line-height: 80px;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes spin {
    0% {
        transform: translate(-50%, -50%) rotate(0deg);
    }

    100% {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
}

.analyzing-text h4 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
}

.analyzing-desc {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
}

.real-analysis-hint {
    margin: 0;
    font-size: 13px;
    color: #3b82f6;
    font-weight: 500;
    animation: blink 2s ease-in-out infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

.analyzing-progress {
    margin-bottom: 24px;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
    position: relative;
}

.progress-steps::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e2e8f0;
    z-index: 1;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
    z-index: 2;
}

.step-icon {
    width: 40px;
    height: 40px;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.3s ease;
}

.step.active .step-icon {
    background: #dbeafe;
    border-color: #3b82f6;
    transform: scale(1.1);
}

.step.completed .step-icon {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.step-text {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
}

.step.active .step-text {
    color: #3b82f6;
    font-weight: 600;
}

.step.completed .step-text {
    color: #3b82f6;
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 3px;
    transition: width 0.5s ease;
    position: relative;
}

.progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

.analyzing-tips {
    padding: 16px;
    background: #f0f9ff;
    border-radius: 12px;
    border: 1px solid #bfdbfe;
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
}

.tip-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.tip-text {
    font-size: 14px;
    color: #1e40af;
    font-weight: 500;
}

/* 股票信息头部 */
.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.stock-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.stock-name-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stock-name-section h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    background: #e2e8f0;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.current-price {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
}

.stock-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
}

.cost-label {
    font-size: 12px;
    color: #64748b;
}

.cost-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.cost-original {
    background: #9ca3af;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 3px;
    border-radius: 2px;
    text-decoration: line-through;
    opacity: 0.9;
}

.cost-promo {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
    position: relative;
}

/* 促销价的轻微动画效果 */
.cost-promo::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    border-radius: 3px;
    animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
    0% {
        transform: translateX(-100%);
    }

    50%,
    100% {
        transform: translateX(100%);
    }
}

/* 滚动内容区域 */
.dialog-scroll-content {
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
}

.dialog-scroll-content::-webkit-scrollbar {
    width: 4px;
}

.dialog-scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

.dialog-scroll-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
}

.dialog-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 表单样式 */
.ai-trading-form {
    padding: 24px;
}

.form-section {
    margin-bottom: 24px;
}

.form-section.compact {
    margin-bottom: 16px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
}

.simple-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.param-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.param-input {
    width: 100%;
}

/* 委托价格设置 */
.price-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.price-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.price-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.price-input {
    width: 100%;
}

.price-unit {
    font-size: 14px;
    color: #64748b;
}

.price-description {
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.price-desc-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.current-price-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.current-price-label {
    font-size: 14px;
    color: #64748b;
}

.current-price-value {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
}

.price-logic-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
}

.logic-text {
    font-size: 13px;
    color: #3b82f6;
    font-weight: 500;
}

.price-adjustment-info {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    padding: 4px 8px;
    background: #fef3c7;
    border-radius: 4px;
    border-left: 3px solid #f59e0b;
}

.adjustment-icon {
    font-size: 12px;
}

.adjustment-text {
    font-size: 11px;
    color: #92400e;
    font-weight: 500;
}

/* 量化策略信息 */
.strategy-info {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.strategy-item,
.factors-item,
.risk-info {
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.strategy-header,
.factors-header,
.risk-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.strategy-icon,
.factors-icon,
.risk-icon {
    font-size: 16px;
}

.strategy-title,
.factors-title,
.risk-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.strategy-content {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
}

.factors-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.factor-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}

.factor-name {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    min-width: 60px;
}

.factor-value {
    font-size: 12px;
    color: #1e293b;
    font-weight: 600;
}

.factor-weight {
    font-size: 11px;
    color: #6b7280;
    margin-left: auto;
}

.risk-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 委托设置 */
.order-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.order-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.time-option-selector {
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.time-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.time-option {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    width: 100% !important;
    height: auto !important;
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.time-option :deep(.el-radio__input) {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    margin: 0;
}

.time-option :deep(.el-radio__label) {
    padding-left: 0;
    width: 100%;
    margin-left: 0;
}

.time-option :deep(.el-radio__inner) {
    width: 16px;
    height: 16px;
    border-width: 2px;
}

.time-option :deep(.el-radio__inner::after) {
    width: 6px;
    height: 6px;
}

.time-option.is-disabled :deep(.el-radio__inner) {
    background-color: #f5f5f5;
    border-color: #d9d9d9;
    cursor: not-allowed;
}

.time-option.is-disabled:hover .option-content {
    border-color: #e2e8f0;
    background: #f8f9fa;
    cursor: not-allowed;
}

.option-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    padding-left: 48px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    cursor: pointer;
    width: 100%;
    position: relative;
}

.time-option:hover .option-content {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.time-option.is-checked .option-content {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    box-shadow: 0 0 0 1px #3b82f6;
}

.option-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.option-time {
    font-size: 12px;
    color: #dc2626;
    font-weight: 500;
}

.disabled-option {
    opacity: 0.5;
    cursor: not-allowed !important;
}

.disabled-option .option-title,
.disabled-option .option-time {
    color: #9ca3af !important;
}

.disabled-reason {
    font-size: 11px;
    color: #ef4444;
    margin-top: 2px;
    display: block;
}

.actual-validity-display {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
}

.actual-validity-info {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.actual-label {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
}

.actual-time {
    font-size: 14px;
    color: #dc2626;
    font-weight: 600;
}

.actual-reason {
    font-size: 12px;
    color: #64748b;
    font-style: italic;
}

.validity-note {
    margin-top: 8px;
}

/* 高级设置 */
.advanced-simple {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.advanced-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.param-input-small {
    width: 150px;
}

.input-with-unit-small {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
}

.input-with-unit-small .param-input-small {
    flex: 1;
    min-width: 120px;
}

.input-unit {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
    flex-shrink: 0;
}

/* PC端数字输入框样式优化 */
.param-input-small :deep(.el-input-number) {
    width: 100%;
}

.param-input-small :deep(.el-input__inner) {
    height: 32px;
    padding-right: 32px;
}

.param-input-small :deep(.el-input-number__increase),
.param-input-small :deep(.el-input-number__decrease) {
    width: 28px !important;
    height: 16px !important;
    line-height: 16px !important;
    font-size: 12px !important;
    border: none !important;
    background: #f5f5f5 !important;
    color: #666 !important;
    margin: 0 !important;
    padding: 0 !important;
    border-left: 1px solid #dcdfe6 !important;
}

.param-input-small :deep(.el-input-number__increase) {
    top: 1px !important;
    right: 1px !important;
    border-radius: 0 4px 0 0 !important;
    border-bottom: 1px solid #dcdfe6 !important;
}

.param-input-small :deep(.el-input-number__decrease) {
    bottom: 1px !important;
    right: 1px !important;
    border-radius: 0 0 4px 0 !important;
    top: 16px !important;
}

.param-input-small :deep(.el-input-number__increase):hover,
.param-input-small :deep(.el-input-number__decrease):hover {
    background: #e6e6e6 !important;
    color: #333 !important;
}

/* 高级设置切换 */
.advanced-toggle {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-top: 1px solid #e2e8f0;
    margin-top: 16px;
}

/* 对话框底部 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px 20px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

/* 量化分析加载界面移动端适配 */
@media (max-width: 768px) {
    .quant-analyzing-container {
        padding: 16px;
        min-height: 400px;
    }

    .quant-analyzing-content {
        max-width: 100%;
    }

    .stock-info-mini {
        margin-bottom: 24px;
        padding: 10px 16px;
        flex-direction: row;
        gap: 8px;
    }

    .stock-info-mini h3 {
        font-size: 16px;
    }

    .stock-info-mini .stock-code {
        font-size: 11px;
        padding: 3px 6px;
    }

    .analyzing-animation {
        margin-bottom: 24px;
    }

    .spinner {
        width: 60px;
        height: 60px;
        border-width: 3px;
    }

    .analyzing-symbol {
        font-size: 36px;
        width: 60px;
        height: 60px;
        line-height: 60px;
    }

    .analyzing-text h4 {
        font-size: 18px;
    }

    .analyzing-desc {
        font-size: 13px;
        margin-bottom: 6px;
    }

    .real-analysis-hint {
        font-size: 12px;
    }

    .analyzing-progress {
        margin-bottom: 20px;
    }

    .progress-steps {
        margin-bottom: 12px;
    }

    .step-icon {
        width: 32px;
        height: 32px;
        font-size: 14px;
    }

    .progress-steps::before {
        top: 16px;
    }

    .step-text {
        font-size: 11px;
    }

    .progress-bar {
        height: 4px;
    }

    .analyzing-tips {
        padding: 12px;
    }

    .tip-text {
        font-size: 13px;
    }

    .tip-icon {
        font-size: 14px;
    }
}

/* 小屏幕量化分析优化 */
@media (max-width: 480px) {
    .quant-analyzing-container {
        padding: 12px;
        min-height: 350px;
    }

    .stock-info-mini {
        margin-bottom: 20px;
        padding: 8px 12px;
        flex-direction: row;
        gap: 6px;
    }

    .stock-info-mini h3 {
        font-size: 14px;
    }

    .stock-info-mini .stock-code {
        font-size: 10px;
        padding: 2px 4px;
    }

    .analyzing-animation {
        margin-bottom: 20px;
    }

    .spinner {
        width: 50px;
        height: 50px;
        border-width: 2px;
    }

    .analyzing-symbol {
        font-size: 28px;
        width: 50px;
        height: 50px;
        line-height: 50px;
    }

    .analyzing-text h4 {
        font-size: 16px;
    }

    .analyzing-desc {
        font-size: 12px;
        margin-bottom: 4px;
    }

    .real-analysis-hint {
        font-size: 11px;
    }

    .analyzing-progress {
        margin-bottom: 16px;
    }

    .progress-steps {
        margin-bottom: 10px;
    }

    .step-icon {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }

    .progress-steps::before {
        top: 14px;
    }

    .step-text {
        font-size: 10px;
    }

    .progress-bar {
        height: 3px;
    }

    .analyzing-tips {
        padding: 10px;
    }

    .tip-text {
        font-size: 12px;
    }

    .tip-icon {
        font-size: 13px;
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .ai-trading-dialog {
        width: 92vw !important;
        max-width: none !important;
        margin: 0 !important;
        margin-top: 5vh !important;
        max-height: 85vh !important;
        height: auto !important;
        display: flex !important;
        flex-direction: column !important;
    }

    .ai-trading-dialog :deep(.el-dialog__body) {
        flex: 1 !important;
        overflow: hidden !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
    }

    .ai-trading-content {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
    }

    .dialog-scroll-content {
        flex: 1 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-height: calc(85vh - 180px) !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 12px;
        position: sticky;
        top: 0;
        z-index: 10;
        flex-shrink: 0;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 15px;
    }

    .stock-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 6px;
    }

    .stock-name-section h3 {
        font-size: 15px;
        margin-right: 6px;
    }

    .stock-code {
        font-size: 11px;
        padding: 2px 6px;
    }

    .current-price {
        font-size: 14px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 10px 12px;
    }

    .simple-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .section-title {
        font-size: 14px;
        margin-bottom: 10px;
    }

    .param-item {
        gap: 6px;
    }

    .param-label {
        font-size: 13px;
    }

    .price-controls {
        gap: 10px;
    }

    .price-item {
        gap: 6px;
    }

    .price-input-container {
        flex-direction: row;
        align-items: center;
        gap: 6px;
    }

    .price-input {
        width: 100px;
    }

    .price-unit {
        font-size: 13px;
    }

    .price-description {
        padding: 10px;
    }

    .price-desc-content {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .current-price-info {
        flex-direction: row;
        align-items: center;
        gap: 6px;
    }

    .current-price-label {
        font-size: 13px;
    }

    .current-price-value {
        font-size: 14px;
    }

    .price-logic-desc {
        font-size: 11px;
    }

    .logic-text {
        font-size: 12px;
    }

    .price-adjustment-info {
        padding: 3px 6px;
        margin-top: 3px;
    }

    .adjustment-text {
        font-size: 10px;
    }



    .order-settings {
        gap: 10px;
    }

    .order-item {
        gap: 8px;
    }

    .time-option-selector {
        padding: 6px;
    }

    .time-options {
        gap: 6px;
    }

    .time-option :deep(.el-radio__input) {
        left: 12px;
    }

    .option-content {
        padding: 10px;
        gap: 1px;
        padding-left: 40px;
    }

    .option-title {
        font-size: 13px;
    }

    .option-time {
        font-size: 11px;
    }

    .actual-validity-display {
        margin-top: 12px;
        padding: 10px;
    }

    .actual-validity-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin-bottom: 6px;
    }

    .actual-label,
    .actual-time {
        font-size: 12px;
    }

    .actual-reason {
        font-size: 11px;
    }

    .validity-note {
        margin-top: 6px;
    }

    .advanced-simple {
        gap: 10px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .param-input-small {
        width: 120px;
    }

    .input-with-unit-small {
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 100px;
    }

    .advanced-toggle {
        padding: 10px 0;
        margin-top: 12px;
    }

    .dialog-footer {
        padding: 10px 12px;
        position: sticky;
        bottom: 0;
        z-index: 10;
        background: #f9fafb;
        margin-top: 0;
        flex-shrink: 0;
        border-top: 1px solid #e5e7eb;
    }

    .dialog-footer .el-button {
        flex: 1;
        max-width: 100px;
        height: 36px;
        font-size: 14px;
        padding: 8px 10px;
    }

    .confirm-text {
        display: inline;
    }

    .confirm-text-mobile {
        display: none;
    }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
    .ai-trading-dialog {
        width: 96vw !important;
        margin: 0 !important;
        margin-top: 2vh !important;
        max-height: 90vh !important;
        height: auto !important;
    }

    .dialog-scroll-content {
        max-height: calc(85vh - 160px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
        min-height: 400px !important;
        scrollbar-width: thin !important;
    }

    /* 小屏幕滚动条样式 */
    .dialog-scroll-content::-webkit-scrollbar {
        width: 8px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 10px;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 14px;
    }

    .stock-header {
        padding: 8px 10px;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }

    .stock-name-section h3 {
        font-size: 14px;
    }

    .stock-code {
        font-size: 10px;
        padding: 2px 4px;
    }

    .current-price {
        font-size: 13px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 8px 10px;
    }

    .section-title {
        font-size: 13px;
        margin-bottom: 8px;
    }

    .param-label {
        font-size: 12px;
    }

    .price-input {
        width: 90px;
    }

    .current-price-display {
        padding: 6px 8px;
    }

    .price-value {
        font-size: 13px;
    }

    .price-range-display {
        padding: 8px;
        margin-top: 6px;
    }

    .range-label,
    .range-value,
    .range-desc {
        font-size: 11px;
    }

    .order-validity {
        padding: 6px 8px;
    }

    .validity-text {
        font-size: 12px;
    }

    .validity-desc {
        font-size: 10px;
    }

    .advanced-simple {
        gap: 8px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .param-input-small {
        width: 100%;
        min-width: 120px;
    }

    .input-with-unit-small {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 0;
    }

    .input-unit {
        font-size: 12px;
        flex-shrink: 0;
    }

    .dialog-footer {
        padding: 8px 10px;
    }

    .dialog-footer .el-button {
        max-width: 90px;
        height: 34px;
        font-size: 13px;
        padding: 6px 8px;
    }

    .confirm-text {
        display: none;
    }

    .confirm-text-mobile {
        display: inline;
    }
}

/* 超小屏幕优化 */
@media (max-width: 320px) {
    .ai-trading-dialog {
        width: 98vw !important;
        margin: 0 !important;
        margin-top: 1vh !important;
        max-height: 95vh !important;
        height: auto !important;
    }

    .dialog-scroll-content {
        max-height: calc(95vh - 140px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 8px;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 13px;
    }

    .stock-header {
        padding: 6px 8px;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 3px;
    }

    .stock-name-section h3 {
        font-size: 13px;
    }

    .stock-code {
        font-size: 9px;
        padding: 1px 4px;
    }

    .current-price {
        font-size: 12px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 6px 8px;
    }

    .section-title {
        font-size: 12px;
        margin-bottom: 6px;
    }

    .param-label {
        font-size: 11px;
    }

    .price-input {
        width: 80px;
    }

    .current-price-display {
        padding: 4px 6px;
    }

    .price-value {
        font-size: 12px;
    }

    .price-range-display {
        padding: 6px;
        margin-top: 4px;
    }

    .range-label,
    .range-value,
    .range-desc {
        font-size: 10px;
    }

    .order-validity {
        padding: 4px 6px;
    }

    .validity-text {
        font-size: 11px;
    }

    .validity-desc {
        font-size: 9px;
    }

    .advanced-simple {
        gap: 6px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .param-input-small {
        width: 100%;
        min-width: 100px;
    }

    .input-with-unit-small {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 0;
    }

    .input-unit {
        font-size: 11px;
        flex-shrink: 0;
    }

    .dialog-footer {
        padding: 6px 8px;
    }

    .dialog-footer .el-button {
        max-width: 80px;
        height: 32px;
        font-size: 12px;
        padding: 5px 6px;
    }

    .confirm-text {
        display: none;
    }

    .confirm-text-mobile {
        display: inline;
    }
}

/* 移动端专用优化 */
@media (max-width: 768px) and (orientation: portrait) {
    .ai-trading-dialog {
        margin-top: 10px !important;
        border-radius: 12px 12px 0 0 !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        border-radius: 12px 12px 0 0;
    }

    .stock-header {
        border-radius: 0;
    }

    /* 触摸友好的按钮 */
    .risk-checkbox :deep(.el-checkbox__input) {
        transform: scale(1.2);
    }

    .param-input,
    .risk-number,
    .param-input-small {
        font-size: 16px;
        /* 防止iOS自动缩放 */
    }

    /* 改进的滚动指示器 */
    .dialog-scroll-content {
        scroll-behavior: smooth;
    }
}

/* 移动端专用样式类 - 最高优先级 */
.mobile-dialog {
    max-height: 85vh !important;
    height: auto !important;
    margin: 0 !important;
    border-radius: 16px 16px 0 0 !important;
}

.mobile-dialog :deep(.el-dialog__body) {
    padding: 0 !important;
    max-height: calc(85vh - 120px) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
}

.mobile-dialog .ai-trading-content {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    max-height: calc(85vh - 120px) !important;
}

.mobile-dialog .dialog-scroll-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(75vh - 200px);
    -webkit-overflow-scrolling: touch;
    padding: 0;
    margin: 0;
}

/* 移动端弹框滚动条样式 */
.mobile-dialog .dialog-scroll-content::-webkit-scrollbar {
    width: 6px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}



.mobile-dialog .stock-header {
    flex-shrink: 0 !important;
    padding: 12px 16px !important;
    background: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
}

.mobile-dialog .stock-left {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex: 1 !important;
    min-width: 0 !important;
}

.mobile-dialog .stock-name-section {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .stock-name-section h3 {
    font-size: 15px !important;
    margin: 0 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 100px !important;
}

.mobile-dialog .stock-code {
    font-size: 10px !important;
    padding: 2px 4px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .current-price {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #dc2626 !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .stock-right {
    flex-shrink: 0 !important;
    align-items: flex-end !important;
    margin-left: 8px !important;
}

.mobile-dialog .cost-label {
    font-size: 11px !important;
    color: #64748b !important;
}

.mobile-dialog .cost-pricing {
    align-items: flex-end !important;
}

.mobile-dialog .cost-original,
.mobile-dialog .cost-promo {
    font-size: 9px !important;
    padding: 1px 3px !important;
}

.mobile-dialog .ai-trading-form {
    padding: 16px !important;
}

.mobile-dialog .simple-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
}

.mobile-dialog .section-title {
    font-size: 15px !important;
    margin-bottom: 12px !important;
}

.mobile-dialog .param-label {
    font-size: 14px !important;
}

.mobile-dialog .price-input {
    width: 100px !important;
}

.mobile-dialog .current-price-display {
    padding: 8px 10px !important;
}

.mobile-dialog .price-value {
    font-size: 14px !important;
}

.mobile-dialog .price-range-display {
    padding: 10px !important;
    margin-top: 8px !important;
}

.mobile-dialog .range-label,
.mobile-dialog .range-value,
.mobile-dialog .range-desc {
    font-size: 12px !important;
}

.mobile-dialog .order-validity {
    padding: 8px 10px !important;
}

.mobile-dialog .validity-text {
    font-size: 13px !important;
}

.mobile-dialog .validity-desc {
    font-size: 11px !important;
}

.mobile-dialog .dialog-footer {
    flex-shrink: 0 !important;
    padding: 8px 16px !important;
    background: #f9fafb !important;
    border-top: 1px solid #e5e7eb !important;
}

.mobile-dialog .dialog-footer .el-button {
    flex: 1 !important;
    max-width: 120px !important;
    height: 36px !important;
    font-size: 14px !important;
    padding: 8px 10px !important;
}

.mobile-dialog .confirm-text {
    display: none !important;
}

.mobile-dialog .confirm-text-mobile {
    display: inline !important;
}

/* 移动端滚动优化 */
@media (max-width: 768px) {
    .dialog-scroll-content {
        max-height: calc(75vh - 160px) !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 10px !important;
    }
}

/* 微信浏览器专用滚动修复 */
.wechat-scroll {
    /* 微信浏览器必须使用明确的高度而不是max-height */
    height: calc(75vh - 160px) !important;
    max-height: none !important;

    /* 微信浏览器滚动设置 */
    overflow: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;

    /* 微信浏览器触摸滚动 */
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;

    /* 微信浏览器需要的特殊属性 */
    position: relative !important;
    transform: translateZ(0) !important;
    -webkit-transform: translate3d(0, 0, 0) !important;

    /* 确保内容可以滚动 */
    min-height: 400px !important;

    /* 微信浏览器滚动优化 */
    overscroll-behavior: contain !important;
    scroll-behavior: auto !important;
}

/* 微信浏览器移动端优化 */
@media (max-width: 768px) {
    .wechat-scroll {
        height: calc(70vh - 140px) !important;
        padding-bottom: 20px !important;
    }

    /* 微信浏览器表单内容优化 */
    .wechat-scroll .ai-trading-form {
        padding-bottom: 30px !important;
        min-height: 500px !important;
    }
}

/* 确保弹窗在移动端侧边栏上方显示 */
:deep(.el-dialog) {
    z-index: 11000 !important;
}

:deep(.el-overlay) {
    z-index: 10999 !important;
}

/* 强制设置弹窗容器的z-index */
.ai-trading-dialog {
    z-index: 11000 !important;
}

.ai-trading-dialog :deep(.el-dialog__wrapper) {
    z-index: 11000 !important;
}

/* 移动端模态框优化 */
.mobile-modal {
    touch-action: none !important;
}

.mobile-modal :deep(.el-overlay) {
    touch-action: none !important;
}

/* 移动端数字输入框优化 */
@media (max-width: 768px) {

    /* 数字输入框样式优化 */
    .mobile-dialog .param-input-small :deep(.el-input-number),
    .mobile-dialog .price-input :deep(.el-input-number) {
        width: 100% !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input__inner),
    .mobile-dialog .price-input :deep(.el-input__inner) {
        height: 36px !important;
        font-size: 14px !important;
        padding: 0 32px 0 12px !important;
        border-radius: 6px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase),
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease),
    .mobile-dialog .price-input :deep(.el-input-number__increase),
    .mobile-dialog .price-input :deep(.el-input-number__decrease) {
        width: 28px !important;
        height: 18px !important;
        line-height: 18px !important;
        font-size: 12px !important;
        border: none !important;
        background: #f5f5f5 !important;
        color: #666 !important;
        margin: 0 !important;
        padding: 0 !important;
        border-left: 1px solid #dcdfe6 !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase),
    .mobile-dialog .price-input :deep(.el-input-number__increase) {
        top: 1px !important;
        right: 1px !important;
        border-radius: 0 5px 0 0 !important;
        border-bottom: 1px solid #dcdfe6 !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__decrease),
    .mobile-dialog .price-input :deep(.el-input-number__decrease) {
        bottom: 1px !important;
        right: 1px !important;
        border-radius: 0 0 5px 0 !important;
        top: 18px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase):hover,
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease):hover,
    .mobile-dialog .price-input :deep(.el-input-number__increase):hover,
    .mobile-dialog .price-input :deep(.el-input-number__decrease):hover {
        background: #e6e6e6 !important;
        color: #333 !important;
    }

    .mobile-dialog .input-with-unit-small {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        width: 100% !important;
    }

    .mobile-dialog .input-with-unit-small .param-input-small {
        flex: 1 !important;
        min-width: 0 !important;
    }

    .mobile-dialog .input-unit {
        font-size: 13px !important;
        color: #64748b !important;
        font-weight: 500 !important;
        flex-shrink: 0 !important;
    }

    .mobile-dialog .advanced-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
    }

    .mobile-dialog .param-label {
        font-size: 13px !important;
        color: #64748b !important;
        font-weight: 500 !important;
    }

    /* 移动端量化策略信息 */
    .mobile-dialog .strategy-info {
        gap: 12px !important;
    }

    .mobile-dialog .strategy-item,
    .mobile-dialog .factors-item,
    .mobile-dialog .risk-info {
        padding: 10px !important;
    }

    .mobile-dialog .strategy-header,
    .mobile-dialog .factors-header,
    .mobile-dialog .risk-header {
        gap: 6px !important;
        margin-bottom: 6px !important;
    }

    .mobile-dialog .strategy-icon,
    .mobile-dialog .factors-icon,
    .mobile-dialog .risk-icon {
        font-size: 14px !important;
    }

    .mobile-dialog .strategy-title,
    .mobile-dialog .factors-title,
    .mobile-dialog .risk-title {
        font-size: 13px !important;
    }

    .mobile-dialog .strategy-content {
        font-size: 12px !important;
    }

    .mobile-dialog .factors-content {
        gap: 6px !important;
    }

    .mobile-dialog .factor-item {
        padding: 4px 6px !important;
        gap: 6px !important;
    }

    .mobile-dialog .factor-name {
        font-size: 11px !important;
        min-width: 50px !important;
    }

    .mobile-dialog .factor-value {
        font-size: 11px !important;
    }

    .mobile-dialog .factor-weight {
        font-size: 10px !important;
    }
}
</style>
