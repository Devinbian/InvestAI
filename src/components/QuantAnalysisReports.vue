<template>
    <div class="quant-reports">
        <!-- 头部操作栏 -->
        <div class="reports-header">
            <div class="header-left">
                <h3>量化分析报告</h3>
                <p>系统自动保留最近3个月的报告，超期自动清理</p>
            </div>
            <div class="header-right">
                <div class="batch-actions" v-if="selectedReports.length > 0">
                    <span class="selected-count">已选择 {{ selectedReports.length }} 个报告</span>
                    <el-button @click="exportSelectedReports" type="primary" :disabled="downloadingPDF"
                        :loading="downloadingPDF" size="small">
                        <el-icon v-if="!downloadingPDF">
                            <Download />
                        </el-icon>
                        {{ downloadingPDF ? '正在导出...' : '导出选中' }}
                    </el-button>
                    <el-button @click="clearSelection" size="small">取消选择</el-button>
                </div>
                <div class="normal-actions" v-else>
                    <el-button @click="toggleSelectMode" type="default" :disabled="reports.length === 0" class="pc-action-btn">
                        <el-icon>
                            <Select />
                        </el-icon>
                        批量选择
                    </el-button>
                    <el-button @click="exportAllReports" type="primary" :disabled="reports.length === 0 || downloadingPDF"
                        :loading="downloadingPDF" class="pc-action-btn">
                        <el-icon v-if="!downloadingPDF">
                            <Download />
                        </el-icon>
                        {{ downloadingPDF ? '正在生成...' : '全部导出' }}
                    </el-button>
                </div>
            </div>
        </div>

        <!-- 筛选器 -->
        <div class="reports-filters">
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">报告类型</label>
                    <!-- PC端使用Element Plus -->
                    <el-select v-if="!isMobile" v-model="filterType" placeholder="报告类型" clearable size="small"
                        class="filter-select">
                        <el-option label="全部类型" value="" />
                        <el-option label="量化分析" value="quant-analysis" />
                        <el-option label="AI委托交易" value="ai-trading" />
                    </el-select>
                    <!-- 移动端使用原生控件 -->
                    <select v-else v-model="filterType" class="mobile-select">
                        <option value="">全部类型</option>
                        <option value="quant-analysis">量化分析</option>
                        <option value="ai-trading">AI委托交易</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">时间范围</label>
                    <!-- PC端使用Element Plus -->
                    <el-date-picker v-if="!isMobile" v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" size="small" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" class="filter-date" />
                    <!-- 移动端使用原生控件 -->
                    <div v-else class="mobile-date-range">
                        <input type="date" v-model="startDate" class="mobile-date-input" placeholder="开始日期">
                        <span class="date-separator">至</span>
                        <input type="date" v-model="endDate" class="mobile-date-input" placeholder="结束日期">
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">关键词搜索</label>
                    <el-input v-model="filterKeyword" placeholder="搜索股票名称或代码" size="small" clearable
                        class="filter-search">
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>
                <div class="filter-group">
                    <el-button @click="resetFilters" class="pc-filter-btn">重置</el-button>
                </div>
                <div class="filter-group" v-if="selectMode">
                    <el-button @click="selectAllReports" class="pc-filter-btn">全选</el-button>
                    <el-button @click="deselectAllReports" class="pc-filter-btn">全不选</el-button>
                </div>
            </div>
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
                <div v-for="report in paginatedReports" :key="report.id" 
                    class="report-card" 
                    :class="{ 'selected': selectedReports.includes(report.id), 'selectable': selectMode }"
                    @click="handleReportClick(report)">
                    <div class="report-header">
                        <div class="report-type">
                            <el-checkbox 
                                v-if="selectMode" 
                                :model-value="selectedReports.includes(report.id)"
                                @change="toggleReportSelection(report.id)"
                                @click.stop
                                class="report-checkbox">
                            </el-checkbox>
                            <el-tag :type="getReportTypeColor(report.sourceType)" size="small">
                                {{ getReportTypeName(report.sourceType) }}
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
                        <h4 class="report-title">{{ report.name }}({{ report.code }})量化分析报告</h4>
                        <div class="report-info">
                            <div class="info-item">
                                <span class="label">股票：</span>
                                <span class="value">{{ report.name }}({{ report.code }})</span>
                            </div>
                            <div class="info-item">
                                <span class="label">生成时间：</span>
                                <span class="value">{{ formatDate(report.createTime) }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">费用：</span>
                                <span class="value cost">{{ 1}}智点</span>
                            </div>
                            <div class="info-item">
                                <span class="label">有效期：</span>
                                <span class="value" :class="getExpiryStatusClass(report.expireDate)">
                                    {{ formatExpiryDate(report.expireDate) }}
                                </span>
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

        <!-- 移动端底部弹起样式 -->
        <div v-if="isMobile && showReportDetail" class="mobile-modal-overlay" @click="showReportDetail = false">
            <div class="mobile-modal-container" @click.stop>
                <div class="mobile-modal-header">
                    <div class="header-drag-handle"></div>
                    <div class="header-title-bar">
                        <h3>{{ selectedReport.name }}({{ selectedReport.code }})量化分析报告</h3>
                        <button class="mobile-close-btn" @click="showReportDetail = false">
                            <el-icon>
                                <Close />
                            </el-icon>
                        </button>
                    </div>
                </div>
                <div class="mobile-modal-content">
                    <div v-if="selectedReport" class="report-detail">
                        <div class="detail-header">
                            <div class="detail-info">
                                <div class="info-row">
                                    <span class="label">股票：</span>
                                    <span class="value">{{ selectedReport.name }}({{ selectedReport.code
                                    }})</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">报告类型：</span>
                                    <el-tag :type="getReportTypeColor(selectedReport.sourceType)" size="small">
                                        {{ getReportTypeName(selectedReport.sourceType) }}
                                    </el-tag>
                                </div>
                                <div class="info-row">
                                    <span class="label">生成时间：</span>
                                    <span class="value">{{ formatDateTime(selectedReport.createTime) }}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">分析费用：</span>
                                    <span class="value cost">{{ 1}}智点</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">有效期：</span>
                                    <span class="value" :class="getExpiryStatusClass(selectedReport.expireDate)">
                                        {{ formatExpiryDate(selectedReport.expireDate) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-content">
                            <!-- <h4>报告摘要</h4>
                            <p>{{ selectedReport.summary }}</p> -->

                            <h4>详细内容</h4>
                            <div class="report-content-text">
                                <MarkdownRenderer :content="selectedReport.content" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mobile-modal-footer">
                    <el-button @click="showReportDetail = false" :disabled="downloadingPDF">关闭</el-button>
                    <el-button type="primary" @click="downloadReport(selectedReport)" 
                        :loading="downloadingPDF" :disabled="downloadingPDF">
                        <el-icon v-if="!downloadingPDF">
                            <Download />
                        </el-icon>
                        {{ downloadingPDF ? '生成中...' : '下载PDF' }}
                    </el-button>
                </div>
            </div>
        </div>

        <!-- PC端标准对话框 -->
        <el-dialog v-else v-model="showReportDetail" :title="selectedReport.name + '(' + selectedReport.code + ')量化分析报告'" width="800px"
            class="report-detail-dialog">
            <div v-if="selectedReport" class="report-detail">
                <div class="detail-header">
                    <div class="detail-info">
                        <div class="info-row">
                            <span class="label">股票：</span>
                            <span class="value">{{ selectedReport.name }}({{ selectedReport.code }})</span>
                        </div>
                        <div class="info-row">
                            <span class="label">报告类型：</span>
                            <el-tag :type="getReportTypeColor(selectedReport.sourceType)" size="small">
                                {{ getReportTypeName(selectedReport.sourceType) }}
                            </el-tag>
                        </div>
                        <div class="info-row">
                            <span class="label">生成时间：</span>
                            <span class="value">{{ formatDateTime(selectedReport.createTime) }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">分析费用：</span>
                            <span class="value cost">{{ 1 }}智点</span>
                        </div>
                        <div class="info-row">
                            <span class="label">有效期：</span>
                            <span class="value" :class="getExpiryStatusClass(selectedReport.expireDate)">
                                {{ formatExpiryDate(selectedReport.expireDate) }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="detail-content">
                    <!-- <h4>报告摘要</h4>
                    <p>{{ selectedReport.summary }}</p> -->

                    <h4>详细内容</h4>
                    <div class="report-content-text">
                        <MarkdownRenderer :content="selectedReport.content" />
                    </div>
                </div>
            </div>

            <template #footer>
                <el-button @click="showReportDetail = false" :disabled="downloadingPDF">关闭</el-button>
                <el-button type="primary" @click="downloadReport(selectedReport)" 
                    :loading="downloadingPDF" :disabled="downloadingPDF">
                    <el-icon v-if="!downloadingPDF">
                        <Download />
                    </el-icon>
                    {{ downloadingPDF ? '生成中...' : '下载PDF' }}
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import {analyzeRecord} from '@/api/api.js';
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Search, More, CircleCheck, Close, Select } from '@element-plus/icons-vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import { generateReportPDF } from '@/utils/pdfGenerator.js';

// 定义emit事件
const emit = defineEmits(['data-loaded']);

const userStore = useUserStore();

// 移动端检测
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

// 响应式数据
const loading = ref(false);
const downloadingPDF = ref(false);
const filterType = ref('');
const filterDateRange = ref(null);
const filterKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(12);
const showReportDetail = ref(false);
const selectedReport = ref({
    name: '',
    code: '',
    type: '',
    createTime: '',
    expireDate: '',
    summary: '',
    content: ''
});

// 批量选择相关
const selectMode = ref(false);
const selectedReports = ref([]);

// 移动端日期范围
const startDate = ref('');
const endDate = ref('');

// 监听移动端日期变化，同步到filterDateRange
watch([startDate, endDate], ([start, end]) => {
    if (start && end) {
        filterDateRange.value = [start, end];
    } else {
        filterDateRange.value = null;
    }
});

// 监听filterDateRange变化，同步到移动端日期
watch(filterDateRange, (newVal) => {
    if (newVal && newVal.length === 2) {
        startDate.value = newVal[0];
        endDate.value = newVal[1];
    } else {
        startDate.value = '';
        endDate.value = '';
    }
});

// 计算属性
// const reports = computed(() => {
//     // 执行数据迁移（仅在需要时）
//     userStore.migrateQuantAnalysisReports();
//     return userStore.quantAnalysisReports || [];
// });

const reports=ref([]);
onMounted(() => {
    loading.value = true;
    const params = {};
    params.startDate = filterDateRange.value ? filterDateRange.value[0] : null;
    params.endDate = filterDateRange.value ? filterDateRange.value[1] : null;
    params.key = filterKeyword.value;
    analyzeRecord(params).then(res => {
        loading.value = false;
        if (res.data.success) {
            reports.value = res.data.data;
            // 为每个报告设置来源类型
            reports.value.forEach(report => {
                // 根据报告的生成方式设置来源类型
                // 如果报告有关联的AI委托交易记录，则来源为AI委托交易
                // 否则来源为用户主动点击的量化分析
                if (report.aiTradingId || report.fromAITrading) {
                    report.sourceType = "ai-trading";
                } else {
                    report.sourceType = "quant-analysis";
                }
                // 保持向后兼容，设置type字段
                report.type = report.sourceType;
            });
        }
    }).catch(error => {
        loading.value = false;
        console.error('获取量化分析报告失败:', error);
    });
});

const filteredReports = computed(() => {
    let filtered = reports.value;

    // 按来源类型筛选
    if (filterType.value) {
        filtered = filtered.filter(report => report.sourceType === filterType.value);
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

// 监听筛选结果变化，实时更新badge数量
watch(filteredReports, (newFilteredReports) => {
    emit('data-loaded', newFilteredReports.length);
}, { immediate: true });

const paginatedReports = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredReports.value.slice(start, end);
});

// 方法
const getReportTypeName = (sourceType) => {
    const typeMap = {
        'quant-analysis': '量化分析',
        'ai-trading': 'AI委托交易'
    };
    return typeMap[sourceType] || sourceType;
};

const getReportTypeColor = (sourceType) => {
    const colorMap = {
        'quant-analysis': 'primary',
        'ai-trading': 'success'
    };
    return colorMap[sourceType] || 'info';
};

const formatDate = (dateTime) => {
    return dateTime.split(' ')[0];
};

const formatDateTime = (dateTime) => {
    return dateTime.replace('T', ' ').substring(0, 19);
};

// 格式化有效期显示
const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return '永久有效';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return '已过期';
    } else if (diffDays === 0) {
        return '今日过期';
    } else if (diffDays === 1) {
        return '明日过期';
    } else if (diffDays <= 7) {
        return `${diffDays}天后过期`;
    } else {
        return expiry.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + '过期';
    }
};

// 获取有效期状态样式类
const getExpiryStatusClass = (expiryDate) => {
    if (!expiryDate) return '';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return 'expired';
    } else if (diffDays <= 7) {
        return 'expiring-soon';
    } else {
        return 'valid';
    }
};

const resetFilters = () => {
    filterType.value = '';
    filterDateRange.value = null;
    filterKeyword.value = '';
    currentPage.value = 1;
};

const viewReport = (report) => {
    selectedReport.value = report;
    showReportDetail.value = true;
};

// 批量选择相关方法
const toggleSelectMode = () => {
    selectMode.value = !selectMode.value;
    if (!selectMode.value) {
        selectedReports.value = [];
    }
};

const toggleReportSelection = (reportId) => {
    const index = selectedReports.value.indexOf(reportId);
    if (index > -1) {
        selectedReports.value.splice(index, 1);
    } else {
        selectedReports.value.push(reportId);
    }
};

const clearSelection = () => {
    selectedReports.value = [];
    selectMode.value = false;
};

const handleReportClick = (report) => {
    if (selectMode.value) {
        toggleReportSelection(report.id);
    } else {
        viewReport(report);
    }
};

const selectAllReports = () => {
    selectedReports.value = paginatedReports.value.map(report => report.id);
};

const deselectAllReports = () => {
    selectedReports.value = [];
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

const downloadReport = async (report) => {
    if (!report.content) {
        ElMessage.error('报告内容为空，无法下载');
        return;
    }

    if (downloadingPDF.value) {
        ElMessage.warning('正在生成PDF，请稍等...');
        return;
    }

    try {
        downloadingPDF.value = true;
        ElMessage.info(`正在生成 ${report.name} 的PDF报告...`);
        
        // 生成PDF文件名
        const filename = `${report.name}(${report.code})量化分析报告_${new Date().toISOString().split('T')[0]}.pdf`;
        
        // 调用PDF生成器
        await generateReportPDF(report.content, {
            filename: filename,
            title: `${report.name}(${report.code})量化分析报告`,
            stockInfo: {
                name: report.name,
                code: report.code,
                                            createdAt: report.createTime  // 传递报告生成时间
            },
            watermark: true
        });
        
        ElMessage.success('PDF报告下载完成');
        
    } catch (error) {
        console.error('PDF生成失败:', error);
        ElMessage.error('PDF生成失败，请稍后重试');
    } finally {
        downloadingPDF.value = false;
    }
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
                customClass: 'high-z-index-dialog',
                appendTo: 'body',
            }
        );

        userStore.deleteQuantAnalysisReport(report.id);
        ElMessage.success('报告已删除');
    } catch {
        // 用户取消删除
    }
};

