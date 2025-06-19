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
                    <el-dropdown @command="handleCommand">
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
                                <el-dropdown-item command="reset-guide">重新引导</el-dropdown-item>
                                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
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
            @click="toggleChatHistory" title="展开聊天记录">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
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
                    <div class="modern-title">👋 您好，我是智投小助</div>
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="2" />
                                    <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="white" stroke-width="2"
                                        fill="white" />
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
                        <div v-if="message.content" class="message-text">{{ message.content }}</div>

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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        stroke="currentColor" stroke-width="2" />
                                </svg>
                                加入自选
                            </el-button>
                            <el-button v-else type="success" size="small"
                                @click="removeFromWatchlist(message.stockInfo.code)" class="remove-watchlist-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        fill="currentColor" />
                                </svg>
                                已加自选
                            </el-button>

                            <!-- 量化分析按钮（付费） -->
                            <el-button v-if="!message.isBuyMode" size="small"
                                @click="showPaidAnalysisDialog(message.stockInfo)" class="paid-analysis-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                        stroke="currentColor" stroke-width="2" />
                                </svg>
                                量化分析
                                <div class="price-tag-container">
                                    <span class="price-tag original-price">3智点</span>
                                    <span class="price-tag promo-price">1智点</span>
                                </div>
                            </el-button>

                            <!-- AI委托交易按钮（付费） -->
                            <el-button v-if="!message.isBuyMode" size="small"
                                @click="showQuantAnalysisDialog(message.stockInfo)" class="quant-analysis-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                        fill="none" />
                                </svg>
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
                        </div>

                        <!-- 量化分析报告操作按钮 -->
                        <div v-if="message.isQuantAnalysis" class="quant-analysis-actions">
                            <div class="analysis-actions-header">
                                <span class="actions-title">📊 报告操作</span>
                                <div v-if="activeReminders.filter(r => r.isActive).length > 0"
                                    class="active-reminders-badge">
                                    <span class="badge-icon">🔔</span>
                                    <span class="badge-text">{{activeReminders.filter(r => r.isActive).length
                                    }}个活跃提醒</span>
                                </div>
                            </div>
                            <div class="analysis-actions-buttons">
                                <el-button size="small" @click="setQuantAnalysisReminder(message)" class="reminder-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                                            fill="currentColor" />
                                    </svg>
                                    设置提醒
                                    <span v-if="activeReminders.filter(r => r.isActive).length > 0"
                                        class="reminder-count-badge">
                                        {{activeReminders.filter(r => r.isActive).length}}
                                    </span>
                                </el-button>
                                <el-button size="small" @click="openRecordsCenter" class="records-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                            stroke="currentColor" stroke-width="2" fill="none" />
                                        <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"
                                            fill="none" />
                                        <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
                                        <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
                                        <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2"
                                            fill="none" />
                                    </svg>
                                    查看报告
                                </el-button>
                            </div>
                            <div class="analysis-tip">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="#1890ff" stroke-width="2" fill="none" />
                                    <path d="m9 12 2 2 4-4" stroke="#1890ff" stroke-width="2" fill="none" />
                                </svg>
                                <span>💡 付费的量化分析报告可以在记录中心查看</span>
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
                                        <div v-if="message.assetData.portfolioData.length > 0" class="portfolio-list">
                                            <div v-for="position in message.assetData.portfolioData"
                                                :key="position.code" class="stock-item">
                                                <div class="stock-info">
                                                    <div class="stock-header">
                                                        <div class="stock-name-code">
                                                            <div class="name-code-row">
                                                                <span class="stock-name">{{ position.name }}</span>
                                                                <span class="stock-code">({{ position.code }})</span>
                                                            </div>
                                                            <!-- 持仓盈亏状态 -->
                                                            <div class="position-status">
                                                                <span class="status-label">持仓状态：</span>
                                                                <span
                                                                    :class="['status-value', position.profitPercent >= 0 ? 'profit' : 'loss']">
                                                                    {{ position.profitPercent >= 0 ? '盈利' : '亏损' }}
                                                                    {{ position.profitPercent >= 0 ? '+' : '' }}{{
                                                                        position.profitPercent }}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div class="stock-price-change">
                                                            <span class="current-price">¥{{
                                                                position.currentPrice.toFixed(2)
                                                            }}</span>
                                                            <span
                                                                :class="['price-change', position.profitPercent >= 0 ? 'positive' : 'negative']">
                                                                {{ position.profitPercent >= 0 ? '+' : '' }}¥{{
                                                                    Math.abs(position.profit).toFixed(2) }}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div class="stock-details">
                                                        <div class="detail-row">
                                                            <span class="detail-label">持仓数量：</span>
                                                            <span class="detail-value">{{
                                                                position.quantity.toLocaleString()
                                                            }}股</span>
                                                            <span class="detail-label">成本价：</span>
                                                            <span class="detail-value">¥{{ position.avgPrice.toFixed(2)
                                                            }}</span>
                                                        </div>
                                                        <div class="detail-row">
                                                            <span class="detail-label">持仓市值：</span>
                                                            <span class="detail-value target-price">¥{{
                                                                formatCurrency(position.marketValue) }}</span>
                                                            <span class="detail-label">所属行业：</span>
                                                            <span class="detail-value industry">{{ position.industry ||
                                                                '未分类'
                                                            }}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="stock-item-actions">
                                                    <!-- 卖出按钮 -->
                                                    <el-button size="small" @click="showBuyDialog(position, 'sell')"
                                                        class="sell-stock-btn">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                        卖出
                                                    </el-button>

                                                    <!-- 买入按钮（加仓） -->
                                                    <el-button size="small" @click="showBuyDialog(position, 'buy')"
                                                        class="buy-stock-btn-secondary">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                        加仓
                                                    </el-button>

                                                    <!-- 量化分析按钮（付费） -->
                                                    <el-button size="small" @click="showPaidAnalysisDialog(position)"
                                                        class="paid-analysis-btn">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                        量化分析
                                                        <div class="price-tag-container">
                                                            <span class="price-tag original-price">3智点</span>
                                                            <span class="price-tag promo-price">1智点</span>
                                                        </div>
                                                    </el-button>

                                                    <!-- AI委托交易按钮（付费） -->
                                                    <el-button size="small" @click="showQuantAnalysisDialog(position)"
                                                        class="quant-analysis-btn">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor"
                                                                stroke-width="2" fill="none" />
                                                        </svg>
                                                        AI委托交易
                                                        <div class="price-tag-container">
                                                            <span class="price-tag original-price">3智点</span>
                                                            <span class="price-tag promo-price">1智点</span>
                                                        </div>
                                                    </el-button>
                                                </div>
                                            </div>
                                        </div>

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
                                        <div v-if="message.assetData.watchlistData.length > 0" class="watchlist-list">
                                            <div v-for="stock in message.assetData.watchlistData" :key="stock.code"
                                                class="stock-item">
                                                <div class="stock-info">
                                                    <div class="stock-header">
                                                        <div class="stock-name-code">
                                                            <div class="name-code-row">
                                                                <span class="stock-name">{{ stock.name }}</span>
                                                                <span class="stock-code">({{ stock.code }})</span>
                                                            </div>
                                                            <!-- 关注状态 -->
                                                            <div class="watchlist-status">
                                                                <span class="status-label">关注状态：</span>
                                                                <span class="status-value watchlist-active">
                                                                    ⭐ 已关注
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div class="stock-price-change">
                                                            <span class="current-price">¥{{
                                                                getCurrentStockPrice(stock.code).toFixed(2) }}</span>
                                                            <span class="price-change neutral">
                                                                实时价格
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div class="stock-details">
                                                        <div class="detail-row">
                                                            <span class="detail-label">股票代码：</span>
                                                            <span class="detail-value">{{ stock.code }}</span>
                                                            <span class="detail-label">当前价格：</span>
                                                            <span class="detail-value target-price">¥{{
                                                                getCurrentStockPrice(stock.code).toFixed(2) }}</span>
                                                        </div>
                                                        <div class="detail-row">
                                                            <span class="detail-label">关注时间：</span>
                                                            <span class="detail-value">{{
                                                                formatRecommendationTime(stock.addTime
                                                                    || new Date()) }}</span>
                                                            <span class="detail-label">股票类型：</span>
                                                            <span class="detail-value industry">自选关注</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="stock-item-actions">
                                                    <!-- 移除自选按钮 -->
                                                    <el-button size="small" @click="removeFromWatchlist(stock.code)"
                                                        class="remove-watchlist-btn">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                                fill="currentColor" />
                                                        </svg>
                                                        移除关注
                                                    </el-button>

                                                    <!-- 量化分析按钮（付费） -->
                                                    <el-button size="small" @click="showPaidAnalysisDialog(stock)"
                                                        class="paid-analysis-btn">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                        量化分析
                                                        <div class="price-tag-container">
                                                            <span class="price-tag original-price">3智点</span>
                                                            <span class="price-tag promo-price">1智点</span>
                                                        </div>
                                                    </el-button>

                                                    <!-- AI委托交易按钮（付费） -->
                                                    <el-button size="small" @click="showQuantAnalysisDialog(stock)"
                                                        class="quant-analysis-btn">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor"
                                                                stroke-width="2" fill="none" />
                                                        </svg>
                                                        AI委托交易
                                                        <div class="price-tag-container">
                                                            <span class="price-tag original-price">3智点</span>
                                                            <span class="price-tag promo-price">1智点</span>
                                                        </div>
                                                    </el-button>

                                                    <!-- 购买按钮 -->
                                                    <el-button size="small" @click="showBuyDialog(stock)"
                                                        class="buy-stock-btn-secondary">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path
                                                                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                                                stroke="currentColor" stroke-width="2" />
                                                        </svg>
                                                        购买
                                                    </el-button>
                                                </div>
                                            </div>
                                        </div>

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
                            <!-- 荐股列表操作栏 -->
                            <div v-if="message.isPersistent" class="recommendation-toolbar">
                                <div class="toolbar-left">
                                    <span class="recommendation-time">{{ formatRecommendationTime(message.timestamp)
                                    }}</span>
                                </div>
                                <div class="toolbar-right">
                                    <el-button size="small" text @click="refreshRecommendation(message)"
                                        class="refresh-recommendation-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                                                stroke="currentColor" stroke-width="2" fill="none" />
                                        </svg>
                                        刷新荐股
                                    </el-button>
                                </div>
                            </div>
                            <div v-for="(stock, stockIdx) in message.stockList"
                                :key="`${message.messageId || idx}-${stockIdx}`" class="stock-item">
                                <div class="stock-info">
                                    <div class="stock-header">
                                        <div class="stock-name-code">
                                            <div class="name-code-row">
                                                <span class="stock-name">{{ stock.name }}</span>
                                                <span class="stock-code">({{ stock.code }})</span>
                                            </div>
                                            <!-- 推荐指数 -->
                                            <div class="recommend-index">
                                                <div class="recommend-stars">
                                                    <span v-for="i in 5" :key="i" :class="['star', i <= Math.floor(stock.recommendIndex) ? 'filled' :
                                                        i <= stock.recommendIndex ? 'half' : 'empty']">
                                                        ★
                                                    </span>
                                                </div>
                                                <span class="recommend-score">{{ stock.recommendIndex }}/5.0</span>
                                                <span
                                                    :class="['recommend-level', getRecommendLevelClass(stock.recommendLevel)]">
                                                    {{ stock.recommendLevel }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="stock-price-change">
                                            <span class="current-price">¥{{ stock.price }}</span>
                                            <span
                                                :class="['price-change', stock.change >= 0 ? 'positive' : 'negative']">
                                                {{ stock.change >= 0 ? '+' : '' }}{{ stock.change }}
                                                ({{ stock.changePercent >= 0 ? '+' : '' }}{{ stock.changePercent }}%)
                                            </span>
                                        </div>
                                    </div>

                                    <div class="stock-details">
                                        <div class="detail-row">
                                            <span class="detail-label">目标价：</span>
                                            <span class="detail-value target-price">¥{{ stock.targetPrice }}</span>
                                            <span class="detail-label">预期收益：</span>
                                            <span class="detail-value expected-return">{{ stock.expectedReturn }}</span>
                                        </div>
                                        <div class="detail-row">
                                            <span class="detail-label">风险等级：</span>
                                            <span class="detail-value risk-level">{{ stock.riskLevel }}</span>
                                            <span class="detail-label">所属行业：</span>
                                            <span class="detail-value industry">{{ stock.industry }}</span>
                                        </div>
                                        <div class="stock-reason">
                                            <span class="reason-label">推荐理由：</span>
                                            <span class="reason-text">{{ stock.reason }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="stock-item-actions">
                                    <!-- 自选股按钮 -->
                                    <el-button v-if="!userStore.isInWatchlist(stock.code)" type="primary" size="small"
                                        @click="addToWatchlist(stock)" class="add-watchlist-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                        加入自选
                                    </el-button>
                                    <el-button v-else type="success" size="small"
                                        @click="removeFromWatchlist(stock.code)" class="remove-watchlist-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                fill="currentColor" />
                                        </svg>
                                        已加自选
                                    </el-button>

                                    <!-- 量化分析按钮（付费） -->
                                    <el-button size="small" @click="showPaidAnalysisDialog(stock)"
                                        class="paid-analysis-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                        量化分析
                                        <div class="price-tag-container">
                                            <span class="price-tag original-price">3智点</span>
                                            <span class="price-tag promo-price">1智点</span>
                                        </div>
                                    </el-button>

                                    <!-- AI委托交易按钮（付费） -->
                                    <el-button size="small" @click="showQuantAnalysisDialog(stock)"
                                        class="quant-analysis-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                                fill="none" />
                                        </svg>
                                        AI委托交易
                                        <div class="price-tag-container">
                                            <span class="price-tag original-price">3智点</span>
                                            <span class="price-tag promo-price">1智点</span>
                                        </div>
                                    </el-button>

                                    <!-- 购买按钮 -->
                                    <el-button size="small" @click="showBuyDialog(stock)"
                                        class="buy-stock-btn-secondary">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                        购买
                                    </el-button>
                                </div>
                            </div>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                    fill="none" />
                            </svg>
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
                                    <line x1="22" y1="2" x2="11" y2="13" stroke="white" stroke-width="2" />
                                    <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="white" stroke-width="2"
                                        fill="white" />
                                </svg>
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- 侧边栏（仅在登录后显示） -->
        <Sidebar v-if="userStore.isLoggedIn" @send-to-chat="handleSidebarInteraction" @show-buy-dialog="showBuyDialog"
            @show-sell-dialog="handleShowSellDialog" />

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
        <StockTradingDialog v-model="buyDialogVisible" :stock="selectedStock" :trade-type="tradeType"
            @trade-completed="handleTradeCompleted" @watchlist-changed="handleWatchlistChanged" />

        <!-- AI委托交易设置对话框 -->
        <AITradingDialog v-model="showAITradingDialog" :stock="selectedStockForAITrading"
            @ai-trading-confirmed="handleAITradingConfirmed" />

        <!-- 自定义快捷操作对话框 -->
        <CustomizeShortcutsDialog v-model="customizeDialogVisible" @shortcuts-updated="handleShortcutsUpdated" />

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
                    <h4>📊 股票信息</h4>
                    <div class="stock-info-display">
                        <span class="stock-name">{{ reminderForm.stockName }}</span>
                        <span class="stock-code">({{ reminderForm.stockCode }})</span>
                    </div>
                </div>

                <div class="reminder-form-section">
                    <h4>⚙️ 提醒条件设置</h4>

                    <div class="form-row">
                        <label class="form-label">提醒类型：</label>
                        <el-select v-model="reminderForm.type" placeholder="选择提醒类型" class="type-select">
                            <el-option label="价格突破" value="price">
                                <span class="option-content">
                                    <span class="option-icon">💰</span>
                                    <span>价格突破</span>
                                </span>
                            </el-option>
                            <el-option label="涨跌幅" value="change">
                                <span class="option-content">
                                    <span class="option-icon">📈</span>
                                    <span>涨跌幅</span>
                                </span>
                            </el-option>
                            <el-option label="成交量" value="volume">
                                <span class="option-content">
                                    <span class="option-icon">📊</span>
                                    <span>成交量</span>
                                </span>
                            </el-option>
                        </el-select>
                    </div>

                    <div class="form-row">
                        <label class="form-label">触发条件：</label>
                        <el-select v-model="reminderForm.condition" placeholder="选择触发条件" class="condition-select">
                            <template v-if="reminderForm.type === 'price'">
                                <el-option label="突破（大于等于）" value="above"></el-option>
                                <el-option label="跌破（小于等于）" value="below"></el-option>
                            </template>
                            <template v-else-if="reminderForm.type === 'change'">
                                <el-option label="涨幅超过" value="increase"></el-option>
                                <el-option label="跌幅超过" value="decrease"></el-option>
                            </template>
                            <template v-else-if="reminderForm.type === 'volume'">
                                <el-option label="放量（超过）" value="above"></el-option>
                                <el-option label="缩量（低于）" value="below"></el-option>
                            </template>
                        </el-select>
                    </div>

                    <div class="form-row">
                        <label class="form-label">数值设置：</label>
                        <div class="value-input-group">
                            <el-input v-model="reminderForm.value" type="number" :placeholder="getValuePlaceholder()"
                                class="value-input">
                                <template #append>
                                    <span class="input-unit">{{ getValueUnit() }}</span>
                                </template>
                            </el-input>
                        </div>
                    </div>

                    <div class="reminder-preview">
                        <div class="preview-title">📋 提醒预览</div>
                        <div class="preview-content">
                            {{ getReminderPreview() }}
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
import { useUserStore } from '../store/user';
import { useChatHistoryStore } from '../store/chatHistory';
import { User, Lock, ArrowDown, ArrowUp, Plus, Edit, Delete } from '@element-plus/icons-vue';
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
import AITradingDialog from '../components/AITradingDialog.vue';
import CustomizeShortcutsDialog from '../components/CustomizeShortcutsDialog.vue';
import ChatHistory from '../components/ChatHistory.vue';

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
    type: 'price', // price, change, volume
    condition: 'above', // above, below, increase, decrease
    value: '',
    stockCode: '',
    stockName: ''
});
const activeReminders = ref([]); // 活跃的提醒列表

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
        icon: '🧠',
        title: '智能复盘',
        shortTitle: '复盘',
        description: '智能分析市场表现和投资策略',
        action: () => setSuggestionAndSend('智能复盘：请帮我进行全面的智能投资复盘分析，包括：\n\n1. 市场整体走势分析（主要指数表现、板块轮动）\n2. 我的投资组合表现分析和风险评估\n3. 基于AI算法的策略优化建议\n4. 市场情绪和技术指标综合分析\n5. 个性化的下一步操作建议\n6. 风险预警和机会识别\n7. 智能资产配置优化方案\n\n请结合我的投资风格和市场大数据，给出专业的智能化复盘建议。'),
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
        icon: '🎯',
        title: '智能荐股',
        shortTitle: '荐股',
        description: '基于AI算法推荐优质股票',
        action: () => handleSmartRecommendation(),
        isDefault: true,
        isActive: true
    },
    {
        id: 'news_update',
        icon: '📰',
        title: '资讯推送',
        shortTitle: '资讯',
        description: '获取最新市场资讯和重要公告',
        action: () => handleNewsUpdate(),
        isDefault: true,
        isActive: true
    },
    {
        id: 'asset_analysis',
        icon: '💰',
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

// 选项配置
const riskOptions = [
    {
        value: 'conservative',
        title: '求稳型',
        desc: '像存银行一样稳，但收益比存款高一点',
        simpleDesc: '投1万元，一年大概赚300-600元',
        maxLoss: '最多亏500元',
        examples: '大银行股票（工商银行、建设银行）',
        maxDrawdown: '5%',
        expectedReturn: '3-6%',
        riskLevel: 1,
        icon: '🛡️'
    },
    {
        value: 'stable',
        title: '稳健型',
        desc: '选择知名大公司，收益稳定有保障',
        simpleDesc: '投1万元，一年大概赚600-1000元',
        maxLoss: '最多亏1000元',
        examples: '知名品牌（茅台、招商银行、美的）',
        maxDrawdown: '10%',
        expectedReturn: '6-10%',
        riskLevel: 2,
        icon: '🏦'
    },
    {
        value: 'balanced',
        title: '均衡型',
        desc: '稳健和成长兼顾，适合大多数人',
        simpleDesc: '投1万元，一年大概赚1000-1500元',
        maxLoss: '最多亏1500元',
        examples: '优质公司组合（银行+白酒+新能源）',
        maxDrawdown: '15%',
        expectedReturn: '10-15%',
        riskLevel: 3,
        icon: '⚖️'
    },
    {
        value: 'growth',
        title: '成长型',
        desc: '追求更高收益，选择有潜力的公司',
        simpleDesc: '投1万元，一年大概赚1500-2500元',
        maxLoss: '最多亏2000元',
        examples: '热门科技股（比亚迪、宁德时代）',
        maxDrawdown: '20%',
        expectedReturn: '15-25%',
        riskLevel: 4,
        icon: '🚀'
    },
    {
        value: 'aggressive',
        title: '进取型',
        desc: '追求最高收益，但风险也最大',
        simpleDesc: '投1万元，一年可能赚2500元以上',
        maxLoss: '可能亏3000元以上',
        examples: '新兴小公司股票（创业板、科创板）',
        maxDrawdown: '30%+',
        expectedReturn: '25%+',
        riskLevel: 5,
        icon: '⚡'
    }
];

const experienceOptions = [
    {
        value: 'beginner',
        title: '投资新手',
        label: '我是投资新手，想稳步学习',
        desc: '刚开始接触投资，希望从简单稳健的方式开始',
        icon: '🌱'
    },
    {
        value: 'experienced',
        title: '有投资经验',
        label: '我有一定投资经验，可以承担风险',
        desc: '已经有过投资经历，了解市场波动，能接受一定风险',
        icon: '📈'
    }
];

const userTraits = [
    {
        id: 'risk_tolerance',
        title: '风险承受',
        desc: '您能接受多大的投资波动？',
        icon: '🛡️',
        options: [
            { value: 1, label: '1分', desc: '完全不能接受亏损，只要保本' },
            { value: 2, label: '2分', desc: '可接受很小的波动，亏损不超过5%' },
            { value: 3, label: '3分', desc: '可接受适度波动，亏损不超过15%' },
            { value: 4, label: '4分', desc: '可接受较大波动，亏损不超过25%' },
            { value: 5, label: '5分', desc: '可接受高风险，亏损超过30%也能承受' }
        ],
        defaultValue: 3
    },
    {
        id: 'active_participation',
        title: '主动参与',
        desc: '您希望多深度参与投资决策？',
        icon: '🎯',
        options: [
            { value: 1, label: '1分', desc: '完全不想管，全部交给专业人士' },
            { value: 2, label: '2分', desc: '偶尔关注，主要听专业建议' },
            { value: 3, label: '3分', desc: '适度参与，听建议但自己决定' },
            { value: 4, label: '4分', desc: '积极参与，自己研究后做决策' },
            { value: 5, label: '5分', desc: '完全主导，所有决策都自己做' }
        ],
        defaultValue: 3
    },
    {
        id: 'learning_willingness',
        title: '学习意愿',
        desc: '您愿意花多少时间学习投资？',
        icon: '📚',
        options: [
            { value: 1, label: '1分', desc: '完全没时间学习投资知识' },
            { value: 2, label: '2分', desc: '偶尔看看新闻，了解大概' },
            { value: 3, label: '3分', desc: '定期看资讯，学习基础知识' },
            { value: 4, label: '4分', desc: '主动学习，研究投资策略' },
            { value: 5, label: '5分', desc: '深度学习，钻研各种投资理论' }
        ],
        defaultValue: 3
    },
    {
        id: 'strategy_dependency',
        title: '策略复杂度',
        desc: '您更倾向于哪种投资策略？',
        icon: '📊',
        options: [
            { value: 1, label: '1分', desc: '最简单策略，买了就长期持有' },
            { value: 2, label: '2分', desc: '简单策略，偶尔调整持仓' },
            { value: 3, label: '3分', desc: '中等策略，定期优化投资组合' },
            { value: 4, label: '4分', desc: '复杂策略，使用多种投资工具' },
            { value: 5, label: '5分', desc: '高级策略，运用各种量化模型' }
        ],
        defaultValue: 2
    },
    {
        id: 'trading_frequency',
        title: '交易频次',
        desc: '您计划多久调整一次投资？',
        icon: '⏰',
        options: [
            { value: 1, label: '1分', desc: '很少交易，半年以上才调整' },
            { value: 2, label: '2分', desc: '低频交易，2-3个月调整一次' },
            { value: 3, label: '3分', desc: '中频交易，每月都会看看调整' },
            { value: 4, label: '4分', desc: '高频交易，每周都关注调整' },
            { value: 5, label: '5分', desc: '超高频，几乎每天都在交易' }
        ],
        defaultValue: 2
    },
    {
        id: 'innovation_trial',
        title: '创新接受度',
        desc: '您对新的投资产品态度如何？',
        icon: '🚀',
        options: [
            { value: 1, label: '1分', desc: '非常保守，只投最传统的产品' },
            { value: 2, label: '2分', desc: '比较保守，只投成熟稳定的产品' },
            { value: 3, label: '3分', desc: '适度开放，了解清楚后会尝试' },
            { value: 4, label: '4分', desc: '比较开放，愿意尝试新兴产品' },
            { value: 5, label: '5分', desc: '非常开放，积极尝试各种新产品' }
        ],
        defaultValue: 3
    }
];

// 大分类配置（最多选择2个）
const majorSectorOptions = [
    {
        value: 'technology',
        label: '科技板块',
        icon: '💻',
        desc: '包含互联网、软件、硬件、人工智能等科技相关行业',
        color: '#3b82f6'
    },
    {
        value: 'finance',
        label: '金融板块',
        icon: '🏦',
        desc: '包含银行、保险、证券、支付等金融服务行业',
        color: '#10b981'
    },
    {
        value: 'consumer',
        label: '消费板块',
        icon: '🛍️',
        desc: '包含食品饮料、服装、家电、零售等消费相关行业',
        color: '#f59e0b'
    },
    {
        value: 'healthcare',
        label: '医疗板块',
        icon: '🏥',
        desc: '包含医药、医疗器械、生物技术等医疗健康行业',
        color: '#ef4444'
    },
    {
        value: 'industrial',
        label: '工业板块',
        icon: '🏭',
        desc: '包含制造业、基建、能源、材料等传统工业行业',
        color: '#8b5cf6'
    },
    {
        value: 'emerging',
        label: '新兴板块',
        icon: '🚀',
        desc: '包含新能源、环保、军工等新兴战略性行业',
        color: '#06b6d4'
    }
];

// 小分类配置（可选择3-4个）
const subSectorOptions = [
    // 科技板块下的小分类
    {
        value: 'internet',
        label: '互联网',
        parent: 'technology',
        icon: '🌐',
        desc: '电商、社交、搜索、云服务等互联网公司',
        examples: '腾讯、阿里巴巴、百度'
    },
    {
        value: 'chips',
        label: '芯片半导体',
        parent: 'technology',
        icon: '🔬',
        desc: '芯片设计、制造、封测等半导体产业链',
        examples: '中芯国际、韦尔股份、紫光国微'
    },
    {
        value: 'software',
        label: '软件服务',
        parent: 'technology',
        icon: '💾',
        desc: '企业软件、游戏、教育软件等',
        examples: '用友网络、恒生电子、三六零'
    },
    {
        value: 'ai',
        label: '人工智能',
        parent: 'technology',
        icon: '🤖',
        desc: 'AI算法、机器学习、智能硬件等',
        examples: '科大讯飞、海康威视、大华股份'
    },

    // 金融板块下的小分类
    {
        value: 'banks',
        label: '银行',
        parent: 'finance',
        icon: '🏛️',
        desc: '国有银行、股份制银行、城商行等',
        examples: '招商银行、平安银行、宁波银行'
    },
    {
        value: 'insurance',
        label: '保险',
        parent: 'finance',
        icon: '🛡️',
        desc: '人寿保险、财产保险等保险公司',
        examples: '中国平安、中国人寿、新华保险'
    },
    {
        value: 'securities',
        label: '证券',
        parent: 'finance',
        icon: '📈',
        desc: '证券公司、基金公司等',
        examples: '中信证券、华泰证券、东方财富'
    },

    // 消费板块下的小分类
    {
        value: 'food_beverage',
        label: '食品饮料',
        parent: 'consumer',
        icon: '🍷',
        desc: '白酒、饮料、食品加工等',
        examples: '贵州茅台、五粮液、伊利股份'
    },
    {
        value: 'retail',
        label: '零售',
        parent: 'consumer',
        icon: '🏪',
        desc: '超市、百货、电商零售等',
        examples: '永辉超市、苏宁易购、王府井'
    },
    {
        value: 'appliances',
        label: '家电',
        parent: 'consumer',
        icon: '📺',
        desc: '白色家电、黑色家电等',
        examples: '美的集团、格力电器、海尔智家'
    },

    // 医疗板块下的小分类
    {
        value: 'pharma',
        label: '医药制造',
        parent: 'healthcare',
        icon: '💊',
        desc: '化学药、中药、生物药等',
        examples: '恒瑞医药、云南白药、片仔癀'
    },
    {
        value: 'medical_devices',
        label: '医疗器械',
        parent: 'healthcare',
        icon: '🩺',
        desc: '医疗设备、体外诊断等',
        examples: '迈瑞医疗、鱼跃医疗、乐普医疗'
    },

    // 工业板块下的小分类
    {
        value: 'manufacturing',
        label: '先进制造',
        parent: 'industrial',
        icon: '⚙️',
        desc: '机械设备、精密制造等',
        examples: '三一重工、中联重科、徐工机械'
    },
    {
        value: 'materials',
        label: '基础材料',
        parent: 'industrial',
        icon: '🏗️',
        desc: '钢铁、有色金属、化工等',
        examples: '宝钢股份、紫金矿业、万华化学'
    },
    {
        value: 'infrastructure',
        label: '基础设施',
        parent: 'industrial',
        icon: '🌉',
        desc: '建筑、交通、公用事业等',
        examples: '中国建筑、中国中铁、长江电力'
    },

    // 新兴板块下的小分类
    {
        value: 'new_energy',
        label: '新能源',
        parent: 'emerging',
        icon: '🔋',
        desc: '光伏、风电、储能、新能源车等',
        examples: '宁德时代、比亚迪、隆基绿能'
    },
    {
        value: 'environmental',
        label: '环保',
        parent: 'emerging',
        icon: '🌱',
        desc: '污水处理、固废处理、大气治理等',
        examples: '碧水源、启迪环境、龙净环保'
    },
    {
        value: 'military',
        label: '军工',
        parent: 'emerging',
        icon: '🛡️',
        desc: '军工装备、航空航天等',
        examples: '中航沈飞、航发动力、中直股份'
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
        // 新用户注册成功，引导设置投资偏好
        setTimeout(() => {
            preferencesDialogVisible.value = true;
        }, 500);
    } else {
        // 老用户登录成功
        dismissGuide();
        // 检查老用户是否已设置偏好，如果没有则引导设置
        setTimeout(() => {
            checkUserStatus();
        }, 500);
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



const handleCommand = (command) => {
    switch (command) {
        case 'profile':
            showUserProfile.value = true;
            break;
        case 'settings':
            preferencesDialogVisible.value = true;
            break;
        case 'records':
            showRecordsCenter.value = true;
            break;
        case 'reset-guide':
            resetOnboarding();
            break;
        case 'logout':
            userStore.logout();
            break;
    }
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

    const res = await mockApi.sendMessage(message);

    // 添加AI回复
    chatHistory.value.push(res.data);
    chatHistoryStore.addMessageToCurrentChat(res.data);

    await nextTick();
    scrollToBottom();

    // 移动端消息发送后的处理
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
    isMobileView.value = window.innerWidth <= 768;
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
                        // Android Chrome 浏览器工具栏高度通常在56-72px
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
    let message = '智能荐股：根据我的投资偏好推荐优质股票';

    if (userPreferences) {
        message += `\n\n我的投资偏好：
- 风险偏好：${getRiskLevelText(userPreferences.riskLevel)}
- 投资经验：${userPreferences.experience === 'beginner' ? '新手' : '有经验'}
- 关注板块：${userPreferences.sectors?.majorCategories?.join('、') || '未设置'}`;
    }

    const res = await mockApi.sendMessage(message);

    // 为荐股消息添加持久化标识和唯一ID
    const recommendationMessage = {
        ...res.data,
        isPersistent: true,
        messageId: `recommendation-${Date.now()}`,
        timestamp: new Date().toISOString()
    };

    chatHistory.value.push(
        { role: 'user', content: '智能荐股：根据我的投资偏好推荐优质股票' },
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
            watchlistData: userStore.watchlist.slice(0, 8) // 显示前8只自选股
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
            { code: '600519', name: '贵州茅台', industry: '食品饮料', addTime: '2024-01-15T09:30:00.000Z' },
            { code: '000001', name: '平安银行', industry: '银行', addTime: '2024-01-14T10:15:00.000Z' },
            { code: '300750', name: '宁德时代', industry: '新能源', addTime: '2024-01-13T14:20:00.000Z' },
            { code: '000858', name: '五粮液', industry: '食品饮料', addTime: '2024-01-12T11:45:00.000Z' },
            { code: '002415', name: '海康威视', industry: '电子', addTime: '2024-01-11T13:30:00.000Z' }
        ];

        userStore.watchlist.push(...sampleWatchlist);
        localStorage.setItem('watchlist', JSON.stringify(userStore.watchlist));
        ElMessage.info('已为您添加示例自选股数据');
    }

    // 构建自选股查看消息
    const watchlistData = userStore.watchlist.map(stock => {
        const currentPrice = getCurrentStockPrice(stock.code);
        const yesterdayPrice = currentPrice * (1 - (Math.random() * 0.1 - 0.05)); // 模拟昨日价格
        const changeAmount = currentPrice - yesterdayPrice;
        const changePercent = ((changeAmount / yesterdayPrice) * 100).toFixed(2);

        return {
            ...stock,
            currentPrice: currentPrice.toFixed(2),
            changeAmount: changeAmount.toFixed(2),
            changePercent: parseFloat(changePercent)
        };
    });

    const message = `自选股：请分析我的自选股票表现，包括：

**我的自选股列表（${userStore.watchlist.length}只）**
${watchlistData.map(stock =>
        `- ${stock.name}(${stock.code})：¥${stock.currentPrice} ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent}%`
    ).join('\n')}

请提供以下分析：
1. 今日表现最佳和最差的股票
2. 各行业板块的表现情况
3. 技术面和基本面分析要点
4. 买入、卖出或继续观察的建议
5. 风险提示和注意事项
6. 相关热点和催化因素分析

请结合市场环境和个股基本面，给出专业的投资建议。`;

    const res = await mockApi.sendMessage(message);

    chatHistory.value.push(
        { role: 'user', content: '自选股：查看我的自选股票分析' },
        {
            ...res.data,
            hasWatchlistInfo: true,
            watchlistData: watchlistData
        }
    );

    await nextTick();
    scrollToBottom();
    ElMessage.success('已为您生成自选股分析报告');

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

    let message = '';

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
    } else {
        ElMessage.warning(`${stockInfo.name} 已在自选股中`);
    }
};

