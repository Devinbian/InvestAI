<template>
    <el-dialog v-model="dialogVisible" title="AI委托交易设置" :width="isMobile ? '95vw' : '750px'"
        :top="isMobile ? '5vh' : '15vh'" class="ai-trading-dialog" :class="{ 'mobile-dialog': isMobile }"
        destroy-on-close append-to-body :z-index="11000" :close-on-click-modal="false"
        :modal-class="isMobile ? 'mobile-modal' : ''">
        <div v-if="stock" class="ai-trading-content">
            <!-- 股票信息头部 -->
            <div class="stock-header">
                <div class="stock-left">
                    <div class="stock-name-section">
                        <h3>{{ stock.name }}</h3>
                        <span class="stock-code">{{ stock.code }}</span>
                    </div>
                    <span class="current-price">¥{{ stock.price || stock.currentPrice }}</span>
                </div>
                <div class="stock-right">
                    <span class="cost-label">服务费用</span>
                    <div class="cost-pricing">
                        <span class="cost-original">3智点</span>
                        <span class="cost-promo">1智点</span>
                    </div>
                </div>
            </div>

            <!-- 滚动内容区域 -->
            <div class="dialog-scroll-content" :class="{ 'wechat-scroll': isWechat }" ref="scrollContainer">
                <!-- 交易设置表单 -->
                <el-form :model="form" class="ai-trading-form simple">
                    <!-- 基本交易参数 -->
                    <div class="form-section compact">
                        <h4 class="section-title">交易设置</h4>
                        <div class="simple-grid">
                            <div class="param-item">
                                <label class="param-label">交易方向</label>
                                <el-select v-model="form.action" class="param-input">
                                    <el-option label="买入" value="buy" />
                                    <el-option label="卖出" value="sell" />
                                </el-select>
                            </div>
                            <div class="param-item">
                                <label class="param-label">交易数量</label>
                                <el-input-number v-model="form.quantity" :min="100" :step="100" class="param-input"
                                    controls-position="right" />
                            </div>
                        </div>
                    </div>

                    <!-- 委托价格设置 -->
                    <div class="form-section compact">
                        <h4 class="section-title">委托价格</h4>
                        <div class="price-controls">
                            <div class="price-item">
                                <label class="param-label">当前价格</label>
                                <div class="current-price-display">
                                    <span class="price-value">¥{{ stock.price || stock.currentPrice }}</span>
                                </div>
                            </div>
                            <div class="price-item">
                                <label class="param-label">浮动空间</label>
                                <div class="price-range">
                                    <el-input-number v-model="form.priceFloatPercentage" :min="0.1" :max="10" 
                                        :step="0.1" :precision="1" class="price-input" controls-position="right" />
                                    <span class="price-unit">%</span>
                                </div>
                            </div>
                            <div class="price-range-display">
                                <div class="price-range-info">
                                    <span class="range-label">价格区间：</span>
                                    <span class="range-value">¥{{ getPriceRangeText() }}</span>
                                </div>
                                <div class="range-desc">
                                    AI将在此价格区间内寻找最佳交易时机
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 委托设置 -->
                    <div class="form-section compact">
                        <h4 class="section-title">委托设置</h4>
                        <div class="order-settings">
                            <div class="order-item">
                                <label class="param-label">委托时效选择</label>
                                <div class="time-option-selector">
                                    <el-radio-group v-model="form.timeInForceType" class="time-options">
                                        <el-radio value="DAY" class="time-option">
                                            <div class="option-content">
                                                <span class="option-title">当日有效</span>
                                                <span class="option-time">{{ getTodayEndTime() }}</span>
                                            </div>
                                        </el-radio>
                                        <el-radio value="QUANT" class="time-option">
                                            <div class="option-content">
                                                <span class="option-title">量化有效期内</span>
                                                <span class="option-time">{{ getQuantValidityTime() }}</span>
                                            </div>
                                        </el-radio>
                                    </el-radio-group>
                                </div>
                                
                                <!-- 实际有效期显示 -->
                                <div class="actual-validity-display">
                                    <div class="actual-validity-info">
                                        <span class="actual-label">实际有效期：</span>
                                        <span class="actual-time">{{ getActualValidityTime() }}</span>
                                        <span class="actual-reason">({{ getValidityReason() }})</span>
                                    </div>
                                    <div class="validity-note">
                                        <el-alert 
                                            :title="getValidityDescription()"
                                            type="info"
                                            :closable="false"
                                            show-icon
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </el-form>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="loading">
                    <span class="confirm-text">确认委托 (1智点)</span>
                    <span class="confirm-text-mobile">确认 (1智点)</span>
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { useUserStore } from '../store/user';
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Props
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Object,
        default: null
    }
});

