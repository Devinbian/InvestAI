const env = process.env.NODE_ENV;

// 获取生产环境的headUrl，添加错误处理 http://36.111.148.197:8089
const getProductionHeadUrl = () => {
  try {
    return window?.statics?.headUrl || "https://stockai.datatellit.com";
  } catch (error) {
    console.warn("无法获取生产环境配置，使用默认值:", error);
    return "https://stockai.datatellit.com";
  }
};

export const headUrl =
  env === "development"
    ? "http://localhost:8080"
    : getProductionHeadUrl();
