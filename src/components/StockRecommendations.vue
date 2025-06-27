<template>
    <div class="recommendations-container">
        <div class="card-header">
            <h3 class="card-title">智能荐股</h3>
            <div class="update-time">{{ updateTime }}</div>
            <el-button size="small" text @click="refreshRecommendations">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </el-button>
        </div>

        <div class="recommendations-list">
            <!-- PC端使用StockList -->
            <StockList v-if="!isMobileView" :stocks="formattedRecommendations" :actions="recommendationActions"
                :show-recommend-index="true" :show-recommend-tooltip="true" :show-basic-details="true"
                :show-reason="true" :clickable="true" @stock-click="showStockDetail" @add-watchlist="handleAddWatchlist"
                @remove-watchlist="handleRemoveWatchlist" @paid-analysis="handlePaidAnalysis"
                @ai-trading="handleAITrading" @buy-stock="handleBuyStock" />

            <!-- 移动端使用MobileStockList -->
            <MobileStockList v-else :stocks="formattedRecommendations" :actions="recommendationActions"
                :show-recommend-index="true" :show-details="true" :clickable="true" @stock-click="showStockDetail"
                @action-click="handleActionClick" />
        </div>


    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../store/user';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog']);

const userStore = useUserStore();

// 移动端检测
const isMobileView = ref(false);

const checkMobileView = () => {
    isMobileView.value = window.innerWidth <= 768;
};

// 推荐股票操作按钮配置
const recommendationActions = [
    {
        key: "addWatchlist",
        text: "加入自选",
        type: "primary",
        class: "add-watchlist-btn",
        icon: "⭐",
    },
    {
        key: "removeWatchlist",
        text: "已加自选",
        type: "success",
        class: "remove-watchlist-btn",
        icon: "⭐",
        iconFill: "currentColor",
    },
    {
        key: "analysis",
        text: "量化分析",
        type: "default",
        class: "paid-analysis-btn",
        icon: "🎯",
        priceTag: {
            original: "3智点",
            promo: "1智点",
        },
    },
    {
        key: "aiTrading",
        text: "AI委托交易",
        type: "default",
        class: "quant-analysis-btn",
        icon: "🤖",
        priceTag: {
            original: "3智点",
            promo: "1智点",
        },
    },
    {
        key: "buy",
        text: "购买",
        type: "default",
        class: "buy-stock-btn-secondary",
        icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    },
];

// 更新时间
const updateTime = computed(() => {
    const now = new Date();
    return now.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
});

const recommendations = ref([
    {
        code: '000001',
        name: '平安银行',
        price: '12.45',
        change: 0.28,
        changePercent: 2.3,
        recommendIndex: 4.2,
        recommendLevel: '推荐',
        targetPrice: '15.80',
        expectedReturn: '+26.9%',
        riskLevel: '中等',
        industry: '银行',
        reason: '业绩稳健增长，ROE持续提升，估值处于历史低位，具备较好的投资价值。'
    },
    {
        code: '000858',
        name: '五粮液',
        price: '168.90',
        change: -2.05,
        changePercent: -1.2,
        recommendIndex: 4.6,
        recommendLevel: '强烈推荐',
        targetPrice: '195.00',
        expectedReturn: '+15.5%',
        riskLevel: '中等',
        industry: '食品饮料',
        reason: '白酒龙头企业，品牌价值突出，渠道优势明显，长期成长性确定。'
    },
    {
        code: '000002',
        name: '万科A',
        price: '18.76',
        change: 0.15,
        changePercent: 0.8,
        recommendIndex: 3.9,
        recommendLevel: '推荐',
        targetPrice: '22.50',
        expectedReturn: '+19.9%',
        riskLevel: '中等',
        industry: '房地产',
        reason: '房地产行业回暖，公司财务稳健，土地储备充足，估值合理。'
    },
    {
        code: '300750',
        name: '宁德时代',
        price: '198.50',
        change: 6.72,
        changePercent: 3.5,
        recommendIndex: 4.5,
        recommendLevel: '强烈推荐',
        targetPrice: '245.00',
        expectedReturn: '+23.4%',
        riskLevel: '较高',
        industry: '电池',
        reason: '新能源汽车产业链核心标的，技术领先，市场份额稳固，成长空间巨大。'
    }
]);

// 转换推荐数据为StockList组件需要的格式
const formattedRecommendations = computed(() => {
    return recommendations.value.map(stock => ({
        code: stock.code,
        name: stock.name,
        price: parseFloat(stock.price),
        change: stock.change,
        changePercent: stock.changePercent,
        recommendIndex: stock.recommendIndex,
        recommendLevel: stock.recommendLevel,
        targetPrice: stock.targetPrice,
        expectedReturn: stock.expectedReturn,
        riskLevel: stock.riskLevel,
        industry: stock.industry,
        reason: stock.reason
    }));
});

