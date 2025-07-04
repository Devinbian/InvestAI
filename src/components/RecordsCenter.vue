<template>
    <!-- PC端弹窗 -->
    <div v-if="!isMobile" class="records-center-overlay">
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
                        <p>管理您的分析报告、消费记录和各类交易记录</p>
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
                    <div class="tab-item" :class="{ active: activeTab === 'userTrading' }"
                        @click="activeTab = 'userTrading'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                        用户自助交易记录
                        <span v-if="userTradingRecordsCount > 0" class="count-badge">{{ userTradingRecordsCount
                        }}</span>
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

                <!-- 用户自助交易记录 -->
                <div v-show="activeTab === 'userTrading'" class="tab-panel">
                    <UserTradingRecords />
                </div>
            </div>
        </div>
    </div>

    <!-- 移动端原生弹窗 -->
    <div v-else class="mobile-records-overlay" @click="$emit('close')" data-scrollable>
        <div class="mobile-records-container" :class="{ 'filters-expanded': filtersExpanded }" @click.stop>
            <!-- 移动端头部 -->
            <div class="mobile-records-header">
                <div class="header-drag-handle"></div>
                <div class="header-title-bar">
                    <h3>记录中心</h3>
                    <button class="mobile-close-btn" @click="$emit('close')">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </button>
                </div>
                <p class="header-subtitle">管理您的分析报告、消费记录和各类交易记录</p>
            </div>

            <!-- 移动端Tab导航 -->
            <div class="mobile-tabs">
                <div class="mobile-tab-nav">
                    <div class="mobile-tab-item" :class="{ active: activeTab === 'reports' }"
                        @click="activeTab = 'reports'">
                        <div class="tab-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3v18h18" stroke="currentColor" stroke-width="2" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" stroke-width="2"
                                    fill="none" />
                            </svg>
                        </div>
                        <span class="tab-text">分析报告</span>
                        <span v-if="reportsCount > 0" class="mobile-count-badge">{{ reportsCount }}</span>
                    </div>
                    <div class="mobile-tab-item" :class="{ active: activeTab === 'points' }"
                        @click="activeTab = 'points'">
                        <div class="tab-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                <path d="M16 8l-4 4-4-4" stroke="currentColor" stroke-width="2" fill="none" />
                            </svg>
                        </div>
                        <span class="tab-text">智点记录</span>
                        <span v-if="pointsRecordsCount > 0" class="mobile-count-badge">{{ pointsRecordsCount }}</span>
                    </div>
                    <div class="mobile-tab-item" :class="{ active: activeTab === 'trading' }"
                        @click="activeTab = 'trading'">
                        <div class="tab-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                                    stroke="currentColor" stroke-width="2" />
                            </svg>
                        </div>
                        <span class="tab-text">AI交易</span>
                        <span v-if="tradingRecordsCount > 0" class="mobile-count-badge">{{ tradingRecordsCount }}</span>
                    </div>
                    <div class="mobile-tab-item" :class="{ active: activeTab === 'userTrading' }"
                        @click="activeTab = 'userTrading'">
                        <div class="tab-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    stroke="currentColor" stroke-width="2" fill="none" />
                            </svg>
                        </div>
                        <span class="tab-text">自助交易</span>
                        <span v-if="userTradingRecordsCount > 0" class="mobile-count-badge">{{ userTradingRecordsCount
                        }}</span>
                    </div>
                </div>
            </div>

            <!-- 筛选器切换按钮 -->
            <div class="mobile-filter-toggle" @click="toggleFilters">
                <button class="filter-toggle-btn">
                    筛选
                    <span class="filter-toggle-icon" :class="{ expanded: filtersExpanded }">▼</span>
                </button>
            </div>

            <!-- 移动端内容 -->
            <div class="mobile-records-content">
                <!-- 量化分析报告 -->
                <div v-show="activeTab === 'reports'" class="mobile-tab-panel">
                    <QuantAnalysisReports />
                </div>

                <!-- 智点记录 -->
                <div v-show="activeTab === 'points'" class="mobile-tab-panel">
                    <SmartPointsRecords />
                </div>

                <!-- AI委托交易记录 -->
                <div v-show="activeTab === 'trading'" class="mobile-tab-panel">
                    <AITradingRecords />
                </div>

                <!-- 用户自助交易记录 -->
                <div v-show="activeTab === 'userTrading'" class="mobile-tab-panel">
                    <UserTradingRecords />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../store/user';
