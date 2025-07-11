<template>
    <!-- 移动端底部弹起样式 -->
    <div v-if="isMobile && dialogVisible" class="mobile-modal-overlay" @click="handleClose">
        <div class="mobile-modal-container" @click.stop>
            <div class="mobile-modal-header">
                <div class="header-drag-handle"></div>
                <div class="header-title-bar">
                    <h3>{{ dialogTitle }}</h3>
                    <button class="mobile-close-btn" @click="handleClose">
                        <el-icon>
                            <Close />
                        </el-icon>
                    </button>
                </div>
            </div>
            <div class="mobile-modal-content">
                <div v-if="record" class="record-detail-content">
                    <!-- 基本信息 -->
                    <div class="detail-section">
                        <h4 class="section-title">基本信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>股票名称</label>
                                <span>{{ record.name  }}</span>
                            </div>
                            <div class="detail-item">
                                <label>股票代码</label>
                                <span>{{ record.code  }}</span>
                            </div>
                            <div class="detail-item">
                                <label>交易类型</label>
                                <el-tag :type="getTradeTypeTag(record.type)" size="small">
                                    {{ record.type === 'buy' ? '买入' : '卖出' }}
                                </el-tag>
                            </div>
                            <div class="detail-item">
                                <label>交易状态</label>
                                <el-tag :type="getStatusTag(record.status)" size="small">
                                    {{ getStatusText(record.status) }}
                                </el-tag>
                            </div>
                        </div>
                    </div>

                    <!-- 交易信息 -->
                    <div class="detail-section">
                        <h4 class="section-title">交易信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>交易数量</label>
                                <span>{{ record.quantity }}股</span>
                            </div>
                            <div class="detail-item">
                                <label>{{ record.price ? '成交价格' : '预期价格' }}</label>
                                <span>¥{{ record.price }}</span>
                            </div>
                            <div class="detail-item">
                                <label>交易金额</label>
                                <span class="amount">¥{{ record.price*record.quantity }}</span>
                            </div>
                            <div v-if="record.fee !== undefined" class="detail-item">
                                <label>手续费</label>
                                <span>¥{{ record.fee?.toFixed(2) }}</span>
                            </div>
                            <div v-if="record.profit !== undefined" class="detail-item">
                                <label>盈亏</label>
                                <span :class="{ 'profit': record.profit > 0, 'loss': record.profit < 0 }">
                                    {{ record.profit > 0 ? '+' : '' }}¥{{ record.profit?.toFixed(2) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 时间信息 -->
                    <div class="detail-section">
                        <h4 class="section-title">时间信息</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>{{ isAIRecord ? '创建时间' : '执行时间' }}</label>
                                <span>{{ formatDetailTime(record.createTime || record.executedAt) }}</span>
                            </div>
                            <div v-if="record.executedAt && isAIRecord" class="detail-item">
                                <label>执行时间</label>
                                <span>{{ formatDetailTime(record.executedAt) }}</span>
                            </div>
                            <div v-if="record.updatedAt" class="detail-item">
                                <label>更新时间</label>
                                <span>{{ formatDetailTime(record.updatedAt) }}</span>
                            </div>
                            <div v-if="isAIRecord && record.status === 'pending' && record.validityDate"
                                class="detail-item">
                                <label>委托时效</label>
                                <span :class="getValidityStatusClass(record.validityDate)">
                                    {{ formatValidityDate(record.validityDate) }}
                                </span>
                            </div>
                            <div v-if="isAIRecord && record.status === 'cancelled' && record.cancelledAt"
                                class="detail-item">
                                <label>撤销时间</label>
                                <span>{{ formatDetailTime(record.cancelledAt) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- AI分析信息 (仅AI记录) -->
                    <div v-if="isAIRecord && record.analysis" class="detail-section">
                        <h4 class="section-title">AI分析</h4>
                        <div class="analysis-content">
                            <p>{{ record.analysis }}</p>
                        </div>
                    </div>

                    <!-- 备注信息 -->
                    <div v-if="record.note || record.reason" class="detail-section">
                        <h4 class="section-title">{{ record.note ? '备注' : '交易原因' }}</h4>
                        <div class="note-content">
                            <p>{{ record.note || record.reason }}</p>
                        </div>
                    </div>

                    <!-- 操作记录 -->
                    <div v-if="record.operationHistory && record.operationHistory.length > 0" class="detail-section">
                        <h4 class="section-title">操作记录</h4>
                        <div class="operation-history">
                            <div v-for="(operation, index) in record.operationHistory" :key="index"
                                class="operation-item">
                                <div class="operation-time">{{ formatDetailTime(operation.timestamp) }}</div>
                                <div class="operation-action">{{ operation.action }}</div>
                                <div v-if="operation.note" class="operation-note">{{ operation.note }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mobile-modal-footer">
                <el-button @click="handleClose">关闭</el-button>
                <el-button v-if="record?.status === 'pending'" type="danger" @click="handleCancel">
                    撤单
                </el-button>
            </div>
        </div>
    </div>

    <!-- PC端标准对话框 -->
    <el-dialog v-else v-model="dialogVisible" :title="dialogTitle" width="600px" :before-close="handleClose"
        class="trading-record-detail-modal">
        <div v-if="record" class="record-detail-content">
            <!-- 基本信息 -->
            <div class="detail-section">
                <h4 class="section-title">基本信息</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>股票名称</label>
                        <span>{{ record.name  }}</span>
                    </div>
                    <div class="detail-item">
                        <label>股票代码</label>
                        <span>{{ record.code }}</span>
                    </div>
                    <div class="detail-item">
                        <label>交易类型</label>
                        <el-tag :type="getTradeTypeTag(record.type)" size="small">
                            {{ record.type === 'buy' ? '买入' : '卖出' }}
                        </el-tag>
                    </div>
                    <div class="detail-item">
                        <label>交易状态</label>
                        <el-tag :type="getStatusTag(record.status)" size="small">
                            {{ getStatusText(record.status) }}
                        </el-tag>
                    </div>
                </div>
            </div>

            <!-- 交易信息 -->
            <div class="detail-section">
                <h4 class="section-title">交易信息</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>交易数量</label>
                        <span>{{ record.quantity }}股</span>
                    </div>
                    <div class="detail-item">
                        <label>{{ record.price ? '成交价格' : '预期价格' }}</label>
                        <span>¥{{ record.price  }}</span>
                    </div>
                    <div class="detail-item">
                        <label>交易金额</label>
                        <span class="amount">¥{{ record.price*record.quantity }}</span>
                    </div>
                    <div v-if="record.fee !== undefined" class="detail-item">
                        <label>手续费</label>
                        <span>¥{{ record.fee?.toFixed(2) }}</span>
                    </div>
                    <div v-if="record.profit !== undefined" class="detail-item">
                        <label>盈亏</label>
                        <span :class="{ 'profit': record.profit > 0, 'loss': record.profit < 0 }">
                            {{ record.profit > 0 ? '+' : '' }}¥{{ record.profit?.toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 时间信息 -->
            <div class="detail-section">
                <h4 class="section-title">时间信息</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>{{ isAIRecord ? '创建时间' : '执行时间' }}</label>
                        <span>{{ formatDetailTime(record.createTime || record.executedAt) }}</span>
                    </div>
                    <div v-if="record.executedAt && isAIRecord" class="detail-item">
                        <label>执行时间</label>
                        <span>{{ formatDetailTime(record.executedAt) }}</span>
                    </div>
                    <div v-if="record.updatedAt" class="detail-item">
                        <label>更新时间</label>
                        <span>{{ formatDetailTime(record.updatedAt) }}</span>
                    </div>
                    <div v-if="isAIRecord && record.status === 'pending' && record.validityDate" class="detail-item">
                        <label>委托时效</label>
                        <span :class="getValidityStatusClass(record.validityDate)">
                            {{ formatValidityDate(record.validityDate) }}
                        </span>
                    </div>
                    <div v-if="record.status === 'cancelled' && record.cancelledAt" class="detail-item">
                        <label>撤销时间</label>
                        <span>{{ formatDetailTime(record.cancelledAt) }}</span>
                    </div>
                </div>
            </div>

            <!-- AI分析信息 (仅AI记录) -->
            <div v-if="isAIRecord && record.analysis" class="detail-section">
                <h4 class="section-title">AI分析</h4>
                <div class="analysis-content">
                    <p>{{ record.analysis }}</p>
                </div>
            </div>

            <!-- 备注信息 -->
            <div v-if="record.note || record.reason" class="detail-section">
                <h4 class="section-title">{{ record.note ? '备注' : '交易原因' }}</h4>
                <div class="note-content">
                    <p>{{ record.note || record.reason }}</p>
                </div>
            </div>

            <!-- 操作记录 -->
            <div v-if="record.operationHistory && record.operationHistory.length > 0" class="detail-section">
                <h4 class="section-title">操作记录</h4>
                <div class="operation-history">
                    <div v-for="(operation, index) in record.operationHistory" :key="index" class="operation-item">
                        <div class="operation-time">{{ formatDetailTime(operation.timestamp) }}</div>
                        <div class="operation-action">{{ operation.action }}</div>
                        <div v-if="operation.note" class="operation-note">{{ operation.note }}</div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">关闭</el-button>
                <el-button v-if="record?.status === 'pending'" type="danger" @click="handleCancel">
                    撤单
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElDialog, ElTag, ElButton, ElMessage, ElIcon } from 'element-plus';
import { Close } from '@element-plus/icons-vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    record: {
        type: Object,
        default: null
    },
    recordType: {
        type: String,
        default: 'user', // 'user' | 'ai'
        validator: (value) => ['user', 'ai'].includes(value)
    }
});

const emit = defineEmits(['update:visible', 'cancel-record']);

const dialogVisible = ref(false);
const isMobile = ref(false);

// 检测移动端
const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
    window.removeEventListener('resize', checkMobile);
});

// 是否为AI记录
const isAIRecord = computed(() => props.recordType === 'ai');

// 弹窗标题
const dialogTitle = computed(() => {
    if (!props.record) return '交易详情';
    const typeText = isAIRecord.value ? 'AI委托' : '自助';
    const actionText = props.record.type === 'buy' ? '买入' : '卖出';
    const stockName = props.record.name 
    return `${typeText}${actionText} - ${stockName}`;
});

// 监听visible变化
watch(() => props.visible, (newVal) => {
    dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
    if (!newVal) {
        emit('update:visible', false);
    }
});

// 获取交易类型标签类型
const getTradeTypeTag = (type) => {
    return type === 'buy' ? 'danger' : 'success';
};

// 获取状态标签类型
const getStatusTag = (status) => {
    const statusMap = {
        'completed': 'success',
        'pending': 'warning',
        'cancelled': 'info',
        'failed': 'danger'
    };
    return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
    const statusMap = {
        'completed': '已完成',
        'pending': isAIRecord.value ? '待成交' : '进行中',
        'cancelled': isAIRecord.value ? '已撤单' : '已取消',
        'failed': '失败'
    };
    return statusMap[status] || status;
};

// 格式化详细时间
const formatDetailTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

// 格式化委托时效显示
const formatValidityDate = (validityDate) => {
    if (!validityDate) return '无期限';

    const validity = new Date(validityDate);
    const now = new Date();
    const diffTime = validity - now;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    if (diffTime < 0) {
        return '已过期';
    } else if (diffHours === 0) {
        if (diffMinutes <= 0) {
            return '即将过期';
        } else {
            return `${diffMinutes}分钟后过期`;
        }
    } else if (diffHours < 24) {
        return `${diffHours}小时${diffMinutes}分钟后过期`;
    } else {
        const diffDays = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        return `${diffDays}天${remainingHours}小时后过期`;
    }
};

// 获取委托时效状态样式类
const getValidityStatusClass = (validityDate) => {
    if (!validityDate) return '';

    const validity = new Date(validityDate);
    const now = new Date();
    const diffTime = validity - now;
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffTime < 0) {
        return 'expired';
    } else if (diffHours <= 2) {
        return 'expiring-soon';
    } else {
        return 'valid';
    }
};

