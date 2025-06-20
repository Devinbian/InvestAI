const env = process.env.NODE_ENV;
export const headUrl =
  env === "development" ? "http://192.168.0.200:8080" : window.statics.headUrl;
