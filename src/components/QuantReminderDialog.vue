<template>
    <el-dialog v-model="dialogVisible" title="设置量化分析提醒" :width="reminderDialogWidth" :before-close="handleCancel"
        class="reminder-dialog">
        <div class="reminder-dialog-content">
            <!-- 股票信息 -->
            <div class="stock-info-section">
                <h4>📊 量化分析股票</h4>
                <div class="stock-info-display">
                    <span class="stock-name">{{ reminderForm.stockName }}</span>
                    <span class="stock-code">({{ reminderForm.stockCode }})</span>
                </div>
            </div>

            <!-- 当前量化分析结果 -->
            <div class="quant-analysis-summary">
                <h4>🎯 当前量化分析结果</h4>
                <div class="analysis-summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">建议买入价</span>
                        <span class="summary-value buy-price">{{ quantAnalysis.buyPrice }}元</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">建议卖出价</span>
                        <span class="summary-value sell-price">{{ quantAnalysis.sellPrice }}元</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">止损价格</span>
                        <span class="summary-value stop-loss">{{ quantAnalysis.stopLossPrice }}元</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">量化有效期</span>
                        <span class="summary-value validity">{{ quantAnalysis.validityPeriod }}</span>
                    </div>
                </div>
            </div>

            <!-- 价格提醒设置 -->
            <div class="price-reminder-section">
                <h4>💰 价格信号提醒设置</h4>

                <!-- 提醒开关 -->
                <div class="reminder-switch-section">
                    <div class="switch-item">
                        <div class="switch-info">
                            <span class="switch-label">启用价格提醒</span>
                            <span class="switch-desc">在量化有效期内，当达到量化建议价格时通过消息推送提醒</span>
                        </div>
                        <el-switch v-model="reminderSettings.enabled" size="large" />
                    </div>
                </div>

                <!-- 价格信息展示 -->
                <div v-if="reminderSettings.enabled" class="price-display">
                    <div class="price-info-grid">
                        <div class="price-info-item">
                            <div class="price-info-header">
                                <span class="price-icon">📈</span>
                                <span class="price-label">买入提醒价格</span>
                            </div>
                            <div class="price-value buy-price">{{ quantAnalysis.buyPrice }}元</div>
                            <div class="price-desc">达到此价格时提醒买入</div>
                        </div>

                        <div class="price-info-item">
                            <div class="price-info-header">
                                <span class="price-icon">📉</span>
                                <span class="price-label">卖出提醒价格</span>
                            </div>
                            <div class="price-value sell-price">{{ quantAnalysis.sellPrice }}元</div>
                            <div class="price-desc">达到此价格时提醒卖出</div>
                        </div>

                        <div class="price-info-item">
                            <div class="price-info-header">
                                <span class="price-icon">⚠️</span>
                                <span class="price-label">止损提醒价格</span>
                            </div>
                            <div class="price-value stop-loss">{{ quantAnalysis.stopLossPrice }}元</div>
                            <div class="price-desc">跌破此价格时提醒止损</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 有效期显示 -->
            <div v-if="reminderSettings.enabled" class="validity-info">
                <div class="validity-item">
                    <span class="validity-label">⏰ 提醒有效期：</span>
                    <span class="validity-value">{{ getValidityEndTime() }}</span>
                </div>
                <div class="validity-note">
                    <el-alert title="提醒将在量化分析有效期内生效，超过有效期后自动关闭" type="info" :closable="false" show-icon />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm">
                    {{ reminderSettings.enabled ? '确认设置' : '关闭提醒' }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    message: {
        type: Object,
        default: null
    },
    activeReminders: {
        type: Array,
        default: () => []
    }
});

// Emits
const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'remove-reminder']);

// 响应式数据
const reminderForm = ref({
    stockCode: '',
    stockName: ''
});

const quantAnalysis = ref({
    buyPrice: '0.00',
    sellPrice: '0.00',
    stopLossPrice: '0.00',
    validityPeriod: '3天',
    validityEndTime: null
});

const reminderSettings = ref({
    enabled: false
});