import { Close } from '@element-plus/icons-vue';
import QuantAnalysisReports from './QuantAnalysisReports.vue';
import SmartPointsRecords from './SmartPointsRecords.vue';
import AITradingRecords from './AITradingRecords.vue';
import UserTradingRecords from './UserTradingRecords.vue';

// 定义emit事件
const emit = defineEmits(['close']);

const userStore = useUserStore();

// 检测移动端
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

// 当前活跃的Tab
const activeTab = ref('reports');

// 筛选器展开状态
const filtersExpanded = ref(false);

// 切换筛选器展开状态
const toggleFilters = () => {
    filtersExpanded.value = !filtersExpanded.value;
};

// 暂时移除复杂修复

// 计算各类记录数量
const reportsCount = computed(() => userStore.quantAnalysisReports?.length || 0);
const pointsRecordsCount = computed(() => userStore.smartPointsTransactions?.length || 0);
const tradingRecordsCount = computed(() => userStore.aiTradingRecords?.length || 0);
const userTradingRecordsCount = computed(() => userStore.userTradingRecords?.length || 0);
</script>

<style scoped>
/* 滑入动画 */
@keyframes slideUpModal {
    from {
        opacity: 0;
        transform: translateY(100%);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

/* ================ PC端样式 ================ */
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

/* ================ 移动端原生弹窗样式 ================ */
.mobile-records-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.4) !important;
    z-index: 10100 !important;
    /* 提高z-index确保在移动端侧边栏上方显示 */
    display: flex !important;
    align-items: flex-end !important;
    justify-content: center !important;
    animation: fadeIn 0.2s ease-out !important;
}

.mobile-records-container {
    width: 100% !important;
    max-width: 100vw !important;
    height: 95vh !important;
    background: #ffffff !important;
    border-radius: 16px 16px 0 0 !important;
    overflow: hidden !important;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
    animation: slideUpModal 0.3s ease-out !important;
    display: flex !important;
    flex-direction: column !important;
}

/* 移动端头部 */
.mobile-records-header {
    flex-shrink: 0 !important;
    padding: 12px 20px 16px 20px !important;
    background: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.header-drag-handle {
    width: 40px !important;
    height: 4px !important;
    background: #d1d5db !important;
    border-radius: 2px !important;
    margin: 0 auto 16px auto !important;
}

.header-title-bar {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 8px !important;
}

.header-title-bar h3 {
    font-size: 1.125rem !important;
    font-weight: 600 !important;
    color: #18181b !important;
    margin: 0 !important;
}

.mobile-close-btn {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    background: #f8fafc !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #6b7280 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.mobile-close-btn:active {
    background: #f1f5f9 !important;
    transform: scale(0.95) !important;
}

.header-subtitle {
    font-size: 0.8rem !important;
    color: #6b7280 !important;
    margin: 0 !important;
    line-height: 1.4 !important;
}

/* 移动端Tab导航优化 - 减少高度 */
.mobile-tabs {
    flex-shrink: 0 !important;
    background: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 0 16px !important;
}

.mobile-tab-nav {
    display: flex !important;
    gap: 0 !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}

.mobile-tab-nav::-webkit-scrollbar {
    display: none !important;
}

.mobile-tab-item {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 8px 12px 10px 12px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    border-bottom: 2px solid transparent !important;
    white-space: nowrap !important;
    position: relative !important;
    min-width: auto !important;
}

.mobile-tab-item.active {
    color: #3b82f6 !important;
    border-bottom-color: #3b82f6 !important;
}

.mobile-tab-item:not(.active) {
    color: #6b7280 !important;
}

.mobile-tab-item:active {
    background: rgba(59, 130, 246, 0.05) !important;
    transform: scale(0.98) !important;
}

.tab-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 16px !important;
    height: 16px !important;
}

