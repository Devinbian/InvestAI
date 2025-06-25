<template>
    <div class="main-modern" :class="{ 'onboarding-active': showOnboarding, 'with-chat-history': showChatHistory }">
        <!-- 顶部导航栏 -->
        <header class="modern-navbar">
            <div class="navbar-left">
                <img src="/logo.png" class="modern-logo" alt="InvestAI Logo" />
                <span class="app-title">智投小助</span>
            </div>
            <div class="navbar-right">
                <template v-if="userStore.isLoggedIn">
                    <!-- PC端使用下拉菜单 -->
                    <el-dropdown @command="handleCommand" class="pc-user-menu">
                        <span class="modern-user">
                            {{ userStore.userInfo.nickname }}
                            <el-icon>
                                <ArrowDown />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                                <el-dropdown-item command="settings">偏好设置</el-dropdown-item>
                                <el-dropdown-item command="records">记录中心</el-dropdown-item>
                                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <!-- 移动端使用头像按钮 -->
                    <div class="mobile-user-avatar" @click="showMobileUserMenu">
                        {{ userStore.userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                </template>
                <template v-else>
                    <el-button class="modern-btn" @click="showLogin(false)">登录</el-button>
                    <el-button class="modern-btn" @click="showLogin(true)">注册</el-button>
                </template>
            </div>
        </header>

        <!-- 聊天历史记录 -->
        <ChatHistory v-if="userStore.isLoggedIn" :visible="showChatHistory"
            :current-chat-id="chatHistoryStore.currentChatId" :chat-history="chatHistory" @load-chat="handleLoadChat"
            @create-new-chat="handleCreateNewChat" @rename-chat="handleRenameChat" @delete-chat="handleDeleteChat"
            @close-panel="closeChatHistory" ref="chatHistoryComponentRef" />

        <!-- 聊天历史悬浮切换按钮 - 只在面板收起时显示 -->
        <button v-if="userStore.isLoggedIn && !showChatHistory" class="floating-history-toggle"
            @click="toggleChatHistory" :title="isMobileView ? '展开聊天记录' : '展开聊天记录'">
            <!-- PC端显示图标 -->
            <svg v-if="!isMobileView" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- 移动端显示历史记录图标 -->
            <template v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8 9h8M8 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </template>
        </button>



        <!-- 移动端侧边栏悬浮切换按钮 -->
        <button v-show="userStore.isLoggedIn && isMobileView" class="floating-sidebar-toggle"
            @click="toggleMobileSidebar" title="打开功能面板">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 12h18m-9 9l9-9-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </button>

        <!-- 主体内容 -->
        <main class="modern-content main-container"
            :class="{ 'chatting': isChatMode, 'with-sidebar': userStore.isLoggedIn, 'with-chat-history': showChatHistory }"
            :style="showChatHistory ? {
                transform: `translateX(${isMobileView ? '280px' : '320px'})`,
                transition: 'transform 0.3s ease'
            } : {
                transform: 'translateX(0)',
                transition: 'transform 0.3s ease'
            }">
            <!-- 个性化引导流程 -->
            <OnboardingFlow v-if="showOnboarding" @complete="onOnboardingComplete" @analyze-stock="handleAnalyzeStock"
                @execute-action="handleOnboardingAction" />

            <!-- 初始状态：标题、描述和输入区域作为一个整体 -->
            <div class="center-container chat-area" v-else-if="!isChatMode">
                <div class="welcome-section">
                    <div class="greeting-container">
                        <div class="greeting-avatar-large">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M9.663 17h4.673M12 3a6 6 0 0 1 6 6c0 3-2 4-2 4h-8s-2-1-2-4a6 6 0 0 1 6-6z"
                                    stroke="currentColor" stroke-width="2" />
                                <path d="M12 17v4" stroke="currentColor" stroke-width="2" />
                                <circle cx="12" cy="12" r="1" fill="currentColor" />
                            </svg>
                        </div>
                        <div class="greeting-message">
                            <div class="modern-title">{{ getGreetingTitle() }}</div>
                            <div class="modern-subtitle">{{ getGreetingSubtitle() }}</div>
                        </div>
                    </div>
                    <div class="modern-desc">
                        您的AI投资管家——自动分析、个性推荐、智能交易，全程陪伴，让赚钱更轻松
                        <div class="quick-examples">
                            <div class="examples-content">
                                <span v-for="example in currentExampleGroup" :key="example" class="example-tag"
                                    @click="setSuggestionText(example)">
                                    {{ example }}
                                </span>
                            </div>
                            <div class="examples-control">
                                <div class="control-container">
                                    <span class="examples-label">换一批问题</span>
                                    <div class="control-group">
                                        <span class="examples-indicator">{{ currentExampleGroupIndex + 1 }}/{{
                                            exampleGroups.length }}</span>
                                        <el-button class="refresh-examples-btn" size="small" @click="switchExampleGroup"
                                            :title="`点击切换到下一组问题`">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                                                    stroke="currentColor" stroke-width="2" fill="none" />
                                                <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2"
                                                    fill="none" />
                                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                                                    stroke="currentColor" stroke-width="2" fill="none" />
                                                <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2"
                                                    fill="none" />
                                            </svg>
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ai-card">
                    <div class="ai-input-row">
                        <el-input v-model="inputMessage" class="ai-input" type="textarea"
                            :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：分析比亚迪近期走势及投资价值，考虑新能源政策影响..."
                            @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                        <div class="ai-buttons">
                            <div class="voice-btn-container">
                                <el-button class="ai-func-btn voice-btn" :class="{ 'recording': isRecording }" circle
                                    @click="onVoiceClick"
                                    :title="isRecording ? `录音中 ${recordingDuration}s` : '点击开始语音输入'">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                                            :stroke="isRecording ? '#ff4757' : '#888'" stroke-width="2"
                                            :fill="isRecording ? '#ff4757' : 'none'" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" fill="none" />
                                        <line x1="12" y1="19" x2="12" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" />
                                        <line x1="8" y1="23" x2="16" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" />
                                    </svg>
                                </el-button>
                                <!-- 录音计时显示 -->
                                <div v-if="isRecording" class="recording-timer">{{ recordingDuration }}s</div>
                            </div>
                            <el-button class="ai-func-btn shortcuts-toggle-btn" circle @click="toggleChatShortcuts"
                                v-if="isMobileView && userStore.isLoggedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14m-7-7h14" stroke="#888" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </el-button>

                            <el-button class="ai-send-btn" type="primary" circle @click="sendMessage"
                                :disabled="!inputMessage.trim()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </el-button>
                        </div>
                    </div>
                </div>

                <div class="ai-suggestions" v-if="!isMobileView">
                    <!-- 快捷操作按钮 -->
                    <div class="suggestion-row">
                        <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="ai-suggestion-btn"
                            @click="handleShortcutClick(shortcut)">
                            <span class="btn-icon">{{ shortcut.icon }}</span>
                            {{ shortcut.title }}
                        </el-button>
                        <!-- 自定义按钮 - 低调样式 -->
                        <button class="customize-btn-inline" @click="openCustomizeDialog" title="自定义快捷操作">
                            <span class="customize-icon">⚙️</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 聊天历史区域 -->
            <div class="chat-history-area chat-area" v-if="isChatMode && chatHistory.length" ref="chatHistoryRef">
                <div v-for="(message, idx) in chatHistory" :key="idx" :class="['chat-message', message.role]">
                    <div class="chat-message-content">
                        <div v-if="message.content" class="message-text">
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
                            <!-- 购买按钮（购买模式时优先显示） -->
                            <el-button v-if="message.isBuyMode" type="primary" size="small"
                                @click="showBuyDialog(message.stockInfo)" class="buy-stock-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                        stroke="currentColor" stroke-width="2" />
                                </svg>
                                立即购买
                            </el-button>

                            <!-- 自选股按钮 -->
                            <el-button v-if="!userStore.isInWatchlist(message.stockInfo.code)" type="primary"
                                size="small" @click="addToWatchlist(message.stockInfo)" class="add-watchlist-btn">
                                ⭐
                                加入自选
                            </el-button>
                            <el-button v-else type="success" size="small"
                                @click="removeFromWatchlist(message.stockInfo.code)" class="remove-watchlist-btn">
                                ⭐
                                已加自选
                            </el-button>

                            <!-- AI委托交易按钮（付费） -->
                            <el-button v-if="!message.isBuyMode" size="small"
                                @click="showQuantAnalysisDialog(message.stockInfo)" class="quant-analysis-btn">
                                🤖
                                AI委托交易
                                <div class="price-tag-container">
                                    <span class="price-tag original-price">3智点</span>
                                    <span class="price-tag promo-price">1智点</span>
                                </div>
                            </el-button>

                            <!-- 购买按钮（非购买模式时显示） -->
                            <el-button v-if="!message.isBuyMode" size="small" @click="showBuyDialog(message.stockInfo)"
                                class="buy-stock-btn-secondary">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                        stroke="currentColor" stroke-width="2" />
                                </svg>
                                购买
                            </el-button>

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
                                v-bind="getMobileSmartRecommendationConfig(message)" @stock-click="handleStockClick"
                                @action-click="handleStockActionClick" :show-toolbar="true" :toolbar-title="'智能荐股'"
                                :show-time="true" :timestamp="message.timestamp">
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

                <!-- PC端快捷操作栏（聊天模式下显示在输入框上方） -->
                <div class="chat-shortcuts pc-shortcuts" v-if="showChatShortcuts && !isMobileView">
                    <div class="shortcuts-grid">
                        <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="chat-shortcut-btn"
                            @click="handleShortcutClick(shortcut)">
                            <span class="btn-icon">{{ shortcut.icon }}</span>
                            <span class="btn-text">{{ shortcut.shortTitle || shortcut.title }}</span>
                        </el-button>
                        <el-button class="chat-shortcut-btn customize-btn-chat" @click="openCustomizeDialog">
                            <span class="btn-icon">⚙️</span>
                            <span class="btn-text">设置</span>
                        </el-button>
                        <el-button class="chat-shortcut-btn close-btn" @click="toggleChatShortcuts">
                            <span class="btn-icon">✕</span>
                            <span class="btn-text">收起</span>
                        </el-button>
                    </div>
                </div>

                <div class="ai-card">
                    <!-- 输入框区域 -->
                    <div class="ai-input-row">
                        <el-input v-model="inputMessage" class="ai-input" type="textarea"
                            :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：分析比亚迪近期走势及投资价值，考虑新能源政策影响..."
                            @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                    </div>

                    <!-- 按钮区域 -->
                    <div class="ai-buttons-row">
                        <div class="ai-buttons">
                            <div class="voice-btn-container">
                                <el-button class="ai-func-btn voice-btn" :class="{ 'recording': isRecording }" circle
                                    @click="onVoiceClick"
                                    :title="isRecording ? `录音中 ${recordingDuration}s` : '点击开始语音输入'">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                                            :stroke="isRecording ? '#ff4757' : '#888'" stroke-width="2"
                                            :fill="isRecording ? '#ff4757' : 'none'" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" fill="none" />
                                        <line x1="12" y1="19" x2="12" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" />
                                        <line x1="8" y1="23" x2="16" y2="23" :stroke="isRecording ? '#ff4757' : '#888'"
                                            stroke-width="2" />
                                    </svg>
                                </el-button>
                                <!-- 录音计时显示 -->
                                <div v-if="isRecording" class="recording-timer">{{ recordingDuration }}s</div>
                            </div>
                            <el-button class="ai-func-btn shortcuts-toggle-btn" circle @click="toggleChatShortcuts"
                                v-if="!showChatShortcuts && userStore.isLoggedIn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14m-7-7h14" stroke="#888" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                            </el-button>
                            <el-button class="ai-send-btn" type="primary" circle @click="sendMessage"
                                :disabled="!inputMessage.trim()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 侧边栏（仅在登录后显示） -->
        <Sidebar v-if="userStore.isLoggedIn" ref="sidebarRef" @send-to-chat="handleSidebarInteraction"
            @show-buy-dialog="showBuyDialog" @show-sell-dialog="handleShowSellDialog" />

        <!-- 快捷操作栏（移动端独立显示） -->
        <div class="mobile-shortcuts-overlay" v-if="showChatShortcuts && isMobileView" @click="toggleChatShortcuts">
            <div class="mobile-shortcuts-container" @click.stop>
                <!-- 快捷操作按钮 -->
                <div class="shortcuts-main-grid">
                    <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="shortcut-btn-mobile"
                        @click="handleShortcutClick(shortcut)">
                        {{ shortcut.shortTitle || shortcut.title }}
                    </el-button>
                </div>

                <!-- 底部操作按钮 -->
                <div class="shortcuts-bottom-actions">
                    <el-button class="action-btn add-btn" @click="openCustomizeDialog">
                        <span class="add-icon">+</span>
                        添加
                    </el-button>
                    <el-button class="action-btn close-btn" @click="toggleChatShortcuts">
                        收起
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 移动端用户菜单弹窗 -->
        <div class="mobile-user-menu-overlay" v-if="showMobileMenu" @click="hideMobileUserMenu">
            <div class="mobile-user-menu-container" @click.stop>
                <!-- 用户信息头部 -->
                <div class="mobile-menu-header">
                    <div class="mobile-menu-avatar">
                        {{ userStore.userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                    <div class="mobile-menu-user-info">
                        <h3>{{ userStore.userInfo?.nickname || '未设置昵称' }}</h3>
                        <p>{{ userStore.userInfo?.email || '未绑定邮箱' }}</p>
                    </div>
                </div>

                <!-- 菜单项 -->
                <div class="mobile-menu-items">
                    <div class="mobile-menu-item" @click="handleMobileCommand('profile')">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor"
                                    stroke-width="2" />
                                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <span>个人中心</span>
                        <div class="menu-item-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                    </div>

                    <div class="mobile-menu-item" @click="handleMobileCommand('settings')">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="2" />
                                <path
                                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.04A1.65 1.65 0 0 0 21 9h.09a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09A1.65 1.65 0 0 0 19.4 15z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <span>偏好设置</span>
                        <div class="menu-item-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                    </div>

                    <div class="mobile-menu-item" @click="handleMobileCommand('records')">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                    stroke="currentColor" stroke-width="2" />
                                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" />
                                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
                                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
                                <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <span>记录中心</span>
                        <div class="menu-item-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                    </div>

                    <div class="mobile-menu-divider"></div>

                    <div class="mobile-menu-item logout-item" @click="handleMobileCommand('logout')">
                        <div class="menu-item-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor"
                                    stroke-width="2" />
                                <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" />
                                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <span>退出登录</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 登录对话框组件 -->
        <LoginDialog v-model="loginDialogVisible" :register-mode="isRegisterMode" @login-success="handleLoginSuccess"
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
        <el-dialog v-model="showQuantReminderDialog" title="设置量化分析提醒" :width="reminderDialogWidth"
            :before-close="handleReminderCancel" class="reminder-dialog">
            <div class="reminder-dialog-content">
                <div class="stock-info-section">
                    <h4>📊 量化分析股票</h4>
                    <div class="stock-info-display">
                        <span class="stock-name">{{ reminderForm.stockName }}</span>
                        <span class="stock-code">({{ reminderForm.stockCode }})</span>
                    </div>
                </div>

                <div class="quant-analysis-summary">
                    <h4>🎯 当前量化分析结果</h4>
                    <div class="analysis-summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">综合评分</span>
                            <span class="summary-value score">{{ currentQuantAnalysis.overallScore }}/10</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">信号强度</span>
                            <span class="summary-value signal">{{ currentQuantAnalysis.signalStrength }}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">买入信号</span>
                            <span class="summary-value signal-score">{{ currentQuantAnalysis.buySignalScore
                                }}/100</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">量化评级</span>
                            <span class="summary-value rating">{{ currentQuantAnalysis.rating }}</span>
                        </div>
                    </div>
                </div>

                <div class="reminder-form-section">
                    <h4>⚙️ 量化条件提醒设置</h4>
                    <div class="batch-reminder-tip">
                        <el-alert title="批量设置" type="info" :closable="false" show-icon>
                            <template #default>
                                勾选需要的提醒条件，可同时设置多个
                            </template>
                        </el-alert>
                    </div>

                    <!-- 快速选择区域 -->
                    <div class="quick-select-area">
                        <div class="quick-select-header">
                            <span class="quick-select-title">🚀 快速选择</span>
                            <div class="quick-select-actions">
                                <el-button size="small" @click="selectRecommendedConditions" type="primary" plain>
                                    推荐配置
                                </el-button>
                                <el-button size="small" @click="clearAllConditions" plain>
                                    清空选择
                                </el-button>
                            </div>
                        </div>

                        <!-- 紧凑的条件选择网格 -->
                        <div class="conditions-grid">
                            <!-- 综合评分 -->
                            <div class="condition-category">
                                <div class="category-header">
                                    <span class="category-icon">🎯</span>
                                    <span class="category-name">综合评分</span>
                                </div>
                                <div class="category-items">
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('overall_score', 'score_above') }"
                                        @click="toggleCondition('overall_score', 'score_above')">
                                        <span>评分上升至</span>
                                        <el-input v-if="isConditionSelected('overall_score', 'score_above')"
                                            v-model="reminderConditions.overall_score.values.score_above" type="number"
                                            placeholder="8.0" class="chip-input" @click.stop>
                                            <template #append>分</template>
                                        </el-input>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('overall_score', 'score_below') }"
                                        @click="toggleCondition('overall_score', 'score_below')">
                                        <span>评分下降至</span>
                                        <el-input v-if="isConditionSelected('overall_score', 'score_below')"
                                            v-model="reminderConditions.overall_score.values.score_below" type="number"
                                            placeholder="6.0" class="chip-input" @click.stop>
                                            <template #append>分</template>
                                        </el-input>
                                    </div>
                                </div>
                            </div>

                            <!-- 买入信号 -->
                            <div class="condition-category">
                                <div class="category-header">
                                    <span class="category-icon">📈</span>
                                    <span class="category-name">买入信号</span>
                                </div>
                                <div class="category-items">
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('buy_signal', 'signal_above') }"
                                        @click="toggleCondition('buy_signal', 'signal_above')">
                                        <span>信号强度达到</span>
                                        <el-input v-if="isConditionSelected('buy_signal', 'signal_above')"
                                            v-model="reminderConditions.buy_signal.values.signal_above" type="number"
                                            placeholder="90" class="chip-input" @click.stop>
                                            <template #append>分</template>
                                        </el-input>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('buy_signal', 'buy_signal_trigger') }"
                                        @click="toggleCondition('buy_signal', 'buy_signal_trigger')">
                                        <span>出现买入信号</span>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('buy_signal', 'sell_signal_trigger') }"
                                        @click="toggleCondition('buy_signal', 'sell_signal_trigger')">
                                        <span>出现卖出信号</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 技术指标 -->
                            <div class="condition-category">
                                <div class="category-header">
                                    <span class="category-icon">📊</span>
                                    <span class="category-name">技术指标</span>
                                </div>
                                <div class="category-items">
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('technical', 'macd_golden') }"
                                        @click="toggleCondition('technical', 'macd_golden')">
                                        <span>MACD金叉</span>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('technical', 'rsi_oversold') }"
                                        @click="toggleCondition('technical', 'rsi_oversold')">
                                        <span>RSI超卖</span>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('technical', 'boll_break') }"
                                        @click="toggleCondition('technical', 'boll_break')">
                                        <span>布林带突破</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 评级和风险 -->
                            <div class="condition-category">
                                <div class="category-header">
                                    <span class="category-icon">⭐</span>
                                    <span class="category-name">评级风险</span>
                                </div>
                                <div class="category-items">
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('rating_change', 'rating_upgrade') }"
                                        @click="toggleCondition('rating_change', 'rating_upgrade')">
                                        <span>评级上调</span>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('rating_change', 'rating_downgrade') }"
                                        @click="toggleCondition('rating_change', 'rating_downgrade')">
                                        <span>评级下调</span>
                                    </div>
                                    <div class="condition-chip"
                                        :class="{ active: isConditionSelected('risk_alert', 'risk_abnormal') }"
                                        @click="toggleCondition('risk_alert', 'risk_abnormal')">
                                        <span>风险异常</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 选中条件摘要 -->
                    <div class="selected-summary" v-if="getSelectedConditionsCount() > 0">
                        <div class="summary-header">
                            <span class="summary-title">📋 已选择 {{ getSelectedConditionsCount() }} 个提醒条件</span>
                            <el-button size="small" @click="clearAllConditions" text type="danger">
                                清空
                            </el-button>
                        </div>
                        <div class="summary-tags">
                            <el-tag v-for="preview in getBatchPreview()" :key="preview.id" closable
                                @close="removeSelectedCondition(preview)" class="summary-tag">
                                {{ preview.icon }} {{ preview.shortText }}
                            </el-tag>
                        </div>
                    </div>
                </div>

                <!-- 当前活跃提醒列表 -->
                <div v-if="activeReminders.length > 0" class="active-reminders-section">
                    <h4>🔔 当前活跃提醒</h4>
                    <div class="reminders-list">
                        <div v-for="reminder in activeReminders.filter(r => r.isActive)" :key="reminder.id"
                            class="reminder-item">
                            <div class="reminder-info">
                                <span class="reminder-stock">{{ reminder.stockName }}</span>
                                <span class="reminder-desc">{{ getReminderDescription(reminder) }}</span>
                                <span class="reminder-time">{{ reminder.createdAt }}</span>
                            </div>
                            <el-button size="small" type="danger" @click="removeReminder(reminder.id)"
                                class="remove-btn">删除</el-button>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleReminderCancel">取消</el-button>
                    <el-button type="primary" @click="handleReminderConfirm">确认设置</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 版权信息 -->
        <div class="copyright-footer" v-show="!isChatMode && (!isMobileView || !isWechatEnv)">
            <div class="copyright-content">
                <p>&copy; 2024 上海九方云智能科技有限公司 版权所有</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import { useChatHistoryStore } from '../store/chatHistory';