// 计算属性
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const reminderDialogWidth = computed(() => {
    if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 480) return '95%';
        if (width < 768) return '90%';
        return '500px';
    }
    return '500px';
});

// 方法
const handleCancel = () => {
    emit('update:visible', false);
    resetSettings();
    emit('cancel');
};

const handleConfirm = () => {
    console.log('🔧 QuantReminderDialog - handleConfirm 被调用:', {
        enabled: reminderSettings.value.enabled,
        stockCode: reminderForm.value.stockCode,
        stockName: reminderForm.value.stockName
    });

    if (!reminderSettings.value.enabled) {
        // 关闭提醒
        const disableData = {
            action: 'disable',
            stockCode: reminderForm.value.stockCode,
            stockName: reminderForm.value.stockName
        };
        console.log('🔧 QuantReminderDialog - 发送关闭提醒数据:', disableData);
        emit('confirm', disableData);
        ElMessage.success('已关闭价格提醒');
    } else {
        // 创建提醒
        const reminderData = {
            action: 'create',
            stockCode: reminderForm.value.stockCode,
            stockName: reminderForm.value.stockName,
            settings: {
                enabled: true,
                buyPrice: parseFloat(quantAnalysis.value.buyPrice),
                sellPrice: parseFloat(quantAnalysis.value.sellPrice),
                stopLossPrice: parseFloat(quantAnalysis.value.stopLossPrice),
                validityEndTime: quantAnalysis.value.validityEndTime
            }
        };
        console.log('🔧 QuantReminderDialog - 发送创建提醒数据:', reminderData);
        emit('confirm', reminderData);
        ElMessage.success('价格提醒设置成功');
    }

    emit('update:visible', false);
    resetSettings();
};

const resetSettings = () => {
    reminderForm.value = {
        stockCode: '',
        stockName: ''
    };
    quantAnalysis.value = {
        buyPrice: '0.00',
        sellPrice: '0.00',
        stopLossPrice: '0.00',
        validityPeriod: '3天',
        validityEndTime: null
    };
    reminderSettings.value = {
        enabled: false
    };
};

const getValidityEndTime = () => {
    if (!quantAnalysis.value.validityEndTime) return '未设置';

    const endTime = new Date(quantAnalysis.value.validityEndTime);
    const now = new Date();
    const diffTime = endTime - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return '已过期';
    if (diffDays === 1) return '明天到期';
    return `${diffDays}天后到期`;
};

// 获取提醒描述
const getReminderDescription = (reminder) => {
    const parts = [];

    if (reminder.settings?.buyPrice) {
        parts.push(`买入价: ${reminder.settings.buyPrice}元`);
    }

    if (reminder.settings?.sellPrice) {
        parts.push(`卖出价: ${reminder.settings.sellPrice}元`);
    }

    if (reminder.settings?.stopLossPrice) {
        parts.push(`止损价: ${reminder.settings.stopLossPrice}元`);
    }

    return parts.join(', ') || '价格提醒';
};