.tab-text {
    font-size: 0.8rem !important;
    font-weight: 500 !important;
    text-align: center !important;
}

.mobile-count-badge {
    position: static !important;
    background: #3b82f6 !important;
    color: white !important;
    font-size: 0.6rem !important;
    font-weight: 600 !important;
    padding: 1px 4px !important;
    border-radius: 8px !important;
    min-width: 14px !important;
    height: 14px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
    margin-left: 2px !important;
}

/* 移动端筛选器 - 简化设计，可折叠 */
.mobile-records-container :deep(.reports-filters),
.mobile-records-container :deep(.points-filters),
.mobile-records-container :deep(.trading-filters),
.mobile-records-container :deep(.records-filters) {
    padding: 0 !important;
    margin-bottom: 0 !important;
    border-bottom: none !important;
    flex-shrink: 0 !important;
    background: #ffffff !important;
    max-height: 0 !important;
    overflow: hidden !important;
    transition: max-height 0.3s ease !important;
    position: relative !important;
    z-index: 1 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* 展开状态的筛选器 */
.mobile-records-container.filters-expanded :deep(.reports-filters),
.mobile-records-container.filters-expanded :deep(.points-filters),
.mobile-records-container.filters-expanded :deep(.trading-filters),
.mobile-records-container.filters-expanded :deep(.records-filters) {
    max-height: 350px !important;
    border-bottom: 1px solid #f1f5f9 !important;
    overflow-y: auto !important;
    padding-top: 8px !important;
}

.mobile-records-container :deep(.filters-row) {
    padding: 8px 16px 16px 16px !important;
    background: #fafbfc !important;
    border: none !important;
    border-radius: 0 !important;
    flex-direction: column !important;
    gap: 8px !important;
}

/* 筛选器切换按钮 */
.mobile-filter-toggle {
    padding: 12px 16px !important;
    background: #ffffff !important;
    border-bottom: 1px solid #f1f5f9 !important;
    border-top: 1px solid #f1f5f9 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    flex-shrink: 0 !important;
    z-index: 10 !important;
    position: relative !important;
}

.mobile-filter-toggle:active {
    background: #f8fafc !important;
}

.filter-toggle-btn {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 0.75rem !important;
    color: #6b7280 !important;
    background: none !important;
    border: none !important;
    cursor: pointer !important;
}

.filter-toggle-icon {
    font-size: 0.8rem !important;
    transition: transform 0.2s ease !important;
}

.filter-toggle-icon.expanded {
    transform: rotate(180deg) !important;
}

/* 移动端筛选组简化 */
.mobile-records-container :deep(.filter-group) {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 4px !important;
    padding: 6px 8px !important;
    background: white !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
    margin-bottom: 3px !important;
}

/* 最后一个筛选组（重置按钮组）特殊样式 */
.mobile-records-container :deep(.filter-group:last-child) {
    background: transparent !important;
    border: none !important;
    padding: 4px 0 2px 0 !important;
    margin-bottom: 0 !important;
}

.mobile-records-container :deep(.filter-label) {
    font-size: 0.7rem !important;
    color: #6b7280 !important;
    font-weight: 500 !important;
    min-width: auto !important;
    flex-shrink: 0 !important;
    margin: 0 0 2px 0 !important;
}

/* 移动端时间控件原生化 - 修复显示问题 */
.mobile-records-container :deep(.filter-date) {
    width: 100% !important;
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.filter-date .el-date-editor) {
    width: 100% !important;
    height: 36px !important;
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.filter-date .el-input__wrapper) {
    background: #f8fafc !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    padding: 0 10px !important;
    height: 36px !important;
    border-radius: 6px !important;
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.filter-date .el-input__inner) {
    font-size: 0.8rem !important;
    color: #374151 !important;
    height: 36px !important;
    line-height: 36px !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    text-align: center !important;
}

.mobile-records-container :deep(.filter-date .el-range-separator) {
    color: #9ca3af !important;
    font-size: 0.7rem !important;
}

.mobile-records-container :deep(.filter-date .el-range-input) {
    background: transparent !important;
    color: #374151 !important;
    font-size: 0.8rem !important;
}

/* 其他表单控件优化 */
.mobile-records-container :deep(.filter-select),
.mobile-records-container :deep(.filter-search) {
    width: 100% !important;
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.filter-select .el-input__wrapper),
.mobile-records-container :deep(.filter-search .el-input__wrapper) {
    background: #f8fafc !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: none !important;
    padding: 0 10px !important;
    height: 36px !important;
    border-radius: 6px !important;
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.filter-select .el-input__inner),
.mobile-records-container :deep(.filter-search .el-input__inner) {
    font-size: 0.8rem !important;
    color: #374151 !important;
    height: 36px !important;
    line-height: 36px !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
}

.mobile-records-container :deep(.filter-select .el-input__suffix),
.mobile-records-container :deep(.filter-search .el-input__prefix) {
    display: flex !important;
    align-items: center !important;
    color: #9ca3af !important;
}

/* Element Plus 移动端修复 - 简化样式 */
.mobile-records-container :deep(.el-select),
.mobile-records-container :deep(.el-date-editor) {
    position: static !important;
    z-index: auto !important;
}

.mobile-records-container :deep(.el-input__wrapper) {
    position: static !important;
    z-index: auto !important;
}

/* 移动端筛选器表单项间距 */
.mobile-records-container :deep(.filter-group) {
    margin-bottom: 8px !important;
}

/* 移动端基本修复 */

/* 重置按钮优化 */
.mobile-records-container :deep(.pc-filter-btn) {
    height: 32px !important;
    padding: 0 16px !important;
    font-size: 0.75rem !important;
    border-radius: 6px !important;
    background: #f1f5f9 !important;
    border: 1px solid #d1d5db !important;
    color: #374151 !important;
    width: 100% !important;
    margin-top: 6px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.mobile-records-container :deep(.pc-filter-btn:hover) {
    background: #e5e7eb !important;
    border-color: #9ca3af !important;
}

.mobile-records-container :deep(.pc-filter-btn:active) {
    background: #d1d5db !important;
    transform: scale(0.98) !important;
}

/* 移动端内容列表区域 */
.mobile-records-container :deep(.reports-list),
.mobile-records-container :deep(.points-list),
.mobile-records-container :deep(.trading-list),
.mobile-records-container :deep(.records-list) {
    flex: 1 !important;
    overflow-y: auto !important;
    padding: 0 16px 16px 16px !important;
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: smooth !important;
    margin-top: 8px !important;
    position: static !important;
}

/* 移动端容器简化 */
.mobile-records-container {
    position: relative !important;
}

.mobile-records-content {
    position: relative !important;
}

/* 移动端网格布局优化 */
.mobile-records-container :deep(.reports-grid),
.mobile-records-container :deep(.records-grid) {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    padding: 0 !important;
    position: relative !important;
    z-index: 1 !important;
}

/* 移动端卡片样式 */
.mobile-records-container :deep(.report-card),
.mobile-records-container :deep(.record-card) {
    padding: 12px !important;
    border-radius: 8px !important;
    background: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    position: relative !important;
    z-index: 1 !important;
}

.mobile-records-container :deep(.report-card:active),
.mobile-records-container :deep(.record-card:active) {
    transform: scale(0.98) !important;
    background: #f8fafc !important;
}

.mobile-records-container :deep(.report-header) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-bottom: 8px !important;
}

.mobile-records-container :deep(.report-type .el-tag) {
    font-size: 0.65rem !important;
    padding: 2px 6px !important;
    height: auto !important;
}

.mobile-records-container :deep(.report-actions .el-button) {
    padding: 4px !important;
    width: 24px !important;
    height: 24px !important;
}

.mobile-records-container :deep(.report-content) {
    margin-bottom: 8px !important;
}

.mobile-records-container :deep(.report-title) {
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #374151 !important;
    margin: 0 0 6px 0 !important;
    line-height: 1.3 !important;
}

.mobile-records-container :deep(.report-info) {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
    margin-bottom: 6px !important;
}

.mobile-records-container :deep(.report-info .info-item) {
    display: flex !important;
    align-items: center !important;
    font-size: 0.7rem !important;
}

.mobile-records-container :deep(.report-info .label) {
    color: #9ca3af !important;
    margin-right: 4px !important;
    min-width: 50px !important;
}

.mobile-records-container :deep(.report-info .value) {
    color: #374151 !important;
    flex: 1 !important;
}

.mobile-records-container :deep(.report-info .cost) {
    color: #3b82f6 !important;
    font-weight: 500 !important;
}

.mobile-records-container :deep(.report-summary) {
    font-size: 0.7rem !important;
    color: #6b7280 !important;
    line-height: 1.4 !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
}

.mobile-records-container :deep(.report-footer) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding-top: 6px !important;
    border-top: 1px solid #f1f5f9 !important;
}

