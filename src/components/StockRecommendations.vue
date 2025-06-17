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
            <div v-for="stock in recommendations" :key="stock.code" class="stock-item" @click="showStockDetail(stock)">
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
                                <span :class="['recommend-level', getRecommendLevelClass(stock.recommendLevel)]">
                                    {{ stock.recommendLevel }}
                                </span>
                            </div>
                        </div>
                        <div class="stock-price-change">
                            <span class="current-price">¥{{ stock.price }}</span>
                            <span :class="['price-change', stock.change >= 0 ? 'positive' : 'negative']">
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
            </div>
        </div>

        <div class="card-footer">
            <el-button size="small" text @click="viewMoreRecommendations">
                查看更多推荐
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

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

const getRecommendLevelClass = (level) => {
    const levelClassMap = {
        '强烈推荐': 'strong-recommend',
        '推荐': 'recommend',
        '中性': 'neutral',
        '谨慎': 'caution'
    };
    return levelClassMap[level] || 'neutral';
};

const refreshRecommendations = () => {
    ElMessage.success('推荐列表已更新');
    // 这里可以调用API刷新数据
};

const showStockDetail = (stock) => {
    // 发送到聊天框进行分析
    emit('send-to-chat', {
        type: 'stock',
        content: stock,
        title: `${stock.name}(${stock.code})股票分析`
    });
};

const viewMoreRecommendations = () => {
    ElMessage.info('跳转到完整推荐列表');
    // 这里可以跳转到完整的推荐页面
};
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

.recommendations-list {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
}

.stock-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    margin: 12px;
    transition: all 0.2s ease;
    cursor: pointer;
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
    gap: 2px;
}

.star {
    font-size: 14px;
    color: #fbbf24;
}

.star.filled {
    color: #f59e0b;
}

.star.empty {
    color: #d1d5db;
}

.recommend-score {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
}

.recommend-level {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
}

.recommend-level.strong-recommend {
    background: #dcfce7;
    color: #166534;
}

.recommend-level.recommend {
    background: #dbeafe;
    color: #1d4ed8;
}

.recommend-level.neutral {
    background: #fef3c7;
    color: #92400e;
}

.recommend-level.caution {
    background: #fee2e2;
    color: #dc2626;
}

.stock-price-change {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.current-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
}

.price-change {
    font-size: 0.875rem;
    font-weight: 600;
}

.price-change.positive {
    color: #dc2626;
}

.price-change.negative {
    color: #16a34a;
}

/* 股票详情样式 */
.stock-details {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
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
    color: #dc2626;
}

.expected-return {
    color: #16a34a;
}

.risk-level {
    color: #ea580c;
}

.industry {
    color: #7c3aed;
}

.stock-reason {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
}

.reason-label {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
}

.reason-text {
    font-size: 0.875rem;
    color: #374151;
    line-height: 1.5;
    margin-top: 4px;
    display: block;
}

.price-change.positive {
    color: #059669;
    background: #d1fae5;
}

.price-change.negative {
    color: #dc2626;
    background: #fee2e2;
}

.card-footer {
    padding: 12px 20px;
    border-top: 1px solid #f5f5f5;
    text-align: center;
    flex-shrink: 0;
}

:deep(.el-button) {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
}
</style>
