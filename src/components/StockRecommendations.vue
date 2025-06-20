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
                                <el-tooltip placement="top" :show-after="100" effect="dark"
                                    popper-class="recommend-tooltip">
                                    <template #content>
                                        <div class="recommend-index-tooltip">
                                            <div class="tooltip-title">推荐指数说明：</div>
                                            <div class="tooltip-item">
                                                <span class="score">5.0：</span>
                                                <span class="desc">强烈推荐 - 投资价值极高</span>
                                            </div>
                                            <div class="tooltip-item">
                                                <span class="score">4.0-4.9：</span>
                                                <span class="desc">推荐 - 具备较好投资价值</span>
                                            </div>
                                            <div class="tooltip-item">
                                                <span class="score">3.0-3.9：</span>
                                                <span class="desc">中性 - 可持续观察</span>
                                            </div>
                                            <div class="tooltip-item">
                                                <span class="score">2.0-2.9：</span>
                                                <span class="desc">谨慎 - 建议控制仓位</span>
                                            </div>
                                            <div class="tooltip-item">
                                                <span class="score">1.0-1.9：</span>
                                                <span class="desc">不推荐 - 建议回避</span>
                                            </div>
                                        </div>
                                    </template>
                                    <el-icon class="help-icon">
                                        <QuestionFilled />
                                    </el-icon>
                                </el-tooltip>
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
                        <div class="detail-group">
                            <span class="detail-label">目标价</span>
                            <span class="detail-value target-price">¥{{ stock.targetPrice }}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">预期收益</span>
                            <span class="detail-value expected-return">{{ stock.expectedReturn }}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">风险等级</span>
                            <span class="detail-value risk-level">{{ stock.riskLevel }}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">所属行业</span>
                            <span class="detail-value industry">{{ stock.industry }}</span>
                        </div>
                    </div>
                    <div class="stock-reason">
                        <span class="reason-label">推荐理由：</span>
                        <span class="reason-text" v-if="stock.reason">{{ stock.reason }}</span>
                        <span class="reason-text" v-else>暂无推荐理由</span>
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
import { QuestionFilled } from '@element-plus/icons-vue';

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

.help-icon {
    font-size: 14px;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.2s ease;
}

