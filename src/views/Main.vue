<template>
    <div class="main-modern" :class="{ 'onboarding-active': showOnboarding }">
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

        <!-- 主体内容 -->
        <main class="modern-content main-container"
            :class="{ 'chatting': isChatMode, 'with-sidebar': userStore.isLoggedIn }">
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
                            :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：帮我分析一下芯片行业的龙头股..."
                            @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                        <div class="ai-buttons">
                            <el-button class="ai-func-btn" circle @click="onVoiceClick">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#888"
                                        stroke-width="2" fill="none" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#888" stroke-width="2" fill="none" />
                                    <line x1="12" y1="19" x2="12" y2="23" stroke="#888" stroke-width="2" />
                                    <line x1="8" y1="23" x2="16" y2="23" stroke="#888" stroke-width="2" />
                                </svg>
                            </el-button>
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
                                <span class="price-tag">¥1</span>
                            </el-button>

                            <!-- AI委托交易按钮（付费） -->
                            <el-button v-if="!message.isBuyMode" size="small"
                                @click="showQuantAnalysisDialog(message.stockInfo)" class="quant-analysis-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                        fill="none" />
                                </svg>
                                AI委托交易
                                <span class="price-tag">¥1</span>
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
                                                        <span class="price-tag">¥1</span>
                                                    </el-button>

                                                    <!-- AI委托交易按钮（付费） -->
                                                    <el-button size="small" @click="showQuantAnalysisDialog(position)"
                                                        class="quant-analysis-btn">
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor"
                                                                stroke-width="2" fill="none" />
                                                        </svg>
                                                        AI委托交易
                                                        <span class="price-tag">¥1</span>
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
                                                        <span class="price-tag">¥1</span>
                                                    </el-button>

                                                    <!-- AI委托交易按钮（付费） -->
                                                    <el-button size="small" @click="showQuantAnalysisDialog(stock)"
                                                        class="quant-analysis-btn">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor"
                                                                stroke-width="2" fill="none" />
                                                        </svg>
                                                        AI委托交易
                                                        <span class="price-tag">¥1</span>
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
                                        <span class="price-tag">¥1</span>
                                    </el-button>

                                    <!-- AI委托交易按钮（付费） -->
                                    <el-button size="small" @click="showQuantAnalysisDialog(stock)"
                                        class="quant-analysis-btn">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                                fill="none" />
                                        </svg>
                                        AI委托交易
                                        <span class="price-tag">¥1</span>
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
                            <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" />
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
                        :autosize="{ minRows: 2, maxRows: 6 }" placeholder="如：帮我分析一下芯片行业的龙头股..."
                        @keyup.enter.ctrl="sendMessage" clearable maxlength="500" show-word-limit />
                </div>

                <!-- 按钮区域 -->
                <div class="ai-buttons-row">
                    <div class="ai-buttons">
                        <el-button class="ai-func-btn" circle @click="onVoiceClick">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="#888"
                                    stroke-width="2" fill="none" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#888" stroke-width="2" fill="none" />
                                <line x1="12" y1="19" x2="12" y2="23" stroke="#888" stroke-width="2" />
                                <line x1="8" y1="23" x2="16" y2="23" stroke="#888" stroke-width="2" />
                            </svg>
                        </el-button>
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
                    <el-button type="primary" size="small" @click="handleGuideAction">{{ guideActionText }}</el-button>
                    <el-button size="small" @click="dismissGuide">稍后</el-button>
                </div>
            </div>
        </div>

        <!-- 个人中心 -->
        <UserProfile v-if="showUserProfile" @close="closeUserProfile" />

        <!-- 版权信息 -->
        <div class="copyright-footer">
            <div class="copyright-content">
                <p>&copy; 2024 上海九方云智能科技有限公司 版权所有</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useUserStore } from '../store/user';
