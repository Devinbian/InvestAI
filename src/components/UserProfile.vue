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
                                <span class="stat-label">股票交易账户</span>
                                <el-button type="primary" size="small" @click="showStockRecharge = true"
                                    class="recharge-btn">
                                    充值
                                </el-button>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">{{ (userStore.smartPointsBalance || 0).toFixed(0) }}</span>
                                <span class="stat-label">智点余额</span>
                                <el-button type="success" size="small" @click="showSmartPointsRecharge = true"
                                    class="recharge-btn">
                                    购买
                                </el-button>
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

                    <!-- 账户管理 -->
                    <el-tab-pane label="账户管理" name="accounts">
                        <div class="tab-content">
                            <div class="accounts-container">
                                <!-- 股票交易账户 -->
                                <div class="account-card stock-account">
                                    <div class="account-header">
                                        <div class="account-icon">
                                            <el-icon size="24">
                                                <TrendCharts />
                                            </el-icon>
                                        </div>
                                        <div class="account-info">
                                            <h3>股票交易账户</h3>
                                            <p>专门用于股票买卖交易</p>
                                        </div>
                                    </div>
                                    <div class="account-balance">
                                        <div class="balance-amount">
                                            <span class="currency">¥</span>
                                            <span class="amount">{{ (userStore.balance || 0).toFixed(2) }}</span>
                                        </div>
                                        <div class="balance-actions">
                                            <el-button type="primary" @click="showStockRecharge = true">
                                                <el-icon>
                                                    <Plus />
                                                </el-icon>
                                                充值
                                            </el-button>
                                            <el-button @click="showTransferDialog = true">
                                                <el-icon>
                                                    <Switch />
                                                </el-icon>
                                                转账
                                            </el-button>
                                        </div>
                                    </div>
                                    <div class="account-stats">
                                        <div class="stat-row">
                                            <span class="stat-label">今日盈亏：</span>
                                            <span class="stat-value profit">+¥1,234.56</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">总资产：</span>
                                            <span class="stat-value">¥{{ getTotalAssets().toFixed(2) }}</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">持仓市值：</span>
                                            <span class="stat-value">¥{{ getPortfolioValue().toFixed(2) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 智点账户 -->
                                <div class="account-card points-account">
                                    <div class="account-header">
                                        <div class="account-icon">
                                            <el-icon size="24">
                                                <Star />
                                            </el-icon>
                                        </div>
                                        <div class="account-info">
                                            <h3>智点账户</h3>
                                            <p>用于购买AI分析、专业报告等付费服务</p>
                                        </div>
                                    </div>
                                    <div class="account-balance">
                                        <div class="balance-amount points-balance">
                                            <span class="amount">{{ (userStore.smartPointsBalance || 0).toFixed(0)
                                                }}</span>
                                            <span class="currency">智点</span>
                                        </div>
                                        <div class="balance-actions">
                                            <el-button type="success" @click="showSmartPointsRecharge = true">
                                                <el-icon>
                                                    <Plus />
                                                </el-icon>
                                                购买智点
                                            </el-button>
                                            <el-button @click="showPointsHistory = true">
                                                <el-icon>
                                                    <List />
                                                </el-icon>
                                                使用记录
                                            </el-button>
                                        </div>
                                    </div>
                                    <div class="account-stats">
                                        <div class="stat-row">
                                            <span class="stat-label">兑换比例：</span>
                                            <span class="stat-value">1元 = 1智点</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">本月消费：</span>
                                            <span class="stat-value">120智点</span>
                                        </div>
                                        <div class="stat-row">
                                            <span class="stat-label">可用服务：</span>
                                            <span class="stat-value">AI分析、专业报告</span>
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

            <!-- 股票账户充值对话框 -->
            <el-dialog v-model="showStockRecharge" title="股票交易账户充值" width="600px"
                class="profile-dialog recharge-dialog">
                <div class="recharge-content">
                    <div class="current-balance">
                        <span class="balance-label">当前余额：</span>
                        <span class="balance-value">¥{{ (userStore.balance || 0).toFixed(2) }}</span>
                    </div>

                    <div class="recharge-row">
                        <div class="recharge-amounts">
                            <h4>选择充值金额</h4>
                            <div class="amount-grid">
                                <div v-for="amount in rechargeAmounts" :key="amount" class="amount-item"
                                    :class="{ active: selectedAmount === amount }" @click="selectedAmount = amount">
                                    ¥{{ amount }}
                                </div>
                            </div>
                        </div>

                        <div class="payment-methods">
                            <h4>支付方式</h4>
                            <div class="payment-grid">
                                <div class="payment-item" :class="{ active: selectedPayment === 'alipay' }"
                                    @click="selectedPayment = 'alipay'">
                                    <div class="payment-icon alipay">支</div>
                                    <span>支付宝</span>
                                </div>
                                <div class="payment-item" :class="{ active: selectedPayment === 'wechat' }"
                                    @click="selectedPayment = 'wechat'">
                                    <div class="payment-icon wechat">微</div>
                                    <span>微信支付</span>
                                </div>
                                <div class="payment-item" :class="{ active: selectedPayment === 'bank' }"
                                    @click="selectedPayment = 'bank'">
                                    <div class="payment-icon bank">银</div>
                                    <span>银行卡</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="custom-amount">
                        <h4>自定义金额</h4>
                        <el-input v-model="customAmount" placeholder="请输入充值金额" type="number" min="1" max="100000"
                            class="profile-input" @input="selectedAmount = null">
                            <template #prepend>¥</template>
                        </el-input>
                    </div>

                    <div class="recharge-summary">
                        <div class="summary-item">
                            <span>充值金额：</span>
                            <span class="amount">¥{{ getFinalAmount() }}</span>
                        </div>
                        <div class="summary-item">
                            <span>充值后余额：</span>
                            <span class="amount">¥{{ ((userStore.balance || 0) + getFinalAmount()).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <el-button @click="showStockRecharge = false" class="dialog-cancel-btn">取消</el-button>
                    <el-button type="primary" @click="handleStockRecharge" :loading="stockRecharging"
                        :disabled="getFinalAmount() <= 0" class="dialog-submit-btn">
                        确认充值 ¥{{ getFinalAmount() }}
                    </el-button>
                </template>
            </el-dialog>

            <!-- 智点购买对话框 -->
            <el-dialog v-model="showSmartPointsRecharge" title="购买智点" width="600px"
                class="profile-dialog recharge-dialog">
                <div class="recharge-content">
                    <div class="current-balance">
                        <span class="balance-label">当前智点余额：</span>
                        <span class="balance-value">{{ (userStore.smartPointsBalance || 0).toFixed(0) }}智点</span>
                    </div>
                    <div class="current-balance">
                        <span class="balance-label">股票账户余额：</span>
                        <span class="balance-value">¥{{ (userStore.balance || 0).toFixed(2) }}</span>
                    </div>

                    <div class="points-row">
                        <div class="points-info">
                            <div class="info-card">
                                <h4>兑换说明</h4>
                                <p>• 1元人民币 = 1智点</p>
                                <p>• 智点用于购买AI分析、专业报告等付费服务</p>
                                <p>• 智点不可提现，仅限平台内消费</p>
                            </div>
                        </div>

                        <div class="recharge-amounts">
                            <h4>选择购买金额</h4>
                            <div class="amount-grid">
                                <div v-for="amount in smartPointsAmounts" :key="amount" class="amount-item"
                                    :class="{ active: selectedSmartPointsAmount === amount }"
                                    @click="selectedSmartPointsAmount = amount">
                                    <div class="amount-cash">¥{{ amount }}</div>
                                    <div class="amount-points">{{ amount * 1 }}智点</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="custom-amount">
                        <h4>自定义金额</h4>
                        <el-input v-model="customSmartPointsAmount" placeholder="请输入购买金额" type="number" min="1"
                            max="10000" class="profile-input" @input="selectedSmartPointsAmount = null">
                            <template #prepend>¥</template>
                            <template #append>= {{ (customSmartPointsAmount * 1 || 0) }}智点</template>
                        </el-input>
                    </div>

                    <div class="recharge-summary">
                        <div class="summary-item">
                            <span>购买金额：</span>
                            <span class="amount">¥{{ getSmartPointsFinalAmount() }}</span>
                        </div>
                        <div class="summary-item">
                            <span>获得智点：</span>
                            <span class="amount">{{ getSmartPointsFinalAmount() * 1 }}智点</span>
                        </div>
                        <div class="summary-item">
                            <span>购买后余额：</span>
                            <span class="amount">{{ ((userStore.smartPointsBalance || 0) + getSmartPointsFinalAmount() *
                                1).toFixed(0) }}智点</span>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <el-button @click="showSmartPointsRecharge = false" class="dialog-cancel-btn">取消</el-button>
                    <el-button type="success" @click="handleSmartPointsPurchase" :loading="smartPointsPurchasing"
                        :disabled="getSmartPointsFinalAmount() <= 0 || userStore.balance < getSmartPointsFinalAmount()"
                        class="dialog-submit-btn">
                        确认购买 {{ getSmartPointsFinalAmount() * 1 }}智点
                    </el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../store/user';
import { ElMessage } from 'element-plus';
import { Edit, Close, CircleCheck, Warning, TrendCharts, Star, Plus, Switch, List } from '@element-plus/icons-vue';

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
const showStockRecharge = ref(false);
const showSmartPointsRecharge = ref(false);
const showTransferDialog = ref(false);
const showPointsHistory = ref(false);
const selectedAmount = ref(null);
const selectedPayment = ref(null);
const customAmount = ref(null);
const stockRecharging = ref(false);
const selectedSmartPointsAmount = ref(null);
const customSmartPointsAmount = ref(null);
const smartPointsPurchasing = ref(false);

// 充值金额选项
const rechargeAmounts = [100, 500, 1000, 2000, 5000, 10000];
// 智点购买金额选项
const smartPointsAmounts = [10, 50, 100, 200, 500, 1000];

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

const getFinalAmount = () => {
    if (selectedAmount.value) {
        return selectedAmount.value;
    } else if (customAmount.value) {
        return parseFloat(customAmount.value) || 0;
    } else {
        return 0;
    }
};

const handleStockRecharge = async () => {
    const amount = getFinalAmount();
    if (amount <= 0) {
        ElMessage.warning('请选择充值金额');
        return;
    }

    if (!selectedPayment.value) {
        ElMessage.warning('请选择支付方式');
        return;
    }

    stockRecharging.value = true;

    // 模拟支付过程
    setTimeout(() => {
        userStore.addBalance(amount);
        ElMessage.success(`股票交易账户充值成功！已充值 ¥${amount.toFixed(2)}`);

        // 重置表单
        selectedAmount.value = null;
        customAmount.value = null;
        selectedPayment.value = null;
        showStockRecharge.value = false;
        stockRecharging.value = false;
    }, 2000);
};

const getSmartPointsFinalAmount = () => {
    if (selectedSmartPointsAmount.value) {
        return selectedSmartPointsAmount.value;
    } else if (customSmartPointsAmount.value) {
        return parseFloat(customSmartPointsAmount.value) || 0;
    } else {
        return 0;
    }
};

const handleSmartPointsPurchase = async () => {
    const amount = getSmartPointsFinalAmount();
    if (amount <= 0) {
        ElMessage.warning('请选择购买金额');
        return;
    }

    if (userStore.balance < amount) {
        ElMessage.warning('股票交易账户余额不足');
        return;
    }

    smartPointsPurchasing.value = true;

    // 模拟购买过程
    setTimeout(() => {
        const result = userStore.purchaseSmartPoints(amount);
        if (result.success) {
            ElMessage.success(result.message);
            // 重置表单
            selectedSmartPointsAmount.value = null;
            customSmartPointsAmount.value = null;
            showSmartPointsRecharge.value = false;
        } else {
            ElMessage.error(result.message);
        }
        smartPointsPurchasing.value = false;
    }, 1500);
};

const getTotalAssets = () => {
    return userStore.getTotalAssets();
};

const getPortfolioValue = () => {
    return userStore.portfolio.reduce((total, position) => {
        return total + position.quantity * parseFloat(position.price || position.avgPrice);
    }, 0);
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

.recharge-btn {
    margin-top: 8px;
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.75rem;
    padding: 4px 12px;
    height: auto;
}

.recharge-btn:hover {
    background: #2563eb;
    border-color: #2563eb;
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
    max-height: calc(90vh - 320px);
    overflow-y: auto;
    padding-bottom: 60px;
    box-sizing: border-box;
}

/* Tab内容滚动条样式 */
.tab-content::-webkit-scrollbar {
    width: 6px;
}

.tab-content::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

.info-section {
    margin-bottom: 32px;
}

.info-section:last-child {
    margin-bottom: 80px;
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

/* 充值对话框样式 */
.recharge-dialog {
    max-height: 90vh;
}

.recharge-dialog :deep(.el-dialog__body) {
    padding: 16px 20px;
    max-height: 70vh;
    overflow-y: auto;
}

.recharge-content {
    padding: 0;
}

/* 横向布局 */
.recharge-row {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
}

.recharge-row .recharge-amounts {
    flex: 1;
    margin-bottom: 0;
}

.recharge-row .payment-methods {
    flex: 1;
    margin-bottom: 0;
}

.points-row {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
}

.points-row .points-info {
    flex: 1;
    margin-bottom: 0;
}

.points-row .recharge-amounts {
    flex: 1;
    margin-bottom: 0;
}

.current-balance {
    text-align: center;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 16px;
}

.balance-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-right: 8px;
}

.balance-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #18181b;
}

.recharge-amounts h4,
.custom-amount h4,
.payment-methods h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 8px 0;
}

.amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 0;
}

.amount-item {
    padding: 12px 8px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
}

.amount-item:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.amount-item.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
}

.custom-amount {
    margin-bottom: 16px;
}

.payment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 0;
}

