<template>
    <el-dialog v-model="dialogVisible" title="自定义快捷操作" width="900px" class="customize-dialog">
        <div class="customize-content">
            <!-- 默认快捷操作 -->
            <div class="section">
                <div class="section-title">
                    <h4>默认快捷操作</h4>
                    <span class="section-subtitle">开启或关闭系统预设的快捷操作</span>
                </div>
                <div class="shortcuts-grid compact">
                    <div v-for="shortcut in defaultShortcuts" :key="shortcut.id"
                        :class="['shortcut-card compact', { 'active': shortcut.isActive }]">
                        <div class="card-header compact">
                            <div class="icon-wrapper compact">
                                <span class="shortcut-icon">{{ shortcut.icon }}</span>
                            </div>
                            <div class="card-content compact">
                                <div class="shortcut-title">{{ shortcut.title }}</div>
                                <div class="shortcut-desc">{{ shortcut.description }}</div>
                            </div>
                            <el-switch v-model="shortcut.isActive" @change="toggleShortcutActive(shortcut)"
                                size="small" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 自定义快捷操作 -->
            <div class="section">
                <div class="section-header">
                    <div class="section-title">
                        <h4>自定义快捷操作</h4>
                        <span class="section-subtitle">创建专属于您的快捷操作（最多3个）</span>
                    </div>
                    <el-button type="primary" @click="addCustomShortcut" :disabled="customShortcuts.length >= 3"
                        size="small">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        添加自定义操作
                    </el-button>
                </div>

                <!-- 自定义快捷操作列表 -->
                <div class="custom-shortcuts-list" v-if="customShortcuts.length > 0">
                    <div v-for="shortcut in customShortcuts" :key="shortcut.id"
                        :class="['custom-shortcut-item', { 'editing': shortcut.isEditing }]">

                        <!-- 显示模式 -->
                        <div class="shortcut-display compact" v-if="!shortcut.isEditing">
                            <div class="display-left">
                                <div class="icon-wrapper compact">
                                    <span class="shortcut-icon">{{ shortcut.icon }}</span>
                                </div>
                                <div class="shortcut-details">
                                    <div class="shortcut-title">{{ shortcut.title }}</div>
                                    <div class="shortcut-desc">{{ shortcut.description }}</div>
                                </div>
                            </div>
                            <div class="display-right">
                                <el-switch v-model="shortcut.isActive" @change="saveCustomShortcuts" size="small" />
                                <div class="action-buttons">
                                    <el-button type="primary" link @click="startEditShortcut(shortcut)" size="small">
                                        <el-icon>
                                            <Edit />
                                        </el-icon>
                                    </el-button>
                                    <el-button type="danger" link @click="removeCustomShortcut(shortcut.id)"
                                        size="small">
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                    </el-button>
                                </div>
                            </div>
                        </div>

                        <!-- 编辑模式 - 横向布局 -->
                        <div class="shortcut-edit horizontal" v-else>
                            <div class="edit-form horizontal">
                                <!-- 左侧：图标选择 -->
                                <div class="form-section left">
                                    <label class="form-label">图标</label>
                                    <div class="icon-selector compact">
                                        <div class="current-icon">
                                            <span class="selected-icon compact">{{ shortcut.icon }}</span>
                                        </div>
                                        <div class="icon-options compact">
                                            <div v-for="icon in availableIcons" :key="icon"
                                                :class="['icon-option compact', { 'selected': shortcut.icon === icon }]"
                                                @click="selectIcon(shortcut, icon)">
                                                <span>{{ icon }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 右侧：基本信息 -->
                                <div class="form-section right">
                                    <div class="form-row compact">
                                        <div class="form-group">
                                            <label class="form-label">操作标题</label>
                                            <el-input v-model="shortcut.title" maxlength="10" placeholder="如：股票分析"
                                                show-word-limit size="small" />
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">简称</label>
                                            <el-input v-model="shortcut.shortTitle" maxlength="2" placeholder="如：分析"
                                                style="width: 80px;" size="small" />
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">操作描述</label>
                                        <el-input v-model="shortcut.description" maxlength="50"
                                            placeholder="简单描述这个操作的用途" show-word-limit size="small" />
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">执行内容</label>
                                        <el-input v-model="shortcut.prompt" type="textarea" :rows="3" maxlength="500"
                                            placeholder="请输入您希望AI执行的具体操作内容..." show-word-limit size="small" />
                                    </div>
                                </div>
                            </div>

                            <div class="edit-actions compact">
                                <el-button @click="cancelEditShortcut(shortcut)" size="small">取消</el-button>
                                <el-button type="primary" @click="saveEditShortcut(shortcut)"
                                    size="small">保存</el-button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 空状态 -->
                <div v-else class="empty-custom compact">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">
                        <h5>还没有自定义快捷操作</h5>
                        <p>点击上方"添加自定义操作"按钮，创建专属于您的快捷操作</p>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose" size="small">关闭</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'shortcuts-updated']);

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 默认快捷操作配置
const defaultShortcuts = ref([
    {
        id: 'smart_review',
        icon: '🧠',
        title: '智能复盘',
        shortTitle: '复盘',
        description: '智能分析市场表现和投资策略',
        isDefault: true,
        isActive: true
    },
    {
        id: 'watchlist',
        icon: '⭐',
        title: '自选股',
        shortTitle: '自选',
        description: '查看和管理我的自选股票',
        isDefault: true,
        isActive: true
    },
    {
        id: 'smart_recommendation',
        icon: '🎯',
        title: '智能荐股',
        shortTitle: '荐股',
        description: '基于AI算法推荐优质股票',
        isDefault: true,
        isActive: true
    },
    {
        id: 'news_update',
        icon: '📰',
        title: '资讯推送',
        shortTitle: '资讯',
        description: '获取最新市场资讯和重要公告',
        isDefault: true,
        isActive: true
    },
    {
        id: 'asset_analysis',
        icon: '💰',
        title: '我的资产',
        shortTitle: '资产',
        description: '查看投资组合和账户分析',
        isDefault: true,
        isActive: true
    }
]);

// 自定义快捷操作
const customShortcuts = ref([]);

// 可选图标列表
const availableIcons = ref([
    '💡', '🚀', '📊', '💰', '🎯', '⭐', '🔥', '📈', '💎', '🏆',
    '🎨', '⚡', '🌟', '📱', '💻', '📺', '⌚', '📷', '🎥', '🎧',
    '🏠', '🏢', '🏭', '🏪', '🏫', '🏥', '🏦', '🏨', '🚗', '🚕',
    '✈️', '🚁', '🚂', '🚄', '🌍', '🌎', '🌏', '🌐', '🗺️', '🗻'
]);

// 初始化数据
const initializeData = () => {
    // 加载自定义快捷操作
    const savedCustomShortcuts = localStorage.getItem('customShortcuts');
    if (savedCustomShortcuts) {
        customShortcuts.value = JSON.parse(savedCustomShortcuts);
    }

    // 加载默认快捷操作状态
    const savedStates = localStorage.getItem('defaultShortcutStates');
    if (savedStates) {
        const states = JSON.parse(savedStates);
        defaultShortcuts.value.forEach(shortcut => {
            if (states.hasOwnProperty(shortcut.id)) {
                shortcut.isActive = states[shortcut.id];
            }
        });
    }
};

// 保存自定义快捷操作
const saveCustomShortcuts = () => {
    localStorage.setItem('customShortcuts', JSON.stringify(customShortcuts.value));
    ElMessage.success('自定义快捷操作已保存');
    emitShortcutsUpdate();
};

// 保存默认快捷操作状态
const saveDefaultShortcutStates = () => {
    const states = defaultShortcuts.value.reduce((acc, s) => {
        acc[s.id] = s.isActive;
        return acc;
    }, {});
    localStorage.setItem('defaultShortcutStates', JSON.stringify(states));
    emitShortcutsUpdate();
};

// 发送快捷操作更新事件
const emitShortcutsUpdate = () => {
    emit('shortcuts-updated', {
        defaultShortcuts: defaultShortcuts.value,
        customShortcuts: customShortcuts.value
    });
};

// 添加自定义快捷操作
const addCustomShortcut = () => {
    if (customShortcuts.value.length >= 3) {
        ElMessage.warning('最多只能添加3个自定义快捷操作');
        return;
    }

    const newShortcut = {
        id: Date.now().toString(),
        icon: '💡',
        title: '自定义操作',
        shortTitle: '自定',
        description: '请编辑此操作的描述',
        prompt: '请输入您想要执行的操作内容',
        isDefault: false,
        isActive: true,
        isEditing: true
    };

    customShortcuts.value.push(newShortcut);
    ElMessage.success('已添加自定义快捷操作，请完善信息');
};

// 移除自定义快捷操作
const removeCustomShortcut = (id) => {
    const index = customShortcuts.value.findIndex(s => s.id === id);
    if (index > -1) {
        customShortcuts.value.splice(index, 1);
        saveCustomShortcuts();
        ElMessage.success('已删除自定义快捷操作');
    }
};

// 切换快捷操作激活状态
const toggleShortcutActive = (shortcut) => {
    if (shortcut.isDefault) {
        saveDefaultShortcutStates();
        ElMessage.success(shortcut.isActive ? '已启用该快捷操作' : '已禁用该快捷操作');
    } else {
        saveCustomShortcuts();
        ElMessage.success(shortcut.isActive ? '已启用该快捷操作' : '已禁用该快捷操作');
    }
};

// 开始编辑快捷操作
const startEditShortcut = (shortcut) => {
    shortcut.originalData = {
        icon: shortcut.icon,
        title: shortcut.title,
        shortTitle: shortcut.shortTitle,
        description: shortcut.description,
        prompt: shortcut.prompt
    };
    shortcut.isEditing = true;
};

// 保存编辑的快捷操作
const saveEditShortcut = (shortcut) => {
    if (!shortcut.title.trim()) {
        ElMessage.warning('标题不能为空');
        return;
    }
    if (!shortcut.shortTitle || !shortcut.shortTitle.trim()) {
        ElMessage.warning('简称不能为空');
        return;
    }
    if (shortcut.shortTitle.length > 2) {
        ElMessage.warning('简称最多2个字符');
        return;
    }
    if (!shortcut.prompt.trim()) {
        ElMessage.warning('执行内容不能为空');
        return;
    }

    shortcut.isEditing = false;
    delete shortcut.originalData;
    saveCustomShortcuts();
    ElMessage.success('自定义快捷操作已保存');
};

// 取消编辑快捷操作
const cancelEditShortcut = (shortcut) => {
    if (shortcut.originalData) {
        shortcut.icon = shortcut.originalData.icon;
        shortcut.title = shortcut.originalData.title;
        shortcut.shortTitle = shortcut.originalData.shortTitle;
        shortcut.description = shortcut.originalData.description;
        shortcut.prompt = shortcut.originalData.prompt;
        delete shortcut.originalData;
    }
    shortcut.isEditing = false;
};

// 选择图标
const selectIcon = (shortcut, icon) => {
    shortcut.icon = icon;
};

// 关闭对话框
const handleClose = () => {
    dialogVisible.value = false;
};

// 组件挂载时初始化
onMounted(() => {
    initializeData();
});
</script>

<style scoped>
.customize-dialog {
    border-radius: 16px;
    overflow: hidden;
}

.customize-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    margin: 0;
}

