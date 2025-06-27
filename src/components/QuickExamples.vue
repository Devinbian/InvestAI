<template>
    <div class="quick-examples">
        <div class="examples-content">
            <span v-for="example in currentExampleGroup" :key="example" class="example-tag"
                @click="handleExampleClick(example)">
                {{ example }}
            </span>
        </div>
        <div class="examples-control">
            <div class="control-container">
                <span class="examples-label">换一批问题</span>
                <div class="control-group">
                    <span class="examples-indicator">{{ currentExampleGroupIndex + 1 }}/{{ exampleGroups.length
                        }}</span>
                    <el-button class="refresh-examples-btn" size="small" @click="switchExampleGroup"
                        :title="`点击切换到下一组问题`">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor"
                                stroke-width="2" fill="none" />
                            <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" fill="none" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor"
                                stroke-width="2" fill="none" />
                            <path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" fill="none" />
                        </svg>
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

// 定义事件
const emit = defineEmits(['example-click']);

// 预置问题组轮换
const currentExampleGroupIndex = ref(0);

// 预置问题组数据
const exampleGroups = [
    [
        '我有10万元闲钱，月收入8千，适合什么投资组合？',
        '帮我制定一个3年期的投资计划，目标年化收益12%',
        '对比分析股票基金和指数基金，哪个更适合新手？',
        '推荐几只适合定投的基金，风险等级中等偏低'
    ],
    [
        '分析宁德时代和比亚迪的竞争优势，哪个更值得长期持有？',
        '白酒板块中茅台、五粮液、泸州老窖如何选择？',
        '银行股现在估值如何？招商银行vs平安银行投资价值对比',
        '医药板块恒瑞医药、药明康德近期表现分析'
    ],
    [
        '美联储加息对A股影响如何？现在应该加仓还是减仓？',
        '如何利用技术指标判断大盘3000点支撑是否有效？',
        '我持有的股票跌了20%，是止损还是补仓？具体策略',
        '制定一个动态仓位管理策略，根据市场情况调整'
    ],
    [
        '巴菲特价值投资法则在A股是否适用？具体如何操作？',
        '如何用DCF模型给贵州茅台估值？当前价格是否合理？',
        '筛选ROE连续5年超15%的优质股票，并分析投资逻辑',
        '长期持有腾讯、阿里巴巴还是短线操作更赚钱？'
    ],
    [
        '港股通投资腾讯、美团的优势和风险分析',
        '对比A股、港股、美股的苹果公司，哪个更有投资价值？',
        '人民币贬值背景下，如何配置海外资产对冲风险？',
        'REITs基金收益率4-6%，与银行理财产品如何选择？'
    ]
];

// 当前示例组
const currentExampleGroup = computed(() => {
    return exampleGroups[currentExampleGroupIndex.value];
});

// 处理示例点击
const handleExampleClick = (example) => {
    emit('example-click', example);
};

// 切换预置问题组
const switchExampleGroup = () => {
    currentExampleGroupIndex.value = (currentExampleGroupIndex.value + 1) % exampleGroups.length;
    ElMessage.success(`已切换到第${currentExampleGroupIndex.value + 1}组问题`);
};
</script>

<style scoped>
/* 快捷示例标签 */
.quick-examples {
    margin-top: 12px;
}

.examples-content {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-bottom: 12px;
}

.examples-control {
    display: flex;
    justify-content: center;
    margin-top: 6px;
}

.control-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.2s ease;
}

.control-container:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
}

.examples-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 6px;
}

.examples-indicator {
    font-size: 0.75rem;
    color: #475569;
    font-weight: 500;
    padding: 1px 6px;
    background: #e2e8f0;
    border-radius: 8px;
}

.refresh-examples-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #475569;
    transition: all 0.2s ease;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.refresh-examples-btn:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
    transform: rotate(90deg);
}

.example-tag {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.example-tag:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #374151;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .examples-content {
        gap: 4px;
    }

    .example-tag {
        font-size: 0.75rem;
        padding: 4px 8px;
    }

    .examples-indicator {
        font-size: 0.7rem;
    }

    .refresh-examples-btn {
        width: 24px;
        height: 24px;
    }
}

/* 微信环境下的特殊样式 */
@media (max-width: 768px) {
    :global(body.wechat-browser) .quick-examples {
        margin-top: 6px !important;
        margin-bottom: 8px !important;
    }
}
</style>