.payment-item {
    padding: 12px 8px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
}

.payment-item:hover {
    border-color: #3b82f6;
    background: #eff6ff;
}

.payment-item.active {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
}

.payment-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.8rem;
}

.payment-icon.alipay {
    background: #1677ff;
    color: white;
}

.payment-icon.wechat {
    background: #07c160;
    color: white;
}

.payment-icon.bank {
    background: #f56565;
    color: white;
}

.payment-item.active .payment-icon {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.recharge-summary {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.summary-item:last-child {
    margin-bottom: 0;
    font-weight: 600;
    color: #18181b;
}

.summary-item .amount {
    font-weight: 600;
    color: #3b82f6;
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

    .accounts-container {
        grid-template-columns: 1fr;
    }

    .account-card {
        margin-bottom: 20px;
    }

    .amount-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .payment-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .recharge-row {
        flex-direction: column;
        gap: 16px;
    }

    .points-row {
        flex-direction: column;
        gap: 16px;
    }

    .recharge-dialog {
        width: 95vw !important;
        max-width: 500px;
    }
}

/* 账户管理样式 */
.accounts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 20px;
}

.account-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.account-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.stock-account {
    border-left: 4px solid #3b82f6;
}

.points-account {
    border-left: 4px solid #10b981;
}

.account-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}

