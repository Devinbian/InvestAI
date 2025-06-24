<template>
    <div class="mobile-stock-list-container">
        <!-- 列表头部工具栏（可选） -->
        <div v-if="showToolbar" class="mobile-list-toolbar">
            <div class="toolbar-content">
                <h3 v-if="toolbarTitle" class="toolbar-title">{{ toolbarTitle }}</h3>
                <span v-if="showTime" class="toolbar-time">{{ formatTime(timestamp) }}</span>
            </div>
            <div class="toolbar-actions">
                <slot name="toolbar-actions"></slot>
            </div>
        </div>

        <!-- 移动端股票列表 -->
        <div class="mobile-stock-list" :class="listClass">
            <div v-for="(stock, index) in stocks" :key="stock.code || index" class="mobile-stock-card"
                :class="{ 'clickable': clickable }" @click="handleStockClick(stock)" @touchstart="handleTouchStart"
                @touchend="handleTouchEnd">

                <!-- 股票主要信息 -->
                <div class="stock-main-info">
                    <div class="stock-identity">
                        <div class="stock-name-wrapper">
                            <h4 class="stock-name">{{ stock.name }}</h4>
                            <span class="stock-code">{{ stock.code }}</span>
                        </div>

                        <!-- 推荐等级标签 -->
                        <div v-if="showRecommendIndex && stock.recommendLevel" class="recommend-badge"
                            :class="getRecommendLevelClass(stock.recommendLevel)">
                            {{ stock.recommendLevel }}
                        </div>
                    </div>

                    <!-- 价格信息 -->
                    <div class="price-section">
                        <div class="current-price">¥{{ getCurrentPrice(stock) }}</div>
                        <div class="price-change" :class="getPriceChangeClass(stock)">
                            <span class="change-amount">{{ getPriceChangeAmount(stock) }}</span>
                            <span class="change-percent">{{ getPriceChangePercent(stock) }}</span>
                        </div>
                    </div>
                </div>

                <!-- 推荐指数（星级评分） -->
                <div v-if="showRecommendIndex && stock.recommendIndex" class="recommend-rating">
                    <div class="rating-stars">
                        <span v-for="i in 5" :key="i" :class="['star', i <= Math.floor(stock.recommendIndex) ? 'filled' :
                            i <= stock.recommendIndex ? 'half' : 'empty']">
                            ★
                        </span>
                    </div>
                    <span class="rating-score">{{ stock.recommendIndex }}/5.0</span>
                </div>

                <!-- 股票状态信息 -->
                <div class="stock-status-info" v-if="hasStatusInfo(stock)">
                    <!-- 自选股状态 -->
                    <div v-if="showWatchlistStatus && stock.addedAt" class="status-item watchlist-status">
                        <div class="status-icon">⭐</div>
                        <span class="status-text">{{ formatAddedTime(stock.addedAt) }}关注</span>
                    </div>

                    <!-- 持仓状态 -->
                    <div v-if="showPositionStatus && stock.quantity" class="status-item position-status"
                        :class="getPositionProfitLoss(stock) >= 0 ? 'profit' : 'loss'">
                        <div class="status-icon">📊</div>
                        <div class="position-info">
                            <span class="position-text">持仓 {{ stock.quantity.toLocaleString() }}股</span>
                            <span class="profit-loss">
                                {{ getPositionProfitLoss(stock) >= 0 ? '+' : '' }}¥{{
                                    Math.abs(getPositionProfitLoss(stock)).toFixed(2) }}
                                ({{ getPositionProfitPercent(stock) >= 0 ? '+' : '' }}{{
                                    getPositionProfitPercent(stock).toFixed(2) }}%)
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 优化的详细信息布局 -->
                <div v-if="showDetails && hasBasicDetails(stock)" class="stock-details-optimized">
                    <div class="details-grid">
                        <!-- 只显示基本详情，持仓信息已在上方状态区域显示 -->
                        <div v-if="stock.industry" class="detail-item">
                            <span class="detail-label">行业</span>
                            <span class="detail-value">{{ stock.industry }}</span>
                        </div>
                        <div v-if="stock.targetPrice" class="detail-item">
                            <span class="detail-label">目标价</span>
                            <span class="detail-value target">¥{{ stock.targetPrice }}</span>
                        </div>
                        <div v-if="stock.expectedReturn" class="detail-item">
                            <span class="detail-label">预期收益</span>
                            <span class="detail-value return">{{ stock.expectedReturn }}</span>
                        </div>
                        <div v-if="stock.riskLevel" class="detail-item">
                            <span class="detail-label">风险</span>
                            <span class="detail-value risk">{{ stock.riskLevel }}</span>
                        </div>

                        <!-- 持仓页面的补充信息（成本价、市值等） -->
                        <template v-if="showPositionStatus && stock.quantity">
                            <div v-if="stock.avgPrice" class="detail-item">
                                <span class="detail-label">成本价</span>
                                <span class="detail-value">¥{{ stock.avgPrice.toFixed(2) }}</span>
                            </div>
                            <div v-if="stock.marketValue" class="detail-item">
                                <span class="detail-label">市值</span>
                                <span class="detail-value">¥{{ stock.marketValue.toLocaleString() }}</span>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- 推荐理由 -->
                <div v-if="showReason && stock.reason" class="recommend-reason">
                    <div class="reason-header">
                        <div class="reason-icon">💡</div>
                        <span class="reason-label">推荐理由</span>
                    </div>
                    <p class="reason-text">{{ stock.reason }}</p>
                </div>

                <!-- 原生移动端操作区域 -->
                <div class="native-mobile-actions" v-if="actions.length > 0">
                    <!-- 主要操作（最多2个） -->
                    <div class="primary-actions">
                        <template v-for="action in getPrimaryActions(stock)" :key="action.key">
                            <button class="primary-action-btn" :class="[action.class, action.type || 'default']"
                                @click.stop="handleAction(action.key, stock)" :disabled="action.loading">
                                <div v-if="getActionIcon(action)" class="action-icon" v-html="getActionIcon(action)">
                                </div>
                                <span class="action-text">{{ getMobileActionText(action) }}</span>
                                <div v-if="action.priceTag" class="price-badge">{{ action.priceTag.promo }}</div>
                            </button>
                        </template>
                    </div>

                    <!-- 更多操作（折叠显示） -->
                    <div v-if="getSecondaryActions(stock).length > 0" class="more-actions">
                        <button class="more-btn" @click.stop="toggleActions(stock.code, $event)">
                            <span class="more-icon">⋯</span>
                        </button>

                        <!-- 折叠的操作菜单 - 移到body下避免遮挡 -->
                        <teleport to="body" v-if="expandedActions === stock.code">
                            <div class="actions-menu-overlay" @click="expandedActions = null">
                                <div class="actions-menu" :data-menu="stock.code" @click.stop>
                                    <div v-for="action in getSecondaryActions(stock)" :key="action.key"
                                        class="menu-item" @click="handleAction(action.key, stock)">
                                        <div v-if="getActionIcon(action)" class="menu-icon"
                                            v-html="getActionIcon(action)">
                                        </div>
                                        <span class="menu-text">{{ getMobileActionText(action) }}</span>
                                        <div v-if="action.priceTag" class="menu-price">{{ action.priceTag.promo }}</div>
                                    </div>
                                </div>
                            </div>
                        </teleport>
                    </div>
                </div>
            </div>
        </div>

        <!-- 列表底部 -->
        <div v-if="showFooter" class="mobile-list-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useUserStore } from '../store/user';

