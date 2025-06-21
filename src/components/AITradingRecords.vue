<template>
    <div class="ai-trading-records">
        <!-- 筛选器 -->
        <div class="records-filters">
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">交易类型</label>
                    <el-select v-model="filterType" placeholder="交易类型" clearable size="small" class="filter-select">
                        <el-option label="全部类型" value="" />
                        <el-option label="买入" value="buy" />
                        <el-option label="卖出" value="sell" />
                    </el-select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">交易状态</label>
                    <el-select v-model="filterStatus" placeholder="交易状态" clearable size="small" class="filter-select">
                        <el-option label="全部状态" value="" />
                        <el-option label="待成交" value="pending" />
                        <el-option label="已成交" value="completed" />
                        <el-option label="已撤单" value="cancelled" />
                        <el-option label="交易失败" value="failed" />
                    </el-select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">时间范围</label>
                    <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" size="small" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" class="filter-date" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">股票搜索</label>
                    <el-input v-model="filterKeyword" placeholder="搜索股票名称或代码" size="small" clearable
                        class="filter-search">
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>
                <div class="filter-group">
                    <el-button @click="resetFilters" class="pc-filter-btn">重置</el-button>
                </div>
            </div>
        </div>

        <!-- 记录列表 -->
        <div v-if="filteredRecords.length > 0" class="records-list">
            <div v-for="record in paginatedRecords" :key="record.id" class="record-item">
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
                        <el-button type="danger" @click="cancelOrder(record.id)" class="pc-cancel-btn">
                            撤单
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div class="records-pagination" v-if="filteredRecords.length > pageSize">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredRecords.length"
                layout="total, prev, pager, next, jumper" small />
        </div>

        <!-- 空状态 -->
        <div v-if="filteredRecords.length === 0" class="empty-state">
            <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#d1d5db"
                        stroke-width="2" />
                </svg>
            </div>
            <div class="empty-text">
                <h3>{{ allRecords.length === 0 ? '暂无AI委托交易记录' : '暂无符合条件的记录' }}</h3>
                <p>{{ allRecords.length === 0 ? '您的AI委托交易记录将在这里显示' : '请尝试调整筛选条件' }}</p>
            </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="filteredRecords.length > 0" class="records-stats">
            <div class="stat-item">
                <div class="stat-label">总交易次数</div>
                <div class="stat-value">{{ filteredRecords.length }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">成功交易</div>
                <div class="stat-value">{{ filteredCompletedCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">待成交</div>
                <div class="stat-value">{{ filteredPendingCount }}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">总盈亏</div>
                <div class="stat-value" :class="{ 'profit': filteredTotalProfit > 0, 'loss': filteredTotalProfit < 0 }">
                    {{ filteredTotalProfit > 0 ? '+' : '' }}¥{{ filteredTotalProfit.toFixed(2) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ElButton, ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const userStore = useUserStore();

// 响应式数据
const filterType = ref('');
const filterStatus = ref('');
const filterDateRange = ref('');
const filterKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 获取AI交易记录
const allRecords = computed(() => userStore.aiTradingRecords || []);

// 筛选后的记录
const filteredRecords = computed(() => {
    let filtered = allRecords.value;

    // 按交易类型筛选
    if (filterType.value) {
        filtered = filtered.filter(record => record.type === filterType.value);
    }

    // 按交易状态筛选
    if (filterStatus.value) {
        filtered = filtered.filter(record => record.status === filterStatus.value);
    }

    // 按日期范围筛选
    if (filterDateRange.value && filterDateRange.value.length === 2) {
        const [startDate, endDate] = filterDateRange.value;
        filtered = filtered.filter(record => {
            const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
            return recordDate >= startDate && recordDate <= endDate;
        });
    }

    // 按关键词筛选
    if (filterKeyword.value) {
        const keyword = filterKeyword.value.toLowerCase();
        filtered = filtered.filter(record =>
            record.stockInfo.name.toLowerCase().includes(keyword) ||
            record.stockInfo.code.toLowerCase().includes(keyword)
        );
    }

    // 按创建时间倒序排列
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// 分页后的记录
const paginatedRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredRecords.value.slice(start, end);
});

// 计算筛选后的统计数据
const filteredCompletedCount = computed(() =>
    filteredRecords.value.filter(record => record.status === 'completed').length
);

const filteredPendingCount = computed(() =>
    filteredRecords.value.filter(record => record.status === 'pending').length
);

const filteredTotalProfit = computed(() => {
    return filteredRecords.value
        .filter(record => record.profit !== undefined)
        .reduce((total, record) => total + record.profit, 0);
});

// 重置筛选条件
const resetFilters = () => {
    filterType.value = '';
    filterStatus.value = '';
    filterDateRange.value = '';
    filterKeyword.value = '';
    currentPage.value = 1;
};

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
    overflow: hidden;
}

.records-filters {
    margin-bottom: 24px;
    flex-shrink: 0;
}

.filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: end;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 2px;
}

.filter-select {
    width: 120px;
}

.filter-date {
    width: 280px;
}

.filter-search {
    width: 200px;
}

.records-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 16px;
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

.records-pagination {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
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
    flex-shrink: 0;
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

/* PC端按钮样式 */
.pc-filter-btn {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    height: auto;
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
    transition: all 0.2s ease;
}

.pc-filter-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #334155;
    transform: translateY(-1px);
}

.pc-cancel-btn {
    padding: 6px 12px;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    height: auto;
    transition: all 0.2s ease;
}

.pc-cancel-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .filters-row {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .filter-label {
        min-width: 80px;
        margin-bottom: 0;
    }

    .filter-select,
    .filter-date,
    .filter-search {
        flex: 1;
        width: auto;
    }
}

@media (max-width: 768px) {
    .ai-trading-records {
        padding: 16px;
    }

    .filters-row {
        padding: 16px;
        gap: 12px;
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
    .filter-group {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-label {
        min-width: auto;
    }

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
