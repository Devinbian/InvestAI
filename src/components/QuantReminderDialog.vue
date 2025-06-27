<template>
    <el-dialog v-model="dialogVisible" title="设置量化分析提醒" :width="reminderDialogWidth" :before-close="handleCancel"
        class="reminder-dialog">
        <div class="reminder-dialog-content">
            <div class="stock-info-section">
                <h4>📊 量化分析股票</h4>
                <div class="stock-info-display">
                    <span class="stock-name">{{ reminderForm.stockName }}</span>
                    <span class="stock-code">({{ reminderForm.stockCode }})</span>
                </div>
            </div>

            <div class="quant-analysis-summary">
                <h4>🎯 当前量化分析结果</h4>
                <div class="analysis-summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">综合评分</span>
                        <span class="summary-value score">{{ quantAnalysis.overallScore }}/10</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">信号强度</span>
                        <span class="summary-value signal">{{ quantAnalysis.signalStrength }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">买入信号</span>
                        <span class="summary-value signal-score">{{ quantAnalysis.buySignalScore }}/100</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">量化评级</span>
                        <span class="summary-value rating">{{ quantAnalysis.rating }}</span>
                    </div>
                </div>
            </div>

            <div class="reminder-form-section">
                <h4>⚙️ 量化条件提醒设置</h4>
                <div class="batch-reminder-tip">
                    <el-alert title="批量设置" type="info" :closable="false" show-icon>
                        <template #default>
                            勾选需要的提醒条件，可同时设置多个
                        </template>
                    </el-alert>
                </div>

                <!-- 快速选择区域 -->
                <div class="quick-select-area">
                    <div class="quick-select-header">
                        <span class="quick-select-title">🚀 快速选择</span>
                        <div class="quick-select-actions">
                            <el-button size="small" @click="selectRecommendedConditions" type="primary" plain>
                                推荐配置
                            </el-button>
                            <el-button size="small" @click="clearAllConditions" plain>
                                清空选择
                            </el-button>
                        </div>
                    </div>

                    <!-- 紧凑的条件选择网格 -->
                    <div class="conditions-grid">
                        <!-- 综合评分 -->
                        <div class="condition-category">
                            <div class="category-header">
                                <span class="category-icon">🎯</span>
                                <span class="category-name">综合评分</span>
                            </div>
                            <div class="category-items">
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('overall_score', 'score_above') }"
                                    @click="toggleCondition('overall_score', 'score_above')">
                                    <span>评分上升至</span>
                                    <el-input v-if="isConditionSelected('overall_score', 'score_above')"
                                        v-model="reminderConditions.overall_score.values.score_above" type="number"
                                        placeholder="8.0" class="chip-input" @click.stop>
                                        <template #append>分</template>
                                    </el-input>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('overall_score', 'score_below') }"
                                    @click="toggleCondition('overall_score', 'score_below')">
                                    <span>评分下降至</span>
                                    <el-input v-if="isConditionSelected('overall_score', 'score_below')"
                                        v-model="reminderConditions.overall_score.values.score_below" type="number"
                                        placeholder="6.0" class="chip-input" @click.stop>
                                        <template #append>分</template>
                                    </el-input>
                                </div>
                            </div>
                        </div>

                        <!-- 买入信号 -->
                        <div class="condition-category">
                            <div class="category-header">
                                <span class="category-icon">📈</span>
                                <span class="category-name">买入信号</span>
                            </div>
                            <div class="category-items">
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('buy_signal', 'signal_above') }"
                                    @click="toggleCondition('buy_signal', 'signal_above')">
                                    <span>信号强度达到</span>
                                    <el-input v-if="isConditionSelected('buy_signal', 'signal_above')"
                                        v-model="reminderConditions.buy_signal.values.signal_above" type="number"
                                        placeholder="90" class="chip-input" @click.stop>
                                        <template #append>分</template>
                                    </el-input>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('buy_signal', 'buy_signal_trigger') }"
                                    @click="toggleCondition('buy_signal', 'buy_signal_trigger')">
                                    <span>出现买入信号</span>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('buy_signal', 'sell_signal_trigger') }"
                                    @click="toggleCondition('buy_signal', 'sell_signal_trigger')">
                                    <span>出现卖出信号</span>
                                </div>
                            </div>
                        </div>

                        <!-- 技术指标 -->
                        <div class="condition-category">
                            <div class="category-header">
                                <span class="category-icon">📊</span>
                                <span class="category-name">技术指标</span>
                            </div>
                            <div class="category-items">
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('technical', 'macd_golden') }"
                                    @click="toggleCondition('technical', 'macd_golden')">
                                    <span>MACD金叉</span>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('technical', 'rsi_oversold') }"
                                    @click="toggleCondition('technical', 'rsi_oversold')">
                                    <span>RSI超卖</span>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('technical', 'boll_break') }"
                                    @click="toggleCondition('technical', 'boll_break')">
                                    <span>布林带突破</span>
                                </div>
                            </div>
                        </div>

                        <!-- 评级和风险 -->
                        <div class="condition-category">
                            <div class="category-header">
                                <span class="category-icon">⭐</span>
                                <span class="category-name">评级风险</span>
                            </div>
                            <div class="category-items">
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('rating_change', 'rating_upgrade') }"
                                    @click="toggleCondition('rating_change', 'rating_upgrade')">
                                    <span>评级上调</span>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('rating_change', 'rating_downgrade') }"
                                    @click="toggleCondition('rating_change', 'rating_downgrade')">
                                    <span>评级下调</span>
                                </div>
                                <div class="condition-chip"
                                    :class="{ active: isConditionSelected('risk_alert', 'risk_abnormal') }"
                                    @click="toggleCondition('risk_alert', 'risk_abnormal')">
                                    <span>风险异常</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 选中条件摘要 -->
                <div class="selected-summary" v-if="getSelectedConditionsCount() > 0">
                    <div class="summary-header">
                        <span class="summary-title">📋 已选择 {{ getSelectedConditionsCount() }} 个提醒条件</span>
                        <el-button size="small" @click="clearAllConditions" text type="danger">
                            清空
                        </el-button>
                    </div>
                    <div class="summary-tags">
                        <el-tag v-for="preview in getBatchPreview()" :key="preview.id" closable
                            @close="removeSelectedCondition(preview)" class="summary-tag">
                            {{ preview.icon }} {{ preview.shortText }}
                        </el-tag>
                    </div>
                </div>
            </div>

            <!-- 当前活跃提醒列表 -->
            <div v-if="activeReminders.length > 0" class="active-reminders-section">
                <h4>🔔 当前活跃提醒</h4>
                <div class="reminders-list">
                    <div v-for="reminder in activeReminders.filter(r => r.isActive)" :key="reminder.id"
                        class="reminder-item">
                        <div class="reminder-info">
                            <span class="reminder-stock">{{ reminder.stockName }}</span>
                            <span class="reminder-desc">{{ getReminderDescription(reminder) }}</span>
                            <span class="reminder-time">{{ reminder.createdAt }}</span>
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
                <el-button type="primary" @click="handleConfirm">确认设置</el-button>
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
    type: 'overall_score',
    condition: 'score_above',
    value: '',
    stockCode: '',
    stockName: ''
});