.mobile-records-container :deep(.report-status) {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 0.7rem !important;
    color: #10b981 !important;
}

.mobile-records-container :deep(.report-size) {
    font-size: 0.65rem !important;
    color: #9ca3af !important;
}

/* 移动端记录项样式优化 */
.mobile-records-container :deep(.record-item) {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
    padding: 12px !important;
    background: white !important;
    border-radius: 8px !important;
    border: 1px solid #e5e7eb !important;
    margin-bottom: 8px !important;
    transition: all 0.2s ease !important;
}

.mobile-records-container :deep(.record-item:active) {
    transform: scale(0.98) !important;
    background: #f8fafc !important;
}

/* 移动端汇总信息优化 */
.mobile-records-container :deep(.records-stats) {
    margin: 12px 16px !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    gap: 6px !important;
    -webkit-overflow-scrolling: touch !important;
    grid-template-columns: none !important;
}

.mobile-records-container :deep(.stat-item) {
    flex: 0 0 auto !important;
    min-width: 68px !important;
    background: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 6px !important;
    padding: 6px 8px !important;
    text-align: center !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03) !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
}

.mobile-records-container :deep(.stat-label) {
    font-size: 9px !important;
    color: #6b7280 !important;
    margin-bottom: 1px !important;
    white-space: nowrap !important;
    line-height: 1.2 !important;
}

