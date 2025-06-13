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
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
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
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 如果需要登录但未登录，保存目标路由并重定向到登录页
    next({
      name: "Login",
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
});

export default router;
