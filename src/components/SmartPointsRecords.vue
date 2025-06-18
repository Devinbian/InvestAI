<template>
    <div class="smart-points-records">
        <!-- 记录列表 -->
        <div v-if="records.length > 0" class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item">
                <div class="record-icon">
                    <svg v-if="record.type === 'consumption'" width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#ef4444"
                            stroke-width="2" />
                    </svg>
                    <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#10b981"
                            stroke-width="2" />
                    </svg>
                </div>
                <div class="record-content">
                    <div class="record-title">{{ record.description }}</div>
                    <div class="record-time">{{ formatTime(record.createdAt) }}</div>
                </div>
                <div class="record-amount"
                    :class="{ 'consume': record.type === 'consumption', 'recharge': record.type === 'recharge' }">
                    {{ record.type === 'consumption' ? '-' : '+' }}{{ record.amount }} 智点
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
            <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#d1d5db" stroke-width="2" />
                    <path d="M16 8l-4 4-4-4" stroke="#d1d5db" stroke-width="2" fill="none" />
                </svg>
            </div>
            <div class="empty-text">
                <h3>暂无智点记录</h3>
                <p>您的智点消费和充值记录将在这里显示</p>
            </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="records.length > 0" class="records-stats">
            <div class="stat-item">
                <div class="stat-label">总消费</div>
                <div class="stat-value consume">{{ totalConsume }} 智点</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">总充值</div>
                <div class="stat-value recharge">{{ totalRecharge }} 智点</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">净消费</div>
                <div class="stat-value">{{ netConsume }} 智点</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../store/user';

const userStore = useUserStore();

// 获取智点记录
const records = computed(() => userStore.smartPointsTransactions || []);

// 计算总消费
const totalConsume = computed(() => {
    return records.value
        .filter(record => record.type === 'consumption')
        .reduce((total, record) => total + record.amount, 0);
});

// 计算总充值
const totalRecharge = computed(() => {
    return records.value
        .filter(record => record.type === 'recharge')
        .reduce((total, record) => total + record.amount, 0);
});

// 计算净消费
const netConsume = computed(() => totalConsume.value - totalRecharge.value);

// 格式化时间
const formatTime = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays === 1) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays < 7) {
        return diffDays + '天前';
    } else {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
};
</script>

<style scoped>
.smart-points-records {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.records-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.record-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
}

.record-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.record-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.record-content {
    flex: 1;
    min-width: 0;
}

.record-title {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
    margin-bottom: 4px;
}

.record-time {
    font-size: 12px;
    color: #64748b;
}

.record-amount {
    font-size: 14px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 20px;
    white-space: nowrap;
}

.record-amount.consume {
    color: #dc2626;
    background: #fee2e2;
}

.record-amount.recharge {
    color: #059669;
    background: #d1fae5;
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 40px;
    text-align: center;
}

.empty-icon {
    opacity: 0.5;
}

.empty-text h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
}

.records-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.stat-item {
    text-align: center;
}

.stat-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.stat-value.consume {
    color: #dc2626;
}

.stat-value.recharge {
    color: #059669;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .smart-points-records {
        padding: 16px;
    }

    .record-item {
        padding: 12px;
        gap: 12px;
    }

    .record-icon {
        width: 36px;
        height: 36px;
    }

    .record-title {
        font-size: 13px;
    }

    .record-amount {
        font-size: 13px;
        padding: 4px 8px;
    }

    .records-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        padding: 16px;
    }

    .stat-value {
        font-size: 14px;
    }
}

@media (max-width: 480px) {
    .records-stats {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
    }

    .stat-label {
        margin-bottom: 0;
    }
}
</style>