// 从量化分析内容中提取信息
const extractQuantAnalysisData = (message) => {
    // 优先使用 message.stockInfo，这是最准确的来源
    if (message.stockInfo && message.stockInfo.code) {
        reminderForm.value.stockCode = message.stockInfo.code;
        reminderForm.value.stockName = message.stockInfo.name || '未知股票';
    } else {
        // 降级方案：从内容中提取（保留原有逻辑作为备用）
        const content = message.content || '';

        // 尝试多种正则表达式来匹配股票信息
        const patterns = [
            // 原始格式：股票名称(代码)
            /(?:\*\*)?(.+?)\s*\((\d{6})\)(?:\s*量化分析报告\*\*)?/,
            // 格式：**股票名称(代码)**
            /\*\*(.+?)\s*\((\d{6})\)\*\*/,
            // 格式：股票名称 (代码)
            /(.+?)\s+\((\d{6})\)/,
            // 格式：股票名称(代码)
            /(.+?)\((\d{6})\)/,
            // 格式：代码 股票名称
            /(\d{6})\s+(.+?)(?:\s|$)/,
            // 格式：代码:股票名称
            /(\d{6}):(.+?)(?:\s|$)/,
            // 格式：代码-股票名称
            /(\d{6})-(.+?)(?:\s|$)/,
            // 简单的6位数字代码
            /(\d{6})/
        ];

        let stockMatch = null;
        let patternIndex = -1;

        for (let i = 0; i < patterns.length; i++) {
            stockMatch = content.match(patterns[i]);
            if (stockMatch) {
                patternIndex = i;
                break;
            }
        }

        if (stockMatch) {
            console.log('🔍 使用正则表达式匹配:', {
                patternIndex,
                match: stockMatch,
                pattern: patterns[patternIndex]
            });

            // 根据不同的模式提取股票代码和名称
            if (patternIndex <= 3) {
                // 模式 0-3: 股票名称(代码)
                reminderForm.value.stockName = stockMatch[1]?.trim() || '未知股票';
                reminderForm.value.stockCode = stockMatch[2];
            } else if (patternIndex <= 6) {
                // 模式 4-6: 代码 股票名称
                reminderForm.value.stockCode = stockMatch[1];
                reminderForm.value.stockName = stockMatch[2]?.trim() || '未知股票';
            } else {
                // 模式 7: 只有代码
                reminderForm.value.stockCode = stockMatch[1];
                reminderForm.value.stockName = '未知股票';
            }

            console.log('🔍 提取结果:', {
                stockCode: reminderForm.value.stockCode,
                stockName: reminderForm.value.stockName,
                patternIndex
            });
        } else {
            console.warn('🔍 未找到股票信息');
            reminderForm.value.stockCode = '';
            reminderForm.value.stockName = '未知股票';
        }
    }

    // 其余的价格提取逻辑保持不变
    const content = message.content || '';

    // 提取买入价格
    const buyPriceMatch = content.match(/买入价格?[：:]\s*(\d+\.?\d*)/i) ||
        content.match(/建议买入[：:]\s*(\d+\.?\d*)/i);
    if (buyPriceMatch) {
        quantAnalysis.value.buyPrice = buyPriceMatch[1];
    }

    // 提取卖出价格
    const sellPriceMatch = content.match(/卖出价格?[：:]\s*(\d+\.?\d*)/i) ||
        content.match(/目标价格?[：:]\s*(\d+\.?\d*)/i);
    if (sellPriceMatch) {
        quantAnalysis.value.sellPrice = sellPriceMatch[1];
    }

    // 提取止损价格
    const stopLossMatch = content.match(/止损价格?[：:]\s*(\d+\.?\d*)/i) ||
        content.match(/止损[：:]\s*(\d+\.?\d*)/i);
    if (stopLossMatch) {
        quantAnalysis.value.stopLossPrice = stopLossMatch[1];
    }

    // 如果没有找到具体价格，尝试从其他格式提取
    if (!buyPriceMatch && !sellPriceMatch && !stopLossMatch) {
        // 尝试提取价格区间
        const priceRangeMatch = content.match(/价格区间[：:]\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/i);
        if (priceRangeMatch) {
            quantAnalysis.value.buyPrice = priceRangeMatch[1];
            quantAnalysis.value.sellPrice = priceRangeMatch[2];
        }

        // 尝试提取建议价格
        const suggestedPriceMatch = content.match(/建议价格[：:]\s*(\d+\.?\d*)/i);
        if (suggestedPriceMatch) {
            quantAnalysis.value.buyPrice = suggestedPriceMatch[1];
        }
    }

    // 设置有效期（默认3天）
    const validityEnd = new Date();
    validityEnd.setDate(validityEnd.getDate() + 3);
    quantAnalysis.value.validityEndTime = validityEnd.toISOString();
};

