const env = process.env.NODE_ENV;

// 获取生产环境的headUrl，添加错误处理
const getProductionHeadUrl = () => {
  try {
    return window?.statics?.headUrl || "http://localhost:8080";
  } catch (error) {
    console.warn("无法获取生产环境配置，使用默认值:", error);
    return "http://localhost:8080";
  }
};

export const headUrl =
  env === "development" ? "http://192.168.0.206:8080" : getProductionHeadUrl();