const exportSelectedReports = async () => {
    if (selectedReports.value.length === 0) {
        ElMessage.warning('请先选择要导出的报告');
        return;
    }

    // 获取选中的报告对象
    const selectedReportObjects = reports.value.filter(report => 
        selectedReports.value.includes(report.id)
    );

    try {
        await ElMessageBox.confirm(
            `确定要导出选中的 ${selectedReports.value.length} 个报告吗？这可能需要一些时间。`,
            '批量导出确认',
            {
                confirmButtonText: '确定导出',
                cancelButtonText: '取消',
                type: 'info'
            }
        );

        downloadingPDF.value = true;
        ElMessage.info(`正在批量生成 ${selectedReports.value.length} 个PDF报告...`);
        
        let successCount = 0;
        let failCount = 0;
        
        // 逐个生成PDF，避免浏览器卡死
        for (let i = 0; i < selectedReportObjects.length; i++) {
            const report = selectedReportObjects[i];
            
            try {
                if (report.content) {
                    const filename = `${report.name}(${report.code})量化分析报告_${new Date().toISOString().split('T')[0]}.pdf`;
                    
                    await generateReportPDF(report.content, {
                        filename: filename,
                        title: `${report.name}(${report.code})量化分析报告`,
                        stockInfo: {
                            name: report.name,
                            code: report.code,
                            createdAt: report.createTime  // 传递报告生成时间
                        },
                        watermark: true
                    });
                    
                    successCount++;
                    
                    // 添加小延时，避免浏览器卡死
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    failCount++;
                    console.warn(`报告 ${report.name} 内容为空，跳过`);
                }
            } catch (error) {
                failCount++;
                console.error(`生成报告 ${report.name} 失败:`, error);
            }
        }
        
        if (successCount > 0) {
            ElMessage.success(`批量导出完成！成功：${successCount}个，失败：${failCount}个`);
            // 导出成功后清除选择
            clearSelection();
        } else {
            ElMessage.error('批量导出失败，请检查报告内容');
        }
        
    } catch {
        // 用户取消导出
    } finally {
        downloadingPDF.value = false;
    }
};

