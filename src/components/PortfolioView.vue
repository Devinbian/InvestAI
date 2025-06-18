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
                        <span class="asset-value">¥{{ formatNumber(totalAssets) }}</span>
                        <div class="asset-change" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path :d="totalProfitLoss >= 0 ? 'M7 14l5-5 5 5' : 'M7 10l5 5 5-5'"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            {{ totalProfitLoss >= 0 ? '+' : '' }}¥{{ Math.abs(totalProfitLoss).toFixed(2) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-icon cash">💵</div>
                    <div class="card-content">
                        <span class="card-label">可用余额</span>
                        <span class="card-value">¥{{ formatNumber(userStore.balance) }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon stocks">📈</div>
                    <div class="card-content">
                        <span class="card-label">持仓市值</span>
                        <span class="card-value">¥{{ formatNumber(portfolioValue) }}</span>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-icon profit" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                        {{ totalProfitLoss >= 0 ? '📊' : '📉' }}
                    </div>
                    <div class="card-content">
                        <span class="card-label">今日盈亏</span>
                        <span class="card-value" :class="totalProfitLoss >= 0 ? 'positive' : 'negative'">
                            {{ totalProfitLoss >= 0 ? '+' : '' }}¥{{ Math.abs(totalProfitLoss).toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 持仓列表 -->
        <div class="portfolio-content">
            <div v-if="userStore.portfolio.length === 0" class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-text">
                    <h4>暂无持仓</h4>
                    <p>您还没有购买任何股票<br>可以通过聊天分析股票后进行购买</p>
                </div>
            </div>

            <div v-else class="portfolio-list">
                <div v-for="position in userStore.portfolio" :key="position.code" class="stock-item"
                    @click="analyzeStock(position)">
                    <div class="stock-info">
                        <div class="stock-header">
                            <div class="stock-name-code">
                                <div class="name-code-row">
                                    <span class="stock-name">{{ position.name }}</span>
                                    <span class="stock-code">({{ position.code }})</span>
                                </div>
                                <!-- 持仓盈亏状态 -->
                                <div class="position-status"
                                    :class="getPositionProfitLoss(position) >= 0 ? 'profit' : 'loss'">
                                    <span class="status-label">盈亏：</span>
                                    <span class="status-value">
                                        {{ getPositionProfitLoss(position) >= 0 ? '+' : '' }}¥{{
                                            Math.abs(getPositionProfitLoss(position)).toFixed(2) }}
                                        ({{ getPositionProfitPercent(position) >= 0 ? '+' : '' }}{{
                                            getPositionProfitPercent(position).toFixed(2) }}%)
                                    </span>
                                </div>
                            </div>
                            <div class="stock-price-change">
                                <div class="current-price">¥{{ getCurrentPrice(position.code) }}</div>
                                <div class="price-change"
                                    :class="getPositionProfitLoss(position) >= 0 ? 'positive' : 'negative'">
                                    {{ getPositionProfitLoss(position) >= 0 ? '+' : '' }}{{
                                        getPositionProfitPercent(position).toFixed(2) }}%
                                </div>
                            </div>
                        </div>

                        <div class="stock-details">
                            <div class="detail-row">
                                <span class="detail-label">持仓数量：</span>
                                <span class="detail-value">{{ position.quantity.toLocaleString() }}股</span>
                                <span class="detail-label">成本价：</span>
                                <span class="detail-value">¥{{ position.avgPrice.toFixed(2) }}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">持仓市值：</span>
                                <span class="detail-value target-price">¥{{ (position.quantity *
                                    getCurrentPrice(position.code)).toFixed(2) }}</span>
                                <span class="detail-label">所属行业：</span>
                                <span class="detail-value industry">{{ position.industry || '未分类' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="stock-actions">
                        <el-button size="small" @click.stop="showSellDialog(position)" class="sell-stock-btn">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            卖出
                        </el-button>
                        <el-button size="small" @click.stop="showBuyDialog(position)" class="buy-stock-btn-secondary">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            加仓
                        </el-button>
                        <el-button size="small" @click.stop="showPaidAnalysisDialog(position)"
                            class="paid-analysis-btn">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                            量化分析
                            <div class="price-tag-container">
                                <span class="price-tag original-price">1智点</span>
                                <span class="price-tag promo-price">0.5智点</span>
                            </div>
                        </el-button>
                        <el-button size="small" @click.stop="showQuantAnalysisDialog(position)"
                            class="quant-analysis-btn">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3v18h18M7 16l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"
                                    fill="none" />
                            </svg>
                            AI委托交易
                            <div class="price-tag-container">
                                <span class="price-tag original-price">1智点</span>
                                <span class="price-tag promo-price">0.5智点</span>
                            </div>
                        </el-button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 移除本地卖出对话框，改为使用主窗口的统一交易对话框 -->
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'show-sell-dialog']);

const userStore = useUserStore();

// 移除卖出相关的本地状态和方法，改为通过事件调用
// const sellDialogVisible = ref(false);
// const selectedPosition = ref(null);
// const sellLoading = ref(false);
// const sellFormRef = ref(null);
// const sellForm = reactive({
//     quantity: 100
// });

// const sellRules = {
//     quantity: [
//         { required: true, message: '请输入卖出数量', trigger: 'blur' },
//         { type: 'number', min: 100, message: '最少卖出100股', trigger: 'blur' }
//     ]
// };

// 模拟当前价格数据
const currentPrices = {
    '000001': 12.68,
    '000858': 52.30,
    '000002': 24.15,
    '300750': 485.20,
    '600519': 1680.50,
    '000700': 15.80
};

// 计算属性
const totalAssets = computed(() => userStore.getTotalAssets());

const portfolioValue = computed(() => {
    return userStore.portfolio.reduce((total, position) => {
        const currentPrice = getCurrentPrice(position.code);
        return total + position.quantity * currentPrice;
    }, 0);
});

const totalProfitLoss = computed(() => {
    return userStore.portfolio.reduce((total, position) => {
        return total + getPositionProfitLoss(position);
    }, 0);
});

// 移除卖出收入计算，因为不再使用本地卖出对话框
// const sellRevenue = computed(() => {
//     if (!selectedPosition.value || !sellForm.quantity) return 0;
//     const currentPrice = getCurrentPrice(selectedPosition.value.code);
//     const revenue = sellForm.quantity * currentPrice;
//     const fee = revenue * 0.0003; // 0.03% 手续费
//     return revenue - fee;
// });

// 方法
const getCurrentPrice = (stockCode) => {
    return currentPrices[stockCode] || 0;
};

const getPositionProfitLoss = (position) => {
    const currentPrice = getCurrentPrice(position.code);
    return (currentPrice - position.avgPrice) * position.quantity;
};

const getPositionProfitPercent = (position) => {
    const currentPrice = getCurrentPrice(position.code);
    return ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
};

const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('zh-CN');
};

const analyzeStock = (position) => {
    emit('send-to-chat', {
        type: 'stock',
        content: position,
        title: `分析${position.name}(${position.code})`
    });
};

const showBuyDialog = (position) => {
    emit('show-buy-dialog', position);
};

// 修改卖出方法，通过事件调用主窗口的卖出对话框
const showSellDialog = (position) => {
    // 添加当前价格信息到position对象
    const enhancedPosition = {
        ...position,
        currentPrice: getCurrentPrice(position.code), // 添加当前价格
        price: position.price || getCurrentPrice(position.code) // 确保有价格信息
    };
    emit('show-sell-dialog', enhancedPosition);
};

const showPaidAnalysisDialog = (position) => {
    // 检查余额是否足够
    if (userStore.balance < 1) {
        ElMessage.warning('余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `量化分析 ${position.name}(${position.code}) 促销价仅需 0.5智点（原价1智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 0.5智点',
            cancelButtonText: '取消',
            type: 'info',
        }
    ).then(() => {
        // 扣费（扣除0.5智点）
        if (userStore.deductBalance(0.5)) {
            ElMessage.success('支付成功，正在生成量化分析...');
            emit('send-to-chat', {
                type: 'paid-analysis',
                content: position,
                title: `量化分析${position.name}(${position.code})`
            });
        } else {
            ElMessage.error('支付失败，智点余额不足');
        }
    }).catch(() => {
        // 用户取消
    });
};

const showQuantAnalysisDialog = (position) => {
    // 检查余额是否足够
    if (userStore.balance < 1) {
        ElMessage.warning('余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `AI委托交易 ${position.name}(${position.code}) 促销价仅需 0.5智点（原价1智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 0.5智点',
            cancelButtonText: '取消',
            type: 'info',
        }
    ).then(() => {
        // 扣费（扣除0.5智点）
        if (userStore.deductBalance(0.5)) {
            ElMessage.success('支付成功，正在生成AI委托交易...');
            emit('send-to-chat', {
                type: 'quant-analysis',
                content: position,
                title: `AI委托交易${position.name}(${position.code})`
            });
        } else {
            ElMessage.error('支付失败，智点余额不足');
        }
    }).catch(() => {
        // 用户取消
    });
};

const formatNumber = (num) => {
    if (num >= 10000) {
        return (num / 10000).toFixed(2) + '万';
    }
    return num.toFixed(2);
};

const refreshData = () => {
    ElMessage.success('数据已刷新');
    // 这里可以添加实际的数据刷新逻辑
};

// 移除本地卖出对话框的确认方法
// const confirmSell = async () => {
//     if (!sellFormRef.value) return;

//     await sellFormRef.value.validate((valid) => {
//         if (valid) {
//             sellLoading.value = true;

//             setTimeout(() => {
//                 const currentPrice = getCurrentPrice(selectedPosition.value.code);
//                 const result = userStore.sellStock(
//                     selectedPosition.value.code,
//                     sellForm.quantity,
//                     currentPrice
//                 );

//                 if (result.success) {
//                     ElMessage.success(result.message);
//                     sellDialogVisible.value = false;
//                 } else {
//                     ElMessage.error(result.message);
//                 }

//                 sellLoading.value = false;
//             }, 1000);
//         }
//     });
// };
</script>

<style scoped>
.portfolio-view {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    /* 使用 min-height 而不是固定 height，让内容可以自然展开 */
    min-height: calc(100vh - 200px);
    /* 如果内容超出视口，允许滚动 */
    max-height: calc(100vh - 156px);
    display: flex;
    flex-direction: column;
    margin: 4px;
    /* 防止内容溢出导致的布局变化 */
    contain: layout style;
}

.account-summary {
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px;
    margin-top: -20px;
    /* 移除固定高度限制，让内容自然展开 */
    min-height: auto;
    /* 移除 max-height 和 overflow: hidden */
    position: relative;
}

.account-summary::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 40% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
}

.account-summary::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background:
        linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.03) 50%, transparent 70%),
        linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
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
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
    padding: 10px;
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
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
    padding: 10px;
    margin-top: -20px;
}

