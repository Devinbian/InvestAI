<template>
    <div :class="['chat-message', message.role]">
        <div class="chat-message-content">
            <!-- AI生成中状态显示 -->
            <div v-if="message.role === 'assistant' && (message.isGenerating || (!message.content && isGenerating && isLastMessage))"
                class="message-text generating-message">
                <div class="generating-content-inline">
                    <div class="generating-dots">
                        <span class="dot"></span>
                        <span class="dot"></span>
                        <span class="dot"></span>
                    </div>
                    <span class="generating-label">AI正在思考中...</span>
                </div>
            </div>

            <!-- 正常消息内容 -->
            <div v-else-if="message.content && !message.isGenerating" class="message-text"
                :class="getMessageStatusClass(message.content)">
                <MarkdownRenderer :content="message.content" />
            </div>



            <!-- 互动建议（资讯推送、智能复盘等，不包括自选股） -->
            <div v-if="message.hasInteractionButtons && message.interactionData && !message.isWatchlistDisplay"
                class="interaction-suggestions">
                <div class="suggestion-intro">
                    💡 <span class="intro-text">{{
                        message.isNewsUpdate ? '基于这些资讯，我建议您可以：' :
                            '基于复盘结果，我建议您可以：'
                    }}</span>
                </div>
                <div class="suggestion-items">
                    <div v-for="action in message.interactionData.recommendActions" :key="action.id"
                        @click="$emit('interaction-action', action, message)" class="suggestion-item">
                        <span class="suggestion-icon">{{ action.icon }}</span>
                        <span class="suggestion-text">{{ action.description }}</span>
                        <span class="suggestion-arrow">→</span>
                    </div>
                </div>
            </div>

            <!-- 单只股票操作按钮 -->
            <div v-if="message.hasStockInfo && message.stockInfo" class="stock-actions">
                <StockActionButtons :stock="message.stockInfo" :actions="getChatStockActions(message)"
                    :is-mobile="isMobileView" :mode="message.isBuyMode ? 'minimal' : 'compact'"
                    @action-click="handleChatStockAction" @add-watchlist="(stock) => $emit('add-to-watchlist', stock)"
                    @remove-watchlist="(stock) => $emit('remove-from-watchlist', stock.code)"
                    @show-buy-dialog="(stock) => $emit('show-buy-dialog', stock)"
                    @show-ai-trading-dialog="(stock) => $emit('show-quant-analysis-dialog', stock)" />

                <!-- 设置提醒按钮（仅在量化分析消息中显示） -->
                <el-button v-if="message.isQuantAnalysis" size="small"
                    @click="$emit('set-quant-analysis-reminder', message)" class="reminder-btn-small">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                            fill="currentColor" />
                    </svg>
                    设置提醒
                    <span v-if="activeRemindersCount > 0" class="reminder-count-badge-small">
                        {{ activeRemindersCount }}
                    </span>
                </el-button>
            </div>

            <!-- 自选股列表展示 -->
            <div v-if="message.isWatchlistDisplay && message.watchlistData" class="watchlist-display-container">
                <!-- 概览信息 -->
                <div class="watchlist-overview">
                    <div class="overview-stats">
                        <div class="stat-item total">
                            <div class="stat-icon">⭐</div>
                            <div class="stat-info">
                                <span class="stat-value">{{ message.watchlistStats.total }}</span>
                                <span class="stat-label">关注</span>
                            </div>
                        </div>
                        <div class="stat-item up">
                            <div class="stat-icon">📈</div>
                            <div class="stat-info">
                                <span class="stat-value">{{ message.watchlistStats.upCount }}</span>
                                <span class="stat-label">上涨</span>
                            </div>
                        </div>
                        <div class="stat-item down">
                            <div class="stat-icon">📉</div>
                            <div class="stat-info">
                                <span class="stat-value">{{ message.watchlistStats.downCount }}</span>
                                <span class="stat-label">下跌</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 使用通用股票列表组件 -->
                <StockList v-if="!isMobileView" :stocks="message.watchlistData" :show-watchlist-status="true"
                    :show-basic-details="true" :actions="watchlistActionButtons"
                    @stock-click="$emit('stock-click', $event)"
                    @action-click="$emit('watchlist-action-click', $event)" />
                <MobileStockList v-else :stocks="message.watchlistData" :show-watchlist-status="true"
                    :show-details="true" :actions="watchlistActionButtons" @stock-click="$emit('stock-click', $event)"
                    @action-click="$emit('watchlist-action-click', $event)" />

                <!-- 自选股互动建议 -->
                <div v-if="message.hasInteractionButtons && message.interactionData" class="interaction-suggestions">
                    <div class="suggestion-intro">
                        💡 <span class="intro-text">基于您的自选股，建议您可以：</span>
                    </div>
                    <div class="suggestion-items">
                        <div v-for="action in message.interactionData.recommendActions" :key="action.id"
                            @click="$emit('interaction-action', action, message)" class="suggestion-item">
                            <span class="suggestion-icon">{{ action.icon }}</span>
                            <span class="suggestion-text">{{ action.description }}</span>
                            <span class="suggestion-arrow">→</span>
                        </div>
                    </div>
                    <!-- 自选股时显示更新时间 -->
                    <div v-if="message.watchlistStats" class="suggestion-time">
                        数据更新时间：{{ message.watchlistStats.updateTime }}
                    </div>
                </div>
            </div>

            <!-- 股票账户信息展示 -->
            <div v-if="message.hasAssetInfo && message.assetData" class="stock-account-container">
                <!-- 账户标题 -->
                <div class="account-header">
                    <div class="account-title-section">
                        <h3 class="account-title">📊 我的股票账户</h3>
                        <div class="account-time">{{ formatRecommendationTime(message.timestamp) }}</div>
                    </div>
                </div>

                <!-- 账户总览 -->
                <div class="account-overview">
                    <div class="overview-main">
                        <div class="total-asset-card">
                            <div class="asset-amount">
                                <span class="amount-label">总资产</span>
                                <span class="amount-value">¥{{ formatCurrency(message.assetData.totalAssets) }}</span>
                            </div>
                            <div class="asset-change"
                                :class="[message.assetData.totalProfitPercent >= 0 ? 'profit' : 'loss']">
                                <span class="change-icon">{{ message.assetData.totalProfitPercent >= 0 ? '📈' : '📉'
                                    }}</span>
                                <span class="change-label">今日盈亏：</span>
                                <span class="change-text">
                                    {{ message.assetData.totalProfitPercent >= 0 ? '+' : '' }}¥{{
                                        message.assetData.totalProfit }}
                                    ({{ message.assetData.totalProfitPercent >= 0 ? '+' : '' }}{{
                                        message.assetData.totalProfitPercent }}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="overview-stats">
                        <div class="stat-item">
                            <div class="stat-icon cash">💵</div>
                            <div class="stat-info">
                                <div class="stat-label">可用资金</div>
                                <div class="stat-value">¥{{ formatCurrency(message.assetData.balance) }}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon portfolio">📊</div>
                            <div class="stat-info">
                                <div class="stat-label">持仓市值</div>
                                <div class="stat-value">¥{{ formatCurrency(message.assetData.portfolioValue) }}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon stocks">🏢</div>
                            <div class="stat-info">
                                <div class="stat-label">持仓股票</div>
                                <div class="stat-value">{{ message.assetData.portfolioCount }}只</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon watchlist">⭐</div>
                            <div class="stat-info">
                                <div class="stat-label">自选股票</div>
                                <div class="stat-value">{{ message.assetData.watchlistCount }}只</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab导航和内容 -->
                <div class="account-tabs">
                    <div class="tab-nav">
                        <div class="tab-item" :class="{ active: localActiveTab === 'portfolio' }"
                            @click="localActiveTab = 'portfolio'">
                            📈 持仓明细 ({{ message.assetData.portfolioCount }})
                        </div>
                        <div class="tab-item" :class="{ active: localActiveTab === 'watchlist' }"
                            @click="localActiveTab = 'watchlist'">
                            ⭐ 自选股票 ({{ message.assetData.watchlistCount }})
                        </div>
                    </div>

                    <div class="tab-content">
                        <!-- 持仓明细Tab -->
                        <div v-if="localActiveTab === 'portfolio'" class="tab-panel">
                            <template v-if="message.assetData.portfolioData.length > 0">
                                <StockList v-if="!isMobileView" :stocks="message.assetData.portfolioData"
                                    :show-position-status="true" :show-position-details="true"
                                    :show-basic-details="false" :actions="portfolioActionButtons"
                                    @stock-click="$emit('stock-click', $event)"
                                    @action-click="$emit('portfolio-action-click', $event)" />
                                <MobileStockList v-else :stocks="message.assetData.portfolioData"
                                    :show-position-status="true" :show-details="true" :actions="portfolioActionButtons"
                                    @stock-click="$emit('stock-click', $event)"
                                    @action-click="$emit('portfolio-action-click', $event)" />
                            </template>

                            <!-- 空状态 -->
                            <div v-else class="empty-state">
                                <div class="empty-icon">📊</div>
                                <div class="empty-text">
                                    <h4>暂无持仓</h4>
                                    <p>您还没有购买任何股票，可以通过AI分析后进行投资</p>
                                </div>
                            </div>
                        </div>

                        <!-- 自选股票Tab -->
                        <div v-if="localActiveTab === 'watchlist'" class="tab-panel">
                            <template v-if="message.assetData.watchlistData.length > 0">
                                <StockList v-if="!isMobileView" :stocks="message.assetData.watchlistData"
                                    :show-watchlist-status="true" :show-basic-details="true"
                                    :actions="watchlistActionButtons" @stock-click="$emit('stock-click', $event)"
                                    @action-click="$emit('watchlist-action-click', $event)" />
                                <MobileStockList v-else :stocks="message.assetData.watchlistData"
                                    :show-watchlist-status="true" :show-details="true" :actions="watchlistActionButtons"
                                    @stock-click="$emit('stock-click', $event)"
                                    @action-click="$emit('watchlist-action-click', $event)" />
                            </template>

                            <!-- 空状态 -->
                            <div v-else class="empty-state">
                                <div class="empty-icon">⭐</div>
                                <div class="empty-text">
                                    <h4>暂无自选股</h4>
                                    <p>您还没有添加任何自选股票，可以通过搜索添加关注的股票</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 股票列表（智能荐股等场景） -->
            <div v-if="message.hasStockInfo && message.stockList" class="stock-list"
                :class="{ 'persistent-stock-list': message.isPersistent }">


                <StockList v-if="!isMobileView" :stocks="message.stockList" v-bind="smartRecommendationConfig"
                    @stock-click="$emit('stock-click', $event)" @action-click="$emit('stock-action-click', $event)">
                    <template #toolbar-actions v-if="message.isPersistent">
                        <el-button size="small" text @click="$emit('refresh-recommendation', message)"
                            class="refresh-recommendation-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                                    stroke="currentColor" stroke-width="2" fill="none" />
                            </svg>
                            刷新荐股
                        </el-button>
                    </template>
                </StockList>
                <MobileStockList v-else :stocks="message.stockList" :showRecommendIndex="true" :showDetails="true"
                    :showReason="true" :showTime="true" :timestamp="message.timestamp" :toolbarTitle="'智能荐股'"
                    :showToolbar="true" :actions="mobileSmartRecommendationConfig.actions"
                    @stock-click="$emit('stock-click', $event)" @action-click="$emit('stock-action-click', $event)">
                    <template #toolbar-actions>
                        <button @click="$emit('refresh-recommendation', message)" class="mobile-refresh-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                                    stroke="currentColor" stroke-width="2" fill="none" />
                            </svg>
                        </button>
                    </template>
                </MobileStockList>
            </div>
        </div>

        <!-- AI消息操作按钮（放在消息气泡外面） -->
        <div v-if="message.role === 'assistant' && message.content && !message.isGenerating"
            class="message-actions-external">
            <div class="action-buttons">
                <el-button size="small" text @click="handleCopyMessage" class="action-btn copy-btn"
                    :title="copyButtonText">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor"
                            stroke-width="2" />
                    </svg>
                    <span class="action-text">{{ copyButtonText }}</span>
                </el-button>
                <el-button size="small" text @click="handleRegenerateMessage" class="action-btn regenerate-btn"
                    title="重新生成">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                            stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                    <span class="action-text">重新生成</span>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';
import StockActionButtons from './StockActionButtons.vue';
import { getStockActionConfig } from '../config/stockActionConfig';

// 定义 props
const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    isGenerating: {
        type: Boolean,
        default: false
    },
    isLastMessage: {
        type: Boolean,
        default: false
    },
    isMobileView: {
        type: Boolean,
        default: false
    },
    watchlistActionButtons: {
        type: Array,
        default: () => []
    },
    portfolioActionButtons: {
        type: Array,
        default: () => []
    },
    activeRemindersCount: {
        type: Number,
        default: 0
    },
    isInWatchlist: {
        type: Function,
        required: true
    },
    formatCurrency: {
        type: Function,
        required: true
    },
    formatRecommendationTime: {
        type: Function,
        required: true
    }
});

