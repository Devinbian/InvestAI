<template>
    <div class="main-modern" :class="{ 'onboarding-active': showOnboarding, 'with-chat-history': showChatHistory }">
        <!-- 顶部导航栏 -->
        <TopNavbar @show-login="showLogin" @show-profile="handleShowProfile" @show-preferences="handleShowPreferences"
            @show-records="handleShowRecords" @show-mobile-menu="showMobileUserMenu" />

        <!-- 聊天历史记录 -->
        <ChatHistory v-if="userStore.isLoggedIn" :visible="showChatHistory"
            :current-chat-id="chatHistoryStore.currentChatId" :chat-history="chatHistory" @load-chat="handleLoadChat"
            @create-new-chat="wrappedHandleCreateNewChat" @rename-chat="handleRenameChat"
            @delete-chat="wrappedHandleDeleteChat" @close-panel="closeChatHistory" ref="chatHistoryComponentRef" />

        <!-- 移动端侧边栏悬浮切换按钮 -->
        <button v-if="isMobileSidebarAvailable" class="floating-sidebar-toggle" @click="handleMobileSidebarToggle"
            title="打开功能面板">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18m-9 9l9-9-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        <!-- 主体内容 -->
        <main class="modern-content main-container"
            :class="{ 'chatting': isChatMode, 'with-sidebar': userStore.isLoggedIn, 'with-chat-history': showChatHistory }"
            @click="handleMainContentClick">
            <!-- 个性化引导流程 -->
            <OnboardingFlow v-if="showOnboarding" :force-start="newUserForceStart" @complete="onOnboardingComplete"
                @analyze-stock="handleAnalyzeStock" @execute-action="handleOnboardingAction" />

            <!-- 初始状态：标题、描述和输入区域作为一个整体 -->
            <div class="center-container chat-area" v-else-if="!isChatMode">
                <!-- 情感化头部组件 -->
                <WelcomePerformanceHeader v-if="userStore.isLoggedIn" :performance-data="userPerformanceData"
                    :user-name="userStore.userInfo?.nickname" />

                <!-- 未登录用户的欢迎头部组件 -->
                <WelcomeGuestHeader v-if="!userStore.isLoggedIn" />

                <div class="welcome-section" :class="{ 'with-performance': userStore.isLoggedIn }">
                    <!-- 快捷示例组件 -->
                    <QuickExamples @example-click="setSuggestionText" />
                </div>

                <!-- 主页模式输入区域 - 移动端贴底显示 -->
                <div class="home-input-area" v-if="isMobileView">
                    <!-- 移动端主页快捷操作按钮 - 作为输入区域的一部分 -->
                    <div class="mobile-home-shortcuts-wrapper" v-if="!isChatMode">
                        <div class="mobile-home-shortcuts">
                            <div class="shortcuts-container">
                                <div class="shortcuts-scroll-wrapper">
                                    <div class="shortcuts-list">
                                        <!-- 快捷操作按钮 -->
                                        <button v-for="shortcut in activeHomeShortcuts" :key="shortcut.id"
                                            class="shortcut-btn" @click="handleShortcutClick(shortcut)"
                                            :title="shortcut.description">
                                            <span class="shortcut-icon">{{ shortcut.icon }}</span>
                                            <span class="shortcut-text">{{ shortcut.title }}</span>
                                        </button>

                                        <!-- 自定义按钮 -->
                                        <button class="shortcut-btn customize-btn" @click="openCustomizeDialog"
                                            title="自定义快捷操作">
                                            <span class="shortcut-icon">⚙️</span>
                                            <span class="shortcut-text">自定义</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                        :is-chat-mode="false" :is-mobile-view="isMobileView" :is-recording="isRecording"
                        :recording-duration="recordingDuration" :is-generating="isGenerating"
                        :show-chat-shortcuts="false" :is-logged-in="userStore.isLoggedIn"
                        :show-chat-history="showChatHistory" @send-message="sendMessage"
                        @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                        @stop-generation="stopGeneration" />

                    <!-- 快捷操作栏组件 -->
                    <ShortcutsBar mode="initial" :show-shortcuts="true" :show-chat-shortcuts="false"
                        :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                        @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                        ref="shortcutsBarRef" />
                </div>

                <!-- PC端输入区域 - 保持原有布局 -->
                <template v-else>
                    <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                        :is-chat-mode="false" :is-mobile-view="isMobileView" :is-recording="isRecording"
                        :recording-duration="recordingDuration" :is-generating="isGenerating"
                        :show-chat-shortcuts="false" :is-logged-in="userStore.isLoggedIn"
                        :show-chat-history="showChatHistory" @send-message="sendMessage"
                        @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                        @stop-generation="stopGeneration" />

                    <!-- 快捷操作栏组件 -->
                    <ShortcutsBar mode="initial" :show-shortcuts="true" :show-chat-shortcuts="false"
                        :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                        @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                        ref="shortcutsBarRef" />
                </template>
            </div>

            <!-- 聊天历史区域 - 优化版本，使用虚拟滚动 -->
            <div class="chat-history-area chat-area" v-if="isChatMode && chatHistory.length" ref="chatHistoryRef">
                <!-- 当消息数量较少时使用普通渲染 -->
                <template v-if="chatHistory.length <= 50">
                    <ChatMessage v-for="(message, idx) in chatHistory" :key="idx" :message="message"
                        :is-generating="isGenerating" :is-last-message="idx === chatHistory.length - 1"
                        :is-mobile-view="isMobileView" :watchlist-action-buttons="watchlistActionButtons"
                        :portfolio-action-buttons="portfolioActionButtons"
                        :active-reminders-count="activeReminders.filter(r => r.isActive).length"
                        :is-in-watchlist="isInWatchlist" :format-currency="formatCurrency"
                        :format-recommendation-time="formatRecommendationTime" :is-stream-paused="isStreamPaused"
                        :session-title="currentChatTitle" :chat-history="chatHistory" :message-index="idx"
                        @interaction-action="handleInteractionAction" @show-buy-dialog="showBuyDialog"
                        @add-to-watchlist="addToWatchlist" @remove-from-watchlist="removeFromWatchlist"
                        @show-quant-analysis-dialog="showQuantAnalysisDialog"
                        @set-quant-analysis-reminder="setQuantAnalysisReminder" @stock-click="handleStockClick"
                        @watchlist-action-click="handleWatchlistActionClick"
                        @portfolio-action-click="handlePortfolioActionClick"
                        @stock-action-click="handleStockActionClick" @refresh-recommendation="refreshRecommendation"
                        @copy-message="handleCopyMessage" @regenerate-message="handleRegenerateMessage"
                        @share-message="handleShareMessage" />



                    <!-- 移动端聊天历史底部占位元素，防止被新建聊天按钮遮挡 -->
                    <div class="mobile-chat-spacer" v-if="isMobileView"></div>
                </template>

                <!-- 当消息数量较多时使用虚拟滚动（预留，暂未实现） -->
                <template v-else>
                    <!-- TODO: 实现虚拟滚动组件 -->
                    <div v-for="(message, idx) in chatHistory" :key="idx" :class="['chat-message', message.role]">
                        <div class="chat-message-content">
                            <div class="message-text">
                                <MarkdownRenderer :content="message.content" />
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <!-- 底部输入区域（仅在聊天状态显示） -->
            <div class="input-area" v-if="isChatMode">
                <!-- 新聊天按钮和快捷操作 -->
                <div class="new-chat-section" v-if="chatHistory.length > 0">
                    <div class="chat-actions">
                        <!-- 移动端：快捷操作按钮和新建聊天按钮在同一行 -->
                        <template v-if="isMobileView">
                            <MobileChatShortcuts :show-shortcuts="true" :is-mobile-view="isMobileView"
                                :is-logged-in="userStore.isLoggedIn" @shortcut-click="handleShortcutClick"
                                @customize-dialog-open="openCustomizeDialog" ref="mobileChatShortcutsRef" />

                            <div class="new-chat-buttons">
                                <el-button class="new-chat-btn" @click="createNewChat">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                    新建聊天
                                </el-button>


                            </div>
                        </template>

                        <!-- PC端：保持原有布局 -->
                        <template v-else>
                            <el-button class="new-chat-btn" @click="createNewChat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                新建聊天
                            </el-button>


                        </template>
                    </div>
                </div>

                <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                    :is-chat-mode="true" :is-mobile-view="isMobileView" :is-recording="isRecording"
                    :recording-duration="recordingDuration" :is-generating="isGenerating" :show-chat-shortcuts="false"
                    :is-logged-in="userStore.isLoggedIn" :show-chat-history="showChatHistory"
                    @send-message="sendMessage" @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                    @stop-generation="stopGeneration" />

                <!-- PC端聊天模式快捷操作栏组件 - 直接显示在输入框下方 -->
                <ShortcutsBar v-if="!isMobileView" mode="initial" :show-shortcuts="true" :show-chat-shortcuts="false"
                    :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                    @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                    ref="chatShortcutsBarRef" />
            </div>
        </main>

        <!-- 侧边栏（仅在登录后显示） -->
        <Sidebar v-if="userStore.isLoggedIn" ref="sidebarRef" @send-to-chat="handleSidebarInteraction"
            @show-buy-dialog="showBuyDialog" @show-sell-dialog="handleShowSellDialog"
            @stock-action="handleStockAction" />



        <!-- 移动端用户菜单弹窗 -->
        <MobileUserMenu :visible="showMobileMenu" :user-info="userStore.userInfo" @close="hideMobileUserMenu"
            @command="(command) => handleMobileCommand(command, handleCommand)" />

        <!-- 登录对话框组件 -->
        <LoginDialog v-model="loginDialogVisible" :register-mode="isRegisterMode"
            @login-success="(data) => handleLoginSuccess(data, () => { showOnboarding = true; newUserForceStart = data.isNewUser; }, dismissGuide)"
            @show-recovery="showPasswordRecovery" />

        <!-- 找回密码对话框组件 -->
        <PasswordRecoveryDialog v-model="recoveryDialogVisible" @back-to-login="backToLogin"
            @recovery-success="handleRecoverySuccess" />

        <!-- 投资偏好设置对话框 -->
        <InvestmentPreferencesDialog v-model="preferencesDialogVisible"
            @preferences-completed="handlePreferencesCompleted" @preferences-skipped="handlePreferencesSkipped" />

        <!-- 股票交易对话框 -->
        <StockTradingDialog v-if="!isMobileView" v-model="buyDialogVisible" :stock="selectedStock"
            :trade-type="tradeType" @trade-completed="handleTradeCompleted"
            @watchlist-changed="handleWatchlistChanged" />

        <!-- 移动端原生股票交易对话框 -->
        <MobileStockTradingDialog v-if="isMobileView" v-model="buyDialogVisible" :stock="selectedStock"
            :trade-type="tradeType" @trade-completed="handleTradeCompleted"
            @watchlist-changed="handleWatchlistChanged" />

        <!-- AI委托交易设置对话框 -->
        <AITradingDialog v-model="showAITradingDialog" :stock="selectedStockForAITrading"
            @ai-trading-confirmed="handleAITradingConfirmed" />

        <!-- 自定义快捷操作对话框 -->
        <CustomizeShortcutsDialog v-if="!isMobileView" v-model="customizeDialogVisible"
            @shortcuts-updated="handleShortcutsUpdated" />

        <!-- 移动端原生快捷操作对话框 -->
        <MobileShortcutsDialog v-if="isMobileView" v-model="customizeDialogVisible"
            @shortcuts-updated="handleShortcutsUpdated" />

        <!-- 引导提示 -->
        <div v-if="showGuideTip" class="guide-tip">
            <div class="guide-content">
                <div class="guide-header">
                    <div class="guide-icon">👋</div>
                    <h4 class="guide-title">{{ guideTitle }}</h4>
                </div>
                <div class="guide-text">
                    <p>{{ guideMessage }}</p>
                </div>
                <div class="guide-actions">
                    <el-button type="primary" size="small" @click="handleGuideAction">{{ guideActionText
                        }}</el-button>
                    <el-button size="small" @click="dismissGuide">稍后</el-button>
                </div>
            </div>
        </div>

        <!-- 个人中心 -->
        <UserProfile v-if="showUserProfile" @close="closeUserProfile" />

        <!-- 记录中心 -->
        <RecordsCenter v-if="showRecordsCenter" @close="closeRecordsCenter" />

        <!-- 量化分析提醒设置对话框 -->
        <QuantReminderDialog v-model:visible="showQuantReminderDialog" :message="currentReminderMessage"
            :active-reminders="activeReminders" @confirm="handleReminderConfirm" @cancel="handleReminderCancel"
            @remove-reminder="removeReminder" />

        <!-- 版权信息 -->
        <CopyrightFooter :is-chat-mode="isChatMode" :is-mobile-view="isMobileView" :is-wechat-env="isWechatEnv" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import { useChatHistoryStore } from '../store/chatHistory';
import { ElMessage, ElMessageBox } from 'element-plus';
import { mockApi, wechatLoginApi } from '../api/mock';
import Sidebar from '../components/Sidebar.vue';
import UserProfile from '../components/UserProfile.vue';
import RecordsCenter from '../components/RecordsCenter.vue';
import OnboardingFlow from '../components/OnboardingFlow.vue';
import LoginDialog from '../components/LoginDialog.vue';
import PasswordRecoveryDialog from '../components/PasswordRecoveryDialog.vue';
import InvestmentPreferencesDialog from '../components/InvestmentPreferencesDialog.vue';
import StockTradingDialog from '../components/StockTradingDialog.vue';
import MobileStockTradingDialog from '../components/MobileStockTradingDialog.vue';
import AITradingDialog from '../components/AITradingDialog.vue';
import CustomizeShortcutsDialog from '../components/CustomizeShortcutsDialog.vue';
import MobileShortcutsDialog from '../components/MobileShortcutsDialog.vue';
import MobileChatShortcuts from '../components/MobileChatShortcuts.vue';
import MobileUserMenu from '../components/MobileUserMenu.vue';
import ChatHistory from '../components/ChatHistory.vue';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import ChatMessage from '../components/ChatMessage.vue';
import StockList from '../components/StockList.vue';
import MobileStockList from '../components/MobileStockList.vue';
import WelcomePerformanceHeader from '../components/WelcomePerformanceHeader.vue';
import WelcomeGuestHeader from '../components/WelcomeGuestHeader.vue';
import TopNavbar from '../components/TopNavbar.vue';
import AIInputCard from '../components/AIInputCard.vue';
import QuickExamples from '../components/QuickExamples.vue';
import ShortcutsBar from '../components/ShortcutsBar.vue';
import QuantReminderDialog from '../components/QuantReminderDialog.vue';
import StockActionButtons from '../components/StockActionButtons.vue';
import CopyrightFooter from '../components/CopyrightFooter.vue';
import { getStockListConfig } from '../config/stockListConfig';
import { getStockActionConfig } from '../config/stockActionConfig';
import { api, recommendStock } from '@/api/api';
import { authFetchEventSource } from '@/utils/request';
import { eventListenerManager, timerManager, chatHistoryManager, performanceOptimizer } from '@/utils/performanceOptimizer';
import { useMobileAdaptation } from '../composables/useMobileAdaptation';
import { useChatManager } from '../composables/useChatManager';
import { useVoiceInput } from '../composables/useVoiceInput';
import { useStockOperations } from '../composables/useStockOperations';
import { useAuthentication } from '../composables/useAuthentication';
import { formatCurrency, generateMessageId } from '@/utils/formatters';

const userStore = useUserStore();
const chatHistoryStore = useChatHistoryStore();



// 使用用户认证组合式函数
const authentication = useAuthentication();
const {
    loginDialogVisible,
    isRegisterMode,
    recoveryDialogVisible,
    showLogin,
    handleLoginSuccess,
    showPasswordRecovery,
    backToLogin,
    handleRecoverySuccess,
    handleUserCommand,
    checkRouteParams,
    checkAuthStatus
} = authentication;

// 使用聊天管理组合式函数
const chatManager = useChatManager();
const {
    chatHistory,
    chatHistoryRef,
    isChatMode,
    isGenerating,
    inputMessage,
    currentAbortController,
    sendMessage: chatSendMessage,
    stopGeneration,
    createNewChat: chatCreateNewChat,
    scrollToBottom,
    scrollToTop,
    handleScroll,
    updateChatHistoryHeight,
    handleLoadChat,
    handleCreateNewChat,
    handleRenameChat,
    handleDeleteChat,
    // 新增：流式暂停相关状态
    isStreamPaused
} = chatManager;

const showUserProfile = ref(false); // 控制是否显示个人中心
const showRecordsCenter = ref(false); // 控制是否显示记录中心
// 量化分析提醒相关状态已移至 useStockOperations
const showChatShortcuts = ref(false); // 已废弃，快捷操作按钮现在直接显示

// 使用移动端适配composable（重构版）
const mobileAdaptation = useMobileAdaptation();
const {
    isMobileView,
    showMobileMenu,
    showMobileUserMenu,
    hideMobileUserMenu,
    handleMobileCommand,
    getMobileSmartRecommendationConfig,
    // 新增：可以直接访问底层composables
    breakpoints,
    layout,
    menu
} = mobileAdaptation;

// 键盘状态监听 - 用于微信环境优化
const isKeyboardVisible = computed(() => layout.isKeyboardVisible.value);

// 添加调试信息
const debugKeyboardState = () => {
    console.log('=== 键盘状态调试信息 ===');
    console.log('当前键盘状态:', isKeyboardVisible.value);
    console.log('是否微信环境:', isWechatEnv.value);
    console.log('视口高度:', window.innerHeight);
    console.log('可视视口高度:', window.visualViewport ? window.visualViewport.height : 'N/A');
    console.log('body类名:', document.body.className);
    console.log('========================');
};

// 监听键盘状态变化，为微信环境添加CSS类
watch(isKeyboardVisible, (newVal) => {
    console.log('键盘状态变化:', newVal);
    debugKeyboardState();

    if (isWechatEnv.value) {
        const body = document.body;
        if (newVal) {
            body.classList.add('keyboard-open');
            console.log('✅ 微信环境：键盘打开，添加keyboard-open类');
        } else {
            body.classList.remove('keyboard-open');
            console.log('✅ 微信环境：键盘关闭，移除keyboard-open类');
        }

        // 再次检查类名是否正确应用
        setTimeout(() => {
            const hasKeyboardClass = body.classList.contains('keyboard-open');
            console.log('键盘类名检查:', hasKeyboardClass, '预期:', newVal);
            if (hasKeyboardClass !== newVal) {
                console.warn('⚠️ 键盘类名状态不匹配，尝试重新设置');
                if (newVal) {
                    body.classList.add('keyboard-open');
                } else {
                    body.classList.remove('keyboard-open');
                }
            }
        }, 100);
    }
}, { immediate: true });

// 添加手动键盘状态切换（用于调试）
const toggleKeyboardState = () => {
    layout.isKeyboardVisible.value = !layout.isKeyboardVisible.value;
    console.log('手动切换键盘状态:', layout.isKeyboardVisible.value);
};

// 添加额外的键盘检测机制
const setupAdditionalKeyboardDetection = () => {
    if (!isWechatEnv.value) return;

    console.log('🔧 设置额外的键盘检测机制（微信环境）');

    // 手动强制检查键盘状态的函数
    const forceCheckKeyboardState = () => {
        let keyboardVisible = false;

        // 检查输入框焦点状态
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );

        // 检查visualViewport
        if (window.visualViewport) {
            const heightDiff = window.innerHeight - window.visualViewport.height;
            const viewportKeyboardVisible = heightDiff > 150;

            console.log('🔍 强制检查键盘状态:', {
                inputFocused: isInputFocused,
                viewportKeyboardVisible,
                heightDiff,
                innerHeight: window.innerHeight,
                visualHeight: window.visualViewport.height
            });

            // 如果输入框聚焦或视口检测到键盘，则认为键盘显示
            keyboardVisible = isInputFocused || viewportKeyboardVisible;
        } else {
            // 降级：仅基于输入框焦点
            keyboardVisible = isInputFocused;
            console.log('🔍 降级检查键盘状态（无visualViewport）:', {
                inputFocused: isInputFocused,
                keyboardVisible
            });
        }

        // 更新状态
        if (keyboardVisible !== layout.isKeyboardVisible.value) {
            layout.isKeyboardVisible.value = keyboardVisible;
            console.log('🎹 强制更新键盘状态:', keyboardVisible);
        }
    };

    // 监听输入框焦点事件（作为补充检测）
    const handleFocusIn = (event) => {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
            console.log('📱 Main.vue检测到输入框获得焦点:', target.tagName);
            setTimeout(() => {
                forceCheckKeyboardState();
            }, 400); // 稍微延长延迟，确保键盘动画完成
        }
    };

    const handleFocusOut = (event) => {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
            console.log('📱 Main.vue检测到输入框失去焦点:', target.tagName);
            setTimeout(() => {
                forceCheckKeyboardState();
            }, 400);
        }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // 监听visualViewport变化（如果支持）
    if (window.visualViewport) {
        const handleVisualViewportChange = () => {
            console.log('📱 Main.vue监听到visualViewport变化');
            setTimeout(() => {
                forceCheckKeyboardState();
            }, 100);
        };

        window.visualViewport.addEventListener('resize', handleVisualViewportChange);

        // 清理函数
        onUnmounted(() => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
            window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        });
    } else {
        // 清理函数
        onUnmounted(() => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        });
    }

    // 初始检查
    setTimeout(() => {
        forceCheckKeyboardState();
    }, 500);
};

