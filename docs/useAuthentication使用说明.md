# useAuthentication 组合式函数使用说明

## 概述

`useAuthentication` 是一个专门处理用户认证逻辑的 Vue 3 组合式函数，将原本分散在 `Main.vue` 中的用户登录、登出、密码找回等功能进行了统一封装和管理。

## 功能特性

### 1. 状态管理

- `loginDialogVisible`: 登录对话框显示状态
- `isRegisterMode`: 注册模式切换状态
- `recoveryDialogVisible`: 密码找回对话框显示状态

### 2. 核心方法

#### 登录相关

- `showLogin(isRegister)`: 显示登录对话框
- `handleLoginSuccess(data, onShowOnboarding, onDismissGuide)`: 处理登录成功事件
- `initializeUserBalances()`: 初始化用户余额和智点

#### 登出相关

- `handleLogout(onResetPageState)`: 处理用户登出，包含确认对话框
- `handleUserCommand(command, callbacks)`: 处理用户菜单命令

#### 密码找回

- `showPasswordRecovery()`: 显示找回密码对话框
- `backToLogin()`: 从找回密码返回登录
- `handleRecoverySuccess()`: 处理找回密码成功

#### 工具方法

- `checkRouteParams()`: 检查路由参数并处理登录弹窗
- `checkAuthStatus(action)`: 检查用户登录状态
- `getAuthState()`: 获取认证状态信息

## 使用示例

### 在组件中使用

```javascript
import { useAuthentication } from "@/composables/useAuthentication";

export default {
  setup() {
    const authentication = useAuthentication();
    const {
      loginDialogVisible,
      isRegisterMode,
      showLogin,
      handleLoginSuccess,
      checkAuthStatus,
    } = authentication;

    // 显示登录对话框
    const openLogin = () => {
      showLogin(false); // false: 登录模式, true: 注册模式
    };

    // 检查登录状态
    const doSomething = () => {
      if (!checkAuthStatus("执行操作")) {
        return; // 未登录会自动显示提示并打开登录框
      }
      // 执行需要登录的操作...
    };

    return {
      loginDialogVisible,
      isRegisterMode,
      openLogin,
      doSomething,
    };
  },
};
```

### 处理登录成功

```javascript
// 在模板中
<LoginDialog
  v-model="loginDialogVisible"
  :register-mode="isRegisterMode"
  @login-success="(data) => handleLoginSuccess(data, showOnboardingCallback, dismissGuideCallback)"
/>

// 在脚本中
const showOnboardingCallback = () => {
  showOnboarding.value = true
}

const dismissGuideCallback = () => {
  // 关闭引导逻辑
}
```

### 处理用户菜单命令

```javascript
const handleCommand = async (command) => {
  await handleUserCommand(command, {
    onShowProfile: () => {
      showUserProfile.value = true;
    },
    onShowPreferences: () => {
      preferencesDialogVisible.value = true;
    },
    onShowRecords: () => {
      showRecordsCenter.value = true;
    },
    onResetPageState: () => {
      // 重置页面状态逻辑
      chatHistory.value = [];
      inputMessage.value = "";
      isChatMode.value = false;
    },
  });
};
```

## 迁移指南

### 从 Main.vue 迁移

**原来的代码：**

```javascript
// 状态定义
const loginDialogVisible = ref(false);
const isRegisterMode = ref(false);

// 显示登录
const showLogin = (isRegister) => {
  isRegisterMode.value = isRegister;
  loginDialogVisible.value = true;
};

// 登录成功处理
const handleLoginSuccess = ({ isNewUser, userInfo }) => {
  // 复杂的登录成功逻辑...
};
```

**迁移后的代码：**

```javascript
import { useAuthentication } from "@/composables/useAuthentication";

const authentication = useAuthentication();
const { loginDialogVisible, isRegisterMode, showLogin, handleLoginSuccess } =
  authentication;
```

## 优势

1. **代码复用**: 认证逻辑可在多个组件间复用
2. **关注点分离**: 将认证逻辑从视图组件中分离出来
3. **易于测试**: 独立的函数更容易进行单元测试
4. **统一管理**: 所有认证相关的状态和方法集中管理
5. **类型安全**: 提供完整的 TypeScript 支持（如需要）

## 注意事项

1. 确保在使用前已正确导入 `useAuthentication`
2. 登录成功回调函数需要根据实际需求传入
3. 页面状态重置回调需要包含所有需要清理的状态
4. 路由参数检查需要在组件挂载时调用

## 相关文件

- 主文件: `src/composables/useAuthentication.js`
- 使用示例: `src/views/Main.vue`
- 用户状态管理: `src/store/user.js`
- 登录组件: `src/components/LoginDialog.vue`
