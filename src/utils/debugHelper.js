import { useUserStore } from "@/store/user";

// 用户偏好数据同步调试工具
export const debugUserPreferences = () => {
  console.log("=== 用户偏好数据同步调试 ===");

  // 检查localStorage中的数据
  const userInfo = localStorage.getItem("userInfo");
  const onboardingStatus = localStorage.getItem("onboardingStatus");
  const onboardingCompleted = localStorage.getItem("onboardingCompleted");

  console.log("localStorage数据:");
  console.log("- userInfo:", userInfo);
  console.log("- onboardingStatus:", onboardingStatus);
  console.log("- onboardingCompleted:", onboardingCompleted);

  if (userInfo) {
    try {
      const parsedUserInfo = JSON.parse(userInfo);
      console.log("解析后的userInfo:", parsedUserInfo);
      console.log("userInfo中的preferences:", parsedUserInfo.preferences);
    } catch (error) {
      console.error("解析userInfo失败:", error);
    }
  }

  if (onboardingStatus) {
    try {
      const parsedOnboardingStatus = JSON.parse(onboardingStatus);
      console.log("解析后的onboardingStatus:", parsedOnboardingStatus);
      console.log(
        "onboardingStatus中的preferences:",
        parsedOnboardingStatus.preferences,
      );
    } catch (error) {
      console.error("解析onboardingStatus失败:", error);
    }
  }

  // 检查userStore状态
  const userStore = useUserStore();
  console.log("userStore状态:");
  console.log("- userStore.userInfo:", userStore.userInfo);
  console.log("- userStore.onboardingStatus:", userStore.onboardingStatus);
  console.log("- getUserPreferences()结果:", userStore.getUserPreferences());
  console.log("- hasUserPreferences()结果:", userStore.hasUserPreferences());

  return {
    userInfo,
    onboardingStatus,
    onboardingCompleted,
    userStore: {
      userInfo: userStore.userInfo,
      onboardingStatus: userStore.onboardingStatus,
      getUserPreferences: userStore.getUserPreferences(),
      hasUserPreferences: userStore.hasUserPreferences(),
    },
  };
};

// 清理用户偏好数据（用于测试）
export const clearUserPreferences = () => {
  console.log("清理用户偏好数据...");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("onboardingStatus");
  localStorage.removeItem("onboardingCompleted");

  // 重新加载页面以重置状态
  window.location.reload();
};

// 模拟用户偏好数据（用于测试）
export const mockUserPreferences = () => {
  const mockPreferences = {
    riskLevel: "balanced",
    experience: "experienced",
    userTraits: {
      risk_tolerance: 3,
      active_participation: 3,
      learning_willingness: 4,
      strategy_dependency: 2,
      trading_frequency: 2,
      innovation_trial: 3,
    },
    sectors: {
      majorCategories: ["technology", "finance"],
      subCategories: ["internet", "banking"],
      categories: [
        {
          value: "technology",
          label: "科技板块",
          children: [{ value: "internet", label: "互联网" }],
        },
        {
          value: "finance",
          label: "金融板块",
          children: [{ value: "banking", label: "银行" }],
        },
      ],
    },
    completedAt: new Date().toISOString(),
  };

  const mockUserInfo = {
    nickname: "测试用户",
    token: "test-token",
    preferences: mockPreferences,
  };

  const mockOnboardingStatus = {
    completed: true,
    currentStep: -1,
    preferences: mockPreferences,
  };

  localStorage.setItem("userInfo", JSON.stringify(mockUserInfo));
  localStorage.setItem(
    "onboardingStatus",
    JSON.stringify(mockOnboardingStatus),
  );
  localStorage.setItem("onboardingCompleted", "true");

  console.log("已设置模拟用户偏好数据");
  return { mockUserInfo, mockOnboardingStatus, mockPreferences };
};

// 在浏览器控制台中暴露调试工具
if (typeof window !== "undefined") {
  window.debugUserPreferences = debugUserPreferences;
  window.clearUserPreferences = clearUserPreferences;
  window.mockUserPreferences = mockUserPreferences;
}