// 关闭弹窗
const handleClose = () => {
    dialogVisible.value = false;
};

// 取消交易/撤单
const handleCancel = () => {
    if (!props.record) return;

    emit('cancel-record', props.record);
    handleClose();
};
</script>

<style scoped>
.trading-record-detail-modal .record-detail-content {
    max-height: 600px;
    overflow-y: auto;
}

.trading-record-detail-modal .detail-section {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
}

.trading-record-detail-modal .detail-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.trading-record-detail-modal .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.trading-record-detail-modal .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.trading-record-detail-modal .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.trading-record-detail-modal .detail-item label {
    font-size: 12px;
    color: #666;
    font-weight: 500;
}

.trading-record-detail-modal .detail-item span {
    font-size: 14px;
    color: #333;
}

.trading-record-detail-modal .amount {
    font-weight: 600;
    color: #333;
}

.trading-record-detail-modal .profit {
    color: #52c41a;
    font-weight: 600;
}

.trading-record-detail-modal .loss {
    color: #ff4d4f;
    font-weight: 600;
}

.trading-record-detail-modal .analysis-content,
.trading-record-detail-modal .note-content {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #1890ff;
}

.trading-record-detail-modal .analysis-content p,
.trading-record-detail-modal .note-content p {
    margin: 0;
    line-height: 1.6;
    color: #333;
}