// Emits
const emit = defineEmits(['update:modelValue', 'ai-trading-confirmed']);

// Store
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const scrollContainer = ref(null);

// 检测移动端和微信浏览器
const isMobile = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
});

const isWechat = computed(() => {
    if (typeof window === 'undefined') return false;
    return /micromessenger/i.test(navigator.userAgent);
});

// 计算属性：对话框显示状态
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

// 表单数据
const form = reactive({
    // 核心参数（用户必须设置）
    action: 'buy', // buy, sell
    quantity: 100,

    // 委托价格设置
    priceFloatPercentage: 2.0, // 价格浮动百分比，默认2%

    // 委托设置
    timeInForce: 'DAY', // 固定为当日有效
    timeInForceType: 'DAY', // 用户选择的委托时效类型：DAY(当日有效) 或 QUANT(量化有效期内)
    orderType: 'limit', // 固定为限价单
    
    // 量化分析有效期（从消息中获取）
    quantValidityEndTime: null,
});

// 从用户偏好初始化AI交易参数
const initAITradingFromPreferences = () => {
    const preferences = userStore.userInfo?.preferences;
    if (preferences) {
        // 根据用户风险偏好设置默认价格浮动空间
        switch (preferences.riskLevel) {
            case 'conservative':
                form.priceFloatPercentage = 1.0; // 保守型用户，较小的价格浮动
                break;
            case 'moderate':
                form.priceFloatPercentage = 2.0; // 稳健型用户，中等价格浮动
                break;
            case 'aggressive':
                form.priceFloatPercentage = 3.0; // 激进型用户，较大的价格浮动
                break;
            default:
                form.priceFloatPercentage = 2.0; // 默认2%
                break;
        }
    }
};

// 获取风险等级文本
const getRiskLevelText = (level) => {
    // 数值格式映射
    const riskLevelMap = {
        1: '求稳型',
        2: '稳健型',
        3: '均衡型',
        4: '成长型',
        5: '进取型'
    };

    // 字符串格式映射
    const riskValueMap = {
        'conservative': '求稳型',
        'stable': '稳健型',
        'balanced': '均衡型',
        'growth': '成长型',
        'aggressive': '进取型',
        'low': '低风险',
        'medium': '中风险',
        'high': '高风险',
        'moderate': '稳健型'
    };

    // 先尝试数值格式
    if (typeof level === 'number' && riskLevelMap[level]) {
        return riskLevelMap[level];
    }

    // 再尝试字符串格式
    if (typeof level === 'string' && riskValueMap[level]) {
        return riskValueMap[level];
    }

    return '未设置';
};

// 获取价格区间文本
const getPriceRangeText = () => {
    if (!props.stock || !props.stock.price) return '0 - 0';
    
    const currentPrice = parseFloat(props.stock.price || props.stock.currentPrice);
    const floatPercentage = form.priceFloatPercentage / 100;
    
    const minPrice = (currentPrice * (1 - floatPercentage)).toFixed(2);
    const maxPrice = (currentPrice * (1 + floatPercentage)).toFixed(2);
    
    return `${minPrice} - ${maxPrice}`;
};

// 获取委托时效文本
const getTimeInForceText = (timeInForce) => {
    const timeInForceMap = {
        'GTC': '好价成交',
        'DAY': '当日有效',
        'IOC': '立即成交或取消',
        'GTD': '指定日期'
    };
    return timeInForceMap[timeInForce] || timeInForce;
};

// 获取当日收盘时间
const getTodayEndTime = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 设置为当日15:00收盘
    return todayEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取量化分析有效期时间
const getQuantValidityTime = () => {
    if (form.quantValidityEndTime) {
        const endTime = new Date(form.quantValidityEndTime);
        return endTime.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    // 默认3天后
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 3);
    defaultEnd.setHours(23, 59, 59, 999);
    return defaultEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取实际有效期时间（取两者较短时间）
const getActualValidityTime = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘
    
    let quantEnd;
    if (form.quantValidityEndTime) {
        quantEnd = new Date(form.quantValidityEndTime);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }
    
    // 取较短时间
    const actualEnd = todayEnd < quantEnd ? todayEnd : quantEnd;
    return actualEnd.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取有效期描述
const getValidityDescription = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘
    
    let quantEnd;
    if (form.quantValidityEndTime) {
        quantEnd = new Date(form.quantValidityEndTime);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }
    
    const userChoice = form.timeInForceType;
    const actualIsTodayEnd = todayEnd < quantEnd;
    
    if (userChoice === 'DAY') {
        if (actualIsTodayEnd) {
            return '您选择当日有效，委托将在今日收盘前有效';
        } else {
            return '您选择当日有效，但量化分析有效期更短，委托将在量化有效期结束时失效';
        }
    } else { // QUANT
        if (actualIsTodayEnd) {
            return '您选择量化有效期内有效，但今日收盘时间更短，委托将在今日收盘前失效';
        } else {
            return '您选择量化有效期内有效，委托将在量化分析有效期结束时失效';
        }
    }
};