// 监听对话框打开，初始化数据
watch(() => props.visible, (newVal) => {
    if (newVal && props.message) {
        // 从量化分析消息内容中提取信息
        extractQuantAnalysisData(props.message);

        // 检查当前股票是否已经设置了提醒
        const existingReminder = props.activeReminders.find(
            r => r.stockCode === reminderForm.value.stockCode &&
                r.isActive &&
                !r.triggered
        );

        // 如果存在活跃的提醒，则开关应该是开启状态
        reminderSettings.value.enabled = !!existingReminder;

        console.log('🔍 QuantReminderDialog - 初始化完成:', {
            stockCode: reminderForm.value.stockCode,
            stockName: reminderForm.value.stockName,
            existingReminder: !!existingReminder,
            enabled: reminderSettings.value.enabled
        });
    }
});
</script>

<style scoped>
/* 基础对话框样式 */
:deep(.reminder-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.reminder-dialog .el-dialog__header) {
    background: #fafafa;
    color: #18181b;
    padding: 20px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
}

:deep(.reminder-dialog .el-dialog__title) {
    color: #18181b;
    font-weight: 600;
    font-size: 1.2rem;
}

:deep(.reminder-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: #6b7280;
    font-size: 18px;
}

:deep(.reminder-dialog .el-dialog__headerbtn .el-dialog__close:hover) {
    color: #374151;
}

:deep(.reminder-dialog .el-dialog__body) {
    padding: 0;
}

:deep(.reminder-dialog .el-dialog__footer) {
    padding: 16px 20px;
    background: #fafafa;
    border-top: 1px solid #f0f0f0;
}

/* 对话框内容样式 */
.reminder-dialog-content {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
}

/* 股票信息样式 */
.stock-info-section {
    margin-bottom: 20px;
    padding: 16px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
}

.stock-info-section h4 {
    margin: 0 0 12px 0;
    color: #1e40af;
    font-size: 16px;
    font-weight: 600;
}

.stock-info-display {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stock-name {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.stock-code {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

/* 量化分析结果样式 */
.quant-analysis-summary {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.quant-analysis-summary h4 {
    margin: 0 0 16px 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
}

.analysis-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.summary-item {
    background: white;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.summary-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
    font-weight: 500;
}

.summary-value {
    font-size: 14px;
    font-weight: 600;
}

.summary-value.buy-price {
    color: #059669;
}

.summary-value.sell-price {
    color: #dc2626;
}

.summary-value.stop-loss {
    color: #ea580c;
}

.summary-value.validity {
    color: #7c3aed;
}

/* 价格提醒设置样式 */
.price-reminder-section {
    margin-bottom: 20px;
}

.price-reminder-section h4 {
    margin: 0 0 16px 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
}

.reminder-switch-section {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.switch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.switch-info {
    flex: 1;
}

.switch-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
}

.switch-desc {
    font-size: 12px;
    color: #6b7280;
}

/* 价格信息展示样式 */
.price-display {
    margin-top: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.price-info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.price-info-item {
    background: white;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.price-info-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 8px;
}

.price-icon {
    font-size: 16px;
}

.price-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
}

.price-value {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
}

.price-value.buy-price {
    color: #059669;
}

.price-value.sell-price {
    color: #dc2626;
}

.price-value.stop-loss {
    color: #ea580c;
}

.price-desc {
    font-size: 11px;
    color: #9ca3af;
}

/* 有效期信息样式 */
.validity-info {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 6px;
    border: 1px solid #bfdbfe;
}

.validity-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
}

.validity-label {
    color: #1e40af;
    font-weight: 500;
}

.validity-value {
    color: #dc2626;
    font-weight: 600;
}

.validity-note {
    margin-top: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .analysis-summary-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .price-info-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .switch-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}

@media (max-width: 480px) {
    :deep(.reminder-dialog) {
        margin: 2vh auto !important;
        width: 95% !important;
        max-width: none !important;
        border-radius: 10px !important;
    }

    .reminder-dialog-content {
        max-height: 60vh;
        padding: 12px;
    }

    .stock-info-section,
    .quant-analysis-summary {
        padding: 12px;
        margin-bottom: 12px;
    }

    .price-display,
    .reminder-switch-section {
        padding: 12px;
    }
}
</style>