const quantAnalysis = ref({
    overallScore: '7.8',
    signalStrength: '强',
    buySignalScore: '85',
    rating: 'A级',
    technicalIndicators: {
        macd: { dif: 1.25, dea: 0.89, status: '金叉' },
        rsi: { value: 65.2, status: '强势区间' },
        boll: { status: '突破上轨' },
        kdj: { k: 78, d: 65, j: 85, status: '多头排列' }
    },
    riskMetrics: {
        volatility: 28.5,
        maxDrawdown: 15.2,
        sharpeRatio: 1.35,
        var95: 2.1
    }
});

const reminderConditions = ref({
    overall_score: {
        conditions: [],
        values: {
            score_above: '',
            score_below: '',
            score_change: ''
        }
    },
    buy_signal: {
        conditions: [],
        values: {
            signal_above: '',
            signal_below: ''
        }
    },
    technical: {
        conditions: []
    },
    rating_change: {
        conditions: [],
        values: {
            rating_reach: ''
        }
    },
    risk_alert: {
        conditions: []
    }
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
        if (width < 1024) return '500px';
        return '600px';
    }
    return '500px';
});

// 方法
const handleCancel = () => {
    emit('update:visible', false);
    resetReminderConditions();
    emit('cancel');
};

const handleConfirm = () => {
    const selectedConditions = getSelectedConditions();

    if (selectedConditions.length === 0) {
        ElMessage.error('请至少选择一个提醒条件');
        return;
    }

    // 验证需要数值的条件是否已填写
    const invalidConditions = selectedConditions.filter(condition => {
        if (condition.needsValue && (!condition.value || condition.value === '')) {
            return true;
        }
        return false;
    });

    if (invalidConditions.length > 0) {
        ElMessage.error('请填写所有需要数值的提醒条件');
        return;
    }

    // 批量创建提醒
    const newReminders = selectedConditions.map(condition => ({
        id: Date.now() + Math.random(),
        type: condition.type,
        condition: condition.condition,
        value: condition.value,
        stockCode: reminderForm.value.stockCode,
        stockName: reminderForm.value.stockName,
        createdAt: new Date().toLocaleString(),
        isActive: true,
        isQuantAnalysis: true
    }));

    emit('confirm', newReminders);
    emit('update:visible', false);
    resetReminderConditions();
};