.mobile-records-container :deep(.stat-value) {
    font-size: 11px !important;
    font-weight: 600 !important;
    color: #374151 !important;
    white-space: nowrap !important;
    line-height: 1.2 !important;
}

.mobile-records-container :deep(.stat-value.consume) {
    color: #dc2626 !important;
}

.mobile-records-container :deep(.stat-value.recharge) {
    color: #059669 !important;
}

.mobile-records-container :deep(.stat-value.profit) {
    color: #059669 !important;
}

.mobile-records-container :deep(.stat-value.loss) {
    color: #dc2626 !important;
}

/* AI交易记录移动端优化 */
.mobile-records-container :deep(.ai-trading-records .record-item) {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    padding: 14px !important;
}

.mobile-records-container :deep(.record-header) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 8px !important;
    padding-bottom: 8px !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.mobile-records-container :deep(.stock-info) {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
}

.mobile-records-container :deep(.stock-name) {
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    color: #374151 !important;
    line-height: 1.3 !important;
}

.mobile-records-container :deep(.stock-code) {
    font-size: 0.7rem !important;
    color: #9ca3af !important;
    background: #f3f4f6 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    align-self: flex-start !important;
}

.mobile-records-container :deep(.trade-status) {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 0.7rem !important;
    font-weight: 500 !important;
    padding: 3px 8px !important;
    border-radius: 12px !important;
    flex-shrink: 0 !important;
}

