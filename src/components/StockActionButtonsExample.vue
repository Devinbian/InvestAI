<template>
    <div class="stock-action-example">
        <h3>股票操作按钮组件使用示例</h3>

        <!-- 示例股票信息 -->
        <div class="example-stock">
            <div class="stock-info">
                <span class="stock-name">贵州茅台</span>
                <span class="stock-code">(600519)</span>
                <span class="stock-price">¥1680.50</span>
            </div>
        </div>

        <!-- 不同场景的按钮组合 -->
        <div class="scenarios">
            <!-- 推荐股票场景 -->
            <div class="scenario-section">
                <h4>📈 推荐股票场景</h4>
                <StockActionButtons :stock="exampleStock" :actions="recommendationActions" :is-mobile="false"
                    mode="full" @action-click="handleActionClick" @add-watchlist="handleAddWatchlist"
                    @remove-watchlist="handleRemoveWatchlist" @paid-analysis="handlePaidAnalysis"
                    @ai-trading="handleAITrading" @buy-stock="handleBuyStock" />
            </div>

            <!-- 自选股场景 -->
            <div class="scenario-section">
                <h4>⭐ 自选股场景</h4>
                <StockActionButtons :stock="exampleStock" :actions="watchlistActions" :is-mobile="false" mode="compact"
                    @action-click="handleActionClick" />
            </div>

            <!-- 持仓股票场景 -->
            <div class="scenario-section">
                <h4>💼 持仓股票场景</h4>
                <StockActionButtons :stock="exampleStock" :actions="portfolioActions" :is-mobile="false" mode="full"
                    @action-click="handleActionClick" />
            </div>

            <!-- 移动端场景 -->
            <div class="scenario-section">
                <h4>📱 移动端场景</h4>
                <StockActionButtons :stock="exampleStock" :actions="mobileActions" :is-mobile="true" mode="compact"
                    :max-buttons="3" container-class="mobile" @action-click="handleActionClick" />
            </div>

            <!-- 最小模式 -->
            <div class="scenario-section">
                <h4>🎯 最小模式</h4>
                <StockActionButtons :stock="exampleStock" :actions="minimalActions" :is-mobile="false" mode="minimal"
                    @action-click="handleActionClick" />
            </div>
        </div>

        <!-- 操作日志 -->
        <div class="action-log">
            <h4>操作日志</h4>
            <div class="log-content">
                <div v-for="(log, index) in actionLogs" :key="index" class="log-item">
                    <span class="log-time">{{ log.time }}</span>
                    <span class="log-action">{{ log.action }}</span>
                    <span class="log-stock">{{ log.stock }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import StockActionButtons from './StockActionButtons.vue';
import { getStockActionConfig } from '../config/stockActionConfig';

// 示例股票数据
const exampleStock = ref({
    code: '600519',
    name: '贵州茅台',
    price: 1680.50,
    change: 12.30,
    changePercent: 0.74
});

// 操作日志
const actionLogs = ref([]);

// 不同场景的按钮配置
const recommendationActions = getStockActionConfig('recommendation');
const watchlistActions = getStockActionConfig('watchlist');
const portfolioActions = getStockActionConfig('portfolio');
const mobileActions = getStockActionConfig('mobile', { isMobile: true, maxButtons: 3 });
const minimalActions = getStockActionConfig('chatCompact');

// 事件处理
const handleActionClick = (event) => {
    console.log('操作点击:', event);

    addActionLog(event.action, event.stock.name);
};

const handleAddWatchlist = (stock) => {
    console.log('加入自选:', stock);
    addActionLog('加入自选', stock.name);
};

const handleRemoveWatchlist = (stock) => {
    console.log('移除自选:', stock);
    addActionLog('移除自选', stock.name);
};

const handlePaidAnalysis = (stock) => {
    console.log('付费分析:', stock);
    addActionLog('付费分析', stock.name);
};

const handleAITrading = (stock) => {
    console.log('AI委托交易:', stock);
    addActionLog('AI委托交易', stock.name);
};

const handleBuyStock = (stock) => {
    console.log('购买股票:', stock);
    addActionLog('购买股票', stock.name);
};

// 添加操作日志
const addActionLog = (action, stockName) => {
    const now = new Date();
    const time = now.toLocaleTimeString();

    actionLogs.value.unshift({
        time,
        action,
        stock: stockName
    });

    // 保持最多10条日志
    if (actionLogs.value.length > 10) {
        actionLogs.value = actionLogs.value.slice(0, 10);
    }
};
</script>

<style scoped>
.stock-action-example {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.example-stock {
    background: #f8faff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
}

.stock-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.stock-name {
    font-weight: 600;
    color: #1f2937;
}

.stock-code {
    color: #6b7280;
}

.stock-price {
    color: #16a34a;
    font-weight: 600;
    margin-left: auto;
}

.scenarios {
    margin-bottom: 32px;
}

.scenario-section {
    margin-bottom: 24px;
    padding: 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.scenario-section h4 {
    margin: 0 0 12px 0;
    color: #374151;
    font-size: 14px;
}

.action-log {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
}

.action-log h4 {
    margin: 0 0 12px 0;
    color: #374151;
}

.log-content {
    max-height: 200px;
    overflow-y: auto;
}

.log-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 12px;
}

.log-item:last-child {
    border-bottom: none;
}

.log-time {
    color: #6b7280;
    min-width: 80px;
}

.log-action {
    color: #2563eb;
    font-weight: 500;
    min-width: 80px;
}

.log-stock {
    color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .stock-action-example {
        padding: 12px;
    }

    .stock-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .stock-price {
        margin-left: 0;
    }
}
</style>