import { User, Lock, ArrowDown, ArrowUp, Plus, Edit, Delete, QuestionFilled } from '@element-plus/icons-vue';
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
import ChatHistory from '../components/ChatHistory.vue';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import StockList from '../components/StockList.vue';
import MobileStockList from '../components/MobileStockList.vue';
import { getStockListConfig } from '../config/stockListConfig';
import { recommendStock, api } from '@/api/api';
import { riskOptions } from '@/config/userPortrait';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const router = useRouter();
const userStore = useUserStore();
const chatHistoryStore = useChatHistoryStore();
const inputMessage = ref('');
const chatHistory = ref([]);
const chatHistoryRef = ref(null);
const isChatMode = ref(false); // 控制是否进入聊天模式
const showUserProfile = ref(false); // 控制是否显示个人中心
const showRecordsCenter = ref(false); // 控制是否显示记录中心
const showQuantReminderDialog = ref(false); // 控制量化分析提醒对话框
const currentReminderMessage = ref(null); // 当前设置提醒的消息
const reminderForm = ref({
    type: 'overall_score', // 量化分析相关的提醒类型
    condition: 'score_above', // 对应的触发条件
    value: '',
    stockCode: '',
    stockName: ''
});
const activeReminders = ref([]); // 活跃的提醒列表

// 当前量化分析结果（模拟数据，实际应该从量化分析结果中提取）
const currentQuantAnalysis = ref({
    overallScore: '7.8',
    signalStrength: '强',
    buySignalScore: '85',
    rating: 'A级',
    technicalIndicators: {
        macd: { dif: 1.25, dea: 0.89, status: '金叉' },
        rsi: { value: 65.2, status: '强势区间' },
        boll: { status: '突破上轨' },
        kdj: { k: 78, d: 65, j: 85, status: '多头排列' }
    },
    riskMetrics: {
        volatility: 28.5,
        maxDrawdown: 15.2,
        sharpeRatio: 1.35,
        var95: 2.1
    }
});

// 批量提醒条件设置
const reminderConditions = ref({
    overall_score: {
        conditions: [],
        values: {
            score_above: '',
            score_below: '',
            score_change: ''
        }
    },
    buy_signal: {
        conditions: [],
        values: {
            signal_above: '',
            signal_below: ''
        }
    },
    technical: {
        conditions: []
    },
    rating_change: {
        conditions: [],
        values: {
            rating_reach: ''
        }
    },
    risk_alert: {
        conditions: []
    }
});

// 计算提醒对话框宽度
const reminderDialogWidth = computed(() => {
    if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 480) return '95%';
        if (width < 768) return '90%';
        if (width < 1024) return '500px';
        return '600px';
    }
    return '500px';
});
const showChatShortcuts = ref(false); // 控制聊天模式下的快捷操作显示
const isMobileView = ref(false); // 检测是否为移动端视图

// 移动端菜单相关
const showMobileMenu = ref(false); // 控制移动端用户菜单显示

// 聊天历史相关
const showChatHistory = ref(false); // 控制聊天历史面板显示
const chatHistoryComponentRef = ref(null);

// 快捷操作自定义相关
const customizeDialogVisible = ref(false);

// 预置问题组轮换
const currentExampleGroupIndex = ref(0);

// 快捷操作配置 - 改为响应式数据
const defaultShortcuts = ref([
    {
        id: 'smart_review',
        icon: '📊',
        title: '智能复盘',
        shortTitle: '复盘',
        description: '智能分析市场表现和投资策略',
        action: () => setSuggestionAndSend(`智能复盘：请帮我进行全面的智能投资复盘分析，包括：

1. 市场整体走势分析（主要指数表现、板块轮动）
2. 我的投资组合表现分析和风险评估
3. 基于AI算法的策略优化建议
4. 市场情绪和技术指标综合分析
5. 个性化的下一步操作建议
6. 风险预警和机会识别
7. 智能资产配置优化方案

请结合我的投资风格和市场大数据，给出专业的智能化复盘建议。`),
        isDefault: true,
        isActive: true
    },
    {
        id: 'watchlist',
        icon: '⭐',
        title: '自选股',
        shortTitle: '自选',
        description: '查看和管理我的自选股票',
        action: () => handleWatchlistView(),
        isDefault: true,
        isActive: true
    },
    {
        id: 'smart_recommendation',
        icon: '📈',
        title: '智能荐股',
        shortTitle: '荐股',
        description: '基于AI算法推荐优质股票',
        action: () => handleSmartRecommendation(),
        isDefault: true,
        isActive: true
    },
    {
        id: 'news_update',
        icon: '📄',
        title: '资讯推送',
        shortTitle: '资讯',
        description: '获取最新市场资讯和重要公告',
        action: () => handleNewsUpdate(),
        isDefault: true,
        isActive: true
    },
    {
        id: 'asset_analysis',
        icon: '💼',
        title: '我的资产',
        shortTitle: '资产',
        description: '查看投资组合和账户分析',
        action: () => handleAssetAnalysis(),
        isDefault: true,
        isActive: true
    }
]);

// 当前激活的快捷操作
const activeShortcuts = ref([]);

// 初始化快捷操作
const initializeShortcuts = () => {
    const result = [];

    // 加载默认快捷操作状态
    const savedStates = localStorage.getItem('defaultShortcutStates');
    const states = savedStates ? JSON.parse(savedStates) : {};

    // 添加激活的默认快捷操作
    const activeDefaultShortcuts = defaultShortcuts.value.filter(s => {
        if (states.hasOwnProperty(s.id)) {
            s.isActive = states[s.id];
        }
        return s.isActive;
    });
    result.push(...activeDefaultShortcuts);

    // 添加激活的自定义快捷操作
    const savedCustomShortcuts = localStorage.getItem('customShortcuts');
    if (savedCustomShortcuts) {
        const customShortcuts = JSON.parse(savedCustomShortcuts);
        const activeCustomShortcuts = customShortcuts
            .filter(s => s.isActive)
            .map(shortcut => ({
                ...shortcut,
                action: () => setSuggestionAndSend(shortcut.prompt)
            }));
        result.push(...activeCustomShortcuts);
    }

    activeShortcuts.value = result;
};


const exampleGroups = [
    [
        '我有10万元闲钱，月收入8千，适合什么投资组合？',
        '帮我制定一个3年期的投资计划，目标年化收益12%',
        '对比分析股票基金和指数基金，哪个更适合新手？',
        '推荐几只适合定投的基金，风险等级中等偏低'
    ],
    [
        '分析宁德时代和比亚迪的竞争优势，哪个更值得长期持有？',
        '白酒板块中茅台、五粮液、泸州老窖如何选择？',
        '银行股现在估值如何？招商银行vs平安银行投资价值对比',
        '医药板块恒瑞医药、药明康德近期表现分析'
    ],
    [
        '美联储加息对A股影响如何？现在应该加仓还是减仓？',
        '如何利用技术指标判断大盘3000点支撑是否有效？',
        '我持有的股票跌了20%，是止损还是补仓？具体策略',
        '制定一个动态仓位管理策略，根据市场情况调整'
    ],
    [
        '巴菲特价值投资法则在A股是否适用？具体如何操作？',
        '如何用DCF模型给贵州茅台估值？当前价格是否合理？',
        '筛选ROE连续5年超15%的优质股票，并分析投资逻辑',
        '长期持有腾讯、阿里巴巴还是短线操作更赚钱？'
    ],
    [
        '港股通投资腾讯、美团的优势和风险分析',
        '对比A股、港股、美股的苹果公司，哪个更有投资价值？',
        '人民币贬值背景下，如何配置海外资产对冲风险？',
        'REITs基金收益率4-6%，与银行理财产品如何选择？'
    ]
];

const currentExampleGroup = computed(() => {
    return exampleGroups[currentExampleGroupIndex.value];
});

// 个性化引导流程控制
const showOnboarding = ref(false); // 是否显示引导流程

// 登录相关
const loginDialogVisible = ref(false);
const isRegisterMode = ref(false);

// 账号找回相关
const recoveryDialogVisible = ref(false);

// 投资偏好设置
const preferencesDialogVisible = ref(false);
const preferencesFormRef = ref(null);
const preferencesLoading = ref(false);

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
const buyDialogVisible = ref(false);
const selectedStock = ref(null);
const buyLoading = ref(false);
const buyFormRef = ref(null);
const activeTab = ref('portfolio');
const tradeType = ref('buy'); // 'buy' 或 'sell'
const buyForm = reactive({
    quantity: 100,
    price: 0,
    orderType: 'limit' // limit: 限价, market: 市价
});

// AI委托交易相关
const showAITradingDialog = ref(false);
const selectedStockForAITrading = ref(null);





const showLogin = (isRegister) => {
    isRegisterMode.value = isRegister;
    loginDialogVisible.value = true;
};

// 处理登录成功事件
const handleLoginSuccess = ({ isNewUser, userInfo }) => {
    if (isNewUser) {
        // 新用户注册成功，显示引导流程
        setTimeout(() => {
            showOnboarding.value = true;
        }, 500);
    } else {
        // 老用户登录成功，直接进入主界面，不进入引导流程
        dismissGuide();
        // 如果没有偏好设置，可以通过菜单中的"偏好设置"手动设置
        ElMessage.success('欢迎回来！');
    }
};

// 显示找回密码对话框
const showPasswordRecovery = () => {
    recoveryDialogVisible.value = true;
};

// 从找回密码返回登录
const backToLogin = () => {
    recoveryDialogVisible.value = false;
    loginDialogVisible.value = true;
};

// 处理找回密码成功
const handleRecoverySuccess = () => {
    loginDialogVisible.value = true;
};



const handleCommand = async (command) => {
    console.log('Menu command clicked:', command); // 添加调试日志
    switch (command) {
        case 'profile':
            showUserProfile.value = true;
            break;
        case 'settings':
            console.log('Setting preferencesDialogVisible to true'); // 添加调试日志
            console.log('preferencesDialogVisible before:', preferencesDialogVisible.value); // 查看之前的值
            preferencesDialogVisible.value = true;
            console.log('preferencesDialogVisible after:', preferencesDialogVisible.value); // 查看之后的值
            break;
        case 'records':
            showRecordsCenter.value = true;
            break;
        case 'logout':
            try {
                // 显示确认对话框
                await ElMessageBox.confirm(
                    '确定要退出登录吗？退出后将清除所有本地数据。',
                    '退出登录',
                    {
                        confirmButtonText: '确定退出',
                        cancelButtonText: '取消',
                        type: 'warning',
                        center: true
                    }
                );

                // 用户确认退出，执行退出操作
                userStore.logout();

                // 重置页面状态
                chatHistory.value = [];
                inputMessage.value = '';
                isChatMode.value = false;
                showUserProfile.value = false;
                showRecordsCenter.value = false;

                // 显示退出成功提示
                ElMessage.success('已成功退出登录');

                // 跳转到主页面（初始状态）
                await router.push('/');

                // 页面刷新，确保完全重置状态
                setTimeout(() => {
                    window.location.reload();
                }, 500);

            } catch (error) {
                // 用户取消退出，不执行任何操作
                console.log('用户取消退出登录');
            }
            break;
    }
};

// 移动端用户菜单相关方法
const showMobileUserMenu = () => {
    showMobileMenu.value = true;
};

const hideMobileUserMenu = () => {
    showMobileMenu.value = false;
};

const handleMobileCommand = async (command) => {
    // 先关闭菜单
    hideMobileUserMenu();

    // 稍作延迟，让关闭动画完成
    setTimeout(() => {
        handleCommand(command);
    }, 200);
};

const sendMessage = async () => {
    if (!inputMessage.value.trim()) return;

    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    const message = inputMessage.value;
    inputMessage.value = '';



    // 发送消息后切换到聊天模式
    isChatMode.value = true;

    // 如果是新聊天，创建聊天记录
    if (!chatHistoryStore.currentChatId) {
        chatHistoryStore.createNewChat();
    }

    // 添加用户消息
    const userMessage = { role: 'user', content: message };
    chatHistory.value.push(userMessage);
    chatHistoryStore.addMessageToCurrentChat(userMessage);

    // 先插入一个空的AI回复
    const aiMessage = { role: 'assistant', content: '' };
    chatHistory.value.push(aiMessage);
    chatHistoryStore.addMessageToCurrentChat(aiMessage);

    await nextTick();
    scrollToBottom();

    try {
            let aiContent = '';
            const abortController = new AbortController(); // 用于取消请求
            fetchEventSource(`${api.devPrefix}${api.recommendStock}?userInput=${encodeURIComponent(message)}`, {
                method: 'GET', // GET 是默认方法，可省略
                headers: {
                    'Content-Type': 'text/event-stream', // 设置内容类型为 SSE
                    'Authorization': `${userStore.token}` // 添加用户令牌
                },
                signal: abortController.signal, // 绑定取消信号

                // 添加重试配置
                retryInterval: 0,       // 不重试
                backoffMultiplier: 0,    // 退避系数

                onopen: async (response) => {
                    // 连接建立时触发
                    if (response.ok) {
                        console.log('连接成功');
                    } else {
                        throw new Error(`服务器错误: ${response.status}`);
                    }
                },
                onmessage: (event) => {
                    // 处理每条消息
                    try {
                        console.log('智能荐股：收到数据:', event.data);
                        let data = event.data;
                        // 如果 data 是空格，则新增一个空格（SSE 协议规范：data: 后的第一个空格是固定分隔符，一定会被丢弃）
                        if (data.trim().length === 0) {
                            data += ' ';
                        }
                        aiContent += data;
                        aiMessage.content = aiContent;

                        chatHistory.value[chatHistory.value.length - 1].content = aiContent;
                        // 这里强制替换数组，确保响应式
                        chatHistory.value = [...chatHistory.value];
                        // 使用 requestAnimationFrame 优化滚动
                        requestAnimationFrame(() => {
                            scrollToBottom();
                        });
                    } catch (err) {
                        console.error('解析错误:', err);
                    }
                },
                onclose: () => {
                    console.log('连接关闭');
                },
                onerror: (err) => {
                    // 错误处理（网络错误、解析异常等）
                    console.error('发生错误:', err);
                    abortController.abort(); // 取消请求
                    aiMessage.content += '\n\n[服务器繁忙，已终止]';
                    throw err; // 重新抛出以终止流
                }
            });
    } catch (err) {
        aiMessage.content = '响应失败，请重试';
        chatHistory.value = [...chatHistory.value];
    }
    if (isMobileView.value) {
        console.log('准备调用fixMobileChatBox - sendMessage');
        setTimeout(() => {
            fixMobileChatBox(); // 确保输入框不被遮挡
            scrollToBottom();
        }, 100);
    }
};

const scrollToBottom = () => {
    if (chatHistoryRef.value) {
        // 移动端特殊处理：确保滚动到真正的底部
        const isMobile = window.innerWidth <= 768;
        let scrollTarget = chatHistoryRef.value.scrollHeight;

        if (isMobile) {
            // 移动端需要额外的偏移量来确保内容不被输入框遮挡
            const extraOffset = window.innerWidth <= 480 ? 50 : 60; // 减少额外偏移
            scrollTarget = chatHistoryRef.value.scrollHeight + extraOffset;
        }

        // 使用平滑滚动，提升用户体验
        chatHistoryRef.value.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });

        // 备用方案：如果smooth不支持，使用直接设置
        setTimeout(() => {
            if (chatHistoryRef.value) {
                chatHistoryRef.value.scrollTop = scrollTarget;
            }
        }, 100);

        // 额外的确保方案：再次检查并调整
        setTimeout(() => {
            if (chatHistoryRef.value && isMobile) {
                const currentScrollTop = chatHistoryRef.value.scrollTop;
                const maxScrollTop = chatHistoryRef.value.scrollHeight - chatHistoryRef.value.clientHeight;
                if (currentScrollTop < maxScrollTop) {
                    chatHistoryRef.value.scrollTop = maxScrollTop;
                }
            }
        }, 300);
    }
};

// 滚动到顶部的函数
const scrollToTop = () => {
    if (chatHistoryRef.value) {
        chatHistoryRef.value.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        console.log('聊天区域已滚动到顶部');
    }
};

// 滚动条显示控制
let scrollTimer = null;
const handleScroll = () => {
    if (chatHistoryRef.value) {
        // 添加滚动中的类名
        chatHistoryRef.value.classList.add('scrolling');

        // 清除之前的定时器
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }

        // 设置定时器，滚动停止后1.5秒隐藏滚动条
        scrollTimer = setTimeout(() => {
            if (chatHistoryRef.value) {
                chatHistoryRef.value.classList.remove('scrolling');
            }
        }, 1500);
    }
};

