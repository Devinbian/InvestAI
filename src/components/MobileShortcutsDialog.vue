<template>
    <div class="mobile-shortcuts-dialog" v-if="modelValue" @click="handleClose">
        <div class="mobile-dialog-container" @click.stop>
            <!-- 头部 -->
            <div class="mobile-dialog-header">
                <h3 class="dialog-title">快捷操作</h3>
                <button class="close-btn" @click="handleClose">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </button>
            </div>

            <!-- 内容区域 -->
            <div class="mobile-dialog-content">
                <!-- 默认快捷操作 -->
                <div class="section">
                    <div class="section-title">
                        <h4>系统快捷操作</h4>
                        <span class="section-subtitle">开启或关闭预设的快捷操作</span>
                    </div>
                    <div class="shortcuts-list">
                        <div v-for="shortcut in defaultShortcuts" :key="shortcut.id" class="shortcut-item">
                            <div class="shortcut-info">
                                <div class="shortcut-icon">{{ shortcut.icon }}</div>
                                <div class="shortcut-details">
                                    <div class="shortcut-name">{{ shortcut.title }}</div>
                                    <div class="shortcut-desc">{{ shortcut.description }}</div>
                                </div>
                            </div>
                            <div class="shortcut-toggle">
                                <input type="checkbox" :id="`toggle-${shortcut.id}`" v-model="shortcut.isActive"
                                    @change="toggleShortcutActive(shortcut)" class="toggle-switch">
                                <label :for="`toggle-${shortcut.id}`" class="toggle-label"></label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 自定义快捷操作 -->
                <div class="section">
                    <div class="section-header">
                        <div class="section-title">
                            <h4>自定义快捷操作</h4>
                            <span class="section-subtitle">创建专属的快捷操作（最多3个）</span>
                        </div>
                        <button class="add-custom-btn" @click="addCustomShortcut"
                            :disabled="customShortcuts.length >= 3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                            添加
                        </button>
                    </div>

                    <!-- 自定义快捷操作列表 -->
                    <div class="custom-shortcuts-list" v-if="customShortcuts.length > 0">
                        <div v-for="shortcut in customShortcuts" :key="shortcut.id" class="custom-shortcut-item">
                            <!-- 显示模式 -->
                            <div class="shortcut-display" v-if="!shortcut.isEditing">
                                <div class="shortcut-info">
                                    <div class="shortcut-icon">{{ shortcut.icon }}</div>
                                    <div class="shortcut-details">
                                        <div class="shortcut-name">{{ shortcut.title }}</div>
                                        <div class="shortcut-desc">{{ shortcut.description }}</div>
                                    </div>
                                </div>
                                <div class="shortcut-actions">
                                    <div class="shortcut-toggle">
                                        <input type="checkbox" :id="`custom-toggle-${shortcut.id}`"
                                            v-model="shortcut.isActive" @change="saveCustomShortcuts"
                                            class="toggle-switch">
                                        <label :for="`custom-toggle-${shortcut.id}`" class="toggle-label"></label>
                                    </div>
                                    <button class="edit-btn" @click="startEditShortcut(shortcut)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                                stroke="currentColor" stroke-width="2" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </button>
                                    <button class="delete-btn" @click="removeCustomShortcut(shortcut.id)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
                                                stroke="currentColor" stroke-width="2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <!-- 编辑模式 -->
                            <div class="shortcut-edit" v-else>
                                <div class="edit-form">
                                    <!-- 图标选择 -->
                                    <div class="form-group">
                                        <label class="form-label">图标</label>
                                        <div class="icon-selector">
                                            <div class="current-icon" @click="showIconPicker = shortcut.id">
                                                <span>{{ shortcut.icon }}</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" />
                                                </svg>
                                            </div>
                                            <div v-if="showIconPicker === shortcut.id" class="icon-picker" @click.stop>
                                                <div class="icon-grid">
                                                    <div v-for="icon in availableIcons" :key="icon"
                                                        :class="['icon-option', { 'selected': shortcut.icon === icon }]"
                                                        @click="selectIcon(shortcut, icon)">
                                                        {{ icon }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 基本信息 -->
                                    <div class="form-group">
                                        <label class="form-label">操作名称</label>
                                        <input v-model="shortcut.title" class="form-input" placeholder="如：个股深度分析"
                                            maxlength="10">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">简称（2字）</label>
                                        <input v-model="shortcut.shortTitle" class="form-input" placeholder="如：深析"
                                            maxlength="2">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">操作描述</label>
                                        <input v-model="shortcut.description" class="form-input"
                                            placeholder="简单描述这个操作的用途" maxlength="50">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">执行内容</label>
                                        <textarea v-model="shortcut.prompt" class="form-textarea"
                                            placeholder="如：分析贵州茅台的财务数据和未来3年盈利预测，包括ROE、净利润增长率等关键指标..." maxlength="500"
                                            rows="4"></textarea>
                                    </div>
                                </div>

                                <div class="edit-actions">
                                    <button class="cancel-btn" @click="cancelEditShortcut(shortcut)">取消</button>
                                    <button class="save-btn" @click="saveEditShortcut(shortcut)">保存</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 空状态 -->
                    <div v-else class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">
                            <h5>还没有自定义快捷操作</h5>
                            <p>点击"添加"按钮，创建专属的快捷操作</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'shortcuts-updated']);