const resetReminderConditions = () => {
    reminderConditions.value = {
        overall_score: {
            conditions: [],
            values: {
                score_above: '',
                score_below: '',
                score_change: ''
            }
        },
        buy_signal: {
            conditions: [],
            values: {
                signal_above: '',
                signal_below: ''
            }
        },
        technical: {
            conditions: []
        },
        rating_change: {
            conditions: [],
            values: {
                rating_reach: ''
            }
        },
        risk_alert: {
            conditions: []
        }
    };
};

const getSelectedConditions = () => {
    const conditions = [];

    // 综合评分条件
    reminderConditions.value.overall_score.conditions.forEach(condition => {
        const value = reminderConditions.value.overall_score.values[condition];
        conditions.push({
            type: 'overall_score',
            condition: condition,
            value: value ? parseFloat(value) : null,
            needsValue: ['score_above', 'score_below', 'score_change'].includes(condition)
        });
    });

    // 买入信号条件
    reminderConditions.value.buy_signal.conditions.forEach(condition => {
        const value = reminderConditions.value.buy_signal.values[condition];
        conditions.push({
            type: 'buy_signal',
            condition: condition,
            value: value ? parseFloat(value) : null,
            needsValue: ['signal_above', 'signal_below'].includes(condition)
        });
    });

    // 技术指标条件
    reminderConditions.value.technical.conditions.forEach(condition => {
        conditions.push({
            type: 'technical',
            condition: condition,
            value: null,
            needsValue: false
        });
    });

    // 评级变化条件
    reminderConditions.value.rating_change.conditions.forEach(condition => {
        const value = reminderConditions.value.rating_change.values[condition];
        conditions.push({
            type: 'rating_change',
            condition: condition,
            value: value || null,
            needsValue: condition === 'rating_reach'
        });
    });

    // 风险指标条件
    reminderConditions.value.risk_alert.conditions.forEach(condition => {
        conditions.push({
            type: 'risk_alert',
            condition: condition,
            value: null,
            needsValue: false
        });
    });

    return conditions;
};

const getSelectedConditionsCount = () => {
    return getSelectedConditions().length;
};

