<template>
    <div class="quant-analysis">
        <div class="quant-header">
            <h2>AI委托交易中心</h2>
            <p>基于AI的量化交易策略分析与回测</p>
        </div>

        <!-- 自定义Tab导航 -->
        <div class="custom-tabs">
            <div class="tab-nav">
                <div class="tab-item" :class="{ active: activeTab === 'strategy' }" @click="activeTab = 'strategy'">
                    📈 量化策略
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'factor' }" @click="activeTab = 'factor'">
                    📊 因子分析
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'signal' }" @click="activeTab = 'signal'">
                    📡 交易信号
                </div>
                <div class="tab-item" :class="{ active: activeTab === 'backtest' }" @click="activeTab = 'backtest'">
                    🔄 策略回测
                </div>
            </div>

            <div class="tab-content">
                <!-- 量化策略 -->
                <div v-show="activeTab === 'strategy'" class="tab-panel">
                    <div class="strategy-section">
                        <div class="strategy-grid">
                            <div class="strategy-card" v-for="strategy in strategies" :key="strategy.id"
                                @click="selectStrategy(strategy)">
                                <div class="strategy-header">
                                    <span class="strategy-icon">{{ strategy.icon }}</span>
                                    <h3>{{ strategy.name }}</h3>
                                    <el-tag
                                        :type="strategy.riskLevel === 'low' ? 'success' : strategy.riskLevel === 'medium' ? 'warning' : 'danger'"
                                        size="small">
                                        {{ strategy.riskText }}
                                    </el-tag>
                                </div>
                                <p class="strategy-desc">{{ strategy.description }}</p>
                                <div class="strategy-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">年化收益</span>
                                        <span class="stat-value positive">{{ strategy.annualReturn }}%</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">最大回撤</span>
                                        <span class="stat-value negative">{{ strategy.maxDrawdown }}%</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">夏普比率</span>
                                        <span class="stat-value">{{ strategy.sharpeRatio }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 因子分析 -->
                <div v-show="activeTab === 'factor'" class="tab-panel">
                    <div class="factor-section">
                        <div class="factor-selector">
                            <h3>选择分析因子</h3>
                            <div class="factor-example">
                                <el-tag type="success" size="small">推荐组合</el-tag>
                                <span class="example-text">建议选择：PE估值因子 + ROE盈利因子 + 动量因子，进行多因子组合分析</span>
                                <el-button size="small" type="primary"
                                    @click="selectRecommendedFactors">一键选择</el-button>
                            </div>
                            <div class="factor-grid">
                                <div v-for="factor in factors" :key="factor.id" class="factor-item-wrapper">
                                    <div class="factor-item" :class="{ selected: selectedFactors.includes(factor.id) }"
                                        @click="toggleFactor(factor.id)">
                                        <div class="factor-checkbox">
                                            <input type="checkbox" :checked="selectedFactors.includes(factor.id)"
                                                @click.stop @change="toggleFactor(factor.id)">
                                        </div>
                                        <span class="factor-icon">{{ factor.icon }}</span>
                                        <div class="factor-info">
                                            <span class="factor-name">{{ factor.name }}</span>
                                            <span class="factor-desc">{{ factor.description }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <el-button type="primary" @click="runFactorAnalysis" :loading="factorLoading"
                                :disabled="selectedFactors.length === 0">
                                开始因子分析
                            </el-button>
                        </div>

                        <div class="factor-results" v-if="factorResults.length > 0">
                            <div class="results-header">
                                <h3>因子分析结果</h3>
                                <div class="results-mode-indicator" v-if="hasAppliedWeights">
                                    <el-tag type="success" size="small">
                                        已应用{{ getWeightModeText() }}权重配置
                                    </el-tag>
                                </div>
                            </div>
                            <div class="results-grid">
                                <div class="result-card" v-for="result in getDisplayFactorResults()"
                                    :key="result.factor">
                                    <h4>{{ result.factorName }}</h4>
                                    <div class="result-stats">
                                        <div class="stat">
                                            <span class="label">IC值</span>
                                            <span class="value" :class="result.ic > 0 ? 'positive' : 'negative'">
                                                {{ result.ic.toFixed(3) }}
                                            </span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">IR比率</span>
                                            <span class="value">{{ result.ir.toFixed(3) }}</span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">当前权重</span>
                                            <span class="value weight-display">{{ result.currentWeight }}%</span>
                                        </div>
                                        <div class="stat">
                                            <span class="label">加权贡献</span>
                                            <span class="value"
                                                :class="result.weightedContribution > 0 ? 'positive' : 'negative'">
                                                {{ result.weightedContribution.toFixed(3) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="factor-chart">
                                        <div class="chart-container">
                                            <div class="chart-header">
                                                <span class="chart-title">{{ result.factorName }}表现</span>
                                                <span class="chart-period">权重: {{ result.currentWeight }}%</span>
                                            </div>
                                            <div class="chart-area">
                                                <div class="chart-line">
                                                    <div v-for="(point, index) in generateChartData(result)"
                                                        :key="index" class="chart-point" :style="{
                                                            left: (index * 100 / 29) + '%',
                                                            bottom: point + '%'
                                                        }">
                                                    </div>
                                                    <svg class="chart-svg" viewBox="0 0 100 100"
                                                        preserveAspectRatio="none">
                                                        <polyline :points="generateChartPoints(result)" fill="none"
                                                            :stroke="getFactorChartColor(result.factor)"
                                                            stroke-width="0.5" vector-effect="non-scaling-stroke">
                                                        </polyline>
                                                    </svg>
                                                </div>
                                                <div class="chart-grid">
                                                    <div v-for="i in 5" :key="i" class="grid-line"
                                                        :style="{ bottom: (i * 20) + '%' }"></div>
                                                </div>
                                            </div>
                                            <div class="chart-footer">
                                                <span class="chart-trend"
                                                    :class="result.weightedContribution > 0 ? 'positive' : 'negative'">
                                                    {{ result.weightedContribution > 0 ? '↗' : '↘' }}
                                                    {{ result.weightedContribution > 0 ? '正贡献' : '负贡献' }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 权重配置部分 - 默认隐藏，高级用户可展开 -->
                            <div class="weight-configuration" v-if="factorResults.length > 0">
                                <div class="weight-config-header">
                                    <div class="header-left">
                                        <h3>高级权重配置</h3>
                                        <span class="config-hint">自定义因子权重，适合有经验的投资者</span>
                                    </div>
                                    <el-button type="text" @click="showWeightConfig = !showWeightConfig"
                                        class="toggle-weight-btn">
                                        <el-icon>
                                            <component :is="showWeightConfig ? 'ArrowUp' : 'ArrowDown'" />
                                        </el-icon>
                                        {{ showWeightConfig ? '收起配置' : '展开配置' }}
                                    </el-button>
                                </div>

                                <transition name="weight-config-slide">
                                    <div class="weight-config-card" v-show="showWeightConfig">
                                        <div class="weight-config-mode">
                                            <el-radio-group v-model="weightMode" size="small">
                                                <el-radio-button label="auto">系统推荐</el-radio-button>
                                                <el-radio-button label="manual">手动调整</el-radio-button>
                                                <el-radio-button label="preset">预设模板</el-radio-button>
                                            </el-radio-group>
                                        </div>

                                        <!-- 系统推荐权重 -->
                                        <div v-if="weightMode === 'auto'" class="factor-weights">
                                            <div v-for="result in factorResults" :key="result.factor"
                                                class="weight-item">
                                                <span class="factor-name">{{ result.factorName }}</span>
                                                <span class="weight-value">{{ calculateFactorWeight(result)
                                                    }}%</span>
                                                <span class="weight-reason">(基于IC值: {{ result.ic.toFixed(3)
                                                    }})</span>
                                            </div>
                                        </div>

                                        <!-- 手动调整权重 -->
                                        <div v-if="weightMode === 'manual'" class="manual-weights">
                                            <div v-for="result in factorResults" :key="result.factor"
                                                class="manual-weight-item">
                                                <div class="weight-label">
                                                    <span class="factor-name">{{ result.factorName }}</span>
                                                    <span class="current-weight">{{ manualWeights[result.factor] ||
                                                        0 }}%</span>
                                                </div>
                                                <el-slider v-model="manualWeights[result.factor]" :min="0" :max="100"
                                                    :step="5" @change="updateManualWeights" class="weight-slider">
                                                </el-slider>
                                            </div>
                                            <div class="weight-total">
                                                <span>总权重: {{ getTotalWeight() }}%</span>
                                                <el-button v-if="getTotalWeight() !== 100" size="small" type="primary"
                                                    @click="normalizeWeights">
                                                    归一化至100%
                                                </el-button>
                                            </div>
                                        </div>

                                        <!-- 预设模板 -->
                                        <div v-if="weightMode === 'preset'" class="preset-weights">
                                            <div class="weight-mode-desc">
                                                <p>📋 选择专业的权重配置模板，适合不同投资风格</p>
                                            </div>
                                            <div class="preset-options">
                                                <div v-for="preset in weightPresets" :key="preset.name"
                                                    class="preset-option"
                                                    :class="{ active: selectedPreset === preset.name }"
                                                    @click="applyPreset(preset)">
                                                    <div class="preset-header">
                                                        <span class="preset-name">{{ preset.name }}</span>
                                                        <span class="preset-tag">{{ preset.tag }}</span>
                                                    </div>
                                                    <div class="preset-desc">{{ preset.description }}</div>
                                                    <div class="preset-weights-preview">
                                                        <div class="weight-list">
                                                            <div v-for="(weight, factor) in preset.weights"
                                                                :key="factor" class="weight-item-preview">
                                                                <span class="factor-name">{{ getFactorName(factor)
                                                                    }}</span>
                                                                <div class="weight-bar-container">
                                                                    <div class="weight-bar">
                                                                        <div class="weight-fill"
                                                                            :style="{ width: weight + '%' }"
                                                                            :class="getFactorColorClass(factor)">
                                                                        </div>
                                                                    </div>
                                                                    <span class="weight-percent">{{ weight }}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="preset-actions">
                                                        <el-button v-if="selectedPreset === preset.name" size="small"
                                                            type="success" disabled>
                                                            ✓ 已选择
                                                        </el-button>
                                                        <el-button v-else size="small" type="primary">
                                                            选择此模板
                                                        </el-button>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- 当前应用的权重显示 -->
                                            <div v-if="selectedPreset" class="current-preset-weights">
                                                <h5>当前应用权重：{{ selectedPreset }}</h5>
                                                <div class="applied-weights">
                                                    <div v-for="result in factorResults" :key="result.factor"
                                                        class="applied-weight-item">
                                                        <span class="factor-name">{{ result.factorName }}</span>
                                                        <span class="weight-value">{{ manualWeights[result.factor] || 0
                                                            }}%</span>
                                                        <div class="weight-progress">
                                                            <div class="progress-bar"
                                                                :style="{ width: (manualWeights[result.factor] || 0) + '%' }">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 权重配置操作按钮 -->
                                        <div class="weight-actions">
                                            <el-button type="primary" @click="applyWeightConfiguration"
                                                :loading="recommendationLoading" :disabled="!hasValidWeights()">
                                                应用权重配置并重新生成选股建议
                                            </el-button>
                                            <el-button @click="resetWeights">重置权重</el-button>
                                        </div>
                                    </div>
                                </transition>
                            </div>

                            <!-- 选股建议部分 -->
                            <div class="stock-recommendations">
                                <div class="recommendations-header">
                                    <h3>基于因子分析的选股建议</h3>
                                    <el-button type="primary" @click="generateStockRecommendations"
                                        :loading="recommendationLoading">
                                        生成选股建议
                                    </el-button>
                                </div>

                                <div class="recommendations-content" v-if="stockRecommendations.length > 0">
                                    <div class="recommendations-summary">
                                        <div class="summary-card">
                                            <h4>推荐策略</h4>
                                            <p>基于当前因子分析结果，建议采用多因子综合评分策略</p>
                                        </div>
                                        <div class="summary-card">
                                            <h4>当前权重配置</h4>
                                            <div class="current-weights-summary">
                                                <div v-for="result in factorResults" :key="result.factor"
                                                    class="weight-summary-item">
                                                    <span class="factor-name">{{ result.factorName }}</span>
                                                    <span class="weight-value">{{ getCurrentWeight(result.factor)
                                                        }}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="recommended-stocks">
                                        <h4>推荐股票 ({{ stockRecommendations.length }}只)</h4>
                                        <div class="stocks-grid">
                                            <div v-for="stock in stockRecommendations" :key="stock.code"
                                                class="stock-card">
                                                <div class="stock-header">
                                                    <div class="stock-info">
                                                        <span class="stock-name">{{ stock.name }}</span>
                                                        <span class="stock-code">{{ stock.code }}</span>
                                                    </div>
                                                    <div class="stock-score">
                                                        <span class="score-label">推荐指数</span>
                                                        <span class="score-value" :class="getScoreClass(stock.score)">
                                                            {{ stock.score }}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="stock-details">
                                                    <div class="detail-row">
                                                        <span class="label">当前价格:</span>
                                                        <span class="value">¥{{ stock.price }}</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="label">目标价格:</span>
                                                        <span class="value target-price">¥{{ stock.targetPrice }}</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="label">预期收益:</span>
                                                        <span class="value positive">+{{ stock.expectedReturn }}%</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="label">推荐理由:</span>
                                                        <span class="value reason">{{ stock.reason }}</span>
                                                    </div>
                                                </div>
                                                <div class="stock-actions">
                                                    <el-button size="small"
                                                        @click="analyzeStock(stock)">详细分析</el-button>
                                                    <el-button size="small" type="primary"
                                                        @click="addToWatchlistFromFactor(stock)">加入自选</el-button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="recommendations-footer">
                                        <div class="footer-content">
                                            <div class="risk-warning">
                                                <div class="warning-header">
                                                    <div class="warning-icon">⚠️</div>
                                                    <h4>投资风险提示</h4>
                                                </div>
                                                <div class="warning-content">
                                                    <div class="risk-item">
                                                        <span class="risk-dot"></span>
                                                        <span>因子分析基于历史数据，不保证未来表现</span>
                                                    </div>
                                                    <div class="risk-item">
                                                        <span class="risk-dot"></span>
                                                        <span>建议分散投资，单只股票仓位不超过总资金的10%</span>
                                                    </div>
                                                    <div class="risk-item">
                                                        <span class="risk-dot"></span>
                                                        <span>定期检查因子有效性，适时调整投资组合</span>
                                                    </div>
                                                    <div class="risk-item">
                                                        <span class="risk-dot"></span>
                                                        <span>结合基本面分析，避免纯技术选股</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="action-section">
                                                <div class="action-header">
                                                    <h4>操作选项</h4>
                                                    <span class="action-desc">导出报告或进一步分析</span>
                                                </div>
                                                <div class="action-buttons">
                                                    <el-button class="action-btn secondary"
                                                        @click="exportRecommendations">
                                                        <el-icon>
                                                            <Download />
                                                        </el-icon>
                                                        导出选股报告
                                                    </el-button>
                                                    <el-button class="action-btn primary" type="primary"
                                                        @click="sendFactorAnalysisToChat">
                                                        <el-icon>
                                                            <ChatDotRound />
                                                        </el-icon>
                                                        发送到聊天分析
                                                    </el-button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 交易信号 -->
        <div v-show="activeTab === 'signal'" class="tab-panel">
            <div class="signal-section">
                <div class="signal-config">
                    <h3>信号配置</h3>
                    <el-form :model="signalConfig" label-width="100px">
                        <el-form-item label="股票池">
                            <el-select v-model="signalConfig.stockPool" placeholder="选择股票池">
                                <el-option label="沪深300" value="hs300"></el-option>
                                <el-option label="中证500" value="zz500"></el-option>
                                <el-option label="创业板" value="cyb"></el-option>
                                <el-option label="自选股" value="watchlist"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="信号类型">
                            <el-checkbox-group v-model="signalConfig.signalTypes">
                                <el-checkbox label="ma_cross">均线交叉</el-checkbox>
                                <el-checkbox label="macd">MACD金叉</el-checkbox>
                                <el-checkbox label="rsi">RSI超买超卖</el-checkbox>
                                <el-checkbox label="bollinger">布林带突破</el-checkbox>
                                <el-checkbox label="volume">放量突破</el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                        <el-form-item label="时间周期">
                            <el-radio-group v-model="signalConfig.timeframe">
                                <el-radio label="1d">日线</el-radio>
                                <el-radio label="1w">周线</el-radio>
                                <el-radio label="1h">小时线</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-form>
                    <el-button type="primary" @click="generateSignals" :loading="signalLoading">
                        生成交易信号
                    </el-button>
                </div>

                <div class="signal-results" v-if="signals.length > 0">
                    <h3>交易信号 ({{ signals.length }})</h3>
                    <div class="signal-list">
                        <div v-for="signal in signals" :key="signal.code" class="signal-item">
                            <div class="signal-header">
                                <span class="signal-name">{{ signal.name }} ({{ signal.code }})</span>
                                <el-tag :type="signal.signal === 'buy' ? 'success' : 'danger'">
                                    {{ signal.signal === 'buy' ? '买入' : '卖出' }}
                                </el-tag>
                            </div>
                            <div class="signal-details">
                                <span>策略: {{ signal.strategy }}</span>
                                <span>价格: ¥{{ signal.price }}</span>
                                <span>置信度: {{ signal.confidence }}%</span>
                                <span>时间: {{ signal.time }}</span>
                            </div>
                            <el-button size="small" @click="analyzeSignal(signal)">详细分析</el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 回测系统 -->
        <div v-show="activeTab === 'backtest'" class="tab-panel">
            <div class="backtest-section">
                <div class="backtest-config">
                    <h3>回测配置</h3>
                    <el-form :model="backtestConfig" label-width="120px">
                        <el-form-item label="回测策略">
                            <el-select v-model="backtestConfig.strategy" placeholder="选择策略">
                                <el-option v-for="strategy in strategies" :key="strategy.id" :label="strategy.name"
                                    :value="strategy.id"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="回测期间">
                            <el-date-picker v-model="backtestConfig.dateRange" type="daterange" range-separator="至"
                                start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD">
                            </el-date-picker>
                        </el-form-item>
                        <el-form-item label="初始资金">
                            <el-input-number v-model="backtestConfig.initialCapital" :min="10000" :max="10000000"
                                :step="10000" controls-position="right">
                            </el-input-number>
                        </el-form-item>
                        <el-form-item label="手续费率">
                            <el-input-number v-model="backtestConfig.commission" :min="0" :max="0.01" :step="0.0001"
                                :precision="4" controls-position="right">
                            </el-input-number>
                        </el-form-item>
                    </el-form>
                    <el-button type="primary" @click="runBacktest" :loading="backtestLoading">
                        开始回测
                    </el-button>
                </div>

                <div class="backtest-results" v-if="backtestResults">
                    <h3>回测结果</h3>
                    <div class="results-overview">
                        <div class="result-card">
                            <h4>总收益率</h4>
                            <div class="big-number positive">{{ backtestResults.totalReturn }}%</div>
                        </div>
                        <div class="result-card">
                            <h4>年化收益率</h4>
                            <div class="big-number positive">{{ backtestResults.annualReturn }}%</div>
                        </div>
                        <div class="result-card">
                            <h4>最大回撤</h4>
                            <div class="big-number negative">{{ backtestResults.maxDrawdown }}%</div>
                        </div>
                        <div class="result-card">
                            <h4>夏普比率</h4>
                            <div class="big-number">{{ backtestResults.sharpeRatio }}</div>
                        </div>
                        <div class="result-card">
                            <h4>胜率</h4>
                            <div class="big-number">{{ backtestResults.winRate }}%</div>
                        </div>
                        <div class="result-card">
                            <h4>交易次数</h4>
                            <div class="big-number">{{ backtestResults.tradeCount }}</div>
                        </div>
                    </div>
                    <div class="backtest-chart">
                        <div class="chart-container">
                            <div class="chart-header">
                                <span class="chart-title">策略收益曲线</span>
                                <span class="chart-period">回测期间</span>
                            </div>
                            <div class="chart-area">
                                <div class="chart-line">
                                    <svg class="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <polyline :points="generateBacktestChartPoints()" fill="none" stroke="#10b981"
                                            stroke-width="0.5" vector-effect="non-scaling-stroke">
                                        </polyline>
                                        <!-- 基准线 -->
                                        <line x1="0" y1="70" x2="100" y2="75" stroke="#6b7280" stroke-width="0.3"
                                            stroke-dasharray="2,2" vector-effect="non-scaling-stroke">
                                        </line>
                                    </svg>
                                </div>
                                <div class="chart-grid">
                                    <div v-for="i in 5" :key="i" class="grid-line" :style="{ bottom: (i * 20) + '%' }">
                                    </div>
                                </div>
                            </div>
                            <div class="chart-footer">
                                <span class="chart-legend">
                                    <span class="legend-item">
                                        <span class="legend-color strategy"></span>
                                        策略收益
                                    </span>
                                    <span class="legend-item">
                                        <span class="legend-color benchmark"></span>
                                        基准收益
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowUp, ArrowDown, Download, ChatDotRound } from '@element-plus/icons-vue';
import { useUserStore } from '../store/user';

const activeTab = ref('strategy');
const factorLoading = ref(false);
const signalLoading = ref(false);
const backtestLoading = ref(false);

// 量化策略数据
const strategies = ref([
    {
        id: 'mean_reversion',
        name: '均值回归策略',
        icon: '📈',
        description: '基于价格偏离均值后的回归特性进行交易',
        riskLevel: 'medium',
        riskText: '中风险',
        annualReturn: 15.6,
        maxDrawdown: -8.2,
        sharpeRatio: 1.34
    },
    {
        id: 'momentum',
        name: '动量策略',
        icon: '🚀',
        description: '追踪强势股票的持续上涨趋势',
        riskLevel: 'high',
        riskText: '高风险',
        annualReturn: 22.3,
        maxDrawdown: -15.7,
        sharpeRatio: 1.12
    },
    {
        id: 'pairs_trading',
        name: '配对交易',
        icon: '⚖️',
        description: '利用相关股票间的价差进行套利',
        riskLevel: 'low',
        riskText: '低风险',
        annualReturn: 8.9,
        maxDrawdown: -4.1,
        sharpeRatio: 1.67
    },
    {
        id: 'multi_factor',
        name: '多因子模型',
        icon: '🧮',
        description: '综合多个因子进行股票评分和选择',
        riskLevel: 'medium',
        riskText: '中风险',
        annualReturn: 18.2,
        maxDrawdown: -9.8,
        sharpeRatio: 1.45
    }
]);

// 因子数据
const factors = ref([
    { id: 'pe', name: 'PE估值因子', icon: '💰', description: '市盈率相关估值指标' },
    { id: 'pb', name: 'PB估值因子', icon: '📊', description: '市净率相关估值指标' },
    { id: 'roe', name: 'ROE盈利因子', icon: '💎', description: '净资产收益率指标' },
    { id: 'momentum', name: '动量因子', icon: '🚀', description: '价格动量和趋势指标' },
    { id: 'reversal', name: '反转因子', icon: '🔄', description: '短期价格反转指标' },
    { id: 'volume', name: '成交量因子', icon: '📈', description: '成交量相关指标' },
    { id: 'volatility', name: '波动率因子', icon: '📊', description: '价格波动率指标' },
    { id: 'growth', name: '成长因子', icon: '🌱', description: '业绩成长性指标' }
]);

const selectedFactors = ref([]);
const factorResults = ref([]);

// 选股建议相关
const recommendationLoading = ref(false);
const stockRecommendations = ref([]);

// 权重配置相关
const weightMode = ref('auto'); // 'auto', 'manual', 'preset'
const manualWeights = ref({});
const selectedPreset = ref('');
const showWeightConfig = ref(false); // 默认隐藏权重配置

// 预设权重模板
const weightPresets = ref([
    {
        name: '价值投资',
        tag: '稳健型',
        description: '注重估值和盈利能力，适合长期投资',
        weights: {
            pe: 35,
            pb: 25,
            roe: 30,
            growth: 10
        }
    },
    {
        name: '成长投资',
        tag: '进取型',
        description: '重视成长性和动量，适合追求高收益',
        weights: {
            growth: 40,
            momentum: 30,
            roe: 20,
            pe: 10
        }
    },
    {
        name: '均衡配置',
        tag: '平衡型',
        description: '各因子均衡配置，适合大多数投资者',
        weights: {
            pe: 25,
            roe: 25,
            momentum: 25,
            growth: 25
        }
    },
    {
        name: '量化精选',
        tag: '专业型',
        description: '基于量化模型优化的权重配置',
        weights: {
            roe: 30,
            momentum: 25,
            pe: 20,
            volume: 15,
            volatility: 10
        }
    }
]);

// 交易信号配置
const signalConfig = reactive({
    stockPool: 'hs300',
    signalTypes: ['ma_cross'],
    timeframe: '1d'
});

// 添加一些示例信号数据
const signals = ref([
    { code: '000001', name: '平安银行', signal: 'buy', strategy: '均线交叉', price: '12.45', confidence: 78, time: '2024-01-15 09:30' },
    { code: '600036', name: '招商银行', signal: 'buy', strategy: 'RSI', price: '35.67', confidence: 82, time: '2024-01-15 11:00' },
    { code: '000858', name: '五粮液', signal: 'buy', strategy: '布林带', price: '158.90', confidence: 71, time: '2024-01-15 13:45' }
]);

// 回测配置
const backtestConfig = reactive({
    strategy: 'mean_reversion',
    dateRange: ['2023-01-01', '2024-01-01'],
    initialCapital: 100000,
    commission: 0.0003
});

// 添加示例回测结果
const backtestResults = ref({
    totalReturn: 45.6,
    annualReturn: 18.2,
    maxDrawdown: -12.3,
    sharpeRatio: 1.34,
    winRate: 62.5,
    tradeCount: 156
});

// 方法
const selectStrategy = (strategy) => {
    ElMessage.success(`已选择策略：${strategy.name}`);
    // 这里可以发送到聊天进行详细分析
    emit('send-to-chat', {
        type: 'strategy',
        content: strategy,
        title: `${strategy.name}策略分析`
    });
};

const selectRecommendedFactors = () => {
    selectedFactors.value = ['pe', 'roe', 'momentum'];
    ElMessage.success('已选择推荐因子组合');
};

const toggleFactor = (factorId) => {
    const index = selectedFactors.value.indexOf(factorId);
    if (index > -1) {
        selectedFactors.value.splice(index, 1);
    } else {
        selectedFactors.value.push(factorId);
    }
};

// 生成图表数据点
const generateChartData = (result) => {
    const points = [];
    const baseValue = 50; // 基准值
    const volatility = Math.abs(result.ic) * 30; // 根据IC值调整波动性

    for (let i = 0; i < 30; i++) {
        const trend = result.ic > 0 ? (i * 0.5) : -(i * 0.5); // 趋势方向
        const noise = (Math.random() - 0.5) * volatility * 0.3; // 随机噪声
        const value = Math.max(5, Math.min(95, baseValue + trend + noise));
        points.push(value);
    }
    return points;
};

// 生成SVG路径点
const generateChartPoints = (result) => {
    const data = generateChartData(result);
    return data.map((point, index) => `${(index * 100 / 29)},${100 - point}`).join(' ');
};

// 生成回测收益曲线数据
const generateBacktestChartPoints = () => {
    if (!backtestResults.value) return '';

    const points = [];
    const totalReturn = backtestResults.value.totalReturn;
    const maxDrawdown = backtestResults.value.maxDrawdown;

    // 生成100个数据点模拟回测期间的收益曲线
    for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        // 模拟收益曲线：总体上升趋势，但有波动和回撤
        let value = 50; // 起始点

        // 添加总体趋势
        value += progress * (totalReturn * 0.8); // 80%的最终收益作为趋势

        // 添加波动
        const volatility = Math.sin(progress * Math.PI * 8) * 3;
        value += volatility;

        // 模拟最大回撤（在中间某个位置）
        if (progress > 0.3 && progress < 0.6) {
            const drawdownFactor = Math.sin((progress - 0.3) / 0.3 * Math.PI);
            value += maxDrawdown * drawdownFactor * 0.5;
        }

        // 确保值在合理范围内
        value = Math.max(10, Math.min(90, value));
        points.push(`${i},${100 - value}`);
    }

    return points.join(' ');
};

const runFactorAnalysis = async () => {
    factorLoading.value = true;

    // 模拟因子分析
    setTimeout(() => {
        factorResults.value = selectedFactors.value.map(factorId => {
            const factor = factors.value.find(f => f.id === factorId);
            return {
                factor: factorId,
                factorName: factor.name,
                ic: (Math.random() - 0.5) * 0.2, // -0.1 到 0.1
                ir: Math.random() * 2,
                winRate: Math.floor(Math.random() * 30) + 45 // 45-75%
            };
        });
        factorLoading.value = false;
        ElMessage.success('因子分析完成');
    }, 2000);
};

const generateSignals = async () => {
    signalLoading.value = true;

    // 模拟生成交易信号
    setTimeout(() => {
        const mockSignals = [
            { code: '000001', name: '平安银行', signal: 'buy', strategy: '均线交叉', price: '12.45', confidence: 78, time: '2024-01-15 09:30' },
            { code: '000002', name: '万科A', signal: 'sell', strategy: 'MACD', price: '8.92', confidence: 65, time: '2024-01-15 10:15' },
            { code: '600036', name: '招商银行', signal: 'buy', strategy: 'RSI', price: '35.67', confidence: 82, time: '2024-01-15 11:00' },
            { code: '600519', name: '贵州茅台', signal: 'buy', strategy: '布林带', price: '1678.90', confidence: 71, time: '2024-01-15 13:45' }
        ];

        signals.value = mockSignals;
        signalLoading.value = false;
        ElMessage.success(`生成了 ${mockSignals.length} 个交易信号`);
    }, 1500);
};

const analyzeSignal = (signal) => {
    ElMessage.success(`正在分析 ${signal.name} 的交易信号`);
    // 发送到聊天进行详细分析
    emit('send-to-chat', {
        type: 'signal',
        content: signal,
        title: `${signal.name}交易信号分析`
    });
};

// 选股建议相关方法
const generateStockRecommendations = async () => {
    recommendationLoading.value = true;

    // 模拟生成选股建议
    setTimeout(() => {
        const mockStocks = [
            {
                code: '000001',
                name: '平安银行',
                price: '12.45',
                targetPrice: '14.20',
                expectedReturn: '14.1',
                score: '85',
                reason: 'PE因子和ROE因子评分较高，估值合理'
            },
            {
                code: '600036',
                name: '招商银行',
                price: '35.67',
                targetPrice: '40.50',
                expectedReturn: '13.5',
                score: '82',
                reason: '盈利能力强，动量因子表现优异'
            },
            {
                code: '000858',
                name: '五粮液',
                price: '158.90',
                targetPrice: '180.00',
                expectedReturn: '13.3',
                score: '79',
                reason: '成长因子和质量因子评分良好'
            },
            {
                code: '600519',
                name: '贵州茅台',
                price: '1678.90',
                targetPrice: '1850.00',
                expectedReturn: '10.2',
                score: '88',
                reason: '多因子综合评分最高，长期投资价值显著'
            },
            {
                code: '300750',
                name: '宁德时代',
                price: '185.50',
                targetPrice: '210.00',
                expectedReturn: '13.2',
                score: '76',
                reason: '成长性突出，但估值偏高需谨慎'
            }
        ];

        stockRecommendations.value = mockStocks;
        recommendationLoading.value = false;
        ElMessage.success(`基于因子分析生成了 ${mockStocks.length} 只推荐股票`);
    }, 2000);
};

const calculateFactorWeight = (result) => {
    // 根据IC值和IR值计算权重
    const icWeight = Math.abs(result.ic) * 50;
    const irWeight = result.ir * 25;
    const winRateWeight = result.winRate * 0.25;
    const totalWeight = icWeight + irWeight + winRateWeight;
    return Math.min(100, Math.max(5, totalWeight)).toFixed(0);
};

// 新增：权重配置相关状态
const hasAppliedWeights = ref(false);

// 获取显示用的因子分析结果（包含权重信息）
const getDisplayFactorResults = () => {
    return factorResults.value.map(result => {
        const currentWeight = getCurrentWeightForDisplay(result.factor);
        const weightedContribution = result.ic * (currentWeight / 100);

        return {
            ...result,
            currentWeight: currentWeight,
            weightedContribution: weightedContribution
        };
    });
};

// 获取显示用的当前权重
const getCurrentWeightForDisplay = (factorId) => {
    if (weightMode.value === 'manual' || selectedPreset.value) {
        return manualWeights.value[factorId] || 0;
    } else {
        // 自动权重模式
        const result = factorResults.value.find(r => r.factor === factorId);
        return result ? parseInt(calculateFactorWeight(result)) : 0;
    }
};

// 获取因子图表颜色
const getFactorChartColor = (factorId) => {
    const colors = {
        pe: '#3b82f6',
        pb: '#06b6d4',
        roe: '#10b981',
        momentum: '#8b5cf6',
        reversal: '#f59e0b',
        volume: '#ef4444',
        volatility: '#eab308',
        growth: '#ec4899'
    };
    return colors[factorId] || '#6b7280';
};

const getScoreClass = (score) => {
    const numScore = parseInt(score);
    if (numScore >= 85) return 'excellent';
    if (numScore >= 75) return 'good';
    if (numScore >= 65) return 'average';
    return 'poor';
};

const analyzeStock = (stock) => {
    ElMessage.success(`正在分析 ${stock.name} 的详细信息`);
    // 发送到聊天进行详细分析
    emit('send-to-chat', {
        type: 'stock',
        content: {
            code: stock.code,
            name: stock.name,
            price: stock.price,
            targetPrice: stock.targetPrice,
            expectedReturn: stock.expectedReturn,
            score: stock.score,
            reason: stock.reason
        },
        title: `${stock.name}因子分析详情`
    });
};

const addToWatchlistFromFactor = (stock) => {
    // 构造符合自选股格式的股票对象
    const stockInfo = {
        code: stock.code,
        name: stock.name,
        price: stock.price,
        change: 0, // 默认值，实际应该从API获取
        changePercent: 0, // 默认值，实际应该从API获取
        industry: '因子分析推荐', // 标记来源
        targetPrice: stock.targetPrice,
        expectedReturn: stock.expectedReturn,
        score: stock.score,
        reason: stock.reason
    };

    // 调用用户store的方法
    const userStore = useUserStore();
    if (userStore.addToWatchlist(stockInfo)) {
        ElMessage.success(`${stock.name} 已加入自选股`);
    } else {
        ElMessage.warning(`${stock.name} 已在自选股中`);
    }
};

const exportRecommendations = () => {
    ElMessage.info('选股报告导出功能开发中...');
};

const sendFactorAnalysisToChat = () => {
    const factorSummary = factorResults.value.map(result =>
        `${result.factorName}: IC=${result.ic.toFixed(3)}, 胜率=${result.winRate}%`
    ).join('\n');

    const stockSummary = stockRecommendations.value.map(stock =>
        `${stock.name}(${stock.code}): 评分${stock.score}, 预期收益${stock.expectedReturn}%`
    ).join('\n');

    emit('send-to-chat', {
        type: 'factor',
        content: `因子分析结果:\n${factorSummary}\n\n推荐股票:\n${stockSummary}`,
        title: '多因子选股分析报告'
    });

    ElMessage.success('因子分析结果已发送到聊天');
};

// 权重配置相关方法
const updateManualWeights = () => {
    // 手动权重更新时的处理逻辑
    console.log('权重已更新:', manualWeights.value);
};

const getTotalWeight = () => {
    return Object.values(manualWeights.value).reduce((sum, weight) => sum + (weight || 0), 0);
};

const normalizeWeights = () => {
    const total = getTotalWeight();
    if (total > 0) {
        Object.keys(manualWeights.value).forEach(factor => {
            manualWeights.value[factor] = Math.round((manualWeights.value[factor] || 0) * 100 / total);
        });
        ElMessage.success('权重已归一化至100%');
    }
};

const applyPreset = (preset) => {
    selectedPreset.value = preset.name;
    // 将预设权重应用到当前选择的因子
    manualWeights.value = {};
    factorResults.value.forEach(result => {
        manualWeights.value[result.factor] = preset.weights[result.factor] || 0;
    });
    ElMessage.success(`已应用${preset.name}权重模板`);
};

const getFactorName = (factorId) => {
    const factor = factors.value.find(f => f.id === factorId);
    return factor ? factor.name : factorId;
};

const getFactorColorClass = (factorId) => {
    const colorMap = {
        pe: 'factor-color-blue',
        pb: 'factor-color-cyan',
        roe: 'factor-color-green',
        momentum: 'factor-color-purple',
        reversal: 'factor-color-orange',
        volume: 'factor-color-red',
        volatility: 'factor-color-yellow',
        growth: 'factor-color-pink'
    };
    return colorMap[factorId] || 'factor-color-default';
};

const getCurrentWeight = (factorId) => {
    return manualWeights.value[factorId] || 0;
};

const runBacktest = async () => {
    if (!backtestConfig.strategy) {
        ElMessage.warning('请选择回测策略');
        return;
    }

    if (!backtestConfig.dateRange || backtestConfig.dateRange.length !== 2) {
        ElMessage.warning('请选择回测时间范围');
        return;
    }

    backtestLoading.value = true;

    // 模拟回测
    setTimeout(() => {
        // 生成随机但合理的回测结果
        const randomReturn = Math.random() * 50 + 10; // 10-60%
        const randomDrawdown = -(Math.random() * 20 + 5); // -5% to -25%
        const randomSharpe = Math.random() * 1.5 + 0.5; // 0.5-2.0

        backtestResults.value = {
            totalReturn: randomReturn.toFixed(1),
            annualReturn: (randomReturn / 2).toFixed(1), // 假设2年期
            maxDrawdown: randomDrawdown.toFixed(1),
            sharpeRatio: randomSharpe.toFixed(2),
            winRate: (Math.random() * 30 + 50).toFixed(1), // 50-80%
            tradeCount: Math.floor(Math.random() * 200 + 50) // 50-250次
        };
        backtestLoading.value = false;
        ElMessage.success('回测完成！策略表现良好');
    }, 3000);
};

// 事件发射
const emit = defineEmits(['send-to-chat']);

onMounted(() => {
    // 初始化图表等
});

// 权重配置相关方法
const hasValidWeights = () => {
    if (weightMode.value === 'auto') return true;
    if (weightMode.value === 'manual') {
        const total = getTotalWeight();
        return total === 100;
    }
    if (weightMode.value === 'preset') {
        return selectedPreset.value !== '';
    }
    return false;
};

const applyWeightConfiguration = async () => {
    if (!hasValidWeights()) {
        ElMessage.warning('请先配置有效的权重（总权重需为100%）');
        return;
    }

    // 应用权重配置并重新生成选股建议
    recommendationLoading.value = true;

    try {
        // 标记已应用权重配置
        hasAppliedWeights.value = true;

        // 清空之前的选股建议
        stockRecommendations.value = [];

        // 根据新的权重配置重新生成选股建议
        await generateStockRecommendations();

        ElMessage.success(`权重配置已应用！使用${getWeightModeText()}模式重新生成选股建议`);
    } catch (error) {
        ElMessage.error('应用权重配置失败，请重试');
    } finally {
        recommendationLoading.value = false;
    }
};

const resetWeights = () => {
    // 重置所有权重配置
    manualWeights.value = {};
    selectedPreset.value = '';
    weightMode.value = 'auto';
    hasAppliedWeights.value = false;
    showWeightConfig.value = false; // 重置后隐藏权重配置

    // 清空选股建议，需要重新生成
    stockRecommendations.value = [];

    ElMessage.success('权重配置已重置为系统推荐模式');
};

const getWeightModeText = () => {
    const modeMap = {
        'auto': '系统推荐',
        'manual': '手动调整',
        'preset': '预设模板'
    };
    return modeMap[weightMode.value] || '系统推荐';
};
</script>

<style scoped>
.quant-analysis {
    padding: 0;
    background: transparent;
    min-height: auto;
    overflow: visible;
    display: flex;
    flex-direction: column;
}

.quant-header {
    text-align: center;
    margin-bottom: 12px;
    flex-shrink: 0;
    padding: 8px 8px 0 8px;
    background: #f8fafc;
}

.quant-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 2px;
}

.quant-header p {
    color: #6b7280;
    font-size: 0.8rem;
    margin: 0;
}

.custom-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: visible;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    margin: 0 8px;
}

