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

                <!-- 流式暂停加载指示器 -->
                <div v-if="message.role === 'assistant' && (isStreamPaused || message.isStreamPaused) && isGenerating && isLastMessage"
                    class="stream-pause-loader">
                    <div class="stream-dots">
                        <span class="stream-dot"></span>
                        <span class="stream-dot"></span>
                        <span class="stream-dot"></span>
                    </div>
                </div>
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
                    @action-click="handleChatStockAction" />

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
                    <div class="overview-stats watchlist-stats">
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

                    <div class="overview-stats asset-stats">
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
                <el-button size="small" text @click="handleShareMessage" class="action-btn share-btn" title="分享"
                    :loading="isGeneratingImage" :disabled="isGeneratingImage">
                    <svg v-if="!isGeneratingImage" width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
                            stroke="currentColor" stroke-width="2" fill="none" />
                    </svg>
                    <span class="action-text">{{ isGeneratingImage ? '生成中...' : '分享' }}</span>
                </el-button>
            </div>
        </div>

        <!-- 图片预览弹框 - PC端 -->
        <el-dialog v-if="!isMobileView" v-model="showImagePreview" title="分享预览" width="600px" :show-close="true"
            @close="closePreview" class="image-preview-dialog" :modal="true" :append-to-body="true"
            :close-on-click-modal="true">
            <div class="preview-container">
                <div class="preview-image-wrapper">
                    <img v-if="previewImageUrl" :src="previewImageUrl" alt="分享预览" class="preview-image" />
                </div>
                <div class="preview-actions">
                    <el-button @click="closePreview" size="default">取消</el-button>
                    <el-button type="primary" @click="downloadImage" size="default">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="margin-right: 4px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"
                                stroke-width="2" />
                            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" />
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" />
                        </svg>
                        下载图片
                    </el-button>
                </div>
            </div>
        </el-dialog>

        <!-- 移动端分享弹窗 -->
        <Teleport v-if="isMobileView && showImagePreview" to="body">
            <div class="mobile-share-overlay" @click="closePreview">
                <div class="mobile-share-dialog" @click.stop>
                    <!-- 移动端拖拽指示器 -->
                    <div class="mobile-drag-indicator" @touchstart="handleShareTouchStart"
                        @touchmove="handleShareTouchMove" @touchend="handleShareTouchEnd"></div>

                    <!-- 移动端头部 -->
                    <div class="mobile-share-header">
                        <h3 class="mobile-share-title">分享预览</h3>
                        <button class="mobile-close-btn" @click="closePreview">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>
                    </div>

                    <!-- 移动端内容区域 -->
                    <div class="mobile-share-content">
                        <div class="mobile-image-wrapper">
                            <img v-if="previewImageUrl" :src="previewImageUrl" alt="分享预览"
                                class="mobile-preview-image" />
                        </div>
                    </div>

                    <!-- 移动端底部操作区 -->
                    <div class="mobile-share-actions">
                        <button class="mobile-action-btn mobile-cancel-btn" @click="closePreview">
                            取消
                        </button>
                        <button class="mobile-action-btn mobile-download-btn" @click="downloadImage">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 6px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor"
                                    stroke-width="2" />
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" />
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" />
                            </svg>
                            下载图片
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
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
    },
    isStreamPaused: {
        type: Boolean,
        default: false
    },
    // 新增props用于分享功能
    sessionTitle: {
        type: String,
        default: 'AI 智能分析'
    },
    chatHistory: {
        type: Array,
        default: () => []
    },
    messageIndex: {
        type: Number,
        default: 0
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
    'regenerate-message',
    'share-message'
]);

// 本地状态
const localActiveTab = ref('portfolio');
const copyButtonText = ref('复制');
const isCopying = ref(false);
const showImagePreview = ref(false);
const previewImageUrl = ref('');
const isGeneratingImage = ref(false);

