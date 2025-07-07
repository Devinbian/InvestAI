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
                    <el-alert 
                        title="提醒将在量化分析有效期内生效，超过有效期后自动关闭"
                        type="info"
                        :closable="false"
                        show-icon
                    />
                </div>
            </div>

            <!-- 当前活跃提醒 -->
            <div v-if="activeReminders.length > 0" class="active-reminders-section">
                <h4>🔔 当前活跃提醒</h4>
                <div class="reminders-list">
                    <div v-for="reminder in activeReminders.filter(r => r.isActive)" :key="reminder.id"
                        class="reminder-item">
                        <div class="reminder-info">
                            <span class="reminder-stock">{{ reminder.stockName }}</span>
                            <span class="reminder-desc">{{ getReminderDescription(reminder) }}</span>
                            <span class="reminder-time">{{ reminder.createdAt }}</span>
                            <span class="reminder-status" :class="{ 'valid': reminder.isValid }">
                                {{ reminder.isValid ? '有效' : '已过期' }}
                            </span>
                        </div>
                        <el-button size="small" type="danger" @click="removeReminder(reminder.id)"
                            class="remove-btn">删除</el-button>
                    </div>
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
    if (!reminderSettings.value.enabled) {
        // 关闭提醒
        emit('confirm', {
            action: 'disable',
            stockCode: reminderForm.value.stockCode,
            stockName: reminderForm.value.stockName
        });
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
                validityEndTime: quantAnalysis.value.validityEndTime,
                createdAt: new Date().toLocaleString()
            }
        };

        emit('confirm', reminderData);
        ElMessage.success('价格提醒设置成功');
    }
    
    emit('update:visible', false);
    resetSettings();
};

const resetSettings = () => {
    reminderSettings.value = {
        enabled: false
    };
};

const getValidityEndTime = () => {
    if (quantAnalysis.value.validityEndTime) {
        return new Date(quantAnalysis.value.validityEndTime).toLocaleString();
    }
    return '3天后';
};

const removeReminder = (reminderId) => {
    emit('remove-reminder', reminderId);
};

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
const extractQuantAnalysisData = (content) => {
    // 提取股票信息
    const stockMatch = content.match(/(?:\*\*)?(.+?)\s*\((\d{6})\)(?:\s*量化分析报告\*\*)?/);
    if (stockMatch) {
        reminderForm.value.stockName = stockMatch[1].trim();
        reminderForm.value.stockCode = stockMatch[2];
    }

    // 提取价格信息
    const buyPriceMatch = content.match(/买入价格?[：:]\s*(\d+\.?\d*)/i) || 
                         content.match(/建议买入价[：:]\s*(\d+\.?\d*)/i) ||
                         content.match(/目标买入价[：:]\s*(\d+\.?\d*)/i);
    if (buyPriceMatch) {
        quantAnalysis.value.buyPrice = buyPriceMatch[1];
    }

    const sellPriceMatch = content.match(/卖出价格?[：:]\s*(\d+\.?\d*)/i) || 
                          content.match(/建议卖出价[：:]\s*(\d+\.?\d*)/i) ||
                          content.match(/目标卖出价[：:]\s*(\d+\.?\d*)/i);
    if (sellPriceMatch) {
        quantAnalysis.value.sellPrice = sellPriceMatch[1];
    }

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
        extractQuantAnalysisData(props.message.content);
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
    padding: 20px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
}

.reminder-dialog .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

.reminder-dialog .dialog-footer .el-button {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
}

.reminder-dialog-content {
    max-height: 70vh;
    overflow-y: auto;
    padding: 20px;
}

/* 股票信息样式 */
.stock-info-section {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    border-left: 4px solid #0ea5e9;
}

.stock-info-section h4 {
    margin: 0 0 10px 0;
    color: #0f172a;
    font-size: 14px;
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
    color: #1e40af;
}

.stock-code {
    font-size: 14px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.8);
    padding: 2px 8px;
    border-radius: 4px;
}

/* 量化分析摘要样式 */
.quant-analysis-summary {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    border-left: 4px solid #0ea5e9;
}

.quant-analysis-summary h4 {
    margin: 0 0 12px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.analysis-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    border: 1px solid rgba(14, 165, 233, 0.2);
}

.summary-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
}

.summary-value {
    font-size: 13px;
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

/* 活跃提醒样式 */
.active-reminders-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
}

.active-reminders-section h4 {
    margin: 0 0 12px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.reminders-list {
    max-height: 200px;
    overflow-y: auto;
}

.reminder-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 8px;
}

.reminder-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.reminder-stock {
    font-size: 13px;
    font-weight: 600;
    color: #1e40af;
}

.reminder-desc {
    font-size: 12px;
    color: #64748b;
}

.reminder-time {
    font-size: 11px;
    color: #9ca3af;
}

.reminder-status {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
}

.reminder-status.valid {
    background: #dcfce7;
    color: #166534;
}

.reminder-status:not(.valid) {
    background: #fef2f2;
    color: #dc2626;
}

.remove-btn {
    margin-left: 12px;
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

    .reminder-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .remove-btn {
        margin-left: 0;
        align-self: flex-end;
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
