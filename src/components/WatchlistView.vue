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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                </div>
                <div class="empty-title">暂无自选股</div>
                <div class="empty-desc">在聊天中分析股票时可以添加到自选股</div>
            </div>

            <!-- 自选股列表 -->
            <div v-else class="watchlist-list">
                <div v-for="stock in userStore.watchlist" :key="stock.code" class="watchlist-item"
                    @click="analyzeStock(stock)">
                    <div class="stock-main-info">
                        <div class="stock-basic">
                            <div class="stock-name">{{ stock.name }}</div>
                            <div class="stock-code">{{ stock.code }}</div>
                        </div>
                        <div class="stock-price-info">
                            <div class="current-price">¥{{ getCurrentPrice(stock) }}</div>
                            <div class="price-change" :class="getPriceChangeClass(stock)">
                                {{ getPriceChangeText(stock) }}
                            </div>
                        </div>
                    </div>

                    <div class="stock-details">
                        <div class="stock-industry">{{ stock.industry }}</div>
                        <div class="added-time">{{ formatAddedTime(stock.addedAt) }}</div>
                    </div>

                    <div class="stock-actions">
                        <el-button size="small" text @click.stop="analyzeStock(stock)" class="analyze-btn">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            分析
                        </el-button>
                        <el-button size="small" text @click.stop="removeFromWatchlist(stock.code)" class="remove-btn">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                            移除
                        </el-button>
                    </div>
                </div>
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
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const userStore = useUserStore();

// 模拟获取当前价格（实际应该从API获取）
const getCurrentPrice = (stock) => {
    // 模拟价格波动
    const basePrice = parseFloat(stock.price);
    const fluctuation = (Math.random() - 0.5) * 2; // -1% 到 +1% 的波动
    const currentPrice = basePrice * (1 + fluctuation / 100);
    return currentPrice.toFixed(2);
};

// 获取价格变化样式类
const getPriceChangeClass = (stock) => {
    const change = stock.change || 0;
    return {
        'positive': change > 0,
        'negative': change < 0,
        'neutral': change === 0
    };
};

// 获取价格变化文本
const getPriceChangeText = (stock) => {
    const change = stock.change || 0;
    const changePercent = stock.changePercent || 0;
    const changeText = change > 0 ? `+${change}` : change.toString();
    const percentText = changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
    return `${changeText} (${percentText})`;
};

// 格式化添加时间
const formatAddedTime = (addedAt) => {
    const date = new Date(addedAt);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return '今天添加';
    } else if (diffDays === 1) {
        return '昨天添加';
    } else if (diffDays < 7) {
        return `${diffDays}天前添加`;
    } else {
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }
};

// 分析股票
const analyzeStock = (stock) => {
    emit('send-to-chat', {
        type: 'stock',
        content: stock,
        title: `${stock.name}(${stock.code})股票分析`
    });
};

// 从自选股中移除
const removeFromWatchlist = async (stockCode) => {
    try {
        await ElMessageBox.confirm(
            '确定要从自选股中移除这只股票吗？',
            '确认移除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        if (userStore.removeFromWatchlist(stockCode)) {
            ElMessage.success('已从自选股中移除');
        }
    } catch {
        // 用户取消操作
    }
};

// 清空所有自选股
const clearAllWatchlist = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要清空所有自选股吗？此操作不可恢复。',
            '确认清空',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        userStore.watchlist.splice(0);
        localStorage.setItem('watchlist', JSON.stringify([]));
        ElMessage.success('已清空所有自选股');
    } catch {
        // 用户取消操作
    }
};

// 刷新自选股数据
const refreshWatchlist = () => {
    // 这里可以调用API刷新股票价格等数据
    ElMessage.success('自选股数据已刷新');
};
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
    padding: 8px 0 20px 0;
    flex: 1;
    overflow-y: auto;
}

.watchlist-item {
    padding: 16px 20px;
    border-bottom: 1px solid #f8f9fa;
    cursor: pointer;
    transition: all 0.2s;
}

.watchlist-item:hover {
    background: #f9fafb;
}

.watchlist-item:last-child {
    border-bottom: none;
}

.stock-main-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.stock-basic {
    flex: 1;
}

.stock-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
}

.stock-code {
    font-size: 0.75rem;
    color: #9ca3af;
}

.stock-price-info {
    text-align: right;
}

.current-price {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
}

.price-change {
    font-size: 0.8rem;
    font-weight: 500;
}

.price-change.positive {
    color: #ef4444;
}

.price-change.negative {
    color: #10b981;
}

.price-change.neutral {
    color: #6b7280;
}

.stock-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.stock-industry {
    font-size: 0.8rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 12px;
}

.added-time {
    font-size: 0.75rem;
    color: #9ca3af;
}

.stock-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.analyze-btn,
.remove-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    padding: 4px 8px;
    border-radius: 12px;
    transition: all 0.2s;
}

.analyze-btn {
    color: #3b82f6;
}

.analyze-btn:hover {
    background: #eff6ff;
    color: #2563eb;
}

.remove-btn {
    color: #ef4444;
}

.remove-btn:hover {
    background: #fef2f2;
    color: #dc2626;
}

.card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f5f5f5;
    text-align: center;
    flex-shrink: 0;
}

:deep(.el-button) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
}
</style>