// 定义事件
const emit = defineEmits([
    'interaction-action',
    'show-buy-dialog',
    'add-to-watchlist',
    'remove-from-watchlist',
    'show-quant-analysis-dialog',
    'set-quant-analysis-reminder',
    'stock-click',
    'watchlist-action-click',
    'portfolio-action-click',
    'stock-action-click',
    'refresh-recommendation',
    'copy-message',
    'regenerate-message'
]);

// 本地状态
const localActiveTab = ref('portfolio');
const copyButtonText = ref('复制');
const isCopying = ref(false);

// 获取消息状态类
const getMessageStatusClass = (content) => {
    if (!content) return '';

    const contentStr = String(content).toLowerCase();

    if (contentStr.includes('[已停止生成]')) {
        return 'message-stopped';
    } else if (contentStr.includes('[连接中断]')) {
        return 'message-interrupted';
    } else if (contentStr.includes('[请求失败]')) {
        return 'message-failed';
    }

    return '';
};

// 聊天消息中的股票操作配置
const getChatStockActions = (message) => {
    if (message.isBuyMode) {
        // 购买模式：优先显示购买按钮
        return getStockActionConfig('chatCompact', {
            isMobile: props.isMobileView,
            maxButtons: 2
        });
    } else {
        // 普通模式：显示完整操作
        return getStockActionConfig('chatFull', {
            isMobile: props.isMobileView,
            maxButtons: props.isMobileView ? 3 : 4
        });
    }
};