.mobile-records-container :deep(.trade-status.pending) {
    color: #d97706 !important;
    background: #fef3c7 !important;
}

.mobile-records-container :deep(.trade-status.completed) {
    color: #059669 !important;
    background: #d1fae5 !important;
}

.mobile-records-container :deep(.trade-status.cancelled) {
    color: #6b7280 !important;
    background: #f3f4f6 !important;
}

.mobile-records-container :deep(.trade-status.failed) {
    color: #dc2626 !important;
    background: #fee2e2 !important;
}

.mobile-records-container :deep(.status-dot) {
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: currentColor !important;
}

/* 移动端交易详情优化 */
.mobile-records-container :deep(.record-content) {
    flex: 1 !important;
    min-width: 0 !important;
}

.mobile-records-container :deep(.trade-details) {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6px 12px !important;
    margin-bottom: 8px !important;
}

.mobile-records-container :deep(.detail-row) {
    display: flex !important;
    flex-direction: column !important;
    gap: 1px !important;
}

.mobile-records-container :deep(.detail-row .label) {
    font-size: 0.65rem !important;
    color: #9ca3af !important;
    font-weight: 400 !important;
}

.mobile-records-container :deep(.detail-row .value) {
    font-size: 0.75rem !important;
    color: #374151 !important;
    font-weight: 500 !important;
}

.mobile-records-container :deep(.detail-row .value.amount) {
    font-weight: 600 !important;
    color: #1f2937 !important;
}

.mobile-records-container :deep(.detail-row .value.buy) {
    color: #dc2626 !important;
}

.mobile-records-container :deep(.detail-row .value.sell) {
    color: #059669 !important;
}

.mobile-records-container :deep(.detail-row .value.profit) {
    color: #059669 !important;
    font-weight: 600 !important;
}

.mobile-records-container :deep(.detail-row .value.loss) {
    color: #dc2626 !important;
    font-weight: 600 !important;
}

/* AI分析区域移动端优化 */
.mobile-records-container :deep(.ai-analysis) {
    margin-top: 8px !important;
    padding: 8px !important;
    background: #f8fafc !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
}

.mobile-records-container :deep(.analysis-header) {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 0.7rem !important;
    font-weight: 500 !important;
    color: #6b7280 !important;
    margin-bottom: 4px !important;
}

.mobile-records-container :deep(.analysis-header svg) {
    width: 12px !important;
    height: 12px !important;
}

.mobile-records-container :deep(.analysis-content) {
    font-size: 0.7rem !important;
    color: #374151 !important;
    line-height: 1.4 !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
}

/* 移动端记录底部信息 */
.mobile-records-container :deep(.record-footer) {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-top: 8px !important;
    padding-top: 8px !important;
    border-top: 1px solid #f1f5f9 !important;
}

.mobile-records-container :deep(.time-info) {
    display: flex !important;
    flex-direction: column !important;
    gap: 1px !important;
}

.mobile-records-container :deep(.executed-time),
.mobile-records-container :deep(.created-time) {
    font-size: 0.65rem !important;
    color: #9ca3af !important;
}

.mobile-records-container :deep(.actions) {
    display: flex !important;
    gap: 6px !important;
}

.mobile-records-container :deep(.pc-cancel-btn) {
    height: 24px !important;
    padding: 0 8px !important;
    font-size: 0.65rem !important;
    border-radius: 12px !important;
}

