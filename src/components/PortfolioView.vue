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
                <div v-for="position in userStore.portfolio" :key="position.code" class="position-item"
                    @click="analyzeStock(position)">
                    <div class="position-header">
                        <div class="stock-info">
                            <h4 class="stock-name">{{ position.name }}</h4>
                            <span class="stock-code">{{ position.code }}</span>
                        </div>
                        <div class="position-actions">
                            <el-button size="small" type="danger" @click.stop="showSellDialog(position)"
                                class="sell-btn">
                                卖出
                            </el-button>
                        </div>
                    </div>

                    <div class="position-details">
                        <div class="detail-row">
                            <span class="detail-label">持仓数量</span>
                            <span class="detail-value">{{ position.quantity }}股</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">成本价</span>
                            <span class="detail-value">¥{{ position.avgPrice.toFixed(2) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">当前价</span>
                            <span class="detail-value current-price">¥{{ getCurrentPrice(position.code) }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">盈亏</span>
                            <span
                                :class="['detail-value', 'profit-loss', getPositionProfitLoss(position) >= 0 ? 'positive' : 'negative']">
                                {{ getPositionProfitLoss(position) >= 0 ? '+' : '' }}¥{{
                                    Math.abs(getPositionProfitLoss(position)).toFixed(2) }}
                                ({{ getPositionProfitPercent(position) >= 0 ? '+' : '' }}{{
                                    getPositionProfitPercent(position).toFixed(2) }}%)
                            </span>
                        </div>
                    </div>

                    <div class="position-footer">
                        <span class="buy-time">买入时间：{{ formatTime(position.buyTime) }}</span>
                        <div class="industry-tag">{{ position.industry || '未分类' }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 卖出对话框 -->
        <el-dialog v-model="sellDialogVisible" title="卖出股票" width="450px" class="sell-dialog">
            <div class="sell-form" v-if="selectedPosition">
                <div class="stock-info-card">
                    <h3>{{ selectedPosition.name }} ({{ selectedPosition.code }})</h3>
                    <div class="position-summary">
                        <div class="summary-row">
                            <span>持仓数量：</span>
                            <span>{{ selectedPosition.quantity }}股</span>
                        </div>
                        <div class="summary-row">
                            <span>成本价：</span>
                            <span>¥{{ selectedPosition.avgPrice.toFixed(2) }}</span>
                        </div>
                        <div class="summary-row">
                            <span>当前价：</span>
                            <span>¥{{ getCurrentPrice(selectedPosition.code) }}</span>
                        </div>
                    </div>
                </div>

                <el-form :model="sellForm" :rules="sellRules" ref="sellFormRef" label-width="80px">
                    <el-form-item label="卖出数量" prop="quantity">
                        <el-input-number v-model="sellForm.quantity" :min="100" :step="100"
                            :max="selectedPosition.quantity" controls-position="right" style="width: 100%" />
                        <div class="quantity-tips">
                            <span>最少100股，最多{{ selectedPosition.quantity }}股</span>
                        </div>
                    </el-form-item>

                    <el-form-item label="预计收入">
                        <div class="trade-amount">
                            <span class="amount-value">¥{{ sellRevenue.toFixed(2) }}</span>
                            <span class="amount-desc">（扣除手续费）</span>
                        </div>
                    </el-form-item>
                </el-form>
            </div>

            <template #footer>
                <div class="sell-dialog-footer">
                    <el-button @click="sellDialogVisible = false">取消</el-button>
                    <el-button type="danger" @click="confirmSell" :loading="sellLoading">
                        确认卖出
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const userStore = useUserStore();

// 卖出相关
const sellDialogVisible = ref(false);
const selectedPosition = ref(null);
const sellLoading = ref(false);
const sellFormRef = ref(null);
const sellForm = reactive({
    quantity: 100
});

const sellRules = {
    quantity: [
        { required: true, message: '请输入卖出数量', trigger: 'blur' },
        { type: 'number', min: 100, message: '最少卖出100股', trigger: 'blur' }
    ]
};

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

const sellRevenue = computed(() => {
    if (!selectedPosition.value || !sellForm.quantity) return 0;
    const currentPrice = getCurrentPrice(selectedPosition.value.code);
    const revenue = sellForm.quantity * currentPrice;
    const fee = revenue * 0.0003; // 0.03% 手续费
    return revenue - fee;
});

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

const showSellDialog = (position) => {
    selectedPosition.value = position;
    sellForm.quantity = Math.min(100, position.quantity);
    sellDialogVisible.value = true;
};

const confirmSell = async () => {
    if (!sellFormRef.value) return;

    await sellFormRef.value.validate((valid) => {
        if (valid) {
            sellLoading.value = true;

            setTimeout(() => {
                const currentPrice = getCurrentPrice(selectedPosition.value.code);
                const result = userStore.sellStock(
                    selectedPosition.value.code,
                    sellForm.quantity,
                    currentPrice
                );

                if (result.success) {
                    ElMessage.success(result.message);
                    sellDialogVisible.value = false;
                } else {
                    ElMessage.error(result.message);
                }

                sellLoading.value = false;
            }, 1000);
        }
    });
};
</script>

<style scoped>
.portfolio-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.account-summary {
    background: linear-gradient(135deg, #1f2937 0%, #374151 25%, #4b5563 50%, #6b7280 75%, #9ca3af 100%);
    color: white;
    padding: 24px;
    margin: -20px -20px 0 -20px;
    border-radius: 0 0 20px 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
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
    transform: translateY(-2px);
    box-shadow:
        0 12px 32px rgba(0, 0, 0, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
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
    transform: translateY(-2px);
    box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
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
    padding: 20px 0;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    text-align: center;
    color: #6b7280;
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
}

.position-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.position-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.position-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.stock-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.stock-code {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
}

.sell-btn {
    font-size: 0.75rem;
    padding: 4px 12px;
    border-radius: 6px;
}

.position-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.detail-label {
    color: #6b7280;
}

.detail-value {
    font-weight: 500;
    color: #18181b;
}

.detail-value.current-price {
    color: #3b82f6;
    font-weight: 600;
}

.detail-value.profit-loss.positive {
    color: #10b981;
    font-weight: 600;
}

.detail-value.profit-loss.negative {
    color: #ef4444;
    font-weight: 600;
}

.position-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
}

.buy-time {
    font-size: 0.75rem;
    color: #9ca3af;
}

.industry-tag {
    font-size: 0.75rem;
    color: #6366f1;
    background: #eef2ff;
    padding: 2px 8px;
    border-radius: 12px;
}

/* 卖出对话框样式 */
:deep(.sell-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.sell-dialog .el-dialog__header) {
    background: #fef2f2;
    border-bottom: 1px solid #fecaca;
    padding: 20px 24px;
}

:deep(.sell-dialog .el-dialog__title) {
    font-size: 1.25rem;
    font-weight: 600;
    color: #dc2626;
}

:deep(.sell-dialog .el-dialog__body) {
    padding: 24px;
}

.sell-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.stock-info-card {
    background: #fef2f2;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #fecaca;
}

.stock-info-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 12px 0;
}

.position-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
}

.summary-row span:first-child {
    color: #6b7280;
}

.summary-row span:last-child {
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
    color: #dc2626;
}

.amount-desc {
    font-size: 0.75rem;
    color: #6b7280;
}

.sell-dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

:deep(.sell-dialog .el-form-item__label) {
    font-weight: 500;
    color: #374151;
}

:deep(.sell-dialog .el-input-number .el-input__wrapper) {
    border-radius: 8px;
    border: 1px solid #d1d5db;
    transition: all 0.2s ease;
}

:deep(.sell-dialog .el-input-number .el-input__wrapper:hover) {
    border-color: #9ca3af;
}

:deep(.sell-dialog .el-input-number.is-focus .el-input__wrapper) {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
</style>