// 聊天股票操作事件处理
const handleChatStockAction = (event) => {
    console.log('🚀 ChatMessage - 聊天股票操作:', event);

    // 发送通用的股票操作事件
    emit('stock-action-click', event);

    // 发送具体的操作事件
    switch (event.action) {
        case 'addWatchlist':
            emit('add-to-watchlist', event.stock);
            break;
        case 'removeWatchlist':
            emit('remove-from-watchlist', event.stock.code);
            break;
        case 'buy':
            emit('show-buy-dialog', event.stock);
            break;
        case 'aiTrading':
        case 'quantAnalysis':
            emit('show-quant-analysis-dialog', event.stock);
            break;
    }
};

// 复制消息内容
const handleCopyMessage = async () => {
    if (isCopying.value) return;

    try {
        isCopying.value = true;

        // 获取纯文本内容（去除markdown格式）
        const textContent = props.message.content || '';

        // 使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textContent);
        } else {
            // 降级方案：使用传统的方法
            const textArea = document.createElement('textarea');
            textArea.value = textContent;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }

        // 更新按钮文本
        copyButtonText.value = '已复制';

        // 发送复制事件
        emit('copy-message', {
            message: props.message,
            content: textContent
        });

        // 2秒后恢复按钮文本
        setTimeout(() => {
            copyButtonText.value = '复制';
            isCopying.value = false;
        }, 2000);

    } catch (error) {
        console.error('复制失败:', error);
        copyButtonText.value = '复制失败';

        setTimeout(() => {
            copyButtonText.value = '复制';
            isCopying.value = false;
        }, 2000);
    }
};