/* 移动端分页样式修复 */
.mobile-records-container :deep(.reports-pagination),
.mobile-records-container :deep(.records-pagination) {
    padding: 12px 16px !important;
    border-top: 1px solid #f1f5f9 !important;
    background: #ffffff !important;
    flex-shrink: 0 !important;
}

.mobile-records-container :deep(.el-pagination) {
    justify-content: center !important;
}

.mobile-records-container :deep(.el-pagination .el-pager li),
.mobile-records-container :deep(.el-pagination .btn-prev),
.mobile-records-container :deep(.el-pagination .btn-next) {
    width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 0.75rem !important;
    border-radius: 50% !important;
    margin: 0 2px !important;
}

.mobile-records-container :deep(.el-pagination .el-pagination__total),
.mobile-records-container :deep(.el-pagination .el-pagination__jump) {
    font-size: 0.7rem !important;
    color: #6b7280 !important;
}

/* 移动端统计信息样式 */
.mobile-records-container :deep(.records-stats) {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    padding: 12px 16px !important;
    background: #f8fafc !important;
    border-top: 1px solid #f1f5f9 !important;
    flex-shrink: 0 !important;
}

.mobile-records-container :deep(.stat-item) {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    padding: 8px !important;
    background: white !important;
    border-radius: 6px !important;
    border: 1px solid #e5e7eb !important;
}

.mobile-records-container :deep(.stat-label) {
    font-size: 0.65rem !important;
    color: #9ca3af !important;
    margin-bottom: 2px !important;
}

.mobile-records-container :deep(.stat-value) {
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    color: #374151 !important;
}

.mobile-records-container :deep(.stat-value.consume) {
    color: #ef4444 !important;
}

.mobile-records-container :deep(.stat-value.recharge) {
    color: #10b981 !important;
}

.mobile-records-container :deep(.stat-value.profit) {
    color: #10b981 !important;
}

.mobile-records-container :deep(.stat-value.loss) {
    color: #ef4444 !important;
}

/* 移动端对话框适配 */
.mobile-records-container :deep(.report-detail-dialog) {
    width: 95vw !important;
    max-width: none !important;
    margin: 2.5vh auto !important;
    max-height: 90vh !important;
    border-radius: 12px !important;
}