import { User, Lock, ArrowDown, ArrowUp, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { mockApi, wechatLoginApi } from '../api/mock';
import Sidebar from '../components/Sidebar.vue';
import UserProfile from '../components/UserProfile.vue';
import OnboardingFlow from '../components/OnboardingFlow.vue';
import LoginDialog from '../components/LoginDialog.vue';
import PasswordRecoveryDialog from '../components/PasswordRecoveryDialog.vue';
import InvestmentPreferencesDialog from '../components/InvestmentPreferencesDialog.vue';
import StockTradingDialog from '../components/StockTradingDialog.vue';
import AITradingDialog from '../components/AITradingDialog.vue';
import CustomizeShortcutsDialog from '../components/CustomizeShortcutsDialog.vue';

const userStore = useUserStore();
const inputMessage = ref('');
const chatHistory = ref([]);
const chatHistoryRef = ref(null);
const isChatMode = ref(false); // 控制是否进入聊天模式
const showUserProfile = ref(false); // 控制是否显示个人中心
const showChatShortcuts = ref(false); // 控制聊天模式下的快捷操作显示
const isMobileView = ref(false); // 检测是否为移动端视图

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
        '我刚开始投资，应该从哪里入手？',
        '根据我的偏好，推荐一些适合的投资产品',
        '帮我解释一下股票和基金的区别',
        '投资1万元，有什么好的建议吗？'
    ],
    [
        '现在哪些板块值得关注？',
        '怎样判断一只股票是否值得买入？',
        '如何分散投资风险？',
        '新能源汽车行业还有投资机会吗？'
    ],
    [
        '最近市场波动很大，怎么应对？',
        '请分析一下当前的宏观经济形势',
        '什么时候应该止损离场？',
        '如何设置合理的仓位管理？'
    ],
    [
        '价值投资和成长投资哪个更好？',
        '技术分析对投资决策有帮助吗？',
        '如何挖掘被低估的优质股票？',
        '长期持有还是波段操作更赚钱？'
    ],
    [
        '国外市场投资机会怎么样？',
        'A股、港股、美股哪个更值得投资？',
        '人民币汇率对投资有什么影响？',
        '如何投资REITS房地产基金？'
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

    const res = await mockApi.sendMessage(message);
    chatHistory.value.push(
        { role: 'user', content: message },
        res.data
    );
    await nextTick();
    scrollToBottom();
};

