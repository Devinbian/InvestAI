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
            <div v-for="stock in recommendations" :key="stock.code" class="recommendation-item"
                @click="showStockDetail(stock)">
                <div class="stock-header">
                    <div class="stock-info">
                        <div class="stock-name">{{ stock.name }}</div>
                        <div class="stock-code">{{ stock.code }}</div>
                    </div>
                    <div class="stock-score">
                        <span class="score-label">推荐指数</span>
                        <span class="score-value" :class="getScoreClass(stock.score)">
                            {{ stock.score }}
                        </span>
                    </div>
                </div>

                <div class="stock-price-info">
                    <div class="current-price">¥{{ stock.currentPrice }}</div>
                    <div class="price-change" :class="{ 'positive': stock.change > 0, 'negative': stock.change < 0 }">
                        {{ stock.change > 0 ? '+' : '' }}{{ stock.change }}%
                    </div>
                </div>

                <div class="recommendation-reason">
                    <div class="reason-title">推荐理由</div>
                    <div class="reason-content">{{ stock.reason }}</div>
                </div>

                <div class="recommendation-tags">
                    <span v-for="tag in stock.tags" :key="tag" class="tag" :class="getTagClass(tag)">
                        {{ tag }}
                    </span>
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
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 定义emit
const emit = defineEmits(['send-to-chat']);

const recommendations = ref([
    {
        code: '000001',
        name: '平安银行',
        currentPrice: '12.45',
        change: 2.3,
        score: 8.5,
        reason: '业绩稳健增长，ROE持续提升，估值处于历史低位，具备较好的投资价值。',
        tags: ['价值投资', '银行股', '高股息']
    },
    {
        code: '000858',
        name: '五粮液',
        currentPrice: '168.90',
        change: -1.2,
        score: 9.2,
        reason: '白酒龙头企业，品牌价值突出，渠道优势明显，长期成长性确定。',
        tags: ['消费升级', '白酒', '品牌价值']
    },
    {
        code: '000002',
        name: '万科A',
        currentPrice: '18.76',
        change: 0.8,
        score: 7.8,
        reason: '房地产行业回暖，公司财务稳健，土地储备充足，估值合理。',
        tags: ['地产龙头', '估值修复', '政策利好']
    },
    {
        code: '300750',
        name: '宁德时代',
        currentPrice: '198.50',
        change: 3.5,
        score: 9.0,
        reason: '新能源汽车产业链核心标的，技术领先，市场份额稳固，成长空间巨大。',
        tags: ['新能源', '科技成长', '行业龙头']
    }
]);

const getScoreClass = (score) => {
    // 将10分制转换为100分制进行判断
    const numScore = score * 10;
    if (numScore >= 85) return 'excellent';
    if (numScore >= 75) return 'good';
    if (numScore >= 65) return 'average';
    return 'poor';
};

const getTagClass = (tag) => {
    const tagClassMap = {
        '价值投资': 'value',
        '银行股': 'finance',
        '高股息': 'dividend',
        '消费升级': 'consumer',
        '白酒': 'liquor',
        '品牌价值': 'brand',
        '地产龙头': 'realestate',
        '估值修复': 'valuation',
        '政策利好': 'policy',
        '新能源': 'newenergy',
        '科技成长': 'tech',
        '行业龙头': 'leader'
    };
    return tagClassMap[tag] || 'default';
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

.recommendation-item {
    padding: 16px 20px;
    border-bottom: 1px solid #f8f9fa;
    cursor: pointer;
    transition: all 0.2s;
}

.recommendation-item:hover {
    background: #f9fafb;
}

.recommendation-item:last-child {
    border-bottom: none;
}

.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.stock-info {
    flex: 1;
}

.stock-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #18181b;
    margin-bottom: 2px;
}

.stock-code {
    font-size: 0.75rem;
    color: #9ca3af;
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

.stock-price-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.current-price {
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
}

.price-change {
    font-size: 0.85rem;
    font-weight: 500;
}

.price-change.positive {
    color: #ef4444;
}

.price-change.negative {
    color: #10b981;
}

.recommendation-reason {
    margin-bottom: 12px;
}

.reason-title {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 4px;
}

.reason-content {
    font-size: 0.85rem;
    color: #374151;
    line-height: 1.4;
}

.recommendation-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    border: 1px solid;
}

.tag.value {
    background: #fef3c7;
    color: #92400e;
    border-color: #fcd34d;
}

.tag.finance {
    background: #dbeafe;
    color: #1e40af;
    border-color: #93c5fd;
}

.tag.dividend {
    background: #d1fae5;
    color: #065f46;
    border-color: #6ee7b7;
}

.tag.consumer {
    background: #fce7f3;
    color: #be185d;
    border-color: #f9a8d4;
}

.tag.liquor {
    background: #fef2f2;
    color: #991b1b;
    border-color: #fca5a5;
}

.tag.brand {
    background: #ede9fe;
    color: #5b21b6;
    border-color: #c4b5fd;
}

.tag.realestate {
    background: #f0f9ff;
    color: #0c4a6e;
    border-color: #7dd3fc;
}

.tag.valuation {
    background: #ecfdf5;
    color: #14532d;
    border-color: #86efac;
}

.tag.policy {
    background: #fff7ed;
    color: #9a3412;
    border-color: #fed7aa;
}

.tag.newenergy {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
}

.tag.tech {
    background: #f8fafc;
    color: #334155;
    border-color: #cbd5e1;
}

.tag.leader {
    background: #fdf4ff;
    color: #86198f;
    border-color: #e879f9;
}

.tag.default {
    background: #f3f4f6;
    color: #6b7280;
    border-color: #d1d5db;
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
