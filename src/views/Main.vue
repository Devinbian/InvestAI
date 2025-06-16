<template>
    <div class="main-modern">
        <!-- 顶部导航栏 -->
        <header class="modern-navbar">
            <div class="navbar-left">
                <img src="../assets/logo.svg" class="modern-logo" alt="logo" />
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
            <!-- 初始状态：标题、描述和输入区域作为一个整体 -->
            <div class="center-container" v-if="!isChatMode">
                <div class="welcome-section">
                    <div class="modern-title">我能帮你做什么？</div>
                    <div class="modern-desc">请输入您的投资问题或需求，智投小助手将为您提供专业建议</div>
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
                            <el-dropdown trigger="click">
                                <el-button class="ai-func-btn" circle>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="#888" stroke-width="2" />
                                        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#888" stroke-width="2" />
                                    </svg>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item>智能荐股</el-dropdown-item>
                                        <el-dropdown-item>大盘分析</el-dropdown-item>
                                        <el-dropdown-item>自选分析</el-dropdown-item>
                                        <el-dropdown-item>量化分析</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
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
                    <!-- 第一行：市场分析类 -->
                    <div class="suggestion-row">
                        <el-button class="ai-suggestion-btn hot" @click="setSuggestionAndSend('今日涨停板分析，有哪些值得关注的股票？')">
                            <span class="btn-icon">🔥</span>
                            涨停板分析
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('分析今日大盘走势和明日预判')">
                            <span class="btn-icon">📈</span>
                            大盘走势
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('当前热门板块和龙头股分析')">
                            <span class="btn-icon">🏆</span>
                            热门板块
                        </el-button>
                    </div>

                    <!-- 第二行：选股策略类 -->
                    <div class="suggestion-row">
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('帮我筛选低估值高分红的价值股')">
                            <span class="btn-icon">💎</span>
                            价值选股
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('推荐近期突破关键技术位的强势股')">
                            <span class="btn-icon">⚡</span>
                            技术突破
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('分析机构重仓和北向资金流入的股票')">
                            <span class="btn-icon">🏛️</span>
                            机构重仓
                        </el-button>
                    </div>

                    <!-- 第三行：风险管理类 -->
                    <div class="suggestion-row">
                        <el-button class="ai-suggestion-btn warning" @click="setSuggestionAndSend('帮我分析持仓风险和仓位管理建议')">
                            <span class="btn-icon">⚠️</span>
                            风险分析
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('制定止盈止损策略和资金管理计划')">
                            <span class="btn-icon">🛡️</span>
                            止盈止损
                        </el-button>
                        <el-button class="ai-suggestion-btn" @click="setSuggestionAndSend('分析市场情绪指标和散户行为')">
                            <span class="btn-icon">🧠</span>
                            市场情绪
                        </el-button>
                    </div>

                    <!-- 第四行：量化交易类 -->
                    <div class="suggestion-row">
                        <el-button class="ai-suggestion-btn quant" @click="setSuggestionAndSend('推荐适合散户的量化交易策略')">
                            <span class="btn-icon">🤖</span>
                            量化策略
                        </el-button>
                        <el-button class="ai-suggestion-btn quant" @click="setSuggestionAndSend('帮我做多因子选股模型分析')">
                            <span class="btn-icon">📊</span>
                            因子选股
                        </el-button>
                        <el-button class="ai-suggestion-btn quant" @click="setSuggestionAndSend('分析技术指标组合交易信号')">
                            <span class="btn-icon">📡</span>
                            交易信号
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 聊天历史区域 -->
            <div class="chat-history-area" v-if="isChatMode && chatHistory.length" ref="chatHistoryRef">
                <div v-for="(message, idx) in chatHistory" :key="idx" :class="['chat-message', message.role]">
                    <div class="chat-message-content">
                        <div class="message-text">{{ message.content }}</div>
                        <!-- 股票操作按钮 -->
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

                            <!-- 继续分析按钮 -->
                            <el-button v-if="!message.isBuyMode" size="small"
                                @click="continueAnalysis(message.stockInfo)" class="continue-analysis-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                        stroke="currentColor" stroke-width="2" />
                                </svg>
                                继续分析
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
                    </div>
                </div>
            </div>
        </main>

        <!-- 侧边栏（仅在登录后显示） -->
        <Sidebar v-if="userStore.isLoggedIn" @send-to-chat="handleSidebarInteraction" />

        <!-- 底部输入区域（仅在聊天状态显示） -->
        <div class="input-area" v-if="isChatMode">
            <!-- 新聊天按钮 -->
            <div class="new-chat-section" v-if="chatHistory.length > 0">
                <el-button class="new-chat-btn" @click="createNewChat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    新建聊天
                </el-button>
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
                        <el-dropdown trigger="click">
                            <el-button class="ai-func-btn" circle>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="3" stroke="#888" stroke-width="2" />
                                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#888" stroke-width="2" />
                                </svg>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item>智能选股</el-dropdown-item>
                                    <el-dropdown-item>行业分析</el-dropdown-item>
                                    <el-dropdown-item>投资计划</el-dropdown-item>
                                    <el-dropdown-item>风险评估</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
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
                        <img src="../assets/logo.svg" alt="Logo" class="logo-image" />
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

                    <!-- 切换模式 -->
                    <div class="auth-mode-switch">
                        <span class="switch-text">{{ isRegisterMode ? '已有账号？' : '还没有账号？' }}</span>
                        <el-button type="text" class="switch-link" @click="toggleAuthMode">
                            {{ isRegisterMode ? '立即登录' : '立即注册' }}
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
            :lock-scroll="false" width="720px" class="preferences-dialog">
            <template #header>
                <div></div>
            </template>

            <div class="preferences-container">
                <div class="preferences-header">
                    <div class="preferences-logo">
                        <img src="../assets/logo.svg" alt="Logo" class="logo-image" />
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
                    <!-- 步骤1: 风险偏好 -->
                    <div v-if="currentStep === 0" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[0].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[0].desc }}</p>

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
                                    <div class="option-title">{{ option.title }}</div>
                                    <div class="option-desc">{{ option.desc }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤2: 投资经验 -->
                    <div v-if="currentStep === 1" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[1].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[1].desc }}</p>

                        <div class="experience-options">
                            <div v-for="option in experienceOptions" :key="option.value" class="experience-option"
                                :class="{ 'selected': preferencesForm.experience === option.value }"
                                @click="preferencesForm.experience = option.value">
                                <div class="option-radio">
                                    <div class="radio-dot"
                                        :class="{ 'checked': preferencesForm.experience === option.value }">
                                    </div>
                                </div>
                                <div class="option-text">{{ option.label }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤3: 投资目标 -->
                    <div v-if="currentStep === 2" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[2].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[2].desc }}</p>

                        <div class="goals-options">
                            <div v-for="option in goalOptions" :key="option.value" class="goal-option"
                                :class="{ 'selected': preferencesForm.goals.includes(option.value) }"
                                @click="toggleGoal(option.value)">
                                <div class="option-text">{{ option.label }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- 步骤4: 关注板块 -->
                    <div v-if="currentStep === 3" class="step-content">
                        <h3 class="step-title">{{ preferenceSteps[3].title }}</h3>
                        <p class="step-desc">{{ preferenceSteps[3].desc }}</p>

                        <div class="sectors-options">
                            <div v-for="option in sectorOptions" :key="option.value" class="sector-option"
                                :class="{ 'selected': preferencesForm.sectors.includes(option.value) }"
                                @click="toggleSector(option.value)">
                                <div class="option-text">{{ option.label }}</div>
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

        <!-- 购买股票对话框 -->
        <el-dialog v-model="buyDialogVisible" title="购买股票" width="500px" class="buy-dialog">
            <div class="buy-form" v-if="selectedStock">
                <div class="stock-info-card">
                    <div class="stock-header">
                        <h3>{{ selectedStock.name }} ({{ selectedStock.code }})</h3>
                        <div class="stock-price">
                            <span class="current-price">¥{{ selectedStock.price }}</span>
                            <span :class="['price-change', selectedStock.change >= 0 ? 'positive' : 'negative']">
                                {{ selectedStock.change >= 0 ? '+' : '' }}{{ selectedStock.change }}
                                ({{ selectedStock.changePercent >= 0 ? '+' : '' }}{{ selectedStock.changePercent }}%)
                            </span>
                        </div>
                    </div>
                </div>

                <div class="account-info">
                    <div class="balance-item">
                        <span>可用余额：</span>
                        <span class="balance-amount">¥{{ userStore.balance.toFixed(2) }}</span>
                    </div>
                    <div class="position-item" v-if="currentPosition">
                        <span>当前持仓：</span>
                        <span class="position-amount">{{ currentPosition.quantity }}股 (成本价¥{{
                            currentPosition.avgPrice.toFixed(2) }})</span>
                    </div>
                </div>

                <el-form :model="buyForm" :rules="buyRules" ref="buyFormRef" label-width="80px">
                    <el-form-item label="购买数量" prop="quantity">
                        <el-input-number v-model="buyForm.quantity" :min="100" :step="100" :max="maxBuyQuantity"
                            controls-position="right" style="width: 100%" />
                        <div class="quantity-tips">
                            <span>最少100股，最多{{ maxBuyQuantity }}股</span>
                        </div>
                    </el-form-item>

                    <el-form-item label="交易金额">
                        <div class="trade-amount">
                            <span class="amount-value">¥{{ totalCost.toFixed(2) }}</span>
                            <span class="amount-desc">（含手续费）</span>
                        </div>
                    </el-form-item>
                </el-form>
            </div>

            <template #footer>
                <div class="buy-dialog-footer">
                    <el-button @click="buyDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="confirmBuy" :loading="buyLoading" :disabled="!canBuy">
                        确认购买
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 引导提示 -->
        <div v-if="showGuideTip" class="guide-tip">
            <div class="guide-content">
                <div class="guide-icon">👋</div>
                <div class="guide-text">
                    <h4>{{ guideTitle }}</h4>
                    <p>{{ guideMessage }}</p>
                </div>
                <div class="guide-actions">
                    <el-button type="primary" size="small" @click="handleGuideAction">{{ guideActionText }}</el-button>
                    <el-button size="small" @click="dismissGuide">稍后</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useUserStore } from '../store/user';