const scrollToBottom = () => {
    if (chatHistoryRef.value) {
        // 移动端特殊处理：确保滚动到真正的底部
        const isMobile = window.innerWidth <= 768;
        let scrollTarget = chatHistoryRef.value.scrollHeight;

        if (isMobile) {
            // 移动端需要额外的偏移量来确保内容不被输入框遮挡
            const extraOffset = window.innerWidth <= 480 ? 80 : 100;
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

const onVoiceClick = () => {
    ElMessage.info('语音输入功能开发中...');
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
};

// 检测移动端视图
const checkMobileView = () => {
    isMobileView.value = window.innerWidth <= 768;
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
            message = `关于"${title}"这个消息，请帮我分析一下具体的影响和投资机会。消息内容：${content}`;
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
                message = String(content || '请帮我分析一下相关内容');
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
        message = String(message || '请帮我分析一下相关内容');
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

onMounted(() => {
    scrollToBottom();
    checkUserStatus();

    // 检测移动端视图
    checkMobileView();

    // 添加窗口大小变化监听
    window.addEventListener('resize', checkMobileView);

    // 添加滚动事件监听
    nextTick(() => {
        if (chatHistoryRef.value && !chatHistoryRef.value.hasScrollListener) {
            chatHistoryRef.value.addEventListener('scroll', handleScroll);
            chatHistoryRef.value.hasScrollListener = true;
        }
    });
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
    // 清理窗口大小监听
    window.removeEventListener('resize', checkMobileView);
});

const closeUserProfile = () => {
    showUserProfile.value = false;
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
        `量化分析 ${stock.name}(${stock.code}) 需要支付 ¥1，是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付',
            cancelButtonText: '取消',
            type: 'warning',
            customClass: 'paid-service-dialog'
        }
    ).then(() => {
        // 检查余额
        if (userStore.balance < 1) {
            ElMessage.error('余额不足，请先充值');
            return;
        }

        // 扣费并执行分析
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
}

.modern-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 32px 0 32px;
    max-width: 800px;
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
        height: calc(100vh - 56px - 160px) !important;
        /* 进一步减少高度，为底部输入框和间隔留出更多空间 */
        padding: 0 0 32px 16px !important;
        /* 顶部无padding直接到导航底部，左侧16px间距，底部32px避免遮挡 */
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
        padding-left: 20px;
        padding-right: 20px;
    }

    /* 移动端聊天模式下的内容区域 */
    .modern-content.chatting {
        padding-top: 56px !important;
        /* 聊天模式下直接从导航栏底部开始 */
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
    }

    /* 移动端AI输入卡片间距优化 */
    .ai-card {
        margin-top: 24px;
        /* 增加AI输入卡片上方间距 */
        margin-bottom: 24px;
        /* 增加AI输入卡片下方间距 */
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
    overflow-y: auto;
    height: calc(100vh - 56px - 200px);
    /* 页面高度 - 导航栏高度 - 输入区域高度(减少到200px) */
    scrollbar-width: thin;
    /* Firefox */
    scrollbar-color: transparent transparent;
    /* Firefox */
    transition: scrollbar-color 0.3s ease;
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
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 14px 20px;
    margin-left: auto;
    max-width: 75%;
    font-size: 1rem;
    line-height: 1.5;
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 14px 20px;
    margin-right: auto;
    max-width: 75%;
    font-size: 1rem;
    line-height: 1.5;
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

.price-tag {
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
        gap: 2px;
        flex-wrap: nowrap;
        overflow-x: auto;
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
    gap: 8px;
    /* 减少按钮间距 */
    align-items: center !important;
    flex-wrap: nowrap !important;
    /* 强制在一行显示，不允许换行 */
    justify-content: center !important;
    width: 100% !important;
    /* 确保容器宽度充足 */
}

.new-chat-btn {
    border-radius: 16px;
    /* 减少圆角 */
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 6px 16px;
    /* 减少padding */
    transition: all 0.2s;
    display: flex !important;
    align-items: center !important;
    gap: 6px;
    /* 减少图标间距 */
    font-size: 0.875rem;
    /* 减小字体 */
    height: 32px;
    /* 固定高度 */
    white-space: nowrap !important;
    /* 防止文字换行 */
    flex-shrink: 0 !important;
    /* 防止按钮被压缩 */
}

.new-chat-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.goto-recommendation-btn {
    border-radius: 16px;
    /* 减少圆角 */
    background: #fef3c7;
    color: #92400e;
    font-weight: 500;
    border: 1px solid #fbbf24;
    box-shadow: none;
    padding: 6px 16px;
    /* 减少padding */
    transition: all 0.2s;
    display: flex !important;
    align-items: center !important;
    gap: 6px;
    /* 减少图标间距 */
    font-size: 0.875rem;
    /* 减小字体 */
    height: 32px;
    /* 固定高度 */
    white-space: nowrap !important;
    /* 防止文字换行 */
    flex-shrink: 0 !important;
    /* 防止按钮被压缩 */
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
    font-size: 1.1rem;
    resize: none;
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

    /* 防止移动端缩放和选择 */
    html,
    body {
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior: none;
    }

    /* 主容器调整 - 让聊天框沉底 */
    .main-container {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        padding-bottom: 0;
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

    /* 聊天输入框固定在底部 */
    .ai-card {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-width: none;
        margin: 0;
        border-radius: 0;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        padding: 12px 16px;
        background: white;
        z-index: 1000;
    }

    .ai-input-row {
        padding: 12px 16px;
        border-radius: 16px;
    }

    .ai-buttons-row {
        margin-top: 8px;
        justify-content: flex-end;
        padding-right: 4px;
        /* 增加右侧间距，方便操作 */
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
        margin-top: 20px;
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
        height: calc(100vh - 56px - 140px) !important;
        /* 超小屏幕进一步减少高度，为输入框留出更多空间 */
        padding: 0 0 28px 12px !important;
        /* 移除顶部padding，左侧12px间距，增加底部padding确保间隔 */
        margin: 0 !important;
        width: 100% !important;
        max-width: none !important;
    }

    /* 超小屏幕聊天模式内容区域 */
    .modern-content.chatting {
        padding-top: 56px !important;
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
    flex-direction: column;
    gap: 8px;
}

.new-chat-btn,
.goto-recommendation-btn {
    width: 100%;
    max-width: 200px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
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
    font-size: 1.1rem !important;
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
    font-size: 1.1rem;
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
    transform: scale(1.1) rotate(90deg);
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
    padding: 20px 0;
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
    font-size: 14px;
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
}

/* 移动端聊天布局最终修复 - 确保最高优先级 */
@media (max-width: 768px) {

    /* 问题1: 聊天内容顶部遮挡 - 聊天模式下直接从导航栏底部开始 */
    .modern-content.chatting {
        padding-top: 56px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        height: 100vh !important;
        overflow: hidden !important;
    }

    /* 移动端输入区域高度优化 */
    .input-area {
        padding: 12px 16px 16px 16px !important;
        /* 进一步减少padding，节省更多空间 */
        background: transparent !important;
        /* 移动端也使用透明背景 */
        backdrop-filter: none !important;
        /* 移除模糊效果 */
        border: none !important;
        /* 移除所有边框 */
        box-shadow: none !important;
        /* 移除所有阴影 */
    }

    /* 移动端新聊天按钮区域优化 */
    .new-chat-section {
        margin-bottom: 8px !important;
        /* 进一步减少间距 */
    }

    /* 移动端按钮布局优化 - 确保一行显示 */
    .chat-actions {
        flex-wrap: nowrap !important;
        /* 移动端强制一行显示 */
        gap: 6px !important;
        /* 移动端减少间距 */
        justify-content: center !important;
    }

    .new-chat-btn,
    .goto-recommendation-btn {
        font-size: 0.8rem !important;
        /* 移动端字体更小 */
        padding: 6px 12px !important;
        /* 移动端按钮更紧凑 */
        height: 30px !important;
        /* 移动端按钮高度更小 */
        white-space: nowrap !important;
        /* 防止文字换行 */
        flex-shrink: 0 !important;
        /* 防止按钮被压缩 */
    }

    /* 移动端AI卡片间距优化 */
    .ai-card {
        margin: 0 !important;
        /* 移除margin */
        padding: 16px 20px !important;
        /* 减少AI卡片的padding */
    }

    /* 移动端AI输入行间距优化 */
    .ai-input-row {
        padding: 12px 16px !important;
        /* 减少输入行的padding */
    }

    /* 移动端AI按钮行间距优化 */
    .ai-buttons-row {
        margin-top: 8px !important;
        /* 减少按钮行的上边距 */
    }

    /* 问题2&3: 滚动条位置和底部内容展示 - 重新定义聊天历史区域 */
    .chat-history-area {
        height: calc(100vh - 56px - 350px) !important;
        /* 进一步大幅增加底部预留空间到350px，确保输入框完全不遮挡内容 */
        padding: 0 0 60px 8px !important;
        /* 减少左侧padding，让内容更宽 */
        margin: 0 !important;
        width: 100% !important;
        max-width: none !important;
        /* 移动端占满宽度，移除900px限制 */
        box-sizing: border-box !important;
        scroll-padding-bottom: 100px !important;
        /* 使用CSS scroll-padding-bottom确保滚动时底部有足够间距 */
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

    /* 最后一条消息额外增加底部间距 */
    .chat-message:last-child {
        margin-bottom: 60px !important;
        /* 确保最后一条消息有足够间隔 */
    }

    /* 使用伪元素在聊天历史区域底部创建额外空间 */
    .chat-history-area::after {
        content: '';
        display: block;
        height: 100px !important;
        /* 额外的底部空间 */
        width: 100%;
        flex-shrink: 0;
    }
}

@media (max-width: 480px) {

    /* 超小屏幕输入区域进一步优化 */
    .input-area {
        padding: 10px 12px 12px 12px !important;
        /* 超小屏幕最小化padding */
        background: transparent !important;
        /* 超小屏幕也使用透明背景 */
        backdrop-filter: none !important;
        /* 移除模糊效果 */
        border: none !important;
        /* 移除所有边框 */
        box-shadow: none !important;
        /* 移除所有阴影 */
    }

    /* 超小屏幕AI卡片进一步优化 */
    .ai-card {
        padding: 12px 16px !important;
        /* 超小屏幕进一步减少AI卡片padding */
    }

    /* 超小屏幕AI输入行进一步优化 */
    .ai-input-row {
        padding: 10px 12px !important;
        /* 超小屏幕最小化输入行padding */
    }

    /* 超小屏幕新聊天按钮区域 */
    .new-chat-section {
        margin-bottom: 6px !important;
        /* 超小屏幕最小化间距 */
    }

    /* 超小屏幕进一步优化 */
    .chat-history-area {
        height: calc(100vh - 56px - 320px) !important;
        /* 超小屏幕预留320px给输入区域 */
        padding: 0 0 55px 6px !important;
        /* 减少左侧padding，让内容更宽 */
        scroll-padding-bottom: 80px !important;
        /* 超小屏幕的滚动底部间距 */
        max-width: none !important;
        /* 确保超小屏幕也占满宽度 */
    }

    .modern-content.chatting {
        padding-top: 56px !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    /* 超小屏幕最后一条消息间距 */
    .chat-message:last-child {
        margin-bottom: 55px !important;
    }

    /* 超小屏幕伪元素底部空间 */
    .chat-history-area::after {
        height: 80px !important;
        /* 超小屏幕的额外底部空间 */
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
</style>
