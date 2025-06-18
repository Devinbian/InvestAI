<template>
    <el-dialog v-model="dialogVisible" title="AI委托交易设置" width="750px" class="ai-trading-dialog">
        <div v-if="stock" class="ai-trading-content">
            <!-- 股票信息头部 -->
            <div class="stock-header">
                <div class="stock-info">
                    <h3>{{ stock.name }}</h3>
                    <span class="stock-code">{{ stock.code }}</span>
                    <span class="current-price">¥{{ stock.price || stock.currentPrice }}</span>
                </div>
                <div class="service-cost">
                    <span class="cost-label">服务费用</span>
                    <span class="cost-amount">¥1</span>
                </div>
            </div>

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

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading">
                    确认委托 (¥1)
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

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
    const map = {
        'conservative': '保守型',
        'stable': '稳健型',
        'balanced': '平衡型',
        'growth': '成长型',
        'aggressive': '激进型',
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'moderate': '稳健型'
    };
    return map[level] || '未设置';
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
    // 检查余额
    if (userStore.balance < 1) {
        ElMessage.error('余额不足，请先充值');
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

        // 扣费
        userStore.deductBalance(1);
        ElMessage.success('支付成功，正在设置AI委托交易...');

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

// 监听对话框打开，初始化表单
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.stock) {
        initAITradingFromPreferences();
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
    padding: 20px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.stock-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.stock-info h3 {
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

.service-cost {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.cost-label {
    font-size: 12px;
    color: #64748b;
}

.cost-amount {
    font-size: 16px;
    font-weight: 600;
    color: #f59e0b;
}

/* 表单样式 */
.ai-trading-form {
    padding: 24px;
}

.form-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.form-section.compact {
    padding: 16px;
    margin-bottom: 20px;
}

.section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.simple-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.param-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

.param-input {
    width: 100%;
}

/* 风控设置 */
.risk-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
}

.risk-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.risk-checkbox {
    flex: 1;
}

.risk-input {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
}

.risk-number {
    width: 80px;
}

.risk-unit {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

/* 策略预览 */
.strategy-preview {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
}

.strategy-info {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.strategy-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.strategy-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.strategy-risk {
    font-size: 12px;
    color: #6b7280;
}

.strategy-desc {
    font-size: 13px;
    color: #6b7280;
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
    justify-content: space-between;
    gap: 16px;
}

.param-input-small {
    width: 150px;
}

.input-with-unit-small {
    display: flex;
    align-items: center;
    gap: 8px;
}

.input-unit {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
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
        width: 95vw !important;
        max-width: none !important;
        margin: 5vh auto !important;
    }

    .stock-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
    }

    .stock-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .service-cost {
        align-items: flex-start;
    }

    .ai-trading-form {
        padding: 16px;
    }

    .simple-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .risk-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .risk-input {
        align-self: flex-end;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .param-input-small {
        width: 100%;
    }
}
</style>
