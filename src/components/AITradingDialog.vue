<template>
    <el-dialog v-model="dialogVisible" title="AI委托交易设置" :width="isMobile ? '95vw' : '750px'"
        :top="isMobile ? '5vh' : '15vh'" class="ai-trading-dialog" :class="{ 'mobile-dialog': isMobile }"
        destroy-on-close append-to-body :z-index="11000" :close-on-click-modal="false"
        :modal-class="isMobile ? 'mobile-modal' : ''">
        <div v-if="stock" class="ai-trading-content">
            <!-- 股票信息头部 -->
            <div class="stock-header">
                <div class="stock-left">
                    <div class="stock-name-section">
                        <h3>{{ stock.name }}</h3>
                        <span class="stock-code">{{ stock.code }}</span>
                    </div>
                    <span class="current-price">¥{{ stock.price || stock.currentPrice }}</span>
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

                    <!-- 风控设置 -->
                    <div class="form-section compact">
                        <h4 class="section-title">风控设置</h4>

                        <div class="risk-controls">
                            <div class="risk-item">
                                <el-checkbox v-model="form.enableStopLoss" class="risk-checkbox">
                                    止损保护
                                </el-checkbox>
                                <div v-if="form.enableStopLoss" class="risk-input">
                                    <el-input-number v-model="form.stopLossPercentage" :min="1" :max="20"
                                        class="risk-number" controls-position="right" />
                                    <span class="risk-unit">%</span>
                                </div>
                            </div>

                            <div class="risk-item">
                                <el-checkbox v-model="form.enableTakeProfit" class="risk-checkbox">
                                    止盈目标
                                </el-checkbox>
                                <div v-if="form.enableTakeProfit" class="risk-input">
                                    <el-input-number v-model="form.takeProfitPercentage" :min="1" :max="50"
                                        class="risk-number" controls-position="right" />
                                    <span class="risk-unit">%</span>
                                </div>
                            </div>
                        </div>

                        <!-- AI策略预览 -->
                        <div class="strategy-preview">
                            <div class="strategy-info">
                                <span class="strategy-label">AI策略：</span>
                                <span class="strategy-value">{{ getStrategyText(form.strategy) }}</span>
                                <span class="strategy-risk">({{ getRiskLevelText(form.riskLevel) }})</span>
                            </div>
                            <div class="strategy-desc">
                                根据您的投资偏好自动配置，AI将24小时智能监控并执行最佳交易时机
                            </div>
                        </div>
                    </div>

                    <!-- 高级设置（可折叠） -->
                    <div class="form-section compact" v-if="form.showAdvanced">
                        <h4 class="section-title">高级设置</h4>

                        <div class="advanced-simple">
                            <div class="advanced-row">
                                <label class="param-label">委托类型</label>
                                <el-select v-model="form.orderType" class="param-input-small">
                                    <el-option label="限价单" value="limit" />
                                    <el-option label="市价单" value="market" />
                                </el-select>
                            </div>

                            <div class="advanced-row">
                                <label class="param-label">委托时效</label>
                                <el-select v-model="form.timeInForce" class="param-input-small">
                                    <el-option label="好价成交" value="GTC" />
                                    <el-option label="当日有效" value="DAY" />
                                </el-select>
                            </div>

                            <div class="advanced-row">
                                <label class="param-label">最大亏损</label>
                                <div class="input-with-unit-small">
                                    <el-input-number v-model="form.maxLossAmount" :min="100" class="param-input-small"
                                        controls-position="right" />
                                    <span class="input-unit">元</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 高级设置切换 -->
                    <div class="advanced-toggle">
                        <el-button link @click="form.showAdvanced = !form.showAdvanced">
                            {{ form.showAdvanced ? '收起高级设置' : '展开高级设置' }}
                            <el-icon>
                                <ArrowDown v-if="!form.showAdvanced" />
                                <ArrowUp v-else />
                            </el-icon>
                        </el-button>
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
import { ref, reactive, watch, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

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

// Emits
const emit = defineEmits(['update:modelValue', 'ai-trading-confirmed']);

// Store
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const scrollContainer = ref(null);

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

    // 风控参数（简化，只保留最重要的）
    enableStopLoss: true,
    stopLossPercentage: 5, // 止损百分比
    enableTakeProfit: true,
    takeProfitPercentage: 10, // 止盈百分比

    // 高级选项（默认折叠，从用户偏好获取）
    showAdvanced: false,
    orderType: 'limit', // 从用户偏好获取
    timeInForce: 'GTC', // 从用户偏好获取
    maxLossAmount: 1000, // 从用户偏好和余额计算
    strategy: 'balanced', // 从用户偏好获取
    riskLevel: 'medium' // 从用户偏好获取
});

