<template>
    <!-- 移动端遮罩层 -->
    <div class="sidebar-overlay" :class="{ 'show': isMobileExpanded }" @click="closeMobileSidebar"></div>



    <!-- 收起/展开按钮 - 移到容器外面，PC端显示 -->
    <button v-if="!isMobileView" class="sidebar-toggle" :class="{ 'expanded': !isCollapsed }" @click="toggleSidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :class="{ 'rotated': isCollapsed }">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
    </button>

    <div class="sidebar-container" :class="{ 'collapsed': isCollapsed, 'mobile-expanded': isMobileExpanded }"
        @wheel.stop>





        <div class="sidebar-content" v-show="(isMobileView && isMobileExpanded) || (!isMobileView && !isCollapsed)">
            <!-- 移动端关闭按钮 - 放在内容区域内 -->
            <button v-if="isMobileView && isMobileExpanded" class="mobile-close-btn" @click="closeMobileSidebar"
                title="关闭面板">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
            <!-- Tab导航 -->
            <div class="tab-nav" :class="{ 'mobile-nav': isMobileView }">
                <!-- 1. 大盘指数 -->
                <div class="tab-item" :class="{ 'active': activeTab === 'market' }" @click="activeTab = 'market'">
                    <svg :width="isMobileView ? '18' : '16'" :height="isMobileView ? '18' : '16'" viewBox="0 0 24 24"
                        fill="none">
                        <path d="M3 3v18h18" stroke="currentColor" stroke-width="2" />
                        <path d="M7 12l4-4 4 4 6-6" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span class="tab-text">大盘指数</span>
                </div>
                <!-- 2. 智能荐股 -->
                <div class="tab-item" :class="{ 'active': activeTab === 'stocks' }" @click="activeTab = 'stocks'">
                    <span class="tab-icon">🎯</span>
                    <span class="tab-text">智能荐股</span>
                </div>
                <!-- 3. 自选股 -->
                <div class="tab-item" :class="{ 'active': activeTab === 'watchlist' }" @click="activeTab = 'watchlist'">
                    <span class="tab-icon">⭐</span>
                    <span class="tab-text">自选股</span>
                    <span v-if="watchlistCount > 0" class="count-badge">{{ watchlistCount }}</span>
                </div>
                <!-- 4. 持仓 -->
                <div class="tab-item" :class="{ 'active': activeTab === 'portfolio' }" @click="activeTab = 'portfolio'">
                    <svg :width="isMobileView ? '18' : '16'" :height="isMobileView ? '18' : '16'" viewBox="0 0 24 24"
                        fill="none">
                        <path d="M3 3h18v18H3zM12 8v8m-4-4h8" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span class="tab-text">持仓</span>
                    <span v-if="portfolioCount > 0" class="count-badge">{{ portfolioCount }}</span>
                </div>
                <!-- 5. 消息推送 -->
                <div class="tab-item" :class="{ 'active': activeTab === 'messages' }" @click="activeTab = 'messages'">
                    <svg :width="isMobileView ? '18' : '16'" :height="isMobileView ? '18' : '16'" viewBox="0 0 24 24"
                        fill="none">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="2" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="2" />
                    </svg>
                    <span class="tab-text">消息推送</span>
                    <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
                </div>
            </div>

            <!-- Tab内容区域 -->
            <div class="tab-content" @wheel="handleWheel">
                <!-- 1. 大盘指数 -->
                <div v-show="activeTab === 'market'" class="tab-panel">
                    <MarketIndex @send-to-chat="handleSendToChat" />
                </div>
                <!-- 2. 智能荐股 -->
                <div v-show="activeTab === 'stocks'" class="tab-panel">
                    <StockRecommendations @send-to-chat="handleSendToChat" @show-buy-dialog="handleShowBuyDialog" />
                </div>
                <!-- 3. 自选股 -->
                <div v-show="activeTab === 'watchlist'" class="tab-panel">
                    <WatchlistView @send-to-chat="handleSendToChat" @show-buy-dialog="handleShowBuyDialog" />
                </div>
                <!-- 4. 持仓 -->
                <div v-show="activeTab === 'portfolio'" class="tab-panel">
                    <PortfolioView @send-to-chat="handleSendToChat" @show-buy-dialog="handleShowBuyDialog"
                        @show-sell-dialog="handleShowSellDialog" />
                </div>
                <!-- 5. 消息推送 -->
                <div v-show="activeTab === 'messages'" class="tab-panel">
                    <MessageNotifications @send-to-chat="handleSendToChat" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '../store/user';