const getBatchPreview = () => {
    const conditions = getSelectedConditions();
    const stockName = reminderForm.value.stockName || '当前股票';

    return conditions.map((condition, index) => {
        const mockReminder = {
            type: condition.type,
            condition: condition.condition,
            value: condition.value,
            isQuantAnalysis: true
        };

        const description = getReminderDescription(mockReminder);
        const icons = {
            overall_score: '🎯',
            buy_signal: '📈',
            technical: '📊',
            rating_change: '⭐',
            risk_alert: '⚠️'
        };

        return {
            id: `${condition.type}_${condition.condition}`,
            icon: icons[condition.type] || '📋',
            text: `${stockName} ${description}`,
            shortText: description,
            type: condition.type,
            condition: condition.condition
        };
    });
};

const isConditionSelected = (type, condition) => {
    if (type === 'overall_score') {
        return reminderConditions.value.overall_score.conditions.includes(condition);
    } else if (type === 'buy_signal') {
        return reminderConditions.value.buy_signal.conditions.includes(condition);
    } else if (type === 'technical') {
        return reminderConditions.value.technical.conditions.includes(condition);
    } else if (type === 'rating_change') {
        return reminderConditions.value.rating_change.conditions.includes(condition);
    } else if (type === 'risk_alert') {
        return reminderConditions.value.risk_alert.conditions.includes(condition);
    }
    return false;
};

const toggleCondition = (type, condition) => {
    const typeData = reminderConditions.value[type];
    const index = typeData.conditions.indexOf(condition);

    if (index > -1) {
        // 移除条件
        typeData.conditions.splice(index, 1);
    } else {
        // 添加条件
        typeData.conditions.push(condition);
    }
};

const clearAllConditions = () => {
    Object.keys(reminderConditions.value).forEach(type => {
        reminderConditions.value[type].conditions = [];
    });
};

const selectRecommendedConditions = () => {
    // 清空现有选择
    clearAllConditions();

    // 设置推荐的条件
    reminderConditions.value.overall_score.conditions = ['score_above'];
    reminderConditions.value.overall_score.values.score_above = '8.5';

    reminderConditions.value.buy_signal.conditions = ['buy_signal_trigger'];

    reminderConditions.value.technical.conditions = ['macd_golden', 'rsi_oversold'];

    reminderConditions.value.rating_change.conditions = ['rating_upgrade'];

    ElMessage.success('已应用推荐配置');
};

const removeSelectedCondition = (preview) => {
    const typeData = reminderConditions.value[preview.type];
    const index = typeData.conditions.indexOf(preview.condition);
    if (index > -1) {
        typeData.conditions.splice(index, 1);
    }
};

const removeReminder = (reminderId) => {
    emit('remove-reminder', reminderId);
};

const getReminderDescription = (reminder) => {
    let conditionText = '';

    switch (reminder.type) {
        case 'overall_score':
            if (reminder.condition === 'score_above') {
                conditionText = `综合评分上升至 ${reminder.value}分`;
            } else if (reminder.condition === 'score_below') {
                conditionText = `综合评分下降至 ${reminder.value}分`;
            } else if (reminder.condition === 'score_change') {
                conditionText = `综合评分变化超过 ${reminder.value}分`;
            }
            break;
        case 'buy_signal':
            if (reminder.condition === 'signal_above') {
                conditionText = `买入信号强度达到 ${reminder.value}分`;
            } else if (reminder.condition === 'signal_below') {
                conditionText = `买入信号强度低于 ${reminder.value}分`;
            } else if (reminder.condition === 'buy_signal_trigger') {
                conditionText = `出现买入信号`;
            } else if (reminder.condition === 'sell_signal_trigger') {
                conditionText = `出现卖出信号`;
            }
            break;
        case 'technical':
            const technicalMap = {
                'macd_golden': 'MACD出现金叉',
                'macd_death': 'MACD出现死叉',
                'rsi_overbought': 'RSI进入超买区域',
                'rsi_oversold': 'RSI进入超卖区域',
                'boll_break': '价格突破布林带'
            };
            conditionText = technicalMap[reminder.condition] || '技术指标变化';
            break;
        case 'rating_change':
            if (reminder.condition === 'rating_upgrade') {
                conditionText = `量化评级上调`;
            } else if (reminder.condition === 'rating_downgrade') {
                conditionText = `量化评级下调`;
            } else if (reminder.condition === 'rating_reach') {
                conditionText = `量化评级达到 ${reminder.value}`;
            }
            break;
        case 'risk_alert':
            const riskMap = {
                'risk_abnormal': '风险指标异常',
                'volatility_high': '波动率过高',
                'drawdown_large': '最大回撤过大',
                'sharpe_abnormal': '夏普比率异常'
            };
            conditionText = riskMap[reminder.condition] || '风险提醒';
            break;
        default:
            conditionText = '量化分析提醒';
    }

    return conditionText;
};