// 重新生成消息
const handleRegenerateMessage = () => {
    emit('regenerate-message', {
        message: props.message,
        messageId: props.message.id || props.message.timestamp
    });
};

// 计算属性
const smartRecommendationConfig = computed(() => {
    if (!props.message) return {};
    return {
        showRecommendIndex: true,
        showRecommendTooltip: true,
        showBasicDetails: true,
        showReason: true,
        showTime: true,
        timestamp: props.message.timestamp,
        toolbarTitle: '智能荐股',
        showToolbar: true,
        actions: [
            {
                key: 'addWatchlist',
                text: '加入自选',
                icon: '⭐',
                type: 'primary',
                class: 'add-watchlist-btn'
            },
            {
                key: 'removeWatchlist',
                text: '已加自选',
                icon: '⭐',
                type: 'success',
                class: 'remove-watchlist-btn'
            },
            {
                key: 'paidAnalysis',
                text: '量化分析',
                icon: '🎯',
                type: 'default',
                class: 'paid-analysis-btn',
                priceTag: {
                    original: '2智点',
                    promo: '1智点'
                }
            },
            {
                key: 'quantAnalysis',
                text: 'AI委托交易',
                icon: '🤖',
                type: 'default',
                class: 'quant-analysis-btn',
                priceTag: {
                    original: '3智点',
                    promo: '1智点'
                }
            },
            {
                key: 'buy',
                text: '购买',
                icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
                type: 'default',
                class: 'buy-stock-btn-secondary'
            }
        ]
    };
});