import { User, Lock, ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { mockApi } from '../api/mock';
import Sidebar from '../components/Sidebar.vue';

const userStore = useUserStore();
const inputMessage = ref('');
const chatHistory = ref([]);
const chatHistoryRef = ref(null);
const isChatMode = ref(false); // 控制是否进入聊天模式

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

// 投资偏好设置
const preferencesDialogVisible = ref(false);
const preferencesFormRef = ref(null);
const preferencesLoading = ref(false);
const currentStep = ref(0);
const preferencesForm = reactive({
    riskLevel: '',
    experience: '',
    goals: [],
    sectors: []
});

// 步骤配置
const preferenceSteps = [
    {
        title: '风险偏好',
        desc: '请选择您的风险承受能力'
    },
    {
        title: '投资经验',
        desc: '请选择您的投资经验水平'
    },
    {
        title: '投资目标',
        desc: '请选择您的投资目标（可多选）'
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
        title: '保守型',
        desc: '追求稳健收益，风险承受能力较低'
    },
    {
        value: 'stable',
        title: '稳健型',
        desc: '注重资金安全，追求稳定增值'
    },
    {
        value: 'balanced',
        title: '平衡型',
        desc: '平衡风险与收益，适度承担风险'
    },
    {
        value: 'growth',
        title: '成长型',
        desc: '追求较高收益，能承担一定风险'
    },
    {
        value: 'aggressive',
        title: '激进型',
        desc: '追求高收益，能承担较高风险'
    }
];

const experienceOptions = [
    { value: 'beginner', label: '新手（1年以下）' },
    { value: 'intermediate', label: '中级（1-3年）' },
    { value: 'advanced', label: '高级（3年以上）' }
];

const goalOptions = [
    { value: 'wealth_growth', label: '财富增值' },
    { value: 'retirement', label: '养老规划' },
    { value: 'education', label: '教育基金' },
    { value: 'house', label: '购房置业' },
    { value: 'emergency', label: '应急储备' }
];

const sectorOptions = [
    { value: 'technology', label: '科技股' },
    { value: 'healthcare', label: '医疗健康' },
    { value: 'finance', label: '金融' },
    { value: 'consumer', label: '消费' },
    { value: 'energy', label: '能源' },
    { value: 'real_estate', label: '房地产' }
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
const buyForm = reactive({
    quantity: 100
});

const buyRules = {
    quantity: [
        { required: true, message: '请输入购买数量', trigger: 'blur' },
        { type: 'number', min: 100, message: '最少购买100股', trigger: 'blur' }
    ]
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
                }
            }, 1000);
        }
    });
};

