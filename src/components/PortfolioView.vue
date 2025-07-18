<template>
    <div class="portfolio-view">
        <!-- 账户总览 -->
        <div class="account-summary">
            <div class="summary-header">
                <h3>我的资产</h3>
                <div class="refresh-btn" @click="refreshData">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" />
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                            stroke="currentColor" stroke-width="2" />
                    </svg>
                </div>
            </div>

            <div class="summary-main">
                <div class="total-assets-card">
                    <div class="asset-icon">💰</div>
                    <div class="asset-info">
                        <span class="asset-label">总资产</span>
                        <span class="asset-value">¥{{ userAssetInfo.totalAsset }}</span>
                        <div class="asset-change" :class="userAssetInfo.totalProfitLoss >= 0 ? 'positive' : 'negative'">
                            <!-- <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path :d="userAssetInfo.totalProfitLoss >= 0 ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'"
                                    stroke="currentColor" stroke-width="2" />
                            </svg> -->
                            {{ userAssetInfo.totalProfitLoss >= 0 ? '+' : '-' }}¥{{ Math.abs(userAssetInfo.totalProfitLoss).toFixed(2) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-icon cash">💵</div>
                    <div class="card-content">
                        <span class="card-label">可用余额</span>
                        <span class="card-value">¥{{ userAssetInfo.availableBalance }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon stocks">📈</div>
                    <div class="card-content">
                        <span class="card-label">持仓市值</span>
                        <span class="card-value">¥{{ userAssetInfo.positionMarketValue }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon profit" :class="userAssetInfo.todayProfitLoss >= 0 ? 'positive' : 'negative'">
                        {{ userAssetInfo.todayProfitLoss >= 0 ? '📊' : '📉' }}
                    </div>
                    <div class="card-content">
                        <span class="card-label">今日盈亏</span>
                        <span class="card-value" :class="userAssetInfo.todayProfitLoss >= 0 ? 'positive' : 'negative'">
                            {{ userAssetInfo.todayProfitLoss >= 0 ? '+' : '-' }}¥{{ Math.abs(userAssetInfo.todayProfitLoss).toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 持仓列表 - 使用通用StockList组件 -->
        <div class="portfolio-content">
            <!-- PC端使用StockList（空状态由条件判断处理） -->
            <template v-if="!isMobileView">
                <div v-if="portfolioStocks.length === 0" class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">
                        <h4>暂无持仓</h4>
                        <p>您还没有购买任何股票<br>可以通过聊天分析股票后进行购买</p>
                    </div>
                </div>
                <StockList v-else :stocks="portfolioStocks" :actions="portfolioActions" :show-position-status="true"
                    :show-position-details="true" :show-basic-details="false" :clickable="false"
                    :is-mobile="isMobileView" @action-click="handleActionClick" />
            </template>

            <!-- 移动端使用MobileStockList（空状态由MobileStockList组件内部处理） -->
            <MobileStockList v-else :stocks="portfolioStocks" :actions="portfolioActions" :show-position-status="true"
                :show-details="true" :clickable="false" :empty-text="'暂无持仓'"
                :empty-description="'您还没有购买任何股票，可以通过聊天分析股票后进行购买'" @action-click="handleActionClick" />
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';
import { getStockActionConfig } from '../config/stockActionConfig';
import { useMobileDetection } from '../composables/useResponsiveBreakpoints';
import { getUserPositionOverview } from '@/api/api';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'show-sell-dialog', 'action-click']);

// 使用统一的移动端检测
const { isMobileView } = useMobileDetection();

// 用户资金及盈亏
const userAssetInfo = reactive({
    totalAsset: '',
    availableBalance: '',
    positionMarketValue: '',
    totalProfitLoss: '',
    todayProfitLoss: '',
    positionList: [],
});

// 持仓列表
const portfolioStocks = ref([]);

// 持仓操作按钮配置
const portfolioActions = computed(() => {
    return getStockActionConfig('portfolio', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 4
    });
});

// 用户持仓概览
const getUserPositionOverviewRequest = async () => {
    let res = await getUserPositionOverview();
    if (res && res.data && res.data.success) {
        const data = res.data.data;
        userAssetInfo.totalAsset = data.totalAsset;
        userAssetInfo.availableBalance = data.availableBalance;
        userAssetInfo.positionMarketValue = data.positionMarketValue;
        userAssetInfo.totalProfitLoss = data.totalProfitLoss;
        userAssetInfo.todayProfitLoss = data.todayProfitLoss;
        const positionList = formatPortfolioStocks(data.positionList);
        portfolioStocks.value = positionList;
        return true;
    }else{
        return false;
    }
}

// 格式化持仓列表
const formatPortfolioStocks = (stocks) => {
    stocks = stocks || [];
    return stocks.map(position => {  
        return {
            code: position.stockCode,
            name: position.stockName,
            price: position.currentPrice,
            change: position.change,
            changePercent: position.changeRatio,
            industry: position.industry || '未知',
            // 持仓特有信息
            quantity: position.totalVolume,
            avgPrice: position.avgCostPrice,
            marketValue: position.marketValue,
            profitLoss: position.profitLoss,
            profitPercent: position.profitLossRatio
        };
    });
}

// 刷新数据
const refreshData = async () => {
  const res = await getUserPositionOverviewRequest();
  if(res === true){
     ElMessage.success('数据已刷新');
  }
};

// 移动端操作处理 - 统一转发到Main.vue处理
const handleActionClick = ({ action, stock }) => {
    console.log('PortfolioView - 转发股票操作:', action, stock);

    // 直接转发到Main.vue的统一处理逻辑
    emit('action-click', { action, stock });
};

// 生命周期
onMounted(() => {
    // 移动端检测由useMobileDetection自动处理
    getUserPositionOverviewRequest();
});

onUnmounted(() => {
    // 清理工作由useMobileDetection自动处理
});
</script>

<style scoped>
.portfolio-view {
    /* PC端移除外部容器样式，直接使用tab容器的滚动 */
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: visible;
    /* 移除固定高度限制，让内容自然流动 */
    min-height: auto;
    max-height: none;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    /* 移除容器限制 */
    contain: none;
}

.account-summary {
    flex-shrink: 0;
    /* PC端使用透明背景，不显示大卡片 */
    background: transparent;
    color: inherit;
    padding: 0;
    margin: 0 0 8px 0;
    border-radius: 0;
    /* 移除固定高度限制，让内容自然展开 */
    min-height: auto;
    /* 移除 max-height 和 overflow: hidden */
    position: relative;
    box-sizing: border-box;
}

/* PC端移除装饰性背景效果 */
.account-summary::before,
.account-summary::after {
    display: none;
}

@keyframes shimmer {

    0%,
    100% {
        transform: translateX(-100%) translateY(-100%) rotate(0deg);
    }

    50% {
        transform: translateX(0%) translateY(0%) rotate(180deg);
    }
}

.summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
    padding: 0 12px;
}

.summary-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
    opacity: 0.95;
}

.refresh-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    position: relative;
}