.tab-nav {
    display: flex;
    flex-shrink: 0;
    background: #f8fafc;
    border-radius: 8px 8px 0 0;
    padding: 4px 8px;
    border-bottom: 1px solid #e5e7eb;
    gap: 2px;
}

.tab-item {
    padding: 4px 8px;
    font-weight: 500;
    font-size: 0.75rem;
    color: #6b7280;
    border-radius: 4px;
    transition: all 0.2s ease;
    cursor: pointer;
    white-space: nowrap;
}

.tab-item:hover {
    color: #374151;
    background: rgba(99, 102, 241, 0.1);
}

.tab-item.active {
    color: #6366f1;
    background: white;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    border: 1px solid #e0e7ff;
}

.tab-content {
    flex: 1;
    padding: 8px;
    overflow: visible;
    min-height: auto;
    max-height: none;
    position: relative;
}

.tab-panel {
    min-height: auto;
    overflow: visible;
    width: 100%;
    padding-bottom: 20px;
}

/* 信号列表样式 */
.signal-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
}

.signal-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
}

.signal-item:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.signal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.signal-name {
    font-weight: 600;
    color: #1f2937;
}

.signal-details {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    font-size: 0.875rem;
    color: #6b7280;
}

.chart-placeholder {
    height: 150px;
    background: #f9fafb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    font-size: 0.875rem;
}