import { useMobileDetection } from '../composables/useResponsiveBreakpoints';
import MarketIndex from './MarketIndex.vue';
import StockRecommendations from './StockRecommendations.vue';
import MessageNotifications from './MessageNotifications.vue';
import WatchlistView from './WatchlistView.vue';
import PortfolioView from './PortfolioView.vue';


// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'show-sell-dialog']);

const userStore = useUserStore();

// 使用新的响应式断点系统
const { isMobileView, deviceType } = useMobileDetection();

const isCollapsed = ref(true);
const activeTab = ref('market'); // 默认显示大盘指数
const unreadCount = ref(2); // 未读消息数量，这里可以从消息组件获取

// 移动端状态管理
const isMobileExpanded = ref(false);

// 自选股数量
const watchlistCount = computed(() => userStore.watchlist.length);

// 持仓数量
const portfolioCount = computed(() => userStore.portfolio.length);

// 监听设备类型变化，自动关闭移动端侧边栏
watch(deviceType, (newType, oldType) => {
    console.log('Sidebar设备类型变化:', { oldType, newType });

    // 如果从移动端切换到桌面端，自动关闭移动端侧边栏
    if (oldType === 'mobile' && newType !== 'mobile' && isMobileExpanded.value) {
        isMobileExpanded.value = false;
        document.body.style.overflow = '';
    }
});

// 保持向后兼容的检测方法
const checkMobileView = () => {
    console.log('Sidebar移动端检测:', {
        deviceType: deviceType.value,
        isMobileView: isMobileView.value,
        shouldShowButton: !isMobileView.value
    });
};

// 切换侧边栏
const toggleSidebar = () => {
    console.log('Sidebar toggleSidebar被调用', {
        isMobileView: isMobileView.value,
        isMobileExpanded: isMobileExpanded.value,
        isCollapsed: isCollapsed.value,
        windowWidth: window.innerWidth
    });

    if (isMobileView.value) {
        // 移动端：切换展开/收起状态
        isMobileExpanded.value = !isMobileExpanded.value;
        console.log('移动端模式，isMobileExpanded设为:', isMobileExpanded.value);

        // 调试关闭按钮显示状态
        setTimeout(() => {
            const closeBtn = document.querySelector('.mobile-close-btn');
            console.log('关闭按钮状态:', {
                exists: !!closeBtn,
                visible: closeBtn ? getComputedStyle(closeBtn).visibility : 'not found',
                display: closeBtn ? getComputedStyle(closeBtn).display : 'not found',
                zIndex: closeBtn ? getComputedStyle(closeBtn).zIndex : 'not found',
                position: closeBtn ? closeBtn.getBoundingClientRect() : 'not found'
            });
        }, 100);

        // 防止背景滚动，但不影响侧边栏内部滚动
        if (isMobileExpanded.value) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = '0';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        }
    } else {
        // PC端：原有逻辑
        console.log('PC端模式，isCollapsed设为:', !isCollapsed.value);
        isCollapsed.value = !isCollapsed.value;
    }
};

// 关闭移动端侧边栏
const closeMobileSidebar = () => {
    if (isMobileView.value && isMobileExpanded.value) {
        isMobileExpanded.value = false;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
    }
};



// 监听窗口大小变化（简化版，主要功能已由响应式断点系统处理）
const handleResize = () => {
    // 响应式断点系统会自动处理设备类型变化
    // 这里保留是为了向后兼容
    checkMobileView();
};

