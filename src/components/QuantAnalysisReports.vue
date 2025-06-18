<template>
    <div class="quant-reports">
        <!-- 头部操作栏 -->
        <div class="reports-header">
            <div class="header-left">
                <h3>量化分析报告</h3>
                <p>系统自动保留最近3个月的报告，超期自动清理</p>
            </div>
            <div class="header-right">
                <el-button @click="cleanExpiredReports" size="small">
                    <el-icon>
                        <Delete />
                    </el-icon>
                    清理过期报告
                </el-button>
                <el-button @click="exportAllReports" type="primary" size="small" :disabled="reports.length === 0">
                    <el-icon>
                        <Download />
                    </el-icon>
                    批量导出
                </el-button>
            </div>
        </div>

        <!-- 筛选器 -->
        <div class="reports-filters">
            <el-row :gutter="16">
                <el-col :span="6">
                    <el-select v-model="filterType" placeholder="报告类型" clearable size="small">
                        <el-option label="全部类型" value="" />
                        <el-option label="量化分析" value="quant-analysis" />
                        <el-option label="AI委托交易" value="ai-trading" />
                        <el-option label="股票分析" value="stock-analysis" />
                    </el-select>
                </el-col>
                <el-col :span="6">
                    <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" size="small" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" />
                </el-col>
                <el-col :span="8">
                    <el-input v-model="filterKeyword" placeholder="搜索股票名称或代码" size="small" clearable>
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </el-col>
                <el-col :span="4">
                    <el-button @click="resetFilters" size="small">重置</el-button>
                </el-col>
            </el-row>
        </div>

        <!-- 报告列表 -->
        <div class="reports-list" v-loading="loading">
            <div v-if="filteredReports.length === 0" class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-text">
                    <h4>暂无报告记录</h4>
                    <p>您还没有生成任何量化分析报告</p>
                </div>
            </div>

            <div v-else class="reports-grid">
                <div v-for="report in paginatedReports" :key="report.id" class="report-card"
                    @click="viewReport(report)">
                    <div class="report-header">
                        <div class="report-type">
                            <el-tag :type="getReportTypeColor(report.type)" size="small">
                                {{ getReportTypeName(report.type) }}
                            </el-tag>
                        </div>
                        <div class="report-actions" @click.stop>
                            <el-dropdown @command="(command) => handleReportAction(command, report)">
                                <el-button size="small" text>
                                    <el-icon>
                                        <More />
                                    </el-icon>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                                        <el-dropdown-item command="download">下载PDF</el-dropdown-item>
                                        <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </div>

                    <div class="report-content">
                        <h4 class="report-title">{{ report.title }}</h4>
                        <div class="report-info">
                            <div class="info-item">
                                <span class="label">股票：</span>
                                <span class="value">{{ report.stockName }}({{ report.stockCode }})</span>
                            </div>
                            <div class="info-item">
                                <span class="label">生成时间：</span>
                                <span class="value">{{ formatDate(report.createdAt) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">费用：</span>
                                <span class="value cost">{{ report.cost }}智点</span>
                            </div>
                        </div>
                        <div class="report-summary">
                            {{ report.summary }}
                        </div>
                    </div>

                    <div class="report-footer">
                        <div class="report-status">
                            <el-icon class="status-icon">
                                <CircleCheck />
                            </el-icon>
                            已完成
                        </div>
                        <div class="report-size">{{ report.fileSize }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分页 -->
        <div class="reports-pagination" v-if="filteredReports.length > pageSize">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredReports.length"
                layout="total, prev, pager, next, jumper" small />
        </div>

        <!-- 报告详情对话框 -->
        <el-dialog v-model="showReportDetail" :title="selectedReport?.title" width="800px" class="report-detail-dialog">
            <div v-if="selectedReport" class="report-detail">
                <div class="detail-header">
                    <div class="detail-info">
                        <div class="info-row">
                            <span class="label">股票：</span>
                            <span class="value">{{ selectedReport.stockName }}({{ selectedReport.stockCode }})</span>
                        </div>
                        <div class="info-row">
                            <span class="label">报告类型：</span>
                            <el-tag :type="getReportTypeColor(selectedReport.type)" size="small">
                                {{ getReportTypeName(selectedReport.type) }}
                            </el-tag>
                        </div>
                        <div class="info-row">
                            <span class="label">生成时间：</span>
                            <span class="value">{{ formatDateTime(selectedReport.createdAt) }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">分析费用：</span>
                            <span class="value cost">{{ selectedReport.cost }}智点</span>
                        </div>
                    </div>
                </div>

                <div class="detail-content">
                    <h4>报告摘要</h4>
                    <p>{{ selectedReport.summary }}</p>

                    <h4>详细内容</h4>
                    <div class="report-content-text" v-html="selectedReport.content"></div>
                </div>
            </div>

            <template #footer>
                <el-button @click="showReportDetail = false">关闭</el-button>
                <el-button type="primary" @click="downloadReport(selectedReport)">
                    <el-icon>
                        <Download />
                    </el-icon>
                    下载PDF
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Download, Search, More, CircleCheck } from '@element-plus/icons-vue';

const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const filterType = ref('');
const filterDateRange = ref('');
const filterKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(12);
const showReportDetail = ref(false);
const selectedReport = ref(null);

// 计算属性
const reports = computed(() => userStore.quantAnalysisReports || []);

const filteredReports = computed(() => {
    let filtered = reports.value;

    // 按类型筛选
    if (filterType.value) {
        filtered = filtered.filter(report => report.type === filterType.value);
    }

    // 按日期范围筛选
    if (filterDateRange.value && filterDateRange.value.length === 2) {
        const [startDate, endDate] = filterDateRange.value;
        filtered = filtered.filter(report => {
            const reportDate = report.createdAt.split(' ')[0]; // 取日期部分
            return reportDate >= startDate && reportDate <= endDate;
        });
    }

    // 按关键词筛选
    if (filterKeyword.value) {
        const keyword = filterKeyword.value.toLowerCase();
        filtered = filtered.filter(report =>
            report.stockName.toLowerCase().includes(keyword) ||
            report.stockCode.toLowerCase().includes(keyword) ||
            report.title.toLowerCase().includes(keyword)
        );
    }

    // 按创建时间倒序排列
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const paginatedReports = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredReports.value.slice(start, end);
});

// 方法
const getReportTypeName = (type) => {
    const typeMap = {
        'quant-analysis': '量化分析',
        'ai-trading': 'AI委托交易',
        'stock-analysis': '股票分析'
    };
    return typeMap[type] || type;
};

const getReportTypeColor = (type) => {
    const colorMap = {
        'quant-analysis': 'primary',
        'ai-trading': 'success',
        'stock-analysis': 'warning'
    };
    return colorMap[type] || 'info';
};

const formatDate = (dateTime) => {
    return dateTime.split(' ')[0];
};

const formatDateTime = (dateTime) => {
    return dateTime.replace('T', ' ').substring(0, 19);
};

const resetFilters = () => {
    filterType.value = '';
    filterDateRange.value = '';
    filterKeyword.value = '';
    currentPage.value = 1;
};

const viewReport = (report) => {
    selectedReport.value = report;
    showReportDetail.value = true;
};

const handleReportAction = (command, report) => {
    switch (command) {
        case 'view':
            viewReport(report);
            break;
        case 'download':
            downloadReport(report);
            break;
        case 'delete':
            deleteReport(report);
            break;
    }
};

const downloadReport = (report) => {
    // 模拟PDF下载
    ElMessage.success(`正在下载 ${report.title} 报告...`);

    // 实际项目中这里应该调用后端API生成并下载PDF
    setTimeout(() => {
        ElMessage.success('报告下载完成');
    }, 2000);
};

const deleteReport = async (report) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除报告"${report.title}"吗？删除后无法恢复。`,
            '确认删除',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        userStore.deleteQuantAnalysisReport(report.id);
        ElMessage.success('报告已删除');
    } catch {
        // 用户取消删除
    }
};

const cleanExpiredReports = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要清理3个月前的过期报告吗？清理后无法恢复。',
            '清理过期报告',
            {
                confirmButtonText: '确定清理',
                cancelButtonText: '取消',
                type: 'warning',
            }
        );

        const expiredCount = userStore.cleanExpiredReports();
        ElMessage.success(`已清理 ${expiredCount} 个过期报告`);
    } catch {
        // 用户取消清理
    }
};

const exportAllReports = () => {
    if (filteredReports.value.length === 0) {
        ElMessage.warning('没有可导出的报告');
        return;
    }

    ElMessage.success(`正在导出 ${filteredReports.value.length} 个报告...`);

    // 实际项目中这里应该调用后端API批量导出
    setTimeout(() => {
        ElMessage.success('批量导出完成');
    }, 3000);
};

onMounted(() => {
    // 组件加载时自动清理过期报告
    userStore.cleanExpiredReports();
});
</script>

<style scoped>
.quant-reports {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    overflow: hidden;
}

.reports-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    flex-shrink: 0;
}

.header-left h3 {
    margin: 0 0 4px 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
}

.header-left p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
}

.header-right {
    display: flex;
    gap: 12px;
}

.reports-filters {
    margin-bottom: 24px;
    flex-shrink: 0;
}

.reports-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #6b7280;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text h4 {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    color: #374151;
}

.empty-text p {
    margin: 0;
    font-size: 0.875rem;
}

.reports-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.report-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.report-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
}

.report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.report-actions .el-button {
    color: #6b7280;
}

.report-content {
    flex: 1;
}

.report-title {
    margin: 0 0 8px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
    line-height: 1.4;
}

.report-info {
    margin-bottom: 8px;
}

.info-item {
    display: flex;
    margin-bottom: 4px;
    font-size: 0.875rem;
}

.info-item .label {
    color: #6b7280;
    min-width: 60px;
}

.info-item .value {
    color: #374151;
}

.info-item .value.cost {
    color: #dc2626;
    font-weight: 600;
}

.report-summary {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.report-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    font-size: 0.875rem;
}

.report-status {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #059669;
}

.status-icon {
    font-size: 1rem;
}

.report-size {
    color: #6b7280;
}

.reports-pagination {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
}

/* 报告详情对话框样式 */
.report-detail-dialog :deep(.el-dialog__body) {
    padding: 0 24px 24px 24px;
}

.detail-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
}

.detail-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.info-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.info-row .label {
    font-weight: 500;
    color: #6b7280;
    min-width: 80px;
}

.info-row .value {
    color: #374151;
}

.info-row .value.cost {
    color: #dc2626;
    font-weight: 600;
}

.detail-content h4 {
    margin: 24px 0 8px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #18181b;
}

.detail-content p {
    margin: 0 0 16px 0;
    line-height: 1.6;
    color: #374151;
}

.report-content-text {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    line-height: 1.6;
    color: #374151;
    white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .quant-reports {
        padding: 16px;
    }

    .reports-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
    }

    .header-right {
        justify-content: flex-end;
    }

    .reports-grid {
        grid-template-columns: 1fr;
    }

    .detail-info {
        grid-template-columns: 1fr;
    }
}
</style>