// 在组件挂载时设置额外的键盘检测
onMounted(() => {
    setupAdditionalKeyboardDetection();

    // 添加全局清理方法供开发者使用
    window.clearPortfolioData = () => {
        if (userStore.clearPortfolio()) {
            console.log('✅ 持仓数据已清理');
            ElMessage.success('持仓数据已清理');
            // 如果当前有资产分析消息，刷新它
            const lastAssetMessage = chatHistory.value.findLast(msg => msg.hasAssetInfo);
            if (lastAssetMessage) {
                const messageIndex = chatHistory.value.indexOf(lastAssetMessage);
                regenerateAssetAnalysis(messageIndex);
            }
        } else {
            console.log('❌ 清理持仓数据失败');
            ElMessage.error('清理失败');
        }
    };

    // 添加移除指定股票的方法
    window.removeStockFromPortfolio = (stockCode) => {
        if (userStore.removeFromPortfolio(stockCode)) {
            console.log(`✅ 已移除股票 ${stockCode}`);
            ElMessage.success(`已移除股票 ${stockCode}`);
            // 如果当前有资产分析消息，刷新它
            const lastAssetMessage = chatHistory.value.findLast(msg => msg.hasAssetInfo);
            if (lastAssetMessage) {
                const messageIndex = chatHistory.value.indexOf(lastAssetMessage);
                regenerateAssetAnalysis(messageIndex);
            }
        } else {
            console.log(`❌ 移除股票 ${stockCode} 失败`);
            ElMessage.error(`移除股票 ${stockCode} 失败`);
        }
    };

    // 提示用户如何使用
    console.log('🔧 开发者工具已加载:');
    console.log('- 清理所有持仓数据: clearPortfolioData()');
    console.log('- 移除指定股票: removeStockFromPortfolio("000001")');
    console.log('- 查看当前持仓: console.log(userStore.portfolio)');

    // 检查是否有被污染的持仓数据
    const suspiciousStocks = ['000001', '600036', '000858', '300750'].filter(code =>
        userStore.portfolio.some(p => p.code === code)
    );

    if (suspiciousStocks.length > 0) {
        console.warn('⚠️ 检测到可能的mock数据污染:');
        console.warn('污染的股票代码:', suspiciousStocks);
        console.warn('请执行 clearPortfolioData() 清理数据');
    }

    // 添加调试函数到全局，方便测试
    window.debugWatchlistRegenerate = () => {
        console.log('🔧 调试：自选股重新生成功能');
        console.log('当前聊天历史长度:', chatHistory.value.length);
        console.log('当前聊天历史:', chatHistory.value.map(msg => ({
            role: msg.role,
            content: msg.content?.substring(0, 50) + '...',
            isWatchlistDisplay: msg.isWatchlistDisplay,
            hasWatchlistInfo: msg.hasWatchlistInfo,
            watchlistData: !!msg.watchlistData,
            id: msg.id,
            timestamp: msg.timestamp
        })));

        // 查找自选股消息
        const watchlistMessages = chatHistory.value.filter(msg =>
            msg.role === 'assistant' && (
                msg.isWatchlistDisplay ||
                msg.watchlistData ||
                msg.hasWatchlistInfo ||
                (msg.content && msg.content.includes('自选股'))
            )
        );

        console.log('找到的自选股消息数量:', watchlistMessages.length);
        console.log('找到的自选股消息:', watchlistMessages);

        if (watchlistMessages.length > 0) {
            const latestMessage = watchlistMessages[watchlistMessages.length - 1];
            console.log('最新的自选股消息:', latestMessage);
            console.log('消息类型判断:', determineMessageType(latestMessage));

            // 检查消息索引
            const messageIndex = chatHistory.value.findIndex(msg => msg.id === latestMessage.id);
            console.log('消息在聊天历史中的索引:', messageIndex);

            // 查找对应的用户消息
            let userMessage = null;
            for (let i = messageIndex - 1; i >= 0; i--) {
                if (chatHistory.value[i] && chatHistory.value[i].role === 'user') {
                    console.log(`检查用户消息 ${i}:`, chatHistory.value[i].content);
                    if (chatHistory.value[i].content &&
                        (chatHistory.value[i].content.includes('自选股') ||
                            chatHistory.value[i].content.includes('查看我的自选股列表'))) {
                        userMessage = chatHistory.value[i];
                        console.log('找到对应的用户消息:', userMessage);
                        break;
                    }
                }
            }

            if (!userMessage) {
                console.log('⚠️ 没有找到对应的用户消息！');
            }

            // 模拟点击重新生成按钮
            handleRegenerateMessage({ message: latestMessage });
        } else {
            console.log('没有找到自选股消息');
        }
    };

    // 添加通用的重新生成调试函数
    window.debugRegenerate = (messageType = 'watchlist') => {
        console.log(`🔧 调试：${messageType} 重新生成功能`);
        console.log('当前isGenerating状态:', isGenerating.value);

        let targetMessages = [];
        switch (messageType) {
            case 'watchlist':
                targetMessages = chatHistory.value.filter(msg =>
                    msg.role === 'assistant' && (
                        msg.isWatchlistDisplay ||
                        msg.watchlistData ||
                        msg.hasWatchlistInfo ||
                        (msg.content && msg.content.includes('自选股'))
                    )
                );
                break;
            case 'recommendation':
                targetMessages = chatHistory.value.filter(msg =>
                    msg.role === 'assistant' && (
                        msg.hasStockInfo ||
                        msg.stockList ||
                        msg.isRecommendation ||
                        (msg.content && msg.content.includes('智能荐股'))
                    )
                );
                break;
            case 'asset':
                targetMessages = chatHistory.value.filter(msg =>
                    msg.role === 'assistant' && (
                        msg.hasAssetInfo ||
                        msg.assetData ||
                        (msg.content && msg.content.includes('资产'))
                    )
                );
                break;
            case 'news':
                targetMessages = chatHistory.value.filter(msg =>
                    msg.role === 'assistant' && (
                        msg.isNewsUpdate ||
                        (msg.content && msg.content.includes('资讯'))
                    )
                );
                break;
        }

        console.log(`找到的${messageType}消息:`, targetMessages);

        if (targetMessages.length > 0) {
            const latestMessage = targetMessages[targetMessages.length - 1];
            console.log(`最新的${messageType}消息:`, latestMessage);
            console.log('消息类型判断:', determineMessageType(latestMessage));
            console.log('消息的isGenerating状态:', latestMessage.isGenerating);
            console.log('消息的content长度:', latestMessage.content?.length || 0);

            // 模拟点击重新生成按钮
            handleRegenerateMessage({ message: latestMessage });
        } else {
            console.log(`没有找到${messageType}消息`);
        }
    };

    // 添加测试清空效果的函数
    window.testClearEffect = () => {
        console.log('🔧 测试清空效果');

        // 找到最后一条AI消息
        const lastAiMessage = chatHistory.value.slice().reverse().find(msg => msg.role === 'assistant');

        if (lastAiMessage) {
            console.log('找到最后一条AI消息:', lastAiMessage);
            console.log('原始content长度:', lastAiMessage.content?.length || 0);
            console.log('原始isGenerating状态:', lastAiMessage.isGenerating);
            console.log('原始isWatchlistDisplay状态:', lastAiMessage.isWatchlistDisplay);
            console.log('原始watchlistData:', !!lastAiMessage.watchlistData);

            // 模拟清空效果
            const originalContent = lastAiMessage.content;
            const originalIsGenerating = lastAiMessage.isGenerating;
            const originalIsWatchlistDisplay = lastAiMessage.isWatchlistDisplay;
            const originalWatchlistData = lastAiMessage.watchlistData;
            const originalHasWatchlistInfo = lastAiMessage.hasWatchlistInfo;
            const originalWatchlistStats = lastAiMessage.watchlistStats;
            const originalHasInteractionButtons = lastAiMessage.hasInteractionButtons;
            const originalInteractionData = lastAiMessage.interactionData;

            // 清空所有相关数据
            lastAiMessage.content = '';
            lastAiMessage.isGenerating = true;
            lastAiMessage.isWatchlistDisplay = false;
            lastAiMessage.watchlistData = null;
            lastAiMessage.hasWatchlistInfo = false;
            lastAiMessage.watchlistStats = null;
            lastAiMessage.hasInteractionButtons = false;
            lastAiMessage.interactionData = null;

            // 触发响应式更新
            chatHistory.value = [...chatHistory.value];

            console.log('消息已清空，isGenerating已设置为true');
            console.log('请检查UI是否显示"AI正在思考中..."动画');

            // 5秒后恢复内容
            setTimeout(() => {
                lastAiMessage.content = originalContent;
                lastAiMessage.isGenerating = originalIsGenerating;
                lastAiMessage.isWatchlistDisplay = originalIsWatchlistDisplay;
                lastAiMessage.watchlistData = originalWatchlistData;
                lastAiMessage.hasWatchlistInfo = originalHasWatchlistInfo;
                lastAiMessage.watchlistStats = originalWatchlistStats;
                lastAiMessage.hasInteractionButtons = originalHasInteractionButtons;
                lastAiMessage.interactionData = originalInteractionData;
                chatHistory.value = [...chatHistory.value];
                console.log('内容已恢复');
            }, 5000);
        } else {
            console.log('没有找到AI消息');
        }
    };

    // 添加专门测试自选股重新生成的函数
    window.testWatchlistRegenerate = () => {
        console.log('🔧 测试自选股重新生成功能');

        // 创建一个完整的自选股消息对话
        const userMessage = {
            role: 'user',
            content: '查看我的自选股列表',
            timestamp: Date.now() - 2000,
            id: generateMessageId()
        };

        const watchlistMessage = {
            role: 'assistant',
            content: '📋 我的自选股列表\n\n您当前关注 2 只股票，详细信息如下：',
            timestamp: Date.now() - 1000,
            id: generateMessageId(),
            isWatchlistDisplay: true,
            hasWatchlistInfo: true,
            watchlistData: [
                { code: '000001', name: '平安银行', price: 10.00, changePct: 0.39 },
                { code: '002371', name: '北方华创', price: 10.00, changePct: 0.39 }
            ],
            hasInteractionButtons: true,
            interactionData: {
                recommendActions: [
                    { id: 'analyze', icon: '📊', description: '分析整体表现' }
                ]
            },
            watchlistStats: {
                total: 2,
                upCount: 1,
                downCount: 1,
                updateTime: new Date().toLocaleString('zh-CN')
            }
        };

        // 添加到聊天历史
        chatHistory.value.push(userMessage, watchlistMessage);
        chatHistory.value = [...chatHistory.value];

        console.log('✅ 自选股消息已添加到聊天历史');
        console.log('用户消息:', userMessage.content);
        console.log('AI消息内容长度:', watchlistMessage.content.length);
        console.log('自选股数据:', watchlistMessage.watchlistData);

        // 滚动到底部
        nextTick(() => {
            scrollToBottom();
        });

        console.log('🔄 5秒后将触发重新生成，请观察：');
        console.log('1. 自选股列表是否消失');
        console.log('2. 是否显示"AI正在思考中..."动画');
        console.log('3. 用户消息"查看我的自选股列表"是否保留');
        console.log('4. 重新生成后是否显示新的自选股数据');

        // 5秒后触发重新生成
        setTimeout(() => {
            console.log('🔄 开始触发重新生成...');
            handleRegenerateMessage({ message: watchlistMessage });
        }, 5000);
    };

    // 添加诊断聊天历史限制的函数
    window.diagnoseChatHistoryLimit = () => {
        console.log('🔍 诊断聊天历史限制问题');
        console.log('当前聊天历史长度:', chatHistory.value.length);
        console.log('当前聊天历史:', chatHistory.value);

        // 检查是否有用户消息
        const userMessages = chatHistory.value.filter(msg => msg.role === 'user');
        console.log('用户消息数量:', userMessages.length);
        console.log('用户消息:', userMessages);

        // 检查是否有自选股相关的用户消息
        const watchlistUserMessages = userMessages.filter(msg =>
            msg.content && (msg.content.includes('自选股') || msg.content.includes('查看我的自选股列表'))
        );
        console.log('自选股用户消息数量:', watchlistUserMessages.length);
        console.log('自选股用户消息:', watchlistUserMessages);

        // 检查chatHistoryStore
        const currentChat = chatHistoryStore.getCurrentChat;
        console.log('chatHistoryStore.currentChatId:', chatHistoryStore.currentChatId);
        console.log('chatHistoryStore.currentChatMessages:', chatHistoryStore.currentChatMessages);

        // 检查本地存储
        const localStorageData = localStorage.getItem('chatHistoryList');
        console.log('本地存储数据:', localStorageData ? JSON.parse(localStorageData) : '无数据');
    };

    // 添加专门测试自选股重新生成问题的函数
    window.testWatchlistRegenerateIssue = () => {
        console.log('🔧 测试自选股重新生成问题');

        // 创建一个简单的自选股消息对话
        const userMessage = {
            role: 'user',
            content: '查看我的自选股列表',
            timestamp: Date.now() - 2000,
            id: generateMessageId()
        };

        const watchlistMessage = {
            role: 'assistant',
            content: '📋 我的自选股列表\n\n您当前关注 2 只股票，详细信息如下：',
            timestamp: Date.now() - 1000,
            id: generateMessageId(),
            isWatchlistDisplay: true,
            hasWatchlistInfo: true,
            watchlistData: [
                { code: '000001', name: '平安银行', price: 10.00, changePct: 0.39 },
                { code: '002371', name: '北方华创', price: 10.00, changePct: 0.39 }
            ],
            hasInteractionButtons: true,
            interactionData: {
                recommendActions: [
                    { id: 'analyze', icon: '📊', description: '分析整体表现' }
                ]
            },
            watchlistStats: {
                total: 2,
                upCount: 1,
                downCount: 1,
                updateTime: new Date().toLocaleString('zh-CN')
            }
        };

        // 清空当前聊天历史
        chatHistory.value = [];

        // 添加到聊天历史
        chatHistory.value.push(userMessage, watchlistMessage);
        chatHistory.value = [...chatHistory.value];

        console.log('✅ 测试消息已添加到聊天历史');
        console.log('用户消息:', userMessage);
        console.log('自选股消息:', watchlistMessage);

        // 滚动到底部
        nextTick(() => {
            scrollToBottom();
        });

        console.log('🔄 2秒后将触发重新生成...');

        // 2秒后触发重新生成
        setTimeout(() => {
            console.log('🔄 开始触发重新生成...');
            console.log('重新生成前的聊天历史:', chatHistory.value.map(msg => ({
                role: msg.role,
                content: msg.content?.substring(0, 30) + '...',
                id: msg.id
            })));

            // 直接调用重新生成函数
            const messageIndex = chatHistory.value.findIndex(msg => msg.id === watchlistMessage.id);
            console.log('自选股消息索引:', messageIndex);

            if (messageIndex !== -1) {
                regenerateWatchlistView(messageIndex);
            } else {
                console.error('找不到自选股消息');
            }
        }, 2000);
    };

    // 检查chatHistoryStore
    const currentChat = chatHistoryStore.getCurrentChat;
    if (currentChat) {
        console.log('当前聊天记录:', currentChat);
        console.log('当前聊天消息数量:', currentChat.messages?.length || 0);

        // 测试limitChatMessages的行为
        const originalMessages = currentChat.messages || [];
        const limitedMessages = chatHistoryManager.limitChatMessages(originalMessages);
        console.log('原始消息数量:', originalMessages.length);
        console.log('限制后消息数量:', limitedMessages.length);
        console.log('是否有消息被删除:', originalMessages.length > limitedMessages.length);

        if (originalMessages.length > limitedMessages.length) {
            console.log('被删除的消息:', originalMessages.slice(0, originalMessages.length - limitedMessages.length));
        }
    } else {
        console.log('没有当前聊天记录');
    }

    // 定期检查键盘状态（仅在微信环境下，作为最后的保障）
    if (isWechatEnv.value) {
        const checkInterval = setInterval(() => {
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true'
            );

            // 获取视口信息
            let viewportKeyboardVisible = false;
            if (window.visualViewport) {
                const heightDiff = window.innerHeight - window.visualViewport.height;
                viewportKeyboardVisible = heightDiff > 150;
            }

            // 综合判断键盘状态
            const shouldKeyboardVisible = isInputFocused || viewportKeyboardVisible;

            if (shouldKeyboardVisible !== layout.isKeyboardVisible.value) {
                console.log('🔄 定期检查发现键盘状态不匹配，更新状态:', {
                    current: layout.isKeyboardVisible.value,
                    expected: shouldKeyboardVisible,
                    inputFocused: isInputFocused,
                    viewportKeyboard: viewportKeyboardVisible
                });
                layout.isKeyboardVisible.value = shouldKeyboardVisible;
            }
        }, 2000); // 增加间隔到2秒，减少性能影响

        // 清理定时器
        onUnmounted(() => {
            clearInterval(checkInterval);
        });
    }
});

// 使用语音输入组合式函数
const voiceInput = useVoiceInput();
const {
    isRecording,
    recordingDuration,
    isWechatEnv,
    onVoiceClick: voiceOnClick,
    initVoice,
    cleanupVoice
} = voiceInput;

// 使用股票操作组合式函数
const stockOperations = useStockOperations();
const {
    selectedStock,
    tradeType,
    buyDialogVisible,
    showAITradingDialog,
    selectedStockForAITrading,
    showQuantReminderDialog,
    currentReminderMessage,
    activeReminders,
    getCurrentStockPrice,
    formatRecommendationTime,
    getRiskLevelText,
    getExperienceText,
    getFocusIndustryText,
    handleSmartRecommendation: stockHandleSmartRecommendation,
    handleNewsUpdate: stockHandleNewsUpdate,
    handleAssetAnalysis: stockHandleAssetAnalysis,
    generateWatchlistStockData,
    handleAITradingConfirmed: stockHandleAITradingConfirmed,
    setQuantAnalysisReminder,
    showBuyDialog,
    showQuantAnalysisDialog,
    showPaidAnalysisDialog,
    handleShowSellDialog,
    scrollToRecommendation,
    refreshRecommendation: stockRefreshRecommendation,
    handleReminderConfirm: stockHandleReminderConfirm,
} = stockOperations;

// 简化：直接使用stockHandleAITradingConfirmed，无需包装函数

// 缺失的方法定义
const handlePreferencesSkipped = () => {
    console.log('用户跳过了偏好设置');
    // 可以在这里添加跳过偏好设置的逻辑
};

const handleTradeCompleted = (tradeData) => {
    console.log('交易完成:', tradeData);
    // 可以在这里添加交易完成后的逻辑，比如更新用户持仓
    if (tradeData && tradeData.type === 'buy') {
        ElMessage.success(`成功买入 ${tradeData.quantity} 股 ${tradeData.stockName}`);
    } else if (tradeData && tradeData.type === 'sell') {
        ElMessage.success(`成功卖出 ${tradeData.quantity} 股 ${tradeData.stockName}`);
    }
};

const handleWatchlistChanged = (changeData) => {
    console.log('自选股发生变化:', changeData);
    // 可以在这里添加自选股变化后的逻辑
    if (changeData && changeData.action === 'add') {
        ElMessage.success(`已添加 ${changeData.stockName} 到自选股`);
    } else if (changeData && changeData.action === 'remove') {
        ElMessage.success(`已从自选股移除 ${changeData.stockName}`);
    }
};

const handleAITradingConfirmed = (tradingData) => {
    console.log('AI交易确认:', tradingData);
    // 使用从 useStockOperations 导入的方法，传递必要的参数
    return stockHandleAITradingConfirmed(
        tradingData,
        chatHistory,
        isChatMode,
        scrollToBottom
    );
};

const showGuideTip = ref(false);
const guideActionText = ref('开始体验');

// 使用从 useStockOperations 导入的 handleReminderConfirm
const handleReminderConfirm = (reminder) => {
    return stockHandleReminderConfirm(reminder);
};

// 刷新荐股列表的包装函数
const refreshRecommendation = async (message) => {
    // 暂时禁用自动滚动
    shouldAutoScroll.value = false;

    try {
        const result = await stockRefreshRecommendation(message, userStore, chatHistory);
        return result;
    } finally {
        // 无论成功还是失败，都要重新启用自动滚动
        nextTick(() => {
            shouldAutoScroll.value = true;
        });
    }
};

const handleReminderCancel = (reminder) => {
    console.log('取消提醒:', reminder);
    // 可以在这里添加取消提醒的逻辑
    ElMessage.info('提醒已取消');
};

const removeReminder = (reminderId) => {
    console.log('删除提醒:', reminderId);
    // 从活跃提醒列表中移除
    const index = activeReminders.value.findIndex(r => r.id === reminderId);
    if (index !== -1) {
        activeReminders.value.splice(index, 1);
        ElMessage.success('提醒已删除');
    }
};

// handleShowSellDialog 和 scrollToRecommendation 已在 useStockOperations 中定义

const handleGuideAction = () => {
    console.log('处理引导操作');
    // 可以在这里添加引导操作的逻辑
    showGuideTip.value = false;
};

const dismissGuide = () => {
    console.log('关闭引导提示');
    showGuideTip.value = false;
};



// 聊天历史相关
const showChatHistory = ref(false); // 控制聊天历史面板显示
const chatHistoryComponentRef = ref(null);

// 消息操作相关
const messageCopyStates = ref(new Map()); // 存储每条消息的复制状态

// 快捷操作自定义相关
const customizeDialogVisible = ref(false);

// 资产分析Tab切换
const activeTab = ref('portfolio'); // 默认显示持仓明细



// 简化的ShortcutsBar组件操作函数
const notifyShortcutsBarComponents = (method) => {
    [shortcutsBarRef.value, chatShortcutsBarRef.value, mobileChatShortcutsRef.value].forEach((ref, index) => {
        if (ref && typeof ref[method] === 'function') {
            try {
                ref[method]();
                const componentName = index === 0 ? '初始模式' : index === 1 ? '聊天模式' : '移动端聊天';
                console.log(`✅ 已通知${componentName}ShortcutsBar组件执行${method}`);
            } catch (error) {
                console.warn(`⚠️ 通知ShortcutsBar执行${method}时出错:`, error);
            }
        }
    });
};

// 主页快捷操作数据
const activeHomeShortcuts = ref([]);

// 默认主页快捷操作配置
const defaultHomeShortcuts = ref([
    {
        id: 'smart_review',
        icon: '📊',
        title: '智能复盘',
        shortTitle: '复盘',
        description: '智能分析市场表现和投资策略',
        action: 'smart_review',
        isDefault: true,
        isActive: true
    },
    {
        id: 'watchlist',
        icon: '⭐',
        title: '自选股',
        shortTitle: '自选',
        description: '查看和管理我的自选股票',
        action: 'watchlist',
        isDefault: true,
        isActive: true
    },
    {
        id: 'smart_recommendation',
        icon: '📈',
        title: '智能荐股',
        shortTitle: '荐股',
        description: '基于AI算法推荐优质股票',
        action: 'smart_recommendation',
        isDefault: true,
        isActive: true
    },
    {
        id: 'news_update',
        icon: '📄',
        title: '资讯推送',
        shortTitle: '资讯',
        description: '获取最新市场资讯和重要公告',
        action: 'news_update',
        isDefault: true,
        isActive: true
    },
    {
        id: 'asset_analysis',
        icon: '💼',
        title: '我的资产',
        shortTitle: '资产',
        description: '查看投资组合和账户分析',
        action: 'asset_analysis',
        isDefault: true,
        isActive: true
    }
]);

// 快捷操作数据管理类
class HomeShortcutsManager {
    static getDefaultStates() {
        const saved = localStorage.getItem('defaultShortcutStates');
        return saved ? JSON.parse(saved) : {};
    }

    static getCustomShortcuts() {
        const saved = localStorage.getItem('customShortcuts');
        return saved ? JSON.parse(saved) : [];
    }

    static loadActiveShortcuts(defaultShortcuts) {
        const result = [];
        const states = this.getDefaultStates();

        // 添加激活的默认快捷操作
        const activeDefaults = defaultShortcuts.filter(s => {
            if (states.hasOwnProperty(s.id)) {
                s.isActive = states[s.id];
            }
            return s.isActive;
        });
        result.push(...activeDefaults);

        // 添加激活的自定义快捷操作
        const customShortcuts = this.getCustomShortcuts();
        const activeCustoms = customShortcuts
            .filter(s => s.isActive)
            .map(shortcut => ({ ...shortcut, action: 'custom' }));
        result.push(...activeCustoms);

        return result;
    }
}

// 初始化主页快捷操作
const initializeHomeShortcuts = () => {
    console.log('🔄 初始化主页快捷操作');
    console.log('🔍 默认快捷操作配置:', defaultHomeShortcuts.value);
    activeHomeShortcuts.value = HomeShortcutsManager.loadActiveShortcuts(defaultHomeShortcuts.value);
    console.log('✅ 主页快捷操作初始化完成，总数:', activeHomeShortcuts.value.length);
    console.log('🔍 激活的快捷操作:', activeHomeShortcuts.value);
};

// 初始化快捷操作
const initializeShortcuts = () => {
    console.log('🔄 初始化快捷操作');
    notifyShortcutsBarComponents('initializeShortcuts');
    // 同时初始化主页快捷操作
    initializeHomeShortcuts();
    console.log('✅ 快捷操作初始化完成');
};




// 用户投资数据 - 为PerformanceHeader提供数据
const userPerformanceData = computed(() => {
    if (!userStore.isLoggedIn || userStore.portfolio.length === 0) {
        return {
            todayProfit: 0,
            totalProfit: 0,
            totalProfitRate: 0,
            portfolioValue: 0
        };
    }

    // 计算持仓盈亏
    const portfolioData = userStore.portfolio.map(position => {
        const currentPrice = getCurrentStockPrice(position.code);
        const marketValue = position.quantity * currentPrice;
        const costValue = position.quantity * position.avgPrice;
        const profit = marketValue - costValue;

        return {
            ...position,
            currentPrice,
            marketValue,
            costValue,
            profit
        };
    });

    // 计算总盈亏
    const totalProfit = portfolioData.reduce((sum, item) => sum + item.profit, 0);
    const totalCostValue = portfolioData.reduce((sum, item) => sum + item.costValue, 0);
    const totalProfitRate = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;
    const portfolioValue = portfolioData.reduce((sum, item) => sum + item.marketValue, 0);

    // 模拟今日收益（简化处理，实际应该基于今日价格变化）
    const todayProfit = totalProfit * (Math.random() * 0.3 - 0.15); // 模拟今日收益为总收益的-15%到15%

    return {
        todayProfit: parseFloat(todayProfit.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        totalProfitRate: parseFloat(totalProfitRate.toFixed(2)),
        portfolioValue: parseFloat(portfolioValue.toFixed(2))
    };
});

// 个性化引导流程控制
const showOnboarding = ref(false); // 是否显示引导流程
const newUserForceStart = ref(false); // 标记是否为新用户注册，需要强制从头开始引导

// 投资偏好设置
const preferencesDialogVisible = ref(false);

const handleCommand = async (command) => {
    await handleUserCommand(command, {
        onShowProfile: () => { showUserProfile.value = true; },
        onShowPreferences: () => { preferencesDialogVisible.value = true; },
        onShowRecords: () => { showRecordsCenter.value = true; },
        onResetPageState: () => {
            chatHistory.value = [];
            inputMessage.value = '';
            isChatMode.value = false;
            showUserProfile.value = false;
            showRecordsCenter.value = false;
        }
    });
};

// TopNavbar 组件的事件处理方法
const handleShowProfile = () => {
    showUserProfile.value = true;
};

const handleShowPreferences = () => {
    preferencesDialogVisible.value = true;
};

const handleShowRecords = () => {
    showRecordsCenter.value = true;
};

// 发送消息 - 使用组合式函数
const sendMessage = async () => {
    // 检查用户登录状态
    if (!checkAuthStatus('开始对话')) {
        return;
    }
    await chatSendMessage(userStore, isMobileView, mobileAdaptation, scrollToBottom);
};

// 创建新聊天 - 使用组合式函数
const createNewChat = () => {
    chatCreateNewChat(isMobileView, mobileAdaptation, scrollToTop);
};

// 包装聊天历史相关函数，传递必要参数
const wrappedHandleCreateNewChat = () => {
    handleCreateNewChat(isMobileView, mobileAdaptation, scrollToTop);
};

const wrappedHandleDeleteChat = (chatId) => {
    handleDeleteChat(chatId, isMobileView, mobileAdaptation, scrollToTop);
};

// 控制是否自动滚动的标志
const shouldAutoScroll = ref(true);

watch(chatHistory, () => {
    nextTick(() => {
        // 只有在应该自动滚动时才滚动
        if (shouldAutoScroll.value) {
            scrollToBottom();
        }
        // 确保滚动事件监听器已绑定
        if (chatHistoryRef.value && !chatHistoryRef.value.hasScrollListener) {
            chatHistoryRef.value.addEventListener('scroll', handleScroll, { passive: true });
            chatHistoryRef.value.hasScrollListener = true;
        }
    });
}, { deep: true });

// 监听聊天模式变化 - 增强处理，确保输入框正确定位
watch(isChatMode, (newVal) => {
    console.log('isChatMode变化:', { newVal, isMobileView: isMobileView.value });

    if (newVal) {
        // 进入聊天模式
        nextTick(() => {
            scrollToBottom();
            updateChatHistoryHeight();

            // 移动端处理 - 立即调整输入框位置
            if (isMobileView.value) {
                console.log('准备调用fixMobileChatBox - isChatMode监听器');

                // 立即执行一次修复
                mobileAdaptation.fixMobileChatBox(isChatMode.value);

                // 延迟执行确保DOM完全渲染
                setTimeout(() => {
                    mobileAdaptation.fixMobileChatBox(isChatMode.value);
                    mobileAdaptation.handleMobileKeyboard(scrollToBottom);
                    // 修复后重新更新聊天历史高度
                    updateChatHistoryHeight();
                    scrollToBottom();
                }, 100);

                // 再次确认修复（处理某些浏览器的延迟渲染）
                setTimeout(() => {
                    mobileAdaptation.fixMobileChatBox(isChatMode.value);
                    updateChatHistoryHeight();
                }, 300);
            }
        });
    } else {
        // 退出聊天模式，恢复初始状态
        nextTick(() => {
            if (isMobileView.value) {
                // 只清理input-area的聊天模式样式，不要影响ai-card
                const inputArea = document.querySelector('.input-area');

                if (inputArea) {
                    // 不清除样式，让CSS完全控制
                    console.log('保持input-area样式，让CSS控制布局');
                }

                // 延迟执行主页布局重置，重新应用ai-card的修复
                setTimeout(() => {
                    mobileAdaptation.resetMobileLayout(isChatMode.value, scrollToTop);
                }, 100);
            }
        });
    }
});


// 语音点击处理 - 使用组合式函数
const onVoiceClick = () => {
    voiceOnClick(inputMessage);
};

// 切换聊天快捷操作显示（已废弃，快捷操作按钮现在直接显示）
const toggleChatShortcuts = () => {
    // 快捷操作按钮现在直接显示，不再需要切换
    console.log('toggleChatShortcuts: 快捷操作按钮现在直接显示，无需切换');
};

// 移动端侧边栏状态管理
const sidebarRef = ref(null);

// 计算属性：检查移动端侧边栏是否可用
const isMobileSidebarAvailable = computed(() => {
    // 只有在用户已登录且在移动端时才显示按钮
    return userStore.isLoggedIn && isMobileView.value;
});

// 处理移动端侧边栏切换，带双重检查
const handleMobileSidebarToggle = () => {
    // 在点击时再次检查条件，确保组件仍然可用
    if (userStore.isLoggedIn &&
        isMobileView.value) {
        mobileAdaptation.toggleMobileSidebar(sidebarRef);
    } else {
        console.warn('移动端侧边栏不可用，忽略点击事件', {
            isLoggedIn: userStore.isLoggedIn,
            isMobileView: isMobileView.value,
            hasRef: !!sidebarRef.value,
            hasMethod: !!sidebarRef.value?.toggleSidebar
        });
    }
};


const setSuggestionAndSend = async (suggestion) => {
    console.log('🚀 setSuggestionAndSend 被调用:', suggestion);

    // 设置输入框内容
    inputMessage.value = suggestion;

    // 切换到聊天模式（如果还不是）
    if (!isChatMode.value) {
        isChatMode.value = true;
    }



    // 立即设置生成状态，让发送按钮进入"生成中"状态
    console.log('🔄 设置 isGenerating = true');
    isGenerating.value = true;

    try {
        // 延迟发送，让用户看到发送按钮状态变化
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 500));

        // 检查是否被用户中断
        if (!isGenerating.value) {
            console.log('🔄 智能复盘 - 操作被用户中断');
            return;
        }

        console.log('🔄 准备发送消息，重置 isGenerating = false');
        // 先重置生成状态，然后调用正常的发送流程
        isGenerating.value = false;
        sendMessage();
    } catch (error) {
        console.error('🔄 setSuggestionAndSend 执行出错:', error);
        isGenerating.value = false;
    }
};

// 设置建议文本但不发送（用于引导示例）
const setSuggestionText = (suggestion) => {
    inputMessage.value = suggestion;
    // 让输入框获得焦点
    nextTick(() => {
        const inputEl = document.querySelector('.ai-input textarea');
        if (inputEl) {
            inputEl.focus();
        }
    });
};