/* 策略部分 */
.strategy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-top: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
}

.strategy-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.strategy-card:hover {
    border-color: #6366f1;
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
}

.strategy-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.strategy-icon {
    font-size: 1.5rem;
}

.strategy-header h3 {
    flex: 1;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.strategy-desc {
    color: #6b7280;
    margin-bottom: 16px;
    line-height: 1.5;
}

.strategy-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.stat-item {
    text-align: center;
    padding: 8px;
    background: #f9fafb;
    border-radius: 8px;
}

.stat-label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.stat-value {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
}

.stat-value.positive {
    color: #059669;
}

.stat-value.negative {
    color: #dc2626;
}

/* 因子分析部分 */
.factor-section {
    padding: 12px 0;
    min-height: auto;
    overflow: visible;
}

.factor-selector h3 {
    margin-bottom: 12px;
    color: #1f2937;
    font-size: 1.1rem;
}

.factor-example {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    font-size: 0.85rem;
}

.example-text {
    font-size: 0.875rem;
    color: #0369a1;
    line-height: 1.4;
}

.factor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.factor-item-wrapper {
    width: 100%;
    position: relative;
}

.factor-item {
    width: 100%;
    margin: 0;
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 12px 12px 40px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    min-height: 60px;
    box-sizing: border-box;
}

.factor-item:hover {
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.factor-checkbox {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    z-index: 2;
}

.factor-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    appearance: none;
    transition: all 0.2s ease;
}

.factor-checkbox input[type="checkbox"]:checked {
    background: #6366f1;
    border-color: #6366f1;
    position: relative;
}

.factor-checkbox input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 12px;
    font-weight: bold;
}

