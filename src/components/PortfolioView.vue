<template>
    <div class="portfolio-view">
        <!-- 账户总览 -->
        <div class="account-summary">
            <div class="summary-header">
                <h3>我的资产</h3>
                <div class="refresh-btn" @click="refreshData">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                </div>
            </div>

            <div class="summary-main">
                <div class="total-assets-card">
                    <div class="asset-icon">💰</div>
                    <div class="asset-info">
                        <span class="asset-label">总资产</span>
                        <span class="asset-value">¥{{ formatNumber(totalAssets) }}</span>
                        <div class="asset-change" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path :d="totalProfitLoss >= 0 ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            {{ totalProfitLoss >= 0 ? '+' : '' }}¥{{ Math.abs(totalProfitLoss).toFixed(2) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-icon cash">💵</div>
                    <div class="card-content">
                        <span class="card-label">可用余额</span>
                        <span class="card-value">¥{{ formatNumber(userStore.balance) }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon stocks">📈</div>
                    <div class="card-content">
                        <span class="card-label">持仓市值</span>
                        <span class="card-value">¥{{ formatNumber(portfolioValue) }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon profit" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                        {{ totalProfitLoss >= 0 ? '📊' : '📉' }}
                    </div>
                    <div class="card-content">
                        <span class="card-label">今日盈亏</span>
                        <span class="card-value" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                            {{ totalProfitLoss >= 0 ? '+' : '' }}¥{{ Math.abs(totalProfitLoss).toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 持仓列表 - 使用通用StockList组件 -->
        <div class="portfolio-content">
            <!-- PC端显示空状态和股票列表 -->
            <template v-if="!isMobileView">
                <div v-if="userStore.portfolio.length === 0" class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">
                        <h4>暂无持仓</h4>
                        <p>您还没有购买任何股票<br>可以通过聊天分析股票后进行购买</p>
                    </div>
                </div>
                <StockList v-else :stocks="portfolioStocks" :actions="portfolioActions" :show-position-status="true"
                    :show-position-details="true" :show-basic-details="false" :clickable="true"
                    @stock-click="analyzeStock" @sell-stock="handleSellStock" @buy-stock="handleBuyStock"
                    @paid-analysis="handlePaidAnalysis" @ai-trading="handleAITrading" />
            </template>

            <!-- 移动端使用MobileStockList（空状态由MobileStockList组件内部处理） -->
            <MobileStockList v-else :stocks="portfolioStocks" :actions="portfolioActions" :show-position-status="true"
                :show-details="true" :clickable="true" :empty-text="'暂无持仓'"
                :empty-description="'您还没有购买任何股票，可以通过聊天分析股票后进行购买'" @stock-click="analyzeStock"
                @action-click="handleActionClick" />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';
import { getStockActionConfig } from '../config/stockActionConfig';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'show-sell-dialog']);

const userStore = useUserStore();

// 移动端检测
const isMobileView = ref(false);

const checkMobileView = () => {
    isMobileView.value = window.innerWidth <= 768;
};

// 持仓操作按钮配置
const portfolioActions = computed(() => {
    return getStockActionConfig('portfolio', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 4
    });
});

// 模拟当前价格数据
const currentPrices = {
    '000001': 12.68,
    '000858': 52.30,
    '000002': 24.15,
    '300750': 485.20,
    '600519': 1680.50,
    '000700': 15.80
};

// 计算属性
const totalAssets = computed(() => userStore.getTotalAssets());

const portfolioValue = computed(() => {
    return userStore.portfolio.reduce((total, position) => {
        const currentPrice = getCurrentPrice(position.code);
        return total + position.quantity * currentPrice;
    }, 0);
});

const totalProfitLoss = computed(() => {
    return userStore.portfolio.reduce((total, position) => {
        return total + getPositionProfitLoss(position);
    }, 0);
});

// 转换持仓数据为StockList组件需要的格式
const portfolioStocks = computed(() => {
    return userStore.portfolio.map(position => {
        const currentPrice = getCurrentPrice(position.code);
        const profitLoss = getPositionProfitLoss(position);
        const profitPercent = getPositionProfitPercent(position);

        // 根据股票代码推断行业信息
        const getIndustryByCode = (code) => {
            const industryMap = {
                '000001': '银行业',
                '000858': '食品饮料',
                '000002': '房地产',
                '300750': '医疗器械',
                '600519': '食品饮料',
                '000700': '交通运输'
            };
            return industryMap[code] || '未分类';
        };

        return {
            code: position.code,
            name: position.name,
            price: currentPrice,
            change: profitPercent,
            changeAmount: profitLoss,
            industry: position.industry || getIndustryByCode(position.code),
            // 持仓特有信息
            quantity: position.quantity,
            avgPrice: position.avgPrice,
            marketValue: position.quantity * currentPrice,
            profitLoss: profitLoss,
            profitPercent: profitPercent
        };
    });
});

// 方法
const getCurrentPrice = (stockCode) => {
    return currentPrices[stockCode] || 0;
};

const getPositionProfitLoss = (position) => {
    const currentPrice = getCurrentPrice(position.code);
    return (currentPrice - position.avgPrice) * position.quantity;
};

const getPositionProfitPercent = (position) => {
    const currentPrice = getCurrentPrice(position.code);
    return ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
};

const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('zh-CN');
};