// 获取有效期原因
const getValidityReason = () => {
    const today = new Date();
    const todayEnd = new Date(today);
    todayEnd.setHours(15, 0, 0, 0); // 当日15:00收盘
    
    let quantEnd;
    if (form.quantValidityEndTime) {
        quantEnd = new Date(form.quantValidityEndTime);
    } else {
        // 默认3天后
        quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
    }
    
    if (todayEnd < quantEnd) {
        return '取当日收盘时间';
    } else if (todayEnd > quantEnd) {
        return '取量化有效期时间';
    } else {
        return '两者时间相同';
    }
};

// 处理取消
const handleCancel = () => {
    dialogVisible.value = false;
};

// 处理确认
const handleConfirm = async () => {
    // 检查智点余额
    if (userStore.smartPointsBalance < 1) {
        ElMessage.error('智点余额不足，请先充值');
        return;
    }

    // 表单验证
    if (!props.stock) {
        ElMessage.error('股票信息错误');
        return;
    }

    if (form.quantity < 100 || form.quantity % 100 !== 0) {
        ElMessage.error('交易数量必须是100的整数倍');
        return;
    }

    // 支付确认提示
    try {
        await ElMessageBox.confirm(
            `AI委托交易 ${props.stock.name}(${props.stock.code}) 促销价仅需 1智点（原价3智点），是否确认支付并设置委托交易？`,
            '付费服务确认',
            {
                confirmButtonText: '确认支付 1智点',
                cancelButtonText: '取消',
                type: 'info',
                customClass: 'high-z-index-dialog',
                appendTo: 'body'
            }
        );
    } catch {
        // 用户取消支付
        return;
    }

            // 构建AI委托交易参数
        const tradingParams = {
            stock: props.stock,
            action: form.action,
            quantity: form.quantity,
            orderType: form.orderType,
            timeInForce: form.timeInForce,
            
            // 委托价格设置
            priceSettings: {
                floatPercentage: form.priceFloatPercentage,
                currentPrice: parseFloat(props.stock.price || props.stock.currentPrice),
                priceRange: getPriceRangeText()
            }
        };

    try {
        loading.value = true;

        // 扣除智点并记录交易
        if (userStore.deductSmartPoints(1)) {
            // 记录智点消费
            userStore.addSmartPointsTransaction({
                type: 'consumption',
                amount: 1,
                description: `AI委托交易 - ${props.stock.name}`,
                serviceType: 'ai-trading',
                stockInfo: {
                    name: props.stock.name,
                    code: props.stock.code,
                },
                balanceAfter: userStore.smartPointsBalance,
            });
            ElMessage.success('支付成功，正在设置AI委托交易...');
        } else {
            ElMessage.error('支付失败，智点余额不足');
            return;
        }

        // 关闭对话框
        dialogVisible.value = false;

        // 生成AI委托交易报告
        const message = `【AI委托交易设置完成】已为${props.stock.name}(${props.stock.code})设置智能委托交易：

🎯 **交易参数**
• 交易方向：${form.action === 'buy' ? '买入' : '卖出'}
• 交易数量：${form.quantity}股
• 委托类型：限价单
• 委托时效：当日有效（量化分析有效期内）

💰 **价格设置**
• 当前价格：¥${props.stock.price || props.stock.currentPrice}
• 浮动空间：±${form.priceFloatPercentage}%
• 价格区间：¥${getPriceRangeText()}

🤖 **AI智能交易**
AI将在设定的价格区间内，24小时智能监控市场，在最佳时机自动执行交易，确保您获得最优的交易价格。`;

        // 发送事件给父组件
        emit('ai-trading-confirmed', {
            stock: props.stock,
            tradingParams: tradingParams,
            message: message
        });

    } catch (error) {
        ElMessage.error('设置失败，请稍后重试');
        console.error('AI委托交易设置失败:', error);
    } finally {
        loading.value = false;
    }
};

// 滚动处理
const handleScroll = (event) => {
    console.log('滚动事件触发:', {
        scrollTop: event.target.scrollTop,
        scrollHeight: event.target.scrollHeight,
        clientHeight: event.target.clientHeight
    });
};