// 监听对话框打开，初始化数据
watch(() => props.visible, (newVal) => {
    if (newVal && props.message) {
        // 从量化分析消息内容中提取股票信息
        const content = props.message.content;
        const stockMatch = content.match(/\*\*(.+?)\((.+?)\)\s+量化分析报告\*\*/);

        if (stockMatch) {
            reminderForm.value.stockName = stockMatch[1];
            reminderForm.value.stockCode = stockMatch[2];
        } else {
            reminderForm.value.stockName = '量化分析股票';
            reminderForm.value.stockCode = '000000';
        }

        // 从量化分析内容中提取关键指标
        const scoreMatch = content.match(/综合评分：(\d+\.?\d*)/);
        if (scoreMatch) {
            quantAnalysis.value.overallScore = scoreMatch[1];
        }

        const signalMatch = content.match(/买入信号：多因子模型评分(\d+)/);
        if (signalMatch) {
            quantAnalysis.value.buySignalScore = signalMatch[1];
        }

        const strengthMatch = content.match(/信号强度【(.+?)】/);
        if (strengthMatch) {
            quantAnalysis.value.signalStrength = strengthMatch[1];
        }

        const ratingMatch = content.match(/量化评级：(.+?级)/);
        if (ratingMatch) {
            quantAnalysis.value.rating = ratingMatch[1];
        }
    }
});
</script>

<style scoped>
/* 提醒对话框样式 */
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

.summary-value.score {
    color: #059669;
}

.summary-value.signal {
    color: #dc2626;
}

.summary-value.signal-score {
    color: #ea580c;
}

.summary-value.rating {
    color: #7c3aed;
}

.reminder-form-section h4 {
    margin: 0 0 16px 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 600;
}

/* 批量提醒设置样式 */
.batch-reminder-tip {
    margin-bottom: 16px;
}

.quick-select-area {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
}

.quick-select-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.quick-select-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.quick-select-actions {
    display: flex;
    gap: 8px;
}

.conditions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.condition-category {
    background: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

.category-header {
    background: #f1f5f9;
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-icon {
    font-size: 14px;
}

.category-name {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.category-items {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.condition-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    font-size: 12px;
}

.condition-chip:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.condition-chip.active {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    font-weight: 500;
}

.condition-chip span {
    flex-shrink: 0;
    white-space: nowrap;
}

.chip-input {
    margin-left: 8px;
    max-width: 80px;
}

.chip-input :deep(.el-input__inner) {
    font-size: 11px;
    padding: 4px 8px;
}

.selected-summary {
    background: #f0f9ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.summary-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
}

.summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.summary-tag {
    font-size: 12px;
    padding: 2px 8px;
}

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

.remove-btn {
    margin-left: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .analysis-summary-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .conditions-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .condition-chip {
        font-size: 11px;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .chip-input {
        margin-left: 0;
        width: 100%;
        max-width: none;
    }

    .selected-summary {
        padding: 10px;
        margin-top: 12px;
    }

    .summary-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
    }

    .summary-title {
        font-size: 12px;
    }

    .summary-tags {
        gap: 4px;
    }

    .summary-tag {
        font-size: 10px;
        padding: 1px 4px;
    }

    .reminder-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 10px;
    }

    .reminder-info {
        width: 100%;
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

    .stock-info-section {
        padding: 10px;
        margin-bottom: 12px;
    }

    .quant-analysis-summary {
        padding: 10px;
        margin-bottom: 12px;
    }
}
</style>