.factor-item.selected {
    border-color: #6366f1;
    background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.factor-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
}

.factor-info {
    flex: 1;
    min-width: 0;
}

.factor-name {
    display: block;
    font-weight: 600;
    color: #1f2937;
    font-size: 0.9rem;
    margin-bottom: 2px;
}

.factor-desc {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
}

.factor-results {
    margin-top: 30px;
}

.results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.result-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-card h4 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
}

.result-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.stat {
    text-align: center;
}

.stat .label {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.stat .value {
    display: block;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
}

.stat .value.positive {
    color: #059669;
}

.stat .value.negative {
    color: #dc2626;
}

.factor-chart {
    height: 150px;
    background: #f9fafb;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e5e7eb;
}

.chart-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.chart-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
}

.chart-period {
    font-size: 0.7rem;
    color: #9ca3af;
}

.chart-area {
    flex: 1;
    position: relative;
    background: white;
    border-radius: 4px;
    overflow: hidden;
}

.chart-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.chart-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.chart-point {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #6366f1;
    border-radius: 50%;
    transform: translate(-50%, 50%);
    opacity: 0.7;
}

.chart-footer {
    margin-top: 6px;
    text-align: center;
}

.chart-trend {
    font-size: 0.75rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.chart-trend.positive {
    color: #059669;
}

.chart-trend.negative {
    color: #dc2626;
}

/* 交易信号部分 */
.signal-section {
    padding: 12px 0;
    min-height: auto;
    overflow: visible;
}

.signal-config {
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.signal-config h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
}

.signal-results h3 {
    margin-bottom: 16px;
    color: #1f2937;
    font-size: 1.1rem;
}

/* 回测部分 */
.backtest-section {
    padding: 12px 0;
    min-height: auto;
    overflow: visible;
}

.backtest-config {
    background: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.backtest-config h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
}

.backtest-results h3 {
    margin-bottom: 16px;
    color: #1f2937;
    font-size: 1.1rem;
}

.results-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
}