const removeFromWatchlist = (stockCode) => {
    if (userStore.removeFromWatchlist(stockCode)) {
        ElMessage.success('已从自选股中移除');
    } else {
        ElMessage.error('移除失败');
    }
};

const continueAnalysis = async (stockInfo, isPaid = false) => {
    let message;
    if (isPaid) {
        message = `【付费量化分析】请对${stockInfo.name}(${stockInfo.code})进行全面量化分析，包括：
1. 详细的基本面分析（财务指标、盈利能力、成长性）
2. 技术面分析（K线形态、技术指标、支撑阻力位）
3. 行业对比分析（同行业竞争优势、市场地位）
4. 未来发展前景（业务增长点、风险因素）
5. 具体投资建议（买入时机、目标价位、止损位）
6. 资金配置建议（仓位管理、分批建仓策略）`;
    } else {
        message = `请进一步分析${stockInfo.name}的投资价值，包括同行业对比、未来发展前景和具体的买入时机建议。`;
    }

    const res = await mockApi.sendMessage(message);
    chatHistory.value.push(
        { role: 'user', content: isPaid ? `量化分析 ${stockInfo.name}(${stockInfo.code})` : message },
        {
            ...res.data,
            hasStockInfo: true,
            stockInfo: stockInfo
        }
    );

    await nextTick();
    scrollToBottom();
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
    const map = {
        'conservative': '保守型',
        'stable': '稳健型',
        'balanced': '平衡型',
        'growth': '成长型',
        'aggressive': '激进型',
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'moderate': '稳健型'
    };
    return map[level] || '未设置';
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
    checkUserStatus();

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

    // 初始化测试数据（仅在开发环境）
    if (userStore.isLoggedIn && userStore.quantAnalysisReports.length === 0) {
        userStore.generateMockRecords();
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
            customClass: 'paid-service-dialog'
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
    showQuantReminderDialog.value = true;
    currentReminderMessage.value = message;
};

const openRecordsCenter = () => {
    showRecordsCenter.value = true;
};

// 提醒对话框处理方法
const handleReminderConfirm = () => {
    if (!reminderForm.value.value) {
        ElMessage.error('请输入提醒条件的数值');
        return;
    }

    const reminder = {
        id: Date.now(),
        type: reminderForm.value.type,
        condition: reminderForm.value.condition,
        value: parseFloat(reminderForm.value.value),
        stockCode: reminderForm.value.stockCode,
        stockName: reminderForm.value.stockName,
        createdAt: new Date().toLocaleString(),
        isActive: true
    };

    activeReminders.value.push(reminder);

    // 生成提醒描述
    let conditionText = '';
    if (reminder.type === 'price') {
        conditionText = `价格${reminder.condition === 'above' ? '突破' : '跌破'} ¥${reminder.value}`;
    } else if (reminder.type === 'change') {
        conditionText = `涨跌幅${reminder.condition === 'increase' ? '超过' : '低于'} ${reminder.value}%`;
    } else if (reminder.type === 'volume') {
        conditionText = `成交量${reminder.condition === 'above' ? '超过' : '低于'} ${reminder.value}万手`;
    }

    ElMessage.success(`已设置提醒：${reminder.stockName} ${conditionText}`);

    // 模拟提醒触发（实际应用中应该是后台监控）
    setTimeout(() => {
        ElMessage({
            message: `🔔 提醒触发：${reminder.stockName} ${conditionText}`,
            type: 'warning',
            duration: 5000,
            showClose: true
        });

        // 将提醒标记为已触发
        const index = activeReminders.value.findIndex(r => r.id === reminder.id);
        if (index !== -1) {
            activeReminders.value[index].isActive = false;
        }
    }, 10000); // 10秒后模拟触发提醒

    showQuantReminderDialog.value = false;
    resetReminderForm();
};

const handleReminderCancel = () => {
    showQuantReminderDialog.value = false;
    resetReminderForm();
};

const resetReminderForm = () => {
    reminderForm.value = {
        type: 'price',
        condition: 'above',
        value: '',
        stockCode: '',
        stockName: ''
    };
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
        case 'price':
            return '例如：15.50';
        case 'change':
            return '例如：5.0';
        case 'volume':
            return '例如：1000';
        default:
            return '请输入数值';
    }
};