const exportAllReports = async () => {
    if (filteredReports.value.length === 0) {
        ElMessage.warning('没有可导出的报告');
        return;
    }

    try {
        await ElMessageBox.confirm(
            `确定要导出全部 ${filteredReports.value.length} 个报告吗？这可能需要一些时间。`,
            '全部导出确认',
            {
                confirmButtonText: '确定导出',
                cancelButtonText: '取消',
                type: 'info'
            }
        );

        downloadingPDF.value = true;
        ElMessage.info(`正在批量生成 ${filteredReports.value.length} 个PDF报告...`);
        
        let successCount = 0;
        let failCount = 0;
        
        // 逐个生成PDF，避免浏览器卡死
        for (let i = 0; i < filteredReports.value.length; i++) {
            const report = filteredReports.value[i];
            
            try {
                if (report.content) {
                    const filename = `${report.name}(${report.code})量化分析报告_${new Date().toISOString().split('T')[0]}.pdf`;
                    
                    await generateReportPDF(report.content, {
                        filename: filename,
                        title: `${report.name}(${report.code})量化分析报告`,
                        stockInfo: {
                            name: report.name,
                            code: report.code,
                            createdAt: report.createTime  // 传递报告生成时间
                        },
                        watermark: true
                    });
                    
                    successCount++;
                    
                    // 添加小延时，避免浏览器卡死
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    failCount++;
                    console.warn(`报告 ${report.name} 内容为空，跳过`);
                }
            } catch (error) {
                failCount++;
                console.error(`生成报告 ${report.name} 失败:`, error);
            }
        }
        
        if (successCount > 0) {
            ElMessage.success(`批量导出完成！成功：${successCount}个，失败：${failCount}个`);
        } else {
            ElMessage.error('批量导出失败，请检查报告内容');
        }
        
    } catch {
        // 用户取消导出
    } finally {
        downloadingPDF.value = false;
    }
};