.results-overview .result-card {
    text-align: center;
    padding: 16px;
}

.results-overview .result-card h4 {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 8px 0;
    font-weight: 500;
}

.big-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
}

.big-number.positive {
    color: #059669;
}

.big-number.negative {
    color: #dc2626;
}

.backtest-chart {
    height: 300px;
    background: #f9fafb;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.chart-container {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.chart-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
}

.chart-period {
    font-size: 0.7rem;
    color: #9ca3af;
}

.chart-area {
    flex: 1;
    position: relative;
    background: white;
    border-radius: 4px;
    overflow: hidden;
}

.chart-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.chart-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.chart-point {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #6366f1;
    border-radius: 50%;
    transform: translate(-50%, 50%);
    opacity: 0.7;
}

.chart-footer {
    margin-top: 6px;
    text-align: center;
}

.chart-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: #6b7280;
}

.legend-color {
    width: 12px;
    height: 2px;
    border-radius: 1px;
}

.legend-color.strategy {
    background: #10b981;
}

.legend-color.benchmark {
    background: #6b7280;
}

/* 选股建议样式 */
.stock-recommendations {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
}

.recommendations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.recommendations-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.2rem;
    font-weight: 600;
}

.recommendations-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.recommendations-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.summary-card {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.summary-card h4 {
    margin: 0 0 8px 0;
    color: #374151;
    font-size: 1rem;
    font-weight: 600;
}

.summary-card p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.4;
}