.trading-record-detail-modal .operation-history {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.trading-record-detail-modal .operation-item {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #52c41a;
}

.trading-record-detail-modal .operation-time {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.trading-record-detail-modal .operation-action {
    font-size: 14px;
    color: #333;
    font-weight: 500;
    margin-bottom: 4px;
}

.trading-record-detail-modal .operation-note {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
}

.trading-record-detail-modal .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

/* 移动端底部弹起样式 */
.mobile-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.mobile-modal-container {
    width: 100%;
    max-height: 95vh;
    background: #ffffff;
    border-radius: 16px 16px 0 0;
    overflow: hidden;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    animation: slideUpModal 0.3s ease-out;
    display: flex;
    flex-direction: column;
}

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

.mobile-modal-header {
    flex-shrink: 0;
    padding: 12px 20px 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
}

.header-drag-handle {
    width: 40px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 0 auto 16px auto;
}

.header-title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-title-bar h3 {
    font-size: 15px;
    font-weight: 600;
    color: #18181b;
    margin: 0;
}

.mobile-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f8fafc;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mobile-close-btn:active {
    background: #f1f5f9;
    transform: scale(0.95);
}

.mobile-modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
    -webkit-overflow-scrolling: touch;
}

.mobile-modal-footer {
    flex-shrink: 0;
    padding: 12px 16px;
    background: #fafafa;
    border-top: 1px solid #f1f5f9;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.mobile-modal-footer .el-button {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
}

/* 移动端详情项优化 - 底部弹起样式 */
.mobile-modal-container .detail-section {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.mobile-modal-container .detail-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.mobile-modal-container .section-title {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #18181b;
}

.mobile-modal-container .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}

.mobile-modal-container .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    border: 1px solid rgba(229, 231, 235, 0.5);
    min-height: 32px;
}