// 显示图标选择器
const showIconPicker = ref(null);

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
        alert('最多只能添加3个自定义快捷操作');
        return;
    }

    const newShortcut = {
        id: Date.now().toString(),
        icon: '💡',
        title: '自定义操作',
        shortTitle: '自定',
        description: '请编辑此操作的描述',
        prompt: '分析目标股票的基本面数据，包括PE、PB、ROE等核心指标，并给出投资建议',
        isDefault: false,
        isActive: true,
        isEditing: true
    };

    customShortcuts.value.push(newShortcut);
};

// 移除自定义快捷操作
const removeCustomShortcut = (id) => {
    const index = customShortcuts.value.findIndex(s => s.id === id);
    if (index > -1) {
        customShortcuts.value.splice(index, 1);
        saveCustomShortcuts();
    }
};

// 切换快捷操作激活状态
const toggleShortcutActive = (shortcut) => {
    if (shortcut.isDefault) {
        saveDefaultShortcutStates();
    } else {
        saveCustomShortcuts();
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
        alert('标题不能为空');
        return;
    }
    if (!shortcut.shortTitle || !shortcut.shortTitle.trim()) {
        alert('简称不能为空');
        return;
    }
    if (shortcut.shortTitle.length > 2) {
        alert('简称最多2个字符');
        return;
    }
    if (!shortcut.prompt.trim()) {
        alert('执行内容不能为空');
        return;
    }

    shortcut.isEditing = false;
    delete shortcut.originalData;
    saveCustomShortcuts();
    showIconPicker.value = null;
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
    showIconPicker.value = null;
};

// 选择图标
const selectIcon = (shortcut, icon) => {
    shortcut.icon = icon;
    showIconPicker.value = null;
};

// 关闭对话框
const handleClose = () => {
    emit('update:modelValue', false);
    showIconPicker.value = null;
};

// 点击外部关闭图标选择器
watch(() => props.modelValue, (newVal) => {
    if (!newVal) {
        showIconPicker.value = null;
    }
});

// 组件挂载时初始化
onMounted(() => {
    initializeData();
});
</script>

<style scoped>
.mobile-shortcuts-dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.mobile-dialog-container {
    width: 100%;
    max-height: 90vh;
    background: white;
    border-radius: 20px 20px 0 0;
    overflow: hidden;
    animation: slideUp 0.3s ease;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
    }

    to {
        transform: translateY(0);
    }
}

.mobile-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 15px 20px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
}

.dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
}

.close-btn:active {
    background: #e0e0e0;
    transform: scale(0.95);
}

.mobile-dialog-content {
    padding: 0 20px 20px 20px;
    max-height: calc(90vh - 80px);
    overflow-y: auto;
}

.section {
    margin-bottom: 30px;
}

.section:last-child {
    margin-bottom: 0;
}

.section-title {
    margin-bottom: 15px;
}

.section-title h4 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 5px 0;
}

.section-subtitle {
    font-size: 13px;
    color: #999;
}

.section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 15px;
}

.add-custom-btn {
    padding: 8px 16px;
    background: #007AFF;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.add-custom-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.add-custom-btn:not(:disabled):active {
    background: #0056b3;
    transform: scale(0.95);
}

.shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
}

.shortcut-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.shortcut-icon {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 1px solid #e9ecef;
}

.shortcut-details {
    flex: 1;
}

.shortcut-name {
    font-size: 15px;
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
}

.shortcut-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
}

.shortcut-toggle {
    position: relative;
}

.toggle-switch {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-label {
    display: block;
    width: 48px;
    height: 28px;
    background: #ccc;
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s ease;
}

.toggle-label::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
}

.toggle-switch:checked+.toggle-label {
    background: #007AFF;
}

.toggle-switch:checked+.toggle-label::after {
    transform: translateX(20px);
}

.custom-shortcuts-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.custom-shortcut-item {
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    overflow: hidden;
}

.shortcut-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
}

.shortcut-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.edit-btn,
.delete-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    cursor: pointer;
    transition: all 0.2s ease;
}

.edit-btn:active,
.delete-btn:active {
    background: #e0e0e0;
    transform: scale(0.95);
}

.delete-btn {
    color: #ff4757;
}

.shortcut-edit {
    padding: 20px;
    background: white;
    border-top: 1px solid #e9ecef;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

.form-input,
.form-textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: #007AFF;
}

.form-textarea {
    resize: vertical;
    min-height: 80px;
}

.icon-selector {
    position: relative;
}

.current-icon {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: border-color 0.2s ease;
}

.current-icon:active {
    border-color: #007AFF;
}

.icon-picker {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 8px;
}

.icon-option {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.icon-option:active {
    background: #f0f0f0;
    transform: scale(0.95);
}

.icon-option.selected {
    background: #007AFF;
    border-color: #007AFF;
    color: white;
}

.edit-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;
}

.cancel-btn,
.save-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-btn {
    background: #f5f5f5;
    color: #666;
}

.cancel-btn:active {
    background: #e0e0e0;
    transform: scale(0.98);
}

.save-btn {
    background: #007AFF;
    color: white;
}

.save-btn:active {
    background: #0056b3;
    transform: scale(0.98);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #999;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.empty-text h5 {
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin: 0 0 8px 0;
}

.empty-text p {
    font-size: 14px;
    color: #999;
    margin: 0;
    line-height: 1.5;
}

/* 滚动条样式 */
.mobile-dialog-content::-webkit-scrollbar {
    width: 4px;
}

.mobile-dialog-content::-webkit-scrollbar-track {
    background: transparent;
}

.mobile-dialog-content::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
}

.icon-picker::-webkit-scrollbar {
    width: 4px;
}

.icon-picker::-webkit-scrollbar-track {
    background: transparent;
}

.icon-picker::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
}
</style>