// 聊天历史相关方法
const toggleChatHistory = () => {
    showChatHistory.value = !showChatHistory.value;
};

const closeChatHistory = () => {
    showChatHistory.value = false;
};

// 处理主体内容点击事件 - 点击主页区域时自动收起聊天历史面板
const handleMainContentClick = (event) => {
    // 只有在聊天历史面板显示时才处理
    if (!showChatHistory.value) {
        return;
    }

    // 检查点击的目标是否是聊天历史面板内的元素
    const chatHistoryPanel = document.querySelector('.chat-history-container');
    if (chatHistoryPanel && chatHistoryPanel.contains(event.target)) {
        return; // 点击的是聊天历史面板内部，不关闭
    }

    // 检查点击的目标是否是聊天历史按钮
    const chatHistoryButton = event.target.closest('.chat-history-btn');
    if (chatHistoryButton) {
        return; // 点击的是聊天历史按钮，不关闭（让按钮自己处理）
    }

    // 检查点击的目标是否是其他可交互元素（按钮、输入框、链接等）
    const interactiveElements = ['button', 'input', 'textarea', 'select', 'a'];
    const clickedElement = event.target.tagName.toLowerCase();
    const isInteractiveElement = interactiveElements.includes(clickedElement) ||
        event.target.closest('button, input, textarea, select, a, .el-button, .el-input');

    // 如果点击的是交互元素，不自动关闭面板
    if (isInteractiveElement) {
        return;
    }

    // 点击的是主页区域的非交互部分，关闭聊天历史面板
    showChatHistory.value = false;

    // 移动端给用户一个反馈
    if (isMobileView.value) {
        console.log('移动端点击主页区域，聊天历史面板已关闭');
    }
};

// 聊天历史处理函数已移至 useChatManager

// 获取复制按钮文本
const getCopyButtonText = (message) => {
    const messageKey = message.id || message.timestamp || Date.now();
    const state = messageCopyStates.value.get(messageKey);
    return state?.text || '复制';
};

// 复制消息内容
const handleCopyMessage = async (message) => {
    const messageKey = message.id || message.timestamp || Date.now();
    const currentState = messageCopyStates.value.get(messageKey);

    if (currentState?.isCopying) return;

    try {
        // 设置复制状态
        messageCopyStates.value.set(messageKey, { isCopying: true, text: '复制中...' });

        // 获取纯文本内容（去除markdown格式）
        const textContent = message.content || '';

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
        messageCopyStates.value.set(messageKey, { isCopying: false, text: '已复制' });

        ElMessage.success('消息已复制到剪贴板');

        // 2秒后恢复按钮文本
        setTimeout(() => {
            messageCopyStates.value.set(messageKey, { isCopying: false, text: '复制' });
        }, 2000);

    } catch (error) {
        console.error('复制失败:', error);
        messageCopyStates.value.set(messageKey, { isCopying: false, text: '复制失败' });
        ElMessage.error('复制失败，请手动选择文本复制');

        setTimeout(() => {
            messageCopyStates.value.set(messageKey, { isCopying: false, text: '复制' });
        }, 2000);
    }
};

// 重新生成消息 - 重新设计的安全逻辑
const handleRegenerateMessage = async (data) => {
    try {
        console.log('🔄 重新生成消息 - 接收到的数据:', data);

        // 从事件数据中获取消息对象
        const targetMessage = data.message || data;
        console.log('🔄 重新生成消息 - 目标消息:', {
            role: targetMessage.role,
            content: targetMessage.content?.substring(0, 50),
            hasId: !!targetMessage.id,
            hasTimestamp: !!targetMessage.timestamp
        });

        // 找到该消息在聊天历史中的索引
        const messageIndex = chatHistory.value.findIndex(
            (msg, index) => {
                console.log(`🔍 匹配消息 ${index}:`, {
                    msgId: msg.id,
                    targetId: targetMessage.id,
                    msgTimestamp: msg.timestamp,
                    targetTimestamp: targetMessage.timestamp,
                    msgRole: msg.role,
                    targetRole: targetMessage.role,
                    msgContent: msg.content?.substring(0, 30),
                    targetContent: targetMessage.content?.substring(0, 30)
                });

                // 首先尝试通过ID匹配
                if (msg.id && targetMessage.id && msg.id === targetMessage.id) {
                    console.log(`✅ 通过ID匹配成功: ${index}`);
                    return true;
                }

                // 然后尝试通过timestamp匹配
                if (msg.timestamp && targetMessage.timestamp && msg.timestamp === targetMessage.timestamp) {
                    console.log(`✅ 通过timestamp匹配成功: ${index}`);
                    return true;
                }

                // 最后尝试通过内容和角色匹配（适用于没有ID的旧消息）
                if (msg.role === 'assistant' && targetMessage.role === 'assistant' &&
                    msg.content && targetMessage.content &&
                    msg.content === targetMessage.content) {
                    console.log(`✅ 通过内容匹配成功: ${index}`);
                    return true;
                }

                return false;
            }
        );

        console.log('🔄 重新生成消息 - 找到的消息索引:', messageIndex);

        if (messageIndex === -1) {
            console.error('🔄 重新生成消息 - 无法找到目标消息');
            ElMessage.error('无法找到要重新生成的消息');
            return;
        }

        // 获取当前AI消息
        const currentMessage = chatHistory.value[messageIndex];

        // 验证消息是否存在
        if (!currentMessage) {
            console.error('🔄 重新生成消息 - 消息不存在');
            ElMessage.error('消息不存在');
            return;
        }

        console.log('🔄 重新生成消息 - 当前消息详情:', {
            role: currentMessage.role,
            content: currentMessage.content?.substring(0, 50),
            messageType: currentMessage.messageType
        });

        // 确保只能重新生成AI消息
        if (currentMessage.role !== 'assistant') {
            console.error('🔄 重新生成消息 - 只能重新生成AI消息, 当前角色:', currentMessage.role);
            ElMessage.error('只能重新生成AI消息');
            return;
        }

        console.log('🔄 重新生成消息 - 目标消息详情:', {
            role: currentMessage.role,
            content: currentMessage.content?.substring(0, 100),
            messageIndex: messageIndex,
            messageType: currentMessage.messageType
        });

        // 使用统一的消息类型判断逻辑
        const messageType = determineMessageType(currentMessage, messageIndex);
        console.log('🔄 重新生成消息类型判断结果:', messageType);

        // 设置生成状态
        isGenerating.value = true;

        // 设置全局标志，防止性能优化器干扰重新生成过程
        window.isRegenerating = true;

        try {
            // 根据消息类型调用对应的重新生成函数
            switch (messageType) {
                case 'smart_recommendation':
                    console.log('🔄 调用智能荐股重新生成');
                    await regenerateSmartRecommendation(messageIndex);
                    break;
                case 'watchlist_view':
                    console.log('🔄 调用自选股查看重新生成');
                    await regenerateWatchlistView(messageIndex);
                    break;
                case 'asset_analysis':
                    console.log('🔄 调用资产分析重新生成');
                    await regenerateAssetAnalysis(messageIndex);
                    break;
                case 'news_update':
                    console.log('🔄 调用资讯推送重新生成');
                    await regenerateNewsUpdate(messageIndex);
                    break;
                default:
                    console.log('🔄 调用普通消息重新生成');
                    await regenerateNormalMessage(messageIndex);
                    break;
            }
        } finally {
            // 重置生成状态和全局标志
            isGenerating.value = false;
            window.isRegenerating = false;
        }

    } catch (error) {
        console.error('重新生成消息失败:', error);
        ElMessage.error('重新生成失败，请稍后重试');
        // 确保状态被重置
        isGenerating.value = false;
        window.isRegenerating = false;
    }
};

// 确定消息类型 - 使用更准确的判断逻辑
const determineMessageType = (aiMessage, messageIndex) => {
    console.log('🔍 消息类型判断 - AI消息详情:', {
        messageType: aiMessage.messageType, // 预设的消息类型
        hasStockInfo: aiMessage.hasStockInfo,
        stockList: !!aiMessage.stockList,
        isRecommendation: aiMessage.isRecommendation,
        isWatchlistDisplay: aiMessage.isWatchlistDisplay,
        watchlistData: !!aiMessage.watchlistData,
        hasWatchlistInfo: aiMessage.hasWatchlistInfo,
        hasAssetInfo: aiMessage.hasAssetInfo,
        assetData: !!aiMessage.assetData,
        isAssetAnalysis: aiMessage.isAssetAnalysis,
        isNewsUpdate: aiMessage.isNewsUpdate,
        content: aiMessage.content ? aiMessage.content.substring(0, 100) + '...' : '无内容'
    });

    // 第一优先级：检查预设的消息类型字段（在消息创建时设置）
    if (aiMessage.messageType) {
        console.log('🔍 从预设字段获取消息类型:', aiMessage.messageType);
        return aiMessage.messageType;
    }

    // 第二优先级：基于AI消息的特有属性判断
    // 智能荐股：检查股票推荐相关属性
    if (aiMessage.hasStockInfo || aiMessage.stockList || aiMessage.isRecommendation) {
        console.log('🔍 基于属性判断 - 智能荐股');
        return 'smart_recommendation';
    }

    // 自选股查看：检查自选股相关属性
    if (aiMessage.isWatchlistDisplay || aiMessage.watchlistData || aiMessage.hasWatchlistInfo) {
        console.log('🔍 基于属性判断 - 自选股查看');
        return 'watchlist_view';
    }

    // 资产分析：检查资产相关属性
    if (aiMessage.hasAssetInfo || aiMessage.assetData || aiMessage.isAssetAnalysis) {
        console.log('🔍 基于属性判断 - 资产分析');
        return 'asset_analysis';
    }

    // 资讯推送：检查资讯相关属性
    if (aiMessage.isNewsUpdate) {
        console.log('🔍 基于属性判断 - 资讯推送');
        return 'news_update';
    }

    // 第三优先级：查找对应的用户消息进行内容匹配
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (chatHistory.value[i] && chatHistory.value[i].role === 'user') {
            userMessage = chatHistory.value[i];
            break;
        }
    }

    console.log('🔍 找到的用户消息:', userMessage?.content || '无用户消息');

    if (userMessage?.content) {
        const userContent = userMessage.content.toLowerCase();

        // 基于用户消息内容判断
        if (userContent.includes('智能荐股') || userContent.includes('推荐') ||
            userContent.includes('根据我的投资偏好')) {
            console.log('🔍 基于用户消息判断 - 智能荐股');
            return 'smart_recommendation';
        }

        if (userContent.includes('自选股') || userContent.includes('查看我的自选股') ||
            userContent.includes('我的自选股列表')) {
            console.log('🔍 基于用户消息判断 - 自选股查看');
            return 'watchlist_view';
        }

        if (userContent.includes('资产') || userContent.includes('持仓') ||
            userContent.includes('我的资产')) {
            console.log('🔍 基于用户消息判断 - 资产分析');
            return 'asset_analysis';
        }

        if (userContent.includes('资讯') || userContent.includes('新闻') ||
            userContent.includes('推送')) {
            console.log('🔍 基于用户消息判断 - 资讯推送');
            return 'news_update';
        }
    }

    // 第四优先级：基于AI消息内容的关键词匹配
    if (aiMessage.content) {
        const aiContent = aiMessage.content.toLowerCase();

        if (aiContent.includes('智能荐股') || aiContent.includes('推荐股票') ||
            aiContent.includes('📊 **智能荐股**')) {
            console.log('🔍 基于AI内容判断 - 智能荐股');
            return 'smart_recommendation';
        }

        if (aiContent.includes('📋 **我的自选股列表**') || aiContent.includes('自选股列表') ||
            aiContent.includes('我的自选股')) {
            console.log('🔍 基于AI内容判断 - 自选股查看');
            return 'watchlist_view';
        }

        if (aiContent.includes('资产分析') || aiContent.includes('持仓分析') ||
            aiContent.includes('💼 **资产分析**')) {
            console.log('🔍 基于AI内容判断 - 资产分析');
            return 'asset_analysis';
        }

        if (aiContent.includes('📰 **财经资讯**') || aiContent.includes('市场资讯') ||
            aiContent.includes('今日重要财经新闻')) {
            console.log('🔍 基于AI内容判断 - 资讯推送');
            return 'news_update';
        }
    }

    console.log('🔍 消息类型判断结果: unknown (普通聊天消息)');
    return 'unknown';
};

// 统一的重新生成状态管理
const resetMessageForRegeneration = (message, messageType) => {
    // 清空通用属性
    message.isGenerating = true;
    message.content = '';
    message.timestamp = Date.now();

    // 根据消息类型清空特定属性
    switch (messageType) {
        case 'smart_recommendation':
            message.hasStockInfo = false;
            message.stockList = null;
            message.isRecommendation = false;
            break;
        case 'watchlist_view':
            message.hasWatchlistInfo = false;
            message.watchlistData = null;
            message.isWatchlistDisplay = false;
            message.hasInteractionButtons = false;
            message.interactionData = null;
            message.watchlistStats = null;
            break;
        case 'asset_analysis':
            message.hasAssetInfo = false;
            message.assetData = null;
            message.isAssetAnalysis = false;
            break;
        case 'news_update':
            message.isNewsUpdate = false;
            message.hasInteractionButtons = false;
            message.interactionData = null;
            break;
    }
};

// 统一的重新生成完成状态管理
const completeMessageRegeneration = (message) => {
    message.isGenerating = false;
    message.timestamp = Date.now();
};

// handleQuickActionRegenerate 函数已被移除，逻辑合并到 handleRegenerateMessage 中