// 移动端分享弹窗拖拽状态
const shareTouchStartY = ref(null);
const shareTouchStartTime = ref(null);

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
    let actions;
    if (message.isBuyMode) {
        // 购买模式：优先显示购买按钮
        actions = getStockActionConfig('chatCompact', {
            isMobile: props.isMobileView,
            maxButtons: 2
        });
    } else {
        // 普通模式：显示完整操作
        actions = getStockActionConfig('chatFull', {
            isMobile: props.isMobileView,
            maxButtons: props.isMobileView ? 3 : 4
        });
    }
    // 量化分析内容不显示量化分析按钮
    if (message.isQuantAnalysis) {
        actions = actions.filter(a => a.key !== 'paidAnalysis' && a.key !== 'analysis');
    }
    return actions;
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
        case 'sell':
            emit('show-buy-dialog', event.stock);
            break;
        case 'analysis':
        case 'paidAnalysis':
            emit('show-analysis-dialog', event.stock);
            break;
        case 'aiTrading':
        case 'quantAnalysis':
            emit('show-quant-analysis-dialog', event.stock);
            break;
        default:
            console.warn('未处理的股票操作:', event.action);
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

// 获取前一条用户消息
const getPreviousUserMessage = () => {
    if (!props.chatHistory || props.chatHistory.length === 0) {
        return '用户提问';
    }

    // 从当前消息索引向前查找最近的用户消息
    for (let i = props.messageIndex - 1; i >= 0; i--) {
        const message = props.chatHistory[i];
        if (message && message.role === 'user' && message.content) {
            return message.content;
        }
    }

    // 如果没有找到用户消息，返回默认值
    return '用户提问';
};

// 确保文本选择功能正常工作
const ensureTextSelectable = () => {
    // 在组件挂载后确保文本可选择
    nextTick(() => {
        const messageElement = document.querySelector('.chat-message-content');
        if (messageElement) {
            // 强制设置文本选择样式
            messageElement.style.userSelect = 'text';
            messageElement.style.webkitUserSelect = 'text';
            messageElement.style.mozUserSelect = 'text';
            messageElement.style.msUserSelect = 'text';

            // 对所有子元素也设置文本选择
            const allChildren = messageElement.querySelectorAll('*');
            allChildren.forEach(child => {
                child.style.userSelect = 'text';
                child.style.webkitUserSelect = 'text';
                child.style.mozUserSelect = 'text';
                child.style.msUserSelect = 'text';
            });
        }
    });
};

// 在组件挂载时确保文本可选择
onMounted(() => {
    ensureTextSelectable();

    // 添加调试信息
    console.log('ChatMessage mounted, text selection should be enabled');

    // 验证文本选择功能
    nextTick(() => {
        const messageContent = document.querySelector('.chat-message-content');
        if (messageContent) {
            const computedStyle = window.getComputedStyle(messageContent);
            console.log('Message content user-select:', computedStyle.userSelect);
            console.log('Message content -webkit-user-select:', computedStyle.webkitUserSelect);
        }
    });
});

