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
                    <el-button type="primary" @click="resetFilters" class="pc-filter-btn">
                        重置
                    </el-button>
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
                        <h4 class="record-title">{{ record.name }}({{ record.code }})</h4>
                        <div class="record-info">
                            <div class="info-item">
                                <span class="label">委托数量：</span>
                                <span class="value">{{ record.quantity }}股</span>
                            </div>
                            <div class="info-item">
                                <span class="label">委托价格：</span>
                                <span class="value">¥{{ parseFloat(record.price).toFixed(2) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">交易金额：</span>
                                <span class="value amount">¥{{ (record.quantity * record.price).toFixed(2) }}</span>
                            </div>
                            <div v-if="record.profit !== undefined" class="info-item">
                                <span class="label">盈亏：</span>
                                <span class="value" :class="{ 'profit': record.profit > 0, 'loss': record.profit < 0 }">
                                    {{ record.profit > 0 ? '+' : '' }}¥{{ parseFloat(record.profit).toFixed(2) }}
                                </span>
                            </div>
                            <div v-if="record.status === 'pending' && record.expireTime" class="info-item">
                                <span class="label">委托时效：</span>
                                <span class="value" :class="getValidityStatusClass(record.expireTime)">
                                    {{ formatValidityDate(record.expireTime) }}
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
                        <div class="record-actions-footer">
                            <div class="record-time">
                                <div v-if="record.status === 'cancelled' && record.cancelledAt">
                                    撤销时间：{{ formatTime(record.cancelledAt) }}
                                </div>
                                <div v-else>
                                    {{ formatTime(record.createdAt) }}
                                </div>
                            </div>
                            <el-button v-if="record.status === 'pending'" type="danger" size="small" plain
                                @click.stop="handleCancelOrder(record)" class="cancel-order-btn">
                                撤销委托
                            </el-button>
                        </div>
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

        <!-- 交易详情弹窗 -->
        <TradingRecordDetailModal v-model:visible="detailModalVisible" :record="selectedRecord" record-type="ai"
            @cancel-record="handleCancelRecord" />
    </div>
</template>

<script setup>
import { aiTradeRecord, cancelStockOrder, getStockPlan } from '@/api/api.js';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { Search, More, CircleCheck, Clock, CircleClose, Warning } from '@element-plus/icons-vue';
import TradingRecordDetailModal from './TradingRecordDetailModal.vue';

// 定义emit事件
const emit = defineEmits(['data-loaded']);

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
const pageSize = ref(12);

// 移动端日期范围
const startDate = ref('');
const endDate = ref('');

// 详情弹窗相关
const detailModalVisible = ref(false);
const selectedRecord = ref(null);

// 时间更新相关
const currentTime = ref(new Date());
let timeUpdateInterval = null;

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
const allRecords = ref([]);

// 获取数据的方法
const fetchData = async () => {
    const params = {};
    params.startDate = filterDateRange.value ? filterDateRange.value[0] : null;
    params.endDate = filterDateRange.value ? filterDateRange.value[1] : null;
    params.key = filterKeyword.value;

    try {
        const res = await aiTradeRecord(params);
        if (res.data.success) {
            allRecords.value = res.data.data;
            console.log('获取到的AI交易记录原始数据:', res.data.data);
            allRecords.value.forEach(record => {
                record.cancelledAt = record.cancelTime;
                record.executedAt = record.tradeTime;
                record.validityDate = record.expireTime;
                record.fee = record.serviceFee || 0;
                record.type == 1 ? record.type = 'buy' : record.type = 'sell';
                if (record.status == 1) record.status = 'pending';
                else if (record.status == 3) record.status = 'completed';
                else if (record.status == 4) record.status = 'cancelled';
                // 确保有createdAt字段，如果没有则使用createTime
                if (!record.createdAt && record.createTime) {
                    record.createdAt = record.createTime;
                }

                // 处理量化策略数据：如果API返回了字符串格式的factors，需要解析
                if (record.factors && typeof record.factors === 'string') {
                    try {
                        record.factors = JSON.parse(record.factors);
                    } catch (error) {
                        console.warn('解析factors数据失败:', error);
                        record.factors = [];
                    }
                }

                // 如果没有量化策略数据，尝试从API获取（异步加载）
                if (!record.strategy || !record.factors || record.factors.length === 0 || !record.riskLevel) {
                    loadQuantStrategyForRecord(record);
                }
            });
            console.log('处理后的AI交易记录:', allRecords.value);
        }
    } catch (error) {
        console.error('获取AI交易记录失败:', error);
    }
};

// 为记录加载量化策略信息
const loadQuantStrategyForRecord = async (record) => {
    if (!record.code) {
        console.warn('记录缺少股票代码，无法获取量化策略:', record);
        return;
    }

    try {
        console.log('📊 AITradingRecords - 为记录加载量化策略:', record.code);
        const res = await getStockPlan(record.code);

        if (res.data.success && res.data.data) {
            const planData = res.data.data;

            // 解析factors数据
            if (planData.factors && typeof planData.factors === 'string') {
                try {
                    planData.factors = JSON.parse(planData.factors);
                } catch (error) {
                    console.warn('解析factors数据失败:', error);
                    planData.factors = [];
                }
            }

            // 更新记录的量化策略信息
            if (planData.strategy && !record.strategy) {
                record.strategy = planData.strategy;
            }

            if (planData.factors && planData.factors.length > 0 && (!record.factors || record.factors.length === 0)) {
                record.factors = planData.factors;
            }

            if (planData.riskLevel && !record.riskLevel) {
                record.riskLevel = planData.riskLevel;
            }

            console.log('✅ AITradingRecords - 量化策略加载成功:', {
                code: record.code,
                hasStrategy: !!record.strategy,
                factorsCount: record.factors?.length || 0,
                riskLevel: record.riskLevel
            });
        } else {
            console.warn('⚠️ AITradingRecords - API返回数据为空:', record.code);
        }
    } catch (error) {
        console.error('❌ AITradingRecords - 获取量化策略失败:', record.code, error);
    }
};

// 刷新数据的方法
const refreshData = async () => {
    await fetchData();
};

onMounted(async () => {
    await fetchData();

    // 启动时间更新定时器，每分钟更新一次
    timeUpdateInterval = setInterval(() => {
        currentTime.value = new Date();
    }, 60000);
});

onUnmounted(() => {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }
});


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
            record.name.toLowerCase().includes(keyword) ||
            record.code.toLowerCase().includes(keyword)
        );
    }

    // 按创建时间倒序排列
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// 监听筛选结果变化，实时更新badge数量
watch(filteredRecords, (newFilteredRecords) => {
    emit('data-loaded', newFilteredRecords.length);
}, { immediate: true });

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
        'completed': '已完成',
        'cancelled': '已取消',
        'failed': '失败'
    };
    return statusMap[status] || status;
};