// 从用户偏好初始化AI交易参数
const initAITradingFromPreferences = () => {
    const preferences = userStore.userInfo?.preferences;
    if (preferences) {
        // 根据用户风险偏好设置默认参数
        switch (preferences.riskLevel) {
            case 'conservative':
                form.stopLossPercentage = 3;
                form.takeProfitPercentage = 6;
                form.strategy = 'conservative';
                form.riskLevel = 'low';
                form.maxLossAmount = Math.min(500, userStore.balance * 0.05);
                break;
            case 'moderate':
                form.stopLossPercentage = 5;
                form.takeProfitPercentage = 10;
                form.strategy = 'balanced';
                form.riskLevel = 'medium';
                form.maxLossAmount = Math.min(1000, userStore.balance * 0.1);
                break;
            case 'aggressive':
                form.stopLossPercentage = 8;
                form.takeProfitPercentage = 15;
                form.strategy = 'aggressive';
                form.riskLevel = 'high';
                form.maxLossAmount = Math.min(2000, userStore.balance * 0.15);
                break;
        }

        // 根据用户经验设置委托类型
        form.orderType = preferences.experience === 'beginner' ? 'market' : 'limit';
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

// 获取策略文本
const getStrategyText = (strategy) => {
    const strategyMap = {
        'conservative': '保守策略',
        'balanced': '平衡策略',
        'aggressive': '激进策略'
    };
    return strategyMap[strategy] || '平衡策略';
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

// 处理取消
const handleCancel = () => {
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

    // 构建AI委托交易参数
    const tradingParams = {
        stock: props.stock,
        action: form.action,
        quantity: form.quantity,
        orderType: form.orderType,
        timeInForce: form.timeInForce,
        validUntil: form.validUntil,

        // 止损止盈设置
        stopLoss: form.enableStopLoss ? {
            type: form.stopLossType,
            percentage: form.stopLossPercentage,
            price: form.stopLossPrice
        } : null,

        takeProfit: form.enableTakeProfit ? {
            type: form.takeProfitType,
            percentage: form.takeProfitPercentage,
            price: form.takeProfitPrice
        } : null,

        trailingStop: form.enableTrailingStop ? {
            amount: form.trailingStopAmount
        } : null,

        // 风控参数
        riskControl: {
            maxLossAmount: form.maxLossAmount,
            maxPositionSize: form.maxPositionSize
        },

        // AI策略
        aiStrategy: {
            strategy: form.strategy,
            riskLevel: form.riskLevel
        },

        // 监控设置
        monitoring: {
            priceAlert: form.priceAlert,
            volumeAlert: form.volumeAlert,
            newsAlert: form.newsAlert
        }
    };

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
            ElMessage.success('支付成功，正在设置AI委托交易...');
        } else {
            ElMessage.error('支付失败，智点余额不足');
            return;
        }

        // 关闭对话框
        dialogVisible.value = false;

        // 生成AI委托交易报告
        const message = `【AI委托交易设置完成】已为${props.stock.name}(${props.stock.code})设置智能委托交易：

🎯 **交易参数**
• 交易方向：${form.action === 'buy' ? '买入' : '卖出'}
• 交易数量：${form.quantity}股
• 委托类型：${form.orderType === 'limit' ? '限价单' : '市价单'}
• 委托时效：${getTimeInForceText(form.timeInForce)}

🛡️ **风控设置**
${form.enableStopLoss ? `• 止损：${form.stopLossType === 'percentage' ? form.stopLossPercentage + '%' : '¥' + form.stopLossPrice}` : ''}
${form.enableTakeProfit ? `• 止盈：${form.takeProfitType === 'percentage' ? form.takeProfitPercentage + '%' : '¥' + form.takeProfitPrice}` : ''}
${form.enableTrailingStop ? `• 追踪止损：¥${form.trailingStopAmount}` : ''}
• 最大亏损：¥${form.maxLossAmount}
• 最大仓位：${form.maxPositionSize}%

🤖 **AI策略**
• 交易策略：${getStrategyText(form.strategy)}
• 风险等级：${getRiskLevelText(form.riskLevel)}

📊 **监控预警**
${form.priceAlert ? '• ✅ 价格预警已启用' : ''}
${form.volumeAlert ? '• ✅ 成交量预警已启用' : ''}
${form.newsAlert ? '• ✅ 新闻预警已启用' : ''}

AI将根据您的设置参数，24小时智能监控市场，在最佳时机自动执行交易，并及时发送预警通知。`;

        // 发送事件给父组件
        emit('ai-trading-confirmed', {
            stock: props.stock,
            tradingParams: tradingParams,
            message: message
        });

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
    if (newVal && props.stock) {
        initAITradingFromPreferences();

        // 延迟应用微信浏览器滚动修复
        setTimeout(() => {
            fixWechatScroll();
        }, 300);
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

/* 风控设置 */
.risk-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.risk-item {
    display: flex;
    align-items: center;
    gap: 16px;
}

.risk-checkbox {
    font-size: 14px;
    color: #1e293b;
}

.risk-input {
    display: flex;
    align-items: center;
    gap: 8px;
}

.risk-number {
    width: 120px;
}

.risk-unit {
    font-size: 14px;
    color: #64748b;
}

/* AI策略预览 */
.strategy-preview {
    margin-top: 16px;
    padding: 16px;
    background: #f1f5f9;
    border-radius: 8px;
}

.strategy-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.strategy-label {
    font-size: 14px;
    color: #64748b;
}

.strategy-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.strategy-risk {
    font-size: 12px;
    color: #64748b;
}

.strategy-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
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

    .risk-controls {
        gap: 10px;
    }

    .risk-item {
        gap: 8px;
    }

    .risk-checkbox {
        font-size: 13px;
    }

    .risk-number {
        width: 100px;
    }

    .strategy-preview {
        padding: 10px;
        margin-top: 10px;
    }

    .strategy-info {
        gap: 6px;
    }

    .strategy-label,
    .strategy-value,
    .strategy-desc {
        font-size: 12px;
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

    .risk-checkbox {
        font-size: 12px;
    }

    .risk-number {
        width: 90px;
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

    .risk-checkbox {
        font-size: 11px;
    }

    .risk-number {
        width: 80px;
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

.mobile-dialog .risk-number {
    width: 100px !important;
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
    .mobile-dialog .param-input-small :deep(.el-input-number) {
        width: 100% !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input__inner) {
        height: 36px !important;
        font-size: 14px !important;
        padding: 0 32px 0 12px !important;
        border-radius: 6px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase),
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease) {
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

    .mobile-dialog .param-input-small :deep(.el-input-number__increase) {
        top: 1px !important;
        right: 1px !important;
        border-radius: 0 5px 0 0 !important;
        border-bottom: 1px solid #dcdfe6 !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__decrease) {
        bottom: 1px !important;
        right: 1px !important;
        border-radius: 0 0 5px 0 !important;
        top: 18px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase):hover,
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease):hover {
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
}
</style>