// 暴露数据给父组件
defineExpose({
    reports,
    filteredReports
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

.batch-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.selected-count {
    font-size: 0.875rem;
    color: #3182ce;
    font-weight: 500;
}

.normal-actions {
    display: flex;
    gap: 12px;
}

.reports-filters {
    margin-bottom: 24px;
    flex-shrink: 0;
}

.filters-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: end;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 2px;
}

.filter-select {
    width: 160px;
}

.filter-date {
    width: 280px;
}

.filter-search {
    width: 240px;
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
    text-align: center;
}

.empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text {
    text-align: center;
    width: 100%;
}

.empty-text h4 {
    margin: 0 0 8px 0;
    font-size: 1.125rem;
    color: #374151;
    text-align: center;
}

.empty-text p {
    margin: 0;
    font-size: 0.875rem;
    text-align: center;
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

.report-card.selectable {
    cursor: pointer;
}

.report-card.selected {
    border-color: #3b82f6;
    background: #f0f9ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.report-card.selected:hover {
    background: #e0f2fe;
}

.report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.report-type {
    display: flex;
    align-items: center;
    gap: 8px;
}

.report-checkbox {
    margin-right: 8px;
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
    max-height: 60vh;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
}

/* PC端按钮样式 */
.pc-action-btn {
    padding: 10px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 8px;
    height: auto;
    transition: all 0.2s ease;
}

.pc-action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.pc-filter-btn {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    height: auto;
    background: #f8fafc;
    border-color: #e2e8f0;
    color: #475569;
    transition: all 0.2s ease;
}

.pc-filter-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #334155;
    transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .filters-row {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .filter-label {
        min-width: 80px;
        margin-bottom: 0;
    }

    .filter-select,
    .filter-date,
    .filter-search {
        flex: 1;
        width: auto;
    }
}

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

    .filters-row {
        padding: 16px;
        gap: 12px;
    }

    .reports-grid {
        grid-template-columns: 1fr;
    }

    .detail-info {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 480px) {
    .filter-group {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-label {
        min-width: auto;
    }

    .filters-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .filter-label {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
    }

    .filter-select,
    .filter-date,
    .filter-search {
        width: 100%;
    }

    /* 移动端原生控件样式 */
    .mobile-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f8fafc;
        color: #374151;
        font-size: 0.8rem;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 8px center;
        background-repeat: no-repeat;
        background-size: 16px;
        padding-right: 32px;
    }

    .mobile-date-range {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    .mobile-date-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f8fafc;
        color: #374151;
        font-size: 0.8rem;
    }

    .date-separator {
        color: #9ca3af;
        font-size: 0.75rem;
        flex-shrink: 0;
    }

    .reports-list {
        padding: 0 16px;
        margin: 0;
    }

    .reports-grid {
        gap: 12px;
    }

    .report-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }

    .reports-pagination {
        margin: 0 16px;
        padding-top: 12px;
    }

    .empty-state {
        margin: 0 16px;
        padding: 24px 16px;
        height: 200px;
    }
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
    line-height: 1.2;
    max-width: calc(100% - 40px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    flex-shrink: 0;
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

/* 移动端报告详情样式优化 */
.mobile-modal-container .report-detail {
    padding: 16px 0;
}

.mobile-modal-container .detail-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.mobile-modal-container .detail-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
}

.mobile-modal-container .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    border: 1px solid rgba(229, 231, 235, 0.5);
    min-height: 32px;
}

.mobile-modal-container .info-row .label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    line-height: 1.2;
}