.customize-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 18px;
}

.customize-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
    font-size: 20px;
}

.customize-content {
    padding: 24px;
}

.section {
    margin-bottom: 32px;
}

.section:last-child {
    margin-bottom: 0;
}

.section-title h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.section-subtitle {
    font-size: 14px;
    color: #6b7280;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
}

.shortcut-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.shortcut-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.shortcut-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.icon-wrapper {
    width: 40px;
    height: 40px;
    background: #f3f4f6;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.shortcut-card.active .icon-wrapper {
    background: #dbeafe;
}

.card-content {
    text-align: left;
}

.shortcut-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
}

.shortcut-desc {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
}

.custom-shortcuts-list {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.custom-shortcut-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
}

.custom-shortcut-item.editing {
    border-color: #3b82f6;
    background: #eff6ff;
}

.shortcut-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.display-left {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
}

.shortcut-details {
    flex: 1;
}

.display-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.edit-form {
    margin-bottom: 20px;
}

.form-group {
    margin-bottom: 16px;
}

.form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: end;
}

.icon-selector {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.current-icon {
    display: flex;
    align-items: center;
    gap: 8px;
}

.selected-icon {
    width: 40px;
    height: 40px;
    background: #f3f4f6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid #e5e7eb;
}

.icon-options {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
    max-height: 120px;
    overflow-y: auto;
    padding: 8px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.icon-option {
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.icon-option:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.icon-option.selected {
    border-color: #3b82f6;
    background: #dbeafe;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
}

.empty-custom {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 12px;
    margin-top: 20px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text h5 {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    line-height: 1.5;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px 20px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
    .customize-dialog {
        width: 95vw !important;
        max-width: none !important;
        margin: 5vh auto !important;
    }

    .customize-content {
        padding: 16px;
    }

    .shortcuts-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    .shortcut-display {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }

    .display-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }

    .form-row {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .icon-options {
        grid-template-columns: repeat(auto-fill, minmax(35px, 1fr));
        gap: 6px;
    }

    .icon-option {
        width: 35px;
        height: 35px;
        font-size: 16px;
    }
}

.icon-options::-webkit-scrollbar {
    width: 4px;
}

.icon-options::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
}

.icon-options::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
    transition: background 0.2s ease;
}

.icon-options::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>
