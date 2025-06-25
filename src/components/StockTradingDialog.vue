<template>
    <el-dialog v-model="visible" title="" width="800px" class="buy-dialog" :show-close="false" :z-index="11000">
        <div class="trading-interface" v-if="stock">
            <!-- 股票信息头部 -->
            <div class="stock-header-section">
                <!-- 头部主要内容 -->
                <div class="header-main-content">
                    <!-- 左侧：股票基本信息 -->
                    <div class="stock-basic-info">
                        <div class="stock-title-row">
                            <div class="stock-name-group">
                                <h2 class="buy-dialog-stock-name">{{ stock.name }}</h2>
                                <span class="buy-dialog-stock-code">{{ stock.code }}</span>
                            </div>
                            <div class="stock-tags">
                                <span class="tag-item">A股</span>
                                <span class="tag-item">主板</span>
                            </div>
                        </div>

                        <div class="stock-price-row">
                            <div class="price-main">
                                <span class="buy-dialog-current-price">¥{{ stock.price }}</span>
                                <div :class="['price-change-group', stock.change >= 0 ? 'up' : 'down']">
                                    <span class="change-amount">{{ stock.change >= 0 ? '+' : '' }}{{ stock.change
                                    }}</span>
                                    <span class="change-percent">({{ stock.changePercent >= 0 ? '+' : '' }}{{
                                        stock.changePercent }}%)</span>
                                </div>
                            </div>
                            <div class="price-stats">
                                <div class="stat-item">
                                    <span class="stat-label">今开</span>
                                    <span class="stat-value">{{ (parseFloat(stock.price) - 2.5).toFixed(2) }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">昨收</span>
                                    <span class="stat-value">{{ (parseFloat(stock.price) -
                                        parseFloat(stock.change)).toFixed(2) }}</span>
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
                            <el-button v-if="!isInWatchlist" class="action-btn favorite-btn" size="small"
                                @click="handleAddToWatchlist">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                        stroke="currentColor" stroke-width="2" fill="none" />
                                </svg>
                                加入自选
                            </el-button>
                            <el-button v-else class="action-btn favorite-btn favorited" size="small"
                                @click="handleRemoveFromWatchlist">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                        fill="currentColor" />
                                </svg>
                                已加自选
                            </el-button>
                            <el-button class="close-btn" circle @click="handleClose">
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
                        <span class="info-value up">{{ (parseFloat(stock.price) * 1.1).toFixed(2) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">跌停</span>
                        <span class="info-value down">{{ (parseFloat(stock.price) * 0.9).toFixed(2) }}</span>
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

            <!-- 主要内容区域 - 左右布局 -->
            <div class="trading-main-content">
                <!-- 左侧：交易面板 -->
                <div class="left-panel">
                    <div class="trading-panel">
                        <div class="panel-tabs">
                            <div :class="['tab-item', { 'active': tradeType === 'buy' }]"
                                @click="switchTradeType('buy')">买入</div>
                            <div :class="['tab-item', { 'active': tradeType === 'sell' }]"
                                @click="switchTradeType('sell')">卖出</div>
                            <div :class="['tab-item', { 'active': tradeType === 'cancel' }]"
                                @click="handleCancelOrders">撤单</div>
                        </div>

                        <div class="trading-form">
                            <!-- 撤单模式：显示委托单列表 -->
                            <div v-if="tradeType === 'cancel'" class="cancel-orders-section">
                                <div v-if="currentStockPendingOrders.length === 0" class="no-orders">
                                    <div class="no-orders-icon">📋</div>
                                    <div class="no-orders-text">暂无待撤销的委托单</div>
                                </div>
                                <div v-else class="orders-list">
                                    <div v-for="order in currentStockPendingOrders" :key="order.id" class="order-item">
                                        <div class="order-header">
                                            <span :class="['order-type', order.type]">{{ order.type === 'buy' ? '买入' :
                                                '卖出' }}</span>
                                            <span class="order-time">{{ formatOrderTime(order.createdAt) }}</span>
                                        </div>
                                        <div class="order-details">
                                            <div class="order-info">
                                                <div class="info-item">
                                                    <span class="label">委托价格</span>
                                                    <span class="value">¥{{ order.price.toFixed(2) }}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="label">委托数量</span>
                                                    <span class="value">{{ order.quantity }}股</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="label">委托金额</span>
                                                    <span class="value">¥{{ (order.price * order.quantity).toFixed(2)
                                                    }}</span>
                                                </div>
                                            </div>
                                            <div class="order-actions">
                                                <el-button size="small" type="danger" @click="cancelOrder(order.id)">
                                                    撤单
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 买入/卖出模式：显示交易表单 -->
                            <div v-else>
                                <!-- 限价委托选择 -->
                                <div class="order-type-section">
                                    <el-select v-model="tradingForm.orderType" class="order-type-select">
                                        <el-option label="限价委托" value="limit" />
                                        <el-option label="市价委托" value="market" />
                                    </el-select>
                                </div>

                                <!-- 价格输入 -->
                                <div class="price-section">
                                    <div class="input-row">
                                        <span class="input-label">委托价格</span>
                                        <div class="price-input-group">
                                            <el-input v-model="tradingForm.price" class="price-input"
                                                :disabled="tradingForm.orderType === 'market'" placeholder="185.50" />
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
                                            <el-input-number v-model="tradingForm.quantity" :min="100" :step="100"
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
                                    <el-button class="buy-action-btn" type="danger" size="large" @click="confirmTrade"
                                        :loading="tradingLoading" :disabled="!canTrade">
                                        {{ tradeType === 'sell' ? '委托卖出' : '委托买入' }}
                                    </el-button>
                                </div>

                                <!-- 账户信息 -->
                                <div class="account-info-section">
                                    <div class="account-row">
                                        <span class="label">资金余额</span>
                                        <span class="value">{{ balance.toFixed(2) }}</span>
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
                                    <span :class="['current-value', stock.change >= 0 ? 'up' : 'down']">
                                        {{ stock.price }}
                                    </span>
                                    <span class="current-change">
                                        {{ stock.change >= 0 ? '+' : '' }}{{ stock.changePercent }}%
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
                <el-button class="cancel-btn" @click="handleClose">取消</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Object,
        default: null
    },
    tradeType: {
        type: String,
        default: 'buy', // 'buy'、'sell' 或 'cancel'
        validator: (value) => ['buy', 'sell', 'cancel'].includes(value)
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'trade-completed', 'watchlist-changed']);

// Store
const userStore = useUserStore();

// 响应式数据
const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const tradingLoading = ref(false);
const tradeType = ref(props.tradeType);
const sellOrders = ref([]);
const buyOrders = ref([]);

// 交易表单
const tradingForm = reactive({
    orderType: 'limit',
    price: '',
    quantity: 100
});

// 计算属性
const isInWatchlist = computed(() => {
    if (!props.stock) return false;
    return userStore.isInWatchlist(props.stock.code);
});

const balance = computed(() => userStore.balance);

const currentPosition = computed(() => {
    if (!props.stock) return null;
    return userStore.getPosition(props.stock.code);
});

const maxBuyQuantity = computed(() => {
    if (!props.stock) return 100;

    if (tradeType.value === 'sell') {
        const position = userStore.getPosition(props.stock.code);
        return position ? position.quantity : 0;
    }

    const price = parseFloat(props.stock.price);
    const availableFunds = userStore.balance;
    const maxQuantity = Math.floor(availableFunds / price / 100) * 100;
    return Math.max(100, maxQuantity);
});

const availableBuyQuantity = computed(() => {
    if (!props.stock) return 0;
    const price = tradingForm.orderType === 'market'
        ? parseFloat(props.stock.price)
        : parseFloat(tradingForm.price) || parseFloat(props.stock.price);

    const availableFunds = userStore.balance;
    return Math.floor(availableFunds / price / 100) * 100;
});

const availableSellQuantity = computed(() => {
    if (!props.stock) return 0;
    const position = userStore.getPosition(props.stock.code);
    return position ? position.quantity : 0;
});

const estimatedAmount = computed(() => {
    if (!props.stock || !tradingForm.quantity) return 0;
    const price = tradingForm.orderType === 'market'
        ? parseFloat(props.stock.price)
        : parseFloat(tradingForm.price) || parseFloat(props.stock.price);
    return tradingForm.quantity * price;
});

const canTrade = computed(() => {
    if (!props.stock || !tradingForm.quantity) return false;

    if (tradeType.value === 'sell') {
        return availableSellQuantity.value >= tradingForm.quantity;
    }

    return estimatedAmount.value <= userStore.balance && tradingForm.quantity >= 100;
});

// 当前股票的待撤销委托单
const currentStockPendingOrders = computed(() => {
    if (!props.stock) return [];
    return userStore.getPendingOrdersByStock(props.stock.code);
});

// 方法
const getCurrentTime = () => {
    return new Date().toLocaleTimeString('zh-CN', { hour12: false });
};

const adjustPrice = (delta) => {
    const currentPrice = parseFloat(tradingForm.price) || 0;
    const newPrice = Math.max(0, currentPrice + delta);
    tradingForm.price = newPrice.toFixed(2);
};

const setQuantityByPercent = (percent) => {
    if (!props.stock) return;

    if (tradeType.value === 'sell') {
        const position = userStore.getPosition(props.stock.code);
        const targetQuantity = Math.floor((position?.quantity || 0) * percent / 100 / 100) * 100;
        tradingForm.quantity = Math.max(100, targetQuantity);
    } else {
        const price = tradingForm.orderType === 'market'
            ? parseFloat(props.stock.price)
            : parseFloat(tradingForm.price) || parseFloat(props.stock.price);

        const availableFunds = userStore.balance * percent / 100;
        const targetQuantity = Math.floor(availableFunds / price / 100) * 100;
        tradingForm.quantity = Math.max(100, targetQuantity);
    }
};

const generateMarketData = () => {
    if (!props.stock) return;

    const basePrice = parseFloat(props.stock.price);

    sellOrders.value = [];
    buyOrders.value = [];

    // 生成卖盘数据（5档）
    for (let i = 0; i < 5; i++) {
        sellOrders.value.push({
            price: (basePrice + (i + 1) * 0.05).toFixed(2),
            volume: Math.floor(Math.random() * 500 + 100) + '手'
        });
    }

    // 生成买盘数据（5档）
    for (let i = 0; i < 5; i++) {
        buyOrders.value.push({
            price: (basePrice - (i + 1) * 0.05).toFixed(2),
            volume: Math.floor(Math.random() * 500 + 100) + '手'
        });
    }
};

const handleAddToWatchlist = () => {
    if (userStore.addToWatchlist(props.stock)) {
        ElMessage.success(`${props.stock.name} 已加入自选股`);
        emit('watchlist-changed', { action: 'add', stock: props.stock });
    } else {
        ElMessage.warning(`${props.stock.name} 已在自选股中`);
    }
};

const handleRemoveFromWatchlist = () => {
    if (userStore.removeFromWatchlist(props.stock.code)) {
        ElMessage.success('已从自选股中移除');
        emit('watchlist-changed', { action: 'remove', stock: props.stock });
    } else {
        ElMessage.error('移除失败');
    }
};

const confirmTrade = async () => {
    if (!canTrade.value) return;

    tradingLoading.value = true;

    try {
        // 模拟交易延迟
        await new Promise(resolve => setTimeout(resolve, 1500));

        const tradePrice = tradingForm.orderType === 'market' ? parseFloat(props.stock.price) : parseFloat(tradingForm.price);

        const tradeData = {
            stock: props.stock,
            type: tradeType.value,
            orderType: tradingForm.orderType,
            price: tradePrice,
            quantity: tradingForm.quantity,
            amount: estimatedAmount.value,
            timestamp: new Date().toISOString()
        };

        // 创建委托单记录
        const orderData = {
            stockCode: props.stock.code,
            stockName: props.stock.name,
            type: tradeType.value,
            orderType: tradingForm.orderType,
            price: tradePrice,
            quantity: tradingForm.quantity,
        };

        const createdOrder = userStore.addPendingOrder(orderData);

        // 显示委托成功提示
        ElMessage.success({
            message: `委托${tradeType.value === 'buy' ? '买入' : '卖出'}已提交\n委托编号：${createdOrder.id.slice(-8)}`,
            duration: 3000,
            showClose: true
        });

        if (tradeType.value === 'buy') {
            // 买入逻辑
            const buyResult = userStore.buyStock(props.stock, tradingForm.quantity, tradePrice);
            if (buyResult.success) {
                ElMessage.success(`买入委托已提交：${props.stock.name} ${tradingForm.quantity}股`);
            } else {
                ElMessage.error(buyResult.message);
                return;
            }
        } else {
            // 卖出逻辑
            const sellResult = userStore.sellStock(props.stock.code, tradingForm.quantity, tradePrice);
            if (sellResult.success) {
                ElMessage.success(`卖出委托已提交：${props.stock.name} ${tradingForm.quantity}股`);
            } else {
                ElMessage.error(sellResult.message);
                return;
            }
        }

        emit('trade-completed', tradeData);
        handleClose();

    } catch (error) {
        console.error('交易失败:', error);
        ElMessage.error('交易失败，请重试');
    } finally {
        tradingLoading.value = false;
    }
};

const switchTradeType = (type) => {
    tradeType.value = type;
    // 重置表单
    tradingForm.quantity = 100;
    if (props.stock) {
        tradingForm.price = props.stock.price;
    }
};

const handleCancelOrders = () => {
    // 切换到撤单模式
    tradeType.value = 'cancel';
};

const cancelOrder = async (orderId) => {
    try {
        // 查找委托单信息
        const order = currentStockPendingOrders.value.find(o => o.id === orderId);
        if (!order) {
            ElMessage.error('委托单不存在');
            return;
        }

        // 确认撤单
        const confirmed = await ElMessageBox.confirm(
            `确定要撤销这笔委托吗？\n\n${order.type === 'buy' ? '买入' : '卖出'} ${order.stockName}\n委托价格：¥${order.price.toFixed(2)}\n委托数量：${order.quantity}股`,
            '确认撤单',
            {
                confirmButtonText: '确定撤单',
                cancelButtonText: '取消',
                type: 'warning',
                dangerouslyUseHTMLString: false,
                customClass: 'high-z-index-dialog',
                appendTo: 'body',
            }
        );

        if (confirmed) {
            const success = userStore.cancelPendingOrder(orderId);
            if (success) {
                ElMessage.success('委托单已撤销');
            } else {
                ElMessage.error('撤单失败，该委托单可能已经成交');
            }
        }
    } catch (error) {
        if (error === 'cancel') {
            // 用户取消撤单
            return;
        }
        console.error('撤单失败:', error);
        ElMessage.error('撤单失败，请重试');
    }
};

const formatOrderTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const handleClose = () => {
    visible.value = false;
};

// 监听股票变化，初始化交易表单
watch(() => props.stock, (newStock) => {
    if (newStock) {
        tradingForm.price = newStock.price;
        tradingForm.quantity = 100;
        generateMarketData();
    }
}, { immediate: true });

// 监听交易类型变化
watch(() => props.tradeType, (newType) => {
    tradeType.value = newType;
}, { immediate: true });

// 监听对话框显示状态
watch(visible, (newVisible) => {
    if (newVisible && props.stock) {
        nextTick(() => {
            generateMarketData();
        });
    }
});
</script>

<style scoped>
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
    flex: 0 0 400px;
    min-width: 400px;
}