// 监听ESC键关闭移动端侧边栏
const handleKeyDown = (event) => {
    if (event.key === 'Escape' && isMobileView.value && isMobileExpanded.value) {
        closeMobileSidebar();
    }
};

// 生命周期
onMounted(() => {
    checkMobileView();
    // 移动端模式下，初始化为非收起状态，这样内容可以正常显示
    if (isMobileView.value) {
        isCollapsed.value = false;
    }
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);


});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyDown);
    // 清理样式
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
});

// 处理子组件发送到聊天的事件
const handleSendToChat = (data) => {
    emit('send-to-chat', data);
};

// 处理子组件显示买入对话框的事件
const handleShowBuyDialog = (stockInfo) => {
    emit('show-buy-dialog', stockInfo);
};

// 处理子组件显示卖出对话框的事件
const handleShowSellDialog = (stockInfo) => {
    emit('show-sell-dialog', stockInfo);
};

// 防止滚动事件冒泡到外部页面
const handleWheel = (event) => {
    // 直接阻止事件冒泡，让Sidebar内部处理滚动
    event.stopPropagation();

    // 调试信息
    if (isMobileView.value && isMobileExpanded.value) {
        console.log('移动端侧边栏滚动事件:', {
            deltaY: event.deltaY,
            target: event.target.className,
            scrollTop: event.target.scrollTop,
            scrollHeight: event.target.scrollHeight,
            clientHeight: event.target.clientHeight
        });
    }
};

// 暴露方法给父组件调用
defineExpose({
    toggleSidebar
});
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
    /* 优化：默认收起状态，移到右侧视口外 */
    transform: translateX(100%);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    contain: layout style;
}

.sidebar-content {
    height: 100%;
    overflow: hidden;
    padding: 10px 0 0 0;
    display: flex;
    flex-direction: column;
    contain: layout;
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
    transition: color 0.15s ease, background-color 0.15s ease, border-bottom-color 0.15s ease;
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
    /* 调整高度计算，给账户总览更多空间 */
    height: calc(100vh - 106px);
    height: calc(100dvh - 106px);
    height: calc(var(--vh, 1vh) * 100 - 106px);
    /* 使用动态视口高度，CSS变量作为备选方案 */
    /* 56px(顶部) + 50px(tab导航) */
    /* 添加滚动条稳定性 */
    scrollbar-gutter: stable;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    contain: layout;
}

.tab-panel {
    flex: 1;
    /* 修复：移除 overflow: visible，改为适当的滚动控制 */
    overflow: visible;
    display: flex;
    flex-direction: column;
    padding: 4px;
    margin: 0;
    min-height: 0;
    padding-bottom: 20px;
    /* 移除固定的最小高度，让内容自然流动 */
    contain: layout;
}

/* 移动端底部安全区域处理 */
@media (max-width: 768px) {
    .tab-panel {
        padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)) !important;
    }

    .tab-content {
        padding-bottom: env(safe-area-inset-bottom, 0px) !important;
        /* 确保移动端滚动到底部时有足够的空间 */
        height: calc(100dvh - 106px - env(safe-area-inset-bottom, 0px)) !important;
        height: calc(var(--vh, 1vh) * 100 - 106px - env(safe-area-inset-bottom, 0px)) !important;
    }

    /* 移动端侧边栏整体容器的底部安全区域 */
    .sidebar-container.mobile-expanded {
        padding-bottom: env(safe-area-inset-bottom, 0px) !important;
    }
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
    transform: translateX(100%);
}

.sidebar-container:not(.collapsed) {
    transform: translateX(0);
}

.sidebar-toggle {
    position: fixed;
    top: 72px;
    right: 16px;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    will-change: transform;
}

.sidebar-toggle:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.sidebar-toggle:not(.expanded):hover {
    transform: translateX(0) scale(1.05);
}

.sidebar-toggle.expanded:hover {
    transform: translateX(-520px) scale(1.05);
}

.sidebar-toggle svg {
    transition: transform 0.2s ease;
    color: #6b7280;
}