const handleCommand = (command) => {
    switch (command) {
        case 'profile':
            break;
        case 'settings':
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

const setSuggestionAndSend = (suggestion) => {
    inputMessage.value = suggestion;
    sendMessage();
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
            message = content;
    }

    // 检查用户是否已登录
    if (!userStore.isLoggedIn) {
        ElMessage.warning('请先登录后再开始对话');
        showGuide('login');
        return;
    }

    // 切换到聊天模式
    isChatMode.value = true;

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

const continueAnalysis = async (stockInfo) => {
    const message = `请进一步分析${stockInfo.name}的投资价值，包括同行业对比、未来发展前景和具体的买入时机建议。`;

    const res = await mockApi.sendMessage(message);
    chatHistory.value.push(
        { role: 'user', content: message },
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

// 投资偏好相关方法
const handlePreferencesSubmit = async () => {
    preferencesLoading.value = true;

    // 模拟保存投资偏好
    setTimeout(() => {
        const preferences = {
            riskLevel: preferencesForm.riskLevel,
            experience: preferencesForm.experience,
            goals: preferencesForm.goals,
            sectors: preferencesForm.sectors,
            completedAt: new Date().toISOString()
        };

        // 保存到用户信息中
        const currentUser = userStore.userInfo;
        userStore.setUserInfo({
            ...currentUser,
            preferences
        });

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
        case 0: // 风险偏好
            return preferencesForm.riskLevel !== '';
        case 1: // 投资经验
            return preferencesForm.experience !== '';
        case 2: // 投资目标
            return preferencesForm.goals.length > 0;
        case 3: // 关注板块
            return preferencesForm.sectors.length > 0;
        default:
            return false;
    }
});

// 选择切换方法
const toggleGoal = (value) => {
    const index = preferencesForm.goals.indexOf(value);
    if (index > -1) {
        preferencesForm.goals.splice(index, 1);
    } else {
        preferencesForm.goals.push(value);
    }
};

const toggleSector = (value) => {
    const index = preferencesForm.sectors.indexOf(value);
    if (index > -1) {
        preferencesForm.sectors.splice(index, 1);
    } else {
        preferencesForm.sectors.push(value);
    }
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
    if (!selectedStock.value) return 0;
    const price = parseFloat(selectedStock.value.price);
    const maxShares = Math.floor(userStore.balance / price / 100) * 100; // 按100股整数倍
    return Math.max(0, maxShares);
});

const totalCost = computed(() => {
    if (!selectedStock.value || !buyForm.quantity) return 0;
    const price = parseFloat(selectedStock.value.price);
    const cost = buyForm.quantity * price;
    const fee = cost * 0.0003; // 0.03% 手续费
    return cost + fee;
});

const canBuy = computed(() => {
    return buyForm.quantity >= 100 &&
        totalCost.value <= userStore.balance &&
        buyForm.quantity <= maxBuyQuantity.value;
});

// 购买相关方法
const showBuyDialog = (stockInfo) => {
    selectedStock.value = stockInfo;
    buyForm.quantity = 100;
    buyDialogVisible.value = true;
};

const confirmBuy = async () => {
    if (!buyFormRef.value) return;

    await buyFormRef.value.validate((valid) => {
        if (valid) {
            buyLoading.value = true;

            // 模拟购买延迟
            setTimeout(() => {
                const result = userStore.buyStock(
                    selectedStock.value,
                    buyForm.quantity,
                    parseFloat(selectedStock.value.price)
                );

                if (result.success) {
                    ElMessage.success(result.message);
                    buyDialogVisible.value = false;

                    // 发送购买成功的消息到聊天
                    const successMessage = `✅ 购买成功！您已成功购买${selectedStock.value.name} ${buyForm.quantity}股，花费¥${totalCost.value.toFixed(2)}。当前余额：¥${userStore.balance.toFixed(2)}`;
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
            }, 1000);
        }
    });
};

// 检查用户状态并显示相应引导
const checkUserStatus = () => {
    if (!userStore.isLoggedIn) {
        // 未登录，显示登录引导
        setTimeout(() => {
            showGuide('login');
        }, 2000);
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
}

.app-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a237e;
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
    max-width: 700px;
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
    color: #888;
    margin-bottom: 32px;
}

.chat-history-area {
    width: 100%;
    max-width: 700px;
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
    margin-bottom: 20px;
}

.chat-message.user .chat-message-content {
    background: #007bff;
    color: white;
    border-radius: 18px 18px 4px 18px;
    padding: 12px 18px;
    margin-left: auto;
    max-width: 70%;
    font-size: 1rem;
    line-height: 1.4;
}

.chat-message.assistant .chat-message-content {
    background: #f1f3f4;
    color: #18181b;
    border-radius: 18px 18px 18px 4px;
    padding: 12px 18px;
    margin-right: auto;
    max-width: 70%;
    font-size: 1rem;
    line-height: 1.4;
}

/* 聊天消息内容样式 */
.message-text {
    white-space: pre-line;
    margin-bottom: 8px;
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

.add-watchlist-btn,
.remove-watchlist-btn,
.continue-analysis-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    border-radius: 16px;
    padding: 6px 12px;
    transition: all 0.2s ease;
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
    gap: 4px;
    font-size: 0.875rem;
    border-radius: 16px;
    padding: 6px 12px;
    transition: all 0.2s ease;
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
    max-width: 700px;
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
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

.ai-card {
    width: 100%;
    max-width: 700px;
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
    color: #888;
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
    width: 40px;
    height: 40px;
    filter: brightness(0) invert(1);
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

/* 投资偏好设置对话框样式 */
:deep(.preferences-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    border: 1px solid #e5e7eb;
}

:deep(.preferences-dialog .el-dialog__header) {
    padding: 0;
    margin: 0;
}

:deep(.preferences-dialog .el-dialog__body) {
    padding: 0;
}

.preferences-container {
    padding: 40px;
    background: white;
    min-height: 500px;
    display: flex;
    flex-direction: column;
}

.preferences-header {
    text-align: center;
    margin-bottom: 40px;
}

.preferences-logo {
    width: 48px;
    height: 48px;
    background: #18181b;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
}

.preferences-logo .logo-image {
    width: 24px;
    height: 24px;
    filter: brightness(0) invert(1);
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
    max-width: 620px;
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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    max-width: 650px;
    margin: 0 auto;
}

.risk-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    gap: 20px;
    text-align: left;
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

.option-title {
    font-weight: 600;
    color: #18181b;
    margin-bottom: 4px;
    font-size: 1.1rem;
}

.option-desc {
    font-size: 0.9rem;
    color: #6b7280;
    line-height: 1.4;
}

/* 投资经验选项 */
.experience-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    max-width: 650px;
    margin: 0 auto;
}

.experience-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 80px;
    text-align: center;
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

.option-text {
    font-size: 1.05rem;
    font-weight: 500;
    color: #18181b;
    line-height: 1.3;
}

/* 投资目标和关注板块选项 */
.goals-options,
.sectors-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    max-width: 650px;
    margin: 0 auto;
}

.goal-option,
.sector-option {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
    position: relative;
    text-align: center;
}

.goal-option:hover,
.sector-option:hover {
    border-color: #d1d5db;
    background: #f9fafb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.goal-option.selected,
.sector-option.selected {
    border-color: #18181b;
    background: #f8fafc;
    box-shadow: 0 4px 16px rgba(24, 24, 27, 0.15);
}

.goal-option.selected::after,
.sector-option.selected::after {
    content: '✓';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: #18181b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
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
    max-width: 320px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.guide-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.guide-text h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.guide-text p {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 16px 0;
    line-height: 1.4;
}

.guide-actions {
    display: flex;
    gap: 8px;
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

:deep(.buy-dialog .el-dialog__header) {
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    padding: 20px 24px;
}

:deep(.buy-dialog .el-dialog__title) {
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
}

:deep(.buy-dialog .el-dialog__body) {
    padding: 24px;
}

.buy-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.stock-info-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
}

.stock-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 8px 0;
}

.stock-price {
    display: flex;
    align-items: center;
    gap: 12px;
}

.current-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: #18181b;
}

.price-change {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 6px;
}

.price-change.positive {
    color: #059669;
    background: #d1fae5;
}

.price-change.negative {
    color: #dc2626;
    background: #fee2e2;
}

.account-info {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.balance-item,
.position-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.balance-item span:first-child,
.position-item span:first-child {
    color: #6b7280;
}

.balance-amount {
    font-weight: 600;
    color: #059669;
}

.position-amount {
    font-weight: 500;
    color: #18181b;
}

.quantity-tips {
    margin-top: 4px;
    font-size: 0.75rem;
    color: #6b7280;
}

.trade-amount {
    display: flex;
    align-items: center;
    gap: 8px;
}

.amount-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f59e0b;
}

.amount-desc {
    font-size: 0.75rem;
    color: #6b7280;
}

.buy-dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

:deep(.buy-dialog .el-form-item__label) {
    font-weight: 500;
    color: #374151;
}

:deep(.buy-dialog .el-input-number) {
    width: 100%;
}

:deep(.buy-dialog .el-input-number .el-input__wrapper) {
    border-radius: 8px;
    border: 1px solid #d1d5db;
    transition: all 0.2s ease;
}

:deep(.buy-dialog .el-input-number .el-input__wrapper:hover) {
    border-color: #9ca3af;
}

:deep(.buy-dialog .el-input-number.is-focus .el-input__wrapper) {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}
</style>
