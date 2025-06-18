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
                    <el-button class="modern-btn" @click="showLoginDialog(false)">登录</el-button>
                    <el-button class="modern-btn" @click="showLoginDialog(true)">注册</el-button>
                </template>
            </div>
        </header>

        <!-- 主体内容 -->
        <main class="modern-content" :class="{ 'chatting': isChatMode, 'with-sidebar': userStore.isLoggedIn }">
            <!-- 个性化引导流程 -->
            <OnboardingFlow v-if="showOnboarding" @complete="onOnboardingComplete" @analyze-stock="handleAnalyzeStock"
                @execute-action="handleOnboardingAction" />

            <!-- 初始状态：标题、描述和输入区域作为一个整体 -->
            <div class="center-container" v-else-if="!isChatMode">
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

                <div class="ai-suggestions">
                    <!-- 快捷操作按钮 -->
                    <div class="suggestion-row">
                        <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="ai-suggestion-btn"
                            @click="handleShortcutClick(shortcut)">
                            <span class="btn-icon">{{ shortcut.icon }}</span>
                            {{ shortcut.title }}
                        </el-button>
                        <!-- 自定义按钮 -->
                        <el-button class="ai-suggestion-btn customize-btn" @click="openCustomizeDialog">
                            <span class="btn-icon">⚙️</span>
                            自定义
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 聊天历史区域 -->
            <div class="chat-history-area" v-if="isChatMode && chatHistory.length" ref="chatHistoryRef">
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

            <!-- 快捷操作栏（聊天模式下） -->
            <div class="chat-shortcuts" v-if="showChatShortcuts">
                <div class="shortcuts-grid">
                    <el-button v-for="shortcut in activeShortcuts" :key="shortcut.id" class="chat-shortcut-btn"
                        @click="handleShortcutClick(shortcut)">
                        <span class="btn-icon">{{ shortcut.icon }}</span>
                        <span class="btn-text">{{ shortcut.shortTitle || shortcut.title }}</span>
                    </el-button>
                    <el-button class="chat-shortcut-btn customize-btn" @click="openCustomizeDialog">
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
                            v-if="!showChatShortcuts">
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
        </div>

        <!-- 登录对话框 -->
        <el-dialog v-model="loginDialogVisible" :show-close="false" :close-on-click-modal="false" :lock-scroll="false"
            width="720px" class="auth-dialog">
            <template #header>
                <div></div>
            </template>

            <div class="auth-container">
                <!-- LOGO区域 -->
                <div class="auth-logo-section">
                    <div class="auth-logo">
                        <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                    </div>
                    <h1 class="auth-main-title">{{ isRegisterMode ? '注册智投小助' : '登录智投小助' }}</h1>
                    <p class="auth-main-subtitle">{{ isRegisterMode ? '创建您的智投小助账号' : '使用您的账号登录智投小助' }}</p>
                </div>

                <!-- 表单区域 -->
                <div class="auth-form-wrapper">
                    <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="auth-form">
                        <el-form-item prop="username" class="auth-form-item">
                            <el-input v-model="loginForm.username" placeholder="用户名" class="auth-input" size="large" />
                        </el-form-item>

                        <el-form-item v-if="isRegisterMode" prop="phone" class="auth-form-item">
                            <el-input v-model="loginForm.phone" placeholder="手机号" class="auth-input" size="large" />
                        </el-form-item>

                        <el-form-item prop="password" class="auth-form-item">
                            <el-input v-model="loginForm.password" type="password" placeholder="密码" class="auth-input"
                                size="large" show-password />
                        </el-form-item>

                        <el-form-item v-if="isRegisterMode" prop="confirmPassword" class="auth-form-item">
                            <el-input v-model="loginForm.confirmPassword" type="password" placeholder="确认密码"
                                class="auth-input" size="large" show-password />
                        </el-form-item>

                        <!-- 主按钮 -->
                        <el-button class="auth-submit-btn" type="primary" size="large" @click="handleLogin"
                            :loading="loginLoading">
                            {{ isRegisterMode ? '创建账号' : '继续登录' }}
                        </el-button>
                    </el-form>

                    <!-- 第三方登录分割线 -->
                    <div class="auth-divider">
                        <span class="divider-text">或</span>
                    </div>

                    <!-- 第三方登录按钮 -->
                    <div class="third-party-login">
                        <el-button class="wechat-login-btn" @click="handleWechatLogin" :loading="wechatLoginLoading">
                            <div class="wechat-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.882-1.900 7.60.5.5-3.187-2.75-6.876-8.372-6.876zm-3.488 5.69c-.865 0-1.566-.701-1.566-1.565 0-.865.701-1.566 1.566-1.566.865 0 1.565.701 1.565 1.566 0 .864-.7 1.565-1.565 1.565zm5.194 0c-.865 0-1.566-.701-1.566-1.565 0-.865.701-1.566 1.566-1.566.865 0 1.565.701 1.565 1.566 0 .864-.7 1.565-1.565 1.565z" />
                                    <path
                                        d="M15.293 9.025c-.328 0-.66.018-.99.057-.931.110-1.831.402-2.65.859-2.301 1.283-3.677 3.449-3.677 5.303 0 3.765 3.186 6.822 7.094 6.822.402 0 .805-.027 1.201-.08a.805.805 0 0 1 .68.097l1.77 1.034c.027.016.06.025.094.025.12 0 .215-.097.215-.215 0-.054-.022-.105-.035-.158l-.365-1.378a.548.548 0 0 1 .198-.62c1.7-1.251 2.765-3.047 2.765-5.125 0-3.765-3.186-6.821-7.094-6.821h-.206zm-2.43 4.565c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565zm4.565 0c-.865 0-1.565-.7-1.565-1.565s.7-1.565 1.565-1.565 1.565.7 1.565 1.565-.7 1.565-1.565 1.565z" />
                                </svg>
                            </div>
                            <span>微信登录</span>
                        </el-button>
                    </div>

                    <!-- 切换模式 -->
                    <div class="auth-mode-switch">
                        <span class="switch-text">{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
                        <el-button type="text" class="switch-link" @click="toggleAuthMode">
                            {{ isRegisterMode ? '立即登录' : '立即注册' }}
                        </el-button>
                    </div>

                    <!-- 账号找回 -->
                    <div v-if="!isRegisterMode" class="auth-recovery">
                        <el-button type="text" class="recovery-link" @click="showRecoveryDialog">
                            忘记密码？
                        </el-button>
                    </div>

                    <!-- 取消按钮 -->
                    <div class="auth-footer">
                        <el-button class="cancel-btn" @click="closeAuthDialog">取消</el-button>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 投资偏好设置对话框 -->
        <el-dialog v-model="preferencesDialogVisible" :show-close="false" :close-on-click-modal="false"
            :lock-scroll="false" width="1200px" class="preferences-dialog">
            <template #header>
                <div></div>
            </template>

            <div class="preferences-container">
                <div class="preferences-header">
                    <div class="preferences-logo">
                        <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                    </div>
                    <h1 class="preferences-title">完善投资偏好</h1>
                    <p class="preferences-subtitle">帮助我们为您提供更精准的投资建议</p>

                    <!-- 步骤指示器 -->
                    <div class="step-indicator">
                        <div v-for="(step, index) in preferenceSteps" :key="index" class="step-dot" :class="{
                            'active': index === currentStep,
                            'completed': index < currentStep
                        }">
                            <span v-if="index < currentStep">✓</span>
                            <span v-else>{{ index + 1 }}</span>
                        </div>
                    </div>
                </div>

                <div class="preferences-form-wrapper">
                    <!-- 步骤1: 投资经验 -->
                    <div v-if="currentStep === 0" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[0].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[0].desc }}</p>

                        <div class="experience-options">
                            <div v-for="option in experienceOptions" :key="option.value" class="experience-option"
                                :class="{ 'selected': preferencesForm.experience === option.value }"
                                @click="preferencesForm.experience = option.value">
                                <div class="option-radio">
                                    <div class="radio-dot"
                                        :class="{ 'checked': preferencesForm.experience === option.value }">
                                    </div>
                                </div>
                                <div class="experience-content">
                                    <div class="experience-header">
                                        <span class="experience-icon">{{ option.icon }}</span>
                                        <div class="experience-title">{{ option.title }}</div>
                                    </div>
                                    <div class="experience-label">{{ option.label }}</div>
                                    <div class="experience-desc">{{ option.desc }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤2: 选择投资风格 -->
                    <div v-if="currentStep === 1" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[1].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[1].desc }}</p>

                        <div class="risk-options">
                            <div v-for="option in riskOptions" :key="option.value" class="risk-option"
                                :class="{ 'selected': preferencesForm.riskLevel === option.value }"
                                @click="preferencesForm.riskLevel = option.value">
                                <div class="option-radio">
                                    <div class="radio-dot"
                                        :class="{ 'checked': preferencesForm.riskLevel === option.value }">
                                    </div>
                                </div>
                                <div class="option-content">
                                    <div class="option-header">
                                        <div class="option-title">
                                            <span class="option-icon">{{ option.icon }}</span>
                                            {{ option.title }}
                                        </div>
                                        <div class="risk-level-indicator">
                                            <span v-for="i in 5" :key="i" class="risk-dot"
                                                :class="{ 'active': i <= option.riskLevel }"></span>
                                        </div>
                                    </div>
                                    <div class="option-desc">{{ option.desc }}</div>
                                    <div class="simple-desc">{{ option.simpleDesc }}</div>
                                    <div class="option-metrics">
                                        <div class="metric-item">
                                            <span class="metric-label">💰 可能收益:</span>
                                            <span class="metric-value return">{{ option.expectedReturn }}</span>
                                        </div>
                                        <div class="metric-item">
                                            <span class="metric-label">⚠️ 可能亏损:</span>
                                            <span class="metric-value loss">{{ option.maxLoss }}</span>
                                        </div>
                                    </div>
                                    <div class="option-examples">
                                        <span class="examples-label">📈 投资什么:</span>
                                        <span class="examples-text">{{ option.examples }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤3: 用户特征 -->
                    <div v-if="currentStep === 2" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[2].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[2].desc }}</p>

                        <div class="traits-container">
                            <div class="traits-hint">
                                <div class="hint-icon">💡</div>
                                <div class="hint-text">
                                    <strong>新手提示：</strong>如果不确定如何选择，我们已为您设置了适合新手的默认选项，您可以直接使用或根据个人情况调整
                                </div>
                            </div>

                            <div class="traits-list">
                                <div v-for="trait in userTraits" :key="trait.id" class="trait-item-compact">
                                    <div class="trait-header-compact">
                                        <div class="trait-left">
                                            <span class="trait-icon">{{ trait.icon }}</span>
                                            <div class="trait-info">
                                                <div class="trait-title">{{ trait.title }}</div>
                                                <div class="trait-desc">{{ trait.desc }}</div>
                                            </div>
                                        </div>
                                        <div class="trait-current-value">
                                            {{ preferencesForm.userTraits[trait.id] }}分
                                        </div>
                                    </div>

                                    <div class="trait-slider-container">
                                        <div class="slider-track">
                                            <div class="slider-progress"
                                                :style="{ width: (preferencesForm.userTraits[trait.id] / 5) * 100 + '%' }">
                                            </div>
                                        </div>
                                        <div class="slider-options">
                                            <div v-for="option in trait.options" :key="option.value"
                                                class="slider-option"
                                                :class="{ 'active': preferencesForm.userTraits[trait.id] === option.value }"
                                                @click="preferencesForm.userTraits[trait.id] = option.value"
                                                :title="option.desc">
                                                <div class="option-dot"></div>
                                                <div class="option-label">{{ option.value }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="trait-description">
                                        {{ getCurrentTraitDescription(trait.id) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤4: 关注板块 -->
                    <div v-if="currentStep === 3" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[3].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[3].desc }}</p>

                        <div class="sectors-container-compact">
                            <!-- 顶部搜索和统计 -->
                            <div class="sectors-header">
                                <div class="search-section">
                                    <el-input v-model="sectorSearchQuery" placeholder="搜索行业..." class="compact-search"
                                        clearable @input="handleSectorSearch">
                                        <template #prefix>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                    stroke="currentColor" stroke-width="2" fill="none" />
                                            </svg>
                                        </template>
                                    </el-input>
                                </div>
                                <div class="stats-section">
                                    <span class="stat-chip">大分类 {{ preferencesForm.sectors.majorCategories.length
                                        }}/2</span>
                                    <span class="stat-chip">细分 {{ preferencesForm.sectors.subCategories.length
                                        }}/4</span>
                                </div>
                            </div>

                            <!-- 左右分栏内容 -->
                            <div class="sectors-content">
                                <!-- 搜索结果模式 -->
                                <div v-if="sectorSearchQuery && filteredSubSectors.length > 0" class="search-mode">
                                    <div class="search-header">🔍 找到 {{ filteredSubSectors.length }} 个匹配行业</div>
                                    <div class="search-grid">
                                        <div v-for="sector in filteredSubSectors" :key="sector.value"
                                            class="sector-card" :class="{
                                                'selected': preferencesForm.sectors.subCategories.includes(sector.value),
                                                'disabled': !preferencesForm.sectors.subCategories.includes(sector.value) && preferencesForm.sectors.subCategories.length >= 4
                                            }" @click="toggleSubSectorFromSearch(sector)">
                                            <div class="card-icon">{{ sector.icon }}</div>
                                            <div class="card-content">
                                                <div class="card-title" v-html="highlightSearchTerm(sector.label)">
                                                </div>
                                                <div class="card-desc" v-html="highlightSearchTerm(sector.desc)"></div>
                                                <div class="card-parent">{{ getMajorSectorLabel(sector.parent) }}</div>
                                            </div>
                                            <div class="card-check"
                                                v-if="preferencesForm.sectors.subCategories.includes(sector.value)">✓
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 无搜索结果 -->
                                <div v-else-if="sectorSearchQuery && filteredSubSectors.length === 0"
                                    class="no-results">
                                    <div class="no-results-content">
                                        <div class="no-results-icon">🔍</div>
                                        <div class="no-results-text">未找到匹配的行业</div>
                                    </div>
                                </div>

                                <!-- 正常模式：左右分栏 -->
                                <div v-else class="normal-layout">
                                    <!-- 左侧：大分类 -->
                                    <div class="left-section">
                                        <div class="section-title">📊 选择大分类 (最多2个)</div>
                                        <div class="major-grid">
                                            <div v-for="major in majorSectorOptions" :key="major.value"
                                                class="major-card" :class="{
                                                    'selected': preferencesForm.sectors.majorCategories.includes(major.value),
                                                    'disabled': !preferencesForm.sectors.majorCategories.includes(major.value) && preferencesForm.sectors.majorCategories.length >= 2
                                                }" @click="toggleMajorSector(major.value)">
                                                <div class="major-icon" :style="{ color: major.color }">{{ major.icon }}
                                                </div>
                                                <div class="major-name">{{ major.label }}</div>
                                                <div class="major-check"
                                                    v-if="preferencesForm.sectors.majorCategories.includes(major.value)">
                                                    ✓</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 右侧：细分行业 -->
                                    <div class="right-section">
                                        <div v-if="preferencesForm.sectors.majorCategories.length > 0">
                                            <div class="section-title">🎯 选择细分行业 (3-4个)</div>
                                            <div class="sub-grid">
                                                <div v-for="majorCategory in preferencesForm.sectors.majorCategories"
                                                    :key="majorCategory" class="sub-group">
                                                    <div class="group-header">{{ getMajorSectorIcon(majorCategory) }} {{
                                                        getMajorSectorLabel(majorCategory) }}</div>
                                                    <div class="sub-cards">
                                                        <div v-for="sub in getSubSectorsByParent(majorCategory)"
                                                            :key="sub.value" class="sub-card" :class="{
                                                                'selected': preferencesForm.sectors.subCategories.includes(sub.value),
                                                                'disabled': !preferencesForm.sectors.subCategories.includes(sub.value) && preferencesForm.sectors.subCategories.length >= 4
                                                            }" @click="toggleSubSector(sub.value)">
                                                            <div class="sub-icon">{{ sub.icon }}</div>
                                                            <div class="sub-name">{{ sub.label }}</div>
                                                            <div class="sub-check"
                                                                v-if="preferencesForm.sectors.subCategories.includes(sub.value)">
                                                                ✓</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="selection-hint">
                                            <div class="hint-icon">💡</div>
                                            <div class="hint-text">请先在左侧选择大分类</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 导航按钮 -->
                    <div class="preferences-actions">
                        <el-button v-if="currentStep > 0" class="preferences-back-btn" @click="previousStep">
                            上一步
                        </el-button>

                        <el-button v-if="currentStep < preferenceSteps.length - 1" class="preferences-next-btn"
                            type="primary" @click="nextStep" :disabled="!canProceedToNext">
                            下一步
                        </el-button>

                        <el-button v-if="currentStep === preferenceSteps.length - 1" class="preferences-submit-btn"
                            type="primary" @click="handlePreferencesSubmit" :loading="preferencesLoading">
                            完成设置
                        </el-button>

                        <el-button class="preferences-skip-btn" @click="skipPreferences">
                            跳过
                        </el-button>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 账号找回对话框 -->
        <el-dialog v-model="recoveryDialogVisible" :show-close="false" :close-on-click-modal="false"
            :lock-scroll="false" width="500px" class="recovery-dialog">
            <template #header>
                <div></div>
            </template>

            <div class="recovery-container">
                <div class="recovery-header">
                    <div class="recovery-logo">
                        <img src="/logo.png" alt="InvestAI Logo" class="logo-image" />
                    </div>
                    <h1 class="recovery-title">找回账号</h1>
                    <p class="recovery-subtitle">请输入您的注册手机号或邮箱，我们将发送验证码帮您重置密码</p>
                </div>

                <div class="recovery-form-wrapper">
                    <el-form :model="recoveryForm" :rules="recoveryRules" ref="recoveryFormRef" class="recovery-form">
                        <el-form-item prop="contact" class="recovery-form-item">
                            <el-input v-model="recoveryForm.contact" placeholder="手机号或邮箱" class="recovery-input"
                                size="large" />
                        </el-form-item>

                        <el-form-item v-if="recoveryStep === 2" prop="verifyCode" class="recovery-form-item">
                            <div class="verify-code-row">
                                <el-input v-model="recoveryForm.verifyCode" placeholder="验证码" class="recovery-input"
                                    size="large" />
                                <el-button class="send-code-btn" @click="sendVerifyCode" :disabled="codeCountdown > 0"
                                    :loading="sendingCode">
                                    {{ codeCountdown > 0 ? `${codeCountdown}s后重发` : '发送验证码' }}
                                </el-button>
                            </div>
                        </el-form-item>

                        <el-form-item v-if="recoveryStep === 3" prop="newPassword" class="recovery-form-item">
                            <el-input v-model="recoveryForm.newPassword" type="password" placeholder="新密码"
                                class="recovery-input" size="large" show-password />
                        </el-form-item>

                        <el-form-item v-if="recoveryStep === 3" prop="confirmNewPassword" class="recovery-form-item">
                            <el-input v-model="recoveryForm.confirmNewPassword" type="password" placeholder="确认新密码"
                                class="recovery-input" size="large" show-password />
                        </el-form-item>

                        <!-- 主按钮 -->
                        <el-button class="recovery-submit-btn" type="primary" size="large" @click="handleRecoveryStep"
                            :loading="recoveryLoading">
                            {{ getRecoveryButtonText() }}
                        </el-button>
                    </el-form>

                    <!-- 返回登录 -->
                    <div class="recovery-back">
                        <span class="back-text">想起密码了？</span>
                        <el-button type="text" class="back-link" @click="backToLogin">
                            返回登录
                        </el-button>
                    </div>

                    <!-- 取消按钮 -->
                    <div class="recovery-footer">
                        <el-button class="cancel-btn" @click="closeRecoveryDialog">取消</el-button>
                    </div>
                </div>
            </div>
        </el-dialog>

        <!-- 购买股票对话框 -->
        <el-dialog v-model="buyDialogVisible" title="" width="800px" class="buy-dialog" :show-close="false">
            <div class="trading-interface" v-if="selectedStock">
                <!-- 股票信息头部 -->
                <div class="stock-header-section">
                    <!-- 头部主要内容 -->
                    <div class="header-main-content">
                        <!-- 左侧：股票基本信息 -->
                        <div class="stock-basic-info">
                            <div class="stock-title-row">
                                <div class="stock-name-group">
                                    <h2 class="buy-dialog-stock-name">{{ selectedStock.name }}</h2>
                                    <span class="buy-dialog-stock-code">{{ selectedStock.code }}</span>
                                </div>
                                <div class="stock-tags">
                                    <span class="tag-item">A股</span>
                                    <span class="tag-item">主板</span>
                                </div>
                            </div>

                            <div class="stock-price-row">
                                <div class="price-main">
                                    <span class="buy-dialog-current-price">¥{{ selectedStock.price }}</span>
                                    <div :class="['price-change-group', selectedStock.change >= 0 ? 'up' : 'down']">
                                        <span class="change-amount">{{ selectedStock.change >= 0 ? '+' : '' }}{{
                                            selectedStock.change }}</span>
                                        <span class="change-percent">({{ selectedStock.changePercent >= 0 ? '+' : ''
                                        }}{{
                                                selectedStock.changePercent }}%)</span>
                                    </div>
                                </div>
                                <div class="price-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">今开</span>
                                        <span class="stat-value">{{ (parseFloat(selectedStock.price) - 2.5).toFixed(2)
                                        }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">昨收</span>
                                        <span class="stat-value">{{ (parseFloat(selectedStock.price) -
                                            parseFloat(selectedStock.change)).toFixed(2) }}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">成交量</span>
                                        <span class="stat-value">1.2万手</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 右侧：操作区域 -->
                        <div class="header-actions">
                            <div class="market-status-card">
                                <div class="status-indicator">
                                    <span class="status-dot"></span>
                                    <span class="status-text">交易中</span>
                                </div>
                                <div class="trading-time">09:30-15:00</div>
                            </div>

                            <div class="action-buttons">
                                <!-- 自选股按钮 -->
                                <el-button v-if="!userStore.isInWatchlist(selectedStock.code)"
                                    class="action-btn favorite-btn" size="small" @click="addToWatchlist(selectedStock)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                            stroke="currentColor" stroke-width="2" fill="none" />
                                    </svg>
                                    加入自选
                                </el-button>
                                <el-button v-else class="action-btn favorite-btn favorited" size="small"
                                    @click="removeFromWatchlist(selectedStock.code)">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                            fill="currentColor" />
                                    </svg>
                                    已加自选
                                </el-button>
                                <el-button class="close-btn" circle @click="buyDialogVisible = false">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" />
                                    </svg>
                                </el-button>
                            </div>
                        </div>
                    </div>

                    <!-- 底部：快速信息栏 -->
                    <div class="header-info-bar">
                        <div class="info-item">
                            <span class="info-label">涨停</span>
                            <span class="info-value up">{{ (parseFloat(selectedStock.price) * 1.1).toFixed(2) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">跌停</span>
                            <span class="info-value down">{{ (parseFloat(selectedStock.price) * 0.9).toFixed(2)
                            }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">总市值</span>
                            <span class="info-value">1,234.56亿</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">流通市值</span>
                            <span class="info-value">987.65亿</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">市盈率</span>
                            <span class="info-value">15.6</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">市净率</span>
                            <span class="info-value">2.3</span>
                        </div>
                    </div>
                </div>

                <!-- 五档行情 -->
                <!-- 主要内容区域 - 左右布局 -->
                <div class="trading-main-content">
                    <!-- 左侧：交易面板 -->
                    <div class="left-panel">
                        <div class="trading-panel">
                            <div class="panel-tabs">
                                <div class="tab-item active">{{ tradeType === 'sell' ? '卖出' : '买入' }}</div>
                                <div class="tab-item disabled">{{ tradeType === 'sell' ? '买入' : '卖出' }}</div>
                                <div class="tab-item disabled">撤单</div>
                                <div class="tab-item disabled">持仓</div>
                                <div class="tab-item disabled">查询</div>
                            </div>

                            <div class="trading-form">
                                <!-- 限价委托选择 -->
                                <div class="order-type-section">
                                    <el-select v-model="buyForm.orderType" class="order-type-select">
                                        <el-option label="限价委托" value="limit" />
                                        <el-option label="市价委托" value="market" />
                                    </el-select>
                                </div>

                                <!-- 价格输入 -->
                                <div class="price-section">
                                    <div class="input-row">
                                        <span class="input-label">委托价格</span>
                                        <div class="price-input-group">
                                            <el-input v-model="buyForm.price" class="price-input"
                                                :disabled="buyForm.orderType === 'market'" placeholder="185.50" />
                                            <div class="price-controls">
                                                <el-button size="small" class="price-btn"
                                                    @click="adjustPrice(0.01)">+</el-button>
                                                <el-button size="small" class="price-btn"
                                                    @click="adjustPrice(-0.01)">-</el-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 数量输入 -->
                                <div class="quantity-section">
                                    <div class="input-row">
                                        <span class="input-label">委托数量</span>
                                        <div class="quantity-input-group">
                                            <el-input-number v-model="buyForm.quantity" :min="100" :step="100"
                                                :max="maxBuyQuantity" controls-position="right"
                                                class="quantity-input" />
                                        </div>
                                    </div>

                                    <!-- 快捷数量选择 -->
                                    <div class="quantity-shortcuts">
                                        <el-button size="small" @click="setQuantityByPercent(100)">{{ tradeType ===
                                            'sell' ?
                                            '全部' : '全仓' }}</el-button>
                                        <el-button size="small" @click="setQuantityByPercent(50)">1/2</el-button>
                                        <el-button size="small" @click="setQuantityByPercent(33)">1/3</el-button>
                                        <el-button size="small" @click="setQuantityByPercent(25)">1/4</el-button>
                                    </div>
                                </div>

                                <!-- 可买/可卖信息 -->
                                <div class="available-info">
                                    <div class="info-row">
                                        <span class="label">{{ tradeType === 'sell' ? '可卖---' : '可买---' }}</span>
                                        <span class="value">{{ tradeType === 'sell' ? availableSellQuantity :
                                            availableBuyQuantity }}股</span>
                                    </div>
                                </div>

                                <!-- 交易预览 -->
                                <div class="trade-summary">
                                    <div class="summary-row">
                                        <span class="label">委托金额</span>
                                        <span class="value">{{ estimatedAmount.toFixed(2) }}</span>
                                    </div>
                                </div>

                                <!-- 买入按钮 -->
                                <div class="action-section">
                                    <el-button class="buy-action-btn" type="danger" size="large" @click="confirmBuy"
                                        :loading="buyLoading" :disabled="!canBuy">
                                        {{ tradeType === 'sell' ? '委托卖出' : '委托买入' }}
                                    </el-button>
                                </div>

                                <!-- 账户信息 -->
                                <div class="account-info-section">
                                    <div class="account-row">
                                        <span class="label">资金余额</span>
                                        <span class="value">{{ userStore.balance.toFixed(2) }}</span>
                                    </div>
                                    <div class="account-row" v-if="currentPosition">
                                        <span class="label">持仓数量</span>
                                        <span class="value">{{ currentPosition.quantity }}</span>
                                    </div>
                                    <div class="account-row" v-if="currentPosition">
                                        <span class="label">可卖数量</span>
                                        <span class="value">{{ currentPosition.quantity }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧：五档行情 -->
                    <div class="right-panel">
                        <div class="market-depth">
                            <div class="depth-header">
                                <span>五档行情</span>
                                <span class="refresh-time">{{ getCurrentTime() }}</span>
                            </div>
                            <div class="depth-content">
                                <div class="depth-table">
                                    <div class="table-header">
                                        <span class="col-label">档位</span>
                                        <span class="col-price">价格</span>
                                        <span class="col-volume">数量</span>
                                    </div>

                                    <!-- 卖盘 -->
                                    <div class="sell-orders">
                                        <div v-for="(order, index) in sellOrders" :key="index" class="order-row sell">
                                            <span class="order-label">卖{{ 5 - index }}</span>
                                            <span class="order-price">{{ order.price }}</span>
                                            <span class="order-volume">{{ order.volume }}</span>
                                        </div>
                                    </div>

                                    <!-- 当前价格 -->
                                    <div class="current-price-row">
                                        <span class="current-label">现价</span>
                                        <span :class="['current-value', selectedStock.change >= 0 ? 'up' : 'down']">
                                            {{ selectedStock.price }}
                                        </span>
                                        <span class="current-change">
                                            {{ selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.changePercent }}%
                                        </span>
                                    </div>

                                    <!-- 买盘 -->
                                    <div class="buy-orders">
                                        <div v-for="(order, index) in buyOrders" :key="index" class="order-row buy">
                                            <span class="order-label">买{{ index + 1 }}</span>
                                            <span class="order-price">{{ order.price }}</span>
                                            <span class="order-volume">{{ order.volume }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="trading-footer">
                    <el-button class="cancel-btn" @click="buyDialogVisible = false">取消</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 自定义快捷操作对话框 -->
        <el-dialog v-model="customizeDialogVisible" title="自定义快捷操作" width="700px" class="customize-dialog">
            <div class="customize-content">
                <!-- 默认快捷操作 -->
                <div class="section">
                    <div class="section-title">
                        <h4>默认快捷操作</h4>
                        <span class="section-subtitle">开启或关闭系统预设的快捷操作</span>
                    </div>
                    <div class="shortcuts-grid">
                        <div v-for="shortcut in defaultShortcuts" :key="shortcut.id"
                            :class="['shortcut-card', { 'active': shortcut.isActive }]">
                            <div class="card-header">
                                <div class="icon-wrapper">
                                    <span class="shortcut-icon">{{ shortcut.icon }}</span>
                                </div>
                                <el-switch v-model="shortcut.isActive" @change="toggleShortcutActive(shortcut)"
                                    class="shortcut-switch" />
                            </div>
                            <div class="card-content">
                                <div class="shortcut-title">{{ shortcut.title }}</div>
                                <div class="shortcut-desc">{{ shortcut.description }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 自定义快捷操作 -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <h4>自定义快捷操作</h4>
                            <span class="section-subtitle">创建专属于您的快捷操作（最多3个）</span>
                        </div>
                        <el-button type="primary" @click="addCustomShortcut" :disabled="customShortcuts.length >= 3"
                            class="add-shortcut-btn">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            添加自定义操作
                        </el-button>
                    </div>

                    <!-- 自定义快捷操作列表 -->
                    <div class="custom-shortcuts-list" v-if="customShortcuts.length > 0">
                        <div v-for="shortcut in customShortcuts" :key="shortcut.id"
                            :class="['custom-shortcut-item', { 'editing': shortcut.isEditing }]">

                            <!-- 显示模式 -->
                            <div class="shortcut-display" v-if="!shortcut.isEditing">
                                <div class="display-left">
                                    <div class="icon-wrapper">
                                        <span class="shortcut-icon">{{ shortcut.icon }}</span>
                                    </div>
                                    <div class="shortcut-details">
                                        <div class="shortcut-title">{{ shortcut.title }}</div>
                                        <div class="shortcut-desc">{{ shortcut.description }}</div>
                                    </div>
                                </div>
                                <div class="display-right">
                                    <el-switch v-model="shortcut.isActive" @change="saveCustomShortcuts" />
                                    <div class="action-buttons">
                                        <el-button type="primary" link @click="startEditShortcut(shortcut)">
                                            <el-icon>
                                                <Edit />
                                            </el-icon>
                                        </el-button>
                                        <el-button type="danger" link @click="removeCustomShortcut(shortcut.id)">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </div>
                            </div>

                            <!-- 编辑模式 -->
                            <div class="shortcut-edit" v-else>
                                <div class="edit-form">
                                    <!-- 图标选择 -->
                                    <div class="form-group">
                                        <label class="form-label">选择图标</label>
                                        <div class="icon-selector">
                                            <div class="current-icon">
                                                <span class="selected-icon">{{ shortcut.icon }}</span>
                                            </div>
                                            <div class="icon-options">
                                                <div v-for="icon in availableIcons" :key="icon"
                                                    :class="['icon-option', { 'selected': shortcut.icon === icon }]"
                                                    @click="selectIcon(shortcut, icon)">
                                                    <span>{{ icon }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 基本信息 -->
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">操作标题</label>
                                            <el-input v-model="shortcut.title" maxlength="10" placeholder="如：股票分析"
                                                show-word-limit />
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">简称</label>
                                            <el-input v-model="shortcut.shortTitle" maxlength="2" placeholder="如：分析"
                                                style="width: 100px;" />
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">操作描述</label>
                                        <el-input v-model="shortcut.description" maxlength="50"
                                            placeholder="简单描述这个操作的用途" show-word-limit />
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">执行内容</label>
                                        <el-input v-model="shortcut.prompt" type="textarea" :rows="4" maxlength="500"
                                            placeholder="请输入您希望AI执行的具体操作内容，例如：请帮我分析一下当前市场的热点板块..." show-word-limit />
                                    </div>
                                </div>

                                <div class="edit-actions">
                                    <el-button @click="cancelEditShortcut(shortcut)">取消</el-button>
                                    <el-button type="primary" @click="saveEditShortcut(shortcut)">保存</el-button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-else class="empty-custom">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">
                            <h5>还没有自定义快捷操作</h5>
                            <p>点击上方"添加自定义操作"按钮，创建专属于您的快捷操作</p>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="customizeDialogVisible = false" size="large">关闭</el-button>
                </div>
            </template>
        </el-dialog>

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
import { User, Lock, ArrowDown, Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { mockApi, wechatLoginApi } from '../api/mock';
import Sidebar from '../components/Sidebar.vue';
import UserProfile from '../components/UserProfile.vue';
import OnboardingFlow from '../components/OnboardingFlow.vue';

const userStore = useUserStore();
const inputMessage = ref('');
const chatHistory = ref([]);
const chatHistoryRef = ref(null);
const isChatMode = ref(false); // 控制是否进入聊天模式
const showUserProfile = ref(false); // 控制是否显示个人中心
const showChatShortcuts = ref(false); // 控制聊天模式下的快捷操作显示

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

// 自定义快捷操作
const customShortcuts = ref(JSON.parse(localStorage.getItem('customShortcuts') || '[]'));

// 可选图标列表
const availableIcons = ref([
    '💡', '🚀', '📊', '💰', '🎯', '⭐', '🔥', '📈', '💎', '🏆',
    '🎨', '⚡', '🌟', '🎪', '🎭', '🎪', '🎨', '🎯', '🎲', '🎮',
    '📱', '💻', '📺', '⌚', '📷', '🎥', '🎧', '🎤', '🎸', '🎹',
    '🏠', '🏢', '🏭', '🏪', '🏫', '🏥', '🏦', '🏨', '🏩', '🏰',
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '✈️', '🚁', '🚂', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊',
    '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🌋', '🗻', '🏔️', '⛰️'
]);

// 当前激活的快捷操作
const activeShortcuts = computed(() => {
    const result = [];

    // 添加激活的默认快捷操作
    const activeDefaultShortcuts = defaultShortcuts.value.filter(s => s.isActive);
    result.push(...activeDefaultShortcuts);

    // 添加激活的自定义快捷操作
    const activeCustomShortcuts = customShortcuts.value
        .filter(s => s.isActive)
        .map(shortcut => ({
            ...shortcut,
            action: () => setSuggestionAndSend(shortcut.prompt)
        }));
    result.push(...activeCustomShortcuts);

    // 返回所有激活的快捷操作（最多5个默认 + 3个自定义 = 8个）
    return result;
});

// 板块搜索相关
const sectorSearchQuery = ref('');
const filteredSubSectors = ref([]);
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
const loginFormRef = ref(null);
const loginForm = reactive({
    username: '',
    password: '',
    phone: '',
    confirmPassword: ''
});
const loginRules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value !== loginForm.password) {
                    return Promise.reject('两次输入的密码不一致');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ]
};

const isRegisterMode = ref(false);
const loginLoading = ref(false);
const wechatLoginLoading = ref(false);

// 账号找回相关
const recoveryDialogVisible = ref(false);
const recoveryFormRef = ref(null);
const recoveryStep = ref(1); // 1: 输入联系方式, 2: 验证码, 3: 重置密码
const recoveryLoading = ref(false);
const sendingCode = ref(false);
const codeCountdown = ref(0);
let countdownTimer = null;

const recoveryForm = reactive({
    contact: '',
    verifyCode: '',
    newPassword: '',
    confirmNewPassword: ''
});

const recoveryRules = {
    contact: [
        { required: true, message: '请输入手机号或邮箱', trigger: 'blur' },
        {
            validator: (rule, value) => {
                const phoneRegex = /^1[3-9]\d{9}$/;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!phoneRegex.test(value) && !emailRegex.test(value)) {
                    return Promise.reject('请输入有效的手机号或邮箱');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ],
    verifyCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' },
        { len: 6, message: '验证码为6位数字', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmNewPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value !== recoveryForm.newPassword) {
                    return Promise.reject('两次输入的密码不一致');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ]
};

// 投资偏好设置
const preferencesDialogVisible = ref(false);
const preferencesFormRef = ref(null);
const preferencesLoading = ref(false);
const currentStep = ref(0);
const preferencesForm = reactive({
    riskLevel: '',
    experience: '',
    userTraits: {
        risk_tolerance: 3,
        active_participation: 3,
        learning_willingness: 3,
        strategy_dependency: 2,
        trading_frequency: 2,
        innovation_trial: 3
    },
    sectors: {
        majorCategories: [], // 大分类，最多选择2个
        subCategories: []    // 小分类，可选择3-4个
    }
});

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

// 五档行情数据
const sellOrders = ref([]);
const buyOrders = ref([]);

// 生成五档行情数据
const generateMarketDepth = (basePrice) => {
    const price = parseFloat(basePrice);
    sellOrders.value = [];
    buyOrders.value = [];

    // 生成卖盘（卖5到卖1）
    for (let i = 0; i < 5; i++) {
        sellOrders.value.push({
            price: (price + (i + 1) * 0.01).toFixed(2),
            volume: Math.floor(Math.random() * 500 + 100)
        });
    }

    // 生成买盘（买1到买5）
    for (let i = 0; i < 5; i++) {
        buyOrders.value.push({
            price: (price - (i + 1) * 0.01).toFixed(2),
            volume: Math.floor(Math.random() * 500 + 100)
        });
    }
};

// 获取当前时间
const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// 调整价格
const adjustPrice = (delta) => {
    const currentPrice = parseFloat(buyForm.price) || 0;
    const newPrice = Math.max(0.01, currentPrice + delta);
    buyForm.price = newPrice.toFixed(2);
};

// 按比例设置购买/卖出数量
const setQuantityByPercent = (percent) => {
    if (!selectedStock.value) return;

    if (tradeType.value === 'sell') {
        // 卖出时基于持仓数量计算
        const position = userStore.getPosition(selectedStock.value.code);
        const maxQuantity = position ? position.quantity : 0;
        const targetQuantity = Math.floor(maxQuantity * (percent / 100) / 100) * 100;
        buyForm.quantity = Math.max(100, targetQuantity);
    } else {
        // 买入时基于可用资金计算
        const price = buyForm.orderType === 'market'
            ? parseFloat(selectedStock.value.price)
            : parseFloat(buyForm.price) || parseFloat(selectedStock.value.price);

        const availableFunds = userStore.balance;
        const maxQuantity = Math.floor(availableFunds / price / 100) * 100; // 向下取整到100的倍数

        const targetQuantity = Math.floor(maxQuantity * (percent / 100) / 100) * 100;
        buyForm.quantity = Math.max(100, targetQuantity);
    }
};

const showLoginDialog = (isRegister) => {
    isRegisterMode.value = isRegister;
    loginDialogVisible.value = true;
};

const handleLogin = async () => {
    if (!loginFormRef.value) return;
    await loginFormRef.value.validate((valid) => {
        if (valid) {
            loginLoading.value = true;

            // 模拟API调用
            setTimeout(() => {
                const token = 'mock-token-' + Date.now();
                const userInfo = {
                    username: loginForm.username,
                    nickname: loginForm.username,
                    isNewUser: isRegisterMode.value
                };

                userStore.setToken(token);
                userStore.setUserInfo(userInfo);

                if (isRegisterMode.value) {
                    // 新用户注册成功，引导设置投资偏好
                    ElMessage.success('注册成功！');
                    loginDialogVisible.value = false;
                    loginLoading.value = false;

                    // 延迟显示投资偏好设置
                    setTimeout(() => {
                        preferencesDialogVisible.value = true;
                    }, 500);
                } else {
                    // 老用户登录成功
                    ElMessage.success('登录成功！');
                    loginDialogVisible.value = false;
                    loginLoading.value = false;
                    dismissGuide();

                    // 检查老用户是否已设置偏好，如果没有则引导设置
                    setTimeout(() => {
                        checkUserStatus();
                    }, 500);
                }
            }, 1000);
        }
    });
};

const handleWechatLogin = async () => {
    wechatLoginLoading.value = true;

    try {
        ElMessage.info('正在启动微信登录...');

        // 调用微信登录API
        const response = await wechatLoginApi.mobileLogin();

        if (response.success) {
            const { token, userInfo } = response.data;

            // 保存用户信息
            userStore.setToken(token);
            userStore.setUserInfo({
                username: userInfo.openid,
                nickname: userInfo.nickname,
                avatar: userInfo.avatar,
                loginType: 'wechat',
                openid: userInfo.openid,
                unionid: userInfo.unionid
            });

            ElMessage.success('微信登录成功！');
            loginDialogVisible.value = false;
            dismissGuide();

            // 检查微信登录用户是否已设置偏好
            setTimeout(() => {
                checkUserStatus();
            }, 500);
        } else {
            ElMessage.error('微信登录失败，请重试');
        }

    } catch (error) {
        ElMessage.error('微信登录失败，请重试');
        console.error('微信登录错误:', error);
    } finally {
        wechatLoginLoading.value = false;
    }
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
        chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
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
        res.data
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
        res.data
    );

    await nextTick();
    scrollToBottom();
};

const toggleAuthMode = () => {
    isRegisterMode.value = !isRegisterMode.value;
    loginForm.username = '';
    loginForm.password = '';
    loginForm.phone = '';
    loginForm.confirmPassword = '';

    // 清除表单验证
    if (loginFormRef.value) {
        loginFormRef.value.clearValidate();
    }
};

const closeAuthDialog = () => {
    loginDialogVisible.value = false;
};

// 账号找回相关方法
const showRecoveryDialog = () => {
    loginDialogVisible.value = false;
    recoveryDialogVisible.value = true;
    recoveryStep.value = 1;
    // 重置表单
    Object.keys(recoveryForm).forEach(key => {
        recoveryForm[key] = '';
    });
    if (recoveryFormRef.value) {
        recoveryFormRef.value.clearValidate();
    }
};

const closeRecoveryDialog = () => {
    recoveryDialogVisible.value = false;
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        codeCountdown.value = 0;
    }
};

const backToLogin = () => {
    recoveryDialogVisible.value = false;
    loginDialogVisible.value = true;
};

const getRecoveryButtonText = () => {
    switch (recoveryStep.value) {
        case 1: return '发送验证码';
        case 2: return '验证并继续';
        case 3: return '重置密码';
        default: return '下一步';
    }
};

const handleRecoveryStep = async () => {
    if (!recoveryFormRef.value) return;

    const fieldsToValidate = [];
    switch (recoveryStep.value) {
        case 1:
            fieldsToValidate.push('contact');
            break;
        case 2:
            fieldsToValidate.push('verifyCode');
            break;
        case 3:
            fieldsToValidate.push('newPassword', 'confirmNewPassword');
            break;
    }

    try {
        await recoveryFormRef.value.validateField(fieldsToValidate);
        recoveryLoading.value = true;

        // 模拟API调用
        setTimeout(() => {
            switch (recoveryStep.value) {
                case 1:
                    // 发送验证码
                    ElMessage.success('验证码已发送，请查收');
                    recoveryStep.value = 2;
                    startCountdown();
                    break;
                case 2:
                    // 验证验证码
                    if (recoveryForm.verifyCode === '123456') { // 模拟验证码
                        ElMessage.success('验证成功');
                        recoveryStep.value = 3;
                    } else {
                        ElMessage.error('验证码错误');
                    }
                    break;
                case 3:
                    // 重置密码
                    ElMessage.success('密码重置成功，请使用新密码登录');
                    closeRecoveryDialog();
                    loginDialogVisible.value = true;
                    break;
            }
            recoveryLoading.value = false;
        }, 1000);
    } catch (error) {
        console.log('验证失败:', error);
    }
};

const sendVerifyCode = async () => {
    if (!recoveryForm.contact) {
        ElMessage.warning('请先输入手机号或邮箱');
        return;
    }

    sendingCode.value = true;

    // 模拟发送验证码
    setTimeout(() => {
        ElMessage.success('验证码已重新发送');
        startCountdown();
        sendingCode.value = false;
    }, 1000);
};

const startCountdown = () => {
    codeCountdown.value = 60;
    countdownTimer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
    }, 1000);
};

// 投资偏好相关方法
const handlePreferencesSubmit = async () => {
    preferencesLoading.value = true;

    // 模拟保存投资偏好
    setTimeout(() => {
        const preferences = {
            riskLevel: preferencesForm.riskLevel,
            experience: preferencesForm.experience,
            userTraits: preferencesForm.userTraits,
            sectors: preferencesForm.sectors,
            completedAt: new Date().toISOString()
        };

        // 保存到用户信息中
        const currentUser = userStore.userInfo;
        userStore.setUserInfo({
            ...currentUser,
            preferences
        });

        // 标记引导已完成
        localStorage.setItem('onboardingCompleted', 'true');

        ElMessage.success('投资偏好设置完成！');
        preferencesDialogVisible.value = false;
        preferencesLoading.value = false;

        // 显示欢迎消息
        setTimeout(() => {
            chatHistory.value.push({
                role: 'assistant',
                content: `欢迎使用智投小助！根据您的投资偏好（${getRiskLevelText(preferences.riskLevel)}），我将为您提供个性化的投资建议。您可以问我任何关于投资的问题。`
            });
        }, 500);
    }, 1000);
};

const skipPreferences = () => {
    preferencesDialogVisible.value = false;
    currentStep.value = 0;
    ElMessage.info('您可以稍后在设置中完善投资偏好');
};

// 步骤导航方法
const nextStep = () => {
    if (canProceedToNext.value && currentStep.value < preferenceSteps.length - 1) {
        currentStep.value++;
    }
};

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
};

// 检查是否可以进入下一步
const canProceedToNext = computed(() => {
    switch (currentStep.value) {
        case 0: // 投资经验
            return preferencesForm.experience !== '';
        case 1: // 风险偏好
            return preferencesForm.riskLevel !== '';
        case 2: // 用户特征
            return true; // 有默认值，总是可以进入下一步
        case 3: // 关注板块
            return preferencesForm.sectors.majorCategories.length > 0 &&
                preferencesForm.sectors.subCategories.length >= 3;
        default:
            return false;
    }
});

// 用户特征相关方法
const resetUserTraitsToDefault = () => {
    userTraits.forEach(trait => {
        preferencesForm.userTraits[trait.id] = trait.defaultValue;
    });
};

const getCurrentTraitDescription = (traitId) => {
    const trait = userTraits.find(t => t.id === traitId);
    if (!trait) return '';

    const currentValue = preferencesForm.userTraits[traitId];
    const option = trait.options.find(opt => opt.value === currentValue);
    return option ? option.desc : '';
};

// 大分类选择逻辑
const toggleMajorSector = (value) => {
    const index = preferencesForm.sectors.majorCategories.indexOf(value);
    if (index > -1) {
        // 取消选择大分类时，同时移除该分类下的所有小分类
        preferencesForm.sectors.majorCategories.splice(index, 1);
        const subSectorsToRemove = subSectorOptions
            .filter(sub => sub.parent === value)
            .map(sub => sub.value);
        preferencesForm.sectors.subCategories = preferencesForm.sectors.subCategories
            .filter(sub => !subSectorsToRemove.includes(sub));
    } else {
        // 检查是否已达到最大选择数量
        if (preferencesForm.sectors.majorCategories.length < 2) {
            preferencesForm.sectors.majorCategories.push(value);
        }
    }
};

// 小分类选择逻辑
const toggleSubSector = (value) => {
    const index = preferencesForm.sectors.subCategories.indexOf(value);
    if (index > -1) {
        preferencesForm.sectors.subCategories.splice(index, 1);
    } else {
        // 检查是否已达到最大选择数量
        if (preferencesForm.sectors.subCategories.length < 4) {
            preferencesForm.sectors.subCategories.push(value);
        }
    }
};

// 获取大分类的图标
const getMajorSectorIcon = (value) => {
    const sector = majorSectorOptions.find(s => s.value === value);
    return sector ? sector.icon : '';
};

// 获取大分类的标签
const getMajorSectorLabel = (value) => {
    const sector = majorSectorOptions.find(s => s.value === value);
    return sector ? sector.label : '';
};

// 根据父分类获取小分类
const getSubSectorsByParent = (parentValue) => {
    return subSectorOptions.filter(sub => sub.parent === parentValue);
};

// 板块搜索功能
const handleSectorSearch = () => {
    if (!sectorSearchQuery.value.trim()) {
        filteredSubSectors.value = [];
        return;
    }

    const query = sectorSearchQuery.value.toLowerCase().trim();
    filteredSubSectors.value = subSectorOptions.filter(sector => {
        return sector.label.toLowerCase().includes(query) ||
            sector.desc.toLowerCase().includes(query) ||
            sector.examples.toLowerCase().includes(query);
    });
};

// 高亮搜索关键词
const highlightSearchTerm = (text) => {
    if (!sectorSearchQuery.value.trim()) return text;

    const query = sectorSearchQuery.value.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

// 从搜索结果中选择板块
const toggleSubSectorFromSearch = (subOption) => {
    // 首先确保相应的大分类已选中
    if (!preferencesForm.sectors.majorCategories.includes(subOption.parent)) {
        // 如果大分类未选择且还可以选择，自动添加大分类
        if (preferencesForm.sectors.majorCategories.length < 2) {
            preferencesForm.sectors.majorCategories.push(subOption.parent);
        } else {
            ElMessage.warning('请先移除一个大分类，再选择此细分行业');
            return;
        }
    }

    // 然后切换细分行业
    toggleSubSector(subOption.value);
};

const getRiskLevelText = (level) => {
    const map = {
        'conservative': '保守型',
        'stable': '稳健型',
        'balanced': '平衡型',
        'growth': '成长型',
        'aggressive': '激进型'
    };
    return map[level] || '未设置';
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
            showLoginDialog(false);
            break;
        case 'register':
            showLoginDialog(true);
            break;
    }
};

const dismissGuide = () => {
    showGuideTip.value = false;
};

// 购买相关计算属性
const currentPosition = computed(() => {
    if (!selectedStock.value) return null;
    return userStore.getPosition(selectedStock.value.code);
});

const maxBuyQuantity = computed(() => {
    if (!selectedStock.value) return 100; // 至少返回100，避免min > max错误

    if (tradeType.value === 'sell') {
        // 卖出模式：最大数量为持仓数量
        const position = userStore.getPosition(selectedStock.value.code);
        return position ? position.quantity : 100;
    } else {
        // 买入模式：基于资金计算最大购买数量
        const price = parseFloat(selectedStock.value.price);
        const maxShares = Math.floor(userStore.balance / price / 100) * 100; // 按100股整数倍
        return Math.max(100, maxShares); // 至少返回100股
    }
});

// 可买数量显示
const availableBuyQuantity = computed(() => {
    if (!selectedStock.value) return 0;
    const price = buyForm.orderType === 'market'
        ? parseFloat(selectedStock.value.price)
        : parseFloat(buyForm.price) || parseFloat(selectedStock.value.price);
    const maxShares = Math.floor(userStore.balance / price / 100) * 100;
    return Math.max(0, maxShares);
});

// 可卖数量显示
const availableSellQuantity = computed(() => {
    if (!selectedStock.value) return 0;
    const position = userStore.getPosition(selectedStock.value.code);
    return position ? position.quantity : 0;
});

// 预计成交金额
const estimatedAmount = computed(() => {
    if (!selectedStock.value || !buyForm.quantity) return 0;
    const price = buyForm.orderType === 'market'
        ? parseFloat(selectedStock.value.price)
        : parseFloat(buyForm.price) || parseFloat(selectedStock.value.price);
    return buyForm.quantity * price;
});

// 手续费计算
const tradingFee = computed(() => {
    const amount = estimatedAmount.value;
    const commissionRate = 0.0003; // 万分之3
    const minCommission = 5; // 最低5元
    const stampTax = amount * 0.001; // 印花税千分之1（卖出时收取，买入不收）
    const transferFee = amount * 0.00002; // 过户费万分之0.2

    const commission = Math.max(amount * commissionRate, minCommission);

    if (tradeType.value === 'sell') {
        // 卖出时收取印花税
        return commission + transferFee + stampTax;
    } else {
        // 买入时不收印花税
        return commission + transferFee;
    }
});

// 总成本
const totalCost = computed(() => {
    return estimatedAmount.value + tradingFee.value;
});

const canBuy = computed(() => {
    if (tradeType.value === 'sell') {
        // 卖出验证
        return buyForm.quantity >= 100 &&
            buyForm.quantity % 100 === 0 && // 必须是100的整数倍
            buyForm.quantity <= availableSellQuantity.value &&
            (buyForm.orderType === 'market' || (buyForm.price && parseFloat(buyForm.price) > 0));
    } else {
        // 买入验证
        return buyForm.quantity >= 100 &&
            buyForm.quantity % 100 === 0 && // 必须是100的整数倍
            totalCost.value <= userStore.balance &&
            buyForm.quantity <= maxBuyQuantity.value &&
            (buyForm.orderType === 'market' || (buyForm.price && parseFloat(buyForm.price) > 0));
    }
});

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

    if (type === 'sell') {
        // 卖出操作：设置默认数量为100股或持仓数量的较小值
        const position = userStore.getPosition(stockInfo.code);
        buyForm.quantity = position ? Math.min(100, position.quantity) : 100;
        buyForm.price = stockInfo.currentPrice || stockInfo.price; // 使用当前价格
    } else {
        // 买入操作：设置默认数量
        buyForm.quantity = 100;
        buyForm.price = stockInfo.price; // 设置默认价格为当前价格
    }

    buyForm.orderType = 'limit'; // 默认限价单

    // 生成五档行情数据
    generateMarketDepth(stockInfo.currentPrice || stockInfo.price);

    buyDialogVisible.value = true;
};

// 处理来自侧边栏的卖出事件
const handleShowSellDialog = (stockInfo) => {
    showBuyDialog(stockInfo, 'sell');
};

const confirmBuy = async () => {
    if (!canBuy.value) {
        ElMessage.warning('请检查交易信息');
        return;
    }

    buyLoading.value = true;

    // 模拟交易延迟
    setTimeout(() => {
        const actualPrice = buyForm.orderType === 'market'
            ? parseFloat(selectedStock.value.currentPrice || selectedStock.value.price)
            : parseFloat(buyForm.price);

        let result;
        if (tradeType.value === 'sell') {
            // 卖出操作
            result = userStore.sellStock(
                selectedStock.value.code,
                buyForm.quantity,
                actualPrice
            );
        } else {
            // 买入操作
            result = userStore.buyStock(
                selectedStock.value,
                buyForm.quantity,
                actualPrice
            );
        }

        if (result.success) {
            ElMessage.success(result.message);
            buyDialogVisible.value = false;

            // 发送交易成功的消息到聊天
            const orderTypeText = buyForm.orderType === 'market' ? '市价' : '限价';
            const tradeTypeText = tradeType.value === 'sell' ? '卖出' : '买入';
            const successMessage = `✅ 交易成功！
            
📊 **交易详情**
• 股票：${selectedStock.value.name} (${selectedStock.value.code})
• 类型：${orderTypeText}${tradeTypeText}
• 数量：${buyForm.quantity}股
• 成交价：¥${actualPrice.toFixed(2)}
• 成交金额：¥${estimatedAmount.value.toFixed(2)}
• 手续费：¥${tradingFee.value.toFixed(2)}
• ${tradeType.value === 'sell' ? '实收金额' : '总计'}：¥${tradeType.value === 'sell' ? (estimatedAmount.value - tradingFee.value).toFixed(2) : totalCost.value.toFixed(2)}

💰 **账户信息**
• 当前余额：¥${userStore.balance.toFixed(2)}
• 持仓数量：${userStore.getPosition(selectedStock.value.code)?.quantity || 0}股`;

            chatHistory.value.push({
                role: 'assistant',
                content: successMessage
            });

            nextTick(() => {
                scrollToBottom();
            });
        } else {
            ElMessage.error(result.message);
        }

        buyLoading.value = false;
    }, 1500);
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
    ElMessageBox.confirm(
        `AI委托交易 ${stock.name}(${stock.code}) 需要支付 ¥1，是否继续？`,
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

        // 扣费并执行AI委托交易
        userStore.deductBalance(1);
        ElMessage.success('支付成功，正在生成AI委托交易报告...');

        // 执行AI委托交易
        performQuantAnalysis(stock);
    }).catch(() => {
        ElMessage.info('已取消AI委托交易');
    });
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

const saveCustomShortcuts = () => {
    localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts.value));
    ElMessage.success('自定义快捷操作已保存');
};

const addCustomShortcut = () => {
    // 限制自定义快捷操作数量最多3个
    if (customShortcuts.value.length >= 3) {
        ElMessage.warning('最多只能添加3个自定义快捷操作');
        return;
    }

    const prompt = '请输入您想要执行的操作内容';
    const newShortcut = {
        id: Date.now().toString(),
        icon: '💡',
        title: '自定义操作',
        shortTitle: '自定',
        description: '请编辑此操作的描述',
        prompt: prompt,
        isDefault: false,
        isActive: true,
        isEditing: true // 创建后直接进入编辑模式
    };
    customShortcuts.value.push(newShortcut);
    saveCustomShortcuts();
    ElMessage.success('已添加自定义快捷操作，请完善信息');
};

const removeCustomShortcut = (id) => {
    const index = customShortcuts.value.findIndex(s => s.id === id);
    if (index > -1) {
        customShortcuts.value.splice(index, 1);
        saveCustomShortcuts();
    }
};

const toggleShortcutActive = (shortcut) => {
    if (shortcut.isDefault) {
        // 对于默认快捷操作，el-switch已经更改了isActive值，我们只需要保存状态
        const states = defaultShortcuts.value.reduce((acc, s) => {
            acc[s.id] = s.isActive;
            return acc;
        }, {});
        localStorage.setItem('defaultShortcutStates', JSON.stringify(states));
        ElMessage.success(shortcut.isActive ? '已启用该快捷操作' : '已禁用该快捷操作');
    } else {
        // 对于自定义快捷操作，el-switch已经更改了isActive值，我们只需要保存
        saveCustomShortcuts();
        ElMessage.success(shortcut.isActive ? '已启用该快捷操作' : '已禁用该快捷操作');
    }
};

// 初始化默认快捷操作状态
const initDefaultShortcutStates = () => {
    const savedStates = JSON.parse(localStorage.getItem('defaultShortcutStates') || '{}');
    defaultShortcuts.value.forEach(shortcut => {
        if (savedStates.hasOwnProperty(shortcut.id)) {
            shortcut.isActive = savedStates[shortcut.id];
        }
    });
};

// 编辑快捷操作相关方法
const startEditShortcut = (shortcut) => {
    // 保存原始数据用于取消编辑
    shortcut.originalData = {
        icon: shortcut.icon,
        title: shortcut.title,
        shortTitle: shortcut.shortTitle,
        description: shortcut.description,
        prompt: shortcut.prompt
    };
    shortcut.isEditing = true;
};

const saveEditShortcut = (shortcut) => {
    if (!shortcut.title.trim()) {
        ElMessage.warning('标题不能为空');
        return;
    }
    if (!shortcut.shortTitle || !shortcut.shortTitle.trim()) {
        ElMessage.warning('简称不能为空');
        return;
    }
    if (shortcut.shortTitle.length > 2) {
        ElMessage.warning('简称最多2个字符');
        return;
    }
    if (!shortcut.prompt.trim()) {
        ElMessage.warning('执行内容不能为空');
        return;
    }

    // 更新快捷操作信息
    shortcut.isEditing = false;
    delete shortcut.originalData;
    saveCustomShortcuts();
    ElMessage.success('自定义快捷操作已保存');
};

const cancelEditShortcut = (shortcut) => {
    // 恢复原始数据
    if (shortcut.originalData) {
        shortcut.icon = shortcut.originalData.icon;
        shortcut.title = shortcut.originalData.title;
        shortcut.shortTitle = shortcut.originalData.shortTitle;
        shortcut.description = shortcut.originalData.description;
        shortcut.prompt = shortcut.originalData.prompt;
        delete shortcut.originalData;
    }
    shortcut.isEditing = false;
};

// 选择图标
const selectIcon = (shortcut, icon) => {
    shortcut.icon = icon;
};

// 组件挂载时初始化
onMounted(() => {
    initDefaultShortcutStates();
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
    padding-top: 88px;
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
}

.chat-history-area {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px 0;
    overflow-y: auto;
    height: calc(100vh - 56px - 260px);
    /* 页面高度 - 导航栏高度 - 输入区域高度(增加到240px) */
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
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid #f0f0f0;
    padding: 20px 32px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 50;
    transition: all 0.3s;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* 移除输入区域的right限制，让它保持全宽 */

.new-chat-section {
    width: 100%;
    max-width: 900px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
}

.chat-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}

.new-chat-btn {
    border-radius: 20px;
    background: #f5f7fa;
    color: #18181b;
    font-weight: 500;
    border: 1px solid #e0e0e0;
    box-shadow: none;
    padding: 8px 20px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
}

.new-chat-btn:hover {
    background: #e6e8eb;
    border-color: #d0d0d0;
}

.goto-recommendation-btn {
    border-radius: 20px;
    background: #fef3c7;
    color: #92400e;
    font-weight: 500;
    border: 1px solid #fbbf24;
    box-shadow: none;
    padding: 8px 20px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-shortcut-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1f2937;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
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

.ai-card {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    z-index: 2;
}

.ai-input-row {
    display: flex;
    align-items: flex-end;
    background: #f8f9fa;
    border-radius: 20px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    padding: 16px 20px;
    gap: 12px;
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
    align-items: flex-end;
    gap: 8px;
}

.ai-func-btn {
    border-radius: 50%;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
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
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
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
    .suggestion-row {
        flex-direction: column;
        align-items: center;
    }

    .ai-suggestion-btn {
        min-width: 200px;
        width: 100%;
        max-width: 280px;
    }

    /* 聊天快捷操作移动端适配 */
    .shortcuts-grid {
        gap: 6px;
        justify-content: space-around;
    }

    .chat-shortcut-btn {
        min-height: 45px;
        min-width: 55px;
        padding: 6px 8px;
        gap: 2px;
    }

    .chat-shortcut-btn .btn-icon {
        font-size: 1rem;
    }

    .chat-shortcut-btn .btn-text {
        font-size: 0.7rem;
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

/* 认证弹窗样式 - v0风格 */
:deep(.auth-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.auth-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.auth-dialog .el-dialog__body) {
    padding: 0;
}

.auth-container {
    padding: 32px 40px;
    background: white;
    display: flex;
    align-items: center;
    gap: 40px;
    min-height: 400px;
}

.auth-logo-section {
    flex: 1;
    text-align: center;
    padding-right: 20px;
}

.auth-logo {
    width: 80px;
    height: 80px;
    background: #18181b;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}

.logo-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.auth-main-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #18181b;
    letter-spacing: -0.025em;
}

.auth-main-subtitle {
    font-size: 0.95rem;
    margin: 0;
    color: #6b7280;
    font-weight: 400;
    line-height: 1.4;
}

.auth-form-wrapper {
    flex: 1;
    max-width: 280px;
    padding-left: 20px;
    border-left: 1px solid #f3f4f6;
}

.auth-form {
    margin-bottom: 20px;
}

.auth-form-item {
    margin-bottom: 14px;
    text-align: left;
}

.auth-form-item:last-child {
    margin-bottom: 0;
}

/* 强制覆盖Element Plus的默认样式 */
:deep(.auth-input) {
    --el-input-border-color: #6b7280 !important;
    --el-input-hover-border-color: #374151 !important;
    --el-input-focus-border-color: #18181b !important;
}

:deep(.auth-input .el-input__wrapper) {
    height: 44px !important;
    border-radius: 8px !important;
    border: 2px solid #6b7280 !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
    padding: 0 14px !important;
}

:deep(.auth-input .el-input__wrapper:hover) {
    border-color: #374151 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.auth-input.is-focus .el-input__wrapper) {
    border-color: #18181b !important;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.auth-input .el-input__inner) {
    font-size: 1rem;
    color: #18181b;
    font-weight: 400;
    height: 100%;
}

:deep(.auth-input .el-input__inner::placeholder) {
    color: #9ca3af;
    font-weight: 400;
}

.auth-submit-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: #18181b;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: white;
    transition: all 0.2s ease;
    margin-bottom: 20px;
}

.auth-submit-btn:hover {
    background: #000000;
}

.auth-submit-btn:active {
    transform: scale(0.98);
}

/* 第三方登录样式 */
.auth-divider {
    position: relative;
    text-align: center;
    margin: 20px 0;
}

.auth-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e5e7eb;
}

.divider-text {
    background: white;
    padding: 0 12px;
    color: #9ca3af;
    font-size: 0.875rem;
    position: relative;
    z-index: 1;
}

.third-party-login {
    margin-bottom: 20px;
}

.wechat-login-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: #07c160;
    border: 1px solid #07c160;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.wechat-login-btn:hover {
    background: #06ad56;
    border-color: #06ad56;
    color: white;
}

.wechat-login-btn:active {
    transform: scale(0.98);
}

.wechat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-mode-switch {
    text-align: center;
    margin-bottom: 16px;
}

.switch-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 4px;
}

.switch-link {
    color: #18181b;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
}

.switch-link:hover {
    color: #000000;
    background: transparent;
}

.auth-footer {
    text-align: center;
    border-top: 1px solid #f3f4f6;
    padding-top: 16px;
    margin-top: 16px;
}

.cancel-btn {
    color: #6b7280;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 6px 14px;
    border-radius: 6px;
    border: none;
    background: transparent;
    transition: all 0.2s ease;
}

.cancel-btn:hover {
    color: #374151;
    background: #f9fafb;
}

/* 账号找回链接样式 */
.auth-recovery {
    text-align: center;
    margin-bottom: 16px;
}

.recovery-link {
    color: #6b7280;
    font-weight: 400;
    font-size: 0.875rem;
    padding: 0;
    text-decoration: none;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
}

.recovery-link:hover {
    color: #18181b;
    background: transparent;
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* 账号找回对话框样式 */
:deep(.recovery-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.recovery-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.recovery-dialog .el-dialog__body) {
    padding: 0;
}

.recovery-container {
    padding: 32px 40px;
    background: white;
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.recovery-header {
    text-align: center;
    margin-bottom: 32px;
}

.recovery-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.recovery-logo .logo-image {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.recovery-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #18181b;
    letter-spacing: -0.025em;
}

.recovery-subtitle {
    font-size: 0.875rem;
    margin: 0;
    color: #6b7280;
    font-weight: 400;
    line-height: 1.5;
    max-width: 360px;
    margin: 0 auto;
}

.recovery-form-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.recovery-form {
    margin-bottom: 20px;
}

.recovery-form-item {
    margin-bottom: 16px;
    text-align: left;
}

.recovery-form-item:last-child {
    margin-bottom: 0;
}

/* 验证码输入行 */
.verify-code-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.verify-code-row .recovery-input {
    flex: 1;
}

.send-code-btn {
    height: 44px;
    padding: 0 16px;
    border-radius: 8px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    flex-shrink: 0;
}

.send-code-btn:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
    color: #1f2937;
}

.send-code-btn:disabled {
    background: #f9fafb;
    border-color: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
}

/* 强制覆盖Element Plus的默认样式 */
:deep(.recovery-input) {
    --el-input-border-color: #6b7280 !important;
    --el-input-hover-border-color: #374151 !important;
    --el-input-focus-border-color: #18181b !important;
}

:deep(.recovery-input .el-input__wrapper) {
    height: 44px !important;
    border-radius: 8px !important;
    border: 2px solid #6b7280 !important;
    background: white !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
    padding: 0 14px !important;
}

:deep(.recovery-input .el-input__wrapper:hover) {
    border-color: #374151 !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep(.recovery-input.is-focus .el-input__wrapper) {
    border-color: #18181b !important;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

:deep(.recovery-input .el-input__inner) {
    font-size: 1rem;
    color: #18181b;
    font-weight: 400;
    height: 100%;
}

:deep(.recovery-input .el-input__inner::placeholder) {
    color: #9ca3af;
    font-weight: 400;
}

.recovery-submit-btn {
    width: 100%;
    height: 44px;
    border-radius: 8px;
    background: #18181b;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    color: white;
    transition: all 0.2s ease;
    margin-bottom: 20px;
}

.recovery-submit-btn:hover {
    background: #000000;
}

.recovery-submit-btn:active {
    transform: scale(0.98);
}

.recovery-back {
    text-align: center;
    margin-bottom: 16px;
}

.back-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 4px;
}

.back-link {
    color: #18181b;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
}

.back-link:hover {
    color: #000000;
    background: transparent;
}

.recovery-footer {
    text-align: center;
    border-top: 1px solid #f3f4f6;
    padding-top: 16px;
    margin-top: auto;
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

/* 购买对话框样式 */
:deep(.buy-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.buy-dialog .el-dialog__body) {
    padding: 0;
}

:deep(.buy-dialog .el-dialog__footer) {
    padding: 0;
}

.trading-interface {
    background: #f8f9fa;
    min-height: 600px;
}

/* 股票信息头部 */
.stock-header-section {
    background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
    color: white;
    position: relative;
    overflow: hidden;
}

.stock-header-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
        linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
}

/* 头部主要内容 */
.header-main-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 28px 20px;
    position: relative;
    z-index: 1;
}

/* 股票基本信息 */
.stock-basic-info {
    flex: 1;
}

.stock-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.stock-name-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

/* 购买窗口专用样式 */
.buy-dialog-stock-name {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    letter-spacing: -0.3px;
}

.buy-dialog-stock-code {
    font-size: 13px;
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 16px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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


}

/* 自定义快捷操作对话框样式 */
.customize-dialog {
    border-radius: 16px;
    overflow: hidden;
}

.customize-dialog .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    margin: 0;
}