.refresh-btn::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
    pointer-events: none;
}

.refresh-btn:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.15) 100%);
    transform: rotate(180deg) scale(1.05);
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.summary-main {
    position: relative;
    z-index: 1;
    /* 使用与portfolio-content相同的左右内边距，确保宽度一致 */
    padding: 0 12px;
}

.total-assets-card {
    /* PC端采用移动端紫色渐变样式 */
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border-radius: 16px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

/* 添加光泽效果 */
.total-assets-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
}

.total-assets-card:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    will-change: transform, box-shadow;
}

.asset-icon {
    /* PC端采用移动端样式 */
    font-size: 1.2rem;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
}

/* PC端简化装饰效果 */
.asset-icon::before {
    display: none;
}

.asset-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: relative;
    z-index: 1;
}

.asset-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.85);
    font-weight: 500;
    margin: 0;
    opacity: 0.9;
}

.asset-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: white;
    margin: 0;
    line-height: 1.1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.asset-change {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    width: fit-content;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    margin-top: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

.asset-change svg {
    width: 10px;
    height: 10px;
}

.asset-change.positive {
    color: #dc2626;
}

.asset-change.negative {
    color: #059669;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    position: relative;
    z-index: 1;
    padding: 0 12px;
    margin: 6px 0 0 0;
}

.summary-card {
    /* PC端采用移动端白色卡片样式 */
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-align: center;
    transition: all 0.3s ease;
    min-height: 64px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
}

.summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, transparent 100%);
    pointer-events: none;
}

.summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-color: #c7d2fe;
    will-change: transform, box-shadow;
}

.summary-card:hover::before {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%);
}

.card-icon {
    /* PC端采用移动端样式 */
    font-size: 1.1rem;
    margin-bottom: 2px;
    color: #6366f1;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(99, 102, 241, 0.08);
    border-radius: 6px;
    position: relative;
    z-index: 1;
}

/* PC端移除卡片图标装饰效果 */
.card-icon::before {
    display: none;
}

.card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    width: 100%;
    position: relative;
    z-index: 1;
}

.card-label {
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 500;
    text-align: center;
    margin: 0;
    line-height: 1.1;
    opacity: 0.9;
}

