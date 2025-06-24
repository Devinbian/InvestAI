# MobileStockList 移动端股票列表组件使用说明

## 概述

`MobileStockList` 是专门为移动端优化的股票列表组件，采用原生移动端设计风格，提供更好的触摸交互体验和视觉效果。

## 主要特性

### 🎨 移动端原生设计

- **卡片式布局**：每只股票使用独立的卡片展示，层次清晰
- **触摸优化**：支持触摸反馈，按压时有缩放效果
- **响应式设计**：适配不同尺寸的移动设备
- **原生风格**：采用移动端常见的设计模式

### 📱 优化的信息展示

- **重要信息优先**：股票名称、价格、涨跌幅等关键信息突出显示
- **状态标签**：推荐等级、自选状态等使用彩色标签展示
- **星级评分**：推荐指数使用直观的星级显示
- **分层信息**：详细信息分层展示，避免界面拥挤

### 🔧 灵活的配置选项

- **显示控制**：可控制各类信息的显示/隐藏
- **操作按钮**：支持自定义操作按钮
- **样式定制**：支持自定义样式类

## Props 配置

### 基础配置

```javascript
// 股票数据
stocks: {
    type: Array,
    default: () => []
}

// 操作按钮配置
actions: {
    type: Array,
    default: () => []
}
```

### 显示配置

```javascript
// 工具栏显示
showToolbar: {
    type: Boolean,
    default: false
}

// 工具栏标题
toolbarTitle: {
    type: String,
    default: ''
}

// 显示时间
showTime: {
    type: Boolean,
    default: false
}

// 推荐指数显示
showRecommendIndex: {
    type: Boolean,
    default: false
}

// 自选股状态显示
showWatchlistStatus: {
    type: Boolean,
    default: false
}

// 持仓状态显示
showPositionStatus: {
    type: Boolean,
    default: false
}

// 详细信息显示
showDetails: {
    type: Boolean,
    default: true
}

// 推荐理由显示
showReason: {
    type: Boolean,
    default: false
}
```

### 交互配置

```javascript
// 是否可点击
clickable: {
    type: Boolean,
    default: false
}

// 自定义样式类
listClass: {
    type: String,
    default: ''
}
```

## 事件

### 股票点击事件

```javascript
@stock-click="handleStockClick"
```

### 操作按钮点击事件

```javascript
@action-click="handleActionClick"
```

### 具体操作事件

```javascript
@add-watchlist="handleAddWatchlist"
@remove-watchlist="handleRemoveWatchlist"
@buy-stock="handleBuyStock"
@sell-stock="handleSellStock"
@paid-analysis="handlePaidAnalysis"
@ai-trading="handleAiTrading"
```

## 使用示例

### 基础使用

```vue
<template>
  <MobileStockList
    :stocks="stockList"
    :actions="actionButtons"
    @stock-click="handleStockClick"
    @action-click="handleActionClick"
  />
</template>

<script setup>
import MobileStockList from "@/components/MobileStockList.vue";

const stockList = ref([
  {
    code: "000001",
    name: "平安银行",
    currentPrice: 12.68,
    change: "+0.15",
    changePercent: "+1.20",
    industry: "银行",
    recommendLevel: "推荐",
    recommendIndex: 4.2,
  },
]);

const actionButtons = ref([
  {
    key: "addWatchlist",
    text: "加自选",
    type: "primary",
    icon: "⭐",
  },
  {
    key: "buy",
    text: "买入",
    type: "success",
    icon: "💰",
  },
]);
</script>
```

### 高级配置

```vue
<template>
  <MobileStockList
    :stocks="recommendStocks"
    :actions="recommendActions"
    :show-toolbar="true"
    toolbar-title="智能荐股"
    :show-time="true"
    :timestamp="Date.now()"
    :show-recommend-index="true"
    :show-details="true"
    :show-reason="true"
    :clickable="true"
    @stock-click="handleStockClick"
    @action-click="handleActionClick"
  >
    <!-- 工具栏自定义按钮 -->
    <template #toolbar-actions>
      <button @click="refreshData" class="mobile-refresh-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M23 4v6h-6" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    </template>

    <!-- 底部自定义内容 -->
    <template #footer>
      <div class="load-more">
        <button @click="loadMore">加载更多</button>
      </div>
    </template>
  </MobileStockList>
</template>
```