const refreshRecommendations = () => {
    ElMessage.success('推荐列表已更新');
    // 这里可以调用API刷新数据
};

const showStockDetail = (stock) => {
    // 发送到聊天框进行分析
    emit('send-to-chat', {
        type: 'stock',
        content: {
            ...stock,
            recommendIndexDesc: `推荐指数说明：
5.0：强烈推荐 - 投资价值极高
4.0-4.9：推荐 - 具备较好投资价值
3.0-3.9：中性 - 可持续观察
2.0-2.9：谨慎 - 建议控制仓位
1.0-1.9：不推荐 - 建议回避`
        },
        title: `${stock.name}(${stock.code})股票分析`
    });
};

// 移动端操作处理
const handleActionClick = ({ action, stock }) => {
    switch (action) {
        case 'addWatchlist':
            handleAddWatchlist(stock);
            break;
        case 'removeWatchlist':
            handleRemoveWatchlist(stock);
            break;
        case 'analysis':
            handlePaidAnalysis(stock);
            break;
        case 'aiTrading':
            handleAITrading(stock);
            break;
        case 'buy':
            handleBuyStock(stock);
            break;
        default:
            console.log('未知操作:', action);
    }
};

const handleAddWatchlist = (stock) => {
    const success = userStore.addToWatchlist(stock);
    if (success) {
        ElMessage.success(`已将${stock.name}加入自选股`);
    } else {
        ElMessage.warning(`${stock.name}已在自选股中`);
    }
};

const handleRemoveWatchlist = (stock) => {
    const success = userStore.removeFromWatchlist(stock.code);
    if (success) {
        ElMessage.success(`已将${stock.name}从自选股移除`);
    } else {
        ElMessage.warning(`${stock.name}不在自选股中`);
    }
};

const handlePaidAnalysis = (stock) => {
    // 检查余额是否足够
    if (userStore.smartPointsBalance < 1) {
        ElMessage.warning('智点余额不足，请先充值');
        return;
    }

    ElMessageBox.confirm(
        `量化分析 ${stock.name}(${stock.code}) 促销价仅需 1智点（原价3智点），是否继续？`,
        '付费服务确认',
        {
            confirmButtonText: '确认支付 1智点',
            cancelButtonText: '取消',
            type: 'info',
            customClass: 'high-z-index-dialog',
            appendTo: 'body'
        }
    ).then(() => {
        // 扣费（扣除1智点）
        if (userStore.deductSmartPoints(1)) {
            // 记录智点消费
            userStore.addSmartPointsTransaction({
                type: 'consumption',
                amount: 1,
                description: `量化分析报告 - ${stock.name}`,
                serviceType: 'quant-analysis',
                stockInfo: {
                    name: stock.name,
                    code: stock.code,
                },
                balanceAfter: userStore.smartPointsBalance,
            });
            ElMessage.success('支付成功，正在生成量化分析...');
            emit('send-to-chat', {
                type: 'paid-analysis',
                content: stock,
                title: `量化分析${stock.name}(${stock.code})`
            });
        } else {
            ElMessage.error('支付失败，智点余额不足');
        }
    }).catch(() => {
        // 用户取消
    });
};

const handleAITrading = (stock) => {
    // 发送到主界面处理AI委托交易对话框
    emit('send-to-chat', {
        type: 'show-ai-trading-dialog',
        content: stock,
        title: `AI委托交易设置 ${stock.name}(${stock.code})`
    });
};

const handleBuyStock = (stock) => {
    emit('show-buy-dialog', stock);
};

// 生命周期
onMounted(() => {
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobileView);
});

</script>

<style scoped>
.recommendations-container {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
    min-height: calc(100vh - 200px);
    display: flex;
    flex-direction: column;
    margin: 4px;
}

.card-header {
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.update-time {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
}

.recommendations-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 8px;
}



/* 使用StockList中的统一按钮样式 */

/* 移动端响应式样式 */
@media (max-width: 768px) {

    /* 移动端容器优化 */
    .recommendations-container {
        min-height: auto !important;
        margin: 0 !important;
        border-radius: 8px !important;
        overflow: visible !important;
    }

    /* 移动端头部优化 */
    .card-header {
        padding: 12px 16px 8px 16px !important;
        border-radius: 8px 8px 0 0 !important;
    }

    .card-title {
        font-size: 1rem !important;
    }

    .update-time {
        font-size: 0.7rem !important;
    }

    /* 移动端推荐列表优化 */
    .recommendations-list {
        padding: 8px !important;
        overflow: visible !important;
        flex: none !important;
    }
}

/* 移动端侧边栏专用样式 */
@media (max-width: 768px) {

    /* 在移动端侧边栏中进一步优化 */
    .sidebar-container .recommendations-container {
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
    }

    .sidebar-container .card-header {
        display: none !important;
    }

    .sidebar-container .recommendations-list {
        padding: 0 6px 12px 6px !important;
    }
}
</style>