const createNewChat = () => {
    chatHistory.value = [];
    inputMessage.value = '';
    isChatMode.value = false; // 退出聊天模式，回到初始状态
    chatHistoryStore.clearCurrentChat(); // 清空聊天历史store中的当前聊天

    // 确保移动端布局重置
    if (isMobileView.value) {
        nextTick(() => {
            setTimeout(() => {
                resetMobileLayout();
            }, 100);
        });
    }

    ElMessage.success('已创建新聊天');
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

// 监听聊天模式变化 - 简化处理，参照微信浏览器
watch(isChatMode, (newVal) => {
    console.log('isChatMode变化:', { newVal, isMobileView: isMobileView.value });

    if (newVal) {
        // 进入聊天模式
        nextTick(() => {
            scrollToBottom();
            updateChatHistoryHeight();

            // 移动端处理
            if (isMobileView.value) {
                console.log('准备调用fixMobileChatBox - isChatMode监听器');
                setTimeout(() => {
                    fixMobileChatBox(); // 确保输入框不被遮挡
                    handleMobileKeyboard(); // 键盘监听
                }, 100);
            }
        });
    } else {
        // 退出聊天模式，恢复初始状态
        nextTick(() => {
            if (isMobileView.value) {
                setTimeout(() => {
                    resetMobileLayout();
                }, 100);
            }
        });
    }
});

// 语音输入相关状态
const isRecording = ref(false);
const recognition = ref(null);
const voiceTimer = ref(null);
const recordingDuration = ref(0);

// 检测是否为微信内置浏览器
const isWechatBrowser = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
};

// 微信语音识别相关
const wxVoiceLocalId = ref('');
const isWxVoiceSupported = ref(false);
const isWechatEnv = ref(false); // 微信环境检测

// 问候语功能
const getGreetingTitle = () => {
    const hour = new Date().getHours();
    const userName = userStore.userInfo?.nickname;
    const greeting = hour < 6 ? '夜深了' :
        hour < 9 ? '早上好' :
            hour < 12 ? '上午好' :
                hour < 14 ? '中午好' :
                    hour < 18 ? '下午好' :
                        hour < 22 ? '晚上好' : '夜深了';

    if (userName) {
        return `${greeting}，${userName}`;
    }
    return `${greeting}，我是智投小助`;
};

const getGreetingSubtitle = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '深夜时分也在关注投资，很专业！';
    if (hour < 9) return '开始新的投资之旅吧';
    if (hour < 12) return '今天的市场如何？一起来分析';
    if (hour < 14) return '午间休息，回顾一下投资情况';
    if (hour < 18) return '下午时光，继续投资分析';
    if (hour < 22) return '晚间总结时间，看看今日收获';
    return '夜深了，适度休息也很重要哦';
};

// 初始化微信JS-SDK语音功能
const initWechatVoice = () => {
    if (isWechatBrowser() && typeof wx !== 'undefined') {
        try {
            // 检查微信JS-SDK是否可用
            wx.checkJsApi({
                jsApiList: ['startRecord', 'stopRecord', 'translateVoice'],
                success: function (res) {
                    if (res.checkResult.startRecord && res.checkResult.stopRecord && res.checkResult.translateVoice) {
                        isWxVoiceSupported.value = true;
                        console.log('微信语音识别功能可用');
                    }
                }
            });
        } catch (error) {
            console.log('微信JS-SDK未配置或不可用');
        }
    }
};

// 微信开始录音
const startWechatVoiceRecord = () => {
    if (!isWxVoiceSupported.value) {
        ElMessage.error('微信语音功能不可用，请确保在微信中打开并配置了JS-SDK');
        return;
    }

    wx.startRecord({
        success: function () {
            isRecording.value = true;
            startRecordingTimer();
            ElMessage.success('🎤 开始微信语音输入，请说话...');
        },
        cancel: function () {
            ElMessage.info('用户取消录音');
            stopRecording();
        }
    });
};

// 微信停止录音并识别
const stopWechatVoiceRecord = () => {
    if (!isWxVoiceSupported.value) return;

    wx.stopRecord({
        success: function (res) {
            wxVoiceLocalId.value = res.localId;

            // 识别语音
            wx.translateVoice({
                localId: wxVoiceLocalId.value,
                isShowProgressTips: 1,
                success: function (res) {
                    const result = res.translateResult;
                    if (result && result.trim()) {
                        // 更新输入框内容
                        const currentValue = inputMessage.value.trim();
                        if (currentValue) {
                            inputMessage.value = currentValue + ' ' + result.trim();
                        } else {
                            inputMessage.value = result.trim();
                        }
                        ElMessage.success(`语音识别完成: "${result.substring(0, 20)}${result.length > 20 ? '...' : ''}"`);
                    } else {
                        ElMessage.warning('未识别到语音内容，请重试');
                    }
                    stopRecording();
                },
                fail: function (res) {
                    ElMessage.error('语音识别失败，请重试');
                    stopRecording();
                }
            });
        },
        fail: function (res) {
            ElMessage.error('录音失败，请重试');
            stopRecording();
        }
    });
};

// 初始化语音识别
const initSpeechRecognition = () => {
    // 微信内置浏览器不支持语音识别
    if (isWechatBrowser()) {
        console.log('微信内置浏览器不支持语音识别');
        return false;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition.value = new SpeechRecognition();

            // 配置语音识别参数
            recognition.value.continuous = true;
            recognition.value.interimResults = true;
            recognition.value.lang = 'zh-CN';
            recognition.value.maxAlternatives = 1;

            // 识别结果处理
            recognition.value.onresult = (event) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }

                // 更新输入框内容
                if (finalTranscript) {
                    const cleanedText = finalTranscript.trim();
                    const currentValue = inputMessage.value.trim();
                    if (currentValue) {
                        inputMessage.value = currentValue + ' ' + cleanedText;
                    } else {
                        inputMessage.value = cleanedText;
                    }
                }
            };

            // 识别开始
            recognition.value.onstart = () => {
                console.log('语音识别开始');
                startRecordingTimer();
            };

            // 识别结束
            recognition.value.onend = () => {
                console.log('语音识别结束');
                stopRecording();
            };

            // 识别错误处理
            recognition.value.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                let errorMessage = '语音识别失败';

                switch (event.error) {
                    case 'no-speech':
                        errorMessage = '未检测到语音，请重新尝试';
                        break;
                    case 'audio-capture':
                        errorMessage = '无法访问麦克风，请检查权限设置';
                        break;
                    case 'not-allowed':
                        errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
                        break;
                    case 'network':
                        errorMessage = '网络连接异常，请检查网络后重试';
                        break;
                    case 'language-not-supported':
                        errorMessage = '不支持中文语音识别';
                        break;
                }

                ElMessage.error(errorMessage);
                stopRecording();
            };

            return true;
        } catch (error) {
            console.error('初始化语音识别失败:', error);
            return false;
        }
    }
    return false;
};

// 开始录音计时
const startRecordingTimer = () => {
    recordingDuration.value = 0;
    voiceTimer.value = setInterval(() => {
        recordingDuration.value++;

        // 15秒时提示用户
        if (recordingDuration.value === 15) {
            ElMessage.info('💡 继续说话，或点击麦克风按钮结束录音');
        }

        // 45秒时警告用户即将停止
        if (recordingDuration.value === 45) {
            ElMessage.warning('⏰ 录音即将结束，还有15秒');
        }

        // 最长录音60秒
        if (recordingDuration.value >= 60) {
            ElMessage.info('⏱️ 录音时间已达上限，自动停止');
            stopVoiceRecording();
        }
    }, 1000);
};

// 停止录音
const stopRecording = () => {
    isRecording.value = false;
    if (voiceTimer.value) {
        clearInterval(voiceTimer.value);
        voiceTimer.value = null;
    }
    recordingDuration.value = 0;
};

// 开始语音录音
const startVoiceRecording = () => {
    // 微信浏览器优先使用微信语音功能
    if (isWechatBrowser()) {
        if (isWxVoiceSupported.value) {
            startWechatVoiceRecord();
        } else {
            // 微信环境下的提示已在onVoiceClick中处理
            console.log('微信环境：语音功能需要JS-SDK配置');
        }
        return;
    }

    if (!recognition.value) {
        ElMessage.error('您的浏览器不支持语音识别功能，建议使用Chrome浏览器');
        return;
    }

    try {
        isRecording.value = true;
        recognition.value.start();
        ElMessage.success('🎤 开始语音输入，请说话...');
    } catch (error) {
        console.error('启动语音识别失败:', error);
        ElMessage.error('启动语音识别失败，请重试');
        stopRecording();
    }
};

// 停止语音录音
const stopVoiceRecording = () => {
    // 微信浏览器使用微信语音功能
    if (isWechatBrowser() && isWxVoiceSupported.value) {
        stopWechatVoiceRecord();
        return;
    }

    if (recognition.value && isRecording.value) {
        recognition.value.stop();
    }
    stopRecording();
};

const onVoiceClick = () => {
    // 基本日志记录
    console.log('语音按钮点击');

    // 微信环境特殊处理
    if (isWechatBrowser()) {
        // 显示语音功能提示
        ElMessage({
            message: '💬 微信语音功能需要JS-SDK配置，当前暂不可用',
            type: 'warning',
            duration: 4000,
            showClose: true,
            dangerouslyUseHTMLString: false
        });

        return; // 微信环境下直接返回，不执行后续逻辑
    }

    if (isRecording.value) {
        stopVoiceRecording();
        ElMessage.info('🛑 语音输入已停止');
    } else {
        startVoiceRecording();
    }
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

// 更新聊天历史区域高度
const updateChatHistoryHeight = () => {
    const baseInputHeight = 200; // 基础输入区域高度
    const shortcutsHeight = 80; // 快捷操作区域高度

    const totalInputHeight = showChatShortcuts.value
        ? baseInputHeight + shortcutsHeight
        : baseInputHeight;

    // 设置CSS变量
    document.documentElement.style.setProperty('--input-area-height', `${totalInputHeight}px`);
};

// 检测移动端视图
const checkMobileView = () => {
    const newIsMobileView = window.innerWidth <= 768;
    console.log('Main移动端检测:', {
        windowWidth: window.innerWidth,
        isMobileView: newIsMobileView,
        previousValue: isMobileView.value
    });
    isMobileView.value = newIsMobileView;
};

// 移动端侧边栏状态管理
const sidebarRef = ref(null);

const toggleMobileSidebar = () => {
    console.log('toggleMobileSidebar被调用', {
        sidebarRef: sidebarRef.value,
        isMobileView: isMobileView.value
    });
    // 通过调用Sidebar组件的toggleSidebar方法来切换状态
    if (sidebarRef.value) {
        sidebarRef.value.toggleSidebar();
    } else {
        console.error('sidebarRef为空，无法调用toggleSidebar方法');
    }
};

// 移动端聊天框修复 - 使用visualViewport检测实际可视区域
const fixMobileChatBox = () => {
    console.log('fixMobileChatBox被调用', { isMobileView: isMobileView.value, isChatMode: isChatMode.value });

    // 只在移动端且聊天模式下才进行修复
    if (isMobileView.value && isChatMode.value) {
        nextTick(() => {
            const inputArea = document.querySelector('.input-area');
            const aiCard = document.querySelector('.ai-card');

            if (inputArea) {
                let bottomOffset = 0;

                // 检测浏览器类型和版本，提供更精确的兼容性处理
                const userAgent = navigator.userAgent.toLowerCase();
                const isAndroid = userAgent.includes('android');
                const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad');
                const isChrome = userAgent.includes('chrome') || userAgent.includes('crios'); // iOS Chrome使用CriOS
                const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('crios');
                const isFirefox = userAgent.includes('firefox') || userAgent.includes('fxios'); // iOS Firefox使用FxiOS
                const isWechat = userAgent.includes('micromessenger');

                // 更精确的iOS Chrome检测 - iOS Chrome的User Agent包含CriOS而不是Chrome
                const isIOSChrome = isIOS && (userAgent.includes('crios') || userAgent.includes('chrome'));
                const isIOSSafari = isIOS && isSafari;

                // 检测浏览器类型和版本，提供更精确的兼容性处理
                const uaInfo = navigator.userAgent.toLowerCase();

                // 使用visualViewport API检测实际可视区域
                if (window.visualViewport) {
                    const visualHeight = window.visualViewport.height;
                    const windowHeight = window.innerHeight;
                    bottomOffset = Math.max(0, windowHeight - visualHeight);

                    // 针对不同浏览器的特殊调整
                    if (isAndroid && isChrome && bottomOffset === 0) {
                        // Android Chrome可能需要额外的工具栏高度检测
                        const toolbarHeight = Math.max(0, window.screen.height - window.screen.availHeight - windowHeight);
                        if (toolbarHeight > 0) {
                            bottomOffset = Math.min(toolbarHeight, 80); // 限制最大高度
                        }
                    }

                    console.log('VisualViewport检测:', {
                        visualHeight,
                        windowHeight,
                        bottomOffset,
                        screenHeight: window.screen.height,
                        screenAvailHeight: window.screen.availHeight,
                        documentHeight: document.documentElement.clientHeight,
                        bodyHeight: document.body.clientHeight,
                        browser: { isAndroid, isIOS, isChrome, isSafari, isFirefox, isWechat, isIOSChrome, isIOSSafari },
                        userAgent: navigator.userAgent,
                        offsetTop: window.visualViewport.offsetTop,
                        offsetLeft: window.visualViewport.offsetLeft
                    });
                } else {
                    // 降级方案：根据浏览器类型提供不同的处理
                    const screenHeight = window.screen.height;
                    const windowHeight = window.innerHeight;

                    if (isWechat) {
                        // 微信浏览器通常不需要额外偏移
                        bottomOffset = 0;
                    } else if (isAndroid && isChrome) {
                        // Android Chrome 浏览器工具栏通常在56-72px
                        bottomOffset = Math.min(72, Math.max(0, screenHeight - windowHeight - 100));
                    } else if (isIOS && isSafari) {
                        // iOS Safari 工具栏高度通常在44-88px
                        bottomOffset = Math.min(88, Math.max(0, screenHeight - windowHeight - 150));
                    } else if (isFirefox) {
                        // Firefox 工具栏高度
                        bottomOffset = Math.min(60, Math.max(0, screenHeight - windowHeight - 80));
                    } else {
                        // 其他浏览器的通用处理
                        bottomOffset = Math.min(80, Math.max(0, screenHeight - windowHeight - 100));
                    }

                    console.log('降级检测:', {
                        screenHeight,
                        windowHeight,
                        bottomOffset,
                        screenAvailHeight: window.screen.availHeight,
                        documentHeight: document.documentElement.clientHeight,
                        bodyHeight: document.body.clientHeight,
                        browser: { isAndroid, isIOS, isChrome, isSafari, isFirefox, isWechat, isIOSChrome, isIOSSafari },
                        userAgent: navigator.userAgent
                    });
                }

                // 现在调整input-area的位置，ai-card会跟随父容器移动
                // 这样新建聊天按钮等所有内容都会一起移动
                if (inputArea) {
                    // 临时测试：强制设置一个固定偏移量来验证修复是否有效
                    let finalBottomOffset = bottomOffset;

                    // 微信浏览器特殊处理：始终不偏移
                    if (isWechat) {
                        finalBottomOffset = 0;
                        console.log('微信浏览器检测，强制使用底部位置 0px');
                    } else if (bottomOffset < 10) {
                        // 非微信浏览器且检测偏移量太小时，使用经验值
                        if (isIOS && isSafari) {
                            finalBottomOffset = 80; // iOS Safari 强制偏移
                        } else if (isIOS && isChrome) {
                            finalBottomOffset = 110; // iOS Chrome 需要更大的偏移量
                        } else if (isAndroid && isChrome) {
                            finalBottomOffset = 70; // Android Chrome 强制偏移
                        } else if (isChrome) {
                            finalBottomOffset = 60; // 桌面Chrome移动模式
                        } else {
                            finalBottomOffset = 50; // 其他浏览器默认偏移
                        }
                        console.log(`检测偏移量过小(${bottomOffset}px)，使用经验值: ${finalBottomOffset}px`);
                        console.log(`浏览器检测结果: iOS=${isIOS}, Chrome=${isChrome}, IOSChrome=${isIOSChrome}, Safari=${isSafari}`);
                    }

                    // 根据浏览器类型调整触发阈值
                    const threshold = isWechat ? -1 : 5; // 微信浏览器阈值设为-1，确保永远不触发偏移

                    if (finalBottomOffset > threshold) {
                        // 强制设置样式，确保优先级足够高
                        inputArea.style.cssText += `bottom: ${finalBottomOffset}px !important;`;
                        console.log(`已调整输入区域位置，底部偏移: ${finalBottomOffset}px (原始: ${bottomOffset}px, 阈值: ${threshold}px)`);
                        console.log(`输入区域当前bottom样式: ${inputArea.style.bottom}`);
                    } else {
                        inputArea.style.cssText += `bottom: 0px !important;`;
                        console.log(`输入区域使用默认底部位置 (偏移: ${finalBottomOffset}px < 阈值: ${threshold}px)`);
                    }

                    // 确保输入区域的其他关键样式
                    inputArea.style.setProperty('position', 'fixed', 'important');
                    inputArea.style.setProperty('left', '0', 'important');
                    inputArea.style.setProperty('right', '0', 'important');
                    inputArea.style.setProperty('z-index', '1000', 'important');
                }

                // input-area不需要特殊处理，保持其原有样式

                // 调试：检查ai-card的位置和样式
                if (aiCard) {
                    const aiCardStyles = window.getComputedStyle(aiCard);
                    const inputAreaRect = inputArea.getBoundingClientRect();
                    const aiCardRect = aiCard.getBoundingClientRect();

                    console.log('AI卡片调试信息:', {
                        aiCardPosition: aiCardStyles.position,
                        aiCardBottom: aiCardStyles.bottom,
                        aiCardTop: aiCardStyles.top,
                        inputAreaRect: {
                            top: inputAreaRect.top,
                            bottom: inputAreaRect.bottom,
                            height: inputAreaRect.height
                        },
                        aiCardRect: {
                            top: aiCardRect.top,
                            bottom: aiCardRect.bottom,
                            height: aiCardRect.height
                        }
                    });

                    // 检查ai-card是否有可能影响定位的样式
                    const problematicStyles = ['position', 'top', 'bottom', 'left', 'right', 'transform', 'margin-bottom'];
                    const aiCardComputedStyles = {};
                    problematicStyles.forEach(prop => {
                        aiCardComputedStyles[prop] = aiCardStyles.getPropertyValue(prop);
                    });
                    console.log('AI卡片样式检查:', aiCardComputedStyles);
                }
            }
        });
    }
};

// 处理下拉菜单命令
const handleDropdownCommand = (command) => {
    switch (command) {
        case 'yesterday-review':
            setSuggestionAndSend('昨日复盘：请帮我进行全面的交易复盘分析，包括：\n\n1. 昨日大盘走势分析（上证指数、深证成指、创业板指等主要指数表现）\n2. 热点板块轮动情况和资金流向分析\n3. 我的持仓股票昨日表现回顾和盈亏分析\n4. 昨日交易决策的得失总结（如有买卖操作）\n5. 市场情绪和技术面变化分析\n6. 今日操作建议和风险提示\n7. 需要关注的重要事件和数据发布\n\n请结合我的投资风格和持仓情况，给出专业的复盘建议。');
            break;
        case 'smart-recommendation':
            handleSmartRecommendation();
            break;
        case 'news-update':
            handleNewsUpdate();
            break;
        case 'asset-analysis':
            handleAssetAnalysis();
            break;
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

// 切换预置问题组
const switchExampleGroup = () => {
    currentExampleGroupIndex.value = (currentExampleGroupIndex.value + 1) % exampleGroups.length;
    ElMessage.success(`已切换到第${currentExampleGroupIndex.value + 1}组问题`);
};

// 聊天历史相关方法
const toggleChatHistory = () => {
    showChatHistory.value = !showChatHistory.value;
};

const closeChatHistory = () => {
    showChatHistory.value = false;
};

const handleLoadChat = (chat) => {
    // 加载选中的聊天记录
    chatHistory.value = [...chat.messages];
    chatHistoryStore.loadChat(chat.id);
    isChatMode.value = chatHistory.value.length > 0;

    nextTick(() => {
        scrollToBottom();
    });

    ElMessage.success('聊天记录已加载');
};

const handleCreateNewChat = () => {
    // 如果当前有聊天内容，先保存到历史记录
    if (chatHistory.value.length > 0 && !chatHistoryStore.currentChatId) {
        const chatId = chatHistoryStore.createNewChat(chatHistory.value);
        ElMessage.success('当前聊天已保存到历史记录');
    }

    // 创建新聊天
    createNewChat();
};

const handleRenameChat = (chatId, newTitle) => {
    chatHistoryStore.renameChat(chatId, newTitle);
};

const handleDeleteChat = (chatId) => {
    chatHistoryStore.deleteChat(chatId);

    // 如果删除的是当前聊天，清空界面
    if (chatHistoryStore.currentChatId === chatId) {
        chatHistory.value = [];
        isChatMode.value = false;
    }
};

// 智能荐股功能
const handleSmartRecommendation = async () => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

    // 构建智能荐股消息
    const userPreferences = userStore.userInfo?.preferences;
    let message = '智能荐股：根据我的投资偏好推荐优质股票\n';
    let userPreferencesText = '';
    if (userPreferences) {
        userPreferencesText += `我的投资偏好：
        - 风险偏好：${getRiskLevelText(userPreferences.riskLevel)} 
        - 投资经验：${getExperienceText(userPreferences.experience)} 
        - 关注板块：${getFocusIndustryText(userPreferences.sectors?.categories)}`;
    }

    // 先显示初始消息
    const processingMessage = { role: 'user', content: message.concat(userPreferencesText) };
    const processingMessage1 = { role: 'assistant', content: '正在为您分析市场数据，请等待片刻......' };
    chatHistory.value.push(processingMessage, processingMessage1);

    const mockRes = await mockApi.sendMessage(message);

    let response = await recommendStock({ pageNo: 1, pageSize: 3 });
    if (response && response.data && response.data.success) {
        let stockList = [];
        let data = response.data.data || [];
        data.forEach(item => {
            stockList.push({
                name: item.name,
                code: item.code,
                recommendIndex: item.recommendScore,
                recommendLevel: item.recommendLevel,
                price: item.latestPrice, // 当前价格
                change: item.change || 0, // 涨跌额
                changePercent: (item.rise || 0).concat('%'), // 涨跌幅
                targetPrice: item.targetPrice,
                riskLevel: item.riskLevel,
                industry: item.industry,
                reason: item.recommendReason,
            });
        });
        stockList.sort((a, b) => b.recommendIndex - a.recommendIndex);

        console.log('智能荐股API响应:', stockList);

        // 构建荐股消息内容
        const stockListMessage = {
            content: mockRes.data.content,
            hasStockInfo: stockList.length > 0,
            isRecommendation: stockList.length > 0,
            role: 'assistant',
            stockList: stockList
        };

        // 为荐股消息添加持久化标识和唯一ID
        const recommendationMessage = {
            ...stockListMessage,
            isPersistent: true,
            messageId: `recommendation-${Date.now()}`,
            timestamp: new Date().toISOString()
        };

        chatHistory.value.push(
            recommendationMessage
        );

        await nextTick();
        scrollToBottom();
        ElMessage.success('已为您生成个性化股票推荐');

        // 使用快捷操作后自动收起
        if (showChatShortcuts.value) {
            setTimeout(() => {
                showChatShortcuts.value = false;
            }, 300);
        }
    } else {
        ElMessage.error('智能荐股失败，请稍后重试');
    }
};

// 资讯推送功能
const handleNewsUpdate = async () => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

    const message = '资讯推送：今日重要财经新闻和市场动态';
    const res = await mockApi.sendMessage(message);

    chatHistory.value.push(
        { role: 'user', content: message },
        res.data
    );

    await nextTick();
    scrollToBottom();
    ElMessage.success('已为您推送最新财经资讯');

    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
        setTimeout(() => {
            showChatShortcuts.value = false;
        }, 300);
    }
};