.right-panel {
    flex: 1;
    min-width: 300px;
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
    grid-template-columns: 60px 1fr 80px;
    gap: 8px;
    padding: 12px 16px;
    background: #fafbfc;
    border-bottom: 1px solid #ebeef5;
    font-size: 12px;
    font-weight: 600;
    color: #606266;
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

.sell-orders,
.buy-orders {
    padding: 0;
}

.order-row {
    display: grid;
    grid-template-columns: 60px 1fr 80px;
    gap: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    border-bottom: 1px solid #f5f7fa;
    transition: background-color 0.2s ease;
}

.order-row:hover {
    background: #f5f7fa;
}

.order-row.sell {
    background: linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.03) 100%);
}

.order-row.buy {
    background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.03) 100%);
}

.order-label {
    color: #909399;
    font-weight: 500;
    text-align: left;
}

.order-price {
    font-weight: 600;
    text-align: center;
}

.order-row.sell .order-price {
    color: #ef4444;
}

.order-row.buy .order-price {
    color: #10b981;
}

.order-volume {
    color: #606266;
    text-align: right;
    font-size: 11px;
}

.current-price-row {
    display: grid;
    grid-template-columns: 60px 1fr 80px;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(90deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%);
    border-top: 2px solid #e5e7eb;
    border-bottom: 2px solid #e5e7eb;
    font-weight: 700;
}