.weight-config-mode {
    margin-bottom: 16px;
}

.factor-weights {
    margin-bottom: 16px;
}

.weight-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.factor-name {
    color: #374151;
}

.weight-value {
    font-weight: 600;
    color: #6366f1;
}

.weight-reason {
    color: #6b7280;
    font-size: 0.75rem;
}

.manual-weights {
    margin-bottom: 16px;
}

.manual-weight-item {
    display: flex;
    align-items: center;
    gap: 16px;
}

.weight-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.current-weight {
    font-weight: 600;
    color: #374151;
}

.weight-slider {
    width: 100%;
}

.weight-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
}

.preset-weights {
    margin-top: 16px;
}

.preset-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.preset-option {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.preset-option:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.preset-option.active {
    border-color: #6366f1;
    background: #f0f9ff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.preset-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.preset-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 1rem;
}

.preset-tag {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f0f9ff;
    padding: 4px 8px;
    border-radius: 4px;
}

.preset-desc {
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 12px;
    line-height: 1.4;
}

.weight-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.weight-item-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.weight-bar-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    margin-left: 12px;
}

.weight-bar {
    width: 60px;
    height: 8px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;
}

.weight-fill {
    height: 100%;
    border-radius: 4px;
}

.weight-percent {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 600;
    min-width: 30px;
}