// 事件处理方法
const analyzeStock = (stock) => {
    emit('send-to-chat', {
        type: 'stock',
        content: stock,
        title: `分析${stock.name}(${stock.code})`
    });
};

const handleSellStock = (stock) => {
    // 找到原始持仓数据
    const position = userStore.portfolio.find(p => p.code === stock.code);
    if (position) {
        const enhancedPosition = {
            ...position,
            currentPrice: getCurrentPrice(position.code),
            price: getCurrentPrice(position.code)
        };
        emit('show-sell-dialog', enhancedPosition);
    }
};

const handleBuyStock = (stock) => {
    // 找到原始持仓数据
    const position = userStore.portfolio.find(p => p.code === stock.code);
    if (position) {
        emit('show-buy-dialog', position);
    }
};

const handlePaidAnalysis = (stock) => {
    // 检查智点余额是否足够
    if (userStore.smartPointsBalance < 1) {
        ElMessage.warning('智点余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `量化分析 ${stock.name}(${stock.code}) 促销价仅需 1智点（原价3智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 1智点',
            cancelButtonText: '取消',
            type: 'info',
            customClass: 'high-z-index-dialog',
            appendTo: 'body'
        }
    ).then(() => {
        // 扣除智点并记录交易
        if (userStore.deductSmartPoints(1)) {
            // 记录智点消费
            userStore.addSmartPointsTransaction({
                type: 'consumption',
                amount: 1,
                description: `量化分析报告 - ${stock.name}`,
                serviceType: 'quant-analysis',
                stockInfo: {
                    name: stock.name,
                    code: stock.code,
                },
                balanceAfter: userStore.smartPointsBalance,
            });
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

const handleAITrading = (stock) => {
    // 发送到主界面处理AI委托交易对话框
    emit('send-to-chat', {
        type: 'show-ai-trading-dialog',
        content: stock,
        title: `AI委托交易设置 ${stock.name}(${stock.code})`
    });
};

const formatNumber = (num) => {
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toFixed(2);
};

const refreshData = () => {
    ElMessage.success('数据已刷新');
    // 这里可以添加实际的数据刷新逻辑
};

// 移动端操作处理
const handleActionClick = ({ action, stock }) => {
    switch (action) {
        case 'sell':
            handleSellStock(stock);
            break;
        case 'buy':
            handleBuyStock(stock);
            break;
        case 'analysis':
            handlePaidAnalysis(stock);
            break;
        case 'aiTrading':
            handleAITrading(stock);
            break;
        default:
            console.log('未知操作:', action);
    }
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
.portfolio-view {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    /* 使用 min-height 而不是固定 height，让内容可以自然展开 */
    min-height: calc(100vh - 200px);
    /* 如果内容超出视口，允许滚动 */
    max-height: calc(100vh - 156px);
    display: flex;
    flex-direction: column;
    margin: 4px;
    /* 防止内容溢出导致的布局变化 */
    contain: layout style;
}

.account-summary {
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px;
    margin-top: -20px;
    /* 移除固定高度限制，让内容自然展开 */
    min-height: auto;
    /* 移除 max-height 和 overflow: hidden */
    position: relative;
}

.account-summary::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
}

.account-summary::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background:
        linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.03) 50%, transparent 70%),
        linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
}

@keyframes shimmer {

    0%,
    100% {
        transform: translateX(-100%) translateY(-100%) rotate(0deg);
    }

    50% {
        transform: translateX(0%) translateY(0%) rotate(180deg);
    }
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
    padding: 10px;
}

.summary-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    opacity: 0.95;
}

.refresh-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    position: relative;
}

.refresh-btn::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
    pointer-events: none;
}

.refresh-btn:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%);
    transform: rotate(180deg) scale(1.05);
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.summary-main {
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
    padding: 10px;
    margin-top: -20px;
}

.total-assets-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    border-radius: 20px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
}

.total-assets-card:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    will-change: transform, box-shadow;
}

.asset-icon {
    font-size: 2rem;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    position: relative;
}

.asset-icon::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    pointer-events: none;
}

.asset-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.asset-label {
    font-size: 0.875rem;
    opacity: 0.8;
    font-weight: 500;
}

.asset-value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
}

.asset-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 4px;
}

