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
                <StockList v-if="!isMobileView" :stocks="watchlistStocks" v-bind="getStockListConfig('watchlist')"
                    @stock-click="handleStockClick" @action-click="handleActionClick" />

                <!-- 移动端使用MobileStockList -->
                <MobileStockList v-else :stocks="watchlistStocks" :actions="getStockListConfig('watchlist').actions"
                    :show-details="true" :clickable="true" @stock-click="handleStockClick"
                    @action-click="handleActionClick" />
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

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog']);

const userStore = useUserStore();

// 移动端检测
const isMobileView = ref(false);

const checkMobileView = () => {
    isMobileView.value = window.innerWidth <= 768;
};

// 处理自选股数据，添加实时价格信息
const watchlistStocks = computed(() => {
    return userStore.watchlist.map(stock => {
        const currentPrice = getCurrentPrice(stock);
        const priceChangeData = getPriceChangeData(stock);

        // 生成或使用现有的目标价格
        const targetPrice = stock.targetPrice || generateTargetPrice(currentPrice);

        return {
            ...stock,
            price: currentPrice,
            change: priceChangeData.change,
            changePercent: priceChangeData.changePercent,
            // 确保包含必要的显示字段，与推荐股票保持一致
            industry: stock.industry || '未分类',
            recommendLevel: stock.recommendLevel || '中性',
            // 添加推荐相关字段以保持样式一致
            targetPrice: targetPrice,
            expectedReturn: stock.expectedReturn || generateExpectedReturn(currentPrice, targetPrice),
            riskLevel: stock.riskLevel || mapRecommendLevelToRisk(stock.recommendLevel || '中性')
        };
    });
});

// 股票点击事件处理
const handleStockClick = (stock) => {
    analyzeStock(stock);
};

// 股票操作按钮点击事件处理
const handleActionClick = ({ action, stock }) => {
    console.log('执行操作:', action, stock);

    switch (action) {
        case 'removeWatchlist':
            removeFromWatchlist(stock.code);
            break;
        case 'analysis':
            showPaidAnalysisDialog(stock);
            break;
        case 'aiTrading':
            showQuantAnalysisDialog(stock);
            break;
        case 'buy':
            showBuyDialog(stock);
            break;
        default:
            console.log('未知操作:', action);
    }
};

// 模拟获取当前价格（实际应该从API获取）
const getCurrentPrice = (stock) => {
    // 模拟价格波动
    const basePrice = parseFloat(stock.price);
    const fluctuation = (Math.random() - 0.5) * 2; // -1% 到 +1% 的波动
    const currentPrice = basePrice * (1 + fluctuation / 100);
    return currentPrice.toFixed(2);
};

// 获取价格变化数据
const getPriceChangeData = (stock) => {
    // 如果已经有变化数据，直接返回
    if (stock.change !== undefined && stock.changePercent !== undefined) {
        return {
            change: stock.change,
            changePercent: stock.changePercent
        };
    }

    // 模拟价格变化数据
    const currentPrice = parseFloat(getCurrentPrice(stock));
    const basePrice = parseFloat(stock.price);
    const change = currentPrice - basePrice;
    const changePercent = ((change / basePrice) * 100).toFixed(2);

    return {
        change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
        changePercent: parseFloat(changePercent) >= 0 ? `+${changePercent}%` : `${changePercent}%`
    };
};

// 生成目标价格（基于当前价格的合理估算）
const generateTargetPrice = (currentPrice) => {
    const price = parseFloat(currentPrice);
    const targetMultiplier = 1.1 + (Math.random() * 0.3); // 1.1-1.4倍
    return (price * targetMultiplier).toFixed(2);
};

// 生成预期收益
const generateExpectedReturn = (currentPrice, targetPrice) => {
    const current = parseFloat(currentPrice);
    const target = parseFloat(targetPrice);
    const returnPercent = ((target - current) / current * 100).toFixed(1);
    return `+${returnPercent}%`;
};

// 将推荐等级映射到风险等级
const mapRecommendLevelToRisk = (recommendLevel) => {
    const riskMap = {
        '强烈推荐': '较低',
        '推荐': '中等',
        '中性': '中等',
        '谨慎': '较高',
        '不推荐': '高'
    };
    return riskMap[recommendLevel] || '中等';
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
        content: {
            ...stock,
            recommendIndexDesc: `推荐指数说明：
5.0：强烈推荐 - 投资价值极高
4.0-4.9：推荐 - 具备较好投资价值
3.0-3.9：中性 - 可持续观察
2.0-2.9：谨慎 - 建议控制仓位
1.0-1.9：不推荐 - 建议回避`
        },
        title: `${stock.name}(${stock.code})股票分析`
    });
};

// 买入股票 - 调用买入对话框
const showBuyDialog = (stock) => {
    emit('show-buy-dialog', stock);
};

// 付费量化分析
const showPaidAnalysisDialog = (stock) => {
    // 检查余额是否足够
    if (userStore.balance < 1) {
        ElMessage.warning('余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `量化分析 ${stock.name}(${stock.code}) 促销价仅需 1智点（原价3智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 1智点',
            cancelButtonText: '取消',
            type: 'info',
        }
    ).then(() => {
        // 扣费（扣除1智点）
        if (userStore.deductBalance(1)) {
            ElMessage.success('支付成功，正在生成量化分析...');
            emit('send-to-chat', {
                type: 'paid-analysis',
                content: stock,
                title: `量化分析${stock.name}(${stock.code})`
            });
        } else {
            ElMessage.error('支付失败，智点余额不足');
        }
    }).catch(() => {
        // 用户取消
    });
};

// 付费AI委托交易 - 发送到主界面处理
const showQuantAnalysisDialog = (stock) => {
    emit('send-to-chat', {
        type: 'show-ai-trading-dialog',
        content: stock,
        title: `AI委托交易设置 ${stock.name}(${stock.code})`
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

// 生命周期
onMounted(() => {
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobileView);
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

/* 响应式设计 */
@media (max-width: 768px) {
    .watchlist-container {
        padding: 8px;
    }

    .header-section {
        padding: 12px;
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
    }

    .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .header-title {
        font-size: 1rem;
    }

    .header-subtitle {
        font-size: 0.8rem;
    }

    .header-right {
        justify-content: flex-start;
    }

    .filter-buttons {
        gap: 4px;
    }

    .filter-btn {
        font-size: 0.7rem;
        padding: 4px 8px;
    }

    .watchlist-list {
        padding: 8px;
        gap: 8px;
    }
}

.card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f5f5f5;
    text-align: center;
    flex-shrink: 0;
}
</style>