// 我的资产分析功能
const handleAssetAnalysis = async () => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

    // 如果用户没有持仓，添加一些示例数据用于演示
    if (userStore.portfolio.length === 0) {
        // 添加示例持仓数据
        const samplePortfolio = [
            { code: '000001', name: '平安银行', quantity: 1000, avgPrice: 11.50, industry: '银行', buyTime: '2024-01-10T09:30:00.000Z' },
            { code: '600036', name: '招商银行', quantity: 500, avgPrice: 34.20, industry: '银行', buyTime: '2024-01-08T10:15:00.000Z' },
            { code: '000858', name: '五粮液', quantity: 200, avgPrice: 155.80, industry: '食品饮料', buyTime: '2024-01-05T14:20:00.000Z' },
            { code: '300750', name: '宁德时代', quantity: 100, avgPrice: 180.50, industry: '新能源', buyTime: '2024-01-03T11:45:00.000Z' }
        ];

        userStore.portfolio.push(...samplePortfolio);
        localStorage.setItem('portfolio', JSON.stringify(userStore.portfolio));
        ElMessage.info('已为您添加示例持仓数据');
    }

    // 构建资产分析消息，包含用户的实际资产数据
    const totalAssets = userStore.getTotalAssets();
    const portfolioCount = userStore.portfolio.length;
    const watchlistCount = userStore.watchlist.length;

    // 计算持仓盈亏
    const portfolioData = userStore.portfolio.map(position => {
        const currentPrice = getCurrentStockPrice(position.code); // 获取当前价格
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
            profitPercent: parseFloat(profitPercent)
        };
    });

    // 计算总盈亏
    const totalProfit = portfolioData.reduce((sum, item) => sum + item.profit, 0);
    const totalCostValue = portfolioData.reduce((sum, item) => sum + item.costValue, 0);
    const totalProfitPercent = totalCostValue > 0 ? ((totalProfit / totalCostValue) * 100).toFixed(2) : '0.00';

    // 计算持仓市值
    const portfolioValue = portfolioData.reduce((sum, item) => sum + item.marketValue, 0);

    // 创建资产分析消息对象
    const assetAnalysisMessage = {
        role: 'assistant',
        content: '',
        hasAssetInfo: true,
        assetData: {
            totalAssets: totalAssets.toFixed(2),
            balance: userStore.balance.toFixed(2),
            portfolioValue: portfolioValue.toFixed(2),
            portfolioCount,
            watchlistCount,
            totalProfit: totalProfit.toFixed(2),
            totalProfitPercent: parseFloat(totalProfitPercent),
            portfolioData,
            watchlistData: userStore.watchlist.slice(0, 8).map(stock => generateWatchlistStockData(stock)) // 显示前8只自选股，包含完整详情
        },
        isPersistent: true,
        messageId: `asset-analysis-${Date.now()}`,
        timestamp: new Date().toISOString()
    };

    chatHistory.value.push(
        { role: 'user', content: '我的资产：查看股票账户详情' },
        assetAnalysisMessage
    );

    await nextTick();
    scrollToBottom();
    ElMessage.success('已为您生成股票账户报告');

    // 使用快捷操作后自动收起
    if (showChatShortcuts.value) {
        setTimeout(() => {
            showChatShortcuts.value = false;
        }, 300);
    }
};