// Props
const props = defineProps({
    // 股票数据
    stocks: {
        type: Array,
        default: () => []
    },
    // 操作按钮配置
    actions: {
        type: Array,
        default: () => []
    },
    // 显示配置
    showToolbar: {
        type: Boolean,
        default: false
    },
    toolbarTitle: {
        type: String,
        default: ''
    },
    showTime: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: [String, Number, Date],
        default: null
    },
    showRecommendIndex: {
        type: Boolean,
        default: false
    },
    showWatchlistStatus: {
        type: Boolean,
        default: false
    },
    showPositionStatus: {
        type: Boolean,
        default: false
    },
    showDetails: {
        type: Boolean,
        default: true
    },
    showReason: {
        type: Boolean,
        default: false
    },
    showFooter: {
        type: Boolean,
        default: false
    },
    // 样式配置
    listClass: {
        type: String,
        default: ''
    },
    // 交互配置
    clickable: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits([
    'stock-click',
    'action-click',
    'add-watchlist',
    'remove-watchlist',
    'sell-stock',
    'buy-stock',
    'paid-analysis',
    'ai-trading'
]);

// Store
const userStore = useUserStore();

// 展开的操作菜单
const expandedActions = ref(null);

// 模拟当前价格数据
const currentPrices = {
    '000001': 12.68,
    '000858': 52.30,
    '000002': 24.15,
    '300750': 485.20,
    '600519': 1680.50,
    '000700': 15.80
};

// 方法
const getCurrentPrice = (stock) => {
    if (stock.currentPrice) return stock.currentPrice;
    if (stock.price) return stock.price;
    return currentPrices[stock.code] || 0;
};

const getPriceChangeClass = (stock) => {
    let change = stock.change || 0;
    if (typeof change === 'string') {
        change = parseFloat(change.replace(/[+%]/g, '')) || 0;
    }
    return {
        'positive': change > 0,
        'negative': change < 0,
        'neutral': change === 0
    };
};

const getPriceChangeAmount = (stock) => {
    let change = stock.change || 0;
    if (typeof change === 'string') {
        return change.includes('%') ? change.split('(')[0].trim() : change;
    }
    return change > 0 ? `+${change}` : change.toString();
};

const getPriceChangePercent = (stock) => {
    let changePercent = stock.changePercent || 0;
    if (typeof changePercent === 'string') {
        return changePercent.includes('(') ? changePercent.match(/\((.*?)\)/)?.[1] || changePercent : changePercent;
    }
    return changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
};

const getRecommendLevelClass = (level) => {
    const levelClassMap = {
        '强烈推荐': 'strong-recommend',
        '推荐': 'recommend',
        '中性': 'neutral',
        '谨慎': 'caution'
    };
    return levelClassMap[level] || 'neutral';
};

const formatAddedTime = (addedAt) => {
    const date = new Date(addedAt);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
};

const hasStatusInfo = (stock) => {
    return (props.showWatchlistStatus && stock.addedAt) ||
        (props.showPositionStatus && stock.quantity);
};

const hasDetails = (stock) => {
    // 基本详情字段
    const basicDetails = stock.industry || stock.targetPrice || stock.expectedReturn || stock.riskLevel;

    // 持仓详情字段
    const positionDetails = props.showPositionStatus && (stock.quantity || stock.avgPrice || stock.marketValue);

    return basicDetails || positionDetails;
};

// 检查是否有基本详情（不包括重复的持仓信息）
const hasBasicDetails = (stock) => {
    // 基本详情字段
    const basicDetails = stock.industry || stock.targetPrice || stock.expectedReturn || stock.riskLevel;

    // 持仓页面的补充信息（成本价、市值等，不包括数量和盈亏）
    const positionSupplementDetails = props.showPositionStatus && (stock.avgPrice || stock.marketValue);

    return basicDetails || positionSupplementDetails;
};

const getPositionProfitLoss = (stock) => {
    if (!stock.quantity || !stock.avgPrice) return 0;
    const currentPrice = getCurrentPrice(stock);
    return (currentPrice - stock.avgPrice) * stock.quantity;
};

const getPositionProfitPercent = (stock) => {
    if (!stock.avgPrice) return 0;
    const currentPrice = getCurrentPrice(stock);
    return ((currentPrice - stock.avgPrice) / stock.avgPrice) * 100;
};

const isInWatchlist = (stock) => {
    return !!stock.addedAt;
};

const getVisibleActions = (stock) => {
    return props.actions.filter(action => {
        if (action.key === 'addWatchlist') return !isInWatchlist(stock);
        if (action.key === 'removeWatchlist') return isInWatchlist(stock);
        return true;
    });
};

// 获取主要操作（最多2个）
const getPrimaryActions = (stock) => {
    const visibleActions = getVisibleActions(stock);
    // 按操作频率排序：买入/卖出 > 量化分析/AI交易 > 自选操作
    const primaryKeys = ['buy', 'sell', 'analysis', 'aiTrading'];

    // 优先显示高频操作
    const primaryActions = visibleActions.filter(action =>
        primaryKeys.includes(action.key)
    );

    // 如果主要操作不足2个，从其他操作中补充（但排除自选操作）
    if (primaryActions.length < 2) {
        const otherActions = visibleActions.filter(action =>
            !primaryKeys.includes(action.key) &&
            !['addWatchlist', 'removeWatchlist'].includes(action.key)
        );
        primaryActions.push(...otherActions.slice(0, 2 - primaryActions.length));
    }

    return primaryActions.slice(0, 2);
};

// 获取次要操作（折叠显示）
const getSecondaryActions = (stock) => {
    const visibleActions = getVisibleActions(stock);
    const primaryActions = getPrimaryActions(stock);
    const primaryKeys = primaryActions.map(action => action.key);

    return visibleActions.filter(action =>
        !primaryKeys.includes(action.key)
    );
};

// 切换操作菜单
const toggleActions = (stockCode, event) => {
    if (expandedActions.value === stockCode) {
        expandedActions.value = null;
        return;
    }

    expandedActions.value = stockCode;

    // 动态定位菜单
    nextTick(() => {
        const menu = document.querySelector(`[data-menu="${stockCode}"]`);
        if (menu && event) {
            const button = event.currentTarget;
            const rect = button.getBoundingClientRect();

            // 获取菜单尺寸
            const menuRect = menu.getBoundingClientRect();

            // 计算菜单位置
            let top = rect.bottom + 4;
            let left = rect.right - menuRect.width;

            // 防止菜单超出视口
            if (top + menuRect.height > window.innerHeight - 20) {
                top = rect.top - menuRect.height - 4;
            }

            if (left < 8) {
                left = rect.left;
            }

            if (left + menuRect.width > window.innerWidth - 8) {
                left = window.innerWidth - menuRect.width - 8;
            }

            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
        }
    });
};

const getActionIcon = (action) => {
    // 如果action有SVG路径，返回SVG元素
    if (action.icon && action.icon.includes('M')) {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="${action.icon}" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>`;
    }

    // 使用统一的图标映射（确保相同功能使用相同图标）
    const iconMap = {
        'addWatchlist': '⭐',
        'removeWatchlist': '★',
        'buy': '💰',
        'sell': '📤',
        'analysis': '📊',
        'quantAnalysis': '📊',  // 统一使用分析图标
        'paidAnalysis': '📊',   // 统一使用分析图标
        'aiTrading': '🤖',
        'addPosition': '📈'
    };

    return iconMap[action.key] || action.icon || '';
};

// 获取移动端显示文本（优化按钮文本长度）
const getMobileActionText = (action) => {
    const mobileTextMap = {
        'analysis': '分析',
        'aiTrading': 'AI交易',
        'quantAnalysis': '分析',
        'paidAnalysis': '深度',
        'addWatchlist': '加自选',
        'removeWatchlist': '移除',
        'buy': '买入',
        'sell': '卖出',
        'addPosition': '加仓'
    };

    // 如果有移动端专用文本，使用它
    if (action.mobileText) {
        return action.mobileText;
    }

    // 使用映射表中的文本（移动端简化版本）
    if (mobileTextMap[action.key]) {
        return mobileTextMap[action.key];
    }

    // 如果原文本过长，进行截断
    if (action.text && action.text.length > 4) {
        return action.text.substring(0, 4);
    }

    return action.text || '操作';
};

// 事件处理
const handleStockClick = (stock) => {
    if (props.clickable) {
        emit('stock-click', stock);
    }
};

const handleAction = (actionKey, stock) => {
    emit('action-click', { action: actionKey, stock });
    emit(actionKey.replace(/([A-Z])/g, '-$1').toLowerCase(), stock);
};

const handleTouchStart = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
    e.currentTarget.style.transition = 'transform 0.1s ease';
};

const handleTouchEnd = (e) => {
    setTimeout(() => {
        e.currentTarget.style.transform = 'scale(1)';
    }, 100);
};

// 点击外部关闭菜单
const handleClickOutside = (e) => {
    if (!e.target.closest('.more-actions') && !e.target.closest('.actions-menu')) {
        expandedActions.value = null;
    }
};

// 在组件挂载时添加全局点击监听

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 移动端股票列表容器 */
.mobile-stock-list-container {
    width: 100%;
    background: #f8fafc;
    min-height: 100vh;
    overflow: visible;
}

/* 工具栏样式 */
.mobile-list-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px 8px 12px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 10;
}

.toolbar-content {
    flex: 1;
}

.toolbar-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 2px 0;
}

.toolbar-time {
    font-size: 0.6875rem;
    color: #64748b;
}

.toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 移动端股票列表 */
.mobile-stock-list {
    padding: 8px 0 6px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: visible;
}

/* 移动端股票卡片 */
.mobile-stock-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 12px;
    margin: 0 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    position: relative;
    overflow: visible;
}

.mobile-stock-card.clickable {
    cursor: pointer;
}

.mobile-stock-card.clickable:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 股票主要信息 */
.stock-main-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.stock-identity {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stock-name-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.stock-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    line-height: 1.3;
}

.stock-code {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

/* 推荐等级标签 */
.recommend-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    text-align: center;
    max-width: fit-content;
}

.recommend-badge.strong-recommend {
    background: #dcfce7;
    color: #166534;
}

.recommend-badge.recommend {
    background: #dbeafe;
    color: #1d4ed8;
}

.recommend-badge.neutral {
    background: #fef3c7;
    color: #92400e;
}

.recommend-badge.caution {
    background: #fee2e2;
    color: #dc2626;
}

/* 价格区域 */
.price-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.current-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
}

.price-change {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}

.price-change.positive {
    background: #fee2e2;
    color: #dc2626;
}

.price-change.negative {
    background: #dcfce7;
    color: #16a34a;
}

.price-change.neutral {
    background: #f1f5f9;
    color: #64748b;
}

/* 推荐指数 */
.recommend-rating {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 8px;
}

.rating-stars {
    display: flex;
    align-items: center;
    gap: 2px;
}

.star {
    font-size: 1rem;
    transition: all 0.2s ease;
}

.star.filled {
    color: #fbbf24;
    text-shadow: 0 0 2px rgba(251, 191, 36, 0.5);
}

.star.half {
    color: #fbbf24;
    opacity: 0.6;
}

.star.empty {
    color: #e5e7eb;
}

.rating-score {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    background: #ffffff;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
}

/* 状态信息 */
.stock-status-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
}

.status-icon {
    font-size: 0.75rem;
    flex-shrink: 0;
    opacity: 0.7;
}

.status-text {
    font-size: 0.6875rem;
    color: #9ca3af;
    font-weight: 400;
}

.position-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.position-text {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.profit-loss {
    font-size: 0.875rem;
    font-weight: 600;
}

.position-status.profit .profit-loss {
    color: #16a34a;
}

.position-status.loss .profit-loss {
    color: #dc2626;
}

/* 优化的详细信息布局 */
.stock-details-optimized {
    margin-bottom: 8px;
}

.details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    padding: 8px 0;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 20px;
}

.detail-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    flex-shrink: 0;
}

.detail-value {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1e293b;
    text-align: right;
}

.detail-value.target {
    color: #2563eb;
}

.detail-value.return {
    color: #16a34a;
}

.detail-value.risk {
    color: #dc2626;
}

/* 推荐理由 */
.recommend-reason {
    margin-bottom: 8px;
    padding: 12px;
    background: #fefce8;
    border-radius: 8px;
    border: 1px solid #fde047;
}

.reason-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
}

.reason-icon {
    font-size: 1rem;
}

.reason-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #92400e;
}

.reason-text {
    font-size: 0.875rem;
    color: #451a03;
    line-height: 1.4;
    margin: 0;
}

/* 原生移动端操作区域 */
.native-mobile-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}

.primary-actions {
    display: flex;
    gap: 12px;
    flex: 1;
}

.primary-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px;
    border: none;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    min-height: 32px;
    flex: 1;
    max-width: 120px;
}

/* 主要按钮样式 */
.primary-action-btn:active {
    transform: scale(0.95);
}

/* 默认样式 */
.primary-action-btn {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #e2e8f0;
}

.primary-action-btn:hover {
    background: #f1f5f9;
}

/* 特定按钮样式 */
.primary-action-btn.remove-watchlist-btn {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
}

.primary-action-btn.buy-stock-btn-secondary,
.primary-action-btn:has(.action-text:contains("买入")),
.primary-action-btn:has(.action-text:contains("加仓")) {
    background: #3b82f6;
    color: #ffffff;
}

.primary-action-btn.sell-stock-btn {
    background: #dc2626;
    color: #ffffff;
}

.action-icon {
    font-size: 0.875rem;
    flex-shrink: 0;
}

.action-text {
    font-size: 0.75rem;
    white-space: nowrap;
}

.price-badge {
    font-size: 0.5rem;
    background: #f59e0b;
    color: white;
    padding: 1px 4px;
    border-radius: 6px;
    font-weight: 600;
    margin-left: 2px;
}

/* 更多操作按钮 */
.more-actions {
    position: relative;
    margin-left: 12px;
}

.more-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;
}

.more-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.more-btn:active {
    transform: scale(0.95);
}

.more-icon {
    font-size: 1rem;
    color: #64748b;
    line-height: 1;
    transform: rotate(90deg);
}

/* 操作菜单覆盖层 */
.actions-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    background: transparent;
}

/* 操作菜单 */
.actions-menu {
    position: absolute;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    min-width: 160px;
    white-space: nowrap;
    animation: slideDown 0.2s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid #f1f5f9;
    min-height: 40px;
    white-space: nowrap;
}

.menu-item:last-child {
    border-bottom: none;
}

.menu-item:hover {
    background: #f8fafc;
}

.menu-item:active {
    background: #f1f5f9;
}

.menu-icon {
    font-size: 1rem;
    flex-shrink: 0;
    color: #64748b;
    width: 16px;
    text-align: center;
}

.menu-text {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
    white-space: nowrap;
}

.menu-price {
    font-size: 0.625rem;
    background: #f59e0b;
    color: white;
    padding: 2px 6px;
    border-radius: 6px;
    font-weight: 600;
}



/* 列表底部 */
.mobile-list-footer {
    padding: 16px;
    text-align: center;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
}

/* 响应式优化 */
@media (max-width: 480px) {
    .mobile-stock-card {
        padding: 12px;
        margin: 0 -4px;
        border-radius: 8px;
    }

    .stock-name {
        font-size: 1rem;
    }

    .current-price {
        font-size: 1.125rem;
    }

    .primary-action-btn {
        padding: 5px 8px;
        font-size: 0.75rem;
        min-height: 28px;
        max-width: 80px;
    }

    .more-btn {
        width: 28px;
        height: 28px;
    }

    .actions-menu {
        min-width: 140px;
    }

    .menu-item {
        padding: 8px 12px;
        min-height: 36px;
    }

    .details-grid {
        grid-template-columns: 1fr;
        gap: 4px;
    }
}

/* 触摸反馈优化 */
@media (hover: none) {
    .mobile-stock-card:hover {
        transform: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .mobile-action-btn:hover {
        transform: none;
    }
}
</style>
