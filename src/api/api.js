import request from "../utils/request";
import { headUrl } from "@/config/baseUrl";
const api = {
  devPrefix: headUrl,
  // user
  loginApi: "/login",
  registerApi: "/register",
  logoutApi: "/logout",
};

export default api;

export const login = (params) => request.post(api.loginApi, params);

export const register = (params) => request.post(api.registerApi, params);

export const logout = () => request.post(api.logoutApi);

