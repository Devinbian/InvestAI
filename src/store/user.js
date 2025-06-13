import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    userInfo: JSON.parse(localStorage.getItem("userInfo") || "{}"),
    isLoggedIn: !!localStorage.getItem("token"),
  }),

  actions: {
    setToken(token) {
      this.token = token;
      this.isLoggedIn = true;
      localStorage.setItem("token", token);
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    },

    logout() {
      this.token = "";
      this.userInfo = {};
      this.isLoggedIn = false;
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
    },
  },
});