.account-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.stock-account .account-icon {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.points-account .account-icon {
    background: linear-gradient(135deg, #10b981, #059669);
}

.account-info h3 {
    margin: 0 0 4px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #18181b;
}

.account-info p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
}

.account-balance {
    margin-bottom: 24px;
}

.balance-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 16px;
}

.balance-amount .currency {
    font-size: 1.125rem;
    font-weight: 500;
    color: #6b7280;
}

.balance-amount .amount {
    font-size: 2rem;
    font-weight: 700;
    color: #18181b;
}

.points-balance .currency {
    order: 2;
    color: #10b981;
}

.points-balance .amount {
    color: #10b981;
}

.balance-actions {
    display: flex;
    gap: 12px;
}

.balance-actions .el-button {
    flex: 1;
    height: 40px;
    border-radius: 8px;
    font-weight: 500;
}

.account-stats {
    border-top: 1px solid #f3f4f6;
    padding-top: 20px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.stat-row:last-child {
    margin-bottom: 0;
}

.stat-label {
    font-size: 0.875rem;
    color: #6b7280;
}

.stat-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #18181b;
}

.stat-value.profit {
    color: #10b981;
}

.stat-value.loss {
    color: #ef4444;
}

/* 智点购买对话框样式 */
.points-info {
    margin-bottom: 0;
}

.info-card {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 12px;
}

.info-card h4 {
    margin: 0 0 6px 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #0369a1;
}

.info-card p {
    margin: 2px 0;
    font-size: 0.75rem;
    color: #0369a1;
    line-height: 1.3;
}

.amount-item .amount-cash {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 2px;
}

.amount-item .amount-points {
    font-size: 0.7rem;
    opacity: 0.8;
}

.amount-item.active .amount-points {
    opacity: 1;
}
</style>
