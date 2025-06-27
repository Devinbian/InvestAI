# StockActionButtons 通用股票操作按钮组件

## 📖 概述

`StockActionButtons` 是一个通用的股票操作按钮组件，用于统一管理所有股票相关的操作按钮（如加入自选、购买、AI委托交易等）。该组件提供了一致的样式、交互和事件处理机制。

## 🚀 主要特性

- **统一样式**：所有股票操作按钮使用统一的设计风格
- **响应式设计**：支持PC端和移动端的不同显示模式
- **灵活配置**：支持多种预设场景和自定义配置
- **智能过滤**：根据自选股状态自动显示/隐藏相关按钮
- **事件统一**：提供统一的事件处理机制
- **移动端优化**：支持移动端文本简化和按钮数量限制

## 📦 组件结构

```
src/
├── components/
│   ├── StockActionButtons.vue          # 主组件
│   └── StockActionButtonsExample.vue   # 使用示例
└── config/
    └── stockActionConfig.js            # 配置文件
```

## 🔧 基础用法

### 1. 导入组件

```vue
<script setup>
import StockActionButtons from "@/components/StockActionButtons.vue";
import { getStockActionConfig } from "@/config/stockActionConfig";
</script>
```

### 2. 基本使用

```vue
<template>
  <StockActionButtons
    :stock="stockData"
    :actions="actions"
    :is-mobile="false"
    mode="full"
    @action-click="handleActionClick"
  />
</template>

<script setup>
const stockData = {
  code: "600519",
  name: "贵州茅台",
  price: 1680.5,
};

const actions = getStockActionConfig("recommendation");

const handleActionClick = (event) => {
  console.log("操作:", event.action, "股票:", event.stock);
};
</script>
```

## ⚙️ 配置选项

### Props

| 参数             | 类型    | 默认值    | 说明                                   |
| ---------------- | ------- | --------- | -------------------------------------- |
| `stock`          | Object  | -         | **必需**，股票信息对象                 |
| `actions`        | Array   | `[]`      | 操作按钮配置数组                       |
| `size`           | String  | `'small'` | 按钮大小：`large`、`default`、`small`  |
| `isMobile`       | Boolean | `false`   | 是否为移动端                           |
| `containerClass` | String  | `''`      | 容器样式类                             |
| `mode`           | String  | `'full'`  | 显示模式：`full`、`compact`、`minimal` |
| `maxButtons`     | Number  | `4`       | 最大显示按钮数量（移动端优化）         |

### 股票对象结构

```javascript
{
    code: '600519',        // 股票代码
    name: '贵州茅台',       // 股票名称
    price: 1680.50,        // 当前价格
    change: 12.30,         // 涨跌额
    changePercent: 0.74    // 涨跌幅
}
```

## 🎯 预设场景

### 1. 推荐股票场景

```javascript
const actions = getStockActionConfig("recommendation");
// 包含：加入自选、移除自选、量化分析、AI委托交易、买入
```

### 2. 自选股场景

```javascript
const actions = getStockActionConfig("watchlist");
// 包含：移除自选、量化分析、AI委托交易、买入
```

### 3. 持仓股票场景

```javascript
const actions = getStockActionConfig("portfolio");
// 包含：卖出、加仓、量化分析、AI委托交易
```

### 4. 聊天消息场景

```javascript
const actions = getStockActionConfig("chatFull");
// 包含：加入自选、移除自选、AI委托交易、买入

const actions = getStockActionConfig("chatCompact");
// 包含：加入自选、移除自选、买入
```

### 5. 移动端场景

```javascript
const actions = getStockActionConfig("mobile", {
  isMobile: true,
  maxButtons: 3,
});
```

## 📱 显示模式

### Full 模式

- 显示所有配置的按钮
- 适合PC端宽屏显示

### Compact 模式

- 按优先级排序显示
- 适合空间有限的场景

### Minimal 模式

- 只显示核心操作（自选、买卖）
- 适合极简界面

## 🎨 样式定制

### 按钮样式类

```css
.add-watchlist-btn     /* 加入自选 - 绿色 */
.remove-watchlist-btn  /* 移除自选 - 绿色 */
.paid-analysis-btn     /* 量化分析 - 紫色 */
.quant-analysis-btn    /* AI委托交易 - 蓝色 */
.buy-stock-btn         /* 买入 - 绿色 */
.sell-stock-btn        /* 卖出 - 红色 */
```