.customize-dialog .el-dialog__title {
    color: white;
    font-weight: 600;
    font-size: 18px;
}

.customize-dialog .el-dialog__headerbtn .el-dialog__close {
    color: white;
    font-size: 20px;
}

.customize-dialog .el-dialog__body {
    padding: 24px;
    background: #fafbfc;
}

.customize-content {
    max-height: 70vh;
    overflow-y: auto;
}

/* 区域样式 */
.section {
    margin-bottom: 32px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section:last-child {
    margin-bottom: 0;
}

.section-title h4 {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
}

.section-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 20px;
    display: block;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

/* 默认快捷操作网格 */
.shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.shortcut-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.shortcut-card:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.shortcut-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

.shortcut-card.active .card-header .icon-wrapper {
    background: #3b82f6;
    color: white;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.icon-wrapper {
    width: 40px;
    height: 40px;
    background: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
}

.shortcut-icon {
    font-size: 20px;
}

.shortcut-switch {
    --el-switch-on-color: #3b82f6;
}

.card-content .shortcut-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.card-content .shortcut-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
}

/* 添加按钮 */
.add-shortcut-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.add-shortcut-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-shortcut-btn:disabled {
    background: #d1d5db;
    color: #9ca3af;
    transform: none;
    box-shadow: none;
}

/* 自定义快捷操作列表 */
.custom-shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.custom-shortcut-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
}

