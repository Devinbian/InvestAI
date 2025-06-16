<template>
    <div class="user-profile-overlay">
        <div class="user-profile">
            <!-- 关闭按钮 -->
            <div class="profile-close">
                <el-button type="text" @click="$emit('close')" class="close-btn">
                    <el-icon size="20">
                        <Close />
                    </el-icon>
                </el-button>
            </div>

            <!-- 个人中心头部 -->
            <div class="profile-header">
                <div class="header-background"></div>
                <div class="header-content">
                    <div class="user-avatar">
                        <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="头像" />
                        <div v-else class="default-avatar">
                            {{ userStore.userInfo?.nickname?.charAt(0)?.toUpperCase() || 'U' }}
                        </div>
                    </div>
                    <div class="user-info">
                        <h2 class="user-name">{{ userStore.userInfo?.nickname || '未设置昵称' }}</h2>
                        <p class="user-desc">{{ getUserLevelText() }} · 注册于 {{ getRegistrationDate() }}</p>
                        <div class="user-stats">
                            <div class="stat-item">
                                <span class="stat-value">¥{{ (userStore.balance || 0).toFixed(2) }}</span>
                                <span class="stat-label">账户余额</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ (userStore.watchlist || []).length }}</span>
                                <span class="stat-label">自选股</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ (userStore.portfolio || []).length }}</span>
                                <span class="stat-label">持仓股票</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <el-button type="primary" @click="showEditProfile = true" class="edit-profile-btn">
                            <el-icon>
                                <Edit />
                            </el-icon>
                            编辑资料
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 个人中心内容 -->
            <div class="profile-content">
                <el-tabs v-model="activeTab" class="profile-tabs">
                    <!-- 基本信息 -->
                    <el-tab-pane label="基本信息" name="basic">
                        <div class="tab-content">
                            <div class="info-section">
                                <h3 class="section-title">个人信息</h3>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <label class="info-label">用户名</label>
                                        <span class="info-value">{{ userStore.userInfo?.username || '未设置' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">昵称</label>
                                        <span class="info-value">{{ userStore.userInfo?.nickname || '未设置' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">手机号</label>
                                        <span class="info-value">{{ userStore.userInfo?.phone || '未绑定' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">邮箱</label>
                                        <span class="info-value">{{ userStore.userInfo?.email || '未绑定' }}</span>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">注册时间</label>
                                        <span class="info-value">{{ getRegistrationDate() }}</span>
                                    </div>
                                    <div class="info-item">
                                        <label class="info-label">最后登录</label>
                                        <span class="info-value">{{ getLastLoginTime() }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <h3 class="section-title">账户状态</h3>
                                <div class="status-grid">
                                    <div class="status-card verified">
                                        <div class="status-icon">
                                            <el-icon>
                                                <CircleCheck />
                                            </el-icon>
                                        </div>
                                        <div class="status-info">
                                            <h4>实名认证</h4>
                                            <p>已完成实名认证</p>
                                        </div>
                                    </div>
                                    <div class="status-card verified">
                                        <div class="status-icon">
                                            <el-icon>
                                                <CircleCheck />
                                            </el-icon>
                                        </div>
                                        <div class="status-info">
                                            <h4>手机验证</h4>
                                            <p>手机号已验证</p>
                                        </div>
                                    </div>
                                    <div class="status-card pending">
                                        <div class="status-icon">
                                            <el-icon>
                                                <Warning />
                                            </el-icon>
                                        </div>
                                        <div class="status-info">
                                            <h4>邮箱验证</h4>
                                            <p>邮箱未验证</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>

                    <!-- 账户设置 -->
                    <el-tab-pane label="账户设置" name="settings">
                        <div class="tab-content">
                            <div class="info-section">
                                <h3 class="section-title">安全设置</h3>
                                <div class="settings-list">
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h4>修改密码</h4>
                                            <p>定期修改密码，保护账户安全</p>
                                        </div>
                                        <el-button type="primary" size="small" @click="showChangePassword = true"
                                            class="setting-btn">
                                            修改
                                        </el-button>
                                    </div>
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h4>绑定手机</h4>
                                            <p>{{ userStore.userInfo?.phone || '未绑定手机号' }}</p>
                                        </div>
                                        <el-button size="small" @click="showBindPhone = true"
                                            class="setting-btn-secondary">
                                            {{ userStore.userInfo?.phone ? '更换' : '绑定' }}
                                        </el-button>
                                    </div>
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h4>绑定邮箱</h4>
                                            <p>{{ userStore.userInfo?.email || '未绑定邮箱' }}</p>
                                        </div>
                                        <el-button size="small" @click="showBindEmail = true"
                                            class="setting-btn-secondary">
                                            {{ userStore.userInfo?.email ? '更换' : '绑定' }}
                                        </el-button>
                                    </div>
                                </div>
                            </div>

                            <div class="info-section">
                                <h3 class="section-title">通知设置</h3>
                                <div class="notification-settings">
                                    <div class="notification-item">
                                        <div class="notification-info">
                                            <h4>价格提醒</h4>
                                            <p>股票价格达到设定值时通知</p>
                                        </div>
                                        <el-switch v-model="notificationSettings.priceAlert" />
                                    </div>
                                    <div class="notification-item">
                                        <div class="notification-info">
                                            <h4>交易提醒</h4>
                                            <p>买卖交易完成时通知</p>
                                        </div>
                                        <el-switch v-model="notificationSettings.tradeAlert" />
                                    </div>
                                    <div class="notification-item">
                                        <div class="notification-info">
                                            <h4>市场资讯</h4>
                                            <p>重要市场消息推送</p>
                                        </div>
                                        <el-switch v-model="notificationSettings.newsAlert" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <!-- 编辑资料对话框 -->
            <el-dialog v-model="showEditProfile" title="编辑个人资料" width="500px" class="profile-dialog">
                <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
                    <el-form-item label="昵称" prop="nickname">
                        <el-input v-model="editForm.nickname" placeholder="请输入昵称" class="profile-input" />
                    </el-form-item>
                    <el-form-item label="手机号" prop="phone">
                        <el-input v-model="editForm.phone" placeholder="请输入手机号" class="profile-input" />
                    </el-form-item>
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="editForm.email" placeholder="请输入邮箱" class="profile-input" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showEditProfile = false" class="dialog-cancel-btn">取消</el-button>
                    <el-button type="primary" @click="saveProfile" :loading="saving"
                        class="dialog-submit-btn">保存</el-button>
                </template>
            </el-dialog>

            <!-- 修改密码对话框 -->
            <el-dialog v-model="showChangePassword" title="修改密码" width="400px" class="profile-dialog">
                <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
                    <el-form-item label="当前密码" prop="currentPassword">
                        <el-input v-model="passwordForm.currentPassword" type="password" show-password
                            class="profile-input" />
                    </el-form-item>
                    <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" type="password" show-password
                            class="profile-input" />
                    </el-form-item>
                    <el-form-item label="确认密码" prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" type="password" show-password
                            class="profile-input" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showChangePassword = false" class="dialog-cancel-btn">取消</el-button>
                    <el-button type="primary" @click="changePassword" :loading="changingPassword"
                        class="dialog-submit-btn">确认修改</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage } from 'element-plus';
import { Edit, Close, CircleCheck, Warning } from '@element-plus/icons-vue';

// 定义emit事件
const emit = defineEmits(['close']);

const userStore = useUserStore();

// 响应式数据
const activeTab = ref('basic');
const showEditProfile = ref(false);
const showChangePassword = ref(false);
const showBindPhone = ref(false);
const showBindEmail = ref(false);
const saving = ref(false);
const changingPassword = ref(false);

// 通知设置
const notificationSettings = reactive({
    priceAlert: true,
    tradeAlert: true,
    newsAlert: false,
    systemAlert: true
});

// 编辑表单
const editForm = reactive({
    nickname: '',
    phone: '',
    email: ''
});

const editRules = {
    nickname: [
        { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
    ],
    email: [
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ]
};

// 密码表单
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const passwordRules = {
    currentPassword: [
        { required: true, message: '请输入当前密码', trigger: 'blur' }
    ],
    newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        {
            validator: (rule, value) => {
                if (value !== passwordForm.newPassword) {
                    return Promise.reject('两次输入的密码不一致');
                }
                return Promise.resolve();
            }, trigger: 'blur'
        }
    ]
};

// 方法
const getUserLevelText = () => {
    const balance = userStore.balance;
    if (balance >= 1000000) return '钻石用户';
    if (balance >= 500000) return '黄金用户';
    if (balance >= 100000) return '白银用户';
    return '普通用户';
};

const getRegistrationDate = () => {
    return '2024年1月1日';
};

const getLastLoginTime = () => {
    return '2024年1月15日 14:30';
};

const saveProfile = async () => {
    saving.value = true;

    setTimeout(() => {
        userStore.setUserInfo({
            ...userStore.userInfo,
            nickname: editForm.nickname,
            phone: editForm.phone,
            email: editForm.email
        });

        ElMessage.success('个人资料保存成功');
        showEditProfile.value = false;
        saving.value = false;
    }, 1000);
};

const changePassword = async () => {
    changingPassword.value = true;

    setTimeout(() => {
        ElMessage.success('密码修改成功');
        showChangePassword.value = false;
        changingPassword.value = false;

        Object.keys(passwordForm).forEach(key => {
            passwordForm[key] = '';
        });
    }, 1000);
};

const initEditForm = () => {
    editForm.nickname = userStore.userInfo?.nickname || '';
    editForm.phone = userStore.userInfo?.phone || '';
    editForm.email = userStore.userInfo?.email || '';
};

onMounted(() => {
    initEditForm();
});
</script>

<style scoped>
.user-profile-overlay {
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

.user-profile {
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

.profile-close {
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

.profile-header {
    position: relative;
    background: white;
    margin-bottom: 24px;
    overflow: visible;
    flex-shrink: 0;
}

.header-background {
    height: 120px;
    background: linear-gradient(135deg, #18181b 0%, #374151 100%);
}

.header-content {
    position: relative;
    padding: 24px 32px 32px 32px;
    margin-top: -70px;
    display: flex;
    align-items: flex-end;
    gap: 24px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 16px;
    margin-left: 32px;
    margin-right: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
}

.user-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid white;
    overflow: hidden;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.default-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #18181b;
    color: white;
    font-size: 2rem;
    font-weight: 600;
}

.user-info {
    flex: 1;
    padding-bottom: 8px;
}

.user-name {
    font-size: 1.5rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.user-desc {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0 0 12px 0;
    font-weight: 500;
}

.user-stats {
    display: flex;
    gap: 24px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #18181b;
}

.stat-label {
    font-size: 0.75rem;
    color: #9ca3af;
    font-weight: 500;
}

.header-actions {
    padding-bottom: 8px;
}

.edit-profile-btn {
    background: #18181b;
    border-color: #18181b;
    color: white;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.edit-profile-btn:hover {
    background: #000000;
    border-color: #000000;
    transform: translateY(-1px);
}

.profile-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 32px 32px 32px;
    background: #f9fafb;
}

.profile-tabs {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 100%;
    border: 1px solid #e5e7eb;
}

.tab-content {
    padding-top: 24px;
    max-height: calc(90vh - 300px);
    overflow-y: auto;
}

.info-section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #f3f4f6;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.info-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}

.info-label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
}

.info-value {
    color: #18181b;
    font-weight: 500;
    font-size: 0.875rem;
}

/* 状态卡片 */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

.status-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-radius: 12px;
    background: white;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.status-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-card.verified {
    border-color: #10b981;
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.status-card.pending {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fefce8 100%);
}

.status-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.status-card.verified .status-icon {
    background: #10b981;
    color: white;
}

.status-card.pending .status-icon {
    background: #f59e0b;
    color: white;
}

.status-info h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 2px 0;
}

.status-info p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
}

.settings-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    transition: all 0.2s ease;
}

.setting-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.setting-info h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.setting-info p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
}

.setting-btn {
    background: #18181b;
    border-color: #18181b;
    color: white;
    border-radius: 6px;
    font-weight: 500;
}

.setting-btn:hover {
    background: #000000;
    border-color: #000000;
}

.setting-btn-secondary {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #18181b;
    border-radius: 6px;
    font-weight: 500;
}

.setting-btn-secondary:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
}

/* 通知设置 */
.notification-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.notification-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    transition: all 0.2s ease;
}

.notification-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notification-info h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px 0;
}

.notification-info p {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0;
}

/* 对话框样式 */
:deep(.profile-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.profile-dialog .el-dialog__header) {
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    padding: 20px 24px;
}

:deep(.profile-dialog .el-dialog__title) {
    font-size: 1.125rem;
    font-weight: 600;
    color: #18181b;
}

:deep(.profile-dialog .el-dialog__body) {
    padding: 24px;
}

:deep(.profile-input .el-input__wrapper) {
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    transition: all 0.2s ease;
}

:deep(.profile-input .el-input__wrapper:hover) {
    border-color: #d1d5db;
}

:deep(.profile-input.is-focus .el-input__wrapper) {
    border-color: #18181b;
    box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.1);
}

.dialog-cancel-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #6b7280;
    border-radius: 8px;
    font-weight: 500;
}