.card-value {
    font-size: 0.85rem;
    color: #1e293b;
    font-weight: 700;
    text-align: center;
    margin: 0;
    line-height: 1.1;
}

.card-value.positive {
    color: #dc2626;
}

.card-value.negative {
    color: #059669;
}

.portfolio-content {
    /* PC端移除内部滚动，使用外部tab容器的滚动 */
    flex: none;
    overflow: visible;
    /* 添加左右内边距，给股票列表合适的间隔 */
    padding: 0 12px;
    /* 让内容自然流动，确保能被外部容器滚动 */
    height: auto;
    min-height: auto;
    max-height: none;
    /* 确保内容可以正常流动 */
    width: 100%;
    box-sizing: border-box;
    /* 添加顶部间隔，与资产卡片分开 */
    margin-top: 8px;
    /* 确保内容能够超出容器，触发父级滚动 */
    contain: none;
}

/* PC端移除内部滚动条样式，使用外部tab容器的滚动条 */

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* PC端调整空状态样式 */
    height: auto;
    min-height: 300px;
    text-align: center;
    color: #6b7280;
    /* 添加一些内边距 */
    padding: 40px 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    margin: 0;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.empty-text h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
}

.portfolio-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    /* 移除之前可能存在的额外 padding，因为父容器已经有了 */
}

.stock-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.stock-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateZ(0);
    will-change: transform, box-shadow;
}

.stock-info {
    flex: 1;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.stock-name-code {
    flex: 1;
}

.name-code-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
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

.position-status {
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
    font-size: 0.875rem;
    font-weight: 600;
}

.position-status.profit .status-value {
    color: #dc2626;
}

.position-status.loss .status-value {
    color: #16a34a;
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
    color: #dc2626;
    background: #d1fae5;
}

.price-change.negative {
    color: #059669;
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

.industry {
    color: #8b5cf6;
}

.stock-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;
    flex-wrap: nowrap;
    align-items: center;
}

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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
}

.buy-stock-btn-secondary {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 0.7rem;
    border-radius: 10px;
    padding: 3px 6px;
    transition: all 0.2s ease;
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #f59e0b;
    white-space: nowrap;
    flex-shrink: 0;
}

.buy-stock-btn-secondary:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #d97706;
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    transform: translateY(-1px) translateZ(0);
    will-change: transform;
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
    animation: shine 3s ease-in-out infinite;
    will-change: transform;
    transform: translateZ(0);
}

@keyframes shine {
    0% {
        transform: translateX(-100%) translateZ(0);
    }

    50%,
    100% {
        transform: translateX(100%) translateZ(0);
    }
}

/* 兼容旧版price-tag */
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

