<template>
    <div class="watchlist-container">
        <div class="card-header">
            <h3 class="card-title">我的自选股</h3>
            <div class="header-actions">
                <el-button size="small" text @click="refreshWatchlist">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </el-button>
            </div>
        </div>

        <div class="watchlist-content">
            <!-- 空状态 -->
            <div v-if="userStore.watchlist.length === 0" class="empty-state">
                <div class="empty-icon">
                    ⭐
                </div>
                <div class="empty-title">暂无自选股</div>
                <div class="empty-desc">在聊天中分析股票时可以添加到自选股</div>
            </div>

            <!-- 自选股列表 -->
            <div v-else class="watchlist-list">
                <!-- PC端使用StockList -->
                <StockList v-if="!isMobileView" :stocks="watchlistStockList" :actions="watchlistActions"
                    :show-watchlist-status="true" :show-basic-details="true" :clickable="false"
                    :is-mobile="isMobileView" @action-click="handleActionClick" />

                <!-- 移动端使用MobileStockList -->
                <MobileStockList v-else :stocks="watchlistStockList" :actions="watchlistActions" :show-details="true"
                    :clickable="false" @action-click="handleActionClick" />
            </div>
        </div>

        <div v-if="userStore.watchlist.length > 0" class="card-footer">
            <el-button size="small" text @click="clearAllWatchlist">
                清空自选股
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';
import { getStockListConfig } from '../config/stockListConfig';
import { getStockActionConfig } from '../config/stockActionConfig';
import { useMobileDetection } from '../composables/useResponsiveBreakpoints';
import { getStockSelectList, stockUnselectAll } from '@/api/api';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'action-click']);

const userStore = useUserStore();

// 使用统一的移动端检测
const { isMobileView } = useMobileDetection();

// 自选股操作按钮配置
const watchlistActions = computed(() => {
    return getStockActionConfig('watchlist', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 4
    });
});

// 自选股列表
const watchlistStockList = ref([]);

// 自选股列表方法
const getStockSelectListRequest = async () => {
    let res = await getStockSelectList();
    if (res && res.data && res.data.success) {
        let stockList = []; 
        const data = res.data.data || [];
        data.forEach(item => {
            stockList.push({
                name: item.name,
                code: item.code,
                recommendIndex: item.recommendScore,
                recommendLevel: item.recommendLevel,
                price: item.price || item.targetPrice, // 当前价格
                price: item.latestPrice, // 当前价格
                change: item.change || 0, // 涨跌额
                changePercent: item.changePercent || 0, // 涨跌幅
                changePercent: (item.rise || 0).concat('%'), // 涨跌幅
                targetPrice: item.targetPrice,
                riskLevel: item.riskLevel,
                industry: item.industry,
                reason: item.recommendReason,
                addedAt: item.createTime,
                expectedReturn: item.expectedBenefits,  
            });
        });
        stockList.sort((a, b) => b.addedAt - a.addedAt);
        watchlistStockList.value = stockList;
        userStore.setWatchList(stockList);
    }
}

// 移除所有自选股
const stockUnselectAllRequest = async () => {
    return await stockUnselectAll();
}

// 股票操作按钮点击事件处理 - 统一转发到Main.vue处理
const handleActionClick = ({ action, stock }) => {
    console.log('WatchlistView - 转发股票操作:', action, stock);

    // 直接转发到Main.vue的统一处理逻辑
    emit('action-click', { action, stock });
};


// 清空所有自选股
const clearAllWatchlist = async () => {
    const confirm = await ElMessageBox.confirm(
        '确定要清空所有自选股吗？此操作不可恢复。',
        '确认清空',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    );
    if(confirm){
        const res = await stockUnselectAllRequest();
        if (res && res.data && res.data.success) {
            watchlistStockList.value = [];
            userStore.setWatchList([]);
            ElMessage.success('已清空所有自选股');
        }
    }  
};

// 刷新自选股数据
const refreshWatchlist = async () => {
    // 这里可以调用API刷新股票价格等数据
    await getStockSelectListRequest();
    ElMessage.success('自选股数据已刷新');
};

// 生命周期
onMounted(() => {
    // 移动端检测由useMobileDetection自动处理
    getStockSelectListRequest();
});

onUnmounted(() => {
    // 清理工作由useMobileDetection自动处理
});
</script>

<style scoped>
.watchlist-container {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    margin: 4px;
}

.card-header {
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.header-actions {
    display: flex;
    align-items: center;
}

.watchlist-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

/* 空状态样式 */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    height: 100%;
}

.empty-icon {
    margin-bottom: 16px;
    color: #d1d5db;
}

.empty-title {
    font-size: 1rem;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 8px;
}

.empty-desc {
    font-size: 0.875rem;
    color: #9ca3af;
    line-height: 1.4;
}

/* 自选股列表样式 */
.watchlist-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    flex: 1;
    overflow-y: auto;
}

/* 使用StockList组件，移除重复的股票样式 */

/* 移动端响应式样式 */
@media (max-width: 768px) {

    /* 移动端容器优化 */
    .watchlist-container {
        min-height: auto !important;
        margin: 0 !important;
        border-radius: 8px !important;
        overflow: visible !important;
    }

    /* 移动端头部优化 */
    .card-header {
        padding: 12px 16px 8px 16px !important;
        border-radius: 8px 8px 0 0 !important;
    }

    .card-title {
        font-size: 1rem !important;
    }

    .header-actions .el-button {
        padding: 4px 8px !important;
        font-size: 0.7rem !important;
    }

    /* 移动端内容区域优化 */
    .watchlist-content {
        overflow: visible !important;
        flex: none !important;
    }

    .watchlist-list {
        padding: 8px !important;
        gap: 8px !important;
        overflow: visible !important;
        flex: none !important;
    }

    /* 移动端空状态优化 */
    .empty-state {
        padding: 30px 16px !important;
        height: auto !important;
        min-height: 200px !important;
    }

    .empty-icon {
        font-size: 2.5rem !important;
        margin-bottom: 12px !important;
    }

    .empty-title {
        font-size: 0.9rem !important;
        margin-bottom: 6px !important;
    }

    .empty-desc {
        font-size: 0.8rem !important;
    }

    /* 移动端底部优化 */
    .card-footer {
        padding: 8px 16px !important;
    }

    .card-footer .el-button {
        font-size: 0.7rem !important;
        padding: 4px 8px !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .watchlist-container {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
    }

    .sidebar-container .card-header {
        display: none !important;
    }

    .sidebar-container .watchlist-content {
        padding: 0 !important;
    }

    .sidebar-container .watchlist-list {
        padding: 0 6px 12px 6px !important;
    }

    .sidebar-container .card-footer {
        padding: 8px 6px !important;
        margin-top: 8px !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        border: 1px solid #e2e8f0 !important;
    }
}

.card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f5f5f5;
    text-align: center;
    flex-shrink: 0;
}
</style>