.asset-change.positive {
    color: #10b981;
}

.asset-change.negative {
    color: #ef4444;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    position: relative;
    z-index: 1;
    padding: 10px;
    margin-top: -20px;
    margin-bottom: -10px;
}

.summary-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
    border-radius: 16px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
}

.summary-card:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
    transform: translateY(-2px) translateZ(0);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
    will-change: transform, box-shadow;
}

.summary-card:hover::before {
    left: 100%;
}

.card-icon {
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    position: relative;
}

.card-icon::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
    pointer-events: none;
}

.card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.card-label {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 500;
}

.card-value {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1;
}

.card-value.positive {
    color: #10b981;
}

.card-value.negative {
    color: #ef4444;
}

.portfolio-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    /* 添加内边距，参照自选股的样式 */
    padding: 12px;
    /* 添加滚动条稳定性 */
    scrollbar-gutter: stable;
    /* 移除固定的 min-height，让内容自然流动 */
    /* 确保可以滚动到底部 */
    height: 0;
    /* 配合 flex: 1 使用 */
}

/* 添加滚动条样式 */
.portfolio-content::-webkit-scrollbar {
    width: 4px;
}

.portfolio-content::-webkit-scrollbar-track {
    background: #f5f5f5;
}

.portfolio-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.portfolio-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* 调整高度，确保在有内边距的容器中正确显示 */
    height: calc(100% - 32px);
    /* 减去父容器的padding */
    min-height: 300px;
    text-align: center;
    color: #6b7280;
    /* 添加一些内边距 */
    padding: 40px 20px;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.empty-text h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
}

.portfolio-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* 移除之前可能存在的额外 padding，因为父容器已经有了 */
}

.stock-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.stock-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateZ(0);
    will-change: transform, box-shadow;
}

.stock-info {
    flex: 1;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
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
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    font-size: 0.875rem;
    color: #64748b;
}

.position-status {
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
}

.position-status.profit .status-value {
    color: #dc2626;
}

.position-status.loss .status-value {
    color: #16a34a;
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

.stock-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
    flex-wrap: nowrap;
    align-items: center;
}

.sell-stock-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    background: #ef4444;
    border-color: #ef4444;
    color: white;
    white-space: nowrap;
    flex-shrink: 0;
}

.sell-stock-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
}

/* 价格标签容器 */
.price-tag-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    margin-left: 3px;
    position: relative;
}

/* 原价样式（更明显的对比） */
.price-tag.original-price {
    background: #9ca3af;
    color: white;
    font-size: 0.45rem;
    font-weight: 600;
    padding: 1px 3px;
    border-radius: 2px;
    line-height: 1;
    text-decoration: line-through;
    min-width: 22px;
    text-align: center;
    opacity: 0.9;
}

/* 促销价样式（紧凑但突出） */
.price-tag.promo-price {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 3px;
    line-height: 1;
    min-width: 26px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
    position: relative;
}

/* 促销价的轻微动画效果 */
.price-tag.promo-price::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    border-radius: 3px;
    animation: shine 3s ease-in-out infinite;
    will-change: transform;
    transform: translateZ(0);
}

@keyframes shine {
    0% {
        transform: translateX(-100%) translateZ(0);
    }

    50%,
    100% {
        transform: translateX(100%) translateZ(0);
    }
}

