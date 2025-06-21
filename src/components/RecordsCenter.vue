<template>
    <div class="records-center-overlay">
        <div class="records-center">
            <!-- 关闭按钮 -->
            <div class="records-close">
                <el-button type="text" @click="$emit('close')" class="close-btn">
                    <el-icon size="20">
                        <Close />
                    </el-icon>
                </el-button>
            </div>

            <!-- 记录中心头部 -->
            <div class="records-header">
                <div class="header-background"></div>
                <div class="header-content">
                    <div class="header-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor"
                                stroke-width="2" fill="none" />
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" fill="none" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
                            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" />
                        </svg>
                    </div>
                    <div class="header-info">
                        <h2>记录中心</h2>
                        <p>管理您的分析报告、消费记录和交易记录</p>
                    </div>
                </div>
            </div>

            <!-- Tab导航 -->
            <div class="records-tabs">
                <div class="tab-nav">
                    <div class="tab-item" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3v18h18" stroke="currentColor" stroke-width="2" />
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" stroke-width="2"
                                fill="none" />
                        </svg>
                        量化分析报告
                        <span v-if="reportsCount > 0" class="count-badge">{{ reportsCount }}</span>
                    </div>
                    <div class="tab-item" :class="{ active: activeTab === 'points' }" @click="activeTab = 'points'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                            <path d="M16 8l-4 4-4-4" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                        智点记录
                        <span v-if="pointsRecordsCount > 0" class="count-badge">{{ pointsRecordsCount }}</span>
                    </div>
                    <div class="tab-item" :class="{ active: activeTab === 'trading' }" @click="activeTab = 'trading'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor"
                                stroke-width="2" />
                        </svg>
                        AI委托交易记录
                        <span v-if="tradingRecordsCount > 0" class="count-badge">{{ tradingRecordsCount }}</span>
                    </div>
                </div>
            </div>

            <!-- Tab内容 -->
            <div class="records-content">
                <!-- 量化分析报告 -->
                <div v-show="activeTab === 'reports'" class="tab-panel">
                    <QuantAnalysisReports />
                </div>

                <!-- 智点记录 -->
                <div v-show="activeTab === 'points'" class="tab-panel">
                    <SmartPointsRecords />
                </div>

                <!-- AI委托交易记录 -->
                <div v-show="activeTab === 'trading'" class="tab-panel">
                    <AITradingRecords />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '../store/user';
import { Close } from '@element-plus/icons-vue';
import QuantAnalysisReports from './QuantAnalysisReports.vue';
import SmartPointsRecords from './SmartPointsRecords.vue';
import AITradingRecords from './AITradingRecords.vue';

// 定义emit事件
const emit = defineEmits(['close']);

const userStore = useUserStore();

// 当前活跃的Tab
const activeTab = ref('reports');

// 计算各类记录数量
const reportsCount = computed(() => userStore.quantAnalysisReports?.length || 0);
const pointsRecordsCount = computed(() => userStore.smartPointsTransactions?.length || 0);
const tradingRecordsCount = computed(() => userStore.aiTradingRecords?.length || 0);
</script>

<style scoped>
.records-center-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
}

.records-center {
    width: 90vw;
    max-width: 1200px;
    height: 90vh;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.records-close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
}

.close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 1);
    color: #18181b;
    transform: scale(1.05);
}

.records-header {
    position: relative;
    height: 120px;
    overflow: hidden;
    flex-shrink: 0;
}

.header-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #18181b 0%, #374151 100%);
}

.header-content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 32px;
    gap: 16px;
}

.header-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-info h2 {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 4px 0;
}

.header-info p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
    margin: 0;
}

.records-tabs {
    flex-shrink: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
}

.tab-nav {
    display: flex;
    padding: 0 32px;
}

.tab-item {
    position: relative;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;
}

.tab-item:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.02);
}

.tab-item.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
}

.tab-item svg {
    flex-shrink: 0;
}

.count-badge {
    background: #3b82f6;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.records-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.tab-panel {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .records-center {
        width: 95vw;
        height: 95vh;
    }

    .header-content {
        padding: 0 16px;
        gap: 12px;
    }

    .header-icon {
        width: 48px;
        height: 48px;
    }

    .header-info h2 {
        font-size: 1.25rem;
    }

    .tab-nav {
        padding: 0 16px;
        overflow-x: auto;
    }

    .tab-item {
        padding: 12px 16px;
        font-size: 0.8rem;
        white-space: nowrap;
    }
}
</style>