.total-assets-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
    border-radius: 20px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
}

.total-assets-card:hover {
    transform: translateY(-2px) translateZ(0);
    box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    will-change: transform, box-shadow;
}

.asset-icon {
    font-size: 2rem;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
    position: relative;
}

.asset-icon::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
    pointer-events: none;
}

.asset-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.asset-label {
    font-size: 0.875rem;
    opacity: 0.8;
    font-weight: 500;
}

.asset-value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
}

.asset-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 4px;
}

.asset-change.positive {
    color: #10b981;
}

.asset-change.negative {
    color: #ef4444;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    position: relative;
    z-index: 1;
    padding: 10px;
    margin-top: -20px;
    margin-bottom: -10px;
}

.summary-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%);
    border-radius: 16px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
}

.summary-card:hover {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%);
    transform: translateY(-2px) translateZ(0);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
    will-change: transform, box-shadow;
}

.summary-card:hover::before {
    left: 100%;
}

.card-icon {
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.08) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    position: relative;
}

.card-icon::before {
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

.card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.card-label {
    font-size: 0.75rem;
    opacity: 0.8;
    font-weight: 500;
}

.card-value {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1;
}

.card-value.positive {
    color: #10b981;
}

.card-value.negative {
    color: #ef4444;
}

.portfolio-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    /* 添加内边距，参照自选股的样式 */
    padding: 16px;
    /* 添加滚动条稳定性 */
    scrollbar-gutter: stable;
    /* 移除固定的 min-height，让内容自然流动 */
    /* 确保可以滚动到底部 */
    height: 0;
    /* 配合 flex: 1 使用 */
}

/* 添加滚动条样式 */
.portfolio-content::-webkit-scrollbar {
    width: 4px;
}

.portfolio-content::-webkit-scrollbar-track {
    background: #f5f5f5;
}

.portfolio-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.portfolio-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* 调整高度，确保在有内边距的容器中正确显示 */
    height: calc(100% - 32px);
    /* 减去父容器的padding */
    min-height: 300px;
    text-align: center;
    color: #6b7280;
    /* 添加一些内边距 */
    padding: 40px 20px;
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
    gap: 16px;
    /* 移除之前可能存在的额外 padding，因为父容器已经有了 */
}

.stock-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
    margin-bottom: 16px;
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
    font-size: 1.1rem;
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

/* 移除卖出对话框样式，改为使用主窗口的统一交易对话框 */
</style>
