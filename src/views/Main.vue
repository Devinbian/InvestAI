<template>
    <div class="main-modern" :class="{ 'onboarding-active': showOnboarding, 'with-chat-history': showChatHistory }">
        <!-- 顶部导航栏 -->
        <TopNavbar @show-login="showLogin" @show-profile="handleShowProfile" @show-preferences="handleShowPreferences"
            @show-records="handleShowRecords" @show-mobile-menu="showMobileUserMenu" />

        <!-- 聊天历史记录 -->
        <ChatHistory v-if="userStore.isLoggedIn" :visible="showChatHistory"
            :current-chat-id="chatHistoryStore.currentChatId" :chat-history="chatHistory" @load-chat="handleLoadChat"
            @create-new-chat="handleCreateNewChat" @rename-chat="handleRenameChat" @delete-chat="handleDeleteChat"
            @close-panel="closeChatHistory" ref="chatHistoryComponentRef" />

        <!-- 移动端侧边栏悬浮切换按钮 -->
        <button v-show="isMobileSidebarAvailable" class="floating-sidebar-toggle" @click="handleMobileSidebarToggle"
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
            <OnboardingFlow v-if="showOnboarding" @complete="onOnboardingComplete" @analyze-stock="handleAnalyzeStock"
                @execute-action="handleOnboardingAction" />

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
                    <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                        :is-chat-mode="false" :is-mobile-view="isMobileView" :is-recording="isRecording"
                        :recording-duration="recordingDuration" :is-generating="isGenerating"
                        :show-chat-shortcuts="showChatShortcuts" :is-logged-in="userStore.isLoggedIn"
                        :show-chat-history="showChatHistory" @send-message="sendMessage"
                        @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                        @stop-generation="stopGeneration" @toggle-chat-shortcuts="toggleChatShortcuts" />

                    <!-- 快捷操作栏组件 -->
                    <ShortcutsBar mode="initial" :show-shortcuts="true" :show-chat-shortcuts="showChatShortcuts"
                        :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                        @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                        @toggle-chat-shortcuts="toggleChatShortcuts" ref="shortcutsBarRef" />
                </div>

                <!-- PC端输入区域 - 保持原有布局 -->
                <template v-else>
                    <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                        :is-chat-mode="false" :is-mobile-view="isMobileView" :is-recording="isRecording"
                        :recording-duration="recordingDuration" :is-generating="isGenerating"
                        :show-chat-shortcuts="showChatShortcuts" :is-logged-in="userStore.isLoggedIn"
                        :show-chat-history="showChatHistory" @send-message="sendMessage"
                        @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                        @stop-generation="stopGeneration" @toggle-chat-shortcuts="toggleChatShortcuts" />

                    <!-- 快捷操作栏组件 -->
                    <ShortcutsBar mode="initial" :show-shortcuts="true" :show-chat-shortcuts="showChatShortcuts"
                        :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                        @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                        @toggle-chat-shortcuts="toggleChatShortcuts" ref="shortcutsBarRef" />
                </template>
            </div>

            <!-- 聊天历史区域 -->
            <div class="chat-history-area chat-area" v-if="isChatMode && chatHistory.length" ref="chatHistoryRef">
                <div v-for="(message, idx) in chatHistory" :key="idx" :class="['chat-message', message.role]">
                    <div class="chat-message-content">
                        <!-- AI生成中状态显示 -->
                        <div v-if="message.role === 'assistant' && !message.content && isGenerating && idx === chatHistory.length - 1"
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
                        <div v-else-if="message.content" class="message-text">
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
                                    @click="handleInteractionAction(action, message)" class="suggestion-item">
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
                                @action-click="handleChatStockAction" @add-watchlist="addToWatchlist"
                                @remove-watchlist="(stock) => removeFromWatchlist(stock.code)"
                                @show-buy-dialog="showBuyDialog" @show-ai-trading-dialog="showQuantAnalysisDialog" />

                            <!-- 设置提醒按钮（仅在量化分析消息中显示） -->
                            <el-button v-if="message.isQuantAnalysis" size="small"
                                @click="setQuantAnalysisReminder(message)" class="reminder-btn-small">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                                        fill="currentColor" />
                                </svg>
                                设置提醒
                                <span v-if="activeReminders.filter(r => r.isActive).length > 0"
                                    class="reminder-count-badge-small">
                                    {{activeReminders.filter(r => r.isActive).length}}
                                </span>
                            </el-button>
                        </div>

                        <!-- 自选股列表展示 -->
                        <div v-if="message.isWatchlistDisplay && message.watchlistData"
                            class="watchlist-display-container">
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
                            <StockList v-if="!isMobileView" :stocks="message.watchlistData"
                                :show-watchlist-status="true" :show-basic-details="true"
                                :actions="watchlistActionButtons" @stock-click="handleStockClick"
                                @action-click="handleWatchlistActionClick" />
                            <MobileStockList v-else :stocks="message.watchlistData" :show-watchlist-status="true"
                                :show-details="true" :actions="watchlistActionButtons" @stock-click="handleStockClick"
                                @action-click="handleWatchlistActionClick" />

                            <!-- 自选股互动建议 -->
                            <div v-if="message.hasInteractionButtons && message.interactionData"
                                class="interaction-suggestions">
                                <div class="suggestion-intro">
                                    💡 <span class="intro-text">基于您的自选股，建议您可以：</span>
                                </div>
                                <div class="suggestion-items">
                                    <div v-for="action in message.interactionData.recommendActions" :key="action.id"
                                        @click="handleInteractionAction(action, message)" class="suggestion-item">
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
                                            <span class="amount-value">¥{{ formatCurrency(message.assetData.totalAssets)
                                            }}</span>
                                        </div>
                                        <div class="asset-change"
                                            :class="[message.assetData.totalProfitPercent >= 0 ? 'profit' : 'loss']">
                                            <span class="change-icon">{{ message.assetData.totalProfitPercent >= 0 ?
                                                '📈' : '📉'
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
                                            <div class="stat-value">¥{{ formatCurrency(message.assetData.balance) }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-icon portfolio">📊</div>
                                        <div class="stat-info">
                                            <div class="stat-label">持仓市值</div>
                                            <div class="stat-value">¥{{ formatCurrency(message.assetData.portfolioValue)
                                            }}
                                            </div>
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
                                    <div class="tab-item" :class="{ active: activeTab === 'portfolio' }"
                                        @click="activeTab = 'portfolio'">
                                        📈 持仓明细 ({{ message.assetData.portfolioCount }})
                                    </div>
                                    <div class="tab-item" :class="{ active: activeTab === 'watchlist' }"
                                        @click="activeTab = 'watchlist'">
                                        ⭐ 自选股票 ({{ message.assetData.watchlistCount }})
                                    </div>
                                </div>

                                <div class="tab-content">
                                    <!-- 持仓明细Tab -->
                                    <div v-if="activeTab === 'portfolio'" class="tab-panel">
                                        <template v-if="message.assetData.portfolioData.length > 0">
                                            <StockList v-if="!isMobileView" :stocks="message.assetData.portfolioData"
                                                :show-position-status="true" :show-position-details="true"
                                                :show-basic-details="false" :actions="portfolioActionButtons"
                                                @stock-click="handleStockClick"
                                                @action-click="handlePortfolioActionClick" />
                                            <MobileStockList v-else :stocks="message.assetData.portfolioData"
                                                :show-position-status="true" :show-details="true"
                                                :actions="portfolioActionButtons" @stock-click="handleStockClick"
                                                @action-click="handlePortfolioActionClick" />
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
                                    <div v-if="activeTab === 'watchlist'" class="tab-panel">
                                        <template v-if="message.assetData.watchlistData.length > 0">
                                            <StockList v-if="!isMobileView" :stocks="message.assetData.watchlistData"
                                                :show-watchlist-status="true" :show-basic-details="true"
                                                :actions="watchlistActionButtons" @stock-click="handleStockClick"
                                                @action-click="handleWatchlistActionClick" />
                                            <MobileStockList v-else :stocks="message.assetData.watchlistData"
                                                :show-watchlist-status="true" :show-details="true"
                                                :actions="watchlistActionButtons" @stock-click="handleStockClick"
                                                @action-click="handleWatchlistActionClick" />
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
                            <StockList v-if="!isMobileView" :stocks="message.stockList"
                                v-bind="getSmartRecommendationConfig(message)" @stock-click="handleStockClick"
                                @action-click="handleStockActionClick">
                                <template #toolbar-actions v-if="message.isPersistent">
                                    <el-button size="small" text @click="refreshRecommendation(message)"
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
                            <MobileStockList v-else :stocks="message.stockList"
                                v-bind="getMobileSmartRecommendationConfig(message, getStockListConfig)"
                                @stock-click="handleStockClick" @action-click="handleStockActionClick"
                                :show-toolbar="true" :toolbar-title="'智能荐股'" :show-time="true"
                                :timestamp="message.timestamp">
                                <template #toolbar-actions>
                                    <button @click="refreshRecommendation(message)" class="mobile-refresh-btn">
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
                </div>



                <!-- 移动端聊天历史底部占位元素，防止被新建聊天按钮遮挡 -->
                <div class="mobile-chat-spacer" v-if="isMobileView"></div>
            </div>

            <!-- 底部输入区域（仅在聊天状态显示） -->
            <div class="input-area" v-if="isChatMode">
                <!-- 新聊天按钮和快捷操作 -->
                <div class="new-chat-section" v-if="chatHistory.length > 0">
                    <div class="chat-actions">
                        <el-button class="new-chat-btn" @click="createNewChat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" />
                            </svg>
                            新建聊天
                        </el-button>

                        <!-- 快速跳转到荐股列表 -->
                        <el-button v-if="hasRecommendationInHistory" class="goto-recommendation-btn"
                            @click="scrollToRecommendation">
                            🎯
                            查看荐股
                        </el-button>
                    </div>
                </div>

                <!-- 聊天模式快捷操作栏组件 -->
                <ShortcutsBar mode="chat" :show-shortcuts="true" :show-chat-shortcuts="showChatShortcuts"
                    :is-mobile-view="isMobileView" :is-logged-in="userStore.isLoggedIn"
                    @shortcut-click="handleShortcutClick" @customize-dialog-open="openCustomizeDialog"
                    @toggle-chat-shortcuts="toggleChatShortcuts" ref="chatShortcutsBarRef" />

                <AIInputCard v-model="inputMessage" :show-history-button="userStore.isLoggedIn && !showChatHistory"
                    :is-chat-mode="true" :is-mobile-view="isMobileView" :is-recording="isRecording"
                    :recording-duration="recordingDuration" :is-generating="isGenerating"
                    :show-chat-shortcuts="showChatShortcuts" :is-logged-in="userStore.isLoggedIn"
                    :show-chat-history="showChatHistory" @send-message="sendMessage"
                    @toggle-chat-history="toggleChatHistory" @voice-click="onVoiceClick"
                    @stop-generation="stopGeneration" @toggle-chat-shortcuts="toggleChatShortcuts" />
            </div>
        </main>

        <!-- 侧边栏（仅在登录后显示） -->
        <Sidebar v-if="userStore.isLoggedIn" ref="sidebarRef" @send-to-chat="handleSidebarInteraction"
            @show-buy-dialog="showBuyDialog" @show-sell-dialog="handleShowSellDialog" />



        <!-- 移动端用户菜单弹窗 -->
        <MobileUserMenu :visible="showMobileMenu" :user-info="userStore.userInfo" @close="hideMobileUserMenu"
            @command="(command) => handleMobileCommand(command, handleCommand)" />

        <!-- 登录对话框组件 -->
        <LoginDialog v-model="loginDialogVisible" :register-mode="isRegisterMode"
            @login-success="(data) => handleLoginSuccess(data, () => { showOnboarding = true; }, dismissGuide)"
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
import MobileUserMenu from '../components/MobileUserMenu.vue';
import ChatHistory from '../components/ChatHistory.vue';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
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
import { recommendStock, api } from '@/api/api';
import { riskOptions } from '@/config/userPortrait';
import { authFetchEventSource } from '@/utils/request';
import { useMobileAdaptation } from '../composables/useMobileAdaptation';
import { useChatManager } from '../composables/useChatManager';
import { useVoiceInput } from '../composables/useVoiceInput';
import { useStockOperations } from '../composables/useStockOperations';
import { useAuthentication } from '../composables/useAuthentication';
import { formatCurrency } from '@/utils/formatters';

const router = useRouter();
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
    handleDeleteChat
} = chatManager;

const showUserProfile = ref(false); // 控制是否显示个人中心
const showRecordsCenter = ref(false); // 控制是否显示记录中心
// 量化分析提醒相关状态已移至 useStockOperations
const showChatShortcuts = ref(false); // 控制聊天模式下的快捷操作显示

// 使用移动端适配composable
const mobileAdaptation = useMobileAdaptation();
const {
    isMobileView,
    showMobileMenu,
    showMobileUserMenu,
    hideMobileUserMenu,
    handleMobileCommand,
    getMobileSmartRecommendationConfig
} = mobileAdaptation;

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
} = stockOperations;

// 创建包装函数来调用股票操作，传递所需参数
const handleAITradingConfirmed = (data) => {
    stockHandleAITradingConfirmed(data, chatHistory, isChatMode, scrollToBottom);
};

// 创建包装函数来调用付费分析，传递所需参数
const showPaidAnalysisDialogWrapper = (stock) => {
    showPaidAnalysisDialog(stock, userStore, continueAnalysis);
};



// 聊天历史相关
const showChatHistory = ref(false); // 控制聊天历史面板显示
const chatHistoryComponentRef = ref(null);

// 快捷操作自定义相关
const customizeDialogVisible = ref(false);



// 初始化快捷操作 - 简化版本，只负责通知组件
const initializeShortcuts = () => {
    console.log('🔄 Main.vue - 初始化快捷操作');

    // 通知ShortcutsBar组件更新
    [shortcutsBarRef.value, chatShortcutsBarRef.value].forEach((ref, index) => {
        if (ref) {
            ref.initializeShortcuts();
            console.log(`✅ Main.vue - 已通知${index === 0 ? '初始模式' : '聊天模式'}ShortcutsBar组件初始化`);
        }
    });

    console.log('✅ Main.vue - 快捷操作初始化完成');
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

// 投资偏好设置
const preferencesDialogVisible = ref(false);
const preferencesFormRef = ref(null);
const preferencesLoading = ref(false);

// 聊天发送状态管理（已移至useChatManager）
// const isGenerating = ref(false); // 已从useChatManager获取
// const currentAbortController = ref(null); // 已从useChatManager获取

// 步骤配置
const preferenceSteps = [
    {
        title: '投资经验',
        desc: '告诉我们您的投资经验，帮助我们推荐合适的投资方案'
    },
    {
        title: '选择投资风格',
        desc: '您希望投资收益高一些，还是稳一些？选择最适合您的投资方式'
    },
    {
        title: '用户特征',
        desc: '帮助我们了解您的投资偏好，为您量身定制投资方案'
    },
    {
        title: '关注板块',
        desc: '请选择您关注的投资板块（可多选）'
    }
];

// 引导提示
const showGuideTip = ref(false);
const guideTitle = ref('');
const guideMessage = ref('');
const guideActionText = ref('');
const guideType = ref(''); // 'login' | 'register' | 'preferences'

// 购买股票相关
// 股票交易相关状态已移至 useStockOperations
const buyLoading = ref(false);
const buyFormRef = ref(null);
const activeTab = ref('portfolio');
const buyForm = reactive({
    quantity: 100,
    price: 0,
    orderType: 'limit' // limit: 限价, market: 市价
});





// 认证相关函数已移至 useAuthentication composable



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

// 移动端用户菜单相关方法 - 已移至 useMobileAdaptation composable

// 发送消息 - 使用组合式函数
const sendMessage = async () => {
    // 检查用户登录状态
    if (!checkAuthStatus('开始对话')) {
        return;
    }
    await chatSendMessage(userStore, isMobileView, mobileAdaptation, scrollToBottom);
};

// 聊天相关函数已移至 useChatManager
// 创建新聊天 - 使用组合式函数
const createNewChat = () => {
    chatCreateNewChat(isMobileView, mobileAdaptation, scrollToTop);
};

watch(chatHistory, () => {
    nextTick(() => {
        scrollToBottom();
        // 确保滚动事件监听器已绑定
        if (chatHistoryRef.value && !chatHistoryRef.value.hasScrollListener) {
            chatHistoryRef.value.addEventListener('scroll', handleScroll);
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

// 语音输入相关状态已移至 useVoiceInput


// 语音相关函数已移至 useVoiceInput

// 语音点击处理 - 使用组合式函数
const onVoiceClick = () => {
    voiceOnClick(inputMessage);
};

// 切换聊天快捷操作显示
const toggleChatShortcuts = () => {
    showChatShortcuts.value = !showChatShortcuts.value;
    console.log('toggleChatShortcuts:', {
        showChatShortcuts: showChatShortcuts.value,
        userLoggedIn: userStore.isLoggedIn,
        activeShortcuts: activeShortcuts.value.length,
        isMobileView: isMobileView.value
    });

    // PC端动态调整聊天历史区域高度
    if (!isMobileView.value) {
        updateChatHistoryHeight();
    }
};

// 更新聊天历史区域高度函数已移至 useChatManager
// 移动端侧边栏状态管理
const sidebarRef = ref(null);

// 计算属性：检查移动端侧边栏是否可用
const isMobileSidebarAvailable = computed(() => {
    return userStore.isLoggedIn &&
        isMobileView.value &&
        sidebarRef.value &&
        typeof sidebarRef.value.toggleSidebar === 'function';
});

// 处理移动端侧边栏切换，带双重检查
const handleMobileSidebarToggle = () => {
    // 在点击时再次检查条件，确保组件仍然可用
    if (userStore.isLoggedIn &&
        isMobileView.value &&
        sidebarRef.value &&
        typeof sidebarRef.value.toggleSidebar === 'function') {
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


const setSuggestionAndSend = (suggestion) => {
    inputMessage.value = suggestion;
    sendMessage();
    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
        setTimeout(() => {
            showChatShortcuts.value = false;
        }, 300);
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

// 智能荐股功能 - 使用组合式函数
const handleSmartRecommendation = async () => {
    if (!checkAuthStatus('使用智能荐股功能')) {
        return;
    }
    await stockHandleSmartRecommendation(userStore, chatHistoryStore, chatHistory, isChatMode, scrollToBottom, showChatShortcuts, showGuide);
};

// 资讯推送功能 - 使用组合式函数
const handleNewsUpdate = async () => {
    if (!checkAuthStatus('获取资讯推送')) {
        return;
    }
    await stockHandleNewsUpdate(userStore, chatHistory, isChatMode, scrollToBottom, showChatShortcuts, showGuide);
};

// 我的资产分析功能 - 使用组合式函数
const handleAssetAnalysis = async () => {
    if (!checkAuthStatus('进行资产分析')) {
        return;
    }
    await stockHandleAssetAnalysis(userStore, chatHistory, isChatMode, scrollToBottom, showChatShortcuts, showGuide);
};

// 自选股查看功能
const handleWatchlistView = async () => {
    // 检查用户是否已登录
    if (!checkAuthStatus('查看自选股')) {
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

    // 如果用户没有自选股，添加一些示例数据用于演示
    if (userStore.watchlist.length === 0) {
        const sampleWatchlist = [
            { code: '600519', name: '贵州茅台', industry: '食品饮料', addedAt: '2024-01-15T09:30:00.000Z', price: '1680.50', change: '+28.50', changePercent: '+1.72%' },
            { code: '000001', name: '平安银行', industry: '银行', addedAt: '2024-01-14T10:15:00.000Z', price: '12.68', change: '-0.15', changePercent: '-1.17%' },
            { code: '300750', name: '宁德时代', industry: '新能源', addedAt: '2024-01-13T14:20:00.000Z', price: '485.20', change: '+12.30', changePercent: '+2.60%' },
            { code: '000858', name: '五粮液', industry: '食品饮料', addedAt: '2024-01-12T11:45:00.000Z', price: '52.30', change: '-1.20', changePercent: '-2.24%' },
            { code: '002415', name: '海康威视', industry: '电子', addedAt: '2024-01-11T13:30:00.000Z', price: '28.90', change: '+0.45', changePercent: '+1.58%' }
        ];

        userStore.watchlist.push(...sampleWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(userStore.watchlist));
        ElMessage.info('已为您添加示例自选股数据');
    }

    // 获取自选股数据，使用辅助函数生成完整的股票详情
    const watchlistData = userStore.watchlist.map(stock => generateWatchlistStockData(stock));

    // 直接显示自选股列表，使用卡片形式
    const userMessage = '查看我的自选股列表';
    const assistantMessage = `📋 **我的自选股列表**

您当前关注 **${userStore.watchlist.length}** 只股票，详细信息如下：`;

    chatHistory.value.push(
        { role: 'user', content: userMessage },
        {
            role: 'assistant',
            content: assistantMessage,
            hasWatchlistInfo: true,
            watchlistData: watchlistData,
            isWatchlistDisplay: true,
            hasInteractionButtons: true,
            interactionData: {
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
            },
            watchlistStats: {
                total: userStore.watchlist.length,
                upCount: watchlistData.filter(s => s.changePct >= 0).length,
                downCount: watchlistData.filter(s => s.changePct < 0).length,
                bestPerformer: watchlistData.sort((a, b) => b.changePct - a.changePct)[0],
                worstPerformer: watchlistData.sort((a, b) => a.changePct - b.changePct)[0],
                updateTime: new Date().toLocaleString('zh-CN')
            }
        }
    );

    await nextTick();
    scrollToBottom();
    ElMessage.success('已显示您的自选股列表');

    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
        setTimeout(() => {
            showChatShortcuts.value = false;
        }, 300);
    }
};

// 股票价格获取函数已移至 useStockOperations

// 自选股数据生成函数已移至 useStockOperations

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
    chatHistory.value.push(
        { role: 'user', content: message },
        res.data
    );

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

    chatHistory.value.push(
        {
            role: 'assistant', content: `正在为您量化分析【${stockInfo.name}(${stockInfo.code})】，请等待片刻......`,
            hasStockInfo: false, stockInfo: stockInfo
        },
    );

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

                    chatHistory.value[chatHistory.value.length - 1].content = aiContent;
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
                // 标识这是量化分析消息，用于显示设置提醒按钮
                chatHistory.value[chatHistory.value.length - 1].isQuantAnalysis = true;
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

// AI委托交易方法
const performQuantAnalysis = async (stockInfo) => {
    const message = `【付费AI委托交易】请对${stockInfo.name}(${stockInfo.code})进行专业AI委托交易分析，包括：
1. 技术指标分析（MACD、RSI、布林带、KDJ等）
2. 量化选股因子评分（价值因子、成长因子、质量因子）
3. 风险评估模型（波动率、最大回撤、夏普比率）
4. 量化交易信号（买入卖出信号、信号强度）
5. 回测数据分析（历史表现、胜率统计）
6. AI委托交易策略建议（策略类型、参数设置、风控措施）`;

    const res = await mockApi.sendMessage(message);
    chatHistory.value.push(
        { role: 'user', content: `AI委托交易 ${stockInfo.name}(${stockInfo.code})` },
        {
            ...res.data,
            hasStockInfo: true,
            stockInfo: stockInfo
        }
    );

    await nextTick();
    scrollToBottom();
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

// 自选股票操作事件处理
const handleWatchlistActionClick = ({ action, stock }) => {
    console.log('执行自选股票操作:', action, stock);

    switch (action) {
        case 'removeWatchlist':
            removeFromWatchlist(stock.code);
            break;
        case 'analysis':
            showPaidAnalysisDialogWrapper(stock);
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

// 持仓股票操作事件处理
const handlePortfolioActionClick = ({ action, stock }) => {
    console.log('执行持仓股票操作:', action, stock);

    switch (action) {
        case 'sell':
            showBuyDialog(stock, 'sell');
            break;
        case 'addPosition':
            showBuyDialog(stock, 'buy');
            break;
        case 'analysis':
            showPaidAnalysisDialogWrapper(stock);
            break;
        case 'aiTrading':
            showQuantAnalysisDialog(stock);
            break;
        default:
            console.log('未知操作:', action);
    }
};

// 获取智能荐股配置
const getSmartRecommendationConfig = (message) => {
    const config = getStockListConfig('smartRecommendation');
    return {
        ...config,
        toolbarTitle: '智能荐股推荐',
        timestamp: message.timestamp,
        showToolbar: message.isPersistent
    };
};

// 股票点击事件处理
const handleStockClick = (stock) => {
    console.log('点击了股票:', stock);
    // 可以在这里添加股票点击的处理逻辑，比如跳转到股票详情页
};

// 股票操作按钮点击事件处理
const handleStockActionClick = ({ action, stock }) => {
    console.log('执行操作:', action, stock);

    switch (action) {
        case 'addWatchlist':
            addToWatchlist(stock);
            break;
        case 'removeWatchlist':
            removeFromWatchlist(stock.code);
            break;
        case 'analysis':
            showPaidAnalysisDialogWrapper(stock);
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

// 聊天股票操作事件处理
const handleChatStockAction = (event) => {
    console.log('🚀 Main.vue - 聊天股票操作:', event);
    handleStockActionClick(event);
};

// 投资偏好组件事件处理
const handlePreferencesCompleted = (preferences) => {
    // 显示欢迎消息
    setTimeout(() => {
        chatHistory.value.push({
            role: 'assistant',
            content: `欢迎使用智投小助！根据您的投资偏好（${getRiskLevelText(preferences.riskLevel)}），我将为您提供个性化的投资建议。您可以问我任何关于投资的问题。`
        });
        nextTick(() => {
            scrollToBottom();
        });
    }, 500);
};

const handlePreferencesSkipped = () => {
    // 跳过时的处理逻辑
    console.log('用户跳过了投资偏好设置');
};

// 股票交易组件事件处理
const handleTradeCompleted = (tradeData) => {
    console.log('交易完成:', tradeData);
    // 可以在这里添加交易完成后的逻辑，如更新界面、发送通知等
};

const handleWatchlistChanged = (data) => {
    console.log('自选股变化:', data);
    // 自选股变化时的处理逻辑
};

// 用户信息格式化函数已移至 useStockOperations

// 获取策略文本
const getStrategyText = (strategy) => {
    const strategyMap = {
        'conservative': '保守策略',
        'balanced': '平衡策略',
        'aggressive': '激进策略'
    };
    return strategyMap[strategy] || '平衡策略';
};

// 引导提示相关方法
const showGuide = (type) => {
    guideType.value = type;

    switch (type) {
        case 'login':
            guideTitle.value = '欢迎回来！';
            guideMessage.value = '请先登录您的账号，继续使用智投小助的服务';
            guideActionText.value = '立即登录';
            break;
        case 'register':
            guideTitle.value = '欢迎使用智投小助！';
            guideMessage.value = '看起来您是新用户，请先注册账号开始您的投资之旅';
            guideActionText.value = '立即注册';
            break;
    }

    showGuideTip.value = true;
};

const handleGuideAction = () => {
    dismissGuide();

    switch (guideType.value) {
        case 'login':
            showLogin(false);
            break;
        case 'register':
            showLogin(true);
            break;
    }
};

const dismissGuide = () => {
    showGuideTip.value = false;
};

// 检查聊天历史中是否有荐股列表
const hasRecommendationInHistory = computed(() => {
    return chatHistory.value.some(message =>
        message.hasStockInfo &&
        message.stockList &&
        message.isPersistent
    );
});

// 购买相关方法已移至 useStockOperations

// 检查用户状态并显示相应引导
const checkUserStatus = () => {
    // 只有在登录且没有偏好设置时才显示引导
    if (userStore.isLoggedIn && (!userStore.userInfo.preferences || !userStore.userInfo.preferences.riskLevel)) {
        setTimeout(() => {
            showOnboarding.value = true;
        }, 1000);
    }
};

// 窗口大小变化处理函数 - 简化处理
const handleResize = () => {
    mobileAdaptation.checkMobileView();
    updateChatHistoryHeight();
    // 移动端聊天模式下的处理
    if (isMobileView.value && isChatMode.value) {
        setTimeout(() => {
            mobileAdaptation.fixMobileChatBox(isChatMode.value); // 确保输入框不被遮挡
            scrollToBottom();
        }, 100);
    }
};

onMounted(() => {
    scrollToBottom();
    // 移除自动检查用户状态，避免老用户登录后进入引导流程

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


    // 如果有当前聊天ID，恢复聊天记录
    if (chatHistoryStore.currentChatId) {
        const currentChat = chatHistoryStore.getCurrentChat;
        if (currentChat) {
            chatHistory.value = [...currentChat.messages];
            isChatMode.value = chatHistory.value.length > 0;
        }
    }

    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);

    // 添加滚动事件监听
    nextTick(() => {
        if (chatHistoryRef.value && !chatHistoryRef.value.hasScrollListener) {
            chatHistoryRef.value.addEventListener('scroll', handleScroll);
            chatHistoryRef.value.hasScrollListener = true;
        }
    });

    // 移动端聊天框修复
    if (isMobileView.value) {
        // 初始状态也需要调用修复函数，确保主界面AI卡片正确显示
        mobileAdaptation.resetMobileLayout(isChatMode.value, scrollToTop);
        mobileAdaptation.handleMobileKeyboard(scrollToBottom);

        // 延迟调用修复函数，确保DOM完全渲染
        setTimeout(() => {
            mobileAdaptation.fixMobileChatBox(isChatMode.value);
            // 额外检查：确保精确上移效果正确应用
            mobileAdaptation.ensureMobileFixApplied(isChatMode.value);
        }, 100);

        // 再次延迟调用，确保修复完全生效
        setTimeout(() => {
            console.log('二次检查移动端修复效果');
            mobileAdaptation.fixMobileChatBox(isChatMode.value);
            mobileAdaptation.ensureMobileFixApplied(isChatMode.value);
        }, 500);

        // 设置移动端视口监听器
        mobileAdaptation.setupMobileViewportListeners(scrollToBottom);
    }
});

// 组件卸载时清理
onUnmounted(() => {
    if (chatHistoryRef.value) {
        chatHistoryRef.value.removeEventListener('scroll', handleScroll);
    }
    if (scrollTimer) {
        clearTimeout(scrollTimer);
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    // 清理语音识别资源
    cleanupVoice();
    // 清理窗口大小监听
    window.removeEventListener('resize', handleResize);

    // 清理移动端视口监听
    if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', () => { });
        window.visualViewport.removeEventListener('scroll', () => { });
    }
    window.removeEventListener('orientationchange', () => { });
});

const closeUserProfile = () => {
    showUserProfile.value = false;
};

const closeRecordsCenter = () => {
    showRecordsCenter.value = false;
};

// 滚动到最新的荐股列表
const scrollToRecommendation = () => {
    nextTick(() => {
        const recommendationElements = document.querySelectorAll('.persistent-stock-list');
        if (recommendationElements.length > 0) {
            // 滚动到最后一个荐股列表
            const lastRecommendation = recommendationElements[recommendationElements.length - 1];
            lastRecommendation.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // 添加高亮效果
            lastRecommendation.classList.add('highlight-recommendation');
            setTimeout(() => {
                lastRecommendation.classList.remove('highlight-recommendation');
            }, 2000);
        }
    });
};

// 格式化荐股时间函数已移至 useStockOperations

// 刷新荐股列表函数已移至 useStockOperations

// 量化分析相关函数已移至 useStockOperations



// 删除提醒
const removeReminder = (reminderId) => {
    const index = activeReminders.value.findIndex(r => r.id === reminderId);
    if (index !== -1) {
        const reminder = activeReminders.value[index];
        activeReminders.value.splice(index, 1);
        ElMessage.success(`已删除 ${reminder.stockName} 的提醒`);
    }
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
        chatHistory.value.push(
            { role: 'user', content: action.description || analysisPrompt },
            res.data
        );

        await nextTick();
        scrollToBottom();
        ElMessage.success(`已为您生成分析结果`);
    }
};

const getReminderDescription = (reminder) => {
    let conditionText = '';

    if (reminder.isQuantAnalysis) {
        // 量化分析提醒描述
        switch (reminder.type) {
            case 'overall_score':
                if (reminder.condition === 'score_above') {
                    conditionText = `综合评分上升至 ${reminder.value}分`;
                } else if (reminder.condition === 'score_below') {
                    conditionText = `综合评分下降至 ${reminder.value}分`;
                } else if (reminder.condition === 'score_change') {
                    conditionText = `综合评分变化超过 ${reminder.value}分`;
                }
                break;
            case 'buy_signal':
                if (reminder.condition === 'signal_above') {
                    conditionText = `买入信号强度达到 ${reminder.value}分`;
                } else if (reminder.condition === 'signal_below') {
                    conditionText = `买入信号强度低于 ${reminder.value}分`;
                } else if (reminder.condition === 'buy_signal_trigger') {
                    conditionText = `出现买入信号`;
                } else if (reminder.condition === 'sell_signal_trigger') {
                    conditionText = `出现卖出信号`;
                }
                break;
            case 'technical':
                const technicalMap = {
                    'macd_golden': 'MACD出现金叉',
                    'macd_death': 'MACD出现死叉',
                    'rsi_overbought': 'RSI进入超买区域',
                    'rsi_oversold': 'RSI进入超卖区域',
                    'boll_break': '价格突破布林带'
                };
                conditionText = technicalMap[reminder.condition] || '技术指标变化';
                break;
            case 'rating_change':
                if (reminder.condition === 'rating_upgrade') {
                    conditionText = `量化评级上调`;
                } else if (reminder.condition === 'rating_downgrade') {
                    conditionText = `量化评级下调`;
                } else if (reminder.condition === 'rating_reach') {
                    conditionText = `量化评级达到 ${reminder.value}`;
                }
                break;
            case 'risk_alert':
                const riskMap = {
                    'risk_abnormal': '风险指标异常',
                    'volatility_high': '波动率超标',
                    'drawdown_large': '回撤过大',
                    'sharpe_abnormal': '夏普比率异常'
                };
                conditionText = riskMap[reminder.condition] || '风险指标异常';
                break;
            default:
                conditionText = '量化指标变化';
        }
    } else {
        // 传统价格提醒描述（保持兼容性）
        if (reminder.type === 'price') {
            conditionText = `价格${reminder.condition === 'above' ? '突破' : '跌破'} ¥${reminder.value}`;
        } else if (reminder.type === 'change') {
            conditionText = `${reminder.condition === 'increase' ? '涨幅' : '跌幅'}超过 ${reminder.value}%`;
        } else if (reminder.type === 'volume') {
            conditionText = `成交量${reminder.condition === 'above' ? '超过' : '低于'} ${reminder.value}万手`;
        }
    }

    return conditionText;
};



// 个性化引导完成处理
const onOnboardingComplete = (data) => {
    showOnboarding.value = false;

    if (data && data.preferences) {
        // 保存用户偏好到store
        userStore.setUserInfo({
            ...userStore.userInfo,
            preferences: data.preferences
        });

        // 标记引导已完成
        localStorage.setItem('onboardingCompleted', 'true');

        // 根据用户偏好显示欢迎消息
        setTimeout(() => {
            if (data.profile) {
                chatHistory.value.push({
                    role: 'assistant',
                    content: `🎉 欢迎使用智投小助！根据您的投资风格（${data.profile.riskLabel}），我将为您提供个性化的投资建议。\n\n您可以随时问我关于投资的任何问题，我会基于您的偏好为您量身定制答案。`
                });
            }
        }, 500);
    }
};

// 处理引导流程中的股票分析
const handleAnalyzeStock = (stock) => {
    showOnboarding.value = false;
    isChatMode.value = true;

    setTimeout(() => {
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
            // 默认快捷操作，根据action类型执行相应操作
            switch (shortcut.action) {
                case 'smart_review':
                    setSuggestionAndSend(`智能复盘：请帮我进行全面的智能投资复盘分析，包括：

1. 市场整体走势分析（主要指数表现、板块轮动）
2. 我的投资组合表现分析和风险评估
3. 基于AI算法的策略优化建议
4. 市场情绪和技术指标综合分析
5. 个性化的下一步操作建议
6. 风险预警和机会识别
7. 智能资产配置优化方案

请结合我的投资风格和市场大数据，给出专业的智能化复盘建议。`);
                    break;
                case 'watchlist':
                    handleWatchlistView();
                    break;
                case 'smart_recommendation':
                    handleSmartRecommendation();
                    break;
                case 'news_update':
                    handleNewsUpdate();
                    break;
                case 'asset_analysis':
                    handleAssetAnalysis();
                    break;
                default:
                    // 兼容旧版本的函数类型action
                    if (typeof shortcut.action === 'function') {
                        shortcut.action();
                    } else {
                        console.error('未知的快捷操作类型:', shortcut.action);
                        ElMessage.error('快捷操作配置错误');
                    }
            }
        } else {
            // 自定义快捷操作，使用prompt
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

// 处理快捷操作更新事件 - 简化版本
const handleShortcutsUpdated = () => {
    console.log('🔄 Main.vue - 快捷操作更新事件触发');

    // 通知所有ShortcutsBar组件更新
    [shortcutsBarRef.value, chatShortcutsBarRef.value].forEach((ref, index) => {
        if (ref) {
            try {
                ref.handleShortcutsUpdated();
                console.log(`✅ Main.vue - 已通知${index === 0 ? '初始模式' : '聊天模式'}ShortcutsBar组件更新`);
            } catch (error) {
                console.warn(`⚠️ Main.vue - 通知ShortcutsBar更新时出错:`, error);
            }
        }
    });

    // 移动端特殊处理：如果快捷操作弹窗正在显示，强制刷新
    if (isMobileView.value && showChatShortcuts.value) {
        console.log('📱 Main.vue - 移动端快捷操作弹窗刷新');
        showChatShortcuts.value = false;
        nextTick(() => {
            showChatShortcuts.value = true;
        });
    }
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
        z-index: 1001 !important;
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
        padding-bottom: 180px !important;
        /* 为贴底的输入框留出空间 */
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
        height: calc(100vh - 76px - 160px) !important;
        /* 减少高度：76px(导航+间距) + 160px(输入框空间) */
        padding: 0 0 32px 0 !important;
        /* 顶部无padding，左右无间距让股票列表占满全屏，底部32px避免遮挡 */
        margin: 0 !important;
        /* 移除所有margin */
        width: 100% !important;
        max-width: none !important;
        /* 移动端占满宽度 */
        box-sizing: border-box !important;
        /* 确保padding不影响宽度计算 */
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
        /* 为移动端增加底部间距，确保最后一条消息不被新建聊天按钮遮挡 */
        padding-bottom: 100px !important;
        /* 基础20px + 额外80px防重叠空间 */
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
    .overview-stats {
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
[contenteditable] {
    -webkit-user-select: text !important;
    -khtml-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    user-select: text !important;
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



.chat-history-area {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 0;
    /* 移除左右padding，让聊天历史区域的视觉边界与AI卡片的边界完全一致 */
    overflow-y: auto;
    height: calc(100vh - 56px - var(--input-area-height, 200px));
    /* 页面高度 - 导航栏高度 - 输入区域高度(动态调整) */
    scrollbar-width: thin;
    /* Firefox */
    scrollbar-color: transparent transparent;
    /* Firefox */
    transition: scrollbar-color 0.3s ease, height 0.3s ease;
    /* 添加高度变化的过渡动画 */
}



/* 移动端聊天历史底部占位元素 */
.mobile-chat-spacer {
    height: 120px;
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

.chat-history-area:hover {
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.chat-history-area.scrolling {
    scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

/* 聊天区域滚动条样式 - 只在滚动时或悬停时显示 */
.chat-history-area::-webkit-scrollbar {
    width: 6px;
}

.chat-history-area::-webkit-scrollbar-track {
    background: transparent;
}

.chat-history-area::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 3px;
    transition: background 0.3s ease, opacity 0.3s ease;
    opacity: 0;
}

/* 鼠标悬停在滚动区域时显示滚动条 */
.chat-history-area:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    opacity: 1;
}

/* 鼠标悬停在滚动条本身时加深颜色 */
.chat-history-area::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.4) !important;
    opacity: 1;
}

/* 滚动时显示滚动条的动画效果 */
.chat-history-area.scrolling::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    opacity: 1;
}

/* 确保滚动条在滚动时优先显示 */
.chat-history-area.scrolling:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.4);
    opacity: 1;
}

.chat-message {
    display: flex;
    margin-bottom: 24px;
    padding: 0 20px;
    /* 添加左右间距，与AI卡片的内边距保持一致，确保消息内容不贴边 */
    width: 100%;
    box-sizing: border-box;
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

.chat-message.user .chat-message-content .markdown-content :deep(p:first-child) {
    margin-top: 0 !important;
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
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
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
    min-width: auto !important;
    /* 允许按钮根据内容自适应宽度 */
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
        padding-bottom: 80px;
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
        padding: 0 !important;
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
        height: calc(100vh - 76px - 140px) !important;
        /* 超小屏幕减少高度，顶部76px包含导航和间距 */
        padding: 0 0 28px 12px !important;
        /* 移除顶部padding，左侧12px间距，增加底部padding确保间隔 */
        margin: 0 !important;
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
        padding-bottom: 70px;
        /* 调整底部间距 */
    }


}

.chat-actions {
    flex-direction: row;
    gap: 8px;
}

.new-chat-btn,
.goto-recommendation-btn {
    width: 100%;
    max-width: 100px;
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
    z-index: 10999 !important;
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
    .overview-stats {
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
    .overview-stats {
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
        /* 非微信环境下，仅在主界面模式让欢迎区域整体上移40px */
        margin-bottom: 0px !important;
        /* 重置底部间距，避免挤压输入框 */
        transition: transform 0.3s ease !important;
        /* 添加平滑过渡效果 */
    }

    /* iOS设备下的欢迎区域特殊处理 - 仅主界面模式 */
    @supports (-webkit-touch-callout: none) {
        body:not(.wechat-browser) .modern-content:not(.chatting) .welcome-section {
            transform: translateY(-60px) !important;
            /* iOS设备需要上移更多 */
        }
    }

    /* Android Chrome浏览器下的欢迎区域处理 - 仅主界面模式 */
    @supports (-webkit-appearance: none) and (not (-webkit-touch-callout: none)) {
        body:not(.wechat-browser) .modern-content:not(.chatting) .welcome-section {
            transform: translateY(-50px) !important;
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
        height: 100vh !important;
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
        height: 100vh !important;
        max-height: 100vh !important;
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
        height: 100vh !important;
        overflow: hidden !important;
        position: fixed !important;
        /* 微信环境下占满全宽，消除两边空白 */
        width: 100vw !important;
        max-width: 100vw !important;
        margin: 0 !important;
        padding: 0 !important;
        left: 0 !important;
        top: 0 !important;
        z-index: 1 !important;
    }

    /* 微信环境下主内容区域优化 */
    body.wechat-browser .modern-content {
        height: 100vh !important;
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
        height: 100vh;
        height: 100dvh;
        /* 动态视口高度 */
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
        height: calc(100vh - 76px - 160px);
        height: calc(100dvh - 76px - 160px);
        padding: 16px 8px 60px 8px;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    /* 8. 聊天消息样式 */
    .chat-message {
        padding: 0 8px 16px 0;
    }

    .chat-message.user .chat-message-content {
        max-width: 85%;
    }

    .chat-message.assistant .chat-message-content {
        max-width: 100%;
    }

    .chat-message:last-child {
        margin-bottom: 40px;
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
        // padding-left: 8px;
        // padding-right: 8px;
        // padding-bottom: 0;
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
