const env = process.env.NODE_ENV;
export const headUrl = env === "development" ? "http://localhost:8080" : window.statics.headUrl;