// 获取状态样式类
const getStatusClass = (status) => {
    const classMap = {
        'pending': 'pending',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'failed': 'failed'
    };
    return classMap[status] || '';
};

// 格式化时间 - 使用响应式时间基准
const formatTime = computed(() => {
    return (dateString) => {
        if (!dateString) return '';

        // 触发响应式更新
        currentTime.value;

        const date = new Date(dateString);
        const now = new Date();

        // 设置时间到当天的开始，用于准确计算天数差
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const diffTime = today - recordDate;
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
            return diffDays + '天前 ' + date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };
});

// 格式化有效期显示
const formatValidityDate = (validityDate) => {
    if (!validityDate) return '长期有效';

    const validity = new Date(validityDate);
    const now = new Date();
    const diffTime = validity - now;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffTime < 0) {
        return '已过期';
    } else if (diffHours < 1) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}分钟后过期`;
    } else if (diffHours < 24) {
        return `${diffHours}小时后过期`;
    } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}天后过期`;
    }
};

// 获取有效期状态样式类
const getValidityStatusClass = (validityDate) => {
    if (!validityDate) return '';

    const validity = new Date(validityDate);
    const now = new Date();
    const diffTime = validity - now;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffTime < 0) {
        return 'expired';
    } else if (diffHours <= 2) {
        return 'expiring-soon';
    } else {
        return 'valid';
    }
};

// 查看记录详情
const viewRecord = (record) => {
    selectedRecord.value = record;
    detailModalVisible.value = true;
};

// 处理记录操作
const handleRecordAction = async (command, record) => {
    switch (command) {
        case 'view':
            viewRecord(record);
            break;
        case 'cancel':
            await handleCancelOrder(record);
            break;
    }
};