// 分享消息为图片 - 生成预览
const handleShareMessage = async () => {
    if (isGeneratingImage.value) return;

    try {
        isGeneratingImage.value = true;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置画布尺寸 - 动态计算高度
        const width = 750;
        let height = 1000; // 初始高度，后面会根据内容调整
        canvas.width = width;
        canvas.height = height;

        // 设置高质量渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 纯白背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 绘制顶部标题区域
        const headerY = 60;
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        ctx.textAlign = 'left';

        // 使用会话标题
        const title = props.sessionTitle || 'AI 智能分析';
        ctx.fillText(title, 40, headerY);

        // 绘制时间和来源信息
        ctx.fillStyle = '#999999';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        const timeText = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        ctx.fillText(`${timeText} · 内容由 AI 生成，不能完全保障准确性`, 40, headerY + 30);

        // 绘制分割线
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, headerY + 50);
        ctx.lineTo(width - 40, headerY + 50);
        ctx.stroke();

        // 用户输入气泡（右侧）- 参照当前聊天气泡样式
        const userBubbleY = headerY + 80;

        // 获取前一条用户消息
        const userInput = getPreviousUserMessage();

        // 处理用户消息的换行 - 使用简化的换行处理逻辑
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        const userMaxWidth = 300; // 用户气泡最大宽度
        const userLines = wrapUserMessage(ctx, userInput, userMaxWidth);

        // 计算用户气泡的实际尺寸
        const userLineHeight = 20; // 用户气泡行高稍小一些
        const userPadding = 16; // 用户气泡内边距
        const userBubbleHeight = Math.max(40, userLines.length * userLineHeight + userPadding * 2);

        // 计算用户气泡的宽度 - 基于最长行的宽度
        let maxLineWidth = 0;
        userLines.forEach(line => {
            const lineWidth = ctx.measureText(line.text).width;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
        });
        const userBubbleWidth = Math.max(maxLineWidth + userPadding * 2, 120); // 最小宽度120px
        const userBubbleX = width - 40 - userBubbleWidth;

        // 绘制用户输入气泡 - 参照聊天气泡样式（右上角有小圆角）
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        // 手动绘制圆角矩形，模拟 18px 18px 4px 18px 的效果
        const r1 = 18, r2 = 4; // 大圆角和小圆角
        ctx.moveTo(userBubbleX + r1, userBubbleY);
        ctx.lineTo(userBubbleX + userBubbleWidth - r1, userBubbleY);
        ctx.arcTo(userBubbleX + userBubbleWidth, userBubbleY, userBubbleX + userBubbleWidth, userBubbleY + r1, r1);
        ctx.lineTo(userBubbleX + userBubbleWidth, userBubbleY + userBubbleHeight - r2);
        ctx.arcTo(userBubbleX + userBubbleWidth, userBubbleY + userBubbleHeight, userBubbleX + userBubbleWidth - r2, userBubbleY + userBubbleHeight, r2);
        ctx.lineTo(userBubbleX + r1, userBubbleY + userBubbleHeight);
        ctx.arcTo(userBubbleX, userBubbleY + userBubbleHeight, userBubbleX, userBubbleY + userBubbleHeight - r1, r1);
        ctx.lineTo(userBubbleX, userBubbleY + r1);
        ctx.arcTo(userBubbleX, userBubbleY, userBubbleX + r1, userBubbleY, r1);
        ctx.closePath();
        ctx.fill();

        // 用户输入文字 - 支持多行显示
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';

        let userCurrentY = userBubbleY + userPadding + 14; // 14px是字体的基线偏移
        userLines.forEach((line) => {
            renderFormattedLine(ctx, line, userBubbleX + userPadding, userCurrentY);
            userCurrentY += userLineHeight;
        });

        // AI回复区域（左侧）- 参照当前聊天气泡样式，铺满屏幕宽度
        const aiReplyY = userBubbleY + userBubbleHeight + 20; // 调整间距，基于用户气泡的实际高度
        const aiReplyBubbleX = 40; // 从左边距开始
        const aiReplyBubbleWidth = width - 80; // 铺满屏幕宽度，左右各留40px边距
        const messageContent = props.message.content || '暂无内容';

        // 设置字体用于测量 - 与聊天界面保持一致
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

        // 计算AI回复内容的换行和高度 - 确保有足够的边距
        const textMaxWidth = aiReplyBubbleWidth - 40; // 减去左右padding (20px * 2)
        console.log('🔍 文本换行调试信息:', {
            aiReplyBubbleWidth,
            textMaxWidth,
            messageContentLength: messageContent.length,
            messageContentPreview: messageContent.substring(0, 100) + '...',
            hasBoldMarkers: messageContent.includes('**'),
            boldMatches: messageContent.match(/\*\*(.*?)\*\*/g)
        });

        const lines = wrapTextWithFormat(ctx, messageContent, textMaxWidth);
        console.log('🔍 换行结果:', {
            linesCount: lines.length,
            lines: lines.slice(0, 3).map(line => ({
                text: line.text,
                partsCount: line.parts.length,
                hasBold: line.parts.some(part => part.bold)
            })), // 只显示前3行
            maxLineLength: Math.max(...lines.map(line => line.text.length))
        });

        const lineHeight = 24; // 与聊天界面的line-height: 1.5保持一致
        const padding = 20; // 与聊天界面的padding保持一致
        const aiReplyBubbleHeight = Math.max(50, lines.length * lineHeight + padding * 2);

        // 计算实际需要的总高度
        const headerHeight = 120; // 标题区域高度
        const bubbleSpacing = 20; // 气泡间距（已调整）
        const footerHeight = 150; // 底部区域高度
        const actualHeight = headerHeight + userBubbleHeight + bubbleSpacing + aiReplyBubbleHeight + footerHeight;

        // 如果实际高度超过初始高度，重新设置画布尺寸
        if (actualHeight > height) {
            height = actualHeight + 50; // 额外添加50px底部边距
            canvas.height = height;

            // 重新填充背景色（因为画布尺寸改变了）
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 重新绘制标题和时间信息
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            const title = props.sessionTitle || 'AI 智能分析';
            ctx.fillText(title, 40, headerY);

            ctx.fillStyle = '#999999';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            const timeText = new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            ctx.fillText(`${timeText} · 内容由 AI 生成，不能完全保障准确性`, 40, headerY + 30);

            // 重新绘制分割线
            ctx.strokeStyle = '#e5e5e5';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, headerY + 50);
            ctx.lineTo(width - 40, headerY + 50);
            ctx.stroke();

            // 重新绘制用户气泡
            ctx.fillStyle = '#007AFF';
            ctx.beginPath();
            const r1 = 18, r2 = 4;
            ctx.moveTo(userBubbleX + r1, userBubbleY);
            ctx.lineTo(userBubbleX + userBubbleWidth - r1, userBubbleY);
            ctx.arcTo(userBubbleX + userBubbleWidth, userBubbleY, userBubbleX + userBubbleWidth, userBubbleY + r1, r1);
            ctx.lineTo(userBubbleX + userBubbleWidth, userBubbleY + userBubbleHeight - r2);
            ctx.arcTo(userBubbleX + userBubbleWidth, userBubbleY + userBubbleHeight, userBubbleX + userBubbleWidth - r2, userBubbleY + userBubbleHeight, r2);
            ctx.lineTo(userBubbleX + r1, userBubbleY + userBubbleHeight);
            ctx.arcTo(userBubbleX, userBubbleY + userBubbleHeight, userBubbleX, userBubbleY + userBubbleHeight - r1, r1);
            ctx.lineTo(userBubbleX, userBubbleY + r1);
            ctx.arcTo(userBubbleX, userBubbleY, userBubbleX + r1, userBubbleY, r1);
            ctx.closePath();
            ctx.fill();

            // 重新绘制用户文字 - 支持多行显示
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';

            let userCurrentY = userBubbleY + userPadding + 14; // 14px是字体的基线偏移
            userLines.forEach((line) => {
                renderFormattedLine(ctx, line, userBubbleX + userPadding, userCurrentY);
                userCurrentY += userLineHeight;
            });
        }

        console.log('🔍 画布尺寸调整:', {
            originalHeight: 1000,
            actualHeight,
            finalHeight: height,
            aiReplyBubbleHeight,
            linesCount: lines.length
        });

        // 绘制AI回复气泡 - 参照聊天气泡样式（左下角有小圆角）
        ctx.fillStyle = '#f1f3f4'; // 与聊天界面的背景色保持一致
        ctx.beginPath();
        // 手动绘制圆角矩形，模拟 18px 18px 18px 4px 的效果
        const ar1 = 18, ar2 = 4; // 大圆角和小圆角
        ctx.moveTo(aiReplyBubbleX + ar1, aiReplyY);
        ctx.lineTo(aiReplyBubbleX + aiReplyBubbleWidth - ar1, aiReplyY);
        ctx.arcTo(aiReplyBubbleX + aiReplyBubbleWidth, aiReplyY, aiReplyBubbleX + aiReplyBubbleWidth, aiReplyY + ar1, ar1);
        ctx.lineTo(aiReplyBubbleX + aiReplyBubbleWidth, aiReplyY + aiReplyBubbleHeight - ar1);
        ctx.arcTo(aiReplyBubbleX + aiReplyBubbleWidth, aiReplyY + aiReplyBubbleHeight, aiReplyBubbleX + aiReplyBubbleWidth - ar1, aiReplyY + aiReplyBubbleHeight, ar1);
        ctx.lineTo(aiReplyBubbleX + ar2, aiReplyY + aiReplyBubbleHeight);
        ctx.arcTo(aiReplyBubbleX, aiReplyY + aiReplyBubbleHeight, aiReplyBubbleX, aiReplyY + aiReplyBubbleHeight - ar2, ar2);
        ctx.lineTo(aiReplyBubbleX, aiReplyY + ar1);
        ctx.arcTo(aiReplyBubbleX, aiReplyY, aiReplyBubbleX + ar1, aiReplyY, ar1);
        ctx.closePath();
        ctx.fill();

        // AI回复文字 - 支持格式化文本渲染
        ctx.fillStyle = '#18181b'; // 与聊天界面的文字颜色保持一致
        ctx.textAlign = 'left';

        let currentY = aiReplyY + padding + 16; // 16px是字体的基线偏移
        lines.forEach((line) => {
            renderFormattedLine(ctx, line, aiReplyBubbleX + padding, currentY);
            currentY += lineHeight;
        });

        // 底部区域 - 根据实际高度调整位置
        const footerY = height - 150;

        // 绘制AI助手信息
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('InvestAI', 40, footerY);

        ctx.fillStyle = '#999999';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
        ctx.fillText('你的AI投资助手，助力智能投资决策', 40, footerY + 25);

        // 绘制Logo区域
        const logoSize = 80;
        const logoX = width - 40 - logoSize;
        const logoY = footerY - 20;

        // 加载并绘制项目Logo
        const logoImg = new Image();
        logoImg.onload = () => {
            // Logo背景（圆角白色背景）
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
            ctx.fill();

            // Logo边框
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 绘制Logo图片（留8px边距）
            ctx.drawImage(logoImg, logoX + 8, logoY + 8, logoSize - 16, logoSize - 16);

            // 转换为图片URL并显示预览
            canvas.toBlob((blob) => {
                previewImageUrl.value = URL.createObjectURL(blob);
                showImagePreview.value = true;
                isGeneratingImage.value = false;
            }, 'image/png', 0.95);
        };

        logoImg.onerror = () => {
            console.warn('Logo图片加载失败，使用备用方案');
            // 备用方案：绘制文字Logo
            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
            ctx.fill();

            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 绘制InvestAI文字Logo
            ctx.fillStyle = '#007AFF';
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('InvestAI', logoX + logoSize / 2, logoY + logoSize / 2 + 5);

            // 转换为图片URL并显示预览
            canvas.toBlob((blob) => {
                previewImageUrl.value = URL.createObjectURL(blob);
                showImagePreview.value = true;
                isGeneratingImage.value = false;
            }, 'image/png', 0.95);
        };

        // 设置图片源，开始加载
        logoImg.src = '/logo.png';

        // 发送分享事件
        emit('share-message', {
            message: props.message,
            messageId: props.message.id || props.message.timestamp
        });

    } catch (error) {
        console.error('分享图片生成失败:', error);
        isGeneratingImage.value = false;
    }
};

