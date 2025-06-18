<template>
    <div class="ai-trading-records">
        <!-- 记录列表 -->
        <div v-if="records.length > 0" class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item">
                <div class="record-header">
                    <div class="stock-info">
                        <div class="stock-name">{{ record.stockInfo.name }}</div>
                        <div class="stock-code">{{ record.stockInfo.code }}</div>
                    </div>
                    <div class="trade-status" :class="record.status">
                        <span class="status-dot"></span>
                        {{ getStatusText(record.status) }}
                    </div>
                </div>

                <div class="record-content">
                    <div class="trade-details">
                        <div class="detail-row">
                            <span class="label">交易类型：</span>
                            <span class="value" :class="record.type">
                                {{ record.type === 'buy' ? '买入' : '卖出' }}
                            </span>
                        </div>
                        <div class="detail-row">
                            <span class="label">数量：</span>
                            <span class="value">{{ record.quantity }}股</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">预期价格：</span>
                            <span class="value">¥{{ record.expectedPrice }}</span>
                        </div>
                        <div v-if="record.executedPrice" class="detail-row">
                            <span class="label">成交价格：</span>
                            <span class="value">¥{{ record.executedPrice }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">总金额：</span>
                            <span class="value amount">¥{{ record.totalAmount.toLocaleString() }}</span>
                        </div>
                        <div v-if="record.fee" class="detail-row">
                            <span class="label">手续费：</span>
                            <span class="value">¥{{ record.fee }}</span>
                        </div>
                        <div v-if="record.profit !== undefined" class="detail-row">
                            <span class="label">盈亏：</span>
                            <span class="value" :class="{ 'profit': record.profit > 0, 'loss': record.profit < 0 }">
                                {{ record.profit > 0 ? '+' : '' }}¥{{ record.profit }}
                            </span>
                        </div>
                    </div>

                    <div v-if="record.analysis" class="ai-analysis">
                        <div class="analysis-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            AI分析
                        </div>
                        <div class="analysis-content">{{ record.analysis }}</div>
                    </div>
                </div>

                <div class="record-footer">
                    <div class="time-info">
                        <div v-if="record.executedAt" class="executed-time">
                            成交时间：{{ formatTime(record.executedAt) }}
                        </div>
                        <div class="created-time">
                            委托时间：{{ formatTime(record.createdAt) }}
                        </div>
                    </div>
                    <div v-if="record.status === 'pending'" class="actions">
                        <el-button size="small" type="danger" @click="cancelOrder(record.id)">
                            撤单
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
            <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#d1d5db"
                        stroke-width="2" />
                </svg>
            </div>
            <div class="empty-text">
                <h3>暂无AI委托交易记录</h3>
                <p>您的AI委托交易记录将在这里显示</p>
            </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="records.length > 0" class="records-stats">
            <div class="stat-item">
                <div class="stat-label">总交易次数</div>
                <div class="stat-value">{{ records.length }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">成功交易</div>
                <div class="stat-value">{{ completedCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">待成交</div>
                <div class="stat-value">{{ pendingCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">总盈亏</div>
                <div class="stat-value" :class="{ 'profit': totalProfit > 0, 'loss': totalProfit < 0 }">
                    {{ totalProfit > 0 ? '+' : '' }}¥{{ totalProfit.toFixed(2) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../store/user';
import { ElButton, ElMessage } from 'element-plus';

const userStore = useUserStore();

// 获取AI交易记录
const records = computed(() => userStore.aiTradingRecords || []);

// 计算统计数据
const completedCount = computed(() =>
    records.value.filter(record => record.status === 'completed').length
);

const pendingCount = computed(() =>
    records.value.filter(record => record.status === 'pending').length
);

const totalProfit = computed(() => {
    return records.value
        .filter(record => record.profit !== undefined)
        .reduce((total, record) => total + record.profit, 0);
});

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'pending': '待成交',
        'completed': '已成交',
        'cancelled': '已撤单',
        'failed': '交易失败'
    };
    return statusMap[status] || status;
};

// 格式化时间
const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays === 1) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays < 7) {
        return diffDays + '天前';
    } else {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// 撤单操作
const cancelOrder = (tradeId) => {
    const success = userStore.cancelAITradingOrder(tradeId);
    if (success) {
        ElMessage.success('撤单成功');
    } else {
        ElMessage.error('撤单失败');
    }
};
</script>

<style scoped>
.ai-trading-records {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.records-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.record-item {
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    transition: all 0.2s ease;
}

.record-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
}

.stock-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stock-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    font-size: 14px;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
}

.trade-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 20px;
}

.trade-status.pending {
    color: #d97706;
    background: #fef3c7;
}

.trade-status.completed {
    color: #059669;
    background: #d1fae5;
}

.trade-status.cancelled {
    color: #6b7280;
    background: #f3f4f6;
}

.trade-status.failed {
    color: #dc2626;
    background: #fee2e2;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.record-content {
    padding: 16px;
}

.trade-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    font-size: 14px;
    color: #64748b;
}

.value {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.value.buy {
    color: #dc2626;
}

.value.sell {
    color: #059669;
}

.value.amount {
    font-weight: 600;
}

.value.profit {
    color: #059669;
}

.value.loss {
    color: #dc2626;
}

.ai-analysis {
    background: #f0f9ff;
    border: 1px solid #e0f2fe;
    border-radius: 8px;
    padding: 12px;
}

.analysis-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #0369a1;
    margin-bottom: 8px;
}

.analysis-content {
    font-size: 13px;
    color: #0f172a;
    line-height: 1.5;
}

.record-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.time-info {
    font-size: 12px;
    color: #64748b;
}

.executed-time {
    margin-bottom: 2px;
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 40px;
    text-align: center;
}

.empty-icon {
    opacity: 0.5;
}

.empty-text h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

.records-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.stat-item {
    text-align: center;
}

.stat-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.stat-value.profit {
    color: #059669;
}

.stat-value.loss {
    color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .ai-trading-records {
        padding: 16px;
    }

    .record-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .trade-details {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .record-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .records-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .stock-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .records-stats {
        grid-template-columns: 1fr;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
    }

    .stat-label {
        margin-bottom: 0;
    }
}
</style>