// 微信浏览器滚动修复
const fixWechatScroll = () => {
    if (!isWechat.value || !scrollContainer.value) return;

    const element = scrollContainer.value;

    // 微信浏览器需要特殊处理
    element.style.overflow = 'auto';
    element.style.overflowY = 'auto';
    element.style.webkitOverflowScrolling = 'touch';
    element.style.touchAction = 'pan-y';
    element.style.transform = 'translateZ(0)';
    element.style.position = 'relative';

    // 强制触发滚动事件来激活滚动功能
    setTimeout(() => {
        element.scrollTop = 1;
        setTimeout(() => {
            element.scrollTop = 0;
        }, 50);
    }, 100);

    // 添加触摸事件监听器来强制启用滚动
    const handleTouchStart = (e) => {
        e.stopPropagation();
    };

    const handleTouchMove = (e) => {
        e.stopPropagation();
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });

    console.log('微信浏览器滚动修复已应用:', {
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        canScroll: element.scrollHeight > element.clientHeight,
        userAgent: navigator.userAgent
    });
};

// 监听对话框打开，初始化表单
watch(() => props.modelValue, (newVal) => {
    if (newVal && props.stock) {
        initAITradingFromPreferences();
        
        // 初始化量化分析有效期（默认3天）
        const quantEnd = new Date();
        quantEnd.setDate(quantEnd.getDate() + 3);
        quantEnd.setHours(23, 59, 59, 999);
        form.quantValidityEndTime = quantEnd.toISOString();

        // 延迟应用微信浏览器滚动修复
        setTimeout(() => {
            fixWechatScroll();
        }, 300);
    }
});
</script>

<style scoped>
/* AI委托交易对话框样式 */
.ai-trading-dialog {
    border-radius: 16px;
    overflow: hidden;
}

.ai-trading-dialog :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    margin: 0;
}

.ai-trading-dialog :deep(.el-dialog__title) {
    color: white;
    font-weight: 600;
    font-size: 18px;
}

.ai-trading-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: white;
    font-size: 20px;
}

.ai-trading-content {
    padding: 0;
}

/* 股票信息头部 */
.stock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.stock-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.stock-name-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.stock-name-section h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
}

.stock-code {
    background: #e2e8f0;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.current-price {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
}

.stock-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
}

.cost-label {
    font-size: 12px;
    color: #64748b;
}

.cost-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
}

.cost-original {
    background: #9ca3af;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 3px;
    border-radius: 2px;
    text-decoration: line-through;
    opacity: 0.9;
}

.cost-promo {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    font-size: 14px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
    position: relative;
}

/* 促销价的轻微动画效果 */
.cost-promo::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    border-radius: 3px;
    animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
    0% {
        transform: translateX(-100%);
    }

    50%,
    100% {
        transform: translateX(100%);
    }
}

/* 滚动内容区域 */
.dialog-scroll-content {
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
}

.dialog-scroll-content::-webkit-scrollbar {
    width: 4px;
}

.dialog-scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

.dialog-scroll-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
}

.dialog-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* 表单样式 */
.ai-trading-form {
    padding: 24px;
}

.form-section {
    margin-bottom: 24px;
}

.form-section.compact {
    margin-bottom: 16px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 16px;
}

.simple-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.param-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
}

.param-input {
    width: 100%;
}

/* 委托价格设置 */
.price-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.price-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.current-price-display {
    padding: 8px 12px;
    background: #f1f5f9;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.price-value {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
}

.price-range {
    display: flex;
    align-items: center;
    gap: 8px;
}

.price-input {
    width: 120px;
}

.price-unit {
    font-size: 14px;
    color: #64748b;
}

.price-range-display {
    margin-top: 8px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.price-range-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.range-label {
    font-size: 14px;
    color: #64748b;
}

.range-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.range-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.5;
}