.mobile-records-container :deep(.report-detail-dialog .el-dialog__header) {
    padding: 12px 16px !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.mobile-records-container :deep(.report-detail-dialog .el-dialog__title) {
    font-size: 1rem !important;
    font-weight: 600 !important;
}

.mobile-records-container :deep(.report-detail-dialog .el-dialog__body) {
    padding: 16px !important;
    max-height: calc(90vh - 120px) !important;
    overflow-y: auto !important;
}

/* 移动端内容区域优化 */
.mobile-records-content {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    background: #ffffff !important;
}





/* 移动端筛选器在展开时调整顺序 - 显示在内容上方 */
.mobile-records-container.filters-expanded .mobile-tab-panel:not([style*="display: none"]) :deep(.reports-filters),
.mobile-records-container.filters-expanded .mobile-tab-panel:not([style*="display: none"]) :deep(.points-filters),
.mobile-records-container.filters-expanded .mobile-tab-panel:not([style*="display: none"]) :deep(.trading-filters) {
    order: -1 !important;
    margin-bottom: 12px !important;
}

/* 确保移动端tab面板在筛选器展开时使用flex布局 */
.mobile-records-container.filters-expanded .mobile-tab-panel:not([style*="display: none"]) {
    display: flex !important;
    flex-direction: column !important;
}

/* 移动端tab面板基础样式 */
.mobile-tab-panel {
    flex: 1 !important;
    overflow: hidden !important;
    width: 100% !important;
    height: 100% !important;
}

/* 只对显示的tab面板应用flex布局 */
.mobile-tab-panel:not([style*="display: none"]) {
    display: flex !important;
    flex-direction: column !important;
}

/* 移动端子组件样式覆盖 - 只针对可见的面板 */
.mobile-records-container .mobile-tab-panel:not([style*="display: none"]) :deep(.quant-reports),
.mobile-records-container .mobile-tab-panel:not([style*="display: none"]) :deep(.smart-points-records),
.mobile-records-container .mobile-tab-panel:not([style*="display: none"]) :deep(.ai-trading-records) {
    padding: 0 !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
}

/* 移动端头部重新设计 - 更加紧凑 */
.mobile-records-container :deep(.reports-header),
.mobile-records-container :deep(.points-header),
.mobile-records-container :deep(.trading-header) {
    padding: 8px 16px !important;
    margin-bottom: 0 !important;
    border-bottom: 1px solid #f1f5f9 !important;
    flex-shrink: 0 !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 6px !important;
    min-height: 50px !important;
}

.mobile-records-container :deep(.header-left) {
    order: 1 !important;
}

.mobile-records-container :deep(.header-left h3) {
    font-size: 0.85rem !important;
    margin: 0 !important;
    color: #374151 !important;
    font-weight: 600 !important;
}

.mobile-records-container :deep(.header-left p) {
    font-size: 0.65rem !important;
    color: #9ca3af !important;
    margin: 2px 0 0 0 !important;
    line-height: 1.2 !important;
}

.mobile-records-container :deep(.header-right) {
    order: 2 !important;
    gap: 6px !important;
    justify-content: flex-start !important;
}

/* 移动端按钮重新设计 - 更小尺寸 */
.mobile-records-container :deep(.pc-action-btn) {
    height: 28px !important;
    padding: 0 10px !important;
    font-size: 0.7rem !important;
    border-radius: 14px !important;
    background: #3b82f6 !important;
    border: none !important;
    color: white !important;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.2) !important;
    transition: all 0.2s ease !important;
}

.mobile-records-container :deep(.pc-action-btn:hover) {
    background: #2563eb !important;
    transform: none !important;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
}

.mobile-records-container :deep(.pc-action-btn .el-icon) {
    font-size: 0.75rem !important;
    margin-right: 3px !important;
}

/* 移动端空状态重新设计 */
.mobile-records-container :deep(.empty-state) {
    height: 200px !important;
    padding: 32px 20px !important;
    background: white !important;
    margin: 12px 16px !important;
    border-radius: 8px !important;
    border: 1px solid #f3f4f6 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
}

.mobile-records-container :deep(.empty-icon) {
    font-size: 2rem !important;
    margin-bottom: 8px !important;
    opacity: 0.6 !important;
}

.mobile-records-container :deep(.empty-text h3),
.mobile-records-container :deep(.empty-text h4) {
    font-size: 0.9rem !important;
    margin-bottom: 4px !important;
    color: #374151 !important;
}

.mobile-records-container :deep(.empty-text p) {
    font-size: 0.75rem !important;
    color: #9ca3af !important;
    text-align: center !important;
    line-height: 1.4 !important;
}

/* 智点记录和简单记录项移动端优化 */
.mobile-records-container :deep(.smart-points-records .record-item) {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 12px !important;
}

.mobile-records-container :deep(.record-icon) {
    flex-shrink: 0 !important;
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    background: #f8fafc !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.mobile-records-container :deep(.record-content) {
    flex: 1 !important;
    min-width: 0 !important;
}

.mobile-records-container :deep(.record-title) {
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #374151 !important;
    margin: 0 0 2px 0 !important;
    line-height: 1.3 !important;
}

.mobile-records-container :deep(.record-time) {
    font-size: 0.7rem !important;
    color: #9ca3af !important;
    line-height: 1.2 !important;
}

.mobile-records-container :deep(.record-amount) {
    flex-shrink: 0 !important;
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    text-align: right !important;
}

.mobile-records-container :deep(.record-amount.consume) {
    color: #ef4444 !important;
}

.mobile-records-container :deep(.record-amount.recharge) {
    color: #10b981 !important;
}
</style>