// 自选股查看功能
const handleWatchlistView = async () => {
    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
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

// 获取股票当前价格（模拟数据）
const getCurrentStockPrice = (stockCode) => {
    const mockPrices = {
        '000001': 12.68,
        '000858': 52.30,
        '000002': 24.15,
        '300750': 485.20,
        '600519': 1680.50,
        '000700': 15.80,
        '600036': 35.67,
        '002415': 28.90
    };
    return mockPrices[stockCode] || 10.00;
};

// 生成完整的自选股数据（包含详情信息）
const generateWatchlistStockData = (stock) => {
    const currentPrice = getCurrentStockPrice(stock.code);
    const yesterdayPrice = currentPrice * (1 - (Math.random() * 0.1 - 0.05));
    const changeAmount = currentPrice - yesterdayPrice;
    const changePercent = ((changeAmount / yesterdayPrice) * 100).toFixed(2);

    // 生成目标价格（当前价格的1.1-1.3倍）
    const targetPriceMultiplier = 1.1 + Math.random() * 0.2;
    const targetPrice = (currentPrice * targetPriceMultiplier).toFixed(2);

    // 计算预期收益
    const expectedReturnPercent = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);

    // 根据股票代码生成风险等级
    const riskLevels = ['低风险', '中低风险', '中风险', '中高风险', '高风险'];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

    // 根据股票代码生成推荐等级
    const recommendLevels = ['强烈推荐', '推荐', '中性', '谨慎', '不推荐'];
    const recommendLevel = recommendLevels[Math.floor(Math.random() * recommendLevels.length)];

    return {
        ...stock,
        price: stock.price || currentPrice.toFixed(2),
        change: stock.change || (changeAmount >= 0 ? `+${changeAmount.toFixed(2)}` : changeAmount.toFixed(2)),
        changePercent: stock.changePercent || (parseFloat(changePercent) >= 0 ? `+${changePercent}%` : `${changePercent}%`),
        currentPrice: currentPrice.toFixed(2),
        changeAmount: changeAmount.toFixed(2),
        changePct: parseFloat(changePercent),
        // 详情信息字段
        targetPrice: targetPrice,
        expectedReturn: `${expectedReturnPercent}%`,
        riskLevel: riskLevel,
        recommendLevel: recommendLevel,
        industry: stock.industry || '未分类'
    };
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



// 格式化货币显示
const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toFixed(2);
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
    
    chatHistory.value.push(
        { role: 'assistant', content: `正在为您量化分析【${stockInfo.name}(${stockInfo.code})】，请等待片刻......` },
    );

    try {
            let aiContent = '';
            const abortController = new AbortController(); // 用于取消请求
            fetchEventSource(`${api.devPrefix}${api.analyzeStock}?stock=${encodeURIComponent(stockInfo.code)}`, {
                method: 'GET', // GET 是默认方法，可省略
                headers: {
                    'Content-Type': 'text/event-stream', // 设置内容类型为 SSE
                    'Authorization': `${userStore.token}` // 添加用户令牌
                },
                signal: abortController.signal, // 绑定取消信号

                // 添加重试配置
                retryInterval: 0,       // 不重试
                backoffMultiplier: 0,    // 退避系数

                onopen: async (response) => {
                    // 连接建立时触发
                    if (response.ok) {
                        console.log('连接成功');
                    } else {
                        throw new Error(`服务器错误: ${response.status}`);
                    }
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
                    console.log('连接关闭');
                },
                onerror: (err) => {
                    // 错误处理（网络错误、解析异常等）
                    console.error('发生错误:', err);
                    abortController.abort(); // 取消请求
                    aiContent += '\n\n[服务器繁忙，已终止]';
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
const watchlistActionButtons = [
    {
        key: 'removeWatchlist',
        text: '移除自选',
        type: 'default',
        class: 'remove-watchlist-btn',
        icon: '⭐'
    },
    {
        key: 'analysis',
        text: '量化分析',
        type: 'default',
        class: 'paid-analysis-btn',
        icon: '🎯',
        priceTag: { original: '3智点', promo: '1智点' }
    },
    {
        key: 'aiTrading',
        text: 'AI委托交易',
        type: 'default',
        class: 'quant-analysis-btn',
        icon: '🤖',
        priceTag: { original: '3智点', promo: '1智点' }
    },
    {
        key: 'buy',
        text: '买入',
        type: 'default',
        class: 'buy-stock-btn-secondary',
        icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
    }
];

// 持仓股票操作按钮配置
const portfolioActionButtons = [
    {
        key: 'analysis',
        text: '量化分析',
        type: 'default',
        class: 'paid-analysis-btn',
        icon: '🎯',
        priceTag: { original: '3智点', promo: '1智点' },
        mobileText: '分析'
    },
    {
        key: 'aiTrading',
        text: 'AI委托交易',
        type: 'default',
        class: 'quant-analysis-btn',
        icon: '🤖',
        priceTag: { original: '3智点', promo: '1智点' },
        mobileText: 'AI交易'
    },
    {
        key: 'sell',
        text: '卖出',
        type: 'danger',
        class: 'sell-stock-btn',
        icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
    },
    {
        key: 'addPosition',
        text: '加仓',
        type: 'default',
        class: 'buy-stock-btn-secondary',
        icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
    }
];

// 自选股票操作事件处理
const handleWatchlistActionClick = ({ action, stock }) => {
    console.log('执行自选股票操作:', action, stock);

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
            showPaidAnalysisDialog(stock);
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

// 获取移动端智能荐股配置
const getMobileSmartRecommendationConfig = (message) => {
    const config = getStockListConfig('smartRecommendation');
    return {
        ...config,
        // 移动端特定配置
        // 移除工具栏相关配置，让直接传递的属性生效
        showRecommendIndex: config.showRecommendIndex,
        showWatchlistStatus: config.showWatchlistStatus,
        showPositionStatus: config.showPositionStatus,
        showDetails: true, // 移动端统一使用showDetails
        showReason: config.showReason,
        actions: config.actions
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

const getRiskLevelText = (level) => {
    const riskOption = riskOptions.find(option => option.riskLevel === level);
    return riskOption ? riskOption.title : '未设置';
};

const getExperienceText = (experience) => {
    return experience === 1 ? '新手' : experience === 2 ? '有经验' : '未设置';
};

const getFocusIndustryText = (focusIndustry) => {
    const labels = [];
    focusIndustry = focusIndustry || [];
    focusIndustry.forEach(item => {
        if (item.children && Array.isArray(item.children)) {
            item.children.forEach(child => {
                if (child.label) labels.push(child.label);
            });
        }
    });
    return labels.length > 0 ? labels.join('、') : '未设置';
};

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

// 购买相关方法
const showBuyDialog = (stockInfo, type = 'buy') => {
    selectedStock.value = stockInfo;
    tradeType.value = type;
    buyDialogVisible.value = true;
};

// 处理来自侧边栏的卖出事件
const handleShowSellDialog = (stockInfo) => {
    showBuyDialog(stockInfo, 'sell');
};



// 检查用户状态并显示相应引导
const checkUserStatus = () => {
    // 只有在登录且没有偏好设置时才显示引导
    if (userStore.isLoggedIn && (!userStore.userInfo.preferences || !userStore.userInfo.preferences.riskLevel)) {
        setTimeout(() => {
            showOnboarding.value = true;
        }, 1000);
    }
};

// 重置移动端布局
const resetMobileLayout = () => {
    if (!isMobileView.value) return;

    const inputArea = document.querySelector('.input-area');

    console.log('重置移动端布局');

    // 清除强制设置的样式，让CSS类样式生效
    if (inputArea) {
        // 清除所有可能的内联样式
        ['position', 'bottom', 'left', 'right', 'z-index', 'margin', 'padding'].forEach(prop => {
            inputArea.style.removeProperty(prop);
        });

        // 完全清除style属性，让CSS自然生效
        inputArea.removeAttribute('style');

        console.log('移动端布局已完全重置，移除所有内联样式');
    }

    setTimeout(() => {
        // 确保页面滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // 如果有聊天历史区域，也滚动到顶部
        if (chatHistoryRef.value) {
            scrollToTop();
        }

        console.log('移动端布局已重置');
    }, 50);
};



// 窗口大小变化处理函数 - 简化处理
const handleResize = () => {
    checkMobileView();
    updateChatHistoryHeight();
    // 移动端聊天模式下的处理
    if (isMobileView.value && isChatMode.value) {
        setTimeout(() => {
            fixMobileChatBox(); // 确保输入框不被遮挡
            scrollToBottom();
        }, 100);
    }
};

// 简化的移动端虚拟键盘处理 - 参照微信浏览器表现
const handleMobileKeyboard = () => {
    if (!isMobileView.value || !isChatMode.value) return;

    console.log('简化的虚拟键盘处理已启用');

    // 监听orientationchange，这个是必要的
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // 屏幕旋转后滚动到底部
            scrollToBottom();
        }, 500);
    });
};

onMounted(() => {
    scrollToBottom();
    // 移除自动检查用户状态，避免老用户登录后进入引导流程

    // 检查是否需要显示登录弹窗
    const route = useRoute();
    if (route.query.showLogin === 'true' && !userStore.isLoggedIn) {
        loginDialogVisible.value = true;
    }

    // 检测移动端视图
    checkMobileView();

    // 初始化聊天历史区域高度
    updateChatHistoryHeight();

    // 初始化快捷操作
    initializeShortcuts();

    // 初始化语音识别
    initSpeechRecognition();

    // 初始化微信语音功能
    initWechatVoice();

    // 检测微信环境并设置相关状态
    isWechatEnv.value = isWechatBrowser();
    if (isWechatEnv.value) {
        document.body.classList.add('wechat-browser');
    }

    // 初始状态不调用修复函数，让CSS自然生效



    // 如果有当前聊天ID，恢复聊天记录
    if (chatHistoryStore.currentChatId) {
        const currentChat = chatHistoryStore.getCurrentChat;
        if (currentChat) {
            chatHistory.value = [...currentChat.messages];
            isChatMode.value = chatHistory.value.length > 0;
        }
    }

    // 移除测试数据生成逻辑，现在用户从空白状态开始

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
        // 初始状态只重置布局，不调用修复函数
        resetMobileLayout();
        handleMobileKeyboard();

        // 监听visualViewport变化来处理浏览器工具栏显示/隐藏
        if (window.visualViewport) {
            const handleViewportChange = () => {
                if (isMobileView.value && isChatMode.value) {
                    setTimeout(fixMobileChatBox, 100); // 延迟执行确保变化完成
                }
            };
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }
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
    if (recognition.value && isRecording.value) {
        recognition.value.stop();
    }
    if (voiceTimer.value) {
        clearInterval(voiceTimer.value);
    }
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

// 格式化荐股时间
const formatRecommendationTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return '刚刚生成';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }
};

// 刷新荐股列表
const refreshRecommendation = async (message) => {
    ElMessage.info('正在刷新荐股列表...');

    // 重新调用智能荐股API
    const userPreferences = userStore.userInfo?.preferences;
    let requestMessage = '智能荐股：根据我的投资偏好推荐优质股票';

    if (userPreferences) {
        requestMessage += `\n\n我的投资偏好：
- 风险偏好：${getRiskLevelText(userPreferences.riskLevel)}
- 投资经验：${userPreferences.experience === 'beginner' ? '新手' : '有经验'}
- 关注板块：${userPreferences.sectors?.majorCategories?.join('、') || '未设置'}`;
    }

    try {
        const res = await mockApi.sendMessage(requestMessage);

        // 更新现有的荐股消息
        const messageIndex = chatHistory.value.findIndex(msg => msg.messageId === message.messageId);
        if (messageIndex !== -1) {
            chatHistory.value[messageIndex] = {
                ...res.data,
                isPersistent: true,
                messageId: message.messageId, // 保持原有ID
                timestamp: new Date().toISOString() // 更新时间戳
            };
        }

        ElMessage.success('荐股列表已刷新');

        // 滚动到更新的荐股列表
        nextTick(() => {
            scrollToRecommendation();
        });
    } catch (error) {
        ElMessage.error('刷新失败，请稍后重试');
    }
};

// 获取推荐等级样式类
const getRecommendLevelClass = (level) => {
    switch (level) {
        case '强烈推荐':
            return 'strong-recommend';
        case '推荐':
            return 'recommend';
        case '中性':
            return 'neutral';
        case '谨慎':
            return 'caution';
        default:
            return 'recommend';
    }
};

// 付费量化分析
const showPaidAnalysisDialog = (stock) => {
    ElMessageBox.confirm(
        `量化分析 ${stock.name}(${stock.code}) 促销价仅需 1智点（原价3智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 1智点',
            cancelButtonText: '取消',
            type: 'warning',
            customClass: 'paid-service-dialog high-z-index-dialog',
            appendTo: 'body'
        }
    ).then(() => {
        // 检查余额（按1智点计算）
        if (userStore.balance < 1) {
            ElMessage.error('智点余额不足，请先充值');
            return;
        }

        // 扣费并执行分析（扣除1智点）
        userStore.deductBalance(1);
        ElMessage.success('支付成功，正在生成量化分析报告...');

        // 执行量化分析
        continueAnalysis(stock, true);
    }).catch(() => {
        ElMessage.info('已取消付费分析');
    });
};

// 付费AI委托交易
const showQuantAnalysisDialog = (stock) => {
    // 显示AI委托交易设置对话框
    showAITradingDialog.value = true;
    selectedStockForAITrading.value = stock;
};

// 处理AI委托交易确认事件
const handleAITradingConfirmed = async (data) => {
    const { stock, tradingParams, message } = data;

    try {
        const res = await mockApi.sendMessage(message);
        chatHistory.value.push(
            { role: 'user', content: `AI委托交易设置 ${stock.name}(${stock.code})` },
            {
                ...res.data,
                hasStockInfo: true,
                stockInfo: stock,
                isAITradingReport: true,
                tradingParams: tradingParams
            }
        );

        await nextTick();
        scrollToBottom();

        // 切换到聊天模式
        isChatMode.value = true;
    } catch (error) {
        ElMessage.error('设置失败，请稍后重试');
        console.error('AI委托交易设置失败:', error);
    }
};

// 量化分析报告操作方法
const setQuantAnalysisReminder = (message) => {
    // 从量化分析消息内容中提取股票信息
    const content = message.content;
    const stockMatch = content.match(/\*\*(.+?)\((.+?)\)\s+量化分析报告\*\*/);

    if (stockMatch) {
        reminderForm.value.stockName = stockMatch[1];
        reminderForm.value.stockCode = stockMatch[2];
    } else {
        reminderForm.value.stockName = '量化分析股票';
        reminderForm.value.stockCode = '000000';
    }

    // 从量化分析内容中提取关键指标（实际应用中应该从API返回的结构化数据中获取）
    // 提取综合评分
    const scoreMatch = content.match(/综合评分：(\d+\.?\d*)/);
    if (scoreMatch) {
        currentQuantAnalysis.value.overallScore = scoreMatch[1];
    }

    // 提取买入信号评分
    const signalMatch = content.match(/买入信号：多因子模型评分(\d+)/);
    if (signalMatch) {
        currentQuantAnalysis.value.buySignalScore = signalMatch[1];
    }

    // 提取信号强度
    const strengthMatch = content.match(/信号强度【(.+?)】/);
    if (strengthMatch) {
        currentQuantAnalysis.value.signalStrength = strengthMatch[1];
    }

    // 提取量化评级
    const ratingMatch = content.match(/量化评级：(.+?级)/);
    if (ratingMatch) {
        currentQuantAnalysis.value.rating = ratingMatch[1];
    }

    currentReminderMessage.value = message;
    showQuantReminderDialog.value = true;
};

const openRecordsCenter = () => {
    showRecordsCenter.value = true;
};

// 提醒对话框处理方法
const handleReminderConfirm = () => {
    const selectedConditions = getSelectedConditions();

    // 调试信息
    console.log('当前选中的条件:', selectedConditions);
    console.log('提醒条件数据:', reminderConditions.value);

    if (selectedConditions.length === 0) {
        ElMessage.error('请至少选择一个提醒条件');
        return;
    }

    // 验证需要数值的条件是否已填写
    const invalidConditions = selectedConditions.filter(condition => {
        if (condition.needsValue && (!condition.value || condition.value === '')) {
            return true;
        }
        return false;
    });

    if (invalidConditions.length > 0) {
        ElMessage.error('请填写所有需要数值的提醒条件');
        return;
    }

    // 批量创建提醒
    const newReminders = selectedConditions.map(condition => ({
        id: Date.now() + Math.random(),
        type: condition.type,
        condition: condition.condition,
        value: condition.value,
        stockCode: reminderForm.value.stockCode,
        stockName: reminderForm.value.stockName,
        createdAt: new Date().toLocaleString(),
        isActive: true,
        isQuantAnalysis: true
    }));

    activeReminders.value.push(...newReminders);

    ElMessage.success(`已成功设置 ${newReminders.length} 个量化分析提醒`);

    // 模拟提醒触发（实际应用中应该是后台监控量化指标）
    newReminders.forEach((reminder, index) => {
        setTimeout(() => {
            const conditionText = getReminderDescription(reminder);
            ElMessage({
                message: `🔔 量化分析提醒触发：${reminder.stockName} ${conditionText}`,
                type: 'warning',
                duration: 5000,
                showClose: true
            });

            // 将提醒标记为已触发
            const reminderIndex = activeReminders.value.findIndex(r => r.id === reminder.id);
            if (reminderIndex !== -1) {
                activeReminders.value[reminderIndex].isActive = false;
            }
        }, 15000 + index * 2000); // 错开触发时间
    });

    showQuantReminderDialog.value = false;
    resetReminderConditions();
};

const handleReminderCancel = () => {
    showQuantReminderDialog.value = false;
    resetReminderConditions();
};

const resetReminderForm = () => {
    reminderForm.value = {
        type: 'overall_score',
        condition: 'score_above',
        value: '',
        stockCode: '',
        stockName: ''
    };
};

const resetReminderConditions = () => {
    reminderConditions.value = {
        overall_score: {
            conditions: [],
            values: {
                score_above: '',
                score_below: '',
                score_change: ''
            }
        },
        buy_signal: {
            conditions: [],
            values: {
                signal_above: '',
                signal_below: ''
            }
        },
        technical: {
            conditions: []
        },
        rating_change: {
            conditions: [],
            values: {
                rating_reach: ''
            }
        },
        risk_alert: {
            conditions: []
        }
    };
};

// 获取选中的条件
const getSelectedConditions = () => {
    const conditions = [];

    // 综合评分条件
    reminderConditions.value.overall_score.conditions.forEach(condition => {
        const value = reminderConditions.value.overall_score.values[condition];
        conditions.push({
            type: 'overall_score',
            condition: condition,
            value: value ? parseFloat(value) : null,
            needsValue: ['score_above', 'score_below', 'score_change'].includes(condition)
        });
    });

    // 买入信号条件
    reminderConditions.value.buy_signal.conditions.forEach(condition => {
        const value = reminderConditions.value.buy_signal.values[condition];
        conditions.push({
            type: 'buy_signal',
            condition: condition,
            value: value ? parseFloat(value) : null,
            needsValue: ['signal_above', 'signal_below'].includes(condition)
        });
    });

    // 技术指标条件
    reminderConditions.value.technical.conditions.forEach(condition => {
        conditions.push({
            type: 'technical',
            condition: condition,
            value: null,
            needsValue: false
        });
    });

    // 评级变化条件
    reminderConditions.value.rating_change.conditions.forEach(condition => {
        const value = reminderConditions.value.rating_change.values[condition];
        conditions.push({
            type: 'rating_change',
            condition: condition,
            value: value || null,
            needsValue: condition === 'rating_reach'
        });
    });

    // 风险指标条件
    reminderConditions.value.risk_alert.conditions.forEach(condition => {
        conditions.push({
            type: 'risk_alert',
            condition: condition,
            value: null,
            needsValue: false
        });
    });

    return conditions;
};

// 获取选中条件数量
const getSelectedConditionsCount = () => {
    return getSelectedConditions().length;
};

// 获取批量预览
const getBatchPreview = () => {
    const conditions = getSelectedConditions();
    const stockName = reminderForm.value.stockName || '当前股票';

    return conditions.map((condition, index) => {
        const mockReminder = {
            type: condition.type,
            condition: condition.condition,
            value: condition.value,
            isQuantAnalysis: true
        };

        const description = getReminderDescription(mockReminder);
        const icons = {
            overall_score: '🎯',
            buy_signal: '📈',
            technical: '📊',
            rating_change: '⭐',
            risk_alert: '⚠️'
        };

        return {
            id: `${condition.type}_${condition.condition}`,
            icon: icons[condition.type] || '📋',
            text: `${stockName} ${description}`,
            shortText: description,
            type: condition.type,
            condition: condition.condition
        };
    });
};

// 检查条件是否被选中
const isConditionSelected = (type, condition) => {
    if (type === 'overall_score') {
        return reminderConditions.value.overall_score.conditions.includes(condition);
    } else if (type === 'buy_signal') {
        return reminderConditions.value.buy_signal.conditions.includes(condition);
    } else if (type === 'technical') {
        return reminderConditions.value.technical.conditions.includes(condition);
    } else if (type === 'rating_change') {
        return reminderConditions.value.rating_change.conditions.includes(condition);
    } else if (type === 'risk_alert') {
        return reminderConditions.value.risk_alert.conditions.includes(condition);
    }
    return false;
};

// 切换条件选择状态
const toggleCondition = (type, condition) => {
    const typeData = reminderConditions.value[type];
    const index = typeData.conditions.indexOf(condition);

    if (index > -1) {
        // 移除条件
        typeData.conditions.splice(index, 1);
    } else {
        // 添加条件
        typeData.conditions.push(condition);
    }
};

// 清空所有选择
const clearAllConditions = () => {
    Object.keys(reminderConditions.value).forEach(type => {
        reminderConditions.value[type].conditions = [];
    });
};

// 选择推荐配置
const selectRecommendedConditions = () => {
    // 清空现有选择
    clearAllConditions();

    // 设置推荐的条件
    reminderConditions.value.overall_score.conditions = ['score_above'];
    reminderConditions.value.overall_score.values.score_above = '8.5';

    reminderConditions.value.buy_signal.conditions = ['buy_signal_trigger'];

    reminderConditions.value.technical.conditions = ['macd_golden', 'rsi_oversold'];

    reminderConditions.value.rating_change.conditions = ['rating_upgrade'];

    ElMessage.success('已应用推荐配置');
};

// 移除选中的条件
const removeSelectedCondition = (preview) => {
    const typeData = reminderConditions.value[preview.type];
    const index = typeData.conditions.indexOf(preview.condition);
    if (index > -1) {
        typeData.conditions.splice(index, 1);
    }
};

// 删除提醒
const removeReminder = (reminderId) => {
    const index = activeReminders.value.findIndex(r => r.id === reminderId);
    if (index !== -1) {
        const reminder = activeReminders.value[index];
        activeReminders.value.splice(index, 1);
        ElMessage.success(`已删除 ${reminder.stockName} 的提醒`);
    }
};

// 监听提醒对话框打开，初始化表单数据
watch(showQuantReminderDialog, (newVal) => {
    if (newVal && currentReminderMessage.value) {
        // 从消息中提取股票信息
        if (currentReminderMessage.value.stockInfo) {
            reminderForm.value.stockCode = currentReminderMessage.value.stockInfo.code;
            reminderForm.value.stockName = currentReminderMessage.value.stockInfo.name;
        } else {
            // 如果没有股票信息，使用默认值
            reminderForm.value.stockCode = '000001';
            reminderForm.value.stockName = '平安银行';
        }
    }
});

// 提醒对话框辅助方法
const getValuePlaceholder = () => {
    switch (reminderForm.value.type) {
        case 'overall_score':
            return '例如：8.0';
        case 'buy_signal':
            return '例如：90';
        case 'technical':
            return '不需要输入数值';
        case 'rating_change':
            return '例如：A+级';
        case 'risk_alert':
            return '不需要输入数值';
        default:
            return '请输入数值';
    }
};

const getValueUnit = () => {
    switch (reminderForm.value.type) {
        case 'overall_score':
            return '分';
        case 'buy_signal':
            return '分';
        case 'technical':
            return '';
        case 'rating_change':
            return '';
        case 'risk_alert':
            return '';
        default:
            return '';
    }
};

// 判断是否需要输入数值
const needsValueInput = () => {
    const type = reminderForm.value.type;
    const condition = reminderForm.value.condition;

    // 技术指标和风险提醒的某些条件不需要输入数值
    if (type === 'technical' && ['macd_golden', 'macd_death', 'rsi_overbought', 'rsi_oversold', 'boll_break'].includes(condition)) {
        return false;
    }
    if (type === 'risk_alert' && ['risk_abnormal', 'volatility_high', 'drawdown_large', 'sharpe_abnormal'].includes(condition)) {
        return false;
    }
    if (type === 'rating_change' && ['rating_upgrade', 'rating_downgrade'].includes(condition)) {
        return false;
    }
    if (type === 'buy_signal' && ['buy_signal_trigger', 'sell_signal_trigger'].includes(condition)) {
        return false;
    }

    return true;
};

const getReminderPreview = () => {
    const { stockName, type, condition, value } = reminderForm.value;
    let conditionText = '';

    // 检查是否需要数值输入，如果需要但未输入则提示
    if (needsValueInput() && !value) {
        return '请完善提醒条件设置';
    }

    switch (type) {
        case 'overall_score':
            if (condition === 'score_above') {
                conditionText = `综合评分上升至 ${value}分`;
            } else if (condition === 'score_below') {
                conditionText = `综合评分下降至 ${value}分`;
            } else if (condition === 'score_change') {
                conditionText = `综合评分变化超过 ${value}分`;
            }
            break;
        case 'buy_signal':
            if (condition === 'signal_above') {
                conditionText = `买入信号强度达到 ${value}分`;
            } else if (condition === 'signal_below') {
                conditionText = `买入信号强度低于 ${value}分`;
            } else if (condition === 'buy_signal_trigger') {
                conditionText = `出现买入信号`;
            } else if (condition === 'sell_signal_trigger') {
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
            conditionText = technicalMap[condition] || '技术指标变化';
            break;
        case 'rating_change':
            if (condition === 'rating_upgrade') {
                conditionText = `量化评级上调`;
            } else if (condition === 'rating_downgrade') {
                conditionText = `量化评级下调`;
            } else if (condition === 'rating_reach') {
                conditionText = `量化评级达到 ${value}`;
            }
            break;
        case 'risk_alert':
            const riskMap = {
                'risk_abnormal': '风险指标异常',
                'volatility_high': '波动率超标',
                'drawdown_large': '回撤过大',
                'sharpe_abnormal': '夏普比率异常'
            };
            conditionText = riskMap[condition] || '风险指标异常';
            break;
        default:
            conditionText = '未知条件';
    }

    return `当 ${stockName} ${conditionText} 时，系统将发送量化分析提醒通知`;
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
            // 默认快捷操作，直接调用action函数
            if (typeof shortcut.action === 'function') {
                shortcut.action();
            } else {
                console.error('默认快捷操作action不是函数:', shortcut);
                ElMessage.error('快捷操作配置错误');
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

// 处理快捷操作更新事件
const handleShortcutsUpdated = () => {
    // 重新初始化快捷操作
    initializeShortcuts();
};

// 组件挂载时初始化
onMounted(() => {
    initializeShortcuts();
});
</script>

<!-- 非scoped样式用于移动端按钮优化 -->
<style>
/* 移动端侧边栏悬浮按钮基础样式 */
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

/* 移动端侧边栏悬浮按钮优化 - 低调白底设计 */
@media (max-width: 768px) {
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
}
</style>

<style scoped>
.main-modern {
    min-height: 100vh;
    background: #fafbfc;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: hidden;
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

.modern-navbar {
    width: 100%;
    max-width: 100vw;
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    box-sizing: border-box;
    overflow: hidden;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 悬浮聊天历史切换按钮 */
.floating-history-toggle {
    position: fixed;
    top: 72px;
    left: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #6b7280;
    z-index: 50;
}

.floating-history-toggle:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    color: #374151;
    transform: translateY(-2px);
}

.floating-history-toggle.active {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 2px solid rgba(59, 130, 246, 0.3);
}

.floating-history-toggle svg {
    transition: all 0.2s ease;
}

/* 移动端底部圆形小按钮优化 */
@media (max-width: 768px) {
    .floating-history-toggle {
        /* 重置PC端样式 */
        top: auto;
        left: auto;

        /* 移动端圆形按钮尺寸 - 更小更低调 */
        width: 28px;
        height: 28px;
        border-radius: 50%;
        padding: 0;

        /* 移动端底部位置 - 左下角避免遮挡操作按钮 */
        bottom: 24px;
        left: 16px;

        /* 移动端样式 - 更低调 */
        background: rgba(255, 255, 255, 0.8);
        color: #9ca3af;
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(8px);

        /* 移动端触摸优化 */
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;

        /* 居中图标 */
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .floating-history-toggle:hover {
        background: rgba(255, 255, 255, 0.9);
        color: #6b7280;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transform: translateY(-0.5px);
    }

    .floating-history-toggle:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        background: rgba(255, 255, 255, 0.9);
        transition: all 0.1s ease;
    }

    .floating-history-toggle svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }

    /* 确保在聊天模式下按钮不被输入框遮挡 */
    .main-container.chatting .floating-history-toggle {
        bottom: 120px;
        /* 在聊天模式下上移更多，确保完全不被输入框遮挡 */
    }

    /* 在非聊天模式下（首页）的位置优化 */
    .main-container:not(.chatting) .floating-history-toggle {
        bottom: 140px;
        /* 在首页时上移，避免遮挡AI输入框 */
    }

    /* 在有键盘弹出时的适配 */
    @supports (bottom: env(keyboard-inset-height)) {
        .floating-history-toggle {
            bottom: calc(24px + env(keyboard-inset-height, 0px));
        }

        .main-container.chatting .floating-history-toggle {
            bottom: calc(120px + env(keyboard-inset-height, 0px));
        }

        .main-container:not(.chatting) .floating-history-toggle {
            bottom: calc(140px + env(keyboard-inset-height, 0px));
        }
    }
}



.modern-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #18181b;
    letter-spacing: 0.5px;
}

.navbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modern-btn {
    border-radius: 20px;
    font-weight: 500;
    background: #fff;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 6px 20px;
    transition: background 0.2s;
}

.modern-btn:hover {
    background: #f5f7fa;
}

.modern-user {
    display: flex;
    align-items: center;
    font-weight: 500;
    cursor: pointer;
    outline: none !important;
    border: none !important;
}

.modern-user:focus {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
}

/* 移除Element Plus dropdown的focus样式 */
:deep(.el-dropdown) {
    outline: none !important;
}

:deep(.el-dropdown:focus) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
}

:deep(.el-dropdown .modern-user:focus) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
}

/* PC端显示下拉菜单，隐藏移动端头像 */
.pc-user-menu {
    display: flex;
}

.mobile-user-avatar {
    display: none;
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
    transition: justify-content 0.3s;
    overflow-y: hidden;
    min-height: 0;
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

/* 简化快捷示例标签 */
.quick-examples {
    margin-top: 12px;
}

.examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-bottom: 12px;
}

.examples-control {
    display: flex;
    justify-content: center;
    margin-top: 6px;
}

.control-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.2s ease;
}

.control-container:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.examples-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 6px;
}

.examples-indicator {
    font-size: 0.75rem;
    color: #475569;
    font-weight: 500;
    padding: 1px 6px;
    background: #e2e8f0;
    border-radius: 8px;
}

.refresh-examples-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #475569;
    transition: all 0.2s ease;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.refresh-examples-btn:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
    transform: rotate(90deg);
}

.example-tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.example-tag:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
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

    .examples-content {
        gap: 4px;
    }

    .example-tag {
        font-size: 0.75rem;
        padding: 4px 8px;
    }

    .examples-indicator {
        font-size: 0.7rem;
    }

    .refresh-examples-btn {
        width: 24px;
        height: 24px;
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
        /* 移动端始终显示 */
        border-radius: 2px;
        opacity: 1 !important;
        /* 强制显示 */
        transition: background 0.2s ease;
    }

    .chat-history-area::-webkit-scrollbar-thumb:active {
        background: rgba(0, 0, 0, 0.4) !important;
        /* 触摸时加深 */
    }

    /* 移动端消息间距调整 */
    .chat-message {
        margin-bottom: 16px;
        padding-right: 4px !important;
        /* 为滚动条留出最小间距，让股票列表占满更多宽度 */
    }

    /* 最后一条消息增加底部间距，确保与输入框有足够间隔 */
    .chat-message:last-child {
        margin-bottom: 32px;
    }

    .message-text {
        margin-bottom: 0;
    }

    /* 移动端主内容区域间距优化 */
    .modern-content {
        padding-top: 80px;
        /* 增加顶部间距，避免太靠顶部 */
        padding-left: 0px !important;
        padding-right: 0px !important;
        /* 移除左右padding，让AI卡片能够占满全屏 */
    }

    /* 移动端聊天模式下的内容区域 */
    .modern-content.chatting {
        padding-top: 76px !important;
        /* 聊天模式下从导航栏底部开始，增加20px间距 */
        padding-left: 0 !important;
        padding-right: 0 !important;
        /* 移除左右padding，让聊天区域占满宽度 */
        height: 100vh !important;
        /* 占满整个视口高度 */
        overflow: hidden !important;
    }

    /* 移动端欢迎页面字体优化 */
    .modern-title {
        font-size: 1.8rem;
        margin-bottom: 12px;
    }

    .modern-desc {
        font-size: 0.9rem;
        margin-bottom: 24px;
        line-height: 1.5;
        padding: 0 16px;
    }

    /* 移动端欢迎区域间距优化 */
    .welcome-section {
        margin-bottom: 24px;
        padding-top: 16px;
        padding-left: 16px;
        padding-right: 16px;
    }

    .ai-card {
        margin-top: 20px;
        margin-bottom: 20px;
    }

    @media (max-width: 768px) {
        .ai-card {
            margin: 0 !important;
            padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px)) 0 !important;
            border-radius: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .ai-input-row {
            padding: 0 16px !important;
        }

        .ai-buttons-row {
            padding: 0 16px !important;
        }
    }

    .quick-examples {
        margin-top: 12px;
    }

    .examples-content {
        margin-bottom: 12px;
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

.suggestion-item:hover .suggestion-arrow {
    color: #3b82f6;
    transform: translateX(2px);
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

/* 响应式设计 */
@media (max-width: 768px) {
    .stock-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }

    .stock-price-change {
        align-self: flex-end;
    }

    .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .detail-label {
        min-width: auto;
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

    .recommend-index {
        flex-wrap: nowrap;
        gap: 4px;
        overflow: hidden;
    }

    .recommend-score {
        font-size: 0.65rem;
        padding: 1px 3px;
        white-space: nowrap;
    }

    .recommend-level {
        font-size: 0.65rem;
        padding: 1px 4px;
        min-width: 40px;
        white-space: nowrap;
    }

    /* 使用StockList组件，移除重复的股票基础样式 */

    .recommend-index {
        display: flex;
        align-items: center;
        gap: 4px;
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
        color: #64748b;
        margin-left: 2px;
    }

    .help-icon {
        font-size: 0.75rem;
        margin-left: 2px;
    }

    .recommend-level {
        font-size: 0.6rem;
        padding: 1px 3px;
        margin-left: 2px;
    }

    .stock-price-change {
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

    .detail-row {
        display: contents;
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

    .detail-label {
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

    /* 推荐理由横向显示，限制1行 */
    /* 推荐理由独占一行，居中分割线 */
    .stock-reason {
        margin-top: 8px !important;
        padding: 8px !important;
        background: #fff3cd !important;
        border-radius: 4px !important;
        border: 1px solid #ffeaa7 !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 6px !important;
        min-height: 32px !important;
        grid-column: 1 / -1 !important;
        position: relative !important;
    }


    .reason-label {
        font-size: 0.7rem !important;
        color: #856404 !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        font-weight: bold !important;
    }

    .reason-text {
        font-size: 0.7rem !important;
        line-height: 1.4 !important;
        color: #533f03 !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
        flex: 1 !important;
    }

    /* 移除重复的stock-item-actions样式 - 由StockList组件提供 */

    /* 移动端股票列表间距优化 */
    .stock-list {
        gap: 6px;
    }
}

/* 小屏手机进一步优化 - 移除重复的股票样式，由StockList组件提供 */
@media (max-width: 480px) {

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
@media (max-width: 1024px) {
    .asset-main-content {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .asset-overview-horizontal {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
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

.input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: transparent;
    /* 完全透明背景 */
    border: none;
    /* 移除所有边框 */
    padding: 16px 32px 24px 32px;
    /* 减少padding，让区域更紧凑 */
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 50;
    transition: all 0.3s;
    /* 完全无背景无边框设计 */
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

/* 聊天模式快捷操作样式 */
.chat-shortcuts {
    width: 100%;
    max-width: 900px;
    margin-bottom: 12px;
    animation: slideDown 0.3s ease-out;
}

.shortcuts-grid {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
}

/* 移动端快捷操作网格优化 */
@media (max-width: 768px) {
    .shortcuts-grid {
        gap: 6px;
        padding: 0 8px;
        justify-content: flex-start;
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
    }
}

@media (max-width: 480px) {
    .shortcuts-grid {
        gap: 4px;
        padding: 0 6px;
    }
}

/* Element Plus 快捷按钮样式覆盖 */
:deep(.el-button.chat-shortcut-btn) {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 2px !important;
    padding: 8px 12px !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    color: #6b7280 !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    min-height: 50px !important;
    min-width: 60px !important;
    justify-content: center !important;
    /* 统一简洁的白色背景设计 */
}

:deep(.el-button.chat-shortcut-btn:hover) {
    background: #f9fafb !important;
    border-color: #d1d5db !important;
    color: #374151 !important;
    /* 轻微的悬停效果 */
}

:deep(.el-button.chat-shortcut-btn:focus) {
    background: #f9fafb !important;
    border-color: #d1d5db !important;
    color: #374151 !important;
}

/* 兼容性：保留原始类名选择器作为备用 */
.chat-shortcut-btn {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 2px !important;
    padding: 8px 12px !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    color: #6b7280 !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    min-height: 50px !important;
    min-width: 60px !important;
    justify-content: center !important;
    /* 统一简洁的白色背景设计 */
}

.chat-shortcut-btn:hover {
    background: #f9fafb !important;
    border-color: #d1d5db !important;
    color: #374151 !important;
    /* 轻微的悬停效果 */
}

.chat-shortcut-btn .btn-icon {
    font-size: 1.1rem;
    display: block;
}

.chat-shortcut-btn .btn-text {
    font-size: 0.75rem;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
}

/* 收起按钮保持与其他按钮一致的样式 */
.chat-shortcut-btn.close-btn {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #475569 !important;
    border-radius: 12px !important;
    width: auto !important;
    height: auto !important;
    min-height: 50px !important;
    min-width: 60px !important;
    padding: 8px 12px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 2px !important;
}

.chat-shortcut-btn.close-btn:hover {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #334155 !important;
    /* 移除悬停阴影和位移效果 */
}

/* 确保收起按钮的图标和文字颜色正确 */
.chat-shortcut-btn.close-btn .btn-icon {
    color: #475569 !important;
    font-size: 1.1rem;
}

.chat-shortcut-btn.close-btn .btn-text {
    color: #475569 !important;
    font-size: 0.75rem;
}

.chat-shortcut-btn.close-btn:hover .btn-icon {
    color: #334155 !important;
}

.chat-shortcut-btn.close-btn:hover .btn-text {
    color: #334155 !important;
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

.ai-card {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    z-index: 2;
}

.ai-input-row {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ai-buttons-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    /* 减少上边距 */
}

.ai-input {
    flex: 1;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-size: 0.95rem;
    resize: none;
    line-height: 1.5;
}

.ai-input .el-textarea__inner {
    font-size: 0.95rem !important;
    line-height: 1.5 !important;
    color: #374151 !important;
}

.ai-input .el-textarea__inner::placeholder {
    color: #c1c7cd !important;
    font-size: 0.85rem !important;
    font-weight: 400 !important;
    opacity: 0.8 !important;
}

.ai-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    align-self: flex-end;
    /* 在垂直布局中右对齐 */
}

.ai-func-btn {
    border-radius: 50%;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    /* 减小按钮尺寸 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
    background: #f0f0f0;
    border: none;
    color: #6b7280;
    transition: background 0.2s;
}

.ai-func-btn:hover {
    background: #e0e0e0;
}

/* 语音按钮录音状态样式 */
.voice-btn.recording {
    background: #ffe5e5 !important;
    border: 2px solid #ff4757 !important;
    animation: voice-recording 1.5s infinite;
}

.voice-btn.recording:hover {
    background: #ffdddd !important;
}

@keyframes voice-recording {

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.4);
    }

    50% {
        box-shadow: 0 0 0 8px rgba(255, 71, 87, 0.1);
    }
}

/* 语音按钮容器 */
.voice-btn-container {
    position: relative;
    display: inline-block;
}

/* 录音计时器样式 */
.recording-timer {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ff4757;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
    animation: timer-pulse 1s ease-in-out infinite alternate;
    z-index: 10;
    line-height: 1;
}

@keyframes timer-pulse {
    0% {
        transform: scale(1);
        opacity: 0.9;
    }

    100% {
        transform: scale(1.1);
        opacity: 1;
    }
}



.ai-send-btn {
    border-radius: 50%;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
    background: #3b82f6 !important;
    border: none !important;
    transition: all 0.2s ease;
}

.ai-send-btn:hover {
    background: #2563eb !important;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

.ai-send-btn:active {
    transform: scale(0.95);
}

.ai-send-btn:disabled {
    background: #e5e7eb !important;
    color: #9ca3af !important;
    transform: none !important;
    box-shadow: none !important;
    cursor: not-allowed;
}

.ai-send-btn svg {
    display: block;
    color: white;
}

.ai-suggestions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    width: 100%;
}

.suggestion-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

/* Element Plus 按钮样式覆盖 */
:deep(.el-button.ai-suggestion-btn) {
    border-radius: 12px !important;
    background: #f8fafc !important;
    color: #64748b !important;
    font-weight: 400 !important;
    border: 1px solid #e2e8f0 !important;
    padding: 8px 14px !important;
    transition: all 0.2s ease !important;
    font-size: 0.8rem !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    min-width: 100px !important;
    justify-content: center !important;
}

:deep(.el-button.ai-suggestion-btn:hover) {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
}

:deep(.el-button.ai-suggestion-btn:focus) {
    background: #f9fafb !important;
    border-color: #d1d5db !important;
    color: #374151 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-button.ai-suggestion-btn.hot) {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #64748b !important;
}

:deep(.el-button.ai-suggestion-btn.hot:hover) {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
}

:deep(.el-button.ai-suggestion-btn.warning) {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #64748b !important;
}

:deep(.el-button.ai-suggestion-btn.warning:hover) {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
}

:deep(.el-button.ai-suggestion-btn.quant) {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #64748b !important;
}

:deep(.el-button.ai-suggestion-btn.quant:hover) {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
}

/* 兼容性：保留原始类名选择器作为备用 */
.ai-suggestion-btn {
    border-radius: 12px !important;
    background: #f8fafc !important;
    color: #64748b !important;
    font-weight: 400 !important;
    border: 1px solid #e2e8f0 !important;
    padding: 8px 14px !important;
    transition: all 0.2s ease !important;
    font-size: 0.8rem !important;
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    min-width: 100px !important;
    justify-content: center !important;
}

.ai-suggestion-btn:hover {
    background: #f1f5f9 !important;
    border-color: #cbd5e1 !important;
    color: #475569 !important;
}

.btn-icon {
    font-size: 1rem;
    display: inline-block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 简化的自定义按钮样式 */
.customize-btn-inline {
    border: none;
    background: #f1f5f9;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 6px;
}

.customize-btn-inline:hover {
    background: #e2e8f0;
}

.customize-icon {
    font-size: 14px;
    color: #6b7280;
    transition: color 0.2s ease;
}

.customize-btn-inline:hover .customize-icon {
    color: #374151;
}

/* 聊天模式下的自定义按钮样式调整 */
.chat-shortcut-btn.customize-btn-chat {
    background: rgba(156, 163, 175, 0.1);
    border-color: rgba(156, 163, 175, 0.3);
    color: #6b7280;
}

.chat-shortcut-btn.customize-btn-chat:hover {
    background: rgba(156, 163, 175, 0.2);
    border-color: rgba(156, 163, 175, 0.5);
    color: #374151;
}



/* 响应式设计 */
@media (max-width: 768px) {

    /* AI建议按钮移动端优化 */
    .ai-suggestion-btn {
        font-size: 0.75rem;
        padding: 8px 12px;
        min-width: 100px;
        border-radius: 12px;
        min-height: 36px;
    }

    .btn-icon {
        font-size: 0.875rem;
    }

    .customize-btn-inline {
        width: 32px;
        height: 32px;
    }

    .customize-icon {
        font-size: 12px;
    }

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

    /* 移动端输入区域容器固定在底部 */
    .input-area {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-sizing: border-box !important;
        width: 100% !important;
    }

    /* 聊天输入框相对于父容器定位 */
    .ai-card {
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        right: auto !important;
        max-width: none !important;
        margin: 0 !important;
        border-radius: 0 !important;
        border-top: 1px solid #e5e7eb !important;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1) !important;
        padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px)) 0 !important;
        /* 移除左右padding，让AI卡片占满全屏宽度 */
        background: white !important;
        z-index: auto !important;
        transition: transform 0.3s ease !important;
        /* 确保在所有移动端浏览器中显示 */
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        /* 防止被其他元素遮挡 */
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        /* 防止内容溢出 */
        box-sizing: border-box !important;
        /* 确保宽度100% */
        width: 100% !important;
    }



    .ai-input-row {
        padding: 0 16px;
        border-radius: 0;
        /* 添加左右内边距，确保内容不贴边 */
    }

    .ai-buttons-row {
        margin-top: 8px;
        justify-content: flex-end;
        padding: 0 16px;
        /* 添加左右内边距，与输入行保持一致 */
    }

    /* 缩小按钮尺寸 */
    .ai-func-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
    }

    .ai-func-btn svg {
        width: 16px;
        height: 16px;
    }

    .ai-send-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        background: #3b82f6 !important;
        border: none !important;
    }

    .ai-send-btn:hover {
        background: #2563eb !important;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    }

    .ai-send-btn svg {
        width: 16px;
        height: 16px;
        color: white;
    }



    /* 隐藏顶部快捷指令区域 */
    .ai-suggestions {
        display: none;
    }

    /* PC端快捷操作样式（保持原有设计） */
    .chat-shortcuts.pc-shortcuts {
        width: 100%;
        max-width: 900px;
        margin-bottom: 12px;
        animation: slideDown 0.3s ease-out;
    }

    .pc-shortcuts .shortcuts-grid {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
    }

    .pc-shortcuts .chat-shortcut-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 12px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        color: #374151;
        font-weight: 500;
        transition: all 0.2s ease;
        min-height: 50px;
        min-width: 60px;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .pc-shortcuts .chat-shortcut-btn:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #1f2937;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .pc-shortcuts .chat-shortcut-btn .btn-icon {
        font-size: 1.1rem;
        display: block;
    }

    .pc-shortcuts .chat-shortcut-btn .btn-text {
        font-size: 0.75rem;
        line-height: 1;
        text-align: center;
        white-space: nowrap;
    }

    /* PC端收起按钮样式 */
    .pc-shortcuts .chat-shortcut-btn.close-btn {
        background: #f8fafc !important;
        border-color: #e2e8f0 !important;
        color: #475569 !important;
    }

    .pc-shortcuts .chat-shortcut-btn.close-btn:hover {
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
        color: #334155 !important;
    }

    /* 移动端快捷操作优雅菜单设计 */
    .mobile-shortcuts-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.4) !important;
        z-index: 10100 !important;
        /* 提高z-index确保在移动端侧边栏上方显示 */
        display: flex !important;
        align-items: flex-end !important;
        justify-content: center !important;
        animation: fadeIn 0.2s ease-out !important;
    }

    .mobile-shortcuts-container {
        width: 100% !important;
        max-width: 400px !important;
        background: #ffffff !important;
        border-radius: 16px 16px 0 0 !important;
        padding: 16px !important;
        margin: 0 8px 0 8px !important;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
        animation: slideUpModal 0.3s ease-out !important;
    }

    /* 主要快捷操作网格 */
    .shortcuts-main-grid {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        margin-bottom: 16px !important;
        justify-content: center !important;
        align-items: center !important;
    }

    .shortcut-btn-mobile {
        height: 36px !important;
        min-height: 36px !important;
        padding: 8px 16px !important;
        border-radius: 8px !important;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        color: #374151 !important;
        font-size: 0.75rem !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        transition: all 0.2s ease !important;
        flex-shrink: 0 !important;
    }

    .shortcut-btn-mobile:hover {
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    /* 底部操作按钮 */
    .shortcuts-bottom-actions {
        display: flex !important;
        gap: 8px !important;
        padding-top: 12px !important;
        border-top: 1px solid #f1f5f9 !important;
    }

    .action-btn {
        flex: 1 !important;
        height: 40px !important;
        border-radius: 8px !important;
        font-size: 0.8rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 4px !important;
    }

    /* 添加按钮样式 */
    .add-btn {
        background: #f0f9ff !important;
        border: 1px solid #0ea5e9 !important;
        color: #0ea5e9 !important;
    }

    .add-btn:hover {
        background: #e0f2fe !important;
        border-color: #0284c7 !important;
        color: #0284c7 !important;
    }

    .add-icon {
        font-size: 1rem !important;
        font-weight: 300 !important;
        line-height: 1 !important;
    }

    /* 收起按钮样式 */
    .shortcuts-bottom-actions .close-btn {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        color: #374151 !important;
        width: auto !important;
        height: 40px !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .shortcuts-bottom-actions .close-btn:hover {
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
        color: #1f2937 !important;
        transform: none !important;
        box-shadow: none !important;
    }

    /* 移动端用户菜单弹窗设计 */
    .mobile-user-menu-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.4) !important;
        z-index: 10101 !important;
        /* 用户菜单使用更高的z-index */
        display: flex !important;
        align-items: flex-end !important;
        justify-content: center !important;
        animation: fadeIn 0.2s ease-out !important;
    }

    .mobile-user-menu-container {
        width: 100% !important;
        max-width: 400px !important;
        background: #ffffff !important;
        border-radius: 16px 16px 0 0 !important;
        padding: 0 !important;
        margin: 0 8px 0 8px !important;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
        animation: slideUpModal 0.3s ease-out !important;
        overflow: hidden !important;
    }

    /* 用户信息头部 */
    .mobile-menu-header {
        padding: 20px 20px 16px 20px !important;
        background: linear-gradient(135deg, #18181b 0%, #374151 100%) !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
    }

    .mobile-menu-avatar {
        width: 48px !important;
        height: 48px !important;
        border-radius: 50% !important;
        background: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: 600 !important;
        font-size: 1.2rem !important;
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
    }

    .mobile-menu-user-info {
        flex: 1 !important;
        min-width: 0 !important;
    }

    .mobile-menu-user-info h3 {
        color: white !important;
        font-size: 1.1rem !important;
        font-weight: 600 !important;
        margin: 0 0 4px 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
    }

    .mobile-menu-user-info p {
        color: rgba(255, 255, 255, 0.8) !important;
        font-size: 0.85rem !important;
        margin: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
    }

    /* 菜单项 */
    .mobile-menu-items {
        padding: 8px 0 20px 0 !important;
    }

    .mobile-menu-item {
        display: flex !important;
        align-items: center !important;
        padding: 16px 20px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        border-bottom: 1px solid #f1f5f9 !important;
    }

    .mobile-menu-item:hover,
    .mobile-menu-item:active {
        background: #f8fafc !important;
    }

    .mobile-menu-item:last-child {
        border-bottom: none !important;
    }

    .menu-item-icon {
        width: 20px !important;
        height: 20px !important;
        margin-right: 16px !important;
        color: #6b7280 !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    .mobile-menu-item span {
        flex: 1 !important;
        font-size: 0.95rem !important;
        font-weight: 500 !important;
        color: #18181b !important;
    }

    .menu-item-arrow {
        width: 16px !important;
        height: 16px !important;
        color: #9ca3af !important;
        flex-shrink: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    /* 分割线 */
    .mobile-menu-divider {
        height: 8px !important;
        background: #f8fafc !important;
        border-top: 1px solid #f1f5f9 !important;
        border-bottom: 1px solid #f1f5f9 !important;
        margin: 8px 0 !important;
    }

    /* 退出登录项特殊样式 */
    .logout-item {
        border-bottom: none !important;
    }

    .logout-item .menu-item-icon {
        color: #ef4444 !important;
    }

    .logout-item span {
        color: #ef4444 !important;
    }

    .logout-item:hover,
    .logout-item:active {
        background: #fef2f2 !important;
    }

    /* 隐藏PC端下拉菜单，显示移动端头像 */
    .pc-user-menu {
        display: none !important;
    }

    .mobile-user-avatar {
        display: flex !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        background: #18181b !important;
        color: white !important;
        align-items: center !important;
        justify-content: center !important;
        font-weight: 600 !important;
        font-size: 0.8rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
    }

    .mobile-user-avatar:active {
        transform: scale(0.95) !important;
        background: #374151 !important;
    }

    /* Footer优化 */
    .copyright-footer {
        margin-top: 0;
        padding: 8px 0;
    }

    .copyright-content p {
        font-size: 10px;
        color: #9ca3af;
    }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .chat-area {
        padding-top: 30px;
        /* 超小屏幕也增加顶部间距 */
    }

    .ai-card {
        padding: 10px 12px;
    }

    .ai-input-row {
        padding: 10px 14px;
        border-radius: 14px;
    }

    .ai-buttons-row {
        margin-top: 6px;
        justify-content: flex-end;
        padding-right: 2px;
        /* 超小屏幕更小的右侧间距 */
    }

    /* 进一步缩小按钮 */
    .ai-func-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
    }

    .ai-func-btn svg {
        width: 14px;
        height: 14px;
    }

    .ai-send-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
        background: #3b82f6 !important;
        border: none !important;
    }

    .ai-send-btn:hover {
        background: #2563eb !important;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
    }

    .ai-send-btn svg {
        width: 14px;
        height: 14px;
        color: white;
    }

    .mobile-shortcuts-container {
        margin: 0 4px 0 4px !important;
        padding: 12px !important;
    }

    .shortcuts-main-grid {
        gap: 6px !important;
        margin-bottom: 12px !important;
    }

    .shortcut-btn-mobile {
        height: 32px !important;
        min-height: 32px !important;
        padding: 6px 12px !important;
        font-size: 0.7rem !important;
        border-radius: 6px !important;
    }

    .shortcuts-bottom-actions .action-btn {
        height: 36px !important;
        font-size: 0.75rem !important;
        gap: 3px !important;
    }

    .add-icon {
        font-size: 0.9rem !important;
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

    /* Footer进一步缩小 */
    .copyright-footer {
        margin-top: 16px;
        padding: 6px 0;
    }

    .copyright-content p {
        font-size: 9px;
        color: #a1a1aa;
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
@media (max-width: 768px) {
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

@media (max-width: 1400px) {
    .preferences-dialog {
        width: 90vw !important;
        max-width: 1200px !important;
    }
}

@media (max-width: 1200px) {
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
    flex: 1;
    display: flex;
    gap: 6px;
    align-items: flex-start;
    height: 36px;
}

.price-input {
    flex: 1;
    height: 36px;
}

.price-input :deep(.el-input__wrapper) {
    height: 36px !important;
}

.price-controls {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 36px;
    width: 28px;
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
@media (max-width: 768px) {
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

/* 响应式设计 */
@media (max-width: 768px) {
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

@media (max-width: 480px) {

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

    /* 超小屏幕AI卡片间距优化 */
    .ai-card {
        margin-top: 20px;
        margin-bottom: 20px;
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

    .example-tag {
        font-size: 0.75rem;
        padding: 4px 8px;
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

/* 版权信息样式 */
.copyright-footer {
    margin-top: 60px;
    padding: 10px 0;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.copyright-content {
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
    padding: 0 20px;
}

.copyright-content p {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
}

@media (max-width: 768px) {

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

    .copyright-footer {
        margin-top: 40px;
        padding: 16px 0;
    }

    .copyright-content p {
        font-size: 12px;
    }

    /* 微信环境下的底部间距优化 */
    body.wechat-browser .ai-card {
        padding: 12px 0 16px 0 !important;
        /* 微信环境下给底部一点间距，左右padding为0确保占满全屏 */
        width: 100% !important;
        border-radius: 0 !important;
        /* 微信环境下移除圆角确保占满全屏 */
        margin-bottom: 0 !important;
        /* 确保没有底部margin */
    }

    body.wechat-browser .input-area {
        padding: 0 !important;
        margin: 0 !important;
        bottom: 0 !important;
        /* 微信环境下确保input-area贴底部 */
    }

    /* 微信环境下AI输入行和按钮行的底部间距 */
    body.wechat-browser .ai-input-row {
        padding-bottom: 8px !important;
        /* 微信环境下给输入行添加底部间距 */
    }

    body.wechat-browser .ai-buttons-row {
        padding-bottom: 8px !important;
        /* 微信环境下给按钮行添加底部间距，确保不贴底边 */
    }

    /* 微信环境下欢迎区域优化 */
    body.wechat-browser .welcome-section {
        margin-bottom: 20px !important;
        /* 微信环境下减少欢迎区域底部间距 */
        flex-shrink: 0 !important;
        /* 微信环境下防止欢迎区域被压缩 */
    }

    /* 微信环境下确保版权信息完全隐藏 */
    body.wechat-browser .copyright-footer {
        display: none !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        /* 微信环境下移除所有margin和padding */
    }

    /* 微信环境下确保center-container贴底部 */
    body.wechat-browser .center-container {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        /* 微信环境下移除底部间距，让AI卡片完全贴底 */
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        /* 微信环境下让欢迎区域和AI卡片分布更均匀 */
        min-height: 0 !important;
        /* 微信环境下允许收缩 */
    }

    /* 微信环境下确保modern-content贴底部 */
    body.wechat-browser .modern-content {
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
        /* 微信环境下移除底部间距 */
        height: 100vh !important;
        /* 微信环境下确保占满整个视口高度 */
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        /* 微信环境下让内容分布更均匀 */
        padding-top: 60px !important;
        /* 微信环境下给顶部一些间距 */
    }

    /* 微信环境下确保整个页面容器贴底 */
    body.wechat-browser .app-container {
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    }
}

/* 移除旧的聊天历史面板布局适配，使用transform方式 */

/* 移动端聊天布局最终修复 - 确保最高优先级 */
@media (max-width: 768px) {

    /* 问题1: 聊天内容顶部遮挡 - 聊天模式下从导航栏底部开始，增加间距 */
    .modern-content.chatting {
        padding-top: 76px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        height: 100vh !important;
        /* 兼容性回退 */
        height: 100dvh !important;
        /* 使用动态视口高度 */
        overflow: hidden !important;
    }

    /* 移动端输入区域现在负责定位，在CSS中已在@media (max-width: 768px)中定义 */

    /* 移动端新聊天按钮区域优化 */
    .new-chat-section {
        margin-bottom: 8px !important;
        /* 进一步减少间距 */
        padding: 0 16px !important;
        /* 添加左右间距，与其他内容保持一致 */
    }

    /* 移动端按钮布局优化 - 确保一行显示 */
    .chat-actions {
        flex-wrap: nowrap !important;
        /* 移动端强制一行显示 */
        gap: 4px !important;
        /* 移动端进一步减少间距 */
        justify-content: center !important;
        overflow-x: auto !important;
        /* 允许水平滚动以防按钮过多 */
        padding: 0 4px !important;
        /* 添加少量内边距 */
    }

    .new-chat-btn,
    .goto-recommendation-btn {
        font-size: 0.75rem !important;
        /* 移动端字体更小 */
        padding: 5px 10px !important;
        /* 移动端按钮更紧凑 */
        height: 28px !important;
        /* 移动端按钮高度更小 */
        white-space: nowrap !important;
        /* 防止文字换行 */
        flex-shrink: 0 !important;
        /* 防止按钮被压缩 */
        border-radius: 8px !important;
        /* 减少圆角 */
    }

    .new-chat-btn svg,
    .goto-recommendation-btn svg {
        width: 12px;
        height: 12px;
    }

    /* 移动端AI卡片间距优化 */
    .ai-card {
        margin: 0 !important;
        /* 移除margin */
        padding: 12px 0 calc(env(safe-area-inset-bottom) + 12px) 0 !important;
        /* 左右padding为0确保占满全屏，底部padding考虑安全区域 */
        width: 100% !important;
        border-radius: 0 !important;
        /* 移除圆角确保占满全屏 */
    }

    /* 移动端AI输入行间距优化 */
    .ai-input-row {
        padding: 12px 20px !important;
        /* 增加输入行的左右padding，确保内容不贴边 */
    }

    /* 移动端AI按钮行间距优化 */
    .ai-buttons-row {
        margin-top: 8px !important;
        /* 减少按钮行的上边距 */
        padding: 0 16px !important;
        /* 添加左右padding，确保按钮不贴边 */
    }

    /* 移动端AI功能按钮优化 */
    .ai-func-btn {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
    }

    .ai-func-btn svg {
        width: 16px;
        height: 16px;
    }

    /* 移动端快捷操作按钮优化 */
    .chat-shortcut-btn {
        padding: 6px 10px;
        min-height: 40px;
        min-width: 50px;
        font-size: 11px;
        gap: 1px;
    }

    .chat-shortcut-btn .btn-icon {
        font-size: 14px;
    }

    .chat-shortcut-btn .btn-text {
        font-size: 10px;
    }

    /* 问题2&3: 滚动条位置和底部内容展示 - 默认适应非微信浏览器 */
    .chat-history-area {
        height: calc(100vh - 76px - 180px) !important;
        /* 兼容性回退，增加预留空间给非微信浏览器的输入框偏移 */
        height: calc(100dvh - 76px - 180px) !important;
        /* 使用动态视口高度，预留180px给输入区域和工具栏偏移 */
        padding: 20px 8px 80px 8px !important;
        /* 顶部20px，底部80px，适度增加底部间距适应非微信浏览器 */
        margin: 0 !important;
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        /* iOS滚动优化 */
    }

    /* 消息右侧间距，避免贴滚动条 */
    .chat-message {
        padding: 0 4px 16px 0 !important;
        /* 最小化左右padding，让消息内容占满更多宽度 */
    }

    /* 移动端聊天消息宽度优化 */
    .chat-message.user .chat-message-content {
        max-width: 85% !important;
        /* 用户消息保持合理宽度，不占满全屏 */
    }

    .chat-message.assistant .chat-message-content {
        max-width: 100% !important;
        /* 助手消息占满全屏宽度 */
    }

    /* 移动端强制清除消息内容间距 */
    .chat-message-content .message-text {
        margin: 0 !important;
        padding: 0 !important;
    }

    .chat-message-content .message-text>* {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
    }

    /* 移动端消息气泡padding调整 */
    .chat-message.user .chat-message-content {
        padding: 14px 16px 14px 16px !important;
        /* 移动端用户消息：顶部14px，底部10px，补偿字体基线对齐造成的视觉不平衡 */
    }

    .chat-message.assistant .chat-message-content {
        padding: 12px 16px 12px 16px !important;
    }

    /* 最后一条消息额外增加底部间距 - 优化移动端体验 */
    .chat-message:last-child {
        margin-bottom: 60px !important;
        /* 减少底部间距，优化移动端空间利用 */
    }

    /* 使用伪元素在聊天历史区域底部创建额外空间 - 优化移动端体验 */
    .chat-history-area::after {
        content: '';
        display: block;
        height: 80px !important;
        /* 减少额外底部空间，优化移动端体验 */
        width: 100%;
        flex-shrink: 0;
    }

    /* 微信环境下聊天历史区域优化 - 恢复紧凑布局，覆盖上面的默认样式 */
    body.wechat-browser .chat-history-area {
        height: calc(100vh - 76px - 120px) !important;
        /* 微信环境下恢复原有的120px预留空间 */
        height: calc(100dvh - 76px - 120px) !important;
        padding: 20px 8px 60px 8px !important;
        /* 微信环境下恢复原有的60px底部间距 */
    }

    /* 微信环境下最后一条消息间距 - 覆盖上面的默认样式 */
    body.wechat-browser .chat-message:last-child {
        margin-bottom: 60px !important;
        /* 微信环境下恢复原有的60px底部间距 */
    }

    /* 微信环境下伪元素底部空间 - 覆盖上面的默认样式 */
    body.wechat-browser .chat-history-area::after {
        height: 100px !important;
        /* 微信环境下恢复原有的100px额外空间 */
    }
}

@media (max-width: 480px) {

    /* 超小屏幕输入区域继承@media (max-width: 768px)中的样式 */

    /* 超小屏幕AI卡片进一步优化 */
    .ai-card {
        padding: 12px 0 calc(env(safe-area-inset-bottom) + 12px) 0 !important;
        /* 超小屏幕左右padding为0确保占满全屏，底部padding考虑安全区域 */
        width: 100% !important;
        border-radius: 0 !important;
        /* 移除圆角确保占满全屏 */
    }

    /* 超小屏幕AI输入行进一步优化 */
    .ai-input-row {
        padding: 10px 16px !important;
        /* 超小屏幕增加输入行的左右padding，确保内容不贴边 */
    }

    /* 超小屏幕新聊天按钮区域 */
    .new-chat-section {
        margin-bottom: 6px !important;
        /* 超小屏幕最小化间距 */
    }

    /* 超小屏幕AI按钮行间距优化 */
    .ai-buttons-row {
        padding: 0 12px !important;
        /* 超小屏幕添加左右padding，确保按钮不贴边 */
    }

    /* 超小屏幕AI功能按钮进一步优化 */
    .ai-func-btn {
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
    }

    .ai-func-btn svg {
        width: 14px;
        height: 14px;
    }

    /* 超小屏幕快捷操作按钮进一步优化 */
    .chat-shortcut-btn {
        padding: 5px 8px;
        min-height: 36px;
        min-width: 45px;
        font-size: 10px;
        gap: 1px;
    }

    .chat-shortcut-btn .btn-icon {
        font-size: 13px;
    }

    .chat-shortcut-btn .btn-text {
        font-size: 9px;
    }

    /* 超小屏幕AI建议按钮进一步优化 */
    .ai-suggestion-btn {
        font-size: 0.7rem;
        padding: 6px 10px;
        min-width: 90px;
        border-radius: 10px;
        min-height: 32px;
    }

    .btn-icon {
        font-size: 0.8rem;
    }

    .customize-btn-inline {
        width: 28px;
        height: 28px;
    }

    .customize-icon {
        font-size: 11px;
    }

    .modern-content.chatting {
        padding-top: 76px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    /* 超小屏幕聊天消息宽度进一步优化 */
    .chat-message.user .chat-message-content {
        max-width: 80% !important;
        /* 超小屏幕用户消息保持合理宽度，稍微紧凑一些 */
    }

    .chat-message.assistant .chat-message-content {
        max-width: 100% !important;
        /* 超小屏幕助手消息占满全屏宽度 */
    }
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

/* 移动端提醒徽章优化 */
@media (max-width: 768px) {
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

@media (max-width: 480px) {
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
@media (max-width: 320px) {
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
        padding: 0px 2px;
    }
}

/* 提醒对话框样式 */
:deep(.reminder-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.reminder-dialog .el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    margin: 0;
}

:deep(.reminder-dialog .el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 16px;
}

:deep(.reminder-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: white;
    font-size: 18px;
}

:deep(.reminder-dialog .el-dialog__body) {
    padding: 0;
}

.reminder-dialog-content {
    max-height: 70vh;
    overflow-y: auto;
    padding: 20px;
}

.stock-info-section {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    border-left: 4px solid #0ea5e9;
}

.stock-info-section h4 {
    margin: 0 0 10px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.quant-analysis-summary {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    border-left: 4px solid #0ea5e9;
}

.quant-analysis-summary h4 {
    margin: 0 0 12px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.analysis-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    border: 1px solid rgba(14, 165, 233, 0.2);
}

.summary-label {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
}

.summary-value {
    font-size: 13px;
    font-weight: 600;
}

.summary-value.score {
    color: #059669;
}

.summary-value.signal {
    color: #dc2626;
}

.summary-value.signal-score {
    color: #ea580c;
}

.summary-value.rating {
    color: #7c3aed;
}

/* 批量提醒设置样式 */
.batch-reminder-tip {
    margin-bottom: 16px;
}

.quick-select-area {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
}

.quick-select-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.quick-select-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.quick-select-actions {
    display: flex;
    gap: 8px;
}

.conditions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.condition-category {
    background: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

.category-header {
    background: #f1f5f9;
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-icon {
    font-size: 14px;
}

.category-name {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.category-items {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.condition-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
    font-size: 12px;
}

.condition-chip:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.condition-chip.active {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    font-weight: 500;
}

.condition-chip span {
    flex-shrink: 0;
    white-space: nowrap;
}

.chip-input {
    margin-left: 8px;
    max-width: 80px;
}

.chip-input .el-input__inner {
    font-size: 11px;
    padding: 4px 8px;
    height: 24px;
}

.selected-summary {
    margin-top: 16px;
    padding: 12px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 6px;
    border-left: 3px solid #0ea5e9;
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.summary-title {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
}

.summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.summary-tag {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
}

.stock-info-display {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

/* 移除重复的股票样式 - 由StockList组件提供 */

.reminder-form-section {
    margin-bottom: 20px;
}

.reminder-form-section h4 {
    margin: 0 0 16px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.form-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;
}

.form-label {
    min-width: 80px;
    font-size: 14px;
    color: #374151;
    font-weight: 500;
}

.type-select,
.condition-select {
    flex: 1;
    max-width: 200px;
}

.option-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.option-icon {
    font-size: 16px;
}

.value-input-group {
    flex: 1;
    max-width: 200px;
}

.value-input .el-input-group__append {
    background: #f8fafc;
    border-left: 1px solid #e2e8f0;
    color: #64748b;
    font-weight: 500;
}

.reminder-preview {
    margin-top: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
}

.preview-title {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
}

.preview-content {
    font-size: 14px;
    color: #78350f;
    line-height: 1.5;
}

.active-reminders-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
}

.active-reminders-section h4 {
    margin: 0 0 12px 0;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
}

.reminders-list {
    max-height: 200px;
    overflow-y: auto;
}

.reminder-item {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
    margin-bottom: 8px;
    border: 1px solid #e2e8f0;
}

.reminder-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.reminder-stock {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
}

.reminder-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
}

.reminder-time {
    font-size: 11px;
    color: #94a3b8;
}

.remove-btn {
    margin-left: 12px;
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 移动端提醒对话框优化 */
@media (max-width: 768px) {
    :deep(.reminder-dialog) {
        margin: 5vh auto !important;
        border-radius: 12px !important;
    }

    :deep(.reminder-dialog .el-dialog__header) {
        padding: 12px 16px;
    }

    :deep(.reminder-dialog .el-dialog__title) {
        font-size: 15px;
    }

    .reminder-dialog-content {
        max-height: 65vh;
        padding: 16px;
    }

    .stock-info-section {
        padding: 12px;
        margin-bottom: 16px;
    }

    .stock-info-display {
        gap: 6px;
    }

    .quant-analysis-summary {
        padding: 12px;
        margin-bottom: 16px;
    }

    .analysis-summary-grid {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .summary-item {
        padding: 6px 10px;
    }

    .summary-label {
        font-size: 11px;
    }

    .summary-value {
        font-size: 12px;
    }

    .quick-select-area {
        padding: 12px;
        margin-bottom: 16px;
    }

    .quick-select-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 12px;
    }

    .quick-select-title {
        font-size: 13px;
    }

    .quick-select-actions {
        width: 100%;
        justify-content: space-between;
    }

    .conditions-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .category-header {
        padding: 8px 10px;
    }

    .category-icon {
        font-size: 13px;
    }

    .category-name {
        font-size: 12px;
    }

    .category-items {
        padding: 10px;
        gap: 6px;
    }

    .condition-chip {
        padding: 6px 8px;
        font-size: 11px;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .chip-input {
        margin-left: 0;
        width: 100%;
        max-width: none;
    }

    .selected-summary {
        padding: 10px;
        margin-top: 12px;
    }

    .summary-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
    }

    .summary-title {
        font-size: 12px;
    }

    .summary-tags {
        gap: 4px;
    }

    .summary-tag {
        font-size: 10px;
        padding: 1px 4px;
    }

    .stock-name {
        font-size: 15px;
    }

    .stock-code {
        font-size: 13px;
        padding: 1px 6px;
    }

    .form-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 20px;
    }

    .form-label {
        min-width: auto;
        width: 100%;
        font-size: 13px;
        margin-bottom: 4px;
    }

    .type-select,
    .condition-select,
    .value-input-group {
        max-width: none;
        width: 100%;
    }

    .reminder-preview {
        padding: 12px;
        margin-top: 16px;
    }

    .preview-title {
        font-size: 12px;
    }

    .preview-content {
        font-size: 13px;
    }

    .reminder-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 10px;
    }

    .reminder-info {
        width: 100%;
    }

    .remove-btn {
        margin-left: 0;
        align-self: flex-end;
        min-height: 36px;
        padding: 8px 16px;
    }

    .dialog-footer {
        gap: 8px;
        padding-top: 20px;
        justify-content: center;
        align-items: center;
    }

    .dialog-footer .el-button {
        flex: 1;
        min-height: 36px;
        max-width: 120px;
        font-size: 13px;
        padding: 8px 16px;
    }
}

@media (max-width: 480px) {
    :deep(.reminder-dialog) {
        margin: 2vh auto !important;
        width: 95% !important;
        max-width: none !important;
        border-radius: 10px !important;
    }

    :deep(.reminder-dialog .el-dialog__header) {
        padding: 10px 12px;
    }

    :deep(.reminder-dialog .el-dialog__title) {
        font-size: 14px;
    }

    :deep(.reminder-dialog .el-dialog__headerbtn .el-dialog__close) {
        font-size: 16px;
    }

    .reminder-dialog-content {
        max-height: 60vh;
        padding: 12px;
    }

    .stock-info-section {
        padding: 10px;
        margin-bottom: 12px;
    }

    .stock-info-section h4 {
        font-size: 13px;
        margin-bottom: 8px;
    }

    .reminder-form-section h4 {
        font-size: 13px;
        margin-bottom: 12px;
    }

    .form-row {
        margin-bottom: 16px;
    }

    .reminder-preview {
        padding: 10px;
        margin-top: 12px;
    }

    .active-reminders-section {
        margin-top: 16px;
        padding-top: 16px;
    }

    .active-reminders-section h4 {
        font-size: 13px;
        margin-bottom: 10px;
    }

    .reminders-list {
        max-height: 150px;
    }

    .reminder-item {
        padding: 8px;
    }

    .dialog-footer {
        flex-direction: row;
        gap: 12px;
        justify-content: center;
        align-items: center;
        padding-top: 16px;
    }

    .dialog-footer .el-button {
        flex: 1;
        max-width: 100px;
        min-height: 38px;
        font-size: 13px;
        padding: 8px 12px;
        border-radius: 6px;
    }
}

/* 超小屏幕提醒对话框优化 */
@media (max-width: 320px) {
    :deep(.reminder-dialog) {
        margin: 1vh auto !important;
        width: 98% !important;
        border-radius: 8px !important;
    }

    :deep(.reminder-dialog .el-dialog__header) {
        padding: 8px 10px;
    }

    :deep(.reminder-dialog .el-dialog__title) {
        font-size: 13px;
    }

    .reminder-dialog-content {
        padding: 10px;
        max-height: 65vh;
    }

    .stock-info-section,
    .reminder-preview {
        padding: 8px;
    }

    /* 移除重复的股票样式 - 由StockList组件提供 */

    .form-label {
        font-size: 12px;
    }

    .preview-content {
        font-size: 12px;
    }

    .reminder-item {
        padding: 6px;
    }

    .reminder-stock {
        font-size: 13px;
    }

    .reminder-desc {
        font-size: 11px;
    }

    .remove-btn {
        font-size: 11px;
        padding: 6px 12px;
        min-height: 32px;
    }

    .dialog-footer {
        flex-direction: row;
        gap: 10px;
        justify-content: center;
        align-items: center;
        padding-top: 14px;
    }

    .dialog-footer .el-button {
        flex: 1;
        max-width: 90px;
        min-height: 36px;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 5px;
    }
}

/* 自选股展示容器 */
.watchlist-display-container {
    margin-top: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 自选股概览统计 */
.watchlist-overview {
    margin-bottom: 16px;
}

.watchlist-overview .overview-stats {
    display: flex;
    gap: 12px;
    justify-content: center;

}

.watchlist-overview .stat-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    min-width: 80px;
    justify-content: center;
}

.watchlist-overview .stat-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.watchlist-overview .stat-item.total .stat-icon {
    color: #f59e0b;
    font-size: 1rem;
}

.watchlist-overview .stat-item.up .stat-icon {
    color: #10b981;
    font-size: 1rem;
}

.watchlist-overview .stat-item.down .stat-icon {
    color: #ef4444;
    font-size: 1rem;
}

.watchlist-overview .stat-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.watchlist-overview .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1;
}

.watchlist-overview .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
}

/* 自选股卡片列表 */
.watchlist-stock-list {
    display: grid;
    gap: 16px;
    margin-bottom: 20px;
}

/* PC端保持原有样式 */
.watchlist-stock-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.watchlist-stock-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
}

/* PC端布局显示，移动端布局隐藏 */
.watchlist-stock-card .pc-card-layout {
    display: block;
}

.watchlist-stock-card .mobile-card-layout {
    display: none;
}

.watchlist-stock-card .stock-info {
    margin-bottom: 16px;
}

.watchlist-stock-card .stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.watchlist-stock-card .stock-name-code {
    flex: 1;
}

.watchlist-stock-card .name-code-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.watchlist-stock-card .stock-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
}

.watchlist-stock-card .stock-code {
    font-size: 0.9rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
}

.watchlist-stock-card .watchlist-status {
    margin-top: 4px;
}

.watchlist-stock-card .status-value {
    font-size: 0.8rem;
    color: #6b7280;
    font-weight: 500;
}

.watchlist-stock-card .stock-price-change {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.watchlist-stock-card .current-price {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1f2937;
}

.watchlist-stock-card .price-change {
    font-size: 0.9rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
}

.watchlist-stock-card .price-change.positive {
    color: #10b981;
    background: #ecfdf5;
}

.watchlist-stock-card .price-change.negative {
    color: #ef4444;
    background: #fef2f2;
}

.watchlist-stock-card .stock-details {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
}

.watchlist-stock-card .detail-row {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
    gap: 8px 16px;
    margin-bottom: 8px;
    align-items: center;
}

.watchlist-stock-card .detail-row:last-child {
    margin-bottom: 0;
}

.watchlist-stock-card .detail-label {
    font-size: 0.85rem;
    color: #6b7280;
}

.watchlist-stock-card .detail-value {
    font-size: 0.9rem;
    font-weight: 500;
    color: #374151;
}

.watchlist-stock-card .detail-value.industry {
    color: #7c3aed;
    background: #f3f0ff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.watchlist-stock-card .detail-value.target-price {
    color: #059669;
    font-weight: 600;
}

.watchlist-stock-card .detail-value.positive {
    color: #10b981;
    font-weight: 600;
}

.watchlist-stock-card .detail-value.negative {
    color: #ef4444;
    font-weight: 600;
}

.watchlist-stock-card .stock-item-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}





/* 移动端响应式 - 自选股展示 */
@media (max-width: 768px) {
    .watchlist-display-container {
        margin: 8px 0;
        padding: 8px;
    }

    .watchlist-overview .overview-stats {
        gap: 6px;
        flex-direction: row;
    }

    .watchlist-overview .stat-item {
        padding: 8px 10px;
        gap: 4px;
        min-width: 65px;
    }

    .watchlist-overview .stat-icon {
        font-size: 0.85rem !important;
    }

    .watchlist-overview .stat-label {
        font-size: 0.65rem;
    }

    .watchlist-overview .stat-value {
        font-size: 0.9rem;
    }

    /* 移动端卡片 - 完全仿照分析报告样式 */
    .watchlist-stock-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        position: relative;
        transition: all 0.2s ease;
        cursor: pointer;
    }

    .watchlist-stock-card:active {
        transform: scale(0.98);
        background: #f8fafc;
    }

    /* 移动端隐藏PC布局，显示移动端布局 */
    .watchlist-stock-card .pc-card-layout {
        display: none !important;
    }

    .watchlist-stock-card .mobile-card-layout {
        display: block !important;
    }

    /* 移动端头部布局 - 仿照分析报告 */
    .mobile-stock-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
    }

    .mobile-stock-left {
        flex: 1;
    }

    /* 左上角标签 - 仿照AI量化交易标签 */
    .industry-tag {
        font-size: 0.65rem;
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
        display: inline-block;
        margin-bottom: 6px;
    }

    /* 股票标题 - 仿照分析报告标题 */
    .mobile-stock-title {
        width: 100%;
        margin-bottom: 8px;
    }

    .mobile-stock-title .stock-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
        line-height: 1.3;
        display: block;
        width: 100%;
    }

    .mobile-stock-right {
        display: flex;
        align-items: flex-start;
    }

    /* 移动端操作下拉菜单 - 仿照分析报告 */
    .mobile-actions-dropdown {
        position: relative;
    }

    .mobile-more-btn {
        width: 24px;
        height: 24px;
        border-radius: 12px;
        border: none !important;
        background: transparent !important;
        color: #9ca3af;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .mobile-more-btn:hover,
    .mobile-more-btn:focus {
        background: transparent !important;
        color: #374151 !important;
        transform: none;
        box-shadow: none !important;
    }

    /* 移除价格信息从右上角，改为在详情中显示 */

    /* 移动端股票详情区域 - 仿照分析报告信息项 */
    .mobile-stock-details {
        margin-bottom: 8px;
    }

    .mobile-detail-row {
        margin-bottom: 6px;
    }

    .mobile-detail-row:last-child {
        margin-bottom: 0;
    }

    .mobile-detail-item {
        display: flex;
        align-items: center;
        font-size: 0.7rem;
        margin-bottom: 2px;
    }

    .mobile-detail-item .detail-label {
        color: #9ca3af;
        margin-right: 4px;
        min-width: 50px;
        font-weight: 400;
    }

    .mobile-detail-item .detail-value {
        color: #374151;
        flex: 1;
        font-weight: 400;
    }

    .mobile-detail-item .detail-value.target-price {
        color: #059669;
        font-weight: 600;
    }

    .mobile-detail-item .detail-value.industry {
        color: #7c3aed;
        background: #f3f0ff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 500;
    }

    .mobile-detail-item .detail-value.recommend-level {
        color: #6366f1;
        font-weight: 500;
    }

    .mobile-detail-item .detail-value.positive {
        color: #10b981;
        font-weight: 500;
    }

    .mobile-detail-item .detail-value.negative {
        color: #ef4444;
        font-weight: 500;
    }

    /* 移动端底部状态 - 自选状态 */
    .mobile-stock-footer {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding-top: 6px;
        border-top: 1px solid #f1f5f9;
        font-size: 0.7rem;
        margin-top: 8px;
    }

    .stock-status {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #10b981;
        font-weight: 400;
    }

    /* 移动端下拉菜单样式 */
    .mobile-card-layout .el-dropdown-menu {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: none;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        padding: 8px;
        min-width: 160px;
    }

    .mobile-card-layout .el-dropdown-menu .el-dropdown-menu__item {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #1d1d1f;
    }

    .mobile-card-layout .el-dropdown-menu .el-dropdown-menu__item:last-child {
        margin-bottom: 0;
    }

    .mobile-card-layout .el-dropdown-menu .el-dropdown-menu__item:hover {
        background: #f2f2f7;
        color: #1d1d1f;
    }

    .mobile-card-layout .el-dropdown-menu .el-dropdown-menu__item svg {
        width: 14px;
        height: 14px;
        opacity: 0.7;
    }

    .watchlist-stock-card .stock-item-actions .el-button {
        font-weight: 600;
        border: none;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }

    .watchlist-stock-card .stock-item-actions .el-button svg {
        width: 12px;
        height: 12px;
    }

    .watchlist-stock-card .remove-watchlist-btn {
        background: rgba(255, 59, 48, 0.1);
        color: #ff3b30;
    }

    .watchlist-stock-card .remove-watchlist-btn:hover {
        background: rgba(255, 59, 48, 0.15);
        transform: scale(0.98);
    }

    .watchlist-stock-card .paid-analysis-btn {
        background: rgba(0, 122, 255, 0.1);
        color: #007aff;
    }

    .watchlist-stock-card .paid-analysis-btn:hover {
        background: rgba(0, 122, 255, 0.15);
        transform: scale(0.98);
    }

    .watchlist-stock-card .quant-analysis-btn {
        background: rgba(52, 199, 89, 0.1);
        color: #34c759;
    }

    .watchlist-stock-card .quant-analysis-btn:hover {
        background: rgba(52, 199, 89, 0.15);
        transform: scale(0.98);
    }

    .watchlist-stock-card .buy-stock-btn-secondary {
        background: rgba(255, 149, 0, 0.1);
        color: #ff9500;
    }

    .watchlist-stock-card .buy-stock-btn-secondary:hover {
        background: rgba(255, 149, 0, 0.15);
        transform: scale(0.98);
    }

    /* 价格标签 */
    .watchlist-stock-card .price-tag-container {
        margin-left: 4px;
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .watchlist-stock-card .price-tag {
        font-size: 0.6rem;
        padding: 2px 4px;
        border-radius: 4px;
        font-weight: 600;
        line-height: 1;
    }

    .watchlist-stock-card .original-price {
        background: rgba(142, 142, 147, 0.12);
        color: #8e8e93;
        text-decoration: line-through;
    }

    .watchlist-stock-card .promo-price {
        background: rgba(255, 59, 48, 0.1);
        color: #ff3b30;
    }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
    .watchlist-display-container {
        padding: 6px;
    }

    .watchlist-stock-card {
        padding: 14px;
        border-radius: 14px;
        margin-bottom: 10px;
    }

    .watchlist-stock-card .current-price {
        font-size: 1.2rem;
    }

    .watchlist-stock-card .price-change {
        font-size: 0.8rem;
        padding: 3px 8px;
    }

    .watchlist-stock-card .stock-details {
        padding: 12px;
        margin: 12px 0;
    }

    .watchlist-stock-card .detail-item {
        padding: 6px 0;
    }

    .watchlist-stock-card .detail-label {
        font-size: 0.75rem;
    }

    .watchlist-stock-card .detail-value {
        font-size: 0.8rem;
    }

    .watchlist-stock-card .stock-item-actions {
        gap: 6px;
        padding-top: 12px;
    }

    .watchlist-stock-card .stock-item-actions .el-button {
        height: 32px;
        font-size: 0.7rem;
        padding: 0 10px;
        border-radius: 10px;
    }

    .watchlist-stock-card .stock-item-actions .el-button svg {
        width: 11px;
        height: 11px;
    }
}

/* 移动端刷新按钮样式 */
.mobile-refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #ffffff;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mobile-refresh-btn:hover {
    background: #f3f4f6;
    color: #3b82f6;
    border-color: #3b82f6;
}

.mobile-refresh-btn:active {
    transform: scale(0.95);
    background: #e5e7eb;
}

.mobile-refresh-btn svg {
    width: 10px;
    height: 10px;
}
</style>

<!-- 全局tooltip样式 -->
<style>
.recommend-tooltip {
    max-width: 300px !important;
}

.recommend-tooltip .el-popper__content {
    padding: 12px 16px !important;
    background: rgba(55, 65, 81, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
}
</style>