.mobile-modal-container .info-row .value {
    font-size: 12px;
    color: #374151;
    font-weight: 600;
    line-height: 1.2;
}

.mobile-modal-container .info-row .value.cost {
    color: #dc2626;
    font-weight: 600;
}

.mobile-modal-container .detail-content h4 {
    margin: 16px 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #18181b;
}

.mobile-modal-container .detail-content p {
    margin: 0 0 12px 0;
    line-height: 1.4;
    color: #374151;
    font-size: 12px;
}

.mobile-modal-container .report-content-text {
    background: #f8fafc;
    border-radius: 6px;
    padding: 10px 12px;
    max-height: 50vh;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    -webkit-overflow-scrolling: touch;
}

/* 滚动条样式 */
.report-content-text::-webkit-scrollbar {
    width: 6px;
}

.report-content-text::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.report-content-text::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.report-content-text::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 有效期状态样式 */
.value.valid {
    color: #16a34a;
}

.value.expiring-soon {
    color: #d97706;
    font-weight: 600;
}

.value.expired {
    color: #dc2626;
    font-weight: 600;
}

/* 确保弹窗在移动端侧边栏上方显示 */
:deep(.el-dialog) {
    z-index: 11000 !important;
}

:deep(.el-overlay) {
    z-index: 10999 !important;
}
</style>