.sidebar-toggle svg.rotated {
    transform: rotate(180deg);
}

/* 展开状态下的按钮位置调整 - 使用transform移动 */
.sidebar-toggle.expanded {
    transform: translateX(-520px);
    /* 向左移动520px (536px - 16px = 520px) */
}

/* 收起状态下按钮的默认位置 */
.sidebar-toggle:not(.expanded) {
    transform: translateX(0);
}

.sidebar-toggle:not(.expanded):hover {
    background: #ffffff;
    border-color: #3b82f6;
    transform: translateX(0) scale(1.1);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
}





/* 移动端响应式处理 */
@media (max-width: 768px) {

    /* 移动端隐藏PC端的侧边栏切换按钮 */
    .sidebar-toggle {
        display: none !important;
    }

    .sidebar-container {
        /* 移动端改为抽屉式侧边栏 */
        width: 85vw !important;
        max-width: 380px !important;
        height: 100vh !important;
        height: 100dvh !important;
        height: calc(var(--vh, 1vh) * 100) !important;
        /* 使用动态视口高度，CSS变量作为备选方案 */
        top: 0 !important;
        right: 0 !important;
        position: fixed !important;
        /* 优化：使用GPU加速的transform替代right属性动画 */
        transform: translateX(100%) !important;
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        z-index: 9000 !important;
        /* 降低侧边栏z-index，确保弹窗能在其上方显示 */
        background: white !important;
        border-left: none !important;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15) !important;
        display: flex !important;
        /* 覆盖之前的隐藏样式 */
        flex-direction: column !important;
        will-change: transform !important;
        contain: layout style !important;
        overflow: hidden !important;
        /* 确保容器本身不滚动，由内部tab-content处理滚动 */
    }

    /* 移动端展开状态 */
    .sidebar-container.mobile-expanded {
        transform: translateX(0) !important;
    }

    /* 移动端关闭按钮 - 内部浮动设计 */
    .mobile-close-btn {
        position: absolute !important;
        top: 8px !important;
        right: 8px !important;
        /* 放在侧边栏内部右上角 */
        width: 32px !important;
        height: 32px !important;
        background: rgba(255, 255, 255, 0.95) !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 50% !important;
        /* 圆形按钮 */
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        /* 优化：简化动画，只对必要属性进行过渡 */
        transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease !important;
        z-index: 9999 !important;
        /* 提高z-index确保按钮显示在最上层 */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        color: #6b7280 !important;
        will-change: transform !important;
        /* 确保按钮可见 */
        visibility: visible !important;
        opacity: 1 !important;
        backdrop-filter: blur(10px) !important;
    }

    .mobile-close-btn:hover {
        background: rgba(249, 250, 251, 0.98) !important;
        color: #374151 !important;
        transform: scale(1.05) !important;
        /* 轻微放大 */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }

    .mobile-close-btn:active {
        transform: scale(0.95) !important;
        background: rgba(243, 244, 246, 0.98) !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
    }

    /* 移动端侧边栏内容 */
    .sidebar-content {
        height: 100% !important;
        height: 100dvh !important;
        height: calc(var(--vh, 1vh) * 100) !important;
        /* 使用动态视口高度，CSS变量作为备选方案 */
        padding: 0 !important;
        /* 移除顶部间距 */
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        /* 确保关闭按钮的定位基准 */
    }



    /* 移动端tab导航优化 - 超紧凑版 */
    .tab-nav.mobile-nav {
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scrollbar-width: none !important;
        /* Firefox */
        -ms-overflow-style: none !important;
        /* IE/Edge */
        display: flex !important;
        flex-shrink: 0 !important;
        background: rgba(249, 250, 251, 0.95) !important;
        border-bottom: 1px solid #e5e7eb !important;
        padding: 4px 0 !important;
        min-height: 40px !important;
    }

    .tab-nav.mobile-nav::-webkit-scrollbar {
        display: none;
        /* Chrome/Safari */
    }

    .mobile-nav .tab-item {
        flex: 0 0 auto !important;
        min-width: 70px !important;
        padding: 6px 6px !important;
        font-size: 0.65rem !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 4px !important;
        border-radius: 8px !important;
        margin: 0 2px !important;
        /* 优化：简化移动端Tab动画 */
        transition: background-color 0.15s ease, color 0.15s ease !important;
    }

    .mobile-nav .tab-item:hover {
        background: rgba(59, 130, 246, 0.08) !important;
        color: #1d4ed8 !important;
    }

    .mobile-nav .tab-item.active {
        background: rgba(59, 130, 246, 0.12) !important;
        color: #1d4ed8 !important;
        border-bottom: none !important;
        font-weight: 600 !important;
    }

    .mobile-nav .tab-text {
        font-size: 0.65rem !important;
        line-height: 1.2 !important;
        text-align: left !important;
        flex: 1 !important;
    }

    .mobile-nav .tab-icon {
        font-size: 0.9rem !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
        width: 14px !important;
        height: 14px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    /* SVG图标在移动端的优化 */
    .mobile-nav .tab-item svg {
        width: 14px !important;
        height: 14px !important;
        flex-shrink: 0 !important;
    }

    /* 移动端徽章样式优化 */
    .mobile-nav .count-badge,
    .mobile-nav .unread-badge {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        margin-left: 4px !important;
        font-size: 0.55rem !important;
        min-width: 16px !important;
        height: 16px !important;
        line-height: 16px !important;
        padding: 0 4px !important;
        border-radius: 8px !important;
        flex-shrink: 0 !important;
    }

    /* PC端tab内容区域保持原样 */
    .sidebar-container:not(.mobile-expanded) .tab-content {
        height: calc(100vh - 106px) !important;
        height: calc(100dvh - 106px) !important;
        height: calc(var(--vh, 1vh) * 100 - 106px) !important;
        /* PC端：56px(顶部) + 50px(tab导航) */
        padding: 0 !important;
        background: transparent !important;
    }

    /* 移动端tab内容区域 - 无头部版本 */
    .sidebar-container.mobile-expanded .tab-content {
        height: calc(100vh - 40px) !important;
        height: calc(100dvh - 40px) !important;
        height: calc(var(--vh, 1vh) * 100 - 40px) !important;
        /* 只减去tab导航(40px) */
        padding: 6px !important;
        flex: 1 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        background: #f8fafc !important;
        /* 确保滚动可用 */
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: contain !important;
        scrollbar-width: thin !important;
    }

    /* 移动端滚动条样式 */
    .sidebar-container.mobile-expanded .tab-content::-webkit-scrollbar {
        width: 3px !important;
    }

    .sidebar-container.mobile-expanded .tab-content::-webkit-scrollbar-track {
        background: transparent !important;
    }

    .sidebar-container.mobile-expanded .tab-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2) !important;
        border-radius: 2px !important;
    }

    .sidebar-container.mobile-expanded .tab-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3) !important;
    }

    /* PC端tab-panel保持原样 */
    .sidebar-container:not(.mobile-expanded) .tab-panel {
        padding: 4px !important;
        padding-bottom: 20px !important;
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
    }

    /* 移动端tab-panel */
    .sidebar-container.mobile-expanded .tab-panel {
        padding: 0 !important;
        padding-bottom: 100px !important;
        /* 底部留出空间避免与聊天框冲突 */
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 0 !important;
        flex: none !important;
    }

    /* 移动端移除组件外层容器的样式 */
    .sidebar-container.mobile-expanded .tab-panel .portfolio-view,
    .sidebar-container.mobile-expanded .tab-panel .recommendations-container,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-container,
    .sidebar-container.mobile-expanded .tab-panel .market-index-container,
    .sidebar-container.mobile-expanded .tab-panel .notifications-container {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
    }

    /* 移动端侧边栏内的股票列表优化 - 直接显示版本 */
    .sidebar-container.mobile-expanded .tab-panel .mobile-stock-list-container,
    .sidebar-container.mobile-expanded .tab-panel .stock-list-container {
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .mobile-stock-list,
    .sidebar-container.mobile-expanded .tab-panel .stock-list {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .mobile-stock-card {
        margin: 0 6px 6px 6px !important;
        padding: 8px !important;
        border-radius: 6px !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important;
        border: 1px solid #e2e8f0 !important;
        background: white !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .stock-name {
        font-size: 0.9rem !important;
        line-height: 1.3 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .current-price {
        font-size: 1.05rem !important;
    }

    /* 修复操作按钮溢出问题 */
    .sidebar-container.mobile-expanded .tab-panel .native-mobile-actions {
        margin-top: 10px !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 6px !important;
        flex-wrap: nowrap !important;
        overflow: visible !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .primary-actions {
        flex: 1 !important;
        display: flex !important;
        gap: 4px !important;
        flex-wrap: wrap !important;
        min-width: 0 !important;
        width: calc(100% - 34px) !important;
        box-sizing: border-box !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .primary-action-btn {
        padding: 6px 8px !important;
        font-size: 0.65rem !important;
        min-height: 30px !important;
        border-radius: 6px !important;
        flex: 0 1 calc(50% - 2px) !important;
        min-width: 0 !important;
        max-width: calc(50% - 2px) !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .action-text {
        font-size: 0.65rem !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        flex: 1 !important;
        text-align: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .action-icon {
        font-size: 0.75rem !important;
        flex-shrink: 0 !important;
        width: 12px !important;
        height: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .price-badge {
        font-size: 0.5rem !important;
        padding: 1px 4px !important;
        border-radius: 3px !important;
        margin-left: 0 !important;
        background: rgba(255, 165, 0, 0.2) !important;
        color: #ff8c00 !important;
        border: 1px solid rgba(255, 165, 0, 0.3) !important;
        flex-shrink: 0 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .more-btn {
        width: 30px !important;
        height: 30px !important;
        flex-shrink: 0 !important;
        border-radius: 6px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f3f4f6 !important;
        border: 1px solid #e5e7eb !important;
        color: #6b7280 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .more-btn:hover {
        background: #e5e7eb !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .more-icon {
        font-size: 1rem !important;
        font-weight: bold !important;
    }

    /* 移动端移除组件内部头部，但保留侧边栏头部 */
    .sidebar-container.mobile-expanded .tab-panel .card-header {
        display: none !important;
    }

    /* 移动端移除组件内部容器的样式 */
    .sidebar-container.mobile-expanded .tab-panel .recommendations-list,
    .sidebar-container.mobile-expanded .tab-panel .portfolio-content,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-content,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-list,
    .sidebar-container.mobile-expanded .tab-panel .market-content,
    .sidebar-container.mobile-expanded .tab-panel .notifications-content {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
    }

    /* 移动端空状态优化 - 直接显示版本 */
    .sidebar-container.mobile-expanded .tab-panel .empty-state {
        padding: 20px 12px !important;
        text-align: center !important;
        background: white !important;
        border-radius: 6px !important;
        margin: 6px !important;
        border: 1px solid #f1f5f9 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .empty-icon {
        font-size: 2rem !important;
        margin-bottom: 8px !important;
        opacity: 0.6 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .empty-title {
        font-size: 0.9rem !important;
        color: #6b7280 !important;
        margin-bottom: 4px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .empty-desc {
        font-size: 0.75rem !important;
        color: #9ca3af !important;
        line-height: 1.4 !important;
    }



    .sidebar-container.mobile-expanded .tab-panel .summary-header {
        padding: 0 0 12px 0 !important;
        margin-bottom: 0 !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .summary-header h3 {
        font-size: 1rem !important;
        margin: 0 !important;
        color: white !important;
        font-weight: 600 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .refresh-btn {
        width: 28px !important;
        height: 28px !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .refresh-btn:hover {
        background: rgba(255, 255, 255, 0.2) !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .refresh-btn svg {
        width: 14px !important;
        height: 14px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .summary-main {
        margin-bottom: 6px !important;
        padding: 0 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .total-assets-card {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 4px !important;
        padding: 6px 8px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px) !important;
        min-height: 40px !important;
        max-height: 40px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-icon {
        font-size: 1rem !important;
        flex-shrink: 0 !important;
        width: 28px !important;
        height: 28px !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-info {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 1px !important;
        min-height: 28px !important;
        justify-content: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-label {
        font-size: 0.65rem !important;
        color: rgba(255, 255, 255, 0.9) !important;
        margin: 0 !important;
        font-weight: 500 !important;
        line-height: 1 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-value {
        font-size: 1rem !important;
        font-weight: 700 !important;
        color: white !important;
        margin: 0 !important;
        line-height: 1.1 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-change {
        display: flex !important;
        align-items: center !important;
        gap: 2px !important;
        font-size: 0.6rem !important;
        font-weight: 600 !important;
        padding: 1px 3px !important;
        border-radius: 2px !important;
        background: rgba(255, 255, 255, 0.1) !important;
        width: fit-content !important;
        margin-top: 1px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-change.positive {
        color: #10b981 !important;
        background: rgba(16, 185, 129, 0.15) !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-change.negative {
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.15) !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .asset-change svg {
        width: 10px !important;
        height: 10px !important;
        flex-shrink: 0 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .summary-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr 1fr !important;
        gap: 3px !important;
        padding: 0 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .summary-card {
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 3px !important;
        padding: 4px 3px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1px !important;
        text-align: center !important;
        backdrop-filter: blur(10px) !important;
        transition: all 0.2s ease !important;
        min-height: 40px !important;
        max-height: 40px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .summary-card:hover {
        background: rgba(255, 255, 255, 0.2) !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-icon {
        font-size: 0.8rem !important;
        margin-bottom: 0 !important;
        flex-shrink: 0 !important;
        line-height: 1 !important;
        height: 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-content {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 0px !important;
        width: 100% !important;
        flex: 1 !important;
        justify-content: center !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-label {
        font-size: 0.55rem !important;
        color: rgba(255, 255, 255, 0.9) !important;
        margin: 0 !important;
        line-height: 1 !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-value {
        font-size: 0.65rem !important;
        font-weight: 700 !important;
        color: white !important;
        margin: 0 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        width: 100% !important;
        margin-top: 1px !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-value.positive {
        color: #10b981 !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .card-value.negative {
        color: #ef4444 !important;
    }

    /* 持仓列表区域优化 */
    .tab-panel .portfolio-content {
        background: transparent !important;
        padding: 0 !important;
    }

    /* 移动端隐藏PC端的切换按钮 */
    .sidebar-toggle {
        display: none !important;
    }
}



/* 移动端遮罩层 */
@media (max-width: 768px) {
    .sidebar-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.5) !important;
        z-index: 8999 !important;
        /* 降低遮罩层z-index，确保弹窗能在其上方显示 */
        opacity: 0 !important;
        visibility: hidden !important;
        transition: opacity 0.3s ease, visibility 0.3s ease !important;
    }

    .sidebar-overlay.show {
        opacity: 1 !important;
        visibility: visible !important;
    }
}
</style>

<style>
/* 全局移动端样式优化，不使用scoped */
@media (max-width: 768px) {

    /* 持仓资产卡片优化 */
    .account-summary {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        border-radius: 12px !important;
        padding: 12px !important;
        margin: 0 0 12px 0 !important;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15) !important;
        position: relative !important;
        overflow: hidden !important;
    }

    /* 操作按钮布局优化 */
    .primary-action-btn {
        padding: 4px 6px !important;
        font-size: 0.6rem !important;
        min-height: 28px !important;
        border-radius: 4px !important;
        max-width: calc(48% - 2px) !important;
        flex: 0 1 calc(48% - 2px) !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 2px !important;
    }

    /* 总资产卡片 */
    .total-assets-card {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        background: rgba(255, 255, 255, 0.15) !important;
        border-radius: 8px !important;
        padding: 12px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px) !important;
    }

    /* 资产图标 */
    .asset-icon {
        font-size: 1.5rem !important;
        width: 40px !important;
        height: 40px !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
    }

    /* 移动端持仓组件修复 - 简化版本，主要样式由组件自身处理 */
    .sidebar-container.mobile-expanded .tab-panel .portfolio-view {
        max-height: none !important;
        height: auto !important;
        overflow: visible !important;
        min-height: auto !important;
        contain: none !important;
    }

    .sidebar-container.mobile-expanded .tab-panel .portfolio-content {
        padding-bottom: 12px !important;
        overflow: visible !important;
        height: auto !important;
        flex: none !important;
        scrollbar-gutter: auto !important;
    }

    /* 移动端特定容器移除固定高度限制，但保持正常的内容流 */
    .sidebar-container.mobile-expanded .tab-panel .portfolio-view,
    .sidebar-container.mobile-expanded .tab-panel .recommendations-container,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-container,
    .sidebar-container.mobile-expanded .tab-panel .market-index-container,
    .sidebar-container.mobile-expanded .tab-panel .notifications-container,
    .sidebar-container.mobile-expanded .tab-panel .mobile-stock-list-container,
    .sidebar-container.mobile-expanded .tab-panel .mobile-stock-list,
    .sidebar-container.mobile-expanded .tab-panel .stock-list-container,
    .sidebar-container.mobile-expanded .tab-panel .stock-list,
    .sidebar-container.mobile-expanded .tab-panel .portfolio-content,
    .sidebar-container.mobile-expanded .tab-panel .recommendations-list,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-content,
    .sidebar-container.mobile-expanded .tab-panel .watchlist-list,
    .sidebar-container.mobile-expanded .tab-panel .market-content,
    .sidebar-container.mobile-expanded .tab-panel .notifications-content {
        max-height: none !important;
        overflow: visible !important;
        height: auto !important;
        min-height: auto !important;
    }

    /* 移动端其他可能的滚动容器 */
    .sidebar-container.mobile-expanded .tab-panel .market-index-content,
    .sidebar-container.mobile-expanded .tab-panel .notifications-list,
    .sidebar-container.mobile-expanded .tab-panel .message-list,
    .sidebar-container.mobile-expanded .tab-panel .market-index-card,
    .sidebar-container.mobile-expanded .tab-panel .index-list {
        max-height: none !important;
        overflow: visible !important;
    }

    /* 操作按钮相关样式 */
    .native-mobile-actions {
        margin-top: 10px !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 6px !important;
        flex-wrap: nowrap !important;
        overflow: visible !important;
        width: 100% !important;
        box-sizing: border-box !important;
    }

    .primary-actions {
        flex: 1 !important;
        display: flex !important;
        gap: 4px !important;
        flex-wrap: wrap !important;
        min-width: 0 !important;
        width: calc(100% - 34px) !important;
        box-sizing: border-box !important;
    }

    .action-text {
        font-size: 0.6rem !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        flex: 1 !important;
        text-align: center !important;
    }

    .action-icon {
        font-size: 0.7rem !important;
        flex-shrink: 0 !important;
        width: 10px !important;
        height: 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .price-badge {
        font-size: 0.45rem !important;
        padding: 1px 3px !important;
        border-radius: 2px !important;
        margin-left: 0 !important;
        background: rgba(255, 165, 0, 0.2) !important;
        color: #ff8c00 !important;
        border: 1px solid rgba(255, 165, 0, 0.3) !important;
        flex-shrink: 0 !important;
    }

    .more-btn {
        width: 30px !important;
        height: 30px !important;
        flex-shrink: 0 !important;
        border-radius: 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #f3f4f6 !important;
        border: 1px solid #e5e7eb !important;
        color: #6b7280 !important;
    }

    .more-btn:hover {
        background: #e5e7eb !important;
    }

    .more-icon {
        font-size: 0.9rem !important;
        font-weight: bold !important;
    }
}
</style>
