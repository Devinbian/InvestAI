<template>
    <div class="ai-trading-records">
        <!-- 筛选器 -->
        <div class="trading-filters">
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">交易类型</label>
                    <!-- PC端使用Element Plus -->
                    <el-select v-if="!isMobile" v-model="filterType" placeholder="交易类型" clearable size="small"
                        class="filter-select">
                        <el-option label="全部类型" value="" />
                        <el-option label="买入" value="buy" />
                        <el-option label="卖出" value="sell" />
                    </el-select>
                    <!-- 移动端使用原生控件 -->
                    <select v-else v-model="filterType" class="mobile-select">
                        <option value="">全部类型</option>
                        <option value="buy">买入</option>
                        <option value="sell">卖出</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">交易状态</label>
                    <!-- PC端使用Element Plus -->
                    <el-select v-if="!isMobile" v-model="filterStatus" placeholder="交易状态" clearable size="small"
                        class="filter-select">
                        <el-option label="全部状态" value="" />
                        <el-option label="待成交" value="pending" />
                        <el-option label="已成交" value="completed" />
                        <el-option label="已撤单" value="cancelled" />
                        <el-option label="交易失败" value="failed" />
                    </el-select>
                    <!-- 移动端使用原生控件 -->
                    <select v-else v-model="filterStatus" class="mobile-select">
                        <option value="">全部状态</option>
                        <option value="pending">待成交</option>
                        <option value="completed">已成交</option>
                        <option value="cancelled">已撤单</option>
                        <option value="failed">交易失败</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">时间范围</label>
                    <!-- PC端使用Element Plus -->
                    <el-date-picker v-if="!isMobile" v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" size="small" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" class="filter-date" />
                    <!-- 移动端使用原生控件 -->
                    <div v-else class="mobile-date-range">
                        <input type="date" v-model="startDate" class="mobile-date-input" placeholder="开始日期">
                        <span class="date-separator">至</span>
                        <input type="date" v-model="endDate" class="mobile-date-input" placeholder="结束日期">
                    </div>
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
            <div class="records-grid">
                <div v-for="record in paginatedRecords" :key="record.id" class="record-card"
                    @click="viewRecord(record)">
                    <div class="record-header">
                        <div class="trade-type">
                            <el-tag :type="record.type === 'buy' ? 'danger' : 'success'" size="small">
                                {{ record.type === 'buy' ? '买入' : '卖出' }}
                            </el-tag>
                        </div>
                        <div class="record-actions" @click.stop>
                            <el-dropdown @command="(command) => handleRecordAction(command, record)">
                                <el-button size="small" text>
                                    <el-icon>
                                        <More />
                                    </el-icon>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                                        <el-dropdown-item v-if="record.status === 'pending'" command="cancel"
                                            divided>撤单</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </div>

                    <div class="record-content">
                        <h4 class="record-title">{{ record.stockInfo.name }}({{ record.stockInfo.code }})</h4>
                        <div class="record-info">
                            <div class="info-item">
                                <span class="label">数量：</span>
                                <span class="value">{{ record.quantity }}股</span>
                            </div>
                            <div class="info-item">
                                <span class="label">预期价格：</span>
                                <span class="value">¥{{ record.expectedPrice }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">总金额：</span>
                                <span class="value amount">¥{{ record.totalAmount.toLocaleString() }}</span>
                            </div>
                            <div v-if="record.profit !== undefined" class="info-item">
                                <span class="label">盈亏：</span>
                                <span class="value" :class="{ 'profit': record.profit > 0, 'loss': record.profit < 0 }">
                                    {{ record.profit > 0 ? '+' : '' }}¥{{ record.profit }}
                                </span>
                            </div>
                        </div>
                        <div v-if="record.analysis" class="record-summary">
                            {{ record.analysis }}
                        </div>
                    </div>

                    <div class="record-footer">
                        <div class="record-status" :class="record.status">
                            <el-icon class="status-icon">
                                <CircleCheck v-if="record.status === 'completed'" />
                                <Clock v-else-if="record.status === 'pending'" />
                                <CircleClose v-else-if="record.status === 'cancelled'" />
                                <Warning v-else />
                            </el-icon>
                            {{ getStatusText(record.status) }}
                        </div>
                        <div class="record-time">{{ formatTime(record.createdAt) }}</div>
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
import { ref, computed, watch } from 'vue';
import { useUserStore } from '../store/user';
import { ElButton, ElMessage } from 'element-plus';
import { Search, More, CircleCheck, Clock, CircleClose, Warning } from '@element-plus/icons-vue';

const userStore = useUserStore();

// 移动端检测
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

// 响应式数据
const filterType = ref('');
const filterStatus = ref('');
const filterDateRange = ref(null);
const filterKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 移动端日期范围
const startDate = ref('');
const endDate = ref('');

// 监听移动端日期变化，同步到filterDateRange
watch([startDate, endDate], ([start, end]) => {
    if (start && end) {
        filterDateRange.value = [start, end];
    } else {
        filterDateRange.value = null;
    }
});

// 监听filterDateRange变化，同步到移动端日期
watch(filterDateRange, (newVal) => {
    if (newVal && newVal.length === 2) {
        startDate.value = newVal[0];
        endDate.value = newVal[1];
    } else {
        startDate.value = '';
        endDate.value = '';
    }
});

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
    filterDateRange.value = null;
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

// 查看记录详情
const viewRecord = (record) => {
    // 这里可以实现查看详情的逻辑
    console.log('查看记录详情:', record);
};

// 处理记录操作
const handleRecordAction = async (command, record) => {
    switch (command) {
        case 'view':
            viewRecord(record);
            break;
        case 'cancel':
            await cancelOrder(record.id);
            break;
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

.trading-filters {
    margin-bottom: 20px;
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
    margin-bottom: 16px;
    padding-top: 8px;
}

.records-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 6px;
}

.record-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.record-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.record-actions .el-button {
    color: #6b7280;
}

.record-content {
    flex: 1;
}

.record-title {
    margin: 0 0 8px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    line-height: 1.4;
}

.record-info {
    margin-bottom: 8px;
}

.info-item {
    display: flex;
    margin-bottom: 4px;
    font-size: 0.875rem;
}

.info-item .label {
    color: #6b7280;
    min-width: 60px;
}

.info-item .value {
    color: #374151;
}

.info-item .value.amount {
    color: #374151;
    font-weight: 600;
}

.info-item .value.profit {
    color: #059669;
    font-weight: 600;
}

.info-item .value.loss {
    color: #dc2626;
    font-weight: 600;
}

.record-summary {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.record-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    font-size: 0.875rem;
}

.record-status {
    display: flex;
    align-items: center;
    gap: 4px;
}

.record-status.pending {
    color: #d97706;
}

.record-status.completed {
    color: #059669;
}

.record-status.cancelled {
    color: #6b7280;
}

.record-status.failed {
    color: #dc2626;
}

.status-icon {
    font-size: 1rem;
}

.record-time {
    color: #6b7280;
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

    .records-grid {
        grid-template-columns: 1fr;
    }

    .records-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
        margin: 0 16px;
    }

    /* 移动端按照分析报告样式精确调整 */
    .record-card .record-info {
        margin-bottom: 8px;
    }

    .record-card .info-item {
        display: flex;
        margin-bottom: 4px;
        font-size: 0.7rem;
    }

    .record-card .info-item .label {
        color: #6b7280;
        min-width: 60px;
    }

    .record-card .info-item .value {
        color: #374151;
    }

    .record-card .info-item .value.amount {
        color: #374151;
        font-weight: 600;
    }

    .record-card .info-item .value.profit {
        color: #059669;
        font-weight: 600;
    }

    .record-card .info-item .value.loss {
        color: #dc2626;
        font-weight: 600;
    }

    .record-card .record-summary {
        font-size: 0.7rem;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
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

    .records-stats {
        margin: 12px 16px;
        padding: 0;
        background: transparent;
        border: none;
        box-shadow: none;
        display: flex;
        flex-direction: row;
        overflow-x: auto;
        gap: 6px;
        -webkit-overflow-scrolling: touch;
        grid-template-columns: none;
    }

    .stat-item {
        flex: 0 0 auto;
        min-width: 72px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 6px 8px;
        text-align: center;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .stat-label {
        font-size: 9px;
        color: #6b7280;
        margin-bottom: 1px;
        white-space: nowrap;
        line-height: 1.2;
    }

    .stat-value {
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        white-space: nowrap;
        line-height: 1.2;
    }

    .stat-value.profit {
        color: #059669;
    }

    .stat-value.loss {
        color: #dc2626;
    }


    .filters-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .filter-label {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
    }

    .filter-select,
    .filter-date,
    .filter-search {
        width: 100%;
    }

    /* 移动端原生控件样式 */
    .mobile-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f8fafc;
        color: #374151;
        font-size: 0.8rem;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 8px center;
        background-repeat: no-repeat;
        background-size: 16px;
        padding-right: 32px;
    }

    .mobile-date-range {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    .mobile-date-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f8fafc;
        color: #374151;
        font-size: 0.8rem;
    }

    .date-separator {
        color: #9ca3af;
        font-size: 0.75rem;
        flex-shrink: 0;
    }

    /* 移动端重置按钮样式 */
    .filter-group .pc-filter-btn {
        width: 100%;
        padding: 8px 16px;
        font-size: 0.875rem;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        margin-top: 4px;
    }

    .records-list {
        padding: 0 16px;
        margin: 16px 0 0 0;
    }

    .records-grid {
        gap: 12px;
    }

    .record-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }

    /* 480px以下移动端按照分析报告样式精确调整 */
    .record-card .record-info {
        margin-bottom: 8px;
    }

    .record-card .info-item {
        display: flex;
        margin-bottom: 4px;
        font-size: 0.7rem;
    }

    .record-card .info-item .label {
        color: #6b7280;
        min-width: 60px;
    }

    .record-card .info-item .value {
        color: #374151;
    }

    .record-card .info-item .value.amount {
        color: #374151;
        font-weight: 600;
    }

    .record-card .info-item .value.profit {
        color: #059669;
        font-weight: 600;
    }

    .record-card .info-item .value.loss {
        color: #dc2626;
        font-weight: 600;
    }

    .record-card .record-summary {
        font-size: 0.7rem;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .records-pagination {
        margin: 0 16px;
        padding-top: 12px;
    }

    .empty-state {
        margin: 0 16px;
        padding: 24px 16px;
        height: 200px;
    }
}
</style>