// 重新生成普通消息 - 安全的重新生成逻辑
const regenerateNormalMessage = async (messageIndex) => {
    try {
        console.log('🔄 开始重新生成普通消息');

        // 获取当前AI消息引用
        const targetMessage = chatHistory.value[messageIndex];

        // 找到对应的用户消息（不修改用户消息，只用于重新生成）
        let userMessage = null;
        for (let i = messageIndex - 1; i >= 0; i--) {
            if (chatHistory.value[i] && chatHistory.value[i].role === 'user') {
                userMessage = chatHistory.value[i];
                break;
            }
        }

        if (!userMessage) {
            console.error('🔄 无法找到对应的用户消息');
            ElMessage.error('无法找到对应的用户消息');
            return;
        }

        console.log('🔄 找到用户消息:', userMessage.content.substring(0, 100));

        // 第一步：清空AI消息内容并显示生成中状态
        targetMessage.content = '';
        targetMessage.isGenerating = true;
        targetMessage.timestamp = Date.now();

        // 触发响应式更新，让用户立即看到清空效果
        chatHistory.value = [...chatHistory.value];

        // 等待一下让用户看到清空效果和"AI正在思考中..."动画
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🔄 普通消息内容已清空，开始重新生成');

        // 第二步：调用API重新生成
        currentAbortController.value = new AbortController();

        try {
            // 获取当前聊天会话ID
            let conversationId = chatHistoryStore.currentChatId;
            if (!conversationId) {
                conversationId = await chatHistoryStore.createNewChat();
            }

            // 调用流式API
            await authFetchEventSource(
                `${api.devPrefix}${api.chatStreamApi}?conversationId=${conversationId}&userInput=${encodeURIComponent(userMessage.content)}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                    },
                    signal: currentAbortController.value.signal,
                    onopen: async (response) => {
                        console.log('🔄 重新生成 - 流式连接已建立');
                    },
                    onmessage: (event) => {
                        try {
                            const data = event.data;
                            if (data.trim().length === 0) return;

                            // 更新指定位置的AI消息内容
                            const currentTargetMessage = chatHistory.value[messageIndex];
                            if (currentTargetMessage && currentTargetMessage.role === 'assistant') {
                                currentTargetMessage.content += data;
                                currentTargetMessage.isGenerating = false;

                                // 滚动到底部
                                requestAnimationFrame(() => {
                                    scrollToBottom();
                                });
                            }
                        } catch (err) {
                            console.error('🔄 重新生成 - 解析消息时出错:', err);
                        }
                    },
                    onclose: () => {
                        console.log('🔄 重新生成 - 流式连接已关闭');
                        currentAbortController.value = null;

                        // 第三步：完成生成
                        const finalTargetMessage = chatHistory.value[messageIndex];
                        if (finalTargetMessage) {
                            finalTargetMessage.isGenerating = false;
                            finalTargetMessage.timestamp = Date.now();
                            chatHistory.value = [...chatHistory.value];
                        }

                        // 保存聊天历史
                        chatHistoryStore.saveChatHistoryWithoutLimit();

                        console.log('🔄 普通消息重新生成完成');
                        ElMessage.success('消息已重新生成');
                    },
                    onerror: (err) => {
                        console.error('🔄 重新生成 - 流式连接错误:', err);
                        currentAbortController.value = null;

                        // 更新目标消息，添加错误标识
                        const errorTargetMessage = chatHistory.value[messageIndex];
                        if (errorTargetMessage && errorTargetMessage.role === 'assistant') {
                            if (errorTargetMessage.content) {
                                errorTargetMessage.content += '\n\n[连接中断]';
                            } else {
                                errorTargetMessage.content = '[连接中断]';
                            }
                            errorTargetMessage.isGenerating = false;
                            chatHistory.value = [...chatHistory.value];
                        }

                        ElMessage.error('重新生成失败，连接中断');
                    },
                }
            );
        } catch (err) {
            console.error('🔄 重新生成失败:', err);
            currentAbortController.value = null;

            // 更新目标消息，添加错误标识
            if (targetMessage.content) {
                targetMessage.content += '\n\n[请求失败]';
            } else {
                targetMessage.content = '[请求失败]';
            }
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];

            ElMessage.error('重新生成失败，请稍后重试');
        }

    } catch (error) {
        console.error('普通消息重新生成失败:', error);

        // 恢复消息状态
        const targetMessage = chatHistory.value[messageIndex];
        if (targetMessage) {
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];
        }

        ElMessage.error('重新生成失败，请稍后重试');
        throw error;
    }
};

// 重新生成自选股查看
const regenerateWatchlistView = async (messageIndex) => {
    try {
        console.log('🔄 开始重新生成自选股查看');

        // 设置重新生成标志，防止性能优化器干扰
        window.isRegenerating = true;

        // 设置全局生成状态，让UI显示生成中动画
        isGenerating.value = true;

        // 获取当前AI消息引用（和智能荐股一样的简单方式）
        const targetMessage = chatHistory.value[messageIndex];

        console.log('🔄 直接重新生成AI消息，不修改用户消息');

        // 第一步：清空原有数据并显示生成中状态
        resetMessageForRegeneration(targetMessage, 'watchlist_view');

        // 触发响应式更新，让用户立即看到清空效果
        chatHistory.value = [...chatHistory.value];

        // 等待一下让用户看到清空效果和"AI正在思考中..."动画
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🔄 自选股内容已清空，开始重新生成');

        // 第二步：模拟生成过程
        await new Promise(resolve => setTimeout(resolve, 500));

        // 第三步：获取用户真实的自选股数据
        const watchlistData = userStore.watchlist.map(stock => generateWatchlistStockData(stock));

        console.log('🔄 自选股数据生成完成，开始更新消息');

        // 第四步：更新AI消息
        const assistantMessage = userStore.watchlist.length === 0
            ? `📋 **我的自选股列表**

您当前还没有添加任何自选股。您可以通过以下方式添加股票：
- 在聊天中输入股票代码或名称
- 点击推荐股票中的"加入自选"按钮
- 使用"股票查询"功能查找并添加股票`
            : `📋 **我的自选股列表**

您当前关注 **${userStore.watchlist.length}** 只股票，详细信息如下：`;

        targetMessage.content = assistantMessage;
        targetMessage.isGenerating = false;
        isGenerating.value = false; // 重置全局生成状态
        targetMessage.hasWatchlistInfo = true;
        targetMessage.watchlistData = watchlistData;
        targetMessage.isWatchlistDisplay = true;
        targetMessage.messageType = 'watchlist_view'; // 设置消息类型备份
        targetMessage.hasInteractionButtons = true;
        targetMessage.interactionData = {
            recommendActions: [
                {
                    id: 'analyze_overall',
                    icon: '📊',
                    description: '分析整体表现',
                    actionType: 'analyze',
                    prompt: '分析我的自选股整体表现'
                },
                {
                    id: 'trading_advice',
                    icon: '💰',
                    description: '获取交易建议',
                    actionType: 'advice',
                    prompt: '给出我的自选股交易建议'
                },
                {
                    id: 'related_recommend',
                    icon: '🔥',
                    description: '相关热门推荐',
                    actionType: 'recommend',
                    prompt: '推荐与我自选股相关的热门股票'
                }
            ]
        };
        targetMessage.watchlistStats = {
            total: userStore.watchlist.length,
            upCount: watchlistData.length > 0 ? watchlistData.filter(s => s.changePct >= 0).length : 0,
            downCount: watchlistData.length > 0 ? watchlistData.filter(s => s.changePct < 0).length : 0,
            bestPerformer: watchlistData.length > 0 ? watchlistData.sort((a, b) => b.changePct - a.changePct)[0] : null,
            worstPerformer: watchlistData.length > 0 ? watchlistData.sort((a, b) => a.changePct - b.changePct)[0] : null,
            updateTime: new Date().toLocaleString('zh-CN')
        };
        targetMessage.timestamp = Date.now();

        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];

        // 在重新生成过程中，不调用可能压缩数据的函数，直接更新存储
        chatHistoryStore.currentChatMessages = [...chatHistory.value];
        if (chatHistoryStore.currentChatId) {
            const chatIndex = chatHistoryStore.chatHistoryList.findIndex(
                (chat) => chat.id === chatHistoryStore.currentChatId
            );
            if (chatIndex > -1) {
                chatHistoryStore.chatHistoryList[chatIndex].messages = [...chatHistory.value];
                chatHistoryStore.chatHistoryList[chatIndex].lastMessage = Date.now();
                // 直接保存到localStorage，不经过压缩
                localStorage.setItem("chatHistoryList", JSON.stringify(chatHistoryStore.chatHistoryList));
            }
        }

        await nextTick();
        scrollToBottom();

        console.log('🔄 自选股重新生成完成');
        ElMessage.success('自选股列表已重新生成');

        // 清除重新生成标志
        window.isRegenerating = false;

    } catch (error) {
        console.error('重新生成自选股查看失败:', error);

        // 恢复消息状态
        if (targetMessage) {
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];
        }

        // 重置全局生成状态
        isGenerating.value = false;

        ElMessage.error('重新生成自选股失败，请稍后重试');
        throw error;
    } finally {
        // 清除重新生成标志
        window.isRegenerating = false;
        // 确保全局生成状态被重置
        isGenerating.value = false;
    }
};

// 重新生成智能荐股
const regenerateSmartRecommendation = async (messageIndex) => {
    try {
        console.log('🔄 开始重新生成智能荐股');

        // 获取当前AI消息引用
        const targetMessage = chatHistory.value[messageIndex];

        console.log('🔄 直接重新生成AI消息，不修改用户消息');

        // 第一步：清空原有数据并显示生成中状态
        resetMessageForRegeneration(targetMessage, 'smart_recommendation');

        // 触发响应式更新，让用户立即看到清空效果
        chatHistory.value = [...chatHistory.value];

        // 等待一下让用户看到清空效果和"AI正在思考中..."动画
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🔄 智能荐股内容已清空，开始重新生成');

        // 获取当前聊天会话ID
        let conversationId = chatHistoryStore.currentChatId;
        if (!conversationId) {
            conversationId = await chatHistoryStore.createNewChat();
        }

        console.log("🔍 重新生成智能荐股API调用参数:", {
            pageNo: 1,
            pageSize: 3,
            conversationId: conversationId,
            userInfo: userStore.userInfo,
            hasPreferences: !!userStore.userInfo?.preferences,
        });

        let response = await recommendStock({
            pageNo: 1,
            pageSize: 3,
            conversationId: conversationId,
        });

        console.log("🔍 重新生成智能荐股API响应:", response);

        // 检查响应是否有效
        if (!response) {
            throw new Error("服务器响应为空，请稍后重试");
        }

        // 检查是否有错误信息
        if (response.code && response.code !== "B0001") {
            throw new Error(response.message || "智能荐股服务暂时不可用");
        }

        // 处理不同的响应格式
        let stockList = [];
        let apiData = null;

        // 尝试多种响应格式
        if (
            response &&
            response.data &&
            response.data.success &&
            response.data.data
        ) {
            // 格式1: { data: { success: true, data: [...] } }
            apiData = response.data.data;
        } else if (response && response.data && Array.isArray(response.data)) {
            // 格式2: { data: [...] }
            apiData = response.data;
        } else if (response && Array.isArray(response)) {
            // 格式3: [...]
            apiData = response;
        } else if (response && response.success && response.data) {
            // 格式4: { success: true, data: [...] }
            apiData = response.data;
        }

        if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
            throw new Error("暂无推荐股票数据，请稍后重试");
        }

        // 处理API数据
        apiData.forEach((item) => {
            stockList.push({
                name: item.name || item.stockName,
                code: item.code || item.stockCode,
                recommendIndex: item.recommendScore || item.score || 4.0,
                recommendLevel: item.recommendLevel || item.level || "推荐",
                price: item.latestPrice || item.price || item.currentPrice,
                change: item.change || 0,
                changePercent: item.rise
                    ? item.rise + "%"
                    : item.changePercent || "0%",
                targetPrice: item.targetPrice || item.target,
                expectedReturn:
                    item.expectedReturn ||
                    item.expectedBenefits ||
                    item.expected_return,
                riskLevel: item.riskLevel || item.risk || "中等",
                industry: item.industry || item.sector || "未分类",
                reason: item.recommendReason || item.reason || "基于AI算法推荐",
            });
        });
        stockList.sort((a, b) => b.recommendIndex - a.recommendIndex);

        console.log("✅ 重新生成智能荐股API处理成功:", stockList);

        // 获取推荐内容文本
        const mockRes = await mockApi.sendMessage('智能荐股');

        // 更新AI消息内容和数据
        targetMessage.content = mockRes.data.content;
        targetMessage.hasStockInfo = true;
        targetMessage.stockList = stockList;
        targetMessage.isRecommendation = true;
        targetMessage.messageType = 'smart_recommendation'; // 设置消息类型备份
        targetMessage.isPersistent = true;
        targetMessage.messageId = `recommendation-${Date.now()}`;
        targetMessage.timestamp = new Date().toISOString();
        completeMessageRegeneration(targetMessage);

        // 添加调试信息
        console.log("🔍 重新生成智能荐股 - 最终消息结构:", {
            hasStockInfo: targetMessage.hasStockInfo,
            stockList: targetMessage.stockList,
            stockListLength: targetMessage.stockList?.length,
            isRecommendation: targetMessage.isRecommendation,
            isPersistent: targetMessage.isPersistent,
            content: targetMessage.content.substring(0, 100) + '...'
        });

        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];

        // 在重新生成过程中，不调用可能压缩数据的函数，直接更新存储
        chatHistoryStore.currentChatMessages = [...chatHistory.value];
        if (chatHistoryStore.currentChatId) {
            const chatIndex = chatHistoryStore.chatHistoryList.findIndex(
                (chat) => chat.id === chatHistoryStore.currentChatId
            );
            if (chatIndex > -1) {
                chatHistoryStore.chatHistoryList[chatIndex].messages = [...chatHistory.value];
                chatHistoryStore.chatHistoryList[chatIndex].lastMessage = Date.now();
                // 直接保存到localStorage，不经过压缩
                localStorage.setItem("chatHistoryList", JSON.stringify(chatHistoryStore.chatHistoryList));
            }
        }

        await nextTick();
        scrollToBottom();

        console.log('🔄 智能荐股重新生成完成');
        ElMessage.success('智能荐股已重新生成');

    } catch (error) {
        console.error('重新生成智能荐股失败:', error);

        // 恢复消息状态
        const targetMessage = chatHistory.value[messageIndex];
        if (targetMessage) {
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];
        }

        ElMessage.error('重新生成智能荐股失败，请稍后重试');
        throw error;
    }
};

// 重新生成资产分析
const regenerateAssetAnalysis = async (messageIndex) => {
    try {
        console.log('🔄 开始重新生成资产分析');

        // 获取当前AI消息引用
        const targetMessage = chatHistory.value[messageIndex];

        console.log('🔄 直接重新生成AI消息，不修改用户消息');

        // 第一步：清空原有数据并显示生成中状态
        resetMessageForRegeneration(targetMessage, 'asset_analysis');

        // 触发响应式更新，让用户立即看到清空效果
        chatHistory.value = [...chatHistory.value];

        // 等待一下让用户看到清空效果和"AI正在思考中..."动画
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🔄 资产分析内容已清空，开始重新生成');

        // 第二步：模拟生成过程
        await new Promise(resolve => setTimeout(resolve, 800));

        // 构建资产分析数据
        const totalAssets = userStore.getTotalAssets();

        // 只使用用户的真实持仓数据，不使用mock数据
        const portfolioForAnalysis = [...userStore.portfolio];
        const portfolioCount = portfolioForAnalysis.length;
        const watchlistCount = userStore.watchlist.length;

        // 计算持仓盈亏
        const portfolioData = portfolioForAnalysis.map((position) => {
            const currentPrice = getCurrentStockPrice(position.code);
            const marketValue = position.quantity * currentPrice;
            const costValue = position.quantity * position.avgPrice;
            const profit = marketValue - costValue;
            const profitPercent = ((profit / costValue) * 100).toFixed(2);

            return {
                ...position,
                currentPrice,
                marketValue,
                costValue,
                profit,
                profitPercent: parseFloat(profitPercent),
                price: currentPrice.toFixed(2),
                change: (currentPrice - position.avgPrice).toFixed(2),
                changePercent: `${profitPercent}%`,
            };
        });

        // 计算总盈亏
        const totalProfit = portfolioData.reduce((sum, item) => sum + item.profit, 0);
        const totalCostValue = portfolioData.reduce((sum, item) => sum + item.costValue, 0);
        const totalProfitPercent = totalCostValue > 0 ? ((totalProfit / totalCostValue) * 100).toFixed(2) : "0.00";
        const portfolioValue = portfolioData.reduce((sum, item) => sum + item.marketValue, 0);

        // 资产分析不需要文本内容，只显示数据卡片
        // 更新AI消息内容和数据
        targetMessage.content = '';
        targetMessage.isGenerating = false;
        targetMessage.hasAssetInfo = true;
        targetMessage.assetData = {
            totalAssets,
            balance: totalAssets - portfolioValue,
            portfolioCount,
            watchlistCount,
            portfolioData,
            watchlistData: userStore.watchlist.map((stock) => generateWatchlistStockData(stock)),
            totalProfit,
            totalProfitPercent: parseFloat(totalProfitPercent),
            portfolioValue,
        };
        targetMessage.isAssetAnalysis = true;
        targetMessage.messageType = 'asset_analysis'; // 设置消息类型备份
        targetMessage.timestamp = Date.now();

        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];

        // 在重新生成过程中，不调用可能压缩数据的函数，直接更新存储
        chatHistoryStore.currentChatMessages = [...chatHistory.value];
        if (chatHistoryStore.currentChatId) {
            const chatIndex = chatHistoryStore.chatHistoryList.findIndex(
                (chat) => chat.id === chatHistoryStore.currentChatId
            );
            if (chatIndex > -1) {
                chatHistoryStore.chatHistoryList[chatIndex].messages = [...chatHistory.value];
                chatHistoryStore.chatHistoryList[chatIndex].lastMessage = Date.now();
                // 直接保存到localStorage，不经过压缩
                localStorage.setItem("chatHistoryList", JSON.stringify(chatHistoryStore.chatHistoryList));
            }
        }

        await nextTick();
        scrollToBottom();

        console.log('🔄 资产分析重新生成完成');
        ElMessage.success('资产分析已重新生成');

    } catch (error) {
        console.error('重新生成资产分析失败:', error);

        // 恢复消息状态
        const targetMessage = chatHistory.value[messageIndex];
        if (targetMessage) {
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];
        }

        ElMessage.error('重新生成资产分析失败，请稍后重试');
        throw error;
    }
};

// 重新生成资讯推送
const regenerateNewsUpdate = async (messageIndex) => {
    try {
        console.log('🔄 开始重新生成资讯推送');

        // 获取当前AI消息引用
        const targetMessage = chatHistory.value[messageIndex];

        console.log('🔄 直接重新生成AI消息，不修改用户消息');

        // 第一步：清空原有数据并显示生成中状态
        resetMessageForRegeneration(targetMessage, 'news_update');

        // 触发响应式更新，让用户立即看到清空效果
        chatHistory.value = [...chatHistory.value];

        // 等待一下让用户看到清空效果和"AI正在思考中..."动画
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('🔄 资讯推送内容已清空，开始重新生成');

        // 第二步：调用API获取数据 - 使用与原始资讯推送相同的完整消息
        const fullMessage = "资讯推送：今日重要财经新闻和市场动态";
        const mockRes = await mockApi.sendMessage(fullMessage);

        // 更新AI消息内容和数据 - 保持与原始资讯推送完全相同的数据结构
        targetMessage.content = mockRes.data.content;
        targetMessage.isNewsUpdate = mockRes.data.isNewsUpdate;
        targetMessage.messageType = 'news_update'; // 设置消息类型备份
        targetMessage.hasInteractionButtons = mockRes.data.hasInteractionButtons;
        targetMessage.interactionData = mockRes.data.interactionData;

        // 确保所有必要的字段都被正确设置
        if (mockRes.data.hasStockInfo !== undefined) {
            targetMessage.hasStockInfo = mockRes.data.hasStockInfo;
        }

        completeMessageRegeneration(targetMessage);

        // 触发响应式更新
        chatHistory.value = [...chatHistory.value];

        // 在重新生成过程中，不调用可能压缩数据的函数，直接更新存储
        chatHistoryStore.currentChatMessages = [...chatHistory.value];
        if (chatHistoryStore.currentChatId) {
            const chatIndex = chatHistoryStore.chatHistoryList.findIndex(
                (chat) => chat.id === chatHistoryStore.currentChatId
            );
            if (chatIndex > -1) {
                chatHistoryStore.chatHistoryList[chatIndex].messages = [...chatHistory.value];
                chatHistoryStore.chatHistoryList[chatIndex].lastMessage = Date.now();
                // 直接保存到localStorage，不经过压缩
                localStorage.setItem("chatHistoryList", JSON.stringify(chatHistoryStore.chatHistoryList));
            }
        }

        await nextTick();
        scrollToBottom();

        console.log('🔄 资讯推送重新生成完成');
        ElMessage.success('资讯推送已重新生成');

    } catch (error) {
        console.error('重新生成资讯推送失败:', error);

        // 恢复消息状态
        const targetMessage = chatHistory.value[messageIndex];
        if (targetMessage) {
            targetMessage.isGenerating = false;
            chatHistory.value = [...chatHistory.value];
        }

        ElMessage.error('重新生成资讯推送失败，请稍后重试');
        throw error;
    }
};

// 分享消息
const handleShareMessage = async (event) => {
    try {
        console.log('分享消息:', event);
        ElMessage.success('海报已生成并下载');
    } catch (error) {
        console.error('分享消息失败:', error);
        ElMessage.error('分享失败，请稍后重试');
    }
};

// 检查股票是否在自选股中
const isInWatchlist = (stock) => {
    if (!stock || !stock.code) return false;
    return userStore.isInWatchlist(stock.code);
};

// 智能荐股功能 - 使用组合式函数
const handleSmartRecommendation = async () => {
    if (!checkAuthStatus('使用智能荐股功能')) {
        return;
    }
    console.log('🚀 智能荐股 - 设置生成状态');

    // 设置生成状态，让发送按钮进入"生成中"状态
    isGenerating.value = true;

    try {
        // 添加一个短暂延迟，让用户能看到生成状态
        await new Promise(resolve => setTimeout(resolve, 800));

        // 检查是否被用户中断
        if (!isGenerating.value) {
            console.log('🚀 智能荐股 - 操作被用户中断');
            return;
        }

        // 执行业务逻辑，传递中断检查函数
        await stockHandleSmartRecommendation(
            userStore,
            chatHistoryStore,
            chatHistory,
            isChatMode,
            scrollToBottom,
            showGuide,
            () => isGenerating.value // 传递中断检查函数
        );
    } finally {
        // 完成后重置生成状态
        console.log('🚀 智能荐股 - 重置生成状态');
        isGenerating.value = false;
    }
};

// 监听用户登录状态变化
watch(
    () => userStore.isLoggedIn,
    (newVal) => {
        if (newVal) {
            // 用户登录后，检查是否需要显示引导流程（用于页面刷新后的状态恢复）
            nextTick(() => {
                if (userStore.shouldShowOnboarding()) {
                    showOnboarding.value = true;
                }
            });
        } else {
            // 用户退出登录，隐藏引导流程
            showOnboarding.value = false;
        }
    }
);

// 资讯推送功能 - 使用组合式函数
const handleNewsUpdate = async () => {
    if (!checkAuthStatus('获取资讯推送')) {
        return;
    }
    console.log('🚀 资讯推送 - 设置生成状态');

    // 设置生成状态，让发送按钮进入"生成中"状态
    isGenerating.value = true;

    try {
        // 添加一个短暂延迟，让用户能看到生成状态
        await new Promise(resolve => setTimeout(resolve, 800));

        // 检查是否被用户中断
        if (!isGenerating.value) {
            console.log('🚀 资讯推送 - 操作被用户中断');
            return;
        }

        // 执行业务逻辑，传递中断检查函数
        await stockHandleNewsUpdate(
            userStore,
            chatHistory,
            isChatMode,
            scrollToBottom,
            showGuide,
            () => isGenerating.value // 传递中断检查函数
        );
    } finally {
        // 完成后重置生成状态
        console.log('🚀 资讯推送 - 重置生成状态');
        isGenerating.value = false;
    }
};

// 我的资产分析功能 - 使用组合式函数
const handleAssetAnalysis = async () => {
    if (!checkAuthStatus('进行资产分析')) {
        return;
    }
    console.log('🚀 资产分析 - 设置生成状态');

    // 设置生成状态，让发送按钮进入"生成中"状态
    isGenerating.value = true;

    try {
        // 添加一个短暂延迟，让用户能看到生成状态
        await new Promise(resolve => setTimeout(resolve, 800));

        // 检查是否被用户中断
        if (!isGenerating.value) {
            console.log('🚀 资产分析 - 操作被用户中断');
            return;
        }

        // 执行业务逻辑，传递中断检查函数
        await stockHandleAssetAnalysis(
            userStore,
            chatHistory,
            isChatMode,
            scrollToBottom,
            showGuide,
            () => isGenerating.value // 传递中断检查函数
        );
    } finally {
        // 完成后重置生成状态
        console.log('🚀 资产分析 - 重置生成状态');
        isGenerating.value = false;
    }
};

// 自选股查看功能
const handleWatchlistView = async () => {
    // 检查用户是否已登录
    if (!checkAuthStatus('查看自选股')) {
        return;
    }

    console.log('🚀 自选股查看 - 设置生成状态');

    // 设置生成状态，让发送按钮进入"生成中"状态
    isGenerating.value = true;

    try {
        // 添加一个短暂延迟，让用户能看到生成状态
        await new Promise(resolve => setTimeout(resolve, 800));

        // 检查是否被用户中断
        if (!isGenerating.value) {
            console.log('🚀 自选股查看 - 操作被用户中断');
            return;
        }

        // 切换到聊天模式
        isChatMode.value = true;

        // 添加用户消息和处理中消息
        const newMessages = [
            { id: generateMessageId(), role: 'user', content: '查看我的自选股列表', timestamp: Date.now() },
            { id: generateMessageId(), role: 'assistant', content: '', isGenerating: true, timestamp: Date.now(), messageType: 'watchlist_view' }
        ];

        // 直接添加消息，不使用limitChatMessages以避免用户消息被清空
        chatHistory.value.push(...newMessages);
        chatHistory.value = [...chatHistory.value]; // 触发响应式更新

        // 同步到chatHistoryStore，确保用户消息被保存
        chatHistoryStore.updateCurrentChatMessagesWithoutLimit(chatHistory.value);

        // 再次检查是否被中断
        if (!isGenerating.value) {
            console.log('🚀 自选股查看 - 在数据处理前被中断');
            return;
        }

        // 获取用户真实的自选股数据
        const watchlistData = userStore.watchlist.map(stock => generateWatchlistStockData(stock));

        // 更新最后一条AI消息为自选股列表
        const assistantMessage = userStore.watchlist.length === 0
            ? `📋 **我的自选股列表**

您当前还没有添加任何自选股。您可以通过以下方式添加股票：
- 在聊天中输入股票代码或名称
- 点击推荐股票中的"加入自选"按钮
- 使用"股票查询"功能查找并添加股票`
            : `📋 **我的自选股列表**

您当前关注 **${userStore.watchlist.length}** 只股票，详细信息如下：`;

        const lastMessage = chatHistory.value[chatHistory.value.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
            lastMessage.isGenerating = false; // 取消生成状态
            lastMessage.hasWatchlistInfo = true;
            lastMessage.watchlistData = watchlistData;
            lastMessage.isWatchlistDisplay = true;
            lastMessage.messageType = 'watchlist_view'; // 设置消息类型备份
            lastMessage.hasInteractionButtons = true;
            lastMessage.interactionData = {
                recommendActions: [
                    {
                        id: 'analyze_overall',
                        icon: '📊',
                        description: '分析整体表现',
                        actionType: 'analyze',
                        prompt: '分析我的自选股整体表现'
                    },
                    {
                        id: 'trading_advice',
                        icon: '💰',
                        description: '获取交易建议',
                        actionType: 'advice',
                        prompt: '给出我的自选股交易建议'
                    },
                    {
                        id: 'related_recommend',
                        icon: '🔥',
                        description: '相关热门推荐',
                        actionType: 'recommend',
                        prompt: '推荐与我自选股相关的热门股票'
                    }
                ]
            };
            lastMessage.watchlistStats = {
                total: userStore.watchlist.length,
                upCount: watchlistData.length > 0 ? watchlistData.filter(s => s.changePct >= 0).length : 0,
                downCount: watchlistData.length > 0 ? watchlistData.filter(s => s.changePct < 0).length : 0,
                bestPerformer: watchlistData.length > 0 ? watchlistData.sort((a, b) => b.changePct - a.changePct)[0] : null,
                worstPerformer: watchlistData.length > 0 ? watchlistData.sort((a, b) => a.changePct - b.changePct)[0] : null,
                updateTime: new Date().toLocaleString('zh-CN')
            };
            chatHistory.value = [...chatHistory.value]; // 触发响应式更新

            // 同步到chatHistoryStore，确保完整的自选股消息被保存
            chatHistoryStore.updateCurrentChatMessagesWithoutLimit(chatHistory.value);
        }

        await nextTick();
        scrollToBottom();
        if (userStore.watchlist.length === 0) {
            ElMessage.info('您还没有添加自选股，请先添加股票到自选列表');
        } else {
            ElMessage.success('已显示您的自选股列表');
        }


    } finally {
        // 完成后重置生成状态
        console.log('🚀 自选股查看 - 重置生成状态');
        isGenerating.value = false;
    }
};

// 处理来自侧边栏的交互
const handleSidebarInteraction = async (data) => {
    const { type, content, title } = data;

    let message;

    switch (type) {
        case 'stock':
            message = `请详细分析一下${content.name}(${content.code})这只股票，包括基本面分析、技术面分析、投资建议和风险提示。`;
            break;
        case 'message':
            message = `请分析"${title}"这条市场消息对相关板块和个股的具体影响，并评估潜在投资机会。消息内容：${content}`;
            break;
        case 'market':
            message = `请分析一下${content.name}当前的走势，包括技术指标分析和后市预判。`;
            break;
        case 'strategy':
            message = `请详细分析"${content.name}"量化策略的具体实施方案，包括：
1. 策略原理和适用市场环境
2. 具体的交易规则和参数设置
3. 风险控制措施和止损策略
4. 预期收益和最大回撤分析
5. 实际操作建议和注意事项

策略信息：
- 策略类型：${content.name}
- 风险等级：${content.riskText}
- 预期年化收益：${content.annualReturn}%
- 最大回撤：${content.maxDrawdown}%
- 夏普比率：${content.sharpeRatio}`;
            break;
        case 'signal':
            message = `请分析"${content.name}(${content.code})"的交易信号，详细说明：
1. 信号产生的技术原理
2. 当前市场环境是否适合该信号
3. 具体的买入/卖出建议和时机
4. 风险评估和止损位设置
5. 后续跟踪要点

信号详情：
- 股票：${content.name}(${content.code})
- 信号类型：${content.signal === 'buy' ? '买入' : '卖出'}
- 策略：${content.strategy}
- 当前价格：¥${content.price}
- 置信度：${content.confidence}%
- 信号时间：${content.time}`;
            break;
        case 'factor':
            message = `请分析多因子选股模型的应用，包括：
1. 各因子的有效性分析
2. 因子权重配置建议
3. 选股策略优化方案
4. 风险控制和组合管理
5. 实际操作指导

请基于当前市场环境给出具体的多因子选股建议。`;
            break;
        case 'backtest':
            message = `请分析量化策略的回测结果，包括：
1. 回测结果的可信度评估
2. 策略优缺点分析
3. 市场适应性评价
4. 实盘交易建议
5. 风险提示和改进方向

请帮我解读这些回测数据的实际意义。`;
            break;
        case 'show-ai-trading-dialog':
            // 打开AI委托交易设置对话框
            showAITradingDialog.value = true;
            selectedStockForAITrading.value = content;
            return; // 直接返回，不需要发送消息
        default:
            // 确保content是字符串类型
            if (typeof content === 'string') {
                message = content;
            } else if (content && typeof content === 'object') {
                // 如果content是对象，尝试获取合适的字符串属性
                message = content.name || content.title || content.text || JSON.stringify(content);
            } else {
                message = String(content || '请提供具体的市场分析和投资建议');
            }
    }

    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

    // 确保message是字符串类型
    if (typeof message !== 'string') {
        message = String(message || '请提供具体的市场分析和投资建议');
    }

    // 发送消息
    const res = await mockApi.sendMessage(message);
    const newMessages = [
        { id: generateMessageId(), role: 'user', content: message, timestamp: Date.now() },
        { id: generateMessageId(), ...res.data, timestamp: Date.now() }
    ];

    // 直接添加消息，不限制消息数量以避免用户消息被清空
    chatHistory.value.push(...newMessages);
    chatHistory.value = [...chatHistory.value]; // 触发响应式更新

    // 同步到chatHistoryStore，确保用户消息被保存
    chatHistoryStore.updateCurrentChatMessagesWithoutLimit(chatHistory.value);

    await nextTick();
    scrollToBottom();

    ElMessage.success('已为您分析相关内容');
};

// 自选股相关方法
const addToWatchlist = (stockInfo) => {
    if (userStore.addToWatchlist(stockInfo)) {
        ElMessage.success(`${stockInfo.name} 已加入自选股`);

        // 更新聊天历史中的自选股数据
        updateWatchlistInChatHistory();
    } else {
        ElMessage.warning(`${stockInfo.name} 已在自选股中`);
    }
};

const removeFromWatchlist = (stockCode) => {
    if (userStore.removeFromWatchlist(stockCode)) {
        ElMessage.success('已从自选股中移除');

        // 更新聊天历史中的自选股数据
        updateWatchlistInChatHistory();
    } else {
        ElMessage.error('移除失败');
    }
};

// 更新聊天历史中的自选股数据
const updateWatchlistInChatHistory = () => {
    chatHistory.value.forEach(message => {
        // 更新自选股展示消息
        if (message.isWatchlistDisplay && message.watchlistData) {
            // 重新获取自选股数据，使用辅助函数生成完整详情
            const updatedWatchlistData = userStore.watchlist.map(stock => generateWatchlistStockData(stock));

            // 更新消息中的自选股数据
            message.watchlistData = updatedWatchlistData;

            // 更新统计信息
            if (message.watchlistStats) {
                message.watchlistStats.total = updatedWatchlistData.length;
                message.watchlistStats.upCount = updatedWatchlistData.filter(s => s.changePct >= 0).length;
                message.watchlistStats.downCount = updatedWatchlistData.filter(s => s.changePct < 0).length;
                message.watchlistStats.bestPerformer = updatedWatchlistData.length > 0 ?
                    updatedWatchlistData.sort((a, b) => b.changePct - a.changePct)[0] : null;
                message.watchlistStats.worstPerformer = updatedWatchlistData.length > 0 ?
                    updatedWatchlistData.sort((a, b) => a.changePct - b.changePct)[0] : null;
            }
        }

        // 更新资产信息中的自选股数据
        if (message.hasAssetInfo && message.assetData && message.assetData.watchlistData) {
            message.assetData.watchlistData = userStore.watchlist.map(stock => generateWatchlistStockData(stock));

            // 更新自选股数量
            message.assetData.watchlistCount = userStore.watchlist.length;
        }
    });
};

const continueAnalysis = async (stockInfo, isPaid = false) => {

    // 如果是新聊天，创建聊天记录
    if (!chatHistoryStore.currentChatId) {
        await chatHistoryStore.createNewChat();
    }
    const conversationId = chatHistoryStore.currentChatId;
    console.log('当前聊天ID:', conversationId);

    const newMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        isGenerating: true,
        hasStockInfo: false,
        stockInfo: stockInfo,
        isQuantAnalysis: true, // 标识这是量化分析消息
        analysis: true, // 标识这是量化分析消息
        timestamp: Date.now(),
    };

    // 直接添加消息，不限制消息数量以避免用户消息被清空
    chatHistory.value.push(newMessage);
    chatHistory.value = [...chatHistory.value]; // 触发响应式更新

    // 同步到chatHistoryStore，确保用户消息被保存
    chatHistoryStore.updateCurrentChatMessagesWithoutLimit(chatHistory.value);

    try {
        let aiContent = '';
        const abortController = new AbortController(); // 用于取消请求
        authFetchEventSource(`${api.devPrefix}${api.analyzeStockApi}?conversationId=${conversationId}&stock=${encodeURIComponent(stockInfo.code)}`, {
            method: 'GET', // GET 是默认方法，可省略
            signal: abortController.signal, // 绑定取消信号
            // 添加重试配置
            retryInterval: 0,       // 不重试
            backoffMultiplier: 0,    // 退避系数

            onopen: async (response) => {
                console.log('连接成功');
            },

            onmessage: (event) => {
                // 处理每条消息
                try {
                    console.log('量化分析：收到数据:', event.data);
                    let data = event.data;
                    // 如果 data 是空格，则新增一个空格（SSE 协议规范：data: 后的第一个空格是固定分隔符，一定会被丢弃）
                    if (data.trim().length === 0) {
                        data += ' ';
                    }
                    aiContent += data;

                    const lastMessage = chatHistory.value[chatHistory.value.length - 1];
                    lastMessage.content = aiContent;
                    lastMessage.isGenerating = false; // 开始接收内容时取消生成状态
                    chatHistory.value = [...chatHistory.value]; // 触发响应式更新
                    // 使用 requestAnimationFrame 优化滚动
                    requestAnimationFrame(() => {
                        scrollToBottom();
                    });
                } catch (err) {
                    console.error('解析错误:', err);
                }
            },
            onclose: () => {
                // 显示购买等按钮
                chatHistory.value[chatHistory.value.length - 1].hasStockInfo = true;
                console.log('连接关闭');
            },
            onerror: (err) => {
                // 错误处理（网络错误、解析异常等）
                abortController.abort(); // 取消请求
                aiContent += `\n\n[${err.message || '请求中断'}]`;
                throw err; // 重新抛出以终止流
            }
        });

    } catch (err) {
        aiContent = '响应失败，请重试';
        chatHistory.value = [...chatHistory.value];
    }
};

// 自选股票操作按钮配置
const watchlistActionButtons = computed(() => {
    return getStockActionConfig('watchlist', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 4
    });
});

// 持仓股票操作按钮配置
const portfolioActionButtons = computed(() => {
    return getStockActionConfig('portfolio', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 4
    });
});

// 当前聊天标题
const currentChatTitle = computed(() => {
    const currentChat = chatHistoryStore.getCurrentChat;
    return currentChat ? currentChat.title : 'AI 智能分析';
});

// 检查聊天历史中是否有智能荐股记录
const hasRecommendationInHistory = computed(() => {
    return chatHistory.value.some(message =>
        message.role === 'assistant' &&
        (message.hasStockInfo || message.stockList || message.isRecommendation)
    );
});

// 统一的股票操作事件处理
const handleStockAction = ({ action, stock }) => {
    console.log('执行股票操作:', action, stock);

    const actionMap = {
        addWatchlist: () => addToWatchlist(stock),
        removeWatchlist: () => removeFromWatchlist(stock.code),
        analysis: () => showPaidAnalysisDialog(stock, userStore, continueAnalysis),
        paidAnalysis: () => showPaidAnalysisDialog(stock, userStore, continueAnalysis),
        aiTrading: () => showQuantAnalysisDialog(stock),
        quantAnalysis: () => showQuantAnalysisDialog(stock),
        buy: () => showBuyDialog(stock, 'buy'),
        addPosition: () => showBuyDialog(stock, 'buy'),
        sell: () => showBuyDialog(stock, 'sell')
    };

    const handler = actionMap[action];
    if (handler) {
        handler();
    } else if (typeof action === 'function') {
        // 兼容旧版本的函数类型action
        action();
    } else {
        console.error('未知的股票操作类型:', action);
        ElMessage.error('股票操作配置错误');
    }
};

// 为了保持向后兼容性，创建别名
const handleStockActionClick = handleStockAction;
const handleWatchlistActionClick = handleStockAction;
const handlePortfolioActionClick = handleStockAction;
const handleChatStockAction = handleStockAction;

// 获取智能荐股配置
const getSmartRecommendationConfig = (message) => {
    const config = getStockListConfig('smartRecommendation');
    const finalConfig = {
        ...config,
        toolbarTitle: '智能荐股推荐',
        timestamp: message.timestamp,
        showToolbar: message.isPersistent
    };

    console.log('🔍 智能荐股配置:', {
        message: {
            hasStockInfo: message.hasStockInfo,
            stockList: message.stockList,
            stockListLength: message.stockList?.length,
            isPersistent: message.isPersistent,
            isRecommendation: message.isRecommendation
        },
        config: finalConfig
    });

    return finalConfig;
};

// 股票点击事件处理
const handleStockClick = (stock) => {
    console.log('点击了股票:', stock);
    // 可以在这里添加股票点击的处理逻辑，比如跳转到股票详情页
};

// 聊天消息中的股票操作配置
const getChatStockActions = (message) => {
    if (message.isBuyMode) {
        // 购买模式：优先显示购买按钮
        return getStockActionConfig('chatCompact', {
            isMobile: isMobileView.value,
            maxButtons: 2
        });
    } else {
        // 普通模式：显示完整操作
        return getStockActionConfig('chatFull', {
            isMobile: isMobileView.value,
            maxButtons: isMobileView.value ? 3 : 4
        });
    }
};



// 投资偏好组件事件处理
const handlePreferencesCompleted = (preferences) => {
    // 显示欢迎消息
    timerManager.create('welcome-message', () => {
        const welcomeMessage = {
            role: 'assistant',
            content: `欢迎使用智投小助！根据您的投资偏好（${getRiskLevelText(preferences.riskLevel)}），我将为您提供个性化的投资建议。您可以问我任何关于投资的问题。`
        };

        // 直接添加欢迎消息，不限制消息数量
        chatHistory.value.push(welcomeMessage);
        chatHistory.value = [...chatHistory.value]; // 触发响应式更新

        nextTick(() => {
            scrollToBottom();
        });
    }, 500);
};

// 引导提示相关方法 - 简化版本，直接调用登录
const showGuide = (type) => {
    switch (type) {
        case 'login':
            showLogin(false);
            break;
        case 'register':
            showLogin(true);
            break;
    }
};



// 窗口大小变化处理函数 - 优化版本，使用防抖
const handleResize = () => {
    // 使用防抖优化，避免频繁调用
    timerManager.clear('resize-debounce');
    timerManager.create('resize-debounce', () => {
        mobileAdaptation.checkMobileView();
        updateChatHistoryHeight();
        // 移动端聊天模式下的处理
        if (isMobileView.value && isChatMode.value) {
            timerManager.create('mobile-chat-resize', () => {
                mobileAdaptation.fixMobileChatBox(isChatMode.value);
                scrollToBottom();
            }, 100);
        }
    }, 150);
};

onMounted(() => {
    scrollToBottom();

    // 暴露chatHistory到全局，供性能优化器使用
    window.chatHistory = chatHistory;
    window.chatHistoryManager = chatHistoryManager;

    // 检查是否需要显示引导流程（页面刷新时恢复状态）
    if (userStore.isLoggedIn && userStore.shouldShowOnboarding()) {
        showOnboarding.value = true;
    }

    // 初始化移动端浏览器检测和防止页面缩放
    mobileAdaptation.initializeMobileBrowserDetection();
    mobileAdaptation.preventZoom();

    // 检查是否需要显示登录弹窗
    checkRouteParams();

    // 检测移动端视图
    mobileAdaptation.checkMobileView();

    // 初始化动态视口高度
    mobileAdaptation.setDynamicViewportHeight();

    // 初始化聊天历史区域高度
    updateChatHistoryHeight();

    // 初始化快捷操作
    initializeShortcuts();

    // 初始化语音功能
    initVoice(inputMessage);

    // 检测微信环境并设置相关状态
    if (isWechatEnv.value) {
        document.body.classList.add('wechat-browser');
    }

    // 初始化移动端浏览器检测和防止页面缩放
    mobileAdaptation.initializeMobileBrowserDetection();
    mobileAdaptation.preventZoom();


    // 如果有当前聊天ID，恢复聊天记录（不限制消息数量，避免用户消息被清空）
    if (chatHistoryStore.currentChatId) {
        const currentChat = chatHistoryStore.getCurrentChat;
        if (currentChat) {
            // 直接恢复聊天记录，不使用limitChatMessages以避免用户消息被清空
            chatHistory.value = [...(currentChat.messages || [])];
            isChatMode.value = chatHistory.value.length > 0;
        }
    }

    // 使用事件监听器管理器添加窗口大小变化监听
    eventListenerManager.add(window, 'resize', handleResize);

    // 添加滚动事件监听 - 优化版本
    nextTick(() => {
        if (chatHistoryRef.value && !chatHistoryRef.value.hasScrollListener) {
            eventListenerManager.add(chatHistoryRef.value, 'scroll', handleScroll, { passive: true });
            chatHistoryRef.value.hasScrollListener = true;
        }
    });

    // 移动端聊天框修复 - 优化版本，避免重复调用
    if (isMobileView.value) {
        // 初始状态修复
        mobileAdaptation.resetMobileLayout(isChatMode.value, scrollToTop);
        mobileAdaptation.handleMobileKeyboard(scrollToBottom);

        // 使用定时器管理器，避免重复调用
        timerManager.create('mobile-fix-initial', () => {
            mobileAdaptation.fixMobileChatBox(isChatMode.value);
            mobileAdaptation.ensureMobileFixApplied(isChatMode.value);
        }, 100);

        // 设置移动端视口监听器
        mobileAdaptation.setupMobileViewportListeners(scrollToBottom);
    }

    // 定期清理聊天历史数据，防止内存过度占用（只清理聊天数量，不限制消息数量）
    timerManager.create('cleanup-chat-history', () => {
        if (chatHistoryStore.chatHistoryList.length > 50) {
            const cleanedList = chatHistoryManager.limitChatHistory(chatHistoryStore.chatHistoryList);
            chatHistoryStore.chatHistoryList = cleanedList;
            chatHistoryStore.saveChatHistoryWithoutLimit(); // 使用不限制消息数量的版本
            console.log('🧹 已清理聊天历史数据，保留最近50条记录');
        }
    }, 5 * 60 * 1000, true); // 每5分钟检查一次
});

// 组件卸载时清理 - 完善版本
onUnmounted(() => {
    // 清理所有事件监听器
    eventListenerManager.cleanup();

    // 清理所有定时器
    timerManager.clearAll();

    // 清理语音识别资源
    cleanupVoice();

    // 输出性能报告（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
        const report = performanceOptimizer.getPerformanceReport();
        console.group('📊 主页组件卸载时的性能报告');
        console.log('内存使用:', report.memoryUsage);
        console.log('渲染性能:', report.renderPerformance);
        console.log('事件监听器:', report.eventListeners);
        console.log('活跃定时器:', report.activeTimers);
        if (report.suggestions.length > 0) {
            console.warn('优化建议:', report.suggestions);
        }
        console.groupEnd();
    }
});

const closeUserProfile = () => {
    showUserProfile.value = false;
};

const closeRecordsCenter = () => {
    showRecordsCenter.value = false;
};


// 处理交互操作按钮点击
const handleInteractionAction = async (action, message) => {
    console.log('交互操作按钮被点击:', action, message);

    let analysisPrompt = '';

    if (message.isNewsUpdate) {
        // 资讯推送相关的交互操作
        switch (action.actionType) {
            case 'analysis':
                analysisPrompt = `基于今日财经资讯分析对我的持仓影响：
                
${message.interactionData.newsItems.map(news => `- ${news.title}: ${news.summary}`).join('\n')}

请详细分析：
1. 这些资讯对我持仓股票的具体影响
2. 哪些持仓可能受到正面/负面影响
3. 建议调整的仓位和原因
4. 短期和中期的应对策略
5. 风险提示和机会识别

请结合我的实际持仓情况给出个性化建议。`;
                break;
            case 'opportunity':
                analysisPrompt = `基于今日财经资讯寻找投资机会：

相关资讯：
${message.interactionData.newsItems.map(news => `- ${news.title}: ${news.summary}`).join('\n')}

受益板块：${message.interactionData.affectedSectors.join('、')}

请分析：
1. 这些资讯催生的具体投资机会
2. 推荐关注的个股和理由
3. 最佳买入时机和价位
4. 预期收益和风险评估
5. 资金配置建议

请为我筛选出3-5只最有潜力的投资标的。`;
                break;
            case 'risk':
                analysisPrompt = `基于今日财经资讯进行风险排查：

相关资讯：
${message.interactionData.newsItems.map(news => `- ${news.title}: ${news.summary}`).join('\n')}

请帮我排查：
1. 我的持仓中哪些股票可能面临风险
2. 宏观政策变化的影响程度
3. 行业轮动对投资组合的影响
4. 需要设置止损的股票和位置
5. 资产配置优化建议

请制定详细的风险控制方案。`;
                break;
        }
    } else if (message.isReview) {
        // 智能复盘相关的交互操作
        switch (action.actionType) {
            case 'portfolio':
                analysisPrompt = `基于智能复盘结果优化投资组合：

市场表现：
- 上证指数：${message.interactionData.marketPerformance.shangzheng.value}点 (${message.interactionData.marketPerformance.shangzheng.change > 0 ? '+' : ''}${message.interactionData.marketPerformance.shangzheng.change}%)
- 深证成指：${message.interactionData.marketPerformance.shenzhen.value}点 (${message.interactionData.marketPerformance.shenzhen.change > 0 ? '+' : ''}${message.interactionData.marketPerformance.shenzhen.change}%)
- 创业板指：${message.interactionData.marketPerformance.chuangye.value}点 (${message.interactionData.marketPerformance.chuangye.change > 0 ? '+' : ''}${message.interactionData.marketPerformance.chuangye.change}%)

请基于复盘结果提供：
1. 投资组合优化建议
2. 仓位调整方案
3. 行业配置建议
4. 个股替换建议
5. 风险控制措施`;
                break;
            case 'hotspot':
                analysisPrompt = `基于复盘结果分析热点板块投资机会：

当前热点：新能源汽车、人工智能、医药生物

请分析：
1. 各热点板块的投资逻辑
2. 推荐的龙头股票和理由
3. 最佳介入时机和策略
4. 预期收益和风险评估
5. 资金分配建议

请为我制定热点跟进策略。`;
                break;
            case 'risk':
                analysisPrompt = `基于复盘结果制定风险控制策略：

请帮我制定：
1. 今日交易风险控制方案
2. 止损止盈位设置建议
3. 仓位管理优化方案
4. 市场异常情况应对策略
5. 风险预警机制设置

请提供具体可执行的风控措施。`;
                break;
            case 'strategy':
                analysisPrompt = `基于复盘结果制定投资策略：

请帮我规划：
1. 短期（1周）投资策略
2. 中期（1个月）投资策略
3. 长期（3个月）投资策略
4. 资产配置优化方案
5. 投资节奏控制建议

请提供完整的策略执行方案。`;
                break;
        }
    } else if (message.isWatchlistDisplay) {
        // 自选股相关的交互操作
        switch (action.actionType) {
            case 'analyze':
                analysisPrompt = action.prompt || '分析我的自选股整体表现';
                break;
            case 'advice':
                analysisPrompt = action.prompt || '给出我的自选股交易建议';
                break;
            case 'recommend':
                analysisPrompt = action.prompt || '推荐与我自选股相关的热门股票';
                break;
        }
    }

    if (analysisPrompt) {
        // 发送分析请求
        const res = await mockApi.sendMessage(analysisPrompt);
        const newMessages = [
            { id: generateMessageId(), role: 'user', content: action.description || analysisPrompt, timestamp: Date.now() },
            { id: generateMessageId(), ...res.data, timestamp: Date.now() }
        ];

        // 直接添加交互分析消息，不限制消息数量
        chatHistory.value.push(...newMessages);
        chatHistory.value = [...chatHistory.value]; // 触发响应式更新

        // 同步到chatHistoryStore，确保用户消息被保存
        chatHistoryStore.updateCurrentChatMessagesWithoutLimit(chatHistory.value);

        await nextTick();
        scrollToBottom();
        ElMessage.success(`已为您生成分析结果`);
    }
};

// 个性化引导完成处理
const onOnboardingComplete = (data) => {
    showOnboarding.value = false;
    newUserForceStart.value = false; // 重置强制开始标记

    // 根据用户偏好显示简单的欢迎消息
    if (data && data.profile) {
        timerManager.create('onboarding-welcome', () => {
            ElMessage.success(`🎉 投资画像生成完成！欢迎使用智投小助手，根据您的${data.profile.riskLabel}投资风格，我将为您提供个性化服务。`);
        }, 500);
    }
};

// 处理引导流程中的股票分析
const handleAnalyzeStock = (stock) => {
    showOnboarding.value = false;
    isChatMode.value = true;

    timerManager.create('analyze-stock', () => {
        const message = `请详细分析一下${stock.name}(${stock.code})这只股票，包括基本面分析、技术面分析、投资建议和风险提示。`;
        inputMessage.value = message;
        sendMessage();
    }, 300);
};

// 处理引导流程中的操作执行
const handleOnboardingAction = async (action) => {
    const { type, task, suggestion } = action;

    switch (type) {
        case 'diagnosis':
            ElMessage.success('AI诊断功能已体验完成！');
            break;
        case 'mock-trade':
            ElMessage.success('模拟交易功能已体验完成！');
            break;
        case 'risk-control':
            ElMessage.success('风控设置功能已体验完成！');
            break;
        case 'auto-invest':
            showOnboarding.value = false;
            isChatMode.value = true;
            setTimeout(() => {
                inputMessage.value = `一键设置：${suggestion}`;
                sendMessage();
            }, 300);
            break;
        default:
            console.log('未知操作类型:', type);
    }
};

// 快捷操作点击处理
const handleShortcutClick = (shortcut) => {
    console.log('🚀 点击快捷操作:', shortcut);

    try {
        if (shortcut.isDefault) {
            const actionMap = {
                'smart_review': () => setSuggestionAndSend(`请结合我的投资风格和市场大数据，给出专业的智能化复盘建议。`),
                'watchlist': handleWatchlistView,
                'smart_recommendation': handleSmartRecommendation,
                'news_update': () => setSuggestionAndSend(`最新财经资讯`),
                'asset_analysis': handleAssetAnalysis
            };

            const handler = actionMap[shortcut.action];
            if (handler) {
                handler();
            } else if (typeof shortcut.action === 'function') {
                shortcut.action();
            } else {
                console.error('未知的快捷操作类型:', shortcut.action);
                ElMessage.error('快捷操作配置错误');
            }
        } else {
            if (shortcut.prompt) {
                setSuggestionAndSend(shortcut.prompt);
            } else {
                console.error('自定义快捷操作缺少prompt:', shortcut);
                ElMessage.error('自定义快捷操作配置错误');
            }
        }
    } catch (error) {
        console.error('执行快捷操作失败:', error);
        ElMessage.error('执行快捷操作时发生错误');
    }
};

// 快捷操作自定义相关方法
const openCustomizeDialog = () => {
    customizeDialogVisible.value = true;
};

// ShortcutsBar组件引用
const shortcutsBarRef = ref(null);
const chatShortcutsBarRef = ref(null);
const mobileChatShortcutsRef = ref(null);

// 处理快捷操作更新事件
const handleShortcutsUpdated = () => {
    console.log('🔄 快捷操作更新事件触发');
    notifyShortcutsBarComponents('handleShortcutsUpdated');
    // 同时更新主页快捷操作
    nextTick(() => {
        initializeHomeShortcuts();
        console.log('✅ 主页快捷操作更新完成');
    });
};



// 组件挂载时初始化
onMounted(() => {
    initializeShortcuts();
});
</script>

<!-- 非scoped样式用于移动端按钮优化 -->
<style lang="scss">
@import '@/styles/mixins/_index.scss';

/* 统一的移动端样式 - 合并所有重复的@include mobile */
@include mobile {

    /* 移动端强制清除body和html的底部间距 - 确保输入框能贴底 */
    html,
    body {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        overflow-x: hidden !important;
        height: 100% !important;
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior: none;
        width: 100% !important;
        position: relative !important;
    }

    /* 移动端主容器无边距 */
    .modern-content {
        width: 100% !important;
        padding: 76px 0 0 0 !important;
        margin: 0 !important;
    }

    /* 移动端侧边栏悬浮按钮优化 */
    button.floating-sidebar-toggle {
        width: 30px !important;
        height: 30px !important;
        min-width: 30px !important;
        min-height: 30px !important;
        max-width: 30px !important;
        max-height: 30px !important;
        right: 12px !important;
        top: 72px !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
        backdrop-filter: blur(8px) !important;
        color: #6b7280 !important;
        border-radius: 50% !important;
        opacity: 0.85 !important;
        transition: all 0.2s ease !important;
        position: fixed !important;
        z-index: 100 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
    }

    button.floating-sidebar-toggle:hover {
        background: rgba(255, 255, 255, 1) !important;
        opacity: 1 !important;
        transform: scale(1.05) !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
        color: #374151 !important;
        width: 30px !important;
        height: 30px !important;
    }

    button.floating-sidebar-toggle:active {
        transform: scale(0.95) !important;
        background: rgba(249, 250, 251, 1) !important;
        width: 30px !important;
        height: 30px !important;
    }

    button.floating-sidebar-toggle svg {
        width: 14px !important;
        height: 14px !important;
        stroke-width: 2 !important;
    }

    /* 移动端聊天历史面板显示时的位移 */
    .modern-content.with-chat-history {
        transform: translateX(280px);
    }

    /* 主页模式下为内容区域添加底部间距，避免被输入框遮挡 */
    .modern-content:not(.chatting) {
        padding-bottom: 220px !important;
        /* 为贴底的输入框和快捷操作按钮留出更多空间 */
    }

    /* 移动端主页快捷操作按钮外层容器 */
    .mobile-home-shortcuts-wrapper {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 120px !important;
        /* 基础位置：位于输入框上方 */
        z-index: 999 !important;
        /* 确保在输入框之上 */
        pointer-events: none;
        /* 允许点击穿透到下层元素 */
        transform: translateY(0) !important;
        /* 默认无偏移 */
        transition: transform 0.3s ease !important;
        /* 平滑过渡 */
    }

    /* 移动端主页快捷操作按钮样式 */
    .mobile-home-shortcuts {
        width: 100%;
        // background: rgba(255, 255, 255, 0.95);
        /* 添加半透明背景，确保可见性 */
        // backdrop-filter: blur(10px);
        /* 添加模糊效果 */
        -webkit-backdrop-filter: blur(10px);
        /* Safari兼容 */
        padding: 12px 12px 8px 12px;
        /* 增加顶部内边距 */
        box-sizing: border-box;
        // border-top: 1px solid rgba(0, 0, 0, 0.05);
        /* 添加顶部边框 */
        // box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
        /* 添加阴影效果 */
        /* 调试用：确保可见性 */
        min-height: 50px;
        /* 确保有足够高度 */
        display: block !important;
        /* 确保显示 */
        pointer-events: auto;
        /* 恢复按钮的点击事件 */
    }

    .mobile-home-shortcuts .shortcuts-container {
        position: relative;
        padding: 0;
    }

    .mobile-home-shortcuts .shortcuts-scroll-wrapper {
        overflow: hidden;
        position: relative;
    }

    .mobile-home-shortcuts .shortcuts-list {
        display: flex;
        gap: 8px;
        padding: 0;
        overflow-x: auto;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
        flex: 1;
    }

    .mobile-home-shortcuts .shortcuts-list::-webkit-scrollbar {
        display: none;
    }

    /* 移动端主页快捷操作按钮 */
    .mobile-home-shortcuts .shortcut-btn {
        border-radius: 12px;
        background: #f5f7fa;
        color: #18181b;
        font-weight: 500;
        border: 1px solid #e0e0e0;
        box-shadow: none;
        padding: 4px 12px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.8rem;
        height: 28px;
        white-space: nowrap;
        flex-shrink: 0;
        min-width: auto;
        flex-direction: row;
        justify-content: center;
        text-align: left;
        cursor: pointer;
    }

    .mobile-home-shortcuts .shortcut-btn:hover {
        background: #e6e8eb;
        border-color: #d0d0d0;
    }

    .mobile-home-shortcuts .shortcut-btn:active {
        background: #e6e8eb;
        border-color: #d0d0d0;
    }

    .mobile-home-shortcuts .shortcut-icon {
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .mobile-home-shortcuts .shortcut-text {
        font-size: 0.8rem;
        line-height: 1.2;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
    }

    /* 自定义按钮样式 */
    .mobile-home-shortcuts .customize-btn:hover {
        background: #e6e8eb;
        border-color: #d0d0d0;
    }

    .mobile-home-shortcuts .customize-btn:active {
        background: #e6e8eb;
        border-color: #d0d0d0;
    }

    /* 超小屏幕适配 */
    @media (max-width: 375px) {
        .mobile-home-shortcuts-wrapper {
            bottom: 110px !important;
            /* 超小屏幕调整位置 */
        }

        .mobile-home-shortcuts .shortcuts-list {
            gap: 6px;
        }

        .mobile-home-shortcuts .shortcut-btn {
            height: 26px;
            padding: 3px 8px;
            gap: 3px;
            font-size: 0.7rem;
        }

        .mobile-home-shortcuts .shortcut-icon {
            font-size: 12px;
        }

        .mobile-home-shortcuts .shortcut-text {
            font-size: 0.7rem;
        }
    }

    /* 大屏手机适配 */
    @media (min-width: 414px) {
        .mobile-home-shortcuts-wrapper {
            bottom: 130px !important;
            /* 大屏手机调整位置 */
        }

        .mobile-home-shortcuts .shortcuts-list {
            gap: 10px;
        }

        .mobile-home-shortcuts .shortcut-btn {
            height: 30px;
            padding: 5px 12px;
            gap: 5px;
            font-size: 0.85rem;
        }

        .mobile-home-shortcuts .shortcut-icon {
            font-size: 16px;
        }

        .mobile-home-shortcuts .shortcut-text {
            font-size: 0.85rem;
        }
    }

    /* 移动端增加welcome-section和AI卡片之间的间距 */
    .welcome-section {
        margin-bottom: 40px !important;
    }

    .welcome-section.with-performance {
        margin-bottom: 32px !important;
    }

    /* 微信浏览器环境下减少间距 */
    body.wechat-browser .welcome-section.with-performance {
        margin-bottom: 8px !important;
        /* 进一步减少微信端间距 */
    }

    /* 非微信浏览器环境下适当增加间距，确保与输入框有合适距离 */
    body:not(.wechat-browser) .welcome-section.with-performance {
        margin-bottom: 32px !important;
    }

    /* 移动端响应式设计 */
    .greeting-container {
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }

    .greeting-avatar-large {
        width: 50px;
        height: 50px;
    }

    .greeting-message {
        align-items: center;
        text-align: center;
    }

    .modern-title {
        font-size: 1.8rem;
    }

    .modern-subtitle {
        font-size: 0.85rem;
        text-align: center;
    }

    /* 移动端聊天消息字体优化 */
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

    /* 移动端聊天历史区域完整重新定义 */
    .chat-history-area {
        height: calc(100vh - 76px - 200px) !important;
        /* 减少高度：76px(导航+间距) + 200px(输入框空间+快捷操作栏) */
        padding: 0 12px 40px 12px !important;
        /* 顶部无padding，左右12px间距确保消息不贴边，底部40px避免遮挡 */
        margin: 0 !important;
        /* 移除所有margin */
        width: 100% !important;
        max-width: none !important;
        /* 移动端占满宽度 */
        box-sizing: border-box !important;
        /* 确保padding不影响宽度计算 */
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
    }

    /* 移动端滚动条优化 - 始终可见 */
    .chat-history-area::-webkit-scrollbar {
        width: 4px !important;
        /* 移动端稍细一些 */
    }

    .chat-history-area::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05) !important;
        /* 轻微的背景色 */
        border-radius: 2px;
    }

    .chat-history-area::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2) !important;
        border-radius: 2px;
    }

    /* 移动端生成状态内联样式优化 */
    .generating-label {
        font-size: 0.8rem;
    }

    /* 互动建议适配 */
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

    /* 股票相关移动端适配 */
    .stock-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }

    .stock-price-change {
        align-self: flex-end;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
    }

    .current-price {
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1;
    }

    .price-change {
        font-size: 0.7rem;
        padding: 1px 4px;
        border-radius: 3px;
        line-height: 1;
    }

    .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        display: contents;
    }

    .detail-label {
        min-width: auto;
        font-size: 0.65rem;
        color: #64748b;
        white-space: nowrap;
        font-weight: 500;
        line-height: 1;
        text-align: center;
    }

    .detail-value {
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: #1f2937;
    }

    .detail-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 6px 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(226, 232, 240, 0.5);
        min-height: 40px !important;
        height: 40px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .stock-item-actions {
        justify-content: flex-start;
        gap: 4px;
        flex-wrap: wrap;
        overflow-x: visible;
    }

    .stock-item-actions .el-button {
        font-size: 10px;
        padding: 4px 8px;
        min-height: 28px;
        border-radius: 6px;
        flex-shrink: 0;
    }

    .stock-item-actions .el-button svg {
        width: 10px;
        height: 10px;
    }

    .sell-stock-btn,
    .buy-stock-btn-secondary {
        font-size: 10px;
        padding: 4px 8px;
        min-height: 28px;
        border-radius: 6px;
    }

    /* 推荐指数移动端适配 */
    .recommend-index {
        flex-wrap: nowrap;
        gap: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
    }

    .recommend-stars {
        display: flex;
        align-items: center;
        gap: 1px;
    }

    .star {
        font-size: 0.75rem;
    }

    .recommend-score {
        font-size: 0.65rem;
        padding: 1px 3px;
        white-space: nowrap;
        color: #64748b;
        margin-left: 2px;
    }

    .help-icon {
        font-size: 0.75rem;
        margin-left: 2px;
    }

    .recommend-level {
        font-size: 0.65rem;
        padding: 1px 4px;
        min-width: 40px;
        white-space: nowrap;
        font-size: 0.6rem;
        padding: 1px 3px;
        margin-left: 2px;
    }

    /* 优化详细信息显示 - 两行两列布局，平分宽度 */
    .stock-item .stock-info .stock-details {
        margin-top: 6px !important;
        padding: 6px 8px !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        border: 1px solid #e2e8f0 !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        gap: 6px 8px !important;
        align-items: center !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    /* 推荐理由横向显示，限制1行 */
    .stock-reason {
        margin-top: 8px !important;
        padding: 8px !important;
        background: #fff3cd !important;
        border-radius: 4px !important;
        font-size: 0.7rem !important;
        line-height: 1.3 !important;
        color: #856404 !important;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        max-height: 2.6rem !important;
        word-break: break-all !important;
    }

    /* 移动端股票详情弹窗优化 */
    .stock-detail-popup {
        width: 95% !important;
        max-width: 400px !important;
        margin: 0 auto !important;
        border-radius: 12px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
    }

    .stock-detail-popup .el-dialog__body {
        padding: 16px !important;
        max-height: 70vh !important;
        overflow-y: auto !important;
    }

    /* 移动端股票操作弹窗样式 */
    .mobile-stock-dialog {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        transform: none !important;
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        border-radius: 16px 16px 0 0 !important;
        background: white !important;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
        animation: slideUp 0.3s ease-out !important;
    }

    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }

        to {
            transform: translateY(0);
        }
    }

    /* 移动端聊天区域新建聊天按钮样式调整 */
    .chat-actions .new-chat-btn {
        border-radius: 12px !important;
        background: #f5f7fa !important;
        color: #18181b !important;
        font-weight: 500 !important;
        border: 1px solid #e0e0e0 !important;
        box-shadow: none !important;
        padding: 6px 10px !important;
        transition: all 0.2s !important;
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        font-size: 0.8rem !important;
        height: 32px !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        min-width: auto !important;
    }

    .chat-actions .new-chat-btn:hover {
        background: #e6e8eb !important;
        border-color: #d0d0d0 !important;
    }

    .chat-actions .new-chat-btn:active {
        transform: scale(0.98) !important;
    }

    .chat-actions .new-chat-btn svg {
        width: 14px !important;
        height: 14px !important;
    }

    /* 移动端账户信息适配 */
    .account-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    /* 移动端总资产卡片优化 */
    .total-asset-card {
        padding: 20px 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .total-asset-card::before {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    }

    .amount-label {
        font-size: 0.9rem;
        margin-bottom: 6px;
    }

    .amount-value {
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 8px;
    }

    .asset-change {
        font-size: 1rem;
        gap: 6px;
    }

    .change-label {
        font-size: 0.85rem;
    }

    /* 移动端统计卡片网格优化 */
    .overview-stats.watchlist-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 12px;
    }

    .overview-stats.asset-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 12px;
    }

    .stat-item {
        padding: 14px 10px;
        gap: 8px;
        min-height: 85px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .stat-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    .stat-item:active {
        transform: scale(0.98);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .stat-item:active::before {
        opacity: 1;
    }

    .stat-item:hover {
        transform: none;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
        font-size: 1.4rem;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        margin-bottom: 4px;
    }

    .stat-icon.cash {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }

    .stat-icon.portfolio {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .stat-icon.stocks {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .stat-icon.watchlist {
        background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
    }

    .stat-label {
        font-size: 0.75rem;
        color: #64748b !important;
        margin-bottom: 3px;
        font-weight: 600;
        line-height: 1.2;
    }

    .stat-value {
        font-size: 1.1rem;
        font-weight: 800;
        color: #1e293b !important;
        line-height: 1.1;
    }

    .data-grid {
        grid-template-columns: 1fr;
    }

    .watchlist-cards {
        grid-template-columns: 1fr;
    }

    .tab-item {
        padding: 8px 12px;
        font-size: 13px;
    }

    .portfolio-card,
    .watchlist-card {
        padding: 16px;
    }

    .stock-account-container {
        padding: 16px;
    }

    .account-title {
        font-size: 1.25rem;
    }

    .amount-value {
        font-size: 2rem;
    }

    /* 移动端空状态优化 */
    .empty-state {
        padding: 30px 20px;
    }

    .empty-state .empty-icon {
        font-size: 36px;
        margin-bottom: 12px;
    }

    .empty-state h4 {
        font-size: 16px;
        margin: 0 0 6px 0;
    }

    .empty-state p {
        font-size: 13px;
    }
}

/* 桌面端侧边栏悬浮按钮基础样式 */
@include tablet-up {
    .floating-sidebar-toggle {
        position: fixed;
        top: 72px;
        right: 12px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #6b7280;
        z-index: 1001;
    }

    .floating-sidebar-toggle:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        color: #374151;
        transform: scale(1.05);
    }

    .floating-sidebar-toggle:active {
        transform: scale(0.95);
        background: rgba(249, 250, 251, 1);
    }

    .floating-sidebar-toggle svg {
        width: 14px;
        height: 14px;
        stroke-width: 2;
    }
}
</style>

<style scoped lang="scss">
@import '@/styles/mixins/_index.scss';

/* 全局禁用缩放和双击缩放 */
* {
    touch-action: pan-x pan-y !important;
    -webkit-touch-callout: none !important;
    -webkit-user-select: none !important;
    -khtml-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
}

/* 允许文本选择的元素 */
input,
textarea,
[contenteditable],
.chat-message .message-text,
.chat-message .message-text *,
.chat-message .markdown-content,
.chat-message .markdown-content *,
.chat-message .chat-message-content,
.chat-message .chat-message-content *,
.chat-title,
.chat-history-container .chat-info .chat-title,
.markdown-content,
.markdown-content *,
.message-text,
.message-text * {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
}

/* 特别针对聊天消息内容的文本选择 */
.chat-message-content,
.chat-message-content *,
.chat-message-content .message-text,
.chat-message-content .message-text *,
.chat-message-content .markdown-content,
.chat-message-content .markdown-content * {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
}

/* 更强制的文本选择规则 - 确保覆盖所有可能的阻止规则 */
.chat-message .chat-message-content,
.chat-message .chat-message-content *,
.chat-message .message-text,
.chat-message .message-text *,
.chat-message .markdown-content,
.chat-message .markdown-content *,
.chat-message .markdown-content p,
.chat-message .markdown-content p *,
.chat-message .markdown-content div,
.chat-message .markdown-content div *,
.chat-message .markdown-content span,
.chat-message .markdown-content span *,
.markdown-content,
.markdown-content *,
.markdown-content p,
.markdown-content p *,
.markdown-content div,
.markdown-content div *,
.markdown-content span,
.markdown-content span * {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
    cursor: text !important;
}

/* 确保文本选择在所有状态下都可用 */
.chat-message:hover .chat-message-content,
.chat-message:hover .chat-message-content *,
.chat-message:active .chat-message-content,
.chat-message:active .chat-message-content *,
.chat-message:focus .chat-message-content,
.chat-message:focus .chat-message-content * {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
    -webkit-touch-callout: text !important;
    cursor: text !important;
}

.main-modern {
    min-height: 100vh;
    background: #fafbfc;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    touch-action: pan-x pan-y !important;
}

/* 当显示引导组件时允许滚动 */
.main-modern:has(.onboarding-flow) {
    overflow-y: auto;
}

/* 如果浏览器不支持:has，使用类名方式 */
.main-modern.onboarding-active {
    overflow-y: auto;
}

/* 强制body在引导模式下允许滚动 */
body:has(.onboarding-active),
body.onboarding-mode {
    overflow-y: auto !important;
}



.modern-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 32px 0 32px;
    max-width: 900px;
    /* 调整为与AI卡片一致的最大宽度，确保聊天消息区域与输入框宽度完全对齐 */
    margin: 0 auto;
    width: 100vw;
    box-sizing: border-box;
    transition: justify-content 0.3s, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: hidden;
    min-height: 0;
    transform: translateX(0);
    will-change: auto;
}

/* 当显示聊天历史面板时，主容器右移 */
.modern-content.with-chat-history {
    transform: translateX(320px);
    will-change: transform;
}



/* 引导模式下的特殊样式 */
.onboarding-active .modern-content {
    max-width: 100%;
    padding: 56px 0 0 0;
    overflow-y: visible;
}

.modern-content.chatting {
    justify-content: flex-start;
    padding-top: 72px;
    /* 减少PC端聊天模式顶部间距 */
    padding-bottom: 0;
    height: calc(100vh - 56px);
    overflow: hidden;
}

/* 移除对主内容区域的padding限制，让聊天框保持原有大小 */

.center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 900px;
}

.welcome-section {
    text-align: center;
    margin-bottom: 32px;
}

.welcome-section.with-performance {
    margin-bottom: 32px;
}




.greeting-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
}

.greeting-avatar-large {
    width: 48px;
    height: 48px;
    background: #3b82f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.greeting-message {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

.modern-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    line-height: 1.3;
}

.modern-subtitle {
    font-size: 1rem;
    color: #6b7280;
    margin: 2px 0 0 0;
    font-weight: 400;
}

.modern-desc {
    font-size: 1.1rem;
    color: #6b7280;
    margin-bottom: 20px;
    text-align: center;
    line-height: 1.5;
}

/* AI生成状态指示器样式 */
.generating-indicator {
    display: flex;
    justify-content: flex-start;
    margin: 16px 0;
    padding: 0 20px;
    animation: fadeIn 0.3s ease-in;
}

.generating-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 80%;
}

.generating-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    animation: pulse-avatar 2s ease-in-out infinite;
}

.generating-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 12px 16px;
    position: relative;
}

.generating-text::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 12px;
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid #f8fafc;
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

@keyframes pulse-avatar {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
    }
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

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* AI生成状态内联样式（在消息气泡内显示） */
.generating-message {
    animation: fadeIn 0.3s ease-in;
}

.generating-content-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
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

@keyframes pulse-avatar {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
    }
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

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
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



.chat-history-area {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 0;
    /* 移除左右padding，让聊天历史区域的视觉边界与AI卡片的边界完全一致 */
    overflow-y: auto;
    height: calc(100vh - 56px - var(--input-area-height, 320px));
    /* 页面高度 - 导航栏高度 - 输入区域高度(动态调整) */
    scrollbar-width: thin;
    /* Firefox */
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
    /* Firefox - 始终显示滚动条 */
    scroll-behavior: smooth;
    /* 启用CSS原生平滑滚动 */
    transition: height 0.3s ease;
    /* 只保留高度变化的过渡动画 */

    /* 性能优化 */
    will-change: scroll-position;
    /* 告诉浏览器这个元素会滚动，进行优化 */
    -webkit-overflow-scrolling: touch;
    /* iOS Safari滚动优化 */
    contain: layout style paint;
    /* CSS Containment API 优化渲染性能 */
}



/* 移动端聊天历史底部占位元素 */
.mobile-chat-spacer {
    height: 60px;
    /* 增加占位高度，确保有足够空间避免被输入区域遮挡 */
    /* 确保有足够空间避免被新建聊天按钮遮挡 */
    width: 100%;
    flex-shrink: 0;
    /* 防止被压缩 */
}



@include tablet-up {
    .mobile-chat-spacer {
        display: none;
    }
}

/* 聊天区域滚动条样式 - 简化版本，始终可见 */
.chat-history-area::-webkit-scrollbar {
    width: 6px;
}

.chat-history-area::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
}

.chat-history-area::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
    transition: background 0.2s ease;
}

/* 鼠标悬停时加深颜色 */
.chat-history-area::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
}

.chat-message {
    display: flex;
    margin-bottom: 0.625rem;
    // padding: 0 20px;
    /* 添加左右间距，与AI卡片的内边距保持一致，确保消息内容不贴边 */
    width: 100%;
    box-sizing: border-box;
    flex-direction: column;
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 16px 20px 16px 20px;
    /* 调整用户消息padding：顶部16px，底部12px，补偿字体基线对齐造成的视觉不平衡 */
    margin-left: auto;
    max-width: 75%;
    /* PC端用户消息保持适中宽度，与助手消息形成视觉层次 */
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
    /* 确保长文本正确换行 */
}

/* 强制清除用户消息内容的内部间距 */
.chat-message.user .chat-message-content .message-text {
    margin: 0 !important;
    padding: 0 !important;
}

.chat-message.user .chat-message-content .message-text>* {
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

.chat-message.user .chat-message-content .markdown-content :deep(p:last-child) {
    margin-bottom: 0 !important;
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 14px 20px 8px 20px;
    margin-right: auto;
    max-width: 100%;
    width: 100%;
    /* PC端聊天消息占满聊天框宽度，通过padding控制内容间距 */
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
    /* 确保长文本正确换行 */
}

/* 强制清除AI助手消息内容的内部间距 */
.chat-message.assistant .chat-message-content .message-text {
    margin: 0 !important;
    padding: 0 !important;
}

.chat-message.assistant .chat-message-content .message-text>* {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
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

/* 聊天消息内容样式 */
.message-text {
    white-space: pre-line;
    margin: 0;
    padding: 0;
    line-height: inherit;
}

.message-text:last-child {
    margin-bottom: 0;
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

/* 荐股列表样式 */
.stock-list {
    border-radius: 12px;
    padding: 8px;
    transition: all 0.3s ease;
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
    border: 2px solid #fbbf24 !important;
    background: rgba(254, 243, 199, 0.1) !important;
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.1) !important;
}

/* 使用StockList组件，移除重复的股票样式 */

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

/* Tooltip样式 */
.recommend-index-tooltip {
    padding: 8px 0;
    max-width: 280px;
}

.tooltip-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    line-height: 1.4;
}

.tooltip-item:last-child {
    margin-bottom: 0;
}

.tooltip-item .score {
    font-size: 0.8rem;
    font-weight: 600;
    color: #fbbf24;
    min-width: 50px;
    flex-shrink: 0;
}

.tooltip-item .desc {
    font-size: 0.8rem;
    color: #e5e7eb;
    line-height: 1.4;
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

/* 为移动端股票卡片专门的样式覆盖 */
.stock-item .stock-details {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    gap: 6px 8px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
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

.expected-return {
    color: #059669;
}

.risk-level {
    color: #f59e0b;
}

.industry {
    color: #8b5cf6;
}

/* 持仓状态样式 */
.position-status,
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
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    text-align: center;
    white-space: nowrap;
}

.status-value.profit {
    color: #059669;
    background: #d1fae5;
    border: 1px solid #10b981;
}

.status-value.loss {
    color: #dc2626;
    background: #fee2e2;
    border: 1px solid #f87171;
}

.status-value.watchlist-active {
    color: #f59e0b;
    background: #fef3c7;
    border: 1px solid #f59e0b;
}

/* 价格变化中性状态 */
.price-change.neutral {
    color: #6b7280;
    background: #f3f4f6;
}

/* 卖出按钮样式 */
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
    transform: translateY(-1px);
}

.stock-reason {
    margin-top: 12px;
    padding: 8px;
    background: #fff3cd;
    border-radius: 4px;
    border: 1px solid #ffeaa7;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    grid-column: 1 / -1;
    position: relative;
    min-height: 32px;
}

.reason-label {
    font-size: 0.875rem;
    color: #856404;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
}

.reason-text {
    font-size: 0.875rem;
    color: #533f03;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-all;
    flex: 1;
}

/* 使用StockList组件，移除重复的stock-item-actions样式 */

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
    animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
    0% {
        transform: translateX(-100%);
    }

    50%,
    100% {
        transform: translateX(100%);
    }
}

/* 兼容旧版price-tag（如果还有单独使用的地方） */
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



/* 小屏手机进一步优化 - 移除重复的股票样式，由StockList组件提供 */
@include mobile-sm {

    /* 保留推荐指数的小屏幕优化样式 */
    .recommend-index {
        gap: 3px;
    }

    .star {
        font-size: 0.7rem;
    }

    .recommend-score {
        font-size: 0.6rem;
        margin-left: 1px;
    }

    .help-icon {
        font-size: 0.7rem;
        margin-left: 1px;
    }

    .recommend-level {
        font-size: 0.55rem;
        padding: 1px 2px;
        margin-left: 1px;
    }

    /* 移除重复的小屏幕按钮样式 - 由StockList组件提供 */
}

.add-watchlist-btn,
.remove-watchlist-btn,
.continue-analysis-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.add-watchlist-btn {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.add-watchlist-btn:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
}

.remove-watchlist-btn {
    background: #10b981;
    border-color: #10b981;
    color: white;
}

.remove-watchlist-btn:hover {
    background: #059669;
    border-color: #059669;
    transform: translateY(-1px);
}

.continue-analysis-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #374151;
}

.continue-analysis-btn:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #1f2937;
    transform: translateY(-1px);
}

.buy-stock-btn,
.buy-stock-btn-secondary {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.buy-stock-btn {
    background: #f59e0b;
    border-color: #f59e0b;
    color: white;
}

.buy-stock-btn:hover {
    background: #d97706;
    border-color: #d97706;
    transform: translateY(-1px);
}

.buy-stock-btn-secondary {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #f59e0b;
}

.buy-stock-btn-secondary:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #d97706;
    transform: translateY(-1px);
}

/* 股票账户信息展示样式 */
.stock-account-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-top: 16px;
    margin-bottom: 16px;
}

/* 账户标题区域 */
.account-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 16px;
}

.account-title-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.account-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.account-time {
    font-size: 0.875rem;
    color: #64748b;
}



/* 账户总览 */
.account-overview {
    margin-bottom: 32px;
}

.overview-main {
    margin-bottom: 20px;
}

.total-asset-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 24px;
    color: white;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

.total-asset-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
}

.asset-amount {
    margin-bottom: 12px;
}

.amount-label {
    display: block;
    font-size: 1rem;
    opacity: 0.9;
    margin-bottom: 8px;
}

.amount-value {
    display: block;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
}

.asset-change {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 1.1rem;
    font-weight: 600;
}

.change-label {
    font-size: 0.95rem;
    opacity: 0.9;
    font-weight: 500;
}

.asset-change.profit {
    color: #fef3c7;
}

.asset-change.loss {
    color: #fecaca;
}

.change-icon {
    font-size: 1.2rem;
}

.overview-stats {
    display: grid;
    gap: 16px;
    justify-content: center;
    margin-bottom: 20px;
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
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-height: 80px;
    text-align: center;
}

.stat-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.stat-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border-radius: 10px;
    margin: 0 auto;
}

.stat-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
}

.stat-label {
    font-size: 0.8rem;
    color: #64748b !important;
    margin-bottom: 2px;
    font-weight: 500;
    display: block;
    text-align: center;
    width: 100%;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b !important;
    line-height: 1.2;
    display: block;
    text-align: center;
    width: 100%;
}

/* 通用区域样式 */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.section-subtitle {
    font-size: 0.875rem;
    color: #64748b;
}

/* 持仓明细表格 */
.portfolio-details {
    margin-bottom: 32px;
}

.portfolio-table {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1.2fr 1.2fr 1fr 1.2fr;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 20px;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
}

.table-body {
    display: flex;
    flex-direction: column;
}

.table-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1.2fr 1.2fr 1fr 1.2fr;
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.2s ease;
}

.table-row:hover {
    background: #f8fafc;
}

.table-row:last-child {
    border-bottom: none;
}

.col-stock .stock-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* 移除重复的基础股票样式 - 由StockList组件提供 */

.stock-industry {
    font-size: 0.75rem;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
}

.col-price .price-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.current-price {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.cost-price {
    font-size: 0.875rem;
    color: #64748b;
}

.quantity-value,
.market-value {
    font-size: 1rem;
    font-weight: 500;
    color: #1e293b;
}

.profit-amount,
.profit-percent {
    font-size: 1rem;
    font-weight: 600;
}

.profit-amount.profit,
.profit-percent.profit {
    color: #dc2626;
}

.profit-amount.loss,
.profit-percent.loss {
    color: #16a34a;
}

.col-actions {
    display: flex;
    gap: 8px;
}

.sell-btn,
.analysis-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
}

.sell-btn {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
}

.sell-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
}

.analysis-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #374151;
}

.analysis-btn:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
}

/* 空状态 */
.empty-portfolio {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 32px;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-text h4 {
    font-size: 1.25rem;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
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

/* 操作按钮样式 */
.optimization-btn {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 0.875rem;
}

.optimization-btn:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
}

.risk-analysis-btn {
    background: #f59e0b;
    border-color: #f59e0b;
    color: white;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 0.875rem;
}

.risk-analysis-btn:hover {
    background: #d97706;
    border-color: #d97706;
    transform: translateY(-1px);
}

.refresh-btn {
    background: #6b7280;
    border-color: #6b7280;
    color: white;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 0.875rem;
}

.refresh-btn:hover {
    background: #4b5563;
    border-color: #4b5563;
    transform: translateY(-1px);
}

/* 响应式设计 */
@include tablet {
    .asset-main-content {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .asset-overview-horizontal {
        grid-template-columns: repeat(2, 1fr);
    }
}

@include mobile {
    .asset-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .asset-header-actions {
        width: 100%;
        justify-content: space-between;
    }

    .asset-overview-horizontal {
        grid-template-columns: 1fr;
    }

    .portfolio-data-grid {
        grid-template-columns: 1fr;
    }

    .portfolio-actions-compact {
        flex-direction: column;
    }
}

/* 桌面端输入区域样式 */
@include tablet-up {
    .input-area {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: transparent;
        border: none;
        padding: 16px 32px 24px 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 50;
        transition: all 0.3s;
    }
}



/* 移除输入区域的right限制，让它保持全宽 */

.new-chat-section {
    width: 100%;
    max-width: 900px;
    margin-bottom: 12px;
    /* 减少底部间距 */
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    /* 确保内容垂直居中 */
    overflow-x: auto;
    /* 隐藏水平滚动条但保持滚动功能 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.new-chat-section::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

.chat-actions {
    display: flex !important;
    gap: 6px;
    /* 进一步减少按钮间距 */
    align-items: center !important;
    flex-wrap: nowrap !important;
    /* 强制在一行显示，不允许换行 */
    justify-content: center !important;
    width: 100% !important;
    /* 确保容器宽度充足 */
    overflow-x: auto;
    /* 隐藏水平滚动条但保持滚动功能 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.chat-actions::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
}

.new-chat-btn {
    border-radius: 12px;
    /* 进一步减少圆角，更紧凑 */
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 4px 12px;
    /* 进一步减少padding，让按钮更紧凑 */
    transition: all 0.2s;
    display: flex !important;
    align-items: center !important;
    gap: 4px;
    /* 进一步减少图标间距 */
    font-size: 0.8rem;
    /* 进一步减小字体 */
    height: 28px;
    /* 减小固定高度 */
    white-space: nowrap !important;
    /* 防止文字换行 */
    flex-shrink: 0 !important;
    /* 防止按钮被压缩 */
    min-width: 80px !important;
    /* 确保按钮有最小宽度 */
    visibility: visible !important;
    /* 确保按钮可见 */
    opacity: 1 !important;
    /* 确保按钮不透明 */
}

.new-chat-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.goto-recommendation-btn {
    border-radius: 12px;
    /* 进一步减少圆角，更紧凑 */
    background: #fef3c7;
    color: #92400e;
    font-weight: 500;
    border: 1px solid #fbbf24;
    box-shadow: none;
    padding: 4px 12px;
    /* 进一步减少padding，让按钮更紧凑 */
    transition: all 0.2s;
    display: flex !important;
    align-items: center !important;
    gap: 4px;
    /* 进一步减少图标间距 */
    font-size: 0.8rem;
    /* 进一步减小字体 */
    height: 28px;
    /* 减小固定高度 */
    white-space: nowrap !important;
    /* 防止文字换行 */
    flex-shrink: 0 !important;
    /* 防止按钮被压缩 */
    min-width: auto !important;
    /* 允许按钮根据内容自适应宽度 */
}

.goto-recommendation-btn:hover {
    background: #fde68a;
    border-color: #f59e0b;
    color: #78350f;
}





/* 快捷操作切换按钮 */
.shortcuts-toggle-btn {
    transition: all 0.2s ease;
}

.shortcuts-toggle-btn:hover {
    background: #f0f0f0 !important;
    transform: rotate(45deg);
}

/* 动画效果 */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUpModal {
    from {
        opacity: 0;
        transform: translateY(100%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* PC端聊天历史按钮左对齐 */
.pc-chat-history {
    margin-right: auto;
}

/* PC端右侧按钮组 */
.pc-right-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
}

/* 输入区域左侧按钮样式 */
.input-left-btn {
    margin-right: 12px;
    flex-shrink: 0;
}

/* 输入框和按钮组合容器 */
.input-and-buttons {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}


/* 响应式设计 */
@include mobile {

    /* 防止移动端缩放和选择 */
    html,
    body {
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior: none;
        /* 确保移动端正确显示 */
        width: 100% !important;
        overflow-x: hidden !important;
        position: relative !important;
    }

    /* 主容器调整 - 让聊天框沉底 */
    .main-container {
        display: flex !important;
        flex-direction: column !important;
        min-height: 100vh !important;
        min-height: -webkit-fill-available !important;
        /* iOS Safari 兼容 */
        padding-bottom: 0 !important;
        position: relative !important;
        width: 100% !important;
        /* 性能优化：启用GPU加速和减少重绘 */
        transform: translateZ(0);
        contain: layout style;
        isolation: isolate;
    }

    .chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding-bottom: 100px;
        /* 增加底部间距，为输入区域留出更多空间 */
        padding-top: 40px;
        /* 增加顶部间距 */
        /* 为底部聊天框留出空间 */
    }

    /* 移动端输入区域容器统一样式 - 合并.input-area和.home-input-area */
    .input-area,
    .home-input-area {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        /* 移除重复的安全区域间距，让AIInputCard组件自己处理 */
        z-index: 1000 !important;
        background: transparent !important;
        /* 恢复透明背景 */
        padding: 0 !important;
        /* 移除顶部内边距，让快捷操作按钮能够正确显示 */
        margin: 0 !important;
        border: none !important;
        box-sizing: border-box !important;
        width: 100% !important;
        /* 使用flex布局确保内容贴底 */
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        /* 确保真正贴到可视区域底部 */
        transform: translateY(0) !important;
        -webkit-transform: translateY(0) !important;
        /* 移动端浏览器兼容性 */
        -webkit-backface-visibility: hidden !important;
        backface-visibility: hidden !important;
        /* 防止浏览器地址栏影响定位 */
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
    }

    /* 移动端聊天快捷操作栏样式 */
    .mobile-chat-shortcuts {
        background: transparent !important;
        /* 在同一行显示时的样式 */
        flex: 1 !important;
        margin-right: 12px !important;
        min-width: 0 !important;
        /* 允许收缩 */
        overflow: hidden !important;
        /* 防止内容溢出 */
    }

    /* 移动端新建聊天按钮容器 */
    .new-chat-buttons {
        display: flex !important;
        gap: 8px !important;
        flex-shrink: 0 !important;
        align-items: center !important;
        min-width: 0 !important;
        /* 确保按钮可见 */
    }

    /* 移动端聊天操作区域布局 */
    .chat-actions {
        display: flex !important;
        align-items: center !important;
        gap: 0 !important;
        width: 100% !important;
        overflow-x: auto !important;
        /* 隐藏水平滚动条但保持滚动功能 */
        scrollbar-width: none !important;
        /* Firefox */
        -ms-overflow-style: none !important;
        /* IE and Edge */
    }

    .chat-actions::-webkit-scrollbar {
        display: none !important;
        /* Chrome, Safari, Opera */
    }

    /* iOS Safari 特殊处理 */
    @supports (-webkit-touch-callout: none) {

        .input-area,
        .home-input-area {
            bottom: 0 !important;
            position: fixed !important;
            top: auto !important;
        }
    }

    /* 强制覆盖内联样式 */
    .input-area[style*="bottom"],
    .home-input-area[style*="bottom"] {
        bottom: 0 !important;
    }

    .input-area[style],
    .home-input-area[style] {
        bottom: 0 !important;
        width: 100% !important;
        position: fixed !important;
    }

    /* 浏览器特定优化 */
    body.android-chrome .input-area,
    body.android-chrome .home-input-area,
    body.ios-chrome .input-area,
    body.ios-chrome .home-input-area,
    body.ios-safari .input-area,
    body.ios-safari .home-input-area {
        bottom: 0 !important;
        width: 100% !important;
        position: fixed !important;
    }


}

/* 超小屏幕优化 */
@include mobile-sm {
    .chat-area {
        padding-top: 30px;
    }


    /* 超小屏幕聊天历史区域高度优化 */
    .chat-history-area {
        height: calc(100vh - 76px - 200px) !important;
        /* 超小屏幕减少高度，顶部76px包含导航和间距，底部200px包含快捷操作栏和输入框以及间隔 */
        padding: 0 0 16px 12px !important;
        /* 移除顶部padding，左侧12px间距，减少底部padding */
        margin: 0 0 20px 0 !important;
        /* 增加底部间隔 */
        width: 100% !important;
        max-width: none !important;
    }

    /* 超小屏幕聊天模式内容区域 */
    .modern-content.chatting {
        padding-top: 76px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    .chat-area {
        padding-bottom: 90px;
        /* 增加底部间距，确保与输入区域有足够间隔 */
        /* 调整底部间距 */
    }


}

.chat-actions {
    flex-direction: row;
    gap: 8px;
}

.new-chat-btn,
.goto-recommendation-btn {
    min-width: 80px;
    max-width: 120px;
    flex-shrink: 0;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
}

html,
body {
    width: 100vw;
    min-height: 100vh;
    overflow-x: hidden !important;
    overflow-y: hidden !important;
}

/* 移除滚动条预留空间 */

:deep(.el-textarea__inner) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    font-size: 1rem !important;
    resize: none !important;
    padding: 0 !important;
}

:deep(.el-input__wrapper) {
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
}

:deep(.el-input__inner) {
    background: transparent !important;
    font-size: 1rem;
}

:deep(.el-dialog) {
    border-radius: 18px;
}

:deep(.el-dialog.preferences-dialog) {
    border-radius: 24px !important;
}

:deep(.el-form-item__content) {
    align-items: center;
}

/* 防止弹窗遮罩层影响页面布局 */

/* 确保Element Plus组件在移动端侧边栏上方显示 */
:deep(.el-message-box) {
    z-index: 15000 !important;
    /* 保持默认定位，确保正确居中 */
}

:deep(.el-message-box__wrapper) {
    z-index: 15000 !important;
    /* 保持默认定位，确保正确居中 */
}

/* Element Plus弹窗全局设置 */
:deep(.el-dialog) {
    z-index: 11000 !important;
}

:deep(.el-dialog__wrapper) {
    z-index: 11000 !important;
}

:deep(.el-overlay) {
    z-index: 501 !important;
}

/* Element Plus下拉菜单 */
:deep(.el-dropdown-menu) {
    z-index: 11150 !important;
}

/* Element Plus日期选择器 */
:deep(.el-date-picker) {
    z-index: 11150 !important;
}

:deep(.el-picker-panel) {
    z-index: 11150 !important;
}

/* Element Plus选择器 */
:deep(.el-select-dropdown) {
    z-index: 11150 !important;
}

/* 高优先级弹窗设置 - 大幅提高z-index确保显示在侧边栏上方 */
:deep(.high-z-index-dialog) {
    z-index: 15000 !important;
}

:deep(.high-z-index-dialog .el-message-box) {
    z-index: 15000 !important;
    /* 保持默认定位，确保正确居中 */
}

:deep(.high-z-index-dialog .el-overlay) {
    z-index: 14999 !important;
}

/* MessageBox全局强制设置 */
:deep(.el-message-box__wrapper) {
    z-index: 15000 !important;
}

:deep(.el-message-box) {
    z-index: 15000 !important;
    /* 移除 position: fixed，保持默认居中定位 */
}

/* 全局MessageBox强制设置 - 使用更具体的选择器 */
:deep(.el-overlay.is-message-box) {
    z-index: 14999 !important;
}

:deep(.el-overlay.is-message-box .el-message-box) {
    z-index: 15000 !important;
    /* 保持默认定位方式，确保居中显示 */
}

/* 针对Element Plus的MessageBox容器 */
:deep(.el-message-box__wrapper.is-message-box) {
    z-index: 15000 !important;
}

/* 确保所有MessageBox相关元素都有最高优先级 */
.el-message-box,
.el-message-box__wrapper,
.el-overlay.is-message-box {
    z-index: 15000 !important;
    /* 移除强制定位，让Element Plus处理默认居中定位 */
}

:deep(.el-overlay) {
    backdrop-filter: blur(2px);
}

:deep(.el-dialog__wrapper) {
    overflow-y: auto;
}

/* 投资偏好设置对话框样式 */
:deep(.preferences-dialog) {
    border-radius: 24px !important;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
    max-height: 90vh;
}

:deep(.preferences-dialog .el-dialog) {
    border-radius: 24px !important;
}

:deep(.el-dialog.preferences-dialog) {
    border-radius: 24px !important;
}

:deep(.preferences-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.preferences-dialog .el-dialog__body) {
    padding: 0;
    overflow-y: auto;
    max-height: calc(90vh - 60px);
}

.preferences-container {
    padding: 40px 32px;
    background: white;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    overflow-x: hidden;
    border-radius: 24px;
}

.preferences-header {
    text-align: center;
    margin-bottom: 40px;
}

.preferences-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.preferences-logo .logo-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.preferences-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #18181b;
}

.preferences-subtitle {
    font-size: 0.875rem;
    margin: 0;
    color: #6b7280;
}

.preferences-form-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 100%;
    margin: 0 auto;
    width: 100%;
}

.step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    padding: 10px 0;
}

.step-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 8px 0;
}

.step-desc {
    font-size: 1rem;
    color: #6b7280;
    margin: 0 0 40px 0;
}

/* 步骤指示器 */
.step-indicator {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
}

.step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid #e5e7eb;
    background: white;
    color: #9ca3af;
}

.step-dot.active {
    border-color: #18181b;
    background: #18181b;
    color: white;
}

.step-dot.completed {
    border-color: #10b981;
    background: #10b981;
    color: white;
}

/* 风险偏好选项 */
.risk-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
}

.risk-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    text-align: left;
    min-height: 280px;
    box-sizing: border-box;
}

.risk-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.risk-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.option-radio {
    flex-shrink: 0;
    margin-top: 2px;
}

.radio-dot {
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    transition: all 0.2s ease;
    position: relative;
}

.radio-dot.checked {
    border-color: #18181b;
    background: #18181b;
}

.radio-dot.checked::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
}

.option-content {
    flex: 1;
}

.option-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.option-title {
    font-weight: 600;
    color: #18181b;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}

.option-icon {
    font-size: 1.2rem;
}

.risk-level-indicator {
    display: flex;
    gap: 3px;
    align-items: center;
}

.risk-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e5e7eb;
    transition: all 0.2s ease;
}

.risk-dot.active {
    background: #ef4444;
}

.option-desc {
    font-size: 0.9rem;
    color: #6b7280;
    line-height: 1.4;
    margin-bottom: 8px;
}

.simple-desc {
    font-size: 0.9rem;
    color: #059669;
    font-weight: 600;
    background: #f0fdf4;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 12px;
    border-left: 3px solid #10b981;
    line-height: 1.3;
}

.option-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.metric-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.metric-label {
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 500;
    flex: 1;
}

.metric-value {
    font-size: 0.85rem;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
}

.metric-value.return {
    color: #059669;
    background: #d1fae5;
}

.metric-value.drawdown {
    color: #dc2626;
    background: #fee2e2;
}

.metric-value.loss {
    color: #dc2626;
    background: #fee2e2;
}

.option-examples {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
}

.examples-label {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
}

.examples-text {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.3;
    display: block;
    margin-top: 2px;
}

/* 投资经验选项 */
.experience-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
}

.experience-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-height: 120px;
    text-align: left;
}

.experience-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.experience-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.experience-content {
    flex: 1;
}

.experience-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.experience-icon {
    font-size: 1.2rem;
}

.experience-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #18181b;
}

.experience-label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
}

.experience-desc {
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.4;
}

/* 用户特征样式 */
.traits-container {
    max-width: 1000px;
    margin: 0 auto;
}

.traits-hint {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 32px;
}

.hint-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.hint-text {
    font-size: 0.9rem;
    color: #0c4a6e;
    line-height: 1.4;
}

.traits-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 800px;
    margin: 0 auto;
}

.trait-item-compact {
    border: 2px solid #f3f4f6;
    border-radius: 12px;
    padding: 20px;
    background: #fafafa;
    transition: all 0.2s ease;
}

.trait-item-compact:hover {
    border-color: #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.trait-header-compact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.trait-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.trait-icon {
    font-size: 1.3rem;
    flex-shrink: 0;
}

.trait-info {
    flex: 1;
}

.trait-title {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
}

.trait-desc {
    font-size: 0.85rem;
    color: #6b7280;
    line-height: 1.3;
}

.trait-current-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #18181b;
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 20px;
    padding: 4px 12px;
    min-width: 50px;
    text-align: center;
}

.trait-slider-container {
    position: relative;
    margin-bottom: 15px;
    height: 50px;
}

.slider-track {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    position: relative;
    margin: 20px 0;
}

.slider-progress {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #0ea5e9 50%, #8b5cf6 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.slider-options {
    display: flex;
    justify-content: space-between;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
}

.slider-option {
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.option-dot {
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: -5px;
    transition: all 0.2s ease;
    z-index: 2;
}

.slider-option:hover .option-dot {
    border-color: #18181b;
    transform: scale(1.1);
}

.slider-option.active .option-dot {
    border-color: #18181b;
    background: #18181b;
    transform: scale(1.2);
}

.option-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    position: absolute;
    top: 20px;
    white-space: nowrap;
    transition: color 0.2s ease;
}

.slider-option.active .option-label {
    color: #18181b;
}

.trait-description {
    font-size: 0.85rem;
    color: #4b5563;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    font-style: italic;
}

/* 紧凑的左右分栏板块选择布局 */
.sectors-container-compact {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

/* 顶部搜索和统计栏 */
.sectors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}

.search-section {
    flex: 1;
    max-width: 300px;
}

:deep(.compact-search .el-input__wrapper) {
    border-radius: 8px !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
}

:deep(.compact-search .el-input__wrapper:hover) {
    border-color: #9ca3af !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.compact-search.is-focus .el-input__wrapper) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

:deep(.compact-search .el-input__inner::placeholder) {
    color: #c1c7cd !important;
    font-size: 0.8rem !important;
    font-weight: 400 !important;
    opacity: 0.75 !important;
}

.stats-section {
    display: flex;
    gap: 8px;
}

.stat-chip {
    font-size: 0.75rem;
    color: #059669;
    font-weight: 600;
    background: #d1fae5;
    padding: 4px 10px;
    border-radius: 16px;
    white-space: nowrap;
}

/* 主要内容区域 */
.sectors-content {
    min-height: 320px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: white;
    overflow: hidden;
}

/* 搜索模式 */
.search-mode {
    padding: 16px;
}

.search-header {
    background: #3b82f6;
    color: white;
    padding: 8px 12px;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    margin-bottom: 12px;
}

.search-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
}

.sector-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
}

.sector-card:hover:not(.disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sector-card.selected {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.sector-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.card-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
    width: 32px;
    text-align: center;
}

.card-content {
    flex: 1;
    min-width: 0;
}

.card-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
    line-height: 1.3;
}

.card-desc {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    margin-bottom: 2px;
}

.card-parent {
    font-size: 0.7rem;
    color: #9ca3af;
    background: rgba(107, 114, 128, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
    display: inline-block;
}

.card-check {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
}

/* 无搜索结果 */
.no-results {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.no-results-content {
    text-align: center;
    color: #6b7280;
}

.no-results-icon {
    font-size: 2rem;
    margin-bottom: 8px;
    opacity: 0.6;
}

.no-results-text {
    font-size: 0.875rem;
}

/* 正常模式：左右分栏 */
.normal-layout {
    display: flex;
    height: 320px;
}

/* 左侧：大分类 */
.left-section {
    width: 40%;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    margin: 0;
}

.major-grid {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    align-content: start;
}

.major-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    position: relative;
}

.major-card:hover:not(.disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.major-card.selected {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.major-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.major-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    width: 36px;
    text-align: center;
}

.major-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    line-height: 1.3;
}

.major-check {
    width: 18px;
    height: 18px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    flex-shrink: 0;
}

/* 右侧：细分行业 */
.right-section {
    width: 60%;
    display: flex;
    flex-direction: column;
}

.sub-grid {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
}

.sub-group {
    margin-bottom: 16px;
}

.sub-group:last-child {
    margin-bottom: 0;
}

.group-header {
    font-size: 0.75rem;
    font-weight: 600;
    color: #3730a3;
    background: #e0e7ff;
    padding: 6px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
}

.sub-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
}

.sub-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    text-align: center;
    position: relative;
    min-height: 60px;
}

.sub-card:hover:not(.disabled) {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.sub-card.selected {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.sub-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sub-icon {
    font-size: 1rem;
    line-height: 1;
}

.sub-name {
    font-size: 0.75rem;
    font-weight: 500;
    color: #18181b;
    line-height: 1.2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sub-check {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 14px;
    height: 14px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
    border: 2px solid white;
}

/* 提示信息 */
.selection-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    background: #fef3c7;
    color: #92400e;
    text-align: center;
}

.hint-icon {
    font-size: 2rem;
    margin-bottom: 8px;
}

.hint-text {
    font-size: 0.875rem;
    line-height: 1.4;
}

/* 自定义滚动条 */
.major-grid::-webkit-scrollbar,
.sub-grid::-webkit-scrollbar {
    width: 4px;
}

.major-grid::-webkit-scrollbar-track,
.sub-grid::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.major-grid::-webkit-scrollbar-thumb,
.sub-grid::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
    transition: background 0.2s ease;
}

.major-grid::-webkit-scrollbar-thumb:hover,
.sub-grid::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* 搜索高亮 */
.search-highlight {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* 老的样式保留（防止其他地方使用） */
.sectors-container {
    max-width: 1100px;
    margin: 0 auto;
}

/* 搜索功能样式 */
.sector-search-container {
    margin-bottom: 16px;
    padding: 12px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.6);
    border-radius: 8px;
    backdrop-filter: blur(4px);
}

.sector-search-input {
    margin-bottom: 6px;
}

:deep(.sector-search-input .el-input__wrapper) {
    border-radius: 8px !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
}

:deep(.sector-search-input .el-input__wrapper:hover) {
    border-color: #9ca3af !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.sector-search-input.is-focus .el-input__wrapper) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

.search-results-hint {
    font-size: 0.875rem;
    color: #059669;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.search-results-hint::before {
    content: '✓';
    font-weight: 600;
}

.search-no-results {
    font-size: 0.875rem;
    color: #dc2626;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.search-no-results::before {
    content: '!';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
}

/* 搜索结果高亮 */
.search-highlight {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
}

/* 搜索结果组样式 */
.search-results-group {
    border: 1px solid #3b82f6;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.02);
}

.search-group-title {
    background: #3b82f6;
    color: white;
    margin: -1px -1px 10px -1px;
    padding: 8px 12px;
    border-radius: 7px 7px 0 0;
    font-size: 0.85rem;
}

/* 搜索匹配项样式增强 */
.sub-sector-option.search-match {
    border: 1px solid #e0e7ff;
    background: rgba(245, 247, 255, 0.8);
}

.sub-sector-option.search-match:hover {
    border-color: #c7d2fe;
    background: rgba(238, 242, 255, 0.9);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.sub-sector-option.search-match.selected {
    border-color: #3b82f6;
    background: rgba(219, 234, 254, 0.8);
}

/* 搜索结果中显示所属大分类 */
.sub-sector-parent {
    font-size: 0.65rem;
    color: #6b7280;
    margin-top: 3px;
    padding: 1px 4px;
    background: rgba(107, 114, 128, 0.1);
    border-radius: 3px;
    display: inline-block;
    line-height: 1.2;
}

.sectors-layout {
    display: flex;
    gap: 24px;
    min-height: 480px;
    max-height: 580px;
}

.left-panel {
    flex: 0 0 400px;
    background: #fafbfc;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
}

.right-panel {
    flex: 1;
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.sector-section {
    margin-bottom: 32px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;
}

.section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
}

.section-icon {
    font-size: 1.2rem;
}

.section-limit {
    font-size: 0.85rem;
    color: #6b7280;
    font-weight: 400;
}

.section-counter {
    font-size: 0.9rem;
    color: #059669;
    font-weight: 600;
    background: #d1fae5;
    padding: 4px 12px;
    border-radius: 20px;
}

/* 大分类样式 */
.major-sectors-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.major-sector-option {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    position: relative;
    background: white;
}

.major-sector-option:hover:not(.disabled) {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.major-sector-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.major-sector-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sector-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.sector-content {
    flex: 1;
}

.sector-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 4px;
}

.sector-desc {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.4;
}

.sector-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
}

/* 小分类样式 */
.sub-sectors-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
}

/* 自定义滚动条样式 */
.sub-sectors-container::-webkit-scrollbar {
    width: 6px;
}

.sub-sectors-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
}

.sub-sectors-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    transition: background 0.2s ease;
}

.sub-sectors-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

.sub-sector-group {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    background: #fafbfc;
}

.group-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.group-icon {
    font-size: 1.2rem;
}

.sub-sectors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.sub-sector-option {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 10px;
    transition: all 0.2s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    position: relative;
    background: white;
    min-height: 85px;
}

.sub-sector-option:hover:not(.disabled) {
    border-color: #d1d5db;
    background: #f9fafb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sub-sector-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 2px 8px rgba(24, 24, 27, 0.1);
}

.sub-sector-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sub-sector-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.sub-sector-content {
    flex: 1;
}

.sub-sector-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 3px;
    line-height: 1.2;
}

.sub-sector-desc {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
    margin-bottom: 3px;
}

.sub-sector-examples {
    font-size: 0.7rem;
    color: #9ca3af;
    font-style: italic;
    line-height: 1.2;
}

.sub-sector-check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 18px;
    height: 18px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
}

/* 选择提示 */
.sectors-hint {
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 20px;
}

.sectors-hint .hint-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 2px;
}

.sectors-hint .hint-text {
    color: #92400e;
    font-size: 0.9rem;
    line-height: 1.4;
}

.preferences-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: auto;
    padding-top: 40px;
    border-top: 1px solid #f3f4f6;
}

.preferences-back-btn,
.preferences-next-btn,
.preferences-submit-btn {
    height: 48px;
    padding: 0 32px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
    border: none;
}

.preferences-back-btn {
    background: #f3f4f6;
    color: #6b7280;
}

.preferences-back-btn:hover {
    background: #e5e7eb;
    color: #374151;
}

.preferences-next-btn,
.preferences-submit-btn {
    background: #18181b;
    color: white;
}

.preferences-next-btn:hover,
.preferences-submit-btn:hover {
    background: #000000;
}

.preferences-next-btn:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
}

.preferences-skip-btn {
    height: 48px;
    padding: 0 24px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.preferences-skip-btn:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    color: #374151;
}

/* 响应式布局 */
@include mobile {
    .preferences-dialog {
        width: 95vw !important;
        max-width: none !important;
        margin: 5vh auto !important;
    }

    .risk-options {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 0 8px;
    }

    .risk-option {
        min-height: auto;
        padding: 16px;
        gap: 12px;
    }

    .preferences-container {
        padding: 24px 16px;
    }

    .option-title {
        font-size: 1rem;
    }

    .experience-options {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .experience-option {
        min-height: auto;
        padding: 16px;
        gap: 12px;
    }

    .experience-title {
        font-size: 1rem;
    }

    .experience-label {
        font-size: 0.9rem;
    }

    .experience-desc {
        font-size: 0.8rem;
    }

    .traits-list {
        gap: 16px;
        max-width: 100%;
    }

    .trait-item-compact {
        padding: 16px;
    }

    .trait-header-compact {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
    }

    .trait-left {
        gap: 8px;
    }

    .trait-title {
        font-size: 0.95rem;
    }

    .trait-desc {
        font-size: 0.8rem;
    }

    .trait-current-value {
        font-size: 1rem;
        padding: 3px 10px;
        align-self: flex-end;
    }

    .slider-track {
        margin: 16px 0;
    }

    .option-label {
        font-size: 0.7rem;
        top: 18px;
    }

    .trait-description {
        font-size: 0.8rem;
        padding: 10px;
    }

    .simple-desc {
        font-size: 0.85rem;
        padding: 8px 10px;
    }

    .metric-label {
        font-size: 0.8rem;
    }

    .metric-value {
        font-size: 0.8rem;
        padding: 3px 6px;
    }

    .sectors-layout {
        flex-direction: column;
        gap: 16px;
        min-height: auto;
    }

    .left-panel {
        flex: none;
    }

    .right-panel {
        min-height: auto;
    }

    .major-sectors-list {
        gap: 8px;
    }

    .major-sector-option {
        padding: 12px;
        gap: 10px;
    }

    .sector-icon {
        font-size: 1.3rem;
    }

    .sub-sectors-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .sub-sector-option {
        padding: 12px;
        gap: 8px;
    }
}

@include desktop-md {
    .preferences-dialog {
        width: 90vw !important;
        max-width: 1200px !important;
    }
}

@include desktop-sm {
    .risk-options {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        max-width: 960px;
    }

    .preferences-dialog {
        width: 95vw !important;
        max-width: 1000px !important;
    }
}

/* 引导提示样式 */
.guide-tip {
    position: fixed;
    top: 80px;
    right: 32px;
    z-index: 1000;
    animation: slideInRight 0.3s ease-out;
}

.guide-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
    padding: 20px;
    max-width: 280px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.guide-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.guide-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.guide-title {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.guide-text {
    margin: 0;
}

.guide-text p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}

.guide-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}







.stock-tags {
    display: flex;
    gap: 6px;
}

.tag-item {
    font-size: 11px;
    background: rgba(59, 130, 246, 0.3);
    color: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 10px;
    font-weight: 500;
    border: 1px solid rgba(59, 130, 246, 0.4);
}

.stock-price-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.price-main {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.buy-dialog-current-price {
    font-size: 36px;
    font-weight: 800;
    color: #ffffff;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    letter-spacing: -0.8px;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
}

.price-change-group {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.price-change-group.up {
    color: #10b981;
}

.price-change-group.down {
    color: #ef4444;
}

.change-amount {
    font-size: 18px;
    font-weight: 700;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.change-percent {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.9;
}

.price-stats {
    display: flex;
    gap: 20px;
    align-items: flex-end;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.stat-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
}

.stat-value {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

/* 右侧操作区域 */
.header-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
}

.market-status-card {
    background: rgba(255, 255, 255, 0.12);
    padding: 12px 16px;
    border-radius: 16px;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
    min-width: 120px;
}

.status-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #ffffff;
}

.trading-time {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-btn.favorite-btn {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 12px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.action-btn.favorite-btn:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    color: white !important;
    transform: translateY(-1px);
}

.action-btn.favorite-btn.favorited {
    background: rgba(16, 185, 129, 0.2) !important;
    border: 1px solid rgba(16, 185, 129, 0.4) !important;
    color: #10b981 !important;
}

.action-btn.favorite-btn.favorited:hover {
    background: rgba(239, 68, 68, 0.2) !important;
    border-color: rgba(239, 68, 68, 0.4) !important;
    color: #ef4444 !important;
    transform: translateY(-1px);
}

.close-btn {
    background: rgba(255, 255, 255, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.25) !important;
    color: white !important;
    width: 36px !important;
    height: 36px !important;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.25) !important;
    border-color: rgba(255, 255, 255, 0.4) !important;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 底部信息栏 */
.header-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 28px;
    background: rgba(0, 0, 0, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
}

.info-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.95);
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.info-value.up {
    color: #10b981;
}

.info-value.down {
    color: #ef4444;
}

.status-dot {
    width: 10px;
    height: 10px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse-dot 2s infinite;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
}

@keyframes pulse-dot {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}

/* 主要内容区域 - 左右布局 */
.trading-main-content {
    display: flex;
    gap: 16px;
    padding: 16px;
    min-height: 500px;
}

.left-panel {
    flex: 0 0 340px;
    min-width: 340px;
}

.right-panel {
    flex: 1;
    min-width: 400px;
}

/* 五档行情 */
.market-depth {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    height: fit-content;
}

.depth-header {
    background: #f5f7fa;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    border-bottom: 1px solid #ebeef5;
    font-size: 14px;
}

.refresh-time {
    font-size: 12px;
    color: #909399;
    font-weight: normal;
}

.depth-content {
    padding: 0;
}

.depth-table {
    width: 100%;
}

.table-header {
    display: grid;
    grid-template-columns: 50px 1fr 100px;
    padding: 8px 16px;
    background: #fafafa;
    font-size: 12px;
    color: #666;
    font-weight: 500;
    border-bottom: 1px solid #eee;
}

.col-label {
    text-align: left;
}

.col-price {
    text-align: center;
}

.col-volume {
    text-align: right;
}

.order-row {
    display: grid;
    grid-template-columns: 50px 1fr 100px;
    padding: 6px 16px;
    font-size: 13px;
    border-bottom: 1px solid #f8f8f8;
    transition: background-color 0.2s;
}

.order-row:hover {
    background: #f0f0f0;
}

.order-row:last-child {
    border-bottom: none;
}

.order-row.sell {
    background: rgba(245, 108, 108, 0.03);
}

.order-row.buy {
    background: rgba(103, 194, 58, 0.03);
}

.order-label {
    color: #666;
    font-weight: 500;
    font-size: 12px;
}

.order-price {
    text-align: center;
    font-weight: 600;
    font-family: 'Courier New', monospace;
}

.sell .order-price {
    color: #f56c6c;
}

.buy .order-price {
    color: #67c23a;
}

.order-volume {
    text-align: right;
    color: #999;
    font-size: 12px;
}

.current-price-row {
    display: grid;
    grid-template-columns: 50px 1fr 100px;
    padding: 10px 16px;
    background: #f0f2f5;
    font-weight: 600;
    border-top: 2px solid #409eff;
    border-bottom: 2px solid #409eff;
    margin: 2px 0;
}

.current-label {
    color: #606266;
    font-size: 12px;
}

.current-value {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
}

.current-value.up {
    color: #67c23a;
}

.current-value.down {
    color: #f56c6c;
}

.current-change {
    text-align: right;
    font-size: 12px;
    font-weight: 500;
}

/* 交易面板 */
.trading-panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    height: fit-content;
}

.panel-tabs {
    display: flex;
    background: #f5f7fa;
    border-bottom: 1px solid #ebeef5;
}

.tab-item {
    flex: 1;
    padding: 8px 4px;
    text-align: center;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
    border-right: 1px solid #ebeef5;
}

.tab-item:last-child {
    border-right: none;
}

.tab-item.active {
    background: #e74c3c;
    color: white;
}

.tab-item.disabled {
    color: #c0c4cc;
    cursor: not-allowed;
}

.trading-form {
    padding: 16px;
}

/* 委托类型选择 */
.order-type-section {
    margin-bottom: 16px;
}

.order-type-select {
    width: 100%;
}

.order-type-select :deep(.el-input__wrapper) {
    height: 36px;
}

/* 价格输入区域 */
.price-section {
    margin-bottom: 16px;
}

.input-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.input-label {
    width: 70px;
    font-size: 13px;
    color: #666;
    flex-shrink: 0;
}

.price-input-group {
    flex: 1 !important;
    display: flex !important;
    gap: 6px !important;
    align-items: stretch !important;
    height: 36px !important;
}

.price-input {
    flex: 1 !important;
    height: 36px !important;
}

.price-input :deep(.el-input__wrapper) {
    height: 36px !important;
}

.price-controls {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    height: 36px !important;
    width: 28px !important;
    justify-content: center !important;
    align-items: center !important;
}

.price-btn {
    width: 28px !important;
    height: 17px !important;
    padding: 0 !important;
    font-size: 12px !important;
    line-height: 1 !important;
    min-height: auto !important;
    border-radius: 2px !important;
    margin: 0 !important;
    border: 1px solid #dcdfe6 !important;
}

.price-btn:first-child {
    margin-bottom: 0 !important;
}

.price-btn:last-child {
    margin-top: 0 !important;
}

/* 数量输入区域 */
.quantity-section {
    margin-bottom: 16px;
}

.quantity-input-group {
    flex: 1;
}

.quantity-input {
    width: 100%;
}

.quantity-input :deep(.el-input__wrapper) {
    height: 36px;
}

.quantity-shortcuts {
    display: flex;
    gap: 4px;
    margin-top: 8px;
}

.quantity-shortcuts .el-button {
    flex: 1;
    font-size: 12px;
    padding: 4px 8px;
}

/* 可买信息 */
.available-info {
    margin-bottom: 16px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
}

.info-row .label {
    color: #666;
}

.info-row .value {
    color: #333;
    font-weight: 500;
}

/* 交易预览 */
.trade-summary {
    margin-bottom: 16px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
}

.summary-row .label {
    color: #666;
}

.summary-row .value {
    color: #333;
    font-weight: 500;
}

/* 买入按钮 */
.action-section {
    margin-bottom: 16px;
}

.buy-action-btn {
    width: 100%;
    height: 40px;
    font-size: 16px;
    font-weight: 600;
}

/* 账户信息 */
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

/* 响应式设计 */
@include mobile {
    .trading-main-content {
        flex-direction: column;
        gap: 12px;
        padding: 12px;
    }

    .left-panel,
    .right-panel {
        min-width: auto;
    }

    .tab-item {
        padding: 6px 2px;
        font-size: 12px;
    }

    .trading-form {
        padding: 12px;
    }

    .input-label {
        width: 60px;
        font-size: 12px;
    }

    .quantity-shortcuts .el-button {
        font-size: 11px;
        padding: 2px 4px;
    }
}



/* 底部按钮 */
.trading-footer {
    display: flex;
    justify-content: center;
    padding: 16px;
    background: white;
    border-top: 1px solid #ebeef5;
}

.cancel-btn {
    min-width: 100px;
}

/* 付费服务确认对话框样式 */
:deep(.paid-service-dialog) {
    border-radius: 12px;
    overflow: hidden;
}

:deep(.paid-service-dialog .el-message-box__header) {
    background: #fef3c7;
    border-bottom: 1px solid #fbbf24;
    padding: 20px 24px 16px 24px;
}

:deep(.paid-service-dialog .el-message-box__title) {
    color: #92400e;
    font-weight: 600;
    font-size: 1.1rem;
}

:deep(.paid-service-dialog .el-message-box__content) {
    padding: 20px 24px;
    background: white;
}

:deep(.paid-service-dialog .el-message-box__message) {
    color: #374151;
    font-size: 0.95rem;
    line-height: 1.5;
}

:deep(.paid-service-dialog .el-message-box__btns) {
    padding: 16px 24px 20px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

:deep(.paid-service-dialog .el-button--primary) {
    background: #f59e0b;
    border-color: #f59e0b;
    color: white;
    font-weight: 500;
}

:deep(.paid-service-dialog .el-button--primary:hover) {
    background: #d97706;
    border-color: #d97706;
}

/* 账户Tab样式 */
.account-tabs {
    margin-top: 16px;
}

.tab-nav {
    display: flex;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 16px;
}

.tab-item {
    flex: 1;
    padding: 10px 16px;
    text-align: center;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
}

.tab-item.active {
    background: white;
    color: #1f2937;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-weight: 600;
}

.tab-item:hover:not(.active) {
    background: rgba(255, 255, 255, 0.5);
    color: #374151;
}

.tab-content {
    min-height: 50px;
    overflow: visible;
    margin-bottom: 0;
}

.tab-panel {
    animation: fadeIn 0.3s ease;
    overflow: visible;
    margin-bottom: 0;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 持仓卡片样式 */
.portfolio-cards {
    display: grid;
    gap: 16px;
}

.portfolio-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
}

.portfolio-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
}

.portfolio-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.portfolio-card .stock-info h4.stock-name {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
}

.portfolio-card .stock-code {
    font-size: 12px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 8px;
}

.portfolio-card .stock-industry {
    font-size: 12px;
    color: #9ca3af;
}

.portfolio-card .profit-info {
    text-align: right;
}

.portfolio-card .profit-percent {
    font-size: 16px;
    font-weight: 600;
    display: block;
    margin-bottom: 2px;
}

.portfolio-card .profit-amount {
    font-size: 14px;
    font-weight: 500;
}

.portfolio-card .profit-info.profit {
    color: #dc2626;
}

.portfolio-card .profit-info.loss {
    color: #16a34a;
}

.data-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 6px;
}

.data-item .label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
}

.data-item .value {
    font-size: 13px;
    color: #1f2937;
    font-weight: 600;
}

.card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.card-actions .el-button {
    padding: 6px 16px;
    font-size: 13px;
}

.sell-btn {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
}

.sell-btn:hover {
    background: #b91c1c;
    border-color: #b91c1c;
}

.analysis-btn {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
}

.analysis-btn:hover {
    background: #2563eb;
    border-color: #2563eb;
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

.remove-btn {
    background: #6b7280;
    border-color: #6b7280;
    color: white;
}

.remove-btn:hover {
    background: #4b5563;
    border-color: #4b5563;
}

/* 空状态样式 */
.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
}

.empty-state .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-state h4 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-state p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}


/* 设置提醒按钮样式（与其他股票操作按钮保持一致） */
.reminder-btn-small {
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
    background: #e0e7ff;
    border-color: #a5b4fc;
    color: #3730a3;
}

.reminder-btn-small:hover {
    background: #c7d2fe;
    border-color: #8b5cf6;
    color: #312e81;
    transform: translateY(-1px);
}

.reminder-count-badge-small {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 10px;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 响应式设计 */
@include mobile {
    .account-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    /* 移动端总资产卡片优化 */
    .total-asset-card {
        padding: 20px 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .total-asset-card::before {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    }

    .amount-label {
        font-size: 0.9rem;
        margin-bottom: 6px;
    }

    .amount-value {
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 8px;
    }

    .asset-change {
        font-size: 1rem;
        gap: 6px;
    }

    .change-label {
        font-size: 0.85rem;
    }

    /* 移动端统计卡片网格优化 */
    .overview-stats.watchlist-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 12px;
    }

    .overview-stats.asset-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 12px;
    }

    .stat-item {
        padding: 14px 10px;
        gap: 8px;
        min-height: 85px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .stat-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    .stat-item:active {
        transform: scale(0.98);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .stat-item:active::before {
        opacity: 1;
    }

    .stat-item:hover {
        transform: none;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
        font-size: 1.4rem;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        margin-bottom: 4px;
    }

    .stat-icon.cash {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    }

    .stat-icon.portfolio {
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .stat-icon.stocks {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .stat-icon.watchlist {
        background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
    }

    .stat-label {
        font-size: 0.75rem;
        color: #64748b !important;
        margin-bottom: 3px;
        font-weight: 600;
        line-height: 1.2;
    }

    .stat-value {
        font-size: 1.1rem;
        font-weight: 800;
        color: #1e293b !important;
        line-height: 1.1;
    }

    .data-grid {
        grid-template-columns: 1fr;
    }

    .watchlist-cards {
        grid-template-columns: 1fr;
    }

    .tab-item {
        padding: 8px 12px;
        font-size: 13px;
    }

    .portfolio-card,
    .watchlist-card {
        padding: 16px;
    }

    .stock-account-container {
        padding: 16px;
    }

    .account-title {
        font-size: 1.25rem;
    }

    .amount-value {
        font-size: 2rem;
    }

    /* 移动端空状态优化 */
    .empty-state {
        padding: 30px 20px;
    }

    .empty-state .empty-icon {
        font-size: 36px;
        margin-bottom: 12px;
    }

    .empty-state h4 {
        font-size: 16px;
        margin: 0 0 6px 0;
    }

    .empty-state p {
        font-size: 13px;
    }
}

@include mobile-sm {

    /* 超小屏幕总资产卡片进一步优化 */
    .total-asset-card {
        padding: 18px 14px;
        margin-bottom: 14px;
    }

    .amount-label {
        font-size: 0.85rem;
        margin-bottom: 5px;
    }

    .amount-value {
        font-size: 2rem;
        margin-bottom: 6px;
    }

    .asset-change {
        font-size: 0.95rem;
        gap: 5px;
    }

    .change-label {
        font-size: 0.8rem;
    }

    /* 超小屏幕统计卡片紧凑布局 */
    .overview-stats.watchlist-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
        margin-top: 10px;
    }

    .overview-stats.asset-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        margin-top: 10px;
    }

    .stat-item {
        padding: 8px 6px;
        min-height: 60px;
        flex-direction: column;
        text-align: center;
        gap: 4px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .stat-item:active {
        transform: scale(0.99);
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
        font-size: 1.1rem;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-bottom: 2px;
    }

    .stat-info {
        align-items: center;
        text-align: center;
        flex: 1;
    }

    .stat-label {
        font-size: 0.65rem;
        margin-bottom: 1px;
        text-align: center;
        font-weight: 600;
        line-height: 1.1;
    }

    .stat-value {
        font-size: 0.9rem;
        font-weight: 800;
        text-align: center;
        line-height: 1.1;
    }

    /* 超小屏幕主内容区域间距进一步优化 */
    .modern-content {
        padding-top: 100px;
        /* 进一步增加顶部间距 */
        padding-left: 16px;
        padding-right: 16px;
    }

    /* 超小屏幕字体进一步优化 */
    .modern-title {
        font-size: 1.75rem;
        margin-bottom: 20px;
        /* 增加标题下方间距 */
    }

    .modern-desc {
        font-size: 0.85rem;
        padding: 0 12px;
        margin-bottom: 28px;
        /* 增加描述下方间距 */
        line-height: 1.7;
        /* 进一步增加行高 */
    }

    /* 超小屏幕欢迎区域间距优化 */
    .welcome-section {
        margin-bottom: 28px;
        padding-top: 24px;
        /* 增加欢迎区域上方间距 */
    }

    /* 超小屏幕滚动条进一步优化 */
    .chat-history-area::-webkit-scrollbar {
        width: 3px;
        /* 超小屏幕更细的滚动条 */
    }

    .chat-history-area::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.25) !important;
        /* 稍微加深一点 */
    }

    .chat-message.user .chat-message-content,
    .chat-message.assistant .chat-message-content {
        font-size: 0.85rem;
        padding: 10px 14px;
    }

    .stock-name {
        font-size: 0.85rem;
    }

    .stock-code {
        font-size: 0.7rem;
    }

    /* 超小屏幕空状态进一步优化 */
    .empty-state {
        padding: 20px 16px;
        margin-bottom: 0;
    }

    .empty-state .empty-icon {
        font-size: 32px;
        margin-bottom: 10px;
    }

    .empty-state h4 {
        font-size: 15px;
        margin: 0 0 5px 0;
    }

    .empty-state p {
        font-size: 12px;
        line-height: 1.4;
    }

    /* 移动端资产容器优化 */
    .tab-content {
        min-height: 10px;
        margin-bottom: 0;
    }

    .tab-panel {
        margin-bottom: 0;
    }
}



@include mobile {

    /* 移动端资产容器优化 */
    .tab-content {
        min-height: 20px;
        margin-bottom: 0;
    }

    .tab-panel {
        margin-bottom: 0;
    }

    .empty-state {
        padding: 25px 16px;
        margin-bottom: 0;
    }



    /* 移动端浏览器环境下欢迎区域优化 - 仅在主界面模式下整体上移避免与输入框重叠 */
    body:not(.wechat-browser) .modern-content:not(.chatting) .welcome-section {
        transform: translateY(-40px) !important;
        /* 非微信环境下，仅在主界面模式下让欢迎区域整体上移40px */
        margin-bottom: 0px !important;
        /* 重置底部间距，避免挤压输入框 */
        transition: transform 0.3s ease !important;
        /* 添加平滑过渡效果 */
    }

    /* iOS设备下的欢迎区域特殊处理 - 仅主界面模式 */
    @supports (-webkit-touch-callout: none) {
        body:not(.wechat-browser) .modern-content:not(.chatting) .welcome-section {
            transform: translateY(-10px) !important;
            /* iOS设备需要上移更多 */
        }
    }

    /* Android Chrome浏览器下的欢迎区域处理 - 仅主界面模式 */
    @supports (-webkit-appearance: none) and (not (-webkit-touch-callout: none)) {
        body:not(.wechat-browser) .modern-content:not(.chatting) .welcome-section {
            transform: translateY(-10px) !important;
            /* Android Chrome需要中等上移距离 */
        }
    }



    /* 微信环境下欢迎区域优化 */
    body.wechat-browser .welcome-section {
        margin-bottom: 12px !important;
        /* 微信环境下减少欢迎区域底部间距 */
        flex-shrink: 0 !important;
        /* 微信环境下防止欢迎区域被压缩 */
    }



    /* 微信环境下确保center-container合理布局 */
    body.wechat-browser .center-container {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        /* 微信环境下移除底部间距，让AI卡片完全贴底 */
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        /* 微信环境下从顶部开始布局，避免快捷示例被挤压 */
        min-height: 0 !important;
        /* 微信环境下允许收缩 */
        max-height: none !important;
        /* 移除最大高度限制，避免内容被压缩导致输入框位置异常 */
        overflow-y: visible !important;
        /* 允许内容自然展示 */
    }



    /* 微信环境下确保整个页面容器贴底 */
    body.wechat-browser .app-container {
        height: calc(var(--vh, 1vh) * 100) !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    }

    /* 微信环境下防止触发前后导航工具栏 */
    body.wechat-browser {
        overscroll-behavior: none !important;
        -webkit-overflow-scrolling: auto !important;
        overflow-x: hidden !important;
        position: fixed !important;
        /* 强制隐藏微信底部工具栏 */
        height: calc(var(--vh, 1vh) * 100) !important;
        max-height: calc(var(--vh, 1vh) * 100) !important;
        overflow: hidden !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        left: 0 !important;
        top: 0 !important;
        /* 确保完全覆盖微信界面 */
        z-index: 0 !important;
    }

    /* 微信环境下主容器优化 */
    body.wechat-browser .main-modern {
        height: calc(var(--vh, 1vh) * 100) !important;
        overflow: hidden !important;
        position: fixed !important;
        /* 微信环境下占满全宽，消除两边空白 */
        width: 100vw !important;
        max-width: 100vw !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
    }

    /* 微信环境下主内容区域优化 */
    body.wechat-browser .modern-content {
        height: calc(var(--vh, 1vh) * 100) !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        position: relative !important;
        max-width: 100vw !important;
        /* 微信环境下占满全宽，消除两边空白 */
        width: 100vw !important;
        padding: 76px 0 0 0 !important;
        margin: 0 !important;
        left: 0 !important;
        right: 0 !important;
        box-sizing: border-box !important;
        /* 添加滚动边界控制 */
        overscroll-behavior: contain !important;
    }

    /* 微信环境下键盘弹起时的布局调整 */
    body.wechat-browser.keyboard-open .app-container {
        height: calc(var(--keyboard-vh, 1vh) * 100) !important;
    }

    body.wechat-browser.keyboard-open .main-modern {
        height: calc(var(--keyboard-vh, 1vh) * 100) !important;
    }

    body.wechat-browser.keyboard-open .modern-content {
        height: calc(var(--keyboard-vh, 1vh) * 100) !important;
    }

    /* 微信环境下键盘弹起时欢迎区域上移 */
    body.wechat-browser.keyboard-open .welcome-section {
        transform: translateY(-20px) !important;
        transition: transform 0.3s ease !important;
    }

    /* 微信环境下键盘弹起时中心容器调整 */
    body.wechat-browser.keyboard-open .center-container {
        padding-bottom: 10px !important;
        transition: padding 0.3s ease !important;
    }

    body.wechat-browser .main-modern,
    body.wechat-browser .modern-content,
    body.wechat-browser .center-container,
    body.wechat-browser .welcome-section {
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
    }

    /* WelcomeGuestHeader在微信环境下保持组件内部的宽度控制 */
    body.wechat-browser .welcome-guest-header {
        width: auto !important;
        max-width: none !important;
        margin: 0 8px 20px 8px !important;
        /* 与微信环境下的内边距保持一致 */
    }

    /* 微信环境下主页内容区域设置适当内边距 */
    body.wechat-browser .modern-content:not(.chatting) {
        padding: 0 8px;
        /* 微信环境下增加底部空间 */
    }

    /* 微信环境下聊天模式无内边距，占满全宽 */
    body.wechat-browser .modern-content.chatting {
        padding-left: 0;
        padding-right: 0;
    }

    body.wechat-browser .modern-content:not(.chatting) .ai-card {
        bottom: 0;
        /* 微信环境下贴底显示 */
    }

    /* 微信环境下聊天模式新建聊天按钮区域间隔优化 */
    body.wechat-browser .new-chat-section {
        margin-bottom: 12px;
    }

    /* 微信环境下输入框使用固定定位 */
    body.wechat-browser .input-area,
    body.wechat-browser .home-input-area {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 1000 !important;
        box-sizing: border-box !important;
    }

    /* 微信环境下键盘弹起时整个输入区域容器向上移动 */
    body.wechat-browser.keyboard-open .input-area,
    body.wechat-browser.keyboard-open .home-input-area {
        bottom: 0 !important;
        /* 键盘弹起时，整个容器向上移动，减少与键盘的间距 */
        transition: bottom 0.3s ease !important;
    }

    /* 微信环境下主页快捷操作按钮在容器内部使用相对定位 */
    body.wechat-browser .mobile-home-shortcuts-wrapper {
        position: relative !important;
        margin-bottom: 40px !important;
        /* 与输入框保持40px的固定间距，减少初始间隔 */
        z-index: 999 !important;
    }

    body.wechat-browser .mobile-home-shortcuts {
        padding: 8px;
        /* 微信环境下减少左右内边距 */

    }

    /* 微信环境下键盘弹起时整个输入区域容器向上移动 */
    body.wechat-browser.keyboard-open .mobile-home-shortcuts-wrapper {
        position: relative !important;
        margin-bottom: 0 !important;
    }
}

/* ========== 移动端布局样式重构 ========== */
@include mobile {

    /* 1. 基础容器 - 全宽无边距 */
    .main-modern {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
    }

    .modern-content {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 76px 0 0 0;
        /* 顶部导航栏高度 */
    }

    .center-container {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
    }

    .chat-area {
        padding-top: 100px;
    }

    /* 2. 欢迎区域 - 内容有内边距，容器无边距 */
    .welcome-section {
        width: 100%;
        max-width: 100%;
        margin: 0 0 20px 0;
        padding: 0;
    }

    .welcome-guest-header {
        margin: 0 0 20px 0;
        /* 移动端让组件内部控制宽度和内边距，与WelcomePerformanceHeader保持一致 */
        box-sizing: border-box;
    }

    /* 3. 聊天模式布局 */
    .modern-content.chatting {
        width: 100%;
        max-width: 100%;
        height: calc(var(--vh, 1vh) * 100);
        /* 使用自定义视口高度变量 */
        padding: 76px 0 0 0;
        overflow: hidden;
    }

    /* 4. 主页模式布局 - 为AI卡片预留底部空间 */
    .modern-content:not(.chatting) {
        padding-bottom: 30px;
        /* AI卡片预留空间 */
    }

    /* 5. 新聊天按钮区域 */
    .new-chat-section {
        margin-bottom: 20px;
        padding: 0 16px;
    }

    .chat-actions {
        display: flex;
        flex-wrap: nowrap;
        gap: 8px;
        justify-content: center;
        overflow-x: auto;
    }

    .goto-recommendation-btn {
        font-size: 0.75rem;
        padding: 6px 12px;
        height: 32px;
        white-space: nowrap;
        flex-shrink: 0;
        border-radius: 8px;
    }

    /* 6. AI卡片定位 - 主页模式贴底 */
    .modern-content:not(.chatting) .ai-card {
        position: fixed;
        left: 0;
        right: 0;
        width: 100%;
        z-index: 999;
    }

    /* 7. 聊天历史区域 */
    .chat-history-area {
        height: calc(var(--vh, 1vh) * 100 - 76px - 180px);
        padding: 16px 8px 16px 8px;
        margin: 0 0 20px 0;
        /* 增加底部间隔 */
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    /* 8. 聊天消息样式 */
    .chat-message {
        padding: 0 0 0.3125rem 0;
    }

    .chat-message.user .chat-message-content {
        max-width: 85%;
    }

    .chat-message.assistant .chat-message-content {
        max-width: 100%;
    }

    .chat-message:last-child {
        margin-bottom: 30px;
        /* 增加最后一条消息的底部间距 */
    }

    /* 9. 快捷按钮样式 */
    .chat-shortcut-btn {
        padding: 6px 10px;
        min-height: 40px;
        min-width: 50px;
        font-size: 11px;
        gap: 2px;
    }
}

/* ========== PC端快捷操作网格布局 ========== */
.chat-shortcuts.pc-shortcuts {
    display: block !important;
}

.chat-shortcuts.pc-shortcuts .shortcuts-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr 1fr !important;
    grid-gap: 12px !important;
    gap: 12px !important;
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
}

.chat-shortcuts.pc-shortcuts .chat-shortcut-btn {
    height: 48px !important;
    padding: 8px 12px !important;
    border-radius: 12px !important;
    font-size: 13px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 2px !important;
    width: 100% !important;
    text-align: center !important;
    min-width: 0 !important;
    max-width: none !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    flex: none !important;
}

/* ========== 微信环境特殊处理 ========== */
@include mobile {

    /* 微信环境下的全宽处理 */
    body.wechat-browser {
        width: 100vw !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
    }

    body.wechat-browser .main-modern,
    body.wechat-browser .modern-content,
    body.wechat-browser .center-container,
    body.wechat-browser .welcome-section {
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        box-sizing: border-box !important;
    }

    /* WelcomeGuestHeader在微信环境下保持组件内部的宽度控制 */
    body.wechat-browser .welcome-guest-header {
        width: auto !important;
        max-width: none !important;
        margin: 0 8px 20px 8px !important;
        /* 与微信环境下的内边距保持一致 */
    }

    /* 微信环境下主页内容区域设置适当内边距 */
    body.wechat-browser .modern-content:not(.chatting) {
        padding: 0 8px;
        /* 微信环境下增加底部空间 */
    }

    /* 微信环境下聊天模式无内边距，占满全宽 */
    body.wechat-browser .modern-content.chatting {
        padding-left: 0;
        padding-right: 0;
    }

    body.wechat-browser .modern-content:not(.chatting) .ai-card {
        bottom: 0;
        /* 微信环境下贴底显示 */
    }

    /* 微信环境下聊天模式新建聊天按钮区域间隔优化 */
    body.wechat-browser .new-chat-section {
        margin-bottom: 12px;
    }

    /* 微信环境下输入框强制贴底全宽 */
    body.wechat-browser .input-area,
    body.wechat-browser .home-input-area {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 1000 !important;
        box-sizing: border-box !important;
    }
}

/* 移动端提醒徽章优化 */
@include mobile {
    .reminder-count-badge-small {
        top: -3px;
        right: -3px;
        font-size: 8px;
        min-width: 14px;
        height: 14px;
        padding: 1px 3px;
    }

    /* 股票操作按钮移动端优化 */
    .stock-actions {
        gap: 4px;
        margin-top: 8px;
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .add-watchlist-btn,
    .remove-watchlist-btn,
    .continue-analysis-btn,
    .buy-stock-btn,
    .buy-stock-btn-secondary,
    .paid-analysis-btn,
    .quant-analysis-btn,
    .reminder-btn-small {
        font-size: 11px;
        padding: 5px 8px;
        border-radius: 5px;
        min-height: 30px;
        gap: 3px;
        white-space: nowrap;
        flex-shrink: 0;
        max-width: 120px;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg,
    .reminder-btn-small svg {
        width: 10px;
        height: 10px;
    }

    /* 价格标签移动端优化 */
    .price-tag-container {
        gap: 2px;
        margin-left: 2px;
    }

    .price-tag {
        font-size: 8px;
        padding: 1px 3px;
        border-radius: 2px;
    }

    /* AI消息操作按钮移动端适配 */
    .message-actions-external {
        opacity: 1;
        /* 移动端始终显示 */
        margin-top: 12px;
        margin-left: 0;
        /* 移动端不需要额外的左边距 */
    }

    .action-buttons {
        justify-content: center;
        gap: 0;
    }

    .action-btn {
        padding: 6px 0 !important;
        min-height: 32px;
        font-size: 12px !important;
    }

    .action-text {
        font-size: 12px;
    }
}

/* ========== 超小屏幕优化 ========== */
@include mobile-sm {

    /* 新聊天按钮区域紧凑化 */
    .new-chat-section {
        margin-bottom: 16px;
    }

    /* 快捷按钮进一步紧凑 */
    .chat-shortcut-btn {
        padding: 5px 8px;
        min-height: 36px;
        min-width: 45px;
        font-size: 10px;
        gap: 1px;
    }

    /* 聊天消息宽度优化 */
    .chat-message.user .chat-message-content {
        max-width: 80%;
    }
}

@include mobile-sm {
    .quant-analysis-actions {
        margin-top: 10px;
        padding: 8px;
        border-radius: 6px;
    }

    .analysis-actions-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin-bottom: 8px;
    }

    .analysis-actions-buttons {
        flex-direction: row;
        gap: 4px;
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .reminder-btn,
    .records-btn {
        font-size: 10px;
        padding: 5px 8px;
        min-height: 30px;
        border-radius: 4px;
        flex: none;
        min-width: auto;
    }

    .analysis-tip {
        font-size: 9px;
        padding: 5px 7px;
        line-height: 1.2;
    }

    .actions-title {
        font-size: 11px;
    }

    .active-reminders-badge {
        font-size: 8px;
        padding: 2px 4px;
    }

    /* 股票操作按钮超小屏优化 */
    .stock-actions {
        gap: 3px;
        margin-top: 6px;
    }

    .add-watchlist-btn,
    .remove-watchlist-btn,
    .continue-analysis-btn,
    .buy-stock-btn,
    .buy-stock-btn-secondary,
    .paid-analysis-btn,
    .quant-analysis-btn,
    .reminder-btn-small {
        font-size: 10px;
        padding: 4px 6px;
        border-radius: 4px;
        min-height: 28px;
        gap: 2px;
        max-width: 100px;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg,
    .reminder-btn-small svg {
        width: 9px;
        height: 9px;
    }

    .price-tag {
        font-size: 7px;
        padding: 1px 2px;
    }
}

/* 超小屏幕优化 (320px及以下) */
@include mobile-xs {
    .quant-analysis-actions {
        padding: 6px;
        margin-top: 8px;
    }

    .analysis-actions-buttons {
        gap: 3px;
        flex-direction: row;
        justify-content: flex-start;
    }

    .reminder-btn,
    .records-btn {
        font-size: 9px;
        padding: 4px 6px;
        min-height: 28px;
        border-radius: 3px;
    }

    .actions-title {
        font-size: 10px;
    }

    .analysis-tip {
        font-size: 8px;
        padding: 4px 6px;
    }

    /* 股票操作按钮极小屏优化 */
    .stock-actions {
        gap: 2px;
        margin-top: 5px;
    }

    .add-watchlist-btn,
    .remove-watchlist-btn,
    .continue-analysis-btn,
    .buy-stock-btn,
    .buy-stock-btn-secondary,
    .paid-analysis-btn,
    .quant-analysis-btn,
    .reminder-btn-small {
        font-size: 9px;
        padding: 3px 5px;
        border-radius: 3px;
        min-height: 26px;
        gap: 1px;
        max-width: 90px;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg,
    .reminder-btn-small svg {
        width: 8px;
        height: 8px;
    }

    .price-tag {
        font-size: 6px;
        padding: 0 2px;
    }
}
</style>