/* 移动端响应式样式 */
@media (max-width: 768px) {

    /* 移动端容器保持原有样式 */
    .portfolio-view {
        background: #fff !important;
        border-radius: 8px !important;
        border: 1px solid #f0f0f0 !important;
        min-height: auto !important;
        max-height: none !important;
        margin: 0 !important;
        overflow: visible !important;
    }

    /* 移动端账户总览优化 - 重新设计 */
    .account-summary {
        margin: 0 !important;
        padding: 0 !important;
        border-radius: 0 !important;
        position: static !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    .account-summary::before,
    .account-summary::after {
        display: none !important;
    }

    /* 隐藏头部标题 */
    .summary-header {
        display: none !important;
    }

    .summary-main {
        margin: 0 !important;
        padding: 0 !important;
    }

    /* 总资产卡片 - 紫色渐变设计，与截图风格一致 */
    .total-assets-card {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
        color: white !important;
        padding: 14px 16px !important;
        border-radius: 16px !important;
        margin: 6px !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3) !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        position: relative !important;
        overflow: hidden !important;
    }

    /* 添加光泽效果 */
    .total-assets-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%) !important;
        pointer-events: none !important;
    }

    .asset-icon {
        width: 36px !important;
        height: 36px !important;
        font-size: 1.2rem !important;
        background: rgba(255, 255, 255, 0.2) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
        color: white !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    .asset-info {
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .asset-label {
        font-size: 0.75rem !important;
        color: rgba(255, 255, 255, 0.85) !important;
        font-weight: 500 !important;
        margin: 0 !important;
        opacity: 0.9 !important;
    }

    .asset-value {
        font-size: 1.4rem !important;
        font-weight: 700 !important;
        color: white !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }

    .asset-change {
        font-size: 0.7rem !important;
        padding: 2px 8px !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 3px !important;
        width: fit-content !important;
        background: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        margin-top: 4px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px) !important;
    }

    .asset-change svg {
        width: 10px !important;
        height: 10px !important;
    }

    /* 三个子卡片 - 精致白色卡片设计 */
    .summary-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 8px !important;
        padding: 0 6px 8px 6px !important;
        margin: 0 !important;
    }

    .summary-card {
        background: white !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        padding: 10px 6px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 3px !important;
        text-align: center !important;
        transition: all 0.3s ease !important;
        min-height: 64px !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06) !important;
        position: relative !important;
        overflow: hidden !important;
    }

    .summary-card::before {
        content: '' !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, transparent 100%) !important;
        pointer-events: none !important;
    }

    .summary-card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
        border-color: #c7d2fe !important;
    }

    .summary-card:hover::before {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%) !important;
    }

    .card-icon {
        font-size: 1.1rem !important;
        margin-bottom: 2px !important;
        color: #6366f1 !important;
        flex-shrink: 0 !important;
        width: 24px !important;
        height: 24px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(99, 102, 241, 0.08) !important;
        border-radius: 6px !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .card-content {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1px !important;
        width: 100% !important;
        position: relative !important;
        z-index: 1 !important;
    }

    .card-label {
        font-size: 0.65rem !important;
        color: #64748b !important;
        font-weight: 500 !important;
        text-align: center !important;
        margin: 0 !important;
        line-height: 1.1 !important;
        opacity: 0.9 !important;
    }

    .card-value {
        font-size: 0.85rem !important;
        color: #1e293b !important;
        font-weight: 700 !important;
        text-align: center !important;
        margin: 0 !important;
        line-height: 1.1 !important;
    }

    .card-value.positive {
        color: #dc2626 !important;
    }

    .card-value.negative {
        color: #059669 !important;
    }

    /* 移动端持仓内容优化 */
    .portfolio-content {
        padding: 8px !important;
        overflow: visible !important;
        height: auto !important;
        flex: none !important;
    }

    .portfolio-list {
        gap: 8px !important;
    }

    .stock-item {
        padding: 12px !important;
        border-radius: 8px !important;
        gap: 8px !important;
    }

    .stock-header {
        margin-bottom: 8px !important;
    }

    .stock-name {
        font-size: 0.9rem !important;
    }

    .stock-code {
        font-size: 0.8rem !important;
    }

    .current-price {
        font-size: 1rem !important;
    }

    .price-change {
        font-size: 0.8rem !important;
    }

    .stock-details {
        gap: 6px !important;
    }

    .detail-item {
        gap: 6px !important;
    }

    .detail-label {
        font-size: 0.7rem !important;
        min-width: 50px !important;
    }

    .detail-value {
        font-size: 0.8rem !important;
    }

    .stock-actions {
        gap: 6px !important;
        padding-top: 8px !important;
        flex-wrap: wrap !important;
    }

    .stock-actions .el-button {
        font-size: 0.7rem !important;
        padding: 4px 8px !important;
        border-radius: 6px !important;
    }

    /* 移动端空状态优化 */
    .empty-state {
        padding: 30px 16px !important;
        min-height: 200px !important;
        height: auto !important;
    }

    .empty-icon {
        font-size: 2.5rem !important;
        margin-bottom: 12px !important;
    }

    .empty-text h4 {
        font-size: 1rem !important;
        margin-bottom: 6px !important;
    }

    .empty-text p {
        font-size: 0.8rem !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .portfolio-view {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
    }

    /* 侧边栏中的账户总览样式 - 更加紧凑 */
    .sidebar-container .account-summary {
        margin: 0 !important;
        padding: 0 !important;
    }

    .sidebar-container .total-assets-card {
        margin: 6px !important;
        padding: 12px 14px !important;
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2) !important;
        border-radius: 14px !important;
    }

    .sidebar-container .asset-icon {
        width: 32px !important;
        height: 32px !important;
        font-size: 1.1rem !important;
    }

    .sidebar-container .asset-value {
        font-size: 1.2rem !important;
    }

    .sidebar-container .asset-change {
        font-size: 0.65rem !important;
        padding: 1px 6px !important;
    }

    .sidebar-container .summary-grid {
        padding: 0 6px 6px 6px !important;
        gap: 6px !important;
    }

    .sidebar-container .summary-card {
        min-height: 58px !important;
        padding: 8px 4px !important;
        border-radius: 10px !important;
    }

    .sidebar-container .card-icon {
        width: 20px !important;
        height: 20px !important;
        font-size: 0.9rem !important;
        border-radius: 5px !important;
    }

    .sidebar-container .card-label {
        font-size: 0.6rem !important;
    }

    .sidebar-container .card-value {
        font-size: 0.75rem !important;
    }

    .sidebar-container .portfolio-content {
        padding: 0 6px 12px 6px !important;
    }

    .sidebar-container .stock-item {
        margin: 0 0 6px 0 !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }
}
</style>
