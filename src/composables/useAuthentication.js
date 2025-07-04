import { ref, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/store/user";
import { ElMessage, ElMessageBox } from "element-plus";

/**
 * 用户认证逻辑组合式函数
 *
 * 功能包括：
 * - 登录对话框管理
 * - 用户登录成功处理
 * - 用户登出逻辑
 * - 密码找回功能
 * - 路由参数处理
 */
export function useAuthentication() {
  const router = useRouter();
  const route = useRoute();
  const userStore = useUserStore();

  // 认证相关状态
  const loginDialogVisible = ref(false);
  const isRegisterMode = ref(false);
  const recoveryDialogVisible = ref(false);

  /**
   * 显示登录对话框
   * @param {boolean} isRegister - 是否为注册模式
   */
  const showLogin = (isRegister = false) => {
    isRegisterMode.value = isRegister;
    loginDialogVisible.value = true;
  };

  /**
   * 处理登录成功事件
   * @param {Object} params - 登录成功参数
   * @param {boolean} params.isNewUser - 是否为新用户
   * @param {Object} params.userInfo - 用户信息
   * @param {Function} onShowOnboarding - 显示引导流程的回调函数
   * @param {Function} onDismissGuide - 关闭引导的回调函数
   */
  const handleLoginSuccess = (
    { isNewUser, userInfo },
    onShowOnboarding,
    onDismissGuide,
  ) => {
    // 为用户设置初始余额和智点（如果没有的话）
    initializeUserBalances();

    // 生成一些模拟数据（测试数据）
    userStore.generateMockRecords();

    if (isNewUser) {
      // 新用户注册成功，显示引导流程
      setTimeout(() => {
        if (onShowOnboarding) {
          onShowOnboarding();
        }
      }, 500);
      // ElMessage.success(
      //   "注册成功！已为您准备了100万资金和10智点用于体验交易功能",
      // );
    } else {
      // 老用户登录成功，检查是否需要继续引导流程
      if (userStore.shouldShowOnboarding()) {
        // 用户之前没有完成引导流程，继续显示引导
        setTimeout(() => {
          if (onShowOnboarding) {
            onShowOnboarding();
          }
        }, 500);
        ElMessage.success("欢迎回来！让我们继续完成您的投资偏好设置");
      } else {
        // 用户已完成引导流程，直接进入主界面
        if (onDismissGuide) {
          onDismissGuide();
        }
        ElMessage.success("欢迎回来！");
      }
    }
  };

  /**
   * 初始化用户余额和智点
   */
  const initializeUserBalances = () => {
    if (userStore.balance <= 0) {
      // 设置初始资金余额：100万元用于股票交易
      userStore.addBalance(1000000);
      console.log("已为用户设置初始资金余额：100万元");
    }

    if (userStore.smartPointsBalance <= 0) {
      // 设置初始智点余额：10智点用于AI功能
      userStore.addSmartPoints(10);
      console.log("已为用户设置初始智点余额：10智点");
    }
  };

  /**
   * 处理用户登出
   * @param {Function} onResetPageState - 重置页面状态的回调函数
   */
  const handleLogout = async (onResetPageState) => {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
        "确定要退出登录吗？退出后将清除所有本地数据。",
        "退出登录",
        {
          confirmButtonText: "确定退出",
          cancelButtonText: "取消",
          type: "warning",
          center: true,
        },
      );

      // 用户确认退出，执行退出操作
      // 如果用户未完成引导流程，保留引导状态
      const shouldClearOnboarding = userStore.onboardingStatus.completed;
      userStore.logout(shouldClearOnboarding);

      // 重置页面状态
      if (onResetPageState) {
        onResetPageState();
      }

      // 显示退出成功提示
      ElMessage.success("已成功退出登录");

      // 跳转到主页面（初始状态）
      await router.push("/");

      // 延迟刷新页面，确保完全重置状态
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      // 用户取消退出，不执行任何操作
      console.log("用户取消退出登录");
    }
  };

  /**
   * 显示找回密码对话框
   */
  const showPasswordRecovery = () => {
    recoveryDialogVisible.value = true;
  };

  /**
   * 从找回密码返回登录
   */
  const backToLogin = () => {
    recoveryDialogVisible.value = false;
    loginDialogVisible.value = true;
  };

  /**
   * 处理找回密码成功
   */
  const handleRecoverySuccess = () => {
    loginDialogVisible.value = true;
  };

  /**
   * 处理用户菜单命令
   * @param {string} command - 命令类型
   * @param {Object} callbacks - 回调函数集合
   * @param {Function} callbacks.onShowProfile - 显示个人中心
   * @param {Function} callbacks.onShowPreferences - 显示偏好设置
   * @param {Function} callbacks.onShowRecords - 显示记录中心
   * @param {Function} callbacks.onResetPageState - 重置页面状态
   */
  const handleUserCommand = async (command, callbacks = {}) => {
    const {
      onShowProfile,
      onShowPreferences,
      onShowRecords,
      onResetPageState,
    } = callbacks;

    console.log("Menu command clicked:", command);

    switch (command) {
      case "profile":
        if (onShowProfile) {
          onShowProfile();
        }
        break;
      case "settings":
        if (onShowPreferences) {
          onShowPreferences();
        }
        break;
      case "records":
        if (onShowRecords) {
          onShowRecords();
        }
        break;
      case "logout":
        await handleLogout(onResetPageState);
        break;
    }
  };

  /**
   * 检查路由参数并处理登录弹窗
   */
  const checkRouteParams = () => {
    if (route.query.showLogin === "true" && !userStore.isLoggedIn) {
      loginDialogVisible.value = true;
    }
  };

  /**
   * 检查用户登录状态，未登录时显示提示
   * @param {string} action - 操作名称（用于提示信息）
   * @returns {boolean} 是否已登录
   */
  const checkAuthStatus = (action = "操作") => {
    if (!userStore.isLoggedIn) {
      ElMessage.warning(`请先登录后再${action}`);
      showLogin(false);
      return false;
    }
    return true;
  };

  /**
   * 获取用户认证状态信息
   * @returns {Object} 认证状态信息
   */
  const getAuthState = () => {
    return {
      isLoggedIn: userStore.isLoggedIn,
      userInfo: userStore.userInfo,
      token: userStore.token,
      loginDialogVisible: loginDialogVisible.value,
      isRegisterMode: isRegisterMode.value,
      recoveryDialogVisible: recoveryDialogVisible.value,
    };
  };

  return {
    // 状态
    loginDialogVisible,
    isRegisterMode,
    recoveryDialogVisible,

    // 方法
    showLogin,
    handleLoginSuccess,
    handleLogout,
    showPasswordRecovery,
    backToLogin,
    handleRecoverySuccess,
    handleUserCommand,
    checkRouteParams,
    checkAuthStatus,
    getAuthState,
    initializeUserBalances,
  };
}