.mobile-modal-container .detail-item label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    line-height: 1.2;
}

.mobile-modal-container .detail-item span {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    line-height: 1.2;
}

.mobile-modal-container .detail-item .amount {
    color: #dc2626;
    font-weight: 600;
}

.mobile-modal-container .detail-item .profit {
    color: #059669;
    font-weight: 600;
}

.mobile-modal-container .detail-item .loss {
    color: #dc2626;
    font-weight: 600;
}

.mobile-modal .detail-item.highlight span {
    color: #1890ff;
    font-weight: 600;
}

/* 移动端状态标签优化 */
.mobile-modal .el-tag {
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 4px;
}

/* 移动端内容区域样式 - 底部弹起样式 */
.mobile-modal-container .analysis-content,
.mobile-modal-container .note-content {
    background: #f8fafc;
    border-radius: 6px;
    padding: 10px 12px;
    line-height: 1.4;
    color: #374151;
    white-space: pre-wrap;
}

.mobile-modal-container .analysis-content p,
.mobile-modal-container .note-content p {
    margin: 0;
    line-height: 1.4;
    color: #374151;
    font-size: 12px;
}

.mobile-modal .operation-history {
    display: block;
    margin-top: 0;
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.mobile-modal .operation-item {
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #f5f5f5;
    border-left: 4px solid #52c41a;
}

.mobile-modal .operation-item:last-child {
    border-bottom: none;
}

.mobile-modal .operation-time {
    font-size: 12px;
    color: #999;
    margin-bottom: 6px;
}

.mobile-modal .operation-action {
    font-size: 14px;
    color: #333;
    font-weight: 500;
    margin-bottom: 6px;
}

.mobile-modal .operation-note {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
}

/* 委托时效状态样式 */
.valid {
    color: #16a34a;
}

.expiring-soon {
    color: #d97706;
    font-weight: 600;
}

.expired {
    color: #dc2626;
    font-weight: 600;
}

/* 响应式设计 - 桌面端 */
@media (min-width: 769px) {
    .trading-record-detail-modal .detail-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
    }

    .trading-record-detail-modal .detail-item {
        flex-direction: column;
        gap: 4px;
    }

    .trading-record-detail-modal .detail-item label {
        min-width: auto;
    }
}
</style>