.current-label {
    color: #374151;
    font-size: 12px;
    text-align: left;
}

.current-value {
    font-size: 14px;
    text-align: center;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.current-value.up {
    color: #10b981;
}

.current-value.down {
    color: #ef4444;
}

.current-change {
    font-size: 11px;
    color: #6b7280;
    text-align: right;
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
    padding: 12px 16px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border-right: 1px solid #ebeef5;
}

.tab-item:last-child {
    border-right: none;
}

.tab-item.active {
    background: white;
    color: #409eff;
    border-bottom: 2px solid #409eff;
}

/* 移除disabled样式，现在所有标签都可点击 */

.trading-form {
    padding: 20px;
}

.order-type-section {
    margin-bottom: 20px;
}

.order-type-select {
    width: 100%;
}

.price-section,
.quantity-section {
    margin-bottom: 20px;
}

.input-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-label {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
}

.price-input-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.price-input {
    flex: 1;
}

.price-controls {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.price-btn {
    width: 32px;
    height: 20px;
    padding: 0;
    font-size: 12px;
    font-weight: 600;
}

.quantity-input-group {
    width: 100%;
}

.quantity-input {
    width: 100%;
}

.quantity-shortcuts {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.quantity-shortcuts .el-button {
    flex: 1;
    font-size: 12px;
}

.available-info,
.trade-summary {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 16px;
}

.info-row,
.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-row .label,
.summary-row .label {
    font-size: 13px;
    color: #909399;
}

.info-row .value,
.summary-row .value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.action-section {
    margin-bottom: 20px;
}

.buy-action-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 8px;
}

.account-info-section {
    border-top: 1px solid #ebeef5;
    padding-top: 16px;
}

.account-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.account-row:last-child {
    margin-bottom: 0;
}

.account-row .label {
    font-size: 13px;
    color: #909399;
}

.account-row .value {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

/* 底部按钮 */
.trading-footer {
    padding: 16px 20px;
    background: #f8f9fa;
    border-top: 1px solid #ebeef5;
    text-align: center;
}

.cancel-btn {
    min-width: 100px;
    height: 40px;
    font-weight: 500;
}

/* 撤单模式样式 */
.cancel-orders-section {
    padding: 0;
}

.no-orders {
    text-align: center;
    padding: 60px 20px;
    color: #909399;
}

.no-orders-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.6;
}

.no-orders-text {
    font-size: 14px;
}

.orders-list {
    max-height: 350px;
    overflow-y: auto;
}

.order-item {
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    margin-bottom: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.order-item:hover {
    border-color: #d9ecff;
    box-shadow: 0 1px 4px rgba(64, 158, 255, 0.1);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #fafbfc;
    border-bottom: 1px solid #f0f0f0;
}

.order-type {
    font-size: 12px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 10px;
    color: white;
}

.order-type.buy {
    background: #f56c6c;
}

.order-type.sell {
    background: #67c23a;
}

.order-time {
    font-size: 11px;
    color: #909399;
}

.order-details {
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.order-info {
    flex: 1;
    display: flex;
    gap: 16px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.info-item .label {
    font-size: 10px;
    color: #909399;
    line-height: 1;
}

.info-item .value {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    line-height: 1.2;
}

.order-actions {
    flex-shrink: 0;
}

.order-actions .el-button {
    padding: 4px 8px;
    font-size: 11px;
    height: auto;
    min-height: 24px;
}

/* 确保弹窗在移动端侧边栏上方显示 */
:deep(.el-dialog) {
    z-index: 11000 !important;
}

:deep(.el-overlay) {
    z-index: 10999 !important;
}

/* 强制设置弹窗容器的z-index */
.buy-dialog {
    z-index: 11000 !important;
}

.buy-dialog :deep(.el-dialog__wrapper) {
    z-index: 11000 !important;
}
</style>