/* 委托设置 */
.order-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.order-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.time-option-selector {
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.time-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.time-option {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    width: 100% !important;
    height: auto !important;
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.time-option :deep(.el-radio__input) {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    margin: 0;
}

.time-option :deep(.el-radio__label) {
    padding-left: 0;
    width: 100%;
    margin-left: 0;
}

.time-option :deep(.el-radio__inner) {
    width: 16px;
    height: 16px;
    border-width: 2px;
}

.time-option :deep(.el-radio__inner::after) {
    width: 6px;
    height: 6px;
}

.option-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px;
    padding-left: 48px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    cursor: pointer;
    width: 100%;
    position: relative;
}

.time-option:hover .option-content {
    border-color: #3b82f6;
    background: #f0f9ff;
}

.time-option.is-checked .option-content {
    border-color: #3b82f6;
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    box-shadow: 0 0 0 1px #3b82f6;
}

.option-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.option-time {
    font-size: 12px;
    color: #dc2626;
    font-weight: 500;
}

.actual-validity-display {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border-radius: 8px;
    border: 1px solid #bfdbfe;
}

.actual-validity-info {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.actual-label {
    font-size: 14px;
    font-weight: 600;
    color: #1e40af;
}

.actual-time {
    font-size: 14px;
    color: #dc2626;
    font-weight: 600;
}

.actual-reason {
    font-size: 12px;
    color: #64748b;
    font-style: italic;
}

.validity-note {
    margin-top: 8px;
}

/* 高级设置 */
.advanced-simple {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.advanced-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.param-input-small {
    width: 150px;
}

.input-with-unit-small {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
}

.input-with-unit-small .param-input-small {
    flex: 1;
    min-width: 120px;
}

.input-unit {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
    flex-shrink: 0;
}

/* PC端数字输入框样式优化 */
.param-input-small :deep(.el-input-number) {
    width: 100%;
}

.param-input-small :deep(.el-input__inner) {
    height: 32px;
    padding-right: 32px;
}

.param-input-small :deep(.el-input-number__increase),
.param-input-small :deep(.el-input-number__decrease) {
    width: 28px !important;
    height: 16px !important;
    line-height: 16px !important;
    font-size: 12px !important;
    border: none !important;
    background: #f5f5f5 !important;
    color: #666 !important;
    margin: 0 !important;
    padding: 0 !important;
    border-left: 1px solid #dcdfe6 !important;
}

.param-input-small :deep(.el-input-number__increase) {
    top: 1px !important;
    right: 1px !important;
    border-radius: 0 4px 0 0 !important;
    border-bottom: 1px solid #dcdfe6 !important;
}

.param-input-small :deep(.el-input-number__decrease) {
    bottom: 1px !important;
    right: 1px !important;
    border-radius: 0 0 4px 0 !important;
    top: 16px !important;
}

.param-input-small :deep(.el-input-number__increase):hover,
.param-input-small :deep(.el-input-number__decrease):hover {
    background: #e6e6e6 !important;
    color: #333 !important;
}

/* 高级设置切换 */
.advanced-toggle {
    display: flex;
    justify-content: center;
    padding: 16px 0;
    border-top: 1px solid #e2e8f0;
    margin-top: 16px;
}

/* 对话框底部 */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px 20px 24px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .ai-trading-dialog {
        width: 92vw !important;
        max-width: none !important;
        margin: 0 !important;
        margin-top: 5vh !important;
        max-height: 85vh !important;
        height: auto !important;
        display: flex !important;
        flex-direction: column !important;
    }

    .ai-trading-dialog :deep(.el-dialog__body) {
        flex: 1 !important;
        overflow: hidden !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
    }

    .ai-trading-content {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
    }

    .dialog-scroll-content {
        flex: 1 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        max-height: calc(85vh - 180px) !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 12px;
        position: sticky;
        top: 0;
        z-index: 10;
        flex-shrink: 0;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 15px;
    }

    .stock-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 6px;
    }

    .stock-name-section h3 {
        font-size: 15px;
        margin-right: 6px;
    }

    .stock-code {
        font-size: 11px;
        padding: 2px 6px;
    }

    .current-price {
        font-size: 14px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 10px 12px;
    }

    .simple-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .section-title {
        font-size: 14px;
        margin-bottom: 10px;
    }

    .param-item {
        gap: 6px;
    }

    .param-label {
        font-size: 13px;
    }

    .price-controls {
        gap: 10px;
    }

    .price-item {
        gap: 6px;
    }

    .current-price-display {
        padding: 6px 10px;
    }

    .price-value {
        font-size: 14px;
    }

    .price-range {
        gap: 6px;
    }

    .price-input {
        width: 100px;
    }

    .price-range-display {
        padding: 10px;
        margin-top: 6px;
    }

    .range-label,
    .range-value,
    .range-desc {
        font-size: 12px;
    }



    .order-settings {
        gap: 10px;
    }

    .order-item {
        gap: 8px;
    }

    .time-option-selector {
        padding: 6px;
    }

    .time-options {
        gap: 6px;
    }

    .time-option :deep(.el-radio__input) {
        left: 12px;
    }

    .option-content {
        padding: 10px;
        gap: 1px;
        padding-left: 40px;
    }

    .option-title {
        font-size: 13px;
    }

    .option-time {
        font-size: 11px;
    }

    .actual-validity-display {
        margin-top: 12px;
        padding: 10px;
    }

    .actual-validity-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin-bottom: 6px;
    }

    .actual-label,
    .actual-time {
        font-size: 12px;
    }

    .actual-reason {
        font-size: 11px;
    }

    .validity-note {
        margin-top: 6px;
    }

    .advanced-simple {
        gap: 10px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .param-input-small {
        width: 120px;
    }

    .input-with-unit-small {
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 100px;
    }

    .advanced-toggle {
        padding: 10px 0;
        margin-top: 12px;
    }

    .dialog-footer {
        padding: 10px 12px;
        position: sticky;
        bottom: 0;
        z-index: 10;
        background: #f9fafb;
        margin-top: 0;
        flex-shrink: 0;
        border-top: 1px solid #e5e7eb;
    }

    .dialog-footer .el-button {
        flex: 1;
        max-width: 100px;
        height: 36px;
        font-size: 14px;
        padding: 8px 10px;
    }

    .confirm-text {
        display: inline;
    }

    .confirm-text-mobile {
        display: none;
    }
}

/* 小屏幕优化 */
@media (max-width: 480px) {
    .ai-trading-dialog {
        width: 96vw !important;
        margin: 0 !important;
        margin-top: 2vh !important;
        max-height: 90vh !important;
        height: auto !important;
    }

    .dialog-scroll-content {
        max-height: calc(85vh - 160px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
        min-height: 400px !important;
        scrollbar-width: thin !important;
    }

    /* 小屏幕滚动条样式 */
    .dialog-scroll-content::-webkit-scrollbar {
        width: 8px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-track {
        background: #f1f1f1 !important;
        border-radius: 4px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-thumb {
        background: #c1c1c1 !important;
        border-radius: 4px !important;
    }

    .dialog-scroll-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8 !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 10px;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 14px;
    }

    .stock-header {
        padding: 8px 10px;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }

    .stock-name-section h3 {
        font-size: 14px;
    }

    .stock-code {
        font-size: 10px;
        padding: 2px 4px;
    }

    .current-price {
        font-size: 13px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 8px 10px;
    }

    .section-title {
        font-size: 13px;
        margin-bottom: 8px;
    }

    .param-label {
        font-size: 12px;
    }

    .price-input {
        width: 90px;
    }

    .current-price-display {
        padding: 6px 8px;
    }

    .price-value {
        font-size: 13px;
    }

    .price-range-display {
        padding: 8px;
        margin-top: 6px;
    }

    .range-label,
    .range-value,
    .range-desc {
        font-size: 11px;
    }

    .order-validity {
        padding: 6px 8px;
    }

    .validity-text {
        font-size: 12px;
    }

    .validity-desc {
        font-size: 10px;
    }

    .advanced-simple {
        gap: 8px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
    }

    .param-input-small {
        width: 100%;
        min-width: 120px;
    }

    .input-with-unit-small {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 0;
    }

    .input-unit {
        font-size: 12px;
        flex-shrink: 0;
    }

    .dialog-footer {
        padding: 8px 10px;
    }

    .dialog-footer .el-button {
        max-width: 90px;
        height: 34px;
        font-size: 13px;
        padding: 6px 8px;
    }

    .confirm-text {
        display: none;
    }

    .confirm-text-mobile {
        display: inline;
    }
}

/* 超小屏幕优化 */
@media (max-width: 320px) {
    .ai-trading-dialog {
        width: 98vw !important;
        margin: 0 !important;
        margin-top: 1vh !important;
        max-height: 95vh !important;
        height: auto !important;
    }

    .dialog-scroll-content {
        max-height: calc(95vh - 140px) !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 20px !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        padding: 8px;
    }

    .ai-trading-dialog :deep(.el-dialog__title) {
        font-size: 13px;
    }

    .stock-header {
        padding: 6px 8px;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .stock-left {
        flex-direction: row;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .stock-name-section {
        flex-direction: row;
        align-items: center;
        gap: 3px;
    }

    .stock-name-section h3 {
        font-size: 13px;
    }

    .stock-code {
        font-size: 9px;
        padding: 1px 4px;
    }

    .current-price {
        font-size: 12px;
    }

    .stock-right {
        flex-shrink: 0;
        align-items: flex-end;
    }

    .ai-trading-form {
        padding: 6px 8px;
    }

    .section-title {
        font-size: 12px;
        margin-bottom: 6px;
    }

    .param-label {
        font-size: 11px;
    }

    .price-input {
        width: 80px;
    }

    .current-price-display {
        padding: 4px 6px;
    }

    .price-value {
        font-size: 12px;
    }

    .price-range-display {
        padding: 6px;
        margin-top: 4px;
    }

    .range-label,
    .range-value,
    .range-desc {
        font-size: 10px;
    }

    .order-validity {
        padding: 4px 6px;
    }

    .validity-text {
        font-size: 11px;
    }

    .validity-desc {
        font-size: 9px;
    }

    .advanced-simple {
        gap: 6px;
    }

    .advanced-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .param-input-small {
        width: 100%;
        min-width: 100px;
    }

    .input-with-unit-small {
        display: flex;
        align-items: center;
        gap: 4px;
        width: 100%;
    }

    .input-with-unit-small .param-input-small {
        flex: 1;
        min-width: 0;
    }

    .input-unit {
        font-size: 11px;
        flex-shrink: 0;
    }

    .dialog-footer {
        padding: 6px 8px;
    }

    .dialog-footer .el-button {
        max-width: 80px;
        height: 32px;
        font-size: 12px;
        padding: 5px 6px;
    }

    .confirm-text {
        display: none;
    }

    .confirm-text-mobile {
        display: inline;
    }
}

/* 移动端专用优化 */
@media (max-width: 768px) and (orientation: portrait) {
    .ai-trading-dialog {
        margin-top: 10px !important;
        border-radius: 12px 12px 0 0 !important;
    }

    .ai-trading-dialog :deep(.el-dialog__header) {
        border-radius: 12px 12px 0 0;
    }

    .stock-header {
        border-radius: 0;
    }

    /* 触摸友好的按钮 */
    .risk-checkbox :deep(.el-checkbox__input) {
        transform: scale(1.2);
    }

    .param-input,
    .risk-number,
    .param-input-small {
        font-size: 16px;
        /* 防止iOS自动缩放 */
    }

    /* 改进的滚动指示器 */
    .dialog-scroll-content {
        scroll-behavior: smooth;
    }
}

/* 移动端专用样式类 - 最高优先级 */
.mobile-dialog {
    max-height: 85vh !important;
    height: auto !important;
    margin: 0 !important;
    border-radius: 16px 16px 0 0 !important;
}

.mobile-dialog :deep(.el-dialog__body) {
    padding: 0 !important;
    max-height: calc(85vh - 120px) !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
}

.mobile-dialog .ai-trading-content {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    max-height: calc(85vh - 120px) !important;
}

.mobile-dialog .dialog-scroll-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(75vh - 200px);
    -webkit-overflow-scrolling: touch;
    padding: 0;
    margin: 0;
}

/* 移动端弹框滚动条样式 */
.mobile-dialog .dialog-scroll-content::-webkit-scrollbar {
    width: 6px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.mobile-dialog .dialog-scroll-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}



.mobile-dialog .stock-header {
    flex-shrink: 0 !important;
    padding: 12px 16px !important;
    background: #f8fafc !important;
    border-bottom: 1px solid #e2e8f0 !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
}

.mobile-dialog .stock-left {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex: 1 !important;
    min-width: 0 !important;
}

.mobile-dialog .stock-name-section {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .stock-name-section h3 {
    font-size: 15px !important;
    margin: 0 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 100px !important;
}

.mobile-dialog .stock-code {
    font-size: 10px !important;
    padding: 2px 4px !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .current-price {
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #dc2626 !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
}

.mobile-dialog .stock-right {
    flex-shrink: 0 !important;
    align-items: flex-end !important;
    margin-left: 8px !important;
}

.mobile-dialog .cost-label {
    font-size: 11px !important;
    color: #64748b !important;
}

.mobile-dialog .cost-pricing {
    align-items: flex-end !important;
}

.mobile-dialog .cost-original,
.mobile-dialog .cost-promo {
    font-size: 9px !important;
    padding: 1px 3px !important;
}

.mobile-dialog .ai-trading-form {
    padding: 16px !important;
}

.mobile-dialog .simple-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
}

.mobile-dialog .section-title {
    font-size: 15px !important;
    margin-bottom: 12px !important;
}

.mobile-dialog .param-label {
    font-size: 14px !important;
}

    .mobile-dialog .price-input {
        width: 100px !important;
    }

    .mobile-dialog .current-price-display {
        padding: 8px 10px !important;
    }

    .mobile-dialog .price-value {
        font-size: 14px !important;
    }

    .mobile-dialog .price-range-display {
        padding: 10px !important;
        margin-top: 8px !important;
    }

    .mobile-dialog .range-label,
    .mobile-dialog .range-value,
    .mobile-dialog .range-desc {
        font-size: 12px !important;
    }

    .mobile-dialog .order-validity {
        padding: 8px 10px !important;
    }

    .mobile-dialog .validity-text {
        font-size: 13px !important;
    }

    .mobile-dialog .validity-desc {
        font-size: 11px !important;
    }

.mobile-dialog .dialog-footer {
    flex-shrink: 0 !important;
    padding: 8px 16px !important;
    background: #f9fafb !important;
    border-top: 1px solid #e5e7eb !important;
}

.mobile-dialog .dialog-footer .el-button {
    flex: 1 !important;
    max-width: 120px !important;
    height: 36px !important;
    font-size: 14px !important;
    padding: 8px 10px !important;
}

.mobile-dialog .confirm-text {
    display: none !important;
}

.mobile-dialog .confirm-text-mobile {
    display: inline !important;
}

/* 移动端滚动优化 */
@media (max-width: 768px) {
    .dialog-scroll-content {
        max-height: calc(75vh - 160px) !important;
        -webkit-overflow-scrolling: touch !important;
        padding-bottom: 10px !important;
    }
}

/* 微信浏览器专用滚动修复 */
.wechat-scroll {
    /* 微信浏览器必须使用明确的高度而不是max-height */
    height: calc(75vh - 160px) !important;
    max-height: none !important;

    /* 微信浏览器滚动设置 */
    overflow: auto !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;

    /* 微信浏览器触摸滚动 */
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;

    /* 微信浏览器需要的特殊属性 */
    position: relative !important;
    transform: translateZ(0) !important;
    -webkit-transform: translate3d(0, 0, 0) !important;

    /* 确保内容可以滚动 */
    min-height: 400px !important;

    /* 微信浏览器滚动优化 */
    overscroll-behavior: contain !important;
    scroll-behavior: auto !important;
}

/* 微信浏览器移动端优化 */
@media (max-width: 768px) {
    .wechat-scroll {
        height: calc(70vh - 140px) !important;
        padding-bottom: 20px !important;
    }

    /* 微信浏览器表单内容优化 */
    .wechat-scroll .ai-trading-form {
        padding-bottom: 30px !important;
        min-height: 500px !important;
    }
}

/* 确保弹窗在移动端侧边栏上方显示 */
:deep(.el-dialog) {
    z-index: 11000 !important;
}

:deep(.el-overlay) {
    z-index: 10999 !important;
}

/* 强制设置弹窗容器的z-index */
.ai-trading-dialog {
    z-index: 11000 !important;
}

.ai-trading-dialog :deep(.el-dialog__wrapper) {
    z-index: 11000 !important;
}

/* 移动端模态框优化 */
.mobile-modal {
    touch-action: none !important;
}

.mobile-modal :deep(.el-overlay) {
    touch-action: none !important;
}

/* 移动端数字输入框优化 */
@media (max-width: 768px) {

    /* 数字输入框样式优化 */
    .mobile-dialog .param-input-small :deep(.el-input-number),
    .mobile-dialog .price-input :deep(.el-input-number) {
        width: 100% !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input__inner),
    .mobile-dialog .price-input :deep(.el-input__inner) {
        height: 36px !important;
        font-size: 14px !important;
        padding: 0 32px 0 12px !important;
        border-radius: 6px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase),
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease),
    .mobile-dialog .price-input :deep(.el-input-number__increase),
    .mobile-dialog .price-input :deep(.el-input-number__decrease) {
        width: 28px !important;
        height: 18px !important;
        line-height: 18px !important;
        font-size: 12px !important;
        border: none !important;
        background: #f5f5f5 !important;
        color: #666 !important;
        margin: 0 !important;
        padding: 0 !important;
        border-left: 1px solid #dcdfe6 !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase),
    .mobile-dialog .price-input :deep(.el-input-number__increase) {
        top: 1px !important;
        right: 1px !important;
        border-radius: 0 5px 0 0 !important;
        border-bottom: 1px solid #dcdfe6 !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__decrease),
    .mobile-dialog .price-input :deep(.el-input-number__decrease) {
        bottom: 1px !important;
        right: 1px !important;
        border-radius: 0 0 5px 0 !important;
        top: 18px !important;
    }

    .mobile-dialog .param-input-small :deep(.el-input-number__increase):hover,
    .mobile-dialog .param-input-small :deep(.el-input-number__decrease):hover,
    .mobile-dialog .price-input :deep(.el-input-number__increase):hover,
    .mobile-dialog .price-input :deep(.el-input-number__decrease):hover {
        background: #e6e6e6 !important;
        color: #333 !important;
    }

    .mobile-dialog .input-with-unit-small {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        width: 100% !important;
    }

    .mobile-dialog .input-with-unit-small .param-input-small {
        flex: 1 !important;
        min-width: 0 !important;
    }

    .mobile-dialog .input-unit {
        font-size: 13px !important;
        color: #64748b !important;
        font-weight: 500 !important;
        flex-shrink: 0 !important;
    }

    .mobile-dialog .advanced-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
    }

    .mobile-dialog .param-label {
        font-size: 13px !important;
        color: #64748b !important;
        font-weight: 500 !important;
    }
}
</style>
