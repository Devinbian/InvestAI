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
                <div v-for="stock in userStore.watchlist" :key="stock.code" class="stock-item"
                    @click="analyzeStock(stock)">
                    <div class="stock-info">
                        <div class="stock-header">
                            <div class="stock-name-code">
                                <div class="name-code-row">
                                    <span class="stock-name">{{ stock.name }}</span>
                                    <span class="stock-code">({{ stock.code }})</span>
                                </div>
                                <!-- 自选股状态 -->
                                <div class="watchlist-status">
                                    <span class="status-label">关注：</span>
                                    <span class="status-value">{{ formatAddedTime(stock.addedAt) }}</span>
                                </div>
                            </div>
                            <div class="stock-price-change">
                                <div class="current-price">¥{{ getCurrentPrice(stock) }}</div>
                                <div class="price-change" :class="getPriceChangeClass(stock)">
                                    {{ getPriceChangeText(stock) }}
                                </div>
                            </div>
                        </div>

                        <div class="stock-details">
                            <div class="detail-row">
                                <span class="detail-label">当前价格：</span>
                                <span class="detail-value target-price">¥{{ getCurrentPrice(stock) }}</span>
                                <span class="detail-label">涨跌幅：</span>
                                <span class="detail-value" :class="getPriceChangeClass(stock)">{{
                                    getPriceChangeText(stock) }}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">所属行业：</span>
                                <span class="detail-value industry">{{ stock.industry || '未分类' }}</span>
                                <span class="detail-label">推荐等级：</span>
                                <span class="detail-value recommend-level">{{ stock.recommendLevel || '中性' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="stock-actions">
                        <el-button size="small" text @click.stop="removeFromWatchlist(stock.code)"
                            class="remove-watchlist-btn">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                    fill="currentColor" />
                            </svg>
                            移除关注
                        </el-button>
                        <el-button size="small" @click.stop="showPaidAnalysisDialog(stock)" class="paid-analysis-btn">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            深度分析
                            <span class="price-tag">¥1</span>
                        </el-button>
                        <el-button size="small" @click.stop="showQuantAnalysisDialog(stock)" class="quant-analysis-btn">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                    fill="none" />
                            </svg>
                            量化分析
                            <span class="price-tag">¥1</span>
                        </el-button>

                        <el-button size="small" @click.stop="showBuyDialog(stock)" class="buy-stock-btn-secondary">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            买入
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
const emit = defineEmits(['send-to-chat', 'show-buy-dialog']);

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
    let change = stock.change || 0;

    // 如果change是字符串，解析数字
    if (typeof change === 'string') {
        change = parseFloat(change.replace(/[+%]/g, '')) || 0;
    }

    return {
        'positive': change > 0,
        'negative': change < 0,
        'neutral': change === 0
    };
};

// 获取价格变化文本
const getPriceChangeText = (stock) => {
    // 处理字符串格式的change和changePercent
    let change = stock.change || 0;
    let changePercent = stock.changePercent || 0;

    // 如果是字符串，直接返回
    if (typeof change === 'string' && typeof changePercent === 'string') {
        return `${change} (${changePercent})`;
    }

    // 如果是数字，格式化显示
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

// 买入股票 - 调用买入对话框
const showBuyDialog = (stock) => {
    emit('show-buy-dialog', stock);
};

// 付费深度分析
const showPaidAnalysisDialog = (stock) => {
    // 检查余额是否足够
    if (userStore.balance < 1) {
        ElMessage.warning('余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `深度分析 ${stock.name}(${stock.code}) 需要支付 ¥1，是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付',
            cancelButtonText: '取消',
            type: 'info',
        }
    ).then(() => {
        // 扣费
        if (userStore.deductBalance(1)) {
            ElMessage.success('支付成功，正在生成深度分析...');
            emit('send-to-chat', {
                type: 'paid-analysis',
                content: stock,
                title: `深度分析${stock.name}(${stock.code})`
            });
        } else {
            ElMessage.error('支付失败，余额不足');
        }
    }).catch(() => {
        // 用户取消
    });
};

// 付费量化分析
const showQuantAnalysisDialog = (stock) => {
    // 检查余额是否足够
    if (userStore.balance < 1) {
        ElMessage.warning('余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `量化分析 ${stock.name}(${stock.code}) 需要支付 ¥1，是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付',
            cancelButtonText: '取消',
            type: 'info',
        }
    ).then(() => {
        // 扣费
        if (userStore.deductBalance(1)) {
            ElMessage.success('支付成功，正在生成量化分析...');
            emit('send-to-chat', {
                type: 'quant-analysis',
                content: stock,
                title: `量化分析${stock.name}(${stock.code})`
            });
        } else {
            ElMessage.error('支付失败，余额不足');
        }
    }).catch(() => {
        // 用户取消
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
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    flex: 1;
    overflow-y: auto;
}

.stock-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.stock-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.stock-info {
    flex: 1;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.stock-name-code {
    flex: 1;
}

.name-code-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.stock-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    font-size: 0.875rem;
    color: #64748b;
}

.watchlist-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
}

.status-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
}

.status-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #8b5cf6;
}

.stock-price-change {
    display: flex;
    align-items: center;
    gap: 8px;
}

.current-price {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
}

.price-change {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
}

.price-change.positive {
    color: #059669;
    background: #d1fae5;
}

.price-change.negative {
    color: #dc2626;
    background: #fee2e2;
}

.price-change.neutral {
    color: #6b7280;
    background: #f3f4f6;
}

.stock-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.detail-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
    min-width: 60px;
}

.detail-value {
    font-size: 0.875rem;
    font-weight: 600;
}

.target-price {
    color: #0ea5e9;
}

.industry {
    color: #8b5cf6;
}

.recommend-level {
    color: #059669;
}

.stock-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
    flex-wrap: nowrap;
    align-items: center;
}

.buy-stock-btn-secondary {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #f59e0b;
    white-space: nowrap;
    flex-shrink: 0;
}

.buy-stock-btn-secondary:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #d97706;
    transform: translateY(-1px);
}

/* 付费功能按钮样式 */
.paid-analysis-btn,
.quant-analysis-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    position: relative;
    white-space: nowrap;
    flex-shrink: 0;
}

.paid-analysis-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #374151;
}

.paid-analysis-btn:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #1f2937;
    transform: translateY(-1px);
}

.quant-analysis-btn {
    background: #fef3c7;
    border-color: #fbbf24;
    color: #92400e;
}

.quant-analysis-btn:hover {
    background: #fde68a;
    border-color: #f59e0b;
    color: #78350f;
    transform: translateY(-1px);
}

.price-tag {
    background: #ef4444;
    color: white;
    font-size: 0.55rem;
    font-weight: 600;
    padding: 1px 2px;
    border-radius: 2px;
    margin-left: 1px;
    line-height: 1;
    min-width: 14px;
    text-align: center;
}

.remove-watchlist-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    background: #10b981;
    border-color: #10b981;
    color: white;
    white-space: nowrap;
    flex-shrink: 0;
}

.remove-watchlist-btn:hover {
    background: #059669;
    border-color: #059669;
    transform: translateY(-1px);
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
