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
                :show-reason="true" :clickable="false" :is-mobile="isMobileView" @action-click="handleActionClick" />

            <!-- 移动端使用MobileStockList -->
            <MobileStockList v-else :stocks="formattedRecommendations" :actions="recommendationActions"
                :show-recommend-index="true" :show-details="true" :clickable="false"
                @action-click="handleActionClick" />
        </div>


    </div>
</template>

<script setup>
import {getRecommendStocks} from '@/api/api';

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../store/user';
import StockList from './StockList.vue';
import MobileStockList from './MobileStockList.vue';
import { getStockActionConfig } from '../config/stockActionConfig';
import { useMobileDetection } from '../composables/useResponsiveBreakpoints';

// 定义emit
const emit = defineEmits(['send-to-chat', 'show-buy-dialog', 'action-click']);

const userStore = useUserStore();

// 使用统一的移动端检测
const { isMobileView } = useMobileDetection();

// 推荐股票操作按钮配置
const recommendationActions = computed(() => {
    return getStockActionConfig('recommendation', {
        isMobile: isMobileView.value,
        maxButtons: isMobileView.value ? 3 : 5
    });
});

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

const recommendations = ref([]);

// 转换推荐数据为StockList组件需要的格式
const formattedRecommendations = computed(() => {
    return recommendations.value.map(stock => ({
        code: stock.code,
        name: stock.name,
        price: stock.latestPrice,
        change: stock.change,
        changePercent: stock.rise ? stock.rise + "%" : stock.changePercent,
        // 修复推荐指数字段映射
        recommendIndex: stock.recommendIndex || stock.recommendScore || stock.score || 4.0,
        recommendLevel: stock.recommendLevel || stock.level || "推荐",
        targetPrice: stock.targetPrice,
        // 修复预期收益字段映射
        expectedReturn: stock.expectedReturn || stock.expectedBenefits || stock.expected_return,
        riskLevel: stock.riskLevel,
        industry: stock.industry,
        reason: stock.recommendReason || stock.reason
    }));
});

const refreshRecommendations = () => {
    loadRecommendStocks();
    ElMessage.success('推荐列表已更新');
    // 这里可以调用API刷新数据
};

// 移动端操作处理 - 统一转发到Main.vue处理
const handleActionClick = ({ action, stock }) => {
    console.log('StockRecommendations - 转发股票操作:', action, stock);

    // 直接转发到Main.vue的统一处理逻辑
    emit('action-click', { action, stock });
};

// 这些业务逻辑已经移到Main.vue中统一处理，避免重复代码

// 生命周期
onMounted(() => {
    loadRecommendStocks();
    // 移动端检测由useMobileDetection自动处理
});

//获取推荐股票
const loadRecommendStocks = () => {
    getRecommendStocks().then((res) => {
        if (res.data.success) {
            recommendations.value = res.data.data;
        } else {
            // API调用成功但返回失败状态
            console.warn('获取推荐股票失败:', res.data.message);
            recommendations.value = [];
            ElMessage.warning('获取推荐股票失败，请稍后重试');
        }
    }).catch((error) => {
        // API调用失败
        console.error('获取推荐股票API调用失败:', error);
        recommendations.value = [];
        
        // 根据错误类型提供不同的提示
        if (error.message && error.message.includes("500")) {
            ElMessage.error("服务器繁忙，请稍后再试");
        } else if (error.message && error.message.includes("网络")) {
            ElMessage.error("网络连接异常，请检查网络后重试");
        } else {
            ElMessage.error("获取推荐股票失败，请稍后重试");
        }
    });
}

onUnmounted(() => {
    // 清理工作由useMobileDetection自动处理
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