const mobileSmartRecommendationConfig = computed(() => {
    if (!props.message) return {};

    // 调试信息
    if (props.message.hasStockInfo && props.message.stockList) {
        console.log('移动端智能荐股数据:', {
            hasStockInfo: props.message.hasStockInfo,
            stockListLength: props.message.stockList ? props.message.stockList.length : 0,
            stockList: props.message.stockList,
            isMobileView: props.isMobileView,
            timestamp: props.message.timestamp
        });
    }

    return {
        showRecommendIndex: true,
        showRecommendTooltip: true,
        showDetails: true,
        showReason: true,
        showTime: true,
        timestamp: props.message.timestamp,
        toolbarTitle: '智能荐股',
        showToolbar: true,
        actions: [
            {
                key: 'addWatchlist',
                text: '加入自选',
                icon: '⭐',
                type: 'primary',
                class: 'add-watchlist-btn'
            },
            {
                key: 'removeWatchlist',
                text: '已加自选',
                icon: '⭐',
                type: 'success',
                class: 'remove-watchlist-btn'
            },
            {
                key: 'paidAnalysis',
                text: '量化分析',
                icon: '🎯',
                type: 'default',
                class: 'paid-analysis-btn',
                priceTag: {
                    original: '2智点',
                    promo: '1智点'
                }
            },
            {
                key: 'quantAnalysis',
                text: 'AI委托交易',
                icon: '🤖',
                type: 'default',
                class: 'quant-analysis-btn',
                priceTag: {
                    original: '3智点',
                    promo: '1智点'
                }
            },
            {
                key: 'buy',
                text: '购买',
                icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
                type: 'default',
                class: 'buy-stock-btn-secondary'
            }
        ]
    };
});
</script>

<style scoped>
/* 消息气泡基础样式 */
.chat-message {
    display: flex;
    margin-bottom: 24px;
    /* padding: 0 20px; */
    width: 100%;
    box-sizing: border-box;
    flex-direction: column;
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 16px 20px 16px 20px;
    margin-left: auto;
    max-width: 75%;
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 14px 20px 8px 20px;
    margin-right: auto;
    max-width: 100%;
    width: 100%;
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
}

/* 强制清除消息内容的内部间距 */
.chat-message.user .chat-message-content .message-text,
.chat-message.assistant .chat-message-content .message-text {
    margin: 0 !important;
    padding: 0 !important;
}

.chat-message.user .chat-message-content .message-text>*,
.chat-message.assistant .chat-message-content .message-text>* {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
}

/* 用户消息中的markdown内容样式覆盖 */
.chat-message.user .chat-message-content .markdown-content {
    color: white !important;
    display: flex;
    flex-direction: column;
    min-height: fit-content;
    justify-content: flex-start;
}

