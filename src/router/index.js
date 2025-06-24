import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../store/user";

const routes = [
  {
    path: "/",
    name: "Main",
    component: () => import("../views/Main.vue"),
    meta: { requiresAuth: false },
  },

  {
    path: "/risk-assessment",
    name: "RiskAssessment",
    component: () => import("../views/RiskAssessment.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/industry-preference",
    name: "IndustryPreference",
    component: () => import("../views/IndustryPreference.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/investment-goals",
    name: "InvestmentGoals",
    component: () => import("../views/InvestmentGoals.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 添加路由错误处理
router.onError((error) => {
  console.error("Router error:", error);
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 如果需要登录但未登录，重定向到主页面（主页面会显示登录弹窗）
    next({
      name: "Main",
      query: { redirect: to.fullPath, showLogin: true },
    });
  } else {
    next();
  }
});

export default router;
