# StockList 通用股票列表组件使用说明

## 概述

`StockList` 是一个高度可配置的通用股票列表组件，用于统一项目中各种股票列表的显示和交互逻辑。该组件支持不同的显示模式和操作按钮配置，适用于推荐股票、自选股、持仓股票等多种场景。

## 组件特性

- ✅ **高度可配置**：支持不同的显示选项和操作按钮
- ✅ **响应式设计**：适配PC端和移动端
- ✅ **统一样式**：保持项目整体视觉风格一致
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **插槽支持**：支持自定义工具栏和底部内容
- ✅ **事件驱动**：通过事件处理各种用户交互

## 基本用法

```vue
<template>
  <StockList
    :stocks="stockData"
    :actions="actionConfig"
    :show-recommend-index="true"
    @stock-click="handleStockClick"
    @action-click="handleActionClick"
  />
</template>

<script setup>
import StockList from "@/components/StockList.vue";

const stockData = [
  {
    code: "000001",
    name: "平安银行",
    price: "12.45",
    change: 0.23,
    changePercent: 1.88,
    // ... 其他股票数据
  },
];

const actionConfig = [
  {
    key: "addWatchlist",
    text: "加入自选",
    type: "primary",
    icon: "star-icon-path",
  },
];
</script>
```

## 使用预设配置

项目提供了多种预设配置，可以直接使用：

```vue
<template>
  <!-- 自选股列表 -->
  <StockList
    :stocks="watchlistStocks"
    v-bind="watchlistConfig"
    @stock-click="handleStockClick"
    @action-click="handleActionClick"
  />
</template>

<script setup>
import StockList from "@/components/StockList.vue";
import { getStockListConfig } from "@/config/stockListConfig";

// 获取预设配置
const watchlistConfig = getStockListConfig("watchlist");
</script>
```

## 预设配置类型

### 1. 推荐股票 (`recommendation`)

- 显示推荐指数和星级评分
- 操作按钮：加入自选、量化分析、AI委托交易、购买

### 2. 自选股 (`watchlist`)

- 显示关注时间和状态
- 操作按钮：移除自选、量化分析、AI委托交易、买入

### 3. 持仓股票 (`portfolio`)

- 显示持仓数量、成本价、盈亏状态
- 操作按钮：卖出、加仓、量化分析、AI委托交易

### 4. 智能荐股 (`smartRecommendation`)

- 带工具栏的推荐股票列表
- 显示时间戳和刷新功能

### 5. 量化分析推荐 (`quantRecommendation`)

- 简化的推荐股票显示
- 操作按钮：详细分析、加入自选

### 6. 简单列表 (`simple`)

- 最基础的股票信息显示
- 操作按钮：关注

## Props 详细说明

### 数据相关

- `stocks`: 股票数据数组
- `actions`: 操作按钮配置数组

### 显示配置

- `showToolbar`: 是否显示工具栏
- `toolbarTitle`: 工具栏标题
- `showTime`: 是否显示时间
- `timestamp`: 时间戳
- `showRecommendIndex`: 是否显示推荐指数
- `showRecommendTooltip`: 是否显示推荐指数说明
- `showWatchlistStatus`: 是否显示自选股状态
- `showPositionStatus`: 是否显示持仓状态
- `showBasicDetails`: 是否显示基础详情
- `showPositionDetails`: 是否显示持仓详情
- `showReason`: 是否显示推荐理由
- `showFooter`: 是否显示底部

### 样式配置

- `listClass`: 列表自定义样式类
- `clickable`: 股票项是否可点击

## 事件说明

### `stock-click`

股票项被点击时触发

```javascript
handleStockClick(stock) {
  console.log('点击了股票:', stock)
}
```

### `action-click`

操作按钮被点击时触发

```javascript
handleActionClick({ action, stock }) {
  switch (action) {
    case 'addWatchlist':
      // 处理加入自选股
      break
    case 'buy':
      // 处理购买股票
      break
    // ... 其他操作
  }
}
```

## 插槽使用

### 工具栏插槽

```vue
<StockList :show-toolbar="true">
  <template #toolbar-actions>
    <el-button size="small" @click="refreshData">刷新</el-button>
  </template>
</StockList>
```

### 底部插槽

```vue
<StockList :show-footer="true">
  <template #footer>
    <el-button size="small" text @click="loadMore">加载更多</el-button>
  </template>
</StockList>
```

