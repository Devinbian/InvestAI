<template>
    <div class="smart-points-records">
        <!-- 筛选器 -->
        <div class="records-filters">
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">记录类型</label>
                    <el-select v-model="filterType" placeholder="记录类型" clearable size="small" class="filter-select">
                        <el-option label="全部类型" value="" />
                        <el-option label="消费" value="consumption" />
                        <el-option label="充值" value="recharge" />
                    </el-select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">时间范围</label>
                    <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" size="small" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" class="filter-date" />
                </div>
                <div class="filter-group">
                    <label class="filter-label">关键词搜索</label>
                    <el-input v-model="filterKeyword" placeholder="搜索描述信息" size="small" clearable class="filter-search">
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
                <div class="record-icon">
                    <svg v-if="record.type === 'consumption'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#ef4444"
                            stroke-width="2" />
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#10b981"
                            stroke-width="2" />
                    </svg>
                </div>
                <div class="record-content">
                    <div class="record-title">{{ record.description }}</div>
                    <div class="record-time">{{ formatTime(record.createdAt) }}</div>
                </div>
                <div class="record-amount"
                    :class="{ 'consume': record.type === 'consumption', 'recharge': record.type === 'recharge' }">
                    {{ record.type === 'consumption' ? '-' : '+' }}{{ record.amount }} 智点
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
                    <circle cx="12" cy="12" r="10" stroke="#d1d5db" stroke-width="2" />
                    <path d="M16 8l-4 4-4-4" stroke="#d1d5db" stroke-width="2" fill="none" />
                </svg>
            </div>
            <div class="empty-text">
                <h3>{{ allRecords.length === 0 ? '暂无智点记录' : '暂无符合条件的记录' }}</h3>
                <p>{{ allRecords.length === 0 ? '您的智点消费和充值记录将在这里显示' : '请尝试调整筛选条件' }}</p>
            </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="filteredRecords.length > 0" class="records-stats">
            <div class="stat-item">
                <div class="stat-label">总消费</div>
                <div class="stat-value consume">{{ filteredTotalConsume }} 智点</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">总充值</div>
                <div class="stat-value recharge">{{ filteredTotalRecharge }} 智点</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">净消费</div>
                <div class="stat-value">{{ filteredNetConsume }} 智点</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">记录数</div>
                <div class="stat-value">{{ filteredRecords.length }}</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../store/user';
import { Search } from '@element-plus/icons-vue';

const userStore = useUserStore();

// 响应式数据
const filterType = ref('');
const filterDateRange = ref('');
const filterKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

// 获取智点记录
const allRecords = computed(() => userStore.smartPointsTransactions || []);

// 筛选后的记录
const filteredRecords = computed(() => {
    let filtered = allRecords.value;

    // 按类型筛选
    if (filterType.value) {
        filtered = filtered.filter(record => record.type === filterType.value);
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
            record.description.toLowerCase().includes(keyword)
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

// 计算筛选后的总消费
const filteredTotalConsume = computed(() => {
    return filteredRecords.value
        .filter(record => record.type === 'consumption')
        .reduce((total, record) => total + record.amount, 0);
});

// 计算筛选后的总充值
const filteredTotalRecharge = computed(() => {
    return filteredRecords.value
        .filter(record => record.type === 'recharge')
        .reduce((total, record) => total + record.amount, 0);
});

// 计算筛选后的净消费
const filteredNetConsume = computed(() => filteredTotalConsume.value - filteredTotalRecharge.value);

// 重置筛选条件
const resetFilters = () => {
    filterType.value = '';
    filterDateRange.value = '';
    filterKeyword.value = '';
    currentPage.value = 1;
};

// 格式化时间
const formatTime = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('zh-CN', {
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
            day: '2-digit'
        });
    }
};
</script>

<style scoped>
.smart-points-records {
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
    width: 140px;
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
    gap: 12px;
    margin-bottom: 16px;
}

.record-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
}

.record-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.record-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.record-content {
    flex: 1;
    min-width: 0;
}

.record-title {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
}

.record-time {
    font-size: 12px;
    color: #64748b;
}

.record-amount {
    font-size: 14px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    white-space: nowrap;
}

.record-amount.consume {
    color: #dc2626;
    background: #fee2e2;
}

.record-amount.recharge {
    color: #059669;
    background: #d1fae5;
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

.stat-value.consume {
    color: #dc2626;
}

.stat-value.recharge {
    color: #059669;
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
    .smart-points-records {
        padding: 16px;
    }

    .filters-row {
        padding: 16px;
        gap: 12px;
    }

    .record-item {
        padding: 12px;
        gap: 12px;
    }

    .record-icon {
        width: 36px;
        height: 36px;
    }

    .record-title {
        font-size: 13px;
    }

    .record-amount {
        font-size: 13px;
        padding: 4px 8px;
    }

    .records-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 16px;
    }

    .stat-value {
        font-size: 14px;
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
        grid-template-columns: 1fr;
        gap: 8px;
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