.dialog-cancel-btn:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
    color: #374151;
}

.dialog-submit-btn {
    background: #18181b;
    border-color: #18181b;
    color: white;
    border-radius: 8px;
    font-weight: 500;
}

.dialog-submit-btn:hover {
    background: #000000;
    border-color: #000000;
}

/* Tab样式覆盖 */
:deep(.profile-tabs .el-tabs__header) {
    margin: 0 0 20px 0;
    border-bottom: 2px solid #f3f4f6;
}

:deep(.profile-tabs .el-tabs__nav-wrap::after) {
    display: none;
}

:deep(.profile-tabs .el-tabs__item) {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 0 20px;
    height: 40px;
    line-height: 40px;
}

:deep(.profile-tabs .el-tabs__item.is-active) {
    color: #18181b;
    font-weight: 600;
}

:deep(.profile-tabs .el-tabs__active-bar) {
    background-color: #18181b;
    height: 3px;
}

/* Switch样式覆盖 */
:deep(.el-switch.is-checked .el-switch__core) {
    background-color: #18181b;
    border-color: #18181b;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .user-profile {
        width: 95vw;
        height: 95vh;
    }

    .profile-content {
        padding: 0 16px 24px 16px;
    }

    .header-content {
        padding: 0 16px 20px 16px;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
    }

    .user-stats {
        justify-content: center;
        gap: 20px;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

    .tab-content {
        max-height: calc(95vh - 280px);
    }
}
</style>