.help-icon:hover {
    color: #64748b;
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
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.2;
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

/* 为移动端股票卡片专门的样式覆盖 */
.stock-item .stock-details {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    gap: 6px 8px !important;
    margin-top: 8px !important;
    padding: 8px !important;
    background: #f8fafc !important;
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
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
    padding: 8px;
    background: #fff3cd;
    border-radius: 4px;
    border: 1px solid #ffeaa7;
    display: flex;
    align-items: flex-start;
    gap: 6px;
    grid-column: 1 / -1;
    position: relative;
    min-height: 32px;
}

.reason-label {
    font-size: 0.875rem;
    color: #856404;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
}

.reason-text {
    font-size: 0.875rem;
    color: #533f03;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-all;
    flex: 1;
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

/* Tooltip样式 */
.recommend-index-tooltip {
    padding: 8px 0;
    max-width: 280px;
}

.tooltip-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 6px;
    line-height: 1.4;
}

.tooltip-item:last-child {
    margin-bottom: 0;
}

.tooltip-item .score {
    font-size: 0.8rem;
    font-weight: 600;
    color: #fbbf24;
    min-width: 50px;
    flex-shrink: 0;
}

.tooltip-item .desc {
    font-size: 0.8rem;
    color: #e5e7eb;
    line-height: 1.4;
}

/* 移动端优化 - 横向布局 */
@media (max-width: 768px) {
    .stock-item {
        margin: 4px;
        padding: 8px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-height: auto;
    }

    .stock-info {
        margin-bottom: 0;
    }

    .stock-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
    }

    .stock-name-code {
        flex: 1;
        min-width: 0;
    }

    .name-code-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        margin-bottom: 4px;
    }

    .stock-name {
        font-size: 0.85rem;
        font-weight: 600;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    .stock-code {
        font-size: 0.7rem;
        color: #64748b;
        line-height: 1;
    }

    .recommend-index {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
    }

    .recommend-stars {
        display: flex;
        align-items: center;
        gap: 1px;
    }

    .star {
        font-size: 0.75rem;
    }

    .recommend-score {
        font-size: 0.65rem;
        color: #64748b;
        margin-left: 2px;
    }

    .help-icon {
        font-size: 0.75rem;
        margin-left: 2px;
    }

    .recommend-level {
        font-size: 0.6rem;
        padding: 1px 3px;
        margin-left: 2px;
    }

    .stock-price-change {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
    }

    .current-price {
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1;
    }

    .price-change {
        font-size: 0.7rem;
        padding: 1px 4px;
        border-radius: 3px;
        line-height: 1;
    }

    /* 优化详细信息显示 - 两行两列布局，平分宽度 */
    .stock-item .stock-info .stock-details {
        margin-top: 6px !important;
        padding: 6px 8px !important;
        background: #f8fafc !important;
        border-radius: 6px !important;
        border: 1px solid #e2e8f0 !important;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        gap: 6px 8px !important;
        align-items: center !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .detail-row {
        display: contents;
    }

    .detail-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 6px 4px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(226, 232, 240, 0.5);
        min-height: 40px !important;
        height: 40px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .detail-label {
        font-size: 0.65rem;
        color: #64748b;
        white-space: nowrap;
        font-weight: 500;
        line-height: 1;
        text-align: center;
    }

    .detail-value {
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: #1f2937;
    }

    /* 推荐理由独占一行，居中分割线 */
    .stock-reason {
        margin-top: 8px !important;
        padding: 8px !important;
        background: #fff3cd !important;
        border-radius: 4px !important;
        border: 1px solid #ffeaa7 !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 6px !important;
        min-height: 32px !important;
        grid-column: 1 / -1 !important;
        position: relative !important;
    }

    .reason-label {
        font-size: 0.7rem !important;
        color: #856404 !important;
        white-space: nowrap !important;
        flex-shrink: 0 !important;
        font-weight: bold !important;
    }

    .reason-text {
        font-size: 0.7rem !important;
        line-height: 1.4 !important;
        color: #533f03 !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
        flex: 1 !important;
    }

    .card-footer {
        padding: 6px 12px;
    }

    .card-footer .el-button {
        font-size: 0.75rem;
    }
}

/* 小屏手机进一步优化 - 极简横向布局 */
@media (max-width: 480px) {
    .stock-item {
        margin: 3px;
        padding: 6px;
        gap: 4px;
    }

    .stock-header {
        gap: 6px;
        margin-bottom: 3px;
    }

    .name-code-row {
        gap: 1px;
        margin-bottom: 3px;
    }

    .stock-name {
        font-size: 0.8rem;
        max-width: 120px;
    }

    .stock-code {
        font-size: 0.65rem;
    }

    .recommend-index {
        gap: 3px;
    }

    .star {
        font-size: 0.7rem;
    }

    .recommend-score {
        font-size: 0.6rem;
        margin-left: 1px;
    }

    .help-icon {
        font-size: 0.7rem;
        margin-left: 1px;
    }

    .recommend-level {
        font-size: 0.55rem;
        padding: 1px 2px;
        margin-left: 1px;
    }

    .current-price {
        font-size: 0.85rem;
    }

    .price-change {
        font-size: 0.65rem;
        padding: 1px 3px;
    }

    .stock-item .stock-info .stock-details {
        margin-top: 3px !important;
        padding: 4px 6px !important;
        gap: 4px 6px !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        width: 100% !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    }

    .detail-label {
        font-size: 0.65rem;
    }

    .detail-value {
        font-size: 0.65rem;
    }

    .stock-reason {
        margin-top: 6px !important;
        padding: 6px !important;
        background: #fff3cd !important;
        border: 1px solid #ffeaa7 !important;
        border-radius: 4px !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 4px !important;
        min-height: 28px !important;
        grid-column: 1 / -1 !important;
        position: relative !important;
    }

    .reason-label {
        font-size: 0.65rem !important;
        color: #856404 !important;
        font-weight: bold !important;
        flex-shrink: 0 !important;
    }

    .reason-text {
        font-size: 0.65rem !important;
        line-height: 1.3 !important;
        color: #533f03 !important;
        flex: 1 !important;
        white-space: normal !important;
        word-wrap: break-word !important;
        word-break: break-all !important;
    }

    .card-footer {
        padding: 4px 8px;
    }

    .card-footer .el-button {
        font-size: 0.7rem;
        padding: 4px 8px;
        height: 28px;
    }
}
</style>

<!-- 全局tooltip样式 -->
<style>
.recommend-tooltip {
    max-width: 300px !important;
}

.recommend-tooltip .el-popper__content {
    padding: 12px 16px !important;
    background: rgba(55, 65, 81, 0.95) !important;
    backdrop-filter: blur(8px) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
}
</style>
