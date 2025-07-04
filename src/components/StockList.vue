<template>
    <div class="stock-list-container">
        <!-- 列表头部工具栏（可选） -->
        <div v-if="showToolbar" class="list-toolbar">
            <div class="toolbar-left">
                <span v-if="toolbarTitle" class="toolbar-title">{{ toolbarTitle }}</span>
                <span v-if="showTime" class="toolbar-time">{{ formatTime(timestamp) }}</span>
            </div>
            <div class="toolbar-right">
                <slot name="toolbar-actions"></slot>
            </div>
        </div>

        <!-- 股票列表 -->
        <div class="stock-list" :class="listClass">
            <div v-for="(stock, index) in stocks" :key="stock.code || index" class="stock-item"
                :class="{ 'clickable': clickable }" @click="handleStockClick(stock)">
                <div class="stock-info">
                    <div class="stock-header">
                        <div class="stock-name-code">
                            <div class="name-code-row">
                                <span class="stock-name">{{ stock.name }}</span>
                                <span class="stock-code">({{ stock.code }})</span>
                            </div>

                            <!-- 状态信息区域 - 根据类型显示不同内容 -->
                            <div class="stock-status">
                                <!-- 推荐指数（推荐股票） -->
                                <div v-if="showRecommendIndex && stock.recommendIndex" class="recommend-index">
                                    <div class="recommend-stars">
                                        <span v-for="i in 5" :key="i" :class="['star', i <= Math.floor(stock.recommendIndex) ? 'filled' :
                                            i <= stock.recommendIndex ? 'half' : 'empty']">
                                            ★
                                        </span>
                                    </div>
                                    <span class="recommend-score">{{ stock.recommendIndex }}/5.0</span>
                                    <el-tooltip v-if="showRecommendTooltip" placement="top" effect="dark"
                                        :show-after="100">
                                        <template #content>
                                            <div class="recommend-index-tooltip">
                                                <div class="tooltip-title">推荐指数说明：</div>
                                                <div class="tooltip-item">
                                                    <span class="score">5.0：</span>
                                                    <span class="desc">强烈推荐 - 投资价值极高</span>
                                                </div>
                                                <div class="tooltip-item">
                                                    <span class="score">4.0-4.9：</span>
                                                    <span class="desc">推荐 - 具备较好投资价值</span>
                                                </div>
                                                <div class="tooltip-item">
                                                    <span class="score">3.0-3.9：</span>
                                                    <span class="desc">中性 - 可持续观察</span>
                                                </div>
                                                <div class="tooltip-item">
                                                    <span class="score">2.0-2.9：</span>
                                                    <span class="desc">谨慎 - 建议控制仓位</span>
                                                </div>
                                                <div class="tooltip-item">
                                                    <span class="score">1.0-1.9：</span>
                                                    <span class="desc">不推荐 - 建议回避</span>
                                                </div>
                                            </div>
                                        </template>
                                        <el-icon class="help-icon">
                                            <QuestionFilled />
                                        </el-icon>
                                    </el-tooltip>
                                    <span v-if="stock.recommendLevel"
                                        :class="['recommend-level', getRecommendLevelClass(stock.recommendLevel)]">
                                        {{ stock.recommendLevel }}
                                    </span>
                                </div>

                                <!-- 自选股状态 -->
                                <div v-if="showWatchlistStatus && stock.addedAt" class="watchlist-status">
                                    <span class="status-label">关注：</span>
                                    <span class="status-value">{{ formatAddedTime(stock.addedAt) }}</span>
                                </div>

                                <!-- 持仓状态 -->
                                <div v-if="showPositionStatus && stock.quantity" class="position-status"
                                    :class="getPositionProfitLoss(stock) >= 0 ? 'profit' : 'loss'">
                                    <span class="status-label">盈亏：</span>
                                    <span class="status-value">
                                        {{ getPositionProfitLoss(stock) >= 0 ? '+' : '' }}¥{{
                                            Math.abs(getPositionProfitLoss(stock)).toFixed(2) }}
                                        ({{ getPositionProfitPercent(stock) >= 0 ? '+' : '' }}{{
                                            getPositionProfitPercent(stock).toFixed(2) }}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="stock-price-change">
                            <span class="current-price">¥{{ getCurrentPrice(stock) }}</span>
                            <span :class="['price-change', getPriceChangeClass(stock)]">
                                {{ getPriceChangeText(stock) }}
                            </span>
                        </div>
                    </div>

                    <!-- 股票详情 -->
                    <div class="stock-details">
                        <!-- 基础信息 -->
                        <div v-if="showBasicDetails" class="detail-group">
                            <div class="detail-item" v-if="stock.targetPrice">
                                <span class="detail-label">目标价</span>
                                <span class="detail-value target-price">¥{{ stock.targetPrice }}</span>
                            </div>
                            <div class="detail-item" v-if="stock.expectedReturn">
                                <span class="detail-label">预期收益</span>
                                <span class="detail-value expected-return">{{ stock.expectedReturn }}</span>
                            </div>
                            <div class="detail-item" v-if="stock.riskLevel">
                                <span class="detail-label">风险等级</span>
                                <span class="detail-value risk-level">{{ stock.riskLevel }}</span>
                            </div>
                            <div class="detail-item" v-if="stock.industry">
                                <span class="detail-label">所属行业</span>
                                <span class="detail-value industry">{{ stock.industry }}</span>
                            </div>
                        </div>

                        <!-- 自选股详细信息 -->
                        <div v-if="showWatchlistDetails" class="detail-group watchlist-details">
                            <div class="detail-item" v-if="stock.industry">
                                <span class="detail-label">所属行业</span>
                                <span class="detail-value industry">{{ stock.industry || '未分类' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">推荐等级</span>
                                <span class="detail-value recommend-level">{{ stock.recommendLevel || '中性' }}</span>
                            </div>
                        </div>

                        <!-- 持仓信息 -->
                        <div v-if="showPositionDetails && stock.quantity" class="detail-group position-details">
                            <div class="detail-item">
                                <span class="detail-label">持仓数量：</span>
                                <span class="detail-value">{{ stock.quantity.toLocaleString() }}股</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">成本价：</span>
                                <span class="detail-value">¥{{ stock.avgPrice?.toFixed(2) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">持仓市值：</span>
                                <span class="detail-value target-price">¥{{ (stock.quantity *
                                    getCurrentPrice(stock)).toFixed(2) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">所属行业：</span>
                                <span class="detail-value industry">{{ stock.industry || '未分类' }}</span>
                            </div>
                        </div>

                        <!-- 推荐理由 -->
                        <div v-if="showReason && stock.reason" class="stock-reason">
                            <span class="reason-label">推荐理由：</span>
                            <span class="reason-text">{{ stock.reason }}</span>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮区域 -->
                <div class="stock-actions" v-if="actions.length > 0">
                    <StockActionButtons :stock="stock" :actions="actions" :is-mobile="isMobile" mode="compact"
                        size="small" @action-click="handleAction" />
                </div>
            </div>
        </div>

        <!-- 列表底部（可选） -->
        <div v-if="showFooter" class="list-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import { useUserStore } from '../store/user';
import StockActionButtons from './StockActionButtons.vue';

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

    showRecommendTooltip: {
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

    showBasicDetails: {
        type: Boolean,
        default: true
    },

    showWatchlistDetails: {
        type: Boolean,
        default: false
    },

    showPositionDetails: {
        type: Boolean,
        default: false
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
    },

    // 移动端标识
    isMobile: {
        type: Boolean,
        default: false
    }
});

// Emits
const emit = defineEmits([
    'stock-click',
    'action-click',
    // 具体的操作事件
    'add-watchlist',
    'remove-watchlist',
    'sell-stock',
    'buy-stock',
    'paid-analysis',
    'ai-trading'
]);

// Store
const userStore = useUserStore();

// 模拟当前价格数据
const currentPrices = {
    '000001': 12.68,
    '000858': 52.30,
    '000002': 24.15,
    '300750': 485.20,
    '600519': 1680.50,
    '000700': 15.80
};

// 添加调试日志
console.log('🔍 StockList组件接收到的数据:', {
    stocks: props.stocks,
    stocksLength: props.stocks?.length,
    hasStocks: props.stocks && props.stocks.length > 0,
    showRecommendIndex: props.showRecommendIndex,
    actions: props.actions
});

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

const getPriceChangeText = (stock) => {
    let change = stock.change || 0;
    let changePercent = stock.changePercent || 0;

    if (typeof change === 'string' && typeof changePercent === 'string') {
        return `${change} (${changePercent})`;
    }

    const changeText = change > 0 ? `+${change}` : change.toString();
    const percentText = changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`;
    return `${changeText} (${percentText})`;
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

const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
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
    return userStore.isInWatchlist(stock.code);
};

const handleStockClick = (stock) => {
    if (props.clickable) {
        emit('stock-click', stock);
    }
};

const handleAction = (event) => {
    // StockActionButtons组件发送的事件格式：{ action: actionKey, stock: stock }
    const { action, stock } = event;

    // 发出通用事件
    emit('action-click', { action, stock });

    // 根据操作类型发出具体事件
    const eventMap = {
        'addWatchlist': 'add-watchlist',
        'removeWatchlist': 'remove-watchlist',
        'sell': 'sell-stock',
        'buy': 'buy-stock',
        'analysis': 'paid-analysis',
        'paidAnalysis': 'paid-analysis',
        'aiTrading': 'ai-trading',
        'quantAnalysis': 'ai-trading'
    };

    const eventName = eventMap[action];
    if (eventName) {
        emit(eventName, stock);
    }
};
</script>

<style scoped>
.stock-list-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* 确保容器不限制高度，让内容自然流动 */
    height: auto;
    min-height: auto;
    max-height: none;
    overflow: visible;
}

/* 工具栏样式 */
.list-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.875rem;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toolbar-title {
    font-weight: 600;
    color: #1e293b;
}

.toolbar-time {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 500;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 股票列表样式 */
.stock-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* 确保列表不限制高度，让内容自然流动 */
    height: auto;
    min-height: auto;
    max-height: none;
    overflow: visible;
}

.stock-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    transition: all 0.2s ease;
}

.stock-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stock-item.clickable {
    cursor: pointer;
}

.stock-info {
    margin-bottom: 8px;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.stock-name-code {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.name-code-row {
    display: flex;
    align-items: center;
    gap: 6px;
}

.stock-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

/* 状态信息样式 */
.stock-status {
    margin-top: 4px;
}

.recommend-index {
    display: flex;
    align-items: center;
    gap: 8px;
}

.recommend-stars {
    display: flex;
    align-items: center;
    gap: 1px;
}

.star {
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.star.filled {
    color: #fbbf24;
    text-shadow: 0 0 2px rgba(251, 191, 36, 0.5);
}

.star.half {
    color: #fbbf24;
    opacity: 0.6;
    text-shadow: 0 0 2px rgba(251, 191, 36, 0.3);
}

.star.empty {
    color: #e5e7eb;
}

.recommend-score {
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

.help-icon {
    font-size: 14px;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s ease;
}

.help-icon:hover {
    color: #64748b;
}

.recommend-level {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.2;
}

.recommend-level.strong-recommend {
    background: #dcfce7;
    color: #166534;
}

.recommend-level.recommend {
    background: #dbeafe;
    color: #1d4ed8;
}

.recommend-level.neutral {
    background: #fef3c7;
    color: #92400e;
}

.recommend-level.caution {
    background: #fee2e2;
    color: #dc2626;
}

.watchlist-status {
    display: flex;
    align-items: center;
    gap: 6px;
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

.position-status {
    display: flex;
    align-items: center;
    gap: 6px;
}

.position-status.profit .status-value {
    color: #16a34a;
}

.position-status.loss .status-value {
    color: #dc2626;
}

/* 价格变化样式 */
.stock-price-change {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.current-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
}

.price-change {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
}

.price-change.positive {
    color: #dc2626;
    background: #fee2e2;
}

.price-change.negative {
    color: #16a34a;
    background: #dcfce7;
}

.price-change.neutral {
    color: #64748b;
    background: #f1f5f9;
}

/* 股票详情样式 */
.stock-details {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.detail-group {
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    margin-bottom: 8px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
    text-align: left;
}

.detail-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
}

.detail-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
}

.detail-value.target-price {
    color: #dc2626;
}

.detail-value.expected-return {
    color: #16a34a;
}

.detail-value.risk-level {
    color: #f59e0b;
}

.detail-value.industry {
    color: #8b5cf6;
}

.stock-reason {
    margin-top: 8px;
    padding: 8px;
    background: #fff3cd;
    border-radius: 4px;
    border: 1px solid #ffeaa7;
    display: flex;
    align-items: flex-start;
    gap: 6px;
}

.reason-label {
    font-size: 0.75rem;
    color: #856404;
    white-space: nowrap;
    flex-shrink: 0;
    font-weight: bold;
}

.reason-text {
    font-size: 0.75rem;
    line-height: 1.4;
    color: #533f03;
    flex: 1;
}

/* 操作按钮样式 - 精致优雅设计 */
.stock-actions {
    display: flex;
    gap: 6px;
    margin-top: 12px;
    flex-wrap: wrap;
    align-items: center;
}

/* 侧边栏紧凑布局 - PC端允许换行显示所有按钮 */
.recommendations-container .stock-actions,
.sidebar-container .stock-actions {
    flex-wrap: wrap;
    gap: 4px;
    overflow: visible;
    margin-top: 8px;
    /* 移除滚动相关样式，允许自然换行 */
    padding-bottom: 0;
    padding-right: 0;
}

/* 移除滚动条样式，因为现在使用换行布局 */

/* 侧边栏中的股票列表更紧凑 */
.sidebar-container .stock-list {
    gap: 6px;
}

.sidebar-container .stock-item {
    padding: 10px;
}

.sidebar-container .stock-info {
    margin-bottom: 6px;
}

.sidebar-container .stock-header {
    margin-bottom: 6px;
}

.sidebar-container .stock-details {
    margin-top: 6px;
    padding-top: 6px;
}

.recommendations-container .stock-actions .el-button,
.sidebar-container .stock-actions .el-button {
    padding: 0 8px;
    font-size: 0.7rem;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: fit-content;
}

/* 统一按钮基础样式 */
.stock-actions .el-button {
    height: 32px;
    padding: 0 12px;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: auto;
    letter-spacing: 0.02em;
}

.stock-actions .el-button svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

/* 主要操作按钮 - 内敛优雅风格 */
.add-watchlist-btn {
    background: #374151 !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.add-watchlist-btn:hover {
    background: #1f2937 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

.remove-watchlist-btn {
    background: #6b7280 !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.remove-watchlist-btn:hover {
    background: #4b5563 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

/* 购买/加仓按钮 - 内敛风格 */
.buy-stock-btn-secondary {
    background: rgba(255, 255, 255, 0.9) !important;
    color: #374151 !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 500;
}

.buy-stock-btn-secondary:hover {
    background: #f9fafb !important;
    border-color: #9ca3af !important;
    color: #111827 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
}

.sell-stock-btn {
    background: #dc2626 !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 1px 3px rgba(220, 38, 38, 0.2);
}

.sell-stock-btn:hover {
    background: #b91c1c !important;
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
    transform: translateY(-1px);
}

/* 量化分析按钮 - 专业紫色 */
.paid-analysis-btn {
    background: rgba(139, 92, 246, 0.1) !important;
    color: #7c3aed !important;
    border: 1px solid rgba(139, 92, 246, 0.3) !important;
    box-shadow: 0 1px 3px rgba(139, 92, 246, 0.1);
    position: relative;
}

.paid-analysis-btn:hover {
    background: rgba(139, 92, 246, 0.15) !important;
    color: #6d28d9 !important;
    border-color: rgba(139, 92, 246, 0.4) !important;
    box-shadow: 0 2px 6px rgba(139, 92, 246, 0.2);
    transform: translateY(-1px);
}

/* AI委托交易按钮 - 智能蓝色 */
.quant-analysis-btn {
    background: rgba(59, 130, 246, 0.1) !important;
    color: #2563eb !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.1);
    position: relative;
}

.quant-analysis-btn:hover {
    background: rgba(59, 130, 246, 0.15) !important;
    color: #1d4ed8 !important;
    border-color: rgba(59, 130, 246, 0.4) !important;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
}

/* 价格标签样式优化 */
.price-tag-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    margin-left: 6px;
}

.price-tag {
    font-size: 0.625rem;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.price-tag.original-price {
    background: rgba(156, 163, 175, 0.15);
    color: #9ca3af;
    text-decoration: line-through;
}

.price-tag.promo-price {
    background: #f59e0b;
    color: white;
    font-weight: 600;
}

/* 按钮焦点和状态样式 */
.stock-actions .el-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.stock-actions .el-button:active {
    transform: translateY(0);
}

.stock-actions .el-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
}

/* 按钮加载状态 */
.stock-actions .el-button.is-loading {
    pointer-events: none;
}

.stock-actions .el-button.is-loading svg {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* 微交互增强 */
.stock-actions .el-button {
    position: relative;
    overflow: hidden;
}

.stock-actions .el-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
}

.stock-actions .el-button:active::before {
    width: 100%;
    height: 100%;
}

/* 底部样式 */
.list-footer {
    padding: 12px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
}

/* 持仓详细信息样式 - 使用统一布局 */
.position-details .detail-value.target-price {
    color: #2563eb;
    font-weight: 700;
}

/* 自选股详细信息样式 - 使用统一布局 */
.watchlist-details .detail-value.recommend-level {
    color: #059669;
    background: #d1fae5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stock-item {
        padding: 12px;
    }

    .stock-header {
        flex-direction: column;
        gap: 8px;
    }

    .stock-price-change {
        align-items: flex-start;
    }

    .detail-group {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
    }

    .stock-actions {
        gap: 4px;
        margin-top: 12px;
    }

    .stock-actions .el-button {
        height: 28px;
        padding: 0 8px;
        font-size: 0.7rem;
        border-radius: 4px;
    }

    .stock-actions .el-button svg {
        width: 10px;
        height: 10px;
    }

    .price-tag-container {
        margin-left: 4px;
    }

    .price-tag {
        font-size: 0.55rem;
        padding: 1px 3px;
    }
}

@media (max-width: 480px) {
    .stock-item {
        padding: 8px;
    }

    .stock-name {
        font-size: 0.9rem;
    }

    .stock-code {
        font-size: 0.75rem;
    }

    .current-price {
        font-size: 1rem;
    }

    .detail-group {
        grid-template-columns: 1fr;
    }

    .stock-actions {
        gap: 3px;
        margin-top: 10px;
    }

    .stock-actions .el-button {
        height: 26px;
        padding: 0 6px;
        font-size: 0.65rem;
        min-width: 50px;
    }

    .price-tag {
        font-size: 0.5rem;
        padding: 0.5px 2px;
    }
}
</style>