/* 兼容旧版price-tag */
.price-tag:not(.original-price):not(.promo-price) {
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

/* 移动端响应式样式 */
@media (max-width: 768px) {

    /* 移动端容器优化 */
    .portfolio-view {
        min-height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        border-radius: 8px !important;
        overflow: visible !important;
    }

    /* 移动端账户总览优化 - 重新设计 */
    .account-summary {
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        position: static !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    .account-summary::before,
    .account-summary::after {
        display: none !important;
    }

    /* 隐藏头部标题 */
    .summary-header {
        display: none !important;
    }

    .summary-main {
        margin: 0 !important;
        padding: 0 !important;
    }

    /* 总资产卡片 - 紫色渐变设计，与截图风格一致 */
    .total-assets-card {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: white !important;
        padding: 14px 16px !important;
        border-radius: 16px !important;
        margin: 6px !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3) !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        position: relative !important;
        overflow: hidden !important;
    }

    /* 添加光泽效果 */
    .total-assets-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%) !important;
        pointer-events: none !important;
    }

    .asset-icon {
        width: 36px !important;
        height: 36px !important;
        font-size: 1.2rem !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    .asset-info {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .asset-label {
        font-size: 0.75rem !important;
        color: rgba(255, 255, 255, 0.85) !important;
        font-weight: 500 !important;
        margin: 0 !important;
        opacity: 0.9 !important;
    }

    .asset-value {
        font-size: 1.4rem !important;
        font-weight: 700 !important;
        color: white !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }

    .asset-change {
        font-size: 0.7rem !important;
        padding: 2px 8px !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
        width: fit-content !important;
        background: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        margin-top: 4px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px) !important;
    }

    .asset-change svg {
        width: 10px !important;
        height: 10px !important;
    }

    /* 三个子卡片 - 精致白色卡片设计 */
    .summary-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 8px !important;
        padding: 0 6px 8px 6px !important;
        margin: 0 !important;
    }

    .summary-card {
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        padding: 10px 6px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
        text-align: center !important;
        transition: all 0.3s ease !important;
        min-height: 64px !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06) !important;
        position: relative !important;
        overflow: hidden !important;
    }

    .summary-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, transparent 100%) !important;
        pointer-events: none !important;
    }

    .summary-card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
        border-color: #c7d2fe !important;
    }

    .summary-card:hover::before {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%) !important;
    }

    .card-icon {
        font-size: 1.1rem !important;
        margin-bottom: 2px !important;
        color: #6366f1 !important;
        flex-shrink: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(99, 102, 241, 0.08) !important;
        border-radius: 6px !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .card-content {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1px !important;
        width: 100% !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .card-label {
        font-size: 0.65rem !important;
        color: #64748b !important;
        font-weight: 500 !important;
        text-align: center !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        opacity: 0.9 !important;
    }

    .card-value {
        font-size: 0.85rem !important;
        color: #1e293b !important;
        font-weight: 700 !important;
        text-align: center !important;
        margin: 0 !important;
        line-height: 1.1 !important;
    }

    .card-value.positive {
        color: #059669 !important;
    }

    .card-value.negative {
        color: #dc2626 !important;
    }

    /* 移动端持仓内容优化 */
    .portfolio-content {
        padding: 8px !important;
        overflow: visible !important;
        height: auto !important;
        flex: none !important;
    }

    .portfolio-list {
        gap: 8px !important;
    }

    .stock-item {
        padding: 12px !important;
        border-radius: 8px !important;
        gap: 8px !important;
    }

    .stock-header {
        margin-bottom: 8px !important;
    }

    .stock-name {
        font-size: 0.9rem !important;
    }

    .stock-code {
        font-size: 0.8rem !important;
    }

    .current-price {
        font-size: 1rem !important;
    }

    .price-change {
        font-size: 0.8rem !important;
    }

    .stock-details {
        gap: 6px !important;
    }

    .detail-item {
        gap: 6px !important;
    }

    .detail-label {
        font-size: 0.7rem !important;
        min-width: 50px !important;
    }

    .detail-value {
        font-size: 0.8rem !important;
    }

    .stock-actions {
        gap: 6px !important;
        padding-top: 8px !important;
        flex-wrap: wrap !important;
    }

    .stock-actions .el-button {
        font-size: 0.7rem !important;
        padding: 4px 8px !important;
        border-radius: 6px !important;
    }

    /* 移动端空状态优化 */
    .empty-state {
        padding: 30px 16px !important;
        min-height: 200px !important;
        height: auto !important;
    }

    .empty-icon {
        font-size: 2.5rem !important;
        margin-bottom: 12px !important;
    }

    .empty-text h4 {
        font-size: 1rem !important;
        margin-bottom: 6px !important;
    }

    .empty-text p {
        font-size: 0.8rem !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .portfolio-view {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
    }

    /* 侧边栏中的账户总览样式 - 更加紧凑 */
    .sidebar-container .account-summary {
        margin: 0 !important;
        padding: 0 !important;
    }

    .sidebar-container .total-assets-card {
        margin: 6px !important;
        padding: 12px 14px !important;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2) !important;
        border-radius: 14px !important;
    }

    .sidebar-container .asset-icon {
        width: 32px !important;
        height: 32px !important;
        font-size: 1.1rem !important;
    }

    .sidebar-container .asset-value {
        font-size: 1.2rem !important;
    }

    .sidebar-container .asset-change {
        font-size: 0.65rem !important;
        padding: 1px 6px !important;
    }

    .sidebar-container .summary-grid {
        padding: 0 6px 6px 6px !important;
        gap: 6px !important;
    }

    .sidebar-container .summary-card {
        min-height: 58px !important;
        padding: 8px 4px !important;
        border-radius: 10px !important;
    }

    .sidebar-container .card-icon {
        width: 20px !important;
        height: 20px !important;
        font-size: 0.9rem !important;
        border-radius: 5px !important;
    }

    .sidebar-container .card-label {
        font-size: 0.6rem !important;
    }

    .sidebar-container .card-value {
        font-size: 0.75rem !important;
    }

    .sidebar-container .portfolio-content {
        padding: 0 6px 12px 6px !important;
    }

    .sidebar-container .stock-item {
        margin: 0 0 6px 0 !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }
}
</style>