## 自定义配置

### 创建自定义配置

```javascript
import { createCustomConfig } from "@/config/stockListConfig";

const customConfig = createCustomConfig("watchlist", {
  showReason: true, // 在自选股基础上添加推荐理由显示
  actions: [
    // 自定义操作按钮
    {
      key: "customAction",
      text: "自定义操作",
      type: "primary",
    },
  ],
});
```

### 完全自定义

```vue
<StockList
  :stocks="stocks"
  :actions="customActions"
  :show-recommend-index="true"
  :show-basic-details="true"
  :clickable="true"
  list-class="my-custom-list"
  @stock-click="handleStockClick"
  @action-click="handleActionClick"
/>
```

## 操作按钮配置格式

```javascript
const actionConfig = {
  key: "actionKey", // 操作标识符
  text: "按钮文字", // 按钮显示文字
  type: "primary", // 按钮类型 (primary, success, danger, default)
  class: "custom-btn-class", // 自定义样式类
  icon: "svg-path", // SVG图标路径
  iconFill: "currentColor", // 图标填充色
  loading: false, // 是否显示加载状态
  priceTag: {
    // 价格标签（可选）
    original: "3智点",
    promo: "1智点",
  },
};
```

## 股票数据格式

```javascript
const stockData = {
  code: "000001", // 股票代码
  name: "平安银行", // 股票名称
  price: "12.45", // 当前价格
  change: 0.23, // 涨跌额
  changePercent: 1.88, // 涨跌幅

  // 推荐相关（可选）
  recommendIndex: 4.2, // 推荐指数 (1-5)
  recommendLevel: "推荐", // 推荐等级
  targetPrice: "15.80", // 目标价
  expectedReturn: "+26.9%", // 预期收益
  riskLevel: "中等", // 风险等级
  reason: "推荐理由...", // 推荐理由

  // 自选股相关（可选）
  addedAt: "2024-01-15T09:30:00.000Z", // 添加时间

  // 持仓相关（可选）
  quantity: 1000, // 持仓数量
  avgPrice: 11.5, // 成本价

  // 通用
  industry: "银行", // 所属行业
  pe: 5.2, // 市盈率
  pb: 0.8, // 市净率
  marketCap: 240000000000, // 市值
};
```

## 样式自定义

组件提供了完整的CSS变量支持，可以通过覆盖CSS变量来自定义样式：

```css
.my-custom-list {
  --stock-item-bg: #ffffff;
  --stock-item-border: #e2e8f0;
  --stock-item-hover-bg: #f1f5f9;
  --stock-name-color: #1e293b;
  --stock-code-color: #64748b;
  --price-positive-color: #dc2626;
  --price-negative-color: #16a34a;
}
```

## 最佳实践

1. **统一使用预设配置**：优先使用项目提供的预设配置，确保界面一致性
2. **合理使用事件**：通过事件处理用户交互，保持组件的纯净性
3. **数据格式标准化**：确保传入的股票数据格式符合组件要求
4. **响应式考虑**：在移动端使用时注意操作按钮的数量和大小
5. **性能优化**：大量数据时考虑虚拟滚动或分页加载

## 迁移指南

### 从现有组件迁移

1. **替换组件引用**

```vue
<!-- 旧的方式 -->
<div class="stock-list">
  <div v-for="stock in stocks" class="stock-item">
    <!-- 复杂的模板代码 -->
  </div>
</div>

<!-- 新的方式 -->
<StockList
  :stocks="stocks"
  v-bind="getStockListConfig('watchlist')"
  @action-click="handleActionClick"
/>
```

2. **迁移事件处理**

```javascript
// 将原有的方法调用改为事件处理
const handleActionClick = ({ action, stock }) => {
  switch (action) {
    case "addWatchlist":
      addToWatchlist(stock);
      break;
    case "removeWatchlist":
      removeFromWatchlist(stock.code);
      break;
    // ... 其他操作
  }
};
```

3. **更新样式**

```css
/* 移除原有的股票列表样式，使用组件内置样式 */
/* 如需自定义，通过CSS变量或listClass属性 */
```

通过使用这个通用股票列表组件，可以大大减少代码重复，提高开发效率，同时确保整个项目中股票列表的一致性和可维护性。
