<template>
    <div class="sidebar-container" :class="{ 'collapsed': isCollapsed }" @wheel.stop>
        <!-- 收起/展开按钮 -->
        <button class="sidebar-toggle" @click="toggleSidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': isCollapsed }">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        <div class="sidebar-content" v-show="!isCollapsed">
            <!-- Tab导航 -->
            <div class="tab-nav">
                <div class="tab-item" :class="{ 'active': activeTab === 'market' }" @click="activeTab = 'market'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3v18h18" stroke="currentColor" stroke-width="2" />
                        <path d="M7 12l4-4 4 4 6-6" stroke="currentColor" stroke-width="2" />
                    </svg>
                    大盘指数
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'portfolio' }" @click="activeTab = 'portfolio'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 3h18v18H3zM12 8v8m-4-4h8" stroke="currentColor" stroke-width="2" />
                    </svg>
                    持仓
                    <span v-if="portfolioCount > 0" class="count-badge">{{ portfolioCount }}</span>
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'watchlist' }" @click="activeTab = 'watchlist'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="currentColor" />
                    </svg>
                    自选股
                    <span v-if="watchlistCount > 0" class="count-badge">{{ watchlistCount }}</span>
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'stocks' }" @click="activeTab = 'stocks'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                    智能荐股
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'quant' }" @click="activeTab = 'quant'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                    量化分析
                </div>
                <div class="tab-item" :class="{ 'active': activeTab === 'messages' }" @click="activeTab = 'messages'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                            stroke-width="2" />
                    </svg>
                    消息推送
                    <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
                </div>
            </div>

            <!-- Tab内容区域 -->
            <div class="tab-content" @wheel="handleWheel">
                <div v-show="activeTab === 'market'" class="tab-panel">
                    <MarketIndex @send-to-chat="handleSendToChat" />
                </div>
                <div v-show="activeTab === 'portfolio'" class="tab-panel">
                    <PortfolioView @send-to-chat="handleSendToChat" />
                </div>
                <div v-show="activeTab === 'watchlist'" class="tab-panel">
                    <WatchlistView @send-to-chat="handleSendToChat" />
                </div>
                <div v-show="activeTab === 'stocks'" class="tab-panel">
                    <StockRecommendations @send-to-chat="handleSendToChat" />
                </div>
                <div v-show="activeTab === 'quant'" class="tab-panel">
                    <QuantAnalysis @send-to-chat="handleSendToChat" />
                </div>
                <div v-show="activeTab === 'messages'" class="tab-panel">
                    <MessageNotifications @send-to-chat="handleSendToChat" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../store/user';
import MarketIndex from './MarketIndex.vue';
import StockRecommendations from './StockRecommendations.vue';
import MessageNotifications from './MessageNotifications.vue';
import WatchlistView from './WatchlistView.vue';
import PortfolioView from './PortfolioView.vue';
import QuantAnalysis from './QuantAnalysis.vue';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const userStore = useUserStore();

const isCollapsed = ref(false);
const activeTab = ref('market'); // 默认显示大盘指数
const unreadCount = ref(2); // 未读消息数量，这里可以从消息组件获取

// 自选股数量
const watchlistCount = computed(() => userStore.watchlist.length);

// 持仓数量
const portfolioCount = computed(() => userStore.portfolio.length);

const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 处理子组件发送到聊天的事件
const handleSendToChat = (data) => {
    emit('send-to-chat', data);
};

// 防止滚动事件冒泡到外部页面
const handleWheel = (event) => {
    // 直接阻止事件冒泡，让Sidebar内部处理滚动
    event.stopPropagation();
};
</script>

<style scoped>
.sidebar-container {
    width: 520px;
    height: calc(100vh - 56px);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-left: 1px solid #f0f0f0;
    position: fixed;
    top: 56px;
    right: 0;
    z-index: 100;
    overflow: visible;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
    transition: width 0.3s ease;
}

.sidebar-content {
    height: 100%;
    overflow: hidden;
    padding: 50px 0 0 0;
    display: flex;
    flex-direction: column;
}

/* Tab导航样式 */
.tab-nav {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
}

.tab-item {
    flex: 1;
    padding: 10px 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
    position: relative;
    min-width: 0;
    text-align: center;
}

.tab-item:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.02);
}

.tab-item.active {
    color: #1f2937;
    border-bottom-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
}

.tab-item svg {
    flex-shrink: 0;
}

.unread-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    background: #ef4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.count-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    background: #3b82f6;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

/* Tab内容区域 */
.tab-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
    max-height: calc(100vh - 110px);
}

.tab-panel {
    flex: 1;
    overflow: visible;
    display: flex;
    flex-direction: column;
    padding: 4px;
    margin: 0;
    min-height: 0;
    padding-bottom: 20px;
}

/* Tab内容区域滚动条样式 */
.tab-content::-webkit-scrollbar {
    width: 4px;
}

.tab-content::-webkit-scrollbar-track {
    background: #f5f5f5;
}

.tab-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* 收起/展开功能样式 */
.sidebar-container.collapsed {
    width: 48px;
    background: transparent;
    border: none;
    box-shadow: none;
}

.sidebar-toggle {
    position: absolute;
    top: 10px;
    left: 8px;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 101;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: scale(1.05);
}

.sidebar-toggle svg {
    transition: transform 0.3s ease;
    color: #6b7280;
}

.sidebar-toggle svg.rotated {
    transform: rotate(180deg);
}
</style>