.chat-message.user .chat-message-content .markdown-content :deep(*) {
    color: inherit !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(strong) {
    color: white !important;
    font-weight: 700;
}

.chat-message.user .chat-message-content .markdown-content :deep(em) {
    color: rgba(255, 255, 255, 0.9) !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(a) {
    color: #87ceeb !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(a:hover) {
    color: #b0e0e6 !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(.inline-code) {
    background: rgba(255, 255, 255, 0.2) !important;
    color: #fff !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(blockquote) {
    background: rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    border-left-color: rgba(255, 255, 255, 0.5) !important;
}

/* 用户消息中的markdown段落间距优化 */
.chat-message.user .chat-message-content .markdown-content :deep(p) {
    margin: 2px 0 !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(p:first-child) {
    margin-top: 0 !important;
}

.chat-message.user .chat-message-content .markdown-content :deep(p:last-child) {
    margin-bottom: 0 !important;
}

/* AI助手消息中的markdown内容样式优化 */
.chat-message.assistant .chat-message-content .markdown-content {
    display: flex;
    flex-direction: column;
    min-height: fit-content;
    justify-content: flex-start;
}

/* AI助手消息中的markdown段落间距优化 */
.chat-message.assistant .chat-message-content .markdown-content :deep(p) {
    margin: 2px 0 !important;
}

.chat-message.assistant .chat-message-content .markdown-content :deep(p:first-child) {
    margin-top: 0 !important;
}

.chat-message.assistant .chat-message-content .markdown-content :deep(p:last-child) {
    margin-bottom: 0 !important;
}

/* 消息状态样式 */
.message-text.message-stopped {
    position: relative;
}

.message-text.message-stopped :deep(p:last-child) {
    border-left: 3px solid #f59e0b;
    padding-left: 12px;
    margin-left: -15px;
    background: rgba(245, 158, 11, 0.1);
    border-radius: 0 6px 6px 0;
    padding-top: 8px;
    padding-bottom: 8px;
    color: #92400e;
    font-weight: 500;
}

.message-text.message-interrupted {
    position: relative;
}

.message-text.message-interrupted :deep(p:last-child) {
    border-left: 3px solid #ef4444;
    padding-left: 12px;
    margin-left: -15px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 0 6px 6px 0;
    padding-top: 8px;
    padding-bottom: 8px;
    color: #dc2626;
    font-weight: 500;
}

.message-text.message-failed {
    position: relative;
}

.message-text.message-failed :deep(p:last-child) {
    border-left: 3px solid #ef4444;
    padding-left: 12px;
    margin-left: -15px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 0 6px 6px 0;
    padding-top: 8px;
    padding-bottom: 8px;
    color: #dc2626;
    font-weight: 500;
}

/* 移动端聊天消息样式优化 */
@media (max-width: 768px) {
    .chat-message {
        margin-bottom: 16px;
    }

    .chat-message:last-child {
        margin-bottom: 32px;
    }

    .chat-message.user .chat-message-content {
        font-size: 0.9rem;
        padding: 12px 16px;
        max-width: 85%;
    }

    .chat-message.assistant .chat-message-content {
        font-size: 0.9rem;
        padding: 12px 16px;
        max-width: 100%;
    }

    /* 移动端状态消息样式调整 */
    .message-text.message-stopped :deep(p:last-child),
    .message-text.message-interrupted :deep(p:last-child),
    .message-text.message-failed :deep(p:last-child) {
        margin-left: -12px;
        padding-left: 10px;
        font-size: 0.85rem;
    }
}

/* 聊天消息基础样式 */
.chat-message {
    margin-bottom: 20px;
}

.chat-message-content {
    max-width: 100%;
}

/* 生成中状态样式 */
.generating-message {
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    border: 1px solid #e1e4ff;
    border-radius: 12px;
    margin-bottom: 12px;
}

.generating-content-inline {
    display: flex;
    align-items: center;
    gap: 12px;
}

.generating-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-bottom: 2px;
}

.generating-dots .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #667eea;
    animation: typing-dots 1.4s ease-in-out infinite;
}

.generating-dots .dot:nth-child(1) {
    animation-delay: 0s;
}

.generating-dots .dot:nth-child(2) {
    animation-delay: 0.2s;
}

.generating-dots .dot:nth-child(3) {
    animation-delay: 0.4s;
}

.generating-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

@keyframes typing-dots {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.4;
    }

    30% {
        transform: translateY(-8px);
        opacity: 1;
    }
}

/* 消息文本样式 */
.message-text {
    line-height: 1.6;
    color: #333;
}

/* AI消息操作按钮样式（外部底部） */
.message-actions-external {
    margin-top: 8px;
    /* 与消息气泡对齐 */
    opacity: 0;
    transition: opacity 0.2s ease;
    width: fit-content;
    clear: both;
    /* 确保独立一行 */
    display: block;
    /* 块级元素 */
}

.chat-message.assistant:hover .message-actions-external {
    opacity: 1;
}

.action-buttons {
    display: flex;
    gap: 0px;
    justify-content: flex-start;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px 4px !important;
    height: auto !important;
    font-size: 11px !important;
    color: #6b7280 !important;
    background: transparent !important;
    border: 1px solid transparent !important;
    border-radius: 4px !important;
    transition: all 0.2s ease;
    min-height: 24px;
}

.action-btn:hover {
    color: #374151 !important;
    background: rgba(0, 0, 0, 0.05) !important;
    border-color: rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-1px);
}

.action-btn:active {
    transform: translateY(0);
}

.action-btn svg {
    flex-shrink: 0;
}

.action-text {
    font-size: 11px;
    font-weight: 500;
}

.copy-btn:hover {
    color: #3b82f6 !important;
    background: rgba(59, 130, 246, 0.1) !important;
    border-color: rgba(59, 130, 246, 0.2) !important;
}