.custom-shortcut-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.custom-shortcut-item.editing {
    border-color: #3b82f6;
    background: #eff6ff;
}

/* 显示模式 */
.shortcut-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.display-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.display-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-buttons {
    display: flex;
    gap: 4px;
}

.shortcut-details .shortcut-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.shortcut-details .shortcut-desc {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
}

/* 编辑模式 */
.shortcut-edit {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 120px;
    gap: 16px;
}

.form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
}

/* 图标选择器 */
.icon-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.current-icon {
    display: flex;
    align-items: center;
    gap: 8px;
}

.selected-icon {
    width: 40px;
    height: 40px;
    background: #3b82f6;
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.icon-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
    max-height: 160px;
    overflow-y: auto;
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.icon-option {
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 18px;
}

.icon-option:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: scale(1.05);
}

.icon-option.selected {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

/* 编辑操作按钮 */
.edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}

/* 空状态 */
.empty-custom {
    text-align: center;
    padding: 60px 20px;
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.empty-text h5 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}

/* 对话框底部 */
.dialog-footer {
    text-align: center;
    padding: 16px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .shortcuts-grid {
        grid-template-columns: 1fr;
    }

    .form-row {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    .display-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .shortcut-display {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    .display-right {
        justify-content: space-between;
    }
}

.customize-btn {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    color: white;
}

.customize-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* 版权信息样式 */
.copyright-footer {
    margin-top: 60px;
    padding: 20px 0;
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%);
    border-top: 1px solid rgba(226, 232, 240, 0.6);
    backdrop-filter: blur(8px);
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
    color: #64748b;
    font-weight: 400;
    letter-spacing: 0.5px;
}

/* 响应式版权信息 */
@media (max-width: 768px) {
    .copyright-footer {
        margin-top: 40px;
        padding: 16px 0;
    }

    .copyright-content p {
        font-size: 13px;
        padding: 0 16px;
    }
}
</style>