.preset-actions {
    display: flex;
    justify-content: center;
    margin-top: 12px;
}

.weight-actions {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .preset-options {
        grid-template-columns: 1fr;
    }

    .weight-actions {
        flex-direction: column;
        align-items: center;
    }
}

.current-preset-weights {
    margin-top: 16px;
}

.applied-weights {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.applied-weight-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.weight-progress {
    width: 100px;
    height: 10px;
    background: #f0f9ff;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: #6366f1;
}

.recommended-stocks h4 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
}

.stocks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
}

.stock-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
}

.stock-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.stock-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stock-name {
    font-weight: 600;
    color: #1f2937;
    font-size: 1rem;
}

.stock-code {
    font-size: 0.875rem;
    color: #6b7280;
}

.stock-score {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.score-label {
    font-size: 0.75rem;
    color: #9ca3af;
}

.score-value {
    font-size: 1.25rem;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 6px;
}

.score-value.excellent {
    color: #059669;
    background: #d1fae5;
}

.score-value.good {
    color: #0891b2;
    background: #cffafe;
}

.score-value.average {
    color: #d97706;
    background: #fef3c7;
}

.score-value.poor {
    color: #dc2626;
    background: #fee2e2;
}

.stock-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.detail-row .label {
    color: #6b7280;
}

.detail-row .value {
    font-weight: 500;
    color: #374151;
}

.detail-row .value.target-price {
    color: #0891b2;
    font-weight: 600;
}

.detail-row .value.positive {
    color: #059669;
    font-weight: 600;
}

.detail-row .value.reason {
    max-width: 200px;
    text-align: right;
    line-height: 1.3;
}

.stock-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.recommendations-footer {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
}

.footer-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 32px;
    align-items: start;
}