### 移动端优化

```css
.stock-action-buttons.mobile {
  gap: 6px;
}

@media (max-width: 768px) {
  .stock-action-btn {
    font-size: 12px;
    gap: 3px;
  }
}
```

## 🔔 事件处理

### 通用事件

```vue
<StockActionButtons
  @action-click="handleActionClick"
  @add-watchlist="handleAddWatchlist"
  @remove-watchlist="handleRemoveWatchlist"
  @buy-stock="handleBuyStock"
  @sell-stock="handleSellStock"
  @paid-analysis="handlePaidAnalysis"
  @ai-trading="handleAITrading"
/>
```

### 对话框事件

```vue
<StockActionButtons
  @show-buy-dialog="showBuyDialog"
  @show-sell-dialog="showSellDialog"
  @show-analysis-dialog="showAnalysisDialog"
  @show-ai-trading-dialog="showAITradingDialog"
/>
```

## 🛠️ 自定义配置

### 创建自定义按钮

```javascript
import { createCustomAction } from "@/config/stockActionConfig";

const customAction = createCustomAction({
  key: "customAnalysis",
  text: "深度分析",
  mobileText: "深析",
  type: "default",
  class: "custom-analysis-btn",
  icon: "🔍",
  priority: 6,
});
```

### 组合自定义配置

```javascript
const customActions = [
  BASE_STOCK_ACTIONS.addWatchlist,
  BASE_STOCK_ACTIONS.buy,
  customAction,
];
```

## 📋 完整示例

```vue
<template>
  <div class="stock-item">
    <div class="stock-info">
      <span class="stock-name">{{ stock.name }}</span>
      <span class="stock-code">({{ stock.code }})</span>
      <span class="stock-price">¥{{ stock.price }}</span>
    </div>

    <StockActionButtons
      :stock="stock"
      :actions="stockActions"
      :is-mobile="isMobileView"
      :mode="displayMode"
      :max-buttons="maxButtonsCount"
      container-class="stock-actions"
      @action-click="handleStockAction"
      @add-watchlist="addToWatchlist"
      @remove-watchlist="removeFromWatchlist"
      @show-buy-dialog="showBuyDialog"
      @show-ai-trading-dialog="showAITradingDialog"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import StockActionButtons from "@/components/StockActionButtons.vue";
import { getStockActionConfig } from "@/config/stockActionConfig";

const props = defineProps({
  stock: Object,
  scenario: String,
  isMobileView: Boolean,
});

const emit = defineEmits([
  "add-watchlist",
  "remove-watchlist",
  "show-buy-dialog",
  "show-ai-trading-dialog",
]);

const stockActions = computed(() => {
  return getStockActionConfig(props.scenario, {
    isMobile: props.isMobileView,
    maxButtons: props.isMobileView ? 3 : 5,
  });
});

const displayMode = computed(() => {
  return props.isMobileView ? "compact" : "full";
});

const maxButtonsCount = computed(() => {
  return props.isMobileView ? 3 : 5;
});

const handleStockAction = (event) => {
  console.log("股票操作:", event);
};

const addToWatchlist = (stock) => {
  emit("add-watchlist", stock);
};

const removeFromWatchlist = (stock) => {
  emit("remove-watchlist", stock);
};

const showBuyDialog = (stock) => {
  emit("show-buy-dialog", stock);
};

const showAITradingDialog = (stock) => {
  emit("show-ai-trading-dialog", stock);
};
</script>
```

## 🔍 最佳实践

1. **场景选择**：根据使用场景选择合适的预设配置
2. **移动端优化**：移动端限制按钮数量，使用简化文本
3. **事件处理**：统一使用 `action-click` 事件处理，便于日志记录
4. **样式一致性**：使用预定义的样式类，保持界面一致
5. **响应式设计**：根据屏幕尺寸调整显示模式

## 🔄 迁移指南

### 从旧版本迁移

1. **替换原有按钮**：将现有的股票操作按钮替换为 `StockActionButtons` 组件
2. **更新事件处理**：使用新的事件名称和参数结构
3. **调整样式**：移除重复的按钮样式，使用统一的样式类
4. **配置迁移**：将原有的按钮配置迁移到新的配置格式

这个通用组件将大大简化股票操作按钮的管理，提高代码复用性和维护性！