const getValueUnit = () => {
    switch (reminderForm.value.type) {
        case 'price':
            return '元';
        case 'change':
            return '%';
        case 'volume':
            return '万手';
        default:
            return '';
    }
};

const getReminderPreview = () => {
    if (!reminderForm.value.value) {
        return '请完善提醒条件设置';
    }

    const { stockName, type, condition, value } = reminderForm.value;
    let conditionText = '';

    if (type === 'price') {
        conditionText = `价格${condition === 'above' ? '突破' : '跌破'} ¥${value}`;
    } else if (type === 'change') {
        conditionText = `${condition === 'increase' ? '涨幅' : '跌幅'}超过 ${value}%`;
    } else if (type === 'volume') {
        conditionText = `成交量${condition === 'above' ? '超过' : '低于'} ${value}万手`;
    }

    return `当 ${stockName} ${conditionText} 时，系统将发送提醒通知`;
};

const getReminderDescription = (reminder) => {
    let conditionText = '';
    if (reminder.type === 'price') {
        conditionText = `价格${reminder.condition === 'above' ? '突破' : '跌破'} ¥${reminder.value}`;
    } else if (reminder.type === 'change') {
        conditionText = `${reminder.condition === 'increase' ? '涨幅' : '跌幅'}超过 ${reminder.value}%`;
    } else if (reminder.type === 'volume') {
        conditionText = `成交量${reminder.condition === 'above' ? '超过' : '低于'} ${reminder.value}万手`;
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

// 重置个性化引导
const resetOnboarding = () => {
    ElMessageBox.confirm(
        '重新开始个性化引导将清除之前的设置，是否继续？',
        '重置引导',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(() => {
        // 清除本地存储的引导完成标记和用户偏好
        localStorage.removeItem('onboardingCompleted');
        localStorage.removeItem('userPreferences');

        // 重置相关状态
        showOnboarding.value = true;
        isChatMode.value = false;
        chatHistory.value = [];
        inputMessage.value = '';

        ElMessage.success('已重置个性化引导，请重新设置您的投资偏好');
    }).catch(() => {
        ElMessage.info('已取消重置');
    });
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
    z-index: 110;
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

/* 移动端悬浮按钮优化 */
@media (max-width: 768px) {
    .floating-history-toggle {
        width: 36px;
        height: 36px;
        top: 68px;
        left: 16px;
    }

    .floating-history-toggle svg {
        width: 14px;
        height: 14px;
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
    margin-bottom: 40px;
}

.modern-title {
    font-size: 2.8rem;
    font-weight: 800;
    color: #18181b;
    margin-bottom: 12px;
    letter-spacing: -1px;
}

.modern-desc {
    font-size: 1.1rem;
    color: #6b7280;
    margin-bottom: 24px;
    text-align: center;
    line-height: 1.6;
}

/* 快捷示例标签 */
.quick-examples {
    margin-top: 16px;
}

.examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 16px;
}

.examples-control {
    display: flex;
    justify-content: center;
    margin-top: 8px;
}

.control-container {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(226, 232, 240, 0.6);
    border-radius: 20px;
    backdrop-filter: blur(4px);
    transition: all 0.2s ease;
}

.control-container:hover {
    background: rgba(248, 250, 252, 0.9);
    border-color: rgba(59, 130, 246, 0.2);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
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
    gap: 8px;
}

.examples-indicator {
    font-size: 0.75rem;
    color: #475569;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.refresh-examples-btn {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #1d4ed8;
    transition: all 0.2s ease;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.refresh-examples-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    transform: rotate(180deg) scale(1.1);
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.example-tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: rgba(59, 130, 246, 0.1);
    color: #1d4ed8;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 16px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.example-tag:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .examples-content {
        gap: 6px;
    }

    .example-tag {
        font-size: 0.8rem;
        padding: 5px 10px;
    }

    .examples-indicator {
        font-size: 0.7rem;
    }

    .refresh-examples-btn {
        width: 28px;
        height: 28px;
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
        max-width: 85%;
    }

    /* 移动端聊天历史区域完整重新定义 */
    .chat-history-area {
        height: calc(100vh - 76px - 160px) !important;
        /* 减少高度：76px(导航+间距) + 160px(输入框空间) */
        padding: 0 0 32px 16px !important;
        /* 顶部无padding，左侧16px间距，底部32px避免遮挡 */
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
        padding-right: 12px !important;
        /* 为滚动条留出足够间距，避免内容贴边 */
    }

    /* 最后一条消息增加底部间距，确保与输入框有足够间隔 */
    .chat-message:last-child {
        margin-bottom: 32px;
    }

    .message-text {
        margin-bottom: 20px;
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
        font-size: 2rem;
        margin-bottom: 16px;
        /* 增加标题下方间距 */
        letter-spacing: -0.5px;
    }

    .modern-desc {
        font-size: 0.95rem;
        margin-bottom: 32px;
        /* 增加描述下方间距 */
        line-height: 1.6;
        /* 增加行高，提升可读性 */
        padding: 0 16px;
    }

    /* 移动端欢迎区域间距优化 */
    .welcome-section {
        margin-bottom: 32px;
        /* 增加欢迎区域下方间距 */
        padding-top: 20px;
        /* 增加欢迎区域上方间距 */
        padding-left: 20px;
        padding-right: 20px;
        /* 给欢迎区域添加左右间距，避免内容贴边 */
    }

    /* 移动端AI输入卡片间距优化 - 仅适用于非移动端 */
    .ai-card {
        margin-top: 24px;
        /* 增加AI输入卡片上方间距 */
        margin-bottom: 24px;
        /* 增加AI输入卡片下方间距 */
    }

    /* 移动端覆盖：AI卡片占满全屏 */
    @media (max-width: 768px) {
        .ai-card {
            margin: 0 !important;
            padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px)) 0 !important;
            border-radius: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            /* 移除左右padding，让AI卡片完全占满屏幕宽度 */
        }

        /* AI输入行添加左右内边距 */
        .ai-input-row {
            padding: 0 16px !important;
        }

        /* AI按钮行添加左右内边距 */
        .ai-buttons-row {
            padding: 0 16px !important;
        }
    }

    .quick-examples {
        margin-top: 16px;
        /* 增加快捷示例上方间距 */
    }

    .examples-content {
        margin-bottom: 16px;
        /* 增加示例内容下方间距 */
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
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 14px 20px;
    margin-left: auto;
    max-width: 100%;
    /* PC端聊天消息占满聊天框宽度，通过padding控制内容间距 */
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
    /* 确保长文本正确换行 */
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 14px 20px;
    margin-right: auto;
    max-width: 100%;
    /* PC端聊天消息占满聊天框宽度，通过padding控制内容间距 */
    font-size: 1rem;
    line-height: 1.5;
    word-wrap: break-word;
    /* 确保长文本正确换行 */
}

/* 聊天消息内容样式 */
.message-text {
    white-space: pre-line;
    margin-bottom: 28px;
}

.message-text:last-child {
    margin-bottom: 0;
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
    margin: -8px;
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

.portfolio-list,
.watchlist-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.stock-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
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

.recommend-level {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    text-align: center;
    min-width: 60px;
    white-space: nowrap;
    flex-shrink: 0;
}

.recommend-level.strong-recommend {
    color: #059669;
    background: #d1fae5;
    border: 1px solid #10b981;
}

.recommend-level.recommend {
    color: #0ea5e9;
    background: #e0f2fe;
    border: 1px solid #0ea5e9;
}

.recommend-level.neutral {
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
}

.recommend-level.caution {
    color: #dc2626;
    background: #fee2e2;
    border: 1px solid #f87171;
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
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.reason-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.reason-text {
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.4;
    margin-left: 8px;
}

.stock-item-actions {
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
    justify-content: flex-end;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
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

    /* 移动端股票信息字体优化 */
    .stock-name {
        font-size: 0.9rem;
    }

    .stock-code {
        font-size: 0.75rem;
    }

    .stock-item {
        padding: 12px;
    }

    /* 移动端股票列表间距优化 */
    .stock-list {
        gap: 8px;
        margin-top: 12px;
    }
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

.stock-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    font-size: 0.875rem;
    color: #64748b;
}

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

.chat-shortcut-btn {
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
    /* 移除阴影，实现无浮层设计 */
}

.chat-shortcut-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1f2937;
    /* 移除悬停阴影和位移效果 */
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
    border-radius: 20px;
    /* 减少圆角 */
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.06);
    /* 减少阴影 */
    padding: 16px 20px;
    /* 减少padding */
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    z-index: 2;
}

.ai-input-row {
    background: #f8f9fa;
    border-radius: 16px;
    /* 减少圆角 */
    box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
    /* 减少阴影 */
    padding: 12px 16px;
    /* 减少padding */
    display: flex;
    flex-direction: column;
    gap: 8px;
    /* 减少间距 */
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
    /* 减小发送按钮尺寸 */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: none;
}

.ai-send-btn svg {
    display: block;
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

.ai-suggestion-btn {
    border-radius: 16px;
    background: #f8fafc;
    color: #374151;
    font-weight: 500;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    padding: 10px 16px;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 120px;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.ai-suggestion-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ai-suggestion-btn.hot {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-color: #f59e0b;
    color: #92400e;
    animation: pulse-glow 2s infinite;
}

.ai-suggestion-btn.hot:hover {
    background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
    border-color: #d97706;
    color: #78350f;
}

.ai-suggestion-btn.warning {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #f87171;
    color: #991b1b;
}

.ai-suggestion-btn.warning:hover {
    background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
    border-color: #ef4444;
    color: #7f1d1d;
}

.ai-suggestion-btn.quant {
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    border-color: #6366f1;
    color: #3730a3;
    position: relative;
    overflow: hidden;
}

.ai-suggestion-btn.quant::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.5s ease;
}

.ai-suggestion-btn.quant:hover::before {
    left: 100%;
}

.ai-suggestion-btn.quant:hover {
    background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
    border-color: #4f46e5;
    color: #312e81;
}

.btn-icon {
    font-size: 1rem;
    display: inline-block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 低调的自定义按钮样式 - 内联版本 */
.customize-btn-inline {
    border: none;
    background: rgba(156, 163, 175, 0.1);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.8;
    margin-left: 8px;
}

.customize-btn-inline:hover {
    background: rgba(156, 163, 175, 0.2);
    opacity: 1;
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

@keyframes pulse-glow {

    0%,
    100% {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 0 rgba(245, 158, 11, 0.4);
    }

    50% {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 4px rgba(245, 158, 11, 0.2);
    }
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
    }

    .ai-send-btn svg {
        width: 16px;
        height: 16px;
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
        z-index: 9999 !important;
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
    }

    .ai-send-btn svg {
        width: 14px;
        height: 14px;
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

:deep(.el-form-item__content) {
    align-items: center;
}

/* 防止弹窗遮罩层影响页面布局 */
:deep(.el-overlay) {
    backdrop-filter: blur(2px);
}

:deep(.el-dialog__wrapper) {
    overflow-y: auto;
}

/* 投资偏好设置对话框样式 */
:deep(.preferences-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
    max-height: 90vh;
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
    padding: 20px 0;
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
    min-height: 300px;
}

.tab-panel {
    animation: fadeIn 0.3s ease;
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
    padding: 60px 20px;
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

    .overview-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    .stat-item {
        padding: 12px;
        gap: 6px;
        min-height: 70px;
    }

    .stat-icon {
        font-size: 1.25rem;
        width: 36px;
        height: 36px;
    }

    .stat-label {
        font-size: 0.75rem;
    }

    .stat-value {
        font-size: 1rem;
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
}

@media (max-width: 480px) {
    .overview-stats {
        grid-template-columns: 1fr;
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
        padding-right: 8px !important;
        /* 减少右侧padding，让消息内容更宽 */
    }

    /* 移动端聊天消息宽度优化 */
    .chat-message.user .chat-message-content {
        max-width: 90% !important;
        /* 增加用户消息最大宽度 */
    }

    .chat-message.assistant .chat-message-content {
        max-width: 90% !important;
        /* 增加助手消息最大宽度 */
    }

    /* 最后一条消息额外增加底部间距 - 默认适应非微信浏览器 */
    .chat-message:last-child {
        margin-bottom: 100px !important;
        /* 确保最后一条消息有足够间隔，适应非微信浏览器的输入框偏移 */
    }

    /* 使用伪元素在聊天历史区域底部创建额外空间 - 默认适应非微信浏览器 */
    .chat-history-area::after {
        content: '';
        display: block;
        height: 120px !important;
        /* 额外的底部空间，适应非微信浏览器的输入框偏移 */
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
        max-width: 92% !important;
        /* 超小屏幕用户消息更宽 */
    }

    .chat-message.assistant .chat-message-content {
        max-width: 92% !important;
        /* 超小屏幕助手消息更宽 */
    }
}

/* 量化分析报告操作按钮样式 */
.quant-analysis-actions {
    margin-top: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
    border-radius: 12px;
    border: 1px solid #e1e8f0;
}

.analysis-actions-header {
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.actions-title {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 6px;
}

.active-reminders-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid #f59e0b;
    font-size: 11px;
    color: #92400e;
    font-weight: 500;
}

.badge-icon {
    font-size: 12px;
    animation: pulse 2s infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.6;
    }
}

.badge-text {
    white-space: nowrap;
}

.analysis-actions-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.reminder-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    padding: 8px 16px;
    height: auto;
}

.reminder-btn {
    position: relative;
}

.reminder-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.reminder-count-badge {
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

.records-btn {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    border: none;
    color: white;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    padding: 8px 16px;
    height: auto;
}

.records-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.analysis-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(24, 144, 255, 0.05);
    border-radius: 8px;
    border-left: 3px solid #1890ff;
    font-size: 12px;
    color: #666;
}

.analysis-tip svg {
    flex-shrink: 0;
}

/* 移动端量化分析报告操作按钮优化 */
@media (max-width: 768px) {
    .quant-analysis-actions {
        margin-top: 12px;
        padding: 10px;
        border-radius: 8px;
    }

    .analysis-actions-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 10px;
    }

    .analysis-actions-buttons {
        gap: 6px;
        margin-bottom: 8px;
        flex-direction: row;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .reminder-btn,
    .records-btn {
        font-size: 11px;
        padding: 6px 10px;
        flex: none;
        min-width: auto;
        min-height: 32px;
        border-radius: 5px;
        gap: 4px;
    }

    .reminder-btn svg,
    .records-btn svg {
        width: 12px;
        height: 12px;
    }

    .analysis-tip {
        font-size: 10px;
        padding: 6px 8px;
        line-height: 1.3;
    }

    .actions-title {
        font-size: 12px;
    }

    .active-reminders-badge {
        font-size: 9px;
        padding: 2px 5px;
        border-radius: 8px;
    }

    .reminder-count-badge {
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
    .quant-analysis-btn {
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 6px;
        min-height: 28px;
        gap: 2px;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg {
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
    .quant-analysis-btn {
        font-size: 9px;
        padding: 3px 6px;
        border-radius: 4px;
        min-height: 26px;
        gap: 1px;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg {
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
    .quant-analysis-btn {
        font-size: 8px;
        padding: 2px 5px;
        border-radius: 3px;
        min-height: 24px;
        gap: 1px;
    }

    .add-watchlist-btn svg,
    .remove-watchlist-btn svg,
    .continue-analysis-btn svg,
    .buy-stock-btn svg,
    .buy-stock-btn-secondary svg,
    .paid-analysis-btn svg,
    .quant-analysis-btn svg {
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

.stock-info-display {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.stock-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e40af;
}

.stock-code {
    font-size: 14px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.7);
    padding: 2px 8px;
    border-radius: 4px;
}

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

    .stock-name {
        font-size: 14px;
    }

    .stock-code {
        font-size: 12px;
    }

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
</style>