.risk-warning {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.warning-icon {
    font-size: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3));
}

.warning-header h4 {
    margin: 0;
    color: #92400e;
    font-size: 1.1rem;
    font-weight: 600;
}

.warning-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.risk-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #92400e;
}

.risk-dot {
    width: 6px;
    height: 6px;
    background: #f59e0b;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
}

.action-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.action-header {
    margin-bottom: 16px;
    text-align: center;
    width: 100%;
}

.action-header h4 {
    margin: 0 0 4px 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
}

.action-desc {
    font-size: 0.875rem;
    color: #6b7280;
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
}

.action-btn {
    display: flex !important;
    align-items: center !important;
    gap: 8px;
    justify-content: center !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    width: 100% !important;
    height: 36px !important;
    box-sizing: border-box !important;
    text-align: center !important;
    font-size: 0.875rem !important;
    margin: 0 !important;
}

.action-btn+.action-btn {
    margin-left: 0 !important;
    margin-top: 0 !important;
}

.action-btn.secondary {
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    color: #475569 !important;
    line-height: 1.5 !important;
}

.action-btn.secondary:hover {
    background: #e2e8f0 !important;
    border-color: #cbd5e1 !important;
    color: #334155 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.action-btn.primary {
    background: #3b82f6 !important;
    border: 1px solid #3b82f6 !important;
    color: white !important;
    line-height: 1.5 !important;
}

.action-btn.primary:hover {
    background: #2563eb !important;
    border-color: #2563eb !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

/* Element Plus 按钮样式覆盖 */
:deep(.action-btn.el-button) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 100% !important;
    height: 36px !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
    font-weight: 500 !important;
    box-sizing: border-box !important;
    text-align: center !important;
    line-height: 1.4 !important;
    font-size: 0.875rem !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
}

:deep(.action-btn.el-button + .el-button) {
    margin-left: 0 !important;
}

:deep(.action-buttons .el-button + .el-button) {
    margin-left: 0 !important;
}

:deep(.action-buttons .action-btn) {
    margin: 0 !important;
}

:deep(.action-btn.el-button span) {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    width: 100% !important;
    justify-content: center !important;
}

/* 响应式设计 */
@media (max-width: 768px) {

    .strategy-grid,
    .factor-grid,
    .results-grid {
        grid-template-columns: 1fr;
    }

    .results-overview {
        grid-template-columns: repeat(2, 1fr);
    }

    .strategy-stats {
        grid-template-columns: 1fr;
    }

    .recommendations-summary {
        grid-template-columns: 1fr;
    }

    .stocks-grid {
        grid-template-columns: 1fr;
    }

    .footer-content {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .detail-row .value.reason {
        max-width: 150px;
    }

    .action-buttons {
        flex-direction: column;
        gap: 8px;
        max-width: 180px;
    }

    .action-btn {
        font-size: 0.875rem !important;
        padding: 8px 14px !important;
        height: 36px !important;
    }

    .risk-warning,
    .action-section {
        padding: 16px;
    }

    .warning-header {
        gap: 8px;
    }

    .warning-icon {
        font-size: 1.25rem;
    }
}

/* 因子颜色样式 */
.factor-color-blue {
    background: #3b82f6;
}

.factor-color-cyan {
    background: #06b6d4;
}

.factor-color-green {
    background: #10b981;
}

.factor-color-purple {
    background: #8b5cf6;
}

.factor-color-orange {
    background: #f59e0b;
}

.factor-color-red {
    background: #ef4444;
}

.factor-color-yellow {
    background: #eab308;
}

.factor-color-pink {
    background: #ec4899;
}

.factor-color-default {
    background: #6b7280;
}

/* 因子分析结果头部样式 */
.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.results-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.2rem;
    font-weight: 600;
}

.results-mode-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* 权重显示样式 */
.weight-display {
    color: #6366f1 !important;
    font-weight: 600;
}

/* 权重配置样式 */
.weight-configuration {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
}

.weight-config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.weight-config-header h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
}

.config-hint {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 400;
}

.toggle-weight-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #6366f1;
    font-size: 0.875rem;
    padding: 4px 8px;
    transition: all 0.2s ease;
}

.toggle-weight-btn:hover {
    color: #4f46e5;
    background: rgba(99, 102, 241, 0.1);
}

/* 权重配置展开/收起动画 */
.weight-config-slide-enter-active,
.weight-config-slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
}

.weight-config-slide-enter-from,
.weight-config-slide-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
}

.weight-config-slide-enter-to,
.weight-config-slide-leave-from {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
}

.weight-config-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e5e7eb;
}

.weight-mode-desc {
    margin-bottom: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
}

.weight-mode-desc p {
    margin: 0;
    color: #1e40af;
    font-size: 0.875rem;
    line-height: 1.4;
}

.current-weights-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.weight-summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}
</style>