## 数据格式

### 股票数据格式

```javascript
{
    code: '000001',           // 股票代码
    name: '平安银行',          // 股票名称
    currentPrice: 12.68,      // 当前价格
    price: 12.68,            // 价格（备用字段）
    change: '+0.15',         // 涨跌额
    changePercent: '+1.20%', // 涨跌幅

    // 推荐相关
    recommendLevel: '推荐',   // 推荐等级
    recommendIndex: 4.2,     // 推荐指数 (1-5)
    reason: '业绩稳定增长...', // 推荐理由

    // 基础信息
    industry: '银行',        // 所属行业
    targetPrice: 15.00,     // 目标价
    expectedReturn: '18.3%', // 预期收益
    riskLevel: '中风险',     // 风险等级

    // 自选股信息
    addedAt: '2024-01-01',  // 添加时间

    // 持仓信息
    quantity: 1000,         // 持仓数量
    avgPrice: 12.00,       // 成本价
}
```

### 操作按钮格式

```javascript
{
    key: 'addWatchlist',    // 操作标识
    text: '加自选',         // 按钮文本
    type: 'primary',       // 按钮类型：primary/success/warning/default
    icon: '⭐',            // 图标
    class: 'custom-class', // 自定义样式类
    loading: false,        // 加载状态
}
```

## 样式定制

### CSS 变量

```css
.mobile-stock-list-container {
  --card-background: #ffffff;
  --card-border: #e2e8f0;
  --card-radius: 12px;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-success: #16a34a;
  --text-danger: #dc2626;

  --button-radius: 20px;
  --button-height: 36px;
}
```

### 自定义样式类

```css
/* 紧凑模式 */
.mobile-stock-list.compact .mobile-stock-card {
  padding: 12px;
  margin-bottom: 8px;
}

/* 大字体模式 */
.mobile-stock-list.large-text .stock-name {
  font-size: 1.25rem;
}

.mobile-stock-list.large-text .current-price {
  font-size: 1.5rem;
}
```

## 最佳实践

### 1. 性能优化

- 使用 `v-for` 的 `key` 属性
- 大列表考虑虚拟滚动
- 图片懒加载

### 2. 用户体验

- 提供加载状态
- 错误状态处理
- 空状态提示

### 3. 无障碍访问

- 添加适当的 ARIA 标签
- 支持键盘导航
- 提供语义化的 HTML 结构

## 与 PC 版本的区别

| 特性     | PC 版本 (StockList) | 移动版本 (MobileStockList) |
| -------- | ------------------- | -------------------------- |
| 布局方式 | 表格式/列表式       | 卡片式                     |
| 交互方式 | 鼠标悬停            | 触摸反馈                   |
| 信息密度 | 高密度              | 适中密度                   |
| 操作按钮 | 小按钮              | 大按钮（易触摸）           |
| 响应式   | 媒体查询适配        | 移动端优先设计             |
| 动画效果 | 简单过渡            | 丰富的触摸反馈             |

## 注意事项

1. **性能考虑**：移动端设备性能相对较弱，避免过多的动画和复杂计算
2. **网络优化**：考虑移动网络的不稳定性，提供离线支持
3. **电池优化**：避免不必要的重绘和重排
4. **触摸友好**：按钮大小至少 44px，间距充足
5. **内容优先**：重要信息优先显示，次要信息可折叠

## 更新日志

### v1.0.0 (2024-01-20)

- 初始版本发布
- 支持基础的股票列表展示
- 支持触摸交互
- 支持自定义操作按钮
- 支持响应式布局