// 撤单操作
const cancelOrder = async (tradeId) => {
    console.log('开始撤销AI委托交易，ID:', tradeId, '类型:', typeof tradeId);

    try {
        // 使用通用的股票订单撤销接口
        console.log('调用cancelStockOrder API...');
        const res = await cancelStockOrder({ stockOrderId: tradeId });
        console.log('cancelStockOrder API响应:', res);

        if (res && res.data && res.data.success) {
            ElMessage.success('撤单成功');
            console.log('撤单成功，开始刷新数据...');
            // 重新获取数据
            await refreshData();
        } else {
            console.error('撤单失败，API响应:', res);
            ElMessage.error('撤单失败');
        }
    } catch (error) {
        console.error('撤销AI委托交易失败:', error);
        ElMessage.error('撤单失败: ' + error.message);
    }
};

// 处理撤销委托按钮点击
const handleCancelOrder = async (record) => {
    console.log('点击撤销委托按钮，记录:', record);

    try {
        await ElMessageBox.confirm(
            `确定要撤销这笔委托吗？`,
            '撤销委托确认',
            {
                confirmButtonText: '确定撤销',
                cancelButtonText: '取消',
                type: 'warning',
                dangerouslyUseHTMLString: false
            }
        );

        console.log('用户确认撤销，开始执行撤销操作...');
        await cancelOrder(record.stockOrderId);
    } catch (error) {
        // 用户取消操作
        console.log('用户取消撤销操作或撤销失败:', error);
    }
};

// 处理详情弹窗中的取消记录操作
const handleCancelRecord = (record) => {
    handleCancelOrder(record);
    detailModalVisible.value = false;
};

// 分页处理
const handlePageChange = (page) => {
    currentPage.value = page;
};

// 监听筛选条件变化，重置分页
watch([filterType, filterStatus, filterDateRange, filterKeyword], () => {
    currentPage.value = 1;
});

// 暴露数据给父组件
defineExpose({
    allRecords,
    filteredRecords
});
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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
        margin: 0.25rem 1rem !important;
        padding: 0.5rem !important;
        background: rgba(248, 250, 252, 0.8) !important;
        border: 1px solid rgba(226, 232, 240, 0.6) !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        flex-direction: row !important;
        overflow-x: auto !important;
        gap: 0.25rem !important;
        -webkit-overflow-scrolling: touch !important;
        grid-template-columns: none !important;
    }

    .stat-item {
        flex: 0 0 auto !important;
        min-width: 4.5rem !important;
        min-height: 1.2rem !important;
        background: rgba(255, 255, 255, 0.95) !important;
        border: 1px solid rgba(229, 231, 235, 0.8) !important;
        border-radius: 0.25rem !important;
        padding: 0.15rem 0.3rem !important;
        text-align: left !important;
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: center !important;
    }

    .stat-label {
        font-size: 0.6rem !important;
        color: #6b7280 !important;
        margin-bottom: 0 !important;
        white-space: nowrap !important;
        line-height: 1.0 !important;
        font-weight: 500 !important;
        flex-shrink: 0 !important;
    }

    .stat-value {
        font-size: 0.7rem !important;
        font-weight: 600 !important;
        color: #374151 !important;
        white-space: nowrap !important;
        line-height: 1.0 !important;
        text-align: right !important;
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

/* 委托时效状态样式 */
.value.valid {
    color: #16a34a;
}

.value.expiring-soon {
    color: #d97706;
    font-weight: 600;
}

.value.expired {
    color: #dc2626;
    font-weight: 600;
}

/* 记录卡片底部操作区域样式 */
.record-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    border-radius: 0 0 8px 8px;
}

.record-actions-footer {
    display: flex;
    align-items: center;
    gap: 12px;
}

.record-time {
    font-size: 0.75rem;
    color: #6b7280;
}

.cancel-order-btn {
    font-size: 0.75rem;
    padding: 4px 8px;
    height: 28px;
    border-radius: 4px;
    border: 1px solid #ef4444;
    color: #ef4444;
    background: transparent;
    transition: all 0.2s ease;
}

.cancel-order-btn:hover {
    background: #ef4444;
    color: white;
}

.cancel-order-btn:active {
    transform: scale(0.95);
}

/* 移动端撤销按钮样式调整 */
@media (max-width: 480px) {
    .cancel-order-btn {
        font-size: 0.6rem;
        padding: 2px 6px;
        height: 24px;
    }

    .record-actions-footer {
        gap: 8px;
    }

    .record-time {
        font-size: 0.65rem;
    }
}
</style>