.regenerate-btn:hover {
    color: #10b981 !important;
    background: rgba(16, 185, 129, 0.1) !important;
    border-color: rgba(16, 185, 129, 0.2) !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .message-actions-external {
        opacity: 1;
        /* 移动端始终显示 */
        margin-top: 12px;
        margin-left: 0;
        /* 移动端不需要额外的左边距 */
        display: flex;
        justify-content: flex-start;
    }

    .action-buttons {
        justify-content: flex-start;
        gap: 0px;
        width: fit-content;
    }

    .action-btn {
        padding: 4px 0 !important;
        min-height: 28px;
        gap: 2px;
    }

    .action-text {
        font-size: 11px;
    }
}

/* 互动建议样式 */
.interaction-suggestions {
    margin-top: 16px;
    padding: 16px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.suggestion-intro {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 0.85rem;
    color: #6b7280;
}

.intro-text {
    font-weight: 500;
}

.suggestion-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
}

.suggestion-item:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
    transform: translateX(2px);
}

.suggestion-icon {
    font-size: 1rem;
    flex-shrink: 0;
}

.suggestion-text {
    flex: 1;
    color: #374151;
    line-height: 1.4;
}

.suggestion-arrow {
    color: #94a3b8;
    font-weight: bold;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.suggestion-time {
    margin-top: 10px;
    font-size: 0.75rem;
    color: #64748b;
    text-align: center;
    padding-top: 8px;
    border-top: 1px solid rgba(203, 213, 225, 0.5);
}

/* 移动端适配 */
@media (max-width: 768px) {
    .interaction-suggestions {
        padding: 10px;
        margin-top: 12px;
    }

    .suggestion-intro {
        font-size: 0.8rem;
    }

    .suggestion-item {
        padding: 6px 10px;
        font-size: 0.8rem;
    }

    .suggestion-icon {
        font-size: 0.9rem;
    }
}

/* 股票操作按钮样式 */
.stock-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    flex-wrap: wrap;
}

/* 股票列表样式 */
.stock-list {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* 持久化荐股列表样式 */
.persistent-stock-list {
    position: relative;
    border: 2px solid transparent;
    border-radius: 12px;
    padding: 8px;
    transition: all 0.3s ease;
}

.persistent-stock-list::before {
    content: '📊 智能荐股';
    position: absolute;
    top: -12px;
    left: 12px;
    background: #fef3c7;
    color: #92400e;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 8px;
    border: 1px solid #fbbf24;
}

/* 荐股工具栏样式 */
.recommendation-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 0.875rem;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.recommendation-time {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 500;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.refresh-recommendation-btn {
    color: #6366f1 !important;
    font-size: 0.8rem;
    padding: 4px 8px !important;
    height: auto !important;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    background: transparent !important;
    border: none !important;
}

.refresh-recommendation-btn:hover {
    color: #4f46e5 !important;
    background: #eef2ff !important;
}

/* 高亮效果 */
.highlight-recommendation {
    border-color: #fbbf24 !important;
    background: rgba(254, 243, 199, 0.1) !important;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1) !important;
}

/* 推荐指数样式 */
.recommend-index {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
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

/* 推荐指数提示框样式 */
.recommend-index-tooltip {
    max-width: 300px;
    padding: 8px 0;
}

.tooltip-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e5e7eb;
}

.tooltip-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 0.8rem;
    line-height: 1.4;
}

.tooltip-item:last-child {
    margin-bottom: 0;
}

.tooltip-item .score {
    font-weight: 600;
    color: #f59e0b;
    min-width: 50px;
    flex-shrink: 0;
}

.tooltip-item .desc {
    color: #374151;
    flex: 1;
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

/* 股票项目基础样式 */
.stock-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
    margin-bottom: 12px;
}

.stock-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stock-info {
    margin-bottom: 12px;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
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
    margin-top: 12px;
    padding-top: 12px;
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
    margin-top: 16px;
    flex-wrap: wrap;
    align-items: center;
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
    background: white !important;
    border-color: #9ca3af !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

.buy-stock-btn,
.buy-stock-btn-secondary {
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 卖出按钮样式 */
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

.add-watchlist-btn,
.remove-watchlist-btn {
    display: flex;
    align-items: center;
    gap: 4px;
}

.quant-analysis-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
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

.reminder-btn-small {
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
}

.reminder-count-badge-small {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff4757;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
}

/* 自选股展示样式 */
.watchlist-display-container {
    margin-top: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
}

.watchlist-overview {
    margin-bottom: 16px;
}

.overview-stats {
    display: flex;
    gap: 16px;
    justify-content: space-around;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    flex: 1;
    text-align: center;
}

.stat-item.total .stat-icon {
    font-size: 20px;
}

/* 自选股快览 */
.watchlist-preview {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
}

.watchlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.watchlist-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
}

.watchlist-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.stock-basic {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.stock-basic .stock-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
}

.stock-basic .stock-code {
    font-size: 0.75rem;
    color: #64748b;
}

.stock-price {
    font-size: 1rem;
    font-weight: 700;
    color: #3b82f6;
}

/* 自选股卡片样式 */
.watchlist-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.watchlist-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.3s ease;
}