// 下载图片
const downloadImage = () => {
    if (!previewImageUrl.value) return;

    const a = document.createElement('a');
    a.href = previewImageUrl.value;
    a.download = `InvestAI-分享-${new Date().getTime()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// 关闭预览
const closePreview = () => {
    showImagePreview.value = false;
    if (previewImageUrl.value) {
        URL.revokeObjectURL(previewImageUrl.value);
        previewImageUrl.value = '';
    }
};

// 移动端分享弹窗拖拽处理
const handleShareTouchStart = (e) => {
    shareTouchStartY.value = e.touches[0].clientY;
    shareTouchStartTime.value = Date.now();
};

const handleShareTouchMove = (e) => {
    if (!shareTouchStartY.value) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - shareTouchStartY.value;

    // 只允许向下拖拽关闭弹窗
    if (deltaY > 0) {
        e.preventDefault();
        const dialog = document.querySelector('.mobile-share-dialog');
        if (dialog) {
            const translateY = Math.min(deltaY * 0.5, 100);
            dialog.style.transform = `translateY(${translateY}px)`;
            dialog.style.opacity = Math.max(1 - deltaY / 300, 0.5);
        }
    }
};

const handleShareTouchEnd = (e) => {
    if (!shareTouchStartY.value) return;

    const currentY = e.changedTouches[0].clientY;
    const deltaY = currentY - shareTouchStartY.value;
    const deltaTime = Date.now() - shareTouchStartTime.value;
    const dialog = document.querySelector('.mobile-share-dialog');

    // 重置样式
    if (dialog) {
        dialog.style.transform = '';
        dialog.style.opacity = '';
    }

    // 判断是否应该关闭弹窗
    const shouldClose = deltaY > 100 || (deltaY > 50 && deltaTime < 300);

    if (shouldClose) {
        closePreview();
    }

    shareTouchStartY.value = null;
    shareTouchStartTime.value = null;
};

// 解析文本中的格式化标记
const parseTextWithFormat = (text) => {
    const parts = [];
    let currentIndex = 0;

    // 匹配加粗文本 **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        // 添加普通文本部分
        if (match.index > currentIndex) {
            parts.push({
                text: text.substring(currentIndex, match.index),
                bold: false
            });
        }

        // 添加加粗文本部分
        parts.push({
            text: match[1],
            bold: true
        });

        currentIndex = match.index + match[0].length;
    }

    // 添加剩余的普通文本
    if (currentIndex < text.length) {
        parts.push({
            text: text.substring(currentIndex),
            bold: false
        });
    }

    return parts;
};

// 文本换行处理函数 - 支持格式化文本
const wrapTextWithFormat = (ctx, text, maxWidth) => {
    // 清理文本但保留加粗标记和换行符
    const cleanText = text
        .replace(/\*(.*?)\*/g, '$1')      // 移除斜体
        .replace(/`(.*?)`/g, '$1')        // 移除代码块
        .replace(/#{1,6}\s/g, '')         // 移除标题
        .replace(/>\s/g, '')              // 移除引用
        .replace(/\n\s*\n/g, '\n')        // 合并多个换行
        .trim();

    const paragraphs = cleanText.split('\n');
    const lines = [];

    paragraphs.forEach(paragraph => {
        // 先清理段落首尾空格
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) return;

        // 解析段落中的格式化文本
        const parts = parseTextWithFormat(trimmedParagraph);
        let currentLine = { text: '', parts: [] };

        parts.forEach(part => {
            if (!part.text) return;

            // 逐字符处理每个部分
            for (let i = 0; i < part.text.length; i++) {
                const char = part.text[i];

                // 设置字体以测量宽度
                if (part.bold) {
                    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
                } else {
                    ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
                }

                const testText = currentLine.text + char;
                const metrics = ctx.measureText(testText);

                if (metrics.width > maxWidth && currentLine.text.trim()) {
                    // 换行 - 确保当前行有实际内容才换行
                    lines.push({
                        text: currentLine.text.trim(), // 去除行尾空格
                        parts: currentLine.parts.filter(p => p.text.trim()) // 过滤空白parts
                    });
                    currentLine = {
                        text: char.trim() ? char : '', // 如果新行首字符是空格，则忽略
                        parts: char.trim() ? [{ text: char, bold: part.bold }] : []
                    };
                } else {
                    // 添加到当前行
                    currentLine.text += char;

                    // 更新parts数组
                    if (currentLine.parts.length > 0 &&
                        currentLine.parts[currentLine.parts.length - 1].bold === part.bold) {
                        // 如果格式相同，合并到最后一个part
                        currentLine.parts[currentLine.parts.length - 1].text += char;
                    } else {
                        // 如果格式不同，创建新的part
                        currentLine.parts.push({ text: char, bold: part.bold });
                    }
                }
            }
        });

        // 添加最后一行 - 清理首尾空格
        if (currentLine.text.trim()) {
            lines.push({
                text: currentLine.text.trim(),
                parts: currentLine.parts.map(part => ({
                    ...part,
                    text: part.text.trim()
                })).filter(part => part.text) // 过滤空白parts
            });
        }
    });

    return lines;
};

// 渲染带格式的文本行
const renderFormattedLine = (ctx, line, x, y) => {
    let currentX = x;

    line.parts.forEach(part => {
        if (!part.text) return;

        // 设置字体
        if (part.bold) {
            ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
            // 额外设置字体权重确保加粗效果
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowOffsetX = 0.5;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
        } else {
            ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
        }

        // 绘制文本
        ctx.fillText(part.text, currentX, y);

        // 如果是加粗文本，再次绘制以增强效果
        if (part.bold) {
            ctx.fillText(part.text, currentX + 0.5, y);
            ctx.restore();
        }

        // 更新x位置
        const metrics = ctx.measureText(part.text);
        currentX += metrics.width;
    });
};

// 计算属性
const smartRecommendationConfig = computed(() => {
    if (!props.message) return {};

    // 基础操作按钮
    const baseActions = [
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
        }
    ];

    // 如果不是量化分析内容，则添加量化分析按钮
    if (!props.message.isQuantAnalysis) {
        baseActions.push({
            key: 'paidAnalysis',
            text: '量化分析',
            icon: '🎯',
            type: 'default',
            class: 'paid-analysis-btn',
            priceTag: {
                original: '2智点',
                promo: '1智点'
            }
        });
    }

    // 添加其他操作按钮
    baseActions.push(
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
    );

    return {
        showRecommendIndex: true,
        showRecommendTooltip: true,
        showBasicDetails: true,
        showReason: true,
        showTime: true,
        timestamp: props.message.timestamp,
        toolbarTitle: '智能荐股',
        showToolbar: true,
        actions: baseActions
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

    // 基础操作按钮
    const baseActions = [
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
        }
    ];

    // 如果不是量化分析内容，则添加量化分析按钮
    if (!props.message.isQuantAnalysis) {
        baseActions.push({
            key: 'paidAnalysis',
            text: '量化分析',
            icon: '🎯',
            type: 'default',
            class: 'paid-analysis-btn',
            priceTag: {
                original: '2智点',
                promo: '1智点'
            }
        });
    }

    // 添加其他操作按钮
    baseActions.push(
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
    );

    return {
        showRecommendIndex: true,
        showRecommendTooltip: true,
        showDetails: true,
        showReason: true,
        showTime: true,
        timestamp: props.message.timestamp,
        toolbarTitle: '智能荐股',
        showToolbar: true,
        actions: baseActions
    };
});

// 用户消息简化换行处理函数
const wrapUserMessage = (ctx, text, maxWidth) => {
    // 保留原始换行符，但清理多余空格
    const cleanText = text
        .replace(/[ \t]+/g, ' ')        // 将多个空格/制表符合并为一个空格
        .replace(/\n[ \t]+/g, '\n')     // 去除换行后的空格/制表符
        .replace(/[ \t]+\n/g, '\n')     // 去除换行前的空格/制表符
        .trim();

    const paragraphs = cleanText.split('\n');
    const lines = [];

    paragraphs.forEach(paragraph => {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) return;

        // 智能换行处理
        let currentLine = '';
        let lastSpaceIndex = -1;

        for (let i = 0; i < trimmedParagraph.length; i++) {
            const char = trimmedParagraph[i];
            const testText = currentLine + char;

            ctx.font = '16px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';
            const metrics = ctx.measureText(testText);

            // 记录最后一个空格的位置
            if (char === ' ') {
                lastSpaceIndex = currentLine.length;
            }

            if (metrics.width > maxWidth && currentLine.length > 0) {
                // 需要换行
                if (lastSpaceIndex > 0 && lastSpaceIndex < currentLine.length) {
                    // 在最后一个空格处换行（智能换行）
                    const lineToAdd = currentLine.substring(0, lastSpaceIndex).trim();
                    const remainingText = currentLine.substring(lastSpaceIndex + 1) + char;

                    if (lineToAdd) {
                        lines.push({
                            text: lineToAdd,
                            parts: [{ text: lineToAdd, bold: false }]
                        });
                    }

                    currentLine = remainingText;
                    lastSpaceIndex = -1;
                } else {
                    // 强制换行（没有合适的空格位置）
                    const lineToAdd = currentLine.trim();
                    if (lineToAdd) {
                        lines.push({
                            text: lineToAdd,
                            parts: [{ text: lineToAdd, bold: false }]
                        });
                    }

                    currentLine = char === ' ' ? '' : char;
                    lastSpaceIndex = -1;
                }
            } else {
                currentLine += char;
            }
        }

        // 添加最后一行
        if (currentLine.trim()) {
            lines.push({
                text: currentLine.trim(),
                parts: [{ text: currentLine.trim(), bold: false }]
            });
        }
    });

    return lines;
};
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

/* 确保整个聊天消息内容都可以被选择 */
.chat-message-content,
.chat-message-content *,
.chat-message-content :deep(*) {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
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
    /* background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    border: 1px solid #e1e4ff; */
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

/* 流式暂停加载指示器样式 */
.stream-pause-loader {
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    margin-top: 4px;
}

.stream-dots {
    display: inline-flex;
    gap: 3px;
    align-items: center;
}

.stream-dots .stream-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #94a3b8;
    animation: stream-pulse 1.2s ease-in-out infinite;
}

.stream-dots .stream-dot:nth-child(1) {
    animation-delay: 0s;
}

.stream-dots .stream-dot:nth-child(2) {
    animation-delay: 0.15s;
}

.stream-dots .stream-dot:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes stream-pulse {

    0%,
    60%,
    100% {
        transform: scale(1);
        opacity: 0.5;
    }

    30% {
        transform: scale(1.2);
        opacity: 1;
    }
}

/* 消息文本样式 */
.message-text {
    line-height: 1.6;
    color: #333;
    /* 确保消息文本可以被选择 */
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
}

/* 确保消息文本的所有子元素都可以被选择 */
.message-text *,
.message-text :deep(*) {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
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

.share-btn:hover {
    color: #f59e0b !important;
    background: rgba(245, 158, 11, 0.1) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
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
    display: grid;
    gap: 16px;
    justify-content: center;
    margin-bottom: 16px;
}

/* 自选股统计 - 3列布局 */
.overview-stats.watchlist-stats {
    grid-template-columns: repeat(3, 1fr);
}

/* 资产分析统计 - 4列布局 */
.overview-stats.asset-stats {
    grid-template-columns: repeat(4, 1fr);
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
    gap: 12px;
    justify-content: center;
    margin-bottom: 16px;
}

/* 自选股统计 - 3列布局 */
.overview-stats.watchlist-stats {
    grid-template-columns: repeat(3, 1fr);
}

/* 资产分析统计 - 4列布局 */
.overview-stats.asset-stats {
    grid-template-columns: repeat(4, 1fr);
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

/* 图片预览弹框样式 - 适中尺寸 */
.image-preview-dialog :deep(.el-dialog) {
    max-width: 90vw;
    max-height: 90vh;
    border-radius: 12px;
}

.image-preview-dialog :deep(.el-dialog__header) {
    background: #f8f9fa;
    padding: 16px 20px;
    border-bottom: 1px solid #e9ecef;
}

.image-preview-dialog :deep(.el-dialog__title) {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.image-preview-dialog :deep(.el-dialog__body) {
    padding: 0;
    max-height: 70vh;
    overflow: hidden;
}

.preview-container {
    display: flex;
    flex-direction: column;
    background: #f8f9fa;
}

.preview-image-wrapper {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 20px;
    background: #f8f9fa;
    max-height: 70vh;
    overflow: auto;
}

.preview-image {
    max-width: 100%;
    max-height: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: white;
    object-fit: contain;
}

.preview-actions {
    display: flex;
    justify-content: space-between;
    padding: 16px 20px;
    background: white;
    border-top: 1px solid #e9ecef;
    gap: 12px;
}

.preview-actions .el-button {
    flex: 1;
    height: 36px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
}

.preview-actions .el-button:first-child {
    background: #f8f9fa;
    border-color: #e9ecef;
    color: #666;
}

.preview-actions .el-button:first-child:hover {
    background: #e9ecef;
    border-color: #dee2e6;
}

.preview-actions .el-button[type="primary"] {
    background: #007AFF;
    border-color: #007AFF;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-actions .el-button[type="primary"]:hover {
    background: #0056CC;
    border-color: #0056CC;
}

/* 移动端预览弹框适配 */
@media (max-width: 768px) {
    .image-preview-dialog :deep(.el-dialog) {
        max-width: 95vw;
        max-height: 85vh;
        margin: 5vh auto;
    }

    .preview-image-wrapper {
        max-height: 60vh;
        padding: 16px;
    }

    .preview-image {
        max-height: none;
    }

    .preview-actions {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e9ecef;
    }

    .preview-actions .el-button {
        height: 34px;
        font-size: 13px;
    }
}

/* 移动端适配 */
@media (max-width: 768px) {
    .stock-actions {
        flex-direction: column;
    }

    .overview-stats.watchlist-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
    }

    .overview-stats.asset-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
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

/* 移动端分享弹窗样式 */
.mobile-share-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: mobile-fade-in 0.3s ease-out;
}

.mobile-share-dialog {
    width: 100%;
    max-height: 90vh;
    background: white;
    border-radius: 20px 20px 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: mobile-slide-up 0.3s ease-out;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.15);
}

.mobile-drag-indicator {
    width: 40px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 12px auto 8px auto;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.mobile-drag-indicator::before {
    content: '';
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    /* 增加触摸区域但不影响视觉显示 */
}

.mobile-drag-indicator:active {
    background: #9ca3af;
}

.mobile-share-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
    flex-shrink: 0;
}

.mobile-share-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.mobile-close-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mobile-close-btn:active {
    background: #e0e0e0;
    transform: scale(0.95);
}

.mobile-share-content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 20px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.mobile-image-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.mobile-preview-image {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    background: white;
    object-fit: contain;
}

.mobile-share-actions {
    display: flex;
    gap: 12px;
    padding: 20px;
    background: white;
    border-top: 1px solid #e9ecef;
    flex-shrink: 0;
}

.mobile-action-btn {
    flex: 1;
    height: 48px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.mobile-cancel-btn {
    background: #f8f9fa;
    color: #666;
    border: 1px solid #e9ecef;
}

.mobile-cancel-btn:active {
    background: #e9ecef;
    transform: scale(0.98);
}

.mobile-download-btn {
    background: #007AFF;
    color: white;
    border: 1px solid #007AFF;
}

.mobile-download-btn:active {
    background: #0056CC;
    transform: scale(0.98);
}

/* 移动端分享弹窗动画 */
@keyframes mobile-fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes mobile-slide-up {
    from {
        opacity: 0;
        transform: translateY(100%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