.watchlist-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
}

.watchlist-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.watchlist-card .stock-info h4.stock-name {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
}

.watchlist-card .stock-code {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
}

.watchlist-card .price-info {
    text-align: right;
}

.watchlist-card .current-price {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.watchlist-card .card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

/* 账户信息样式 */
.account-info-section {
    border-top: 1px solid #eee;
    padding-top: 12px;
}

.account-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 12px;
}

.account-row:last-child {
    margin-bottom: 0;
}

.account-row .label {
    color: #666;
}

.account-row .value {
    color: #333;
    font-weight: 500;
}

.stat-item.up .stat-icon {
    font-size: 18px;
}

.stat-item.down .stat-icon {
    font-size: 18px;
}

.stat-info {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.stat-label {
    font-size: 12px;
    color: #666;
}

/* 股票账户样式 */
.stock-account-container {
    margin-top: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
}

.account-header {
    margin-bottom: 20px;
}

.account-title-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.account-title {
    margin: 0;
    font-size: 18px;
    color: #333;
}

.account-time {
    font-size: 12px;
    color: #999;
}

.account-overview {
    margin-bottom: 20px;
}

.overview-main {
    margin-bottom: 16px;
}

.total-asset-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e1e8ed;
}

.asset-amount {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.amount-label {
    font-size: 14px;
    color: #666;
}

.amount-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.asset-change {
    display: flex;
    align-items: center;
    gap: 8px;
}

.asset-change.profit {
    color: #67c23a;
}

.asset-change.loss {
    color: #f56c6c;
}

.change-icon {
    font-size: 16px;
}

.change-label {
    font-size: 14px;
}

.change-text {
    font-size: 14px;
    font-weight: 500;
}

.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
}

.overview-stats .stat-item {
    background: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e1e8ed;
    display: flex;
    align-items: center;
    gap: 12px;
}

.stat-icon {
    font-size: 20px;
}

.stat-icon.cash {
    color: #67c23a;
}

.stat-icon.portfolio {
    color: #409eff;
}

.stat-icon.stocks {
    color: #e6a23c;
}

.stat-icon.watchlist {
    color: #f56c6c;
}

.overview-stats .stat-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.overview-stats .stat-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.overview-stats .stat-value {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

/* Tab 样式 */
.account-tabs {
    background: white;
    border-radius: 8px;
    border: 1px solid #e1e8ed;
}

.tab-nav {
    display: flex;
    border-bottom: 1px solid #e1e8ed;
}

.tab-item {
    flex: 1;
    padding: 12px 16px;
    text-align: center;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
}

.tab-item:hover {
    background: #f8f9fa;
}

.tab-item.active {
    color: #409eff;
    border-bottom-color: #409eff;
    background: #f0f7ff;
}

.tab-content {
    padding: 16px;
}

.tab-panel {
    min-height: 200px;
}

/* 空状态样式 */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #666;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #333;
}

.empty-text p {
    margin: 0;
    font-size: 14px;
    color: #999;
}

/* 股票列表样式 */
.stock-list {
    margin-top: 16px;
}

.persistent-stock-list {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
}

.refresh-recommendation-btn {
    display: flex;
    align-items: center;
    gap: 6px;
}

.mobile-refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #409eff;
    transition: background 0.2s;
}

.mobile-refresh-btn:hover {
    background: rgba(64, 158, 255, 0.1);
}

/* 移动端适配 */
@media (max-width: 768px) {
    .stock-actions {
        flex-direction: column;
    }

    .overview-stats {
        grid-template-columns: repeat(2, 1fr);
    }

    .asset-amount {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .suggestion-items {
        gap: 12px;
    }

    .suggestion-item {
        padding: 12px;
    }

    .tab-nav {
        flex-direction: column;
    }

    .tab-item {
        border-bottom: 1px solid #e1e8ed;
        border-right: none;
    }

    .tab-item:last-child {
        border-bottom: none;
    }

    .tab-item.active {
        border-bottom-color: transparent;
        border-left: 3px solid #409eff;
    }
}
</style>
