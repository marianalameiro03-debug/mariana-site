const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/groq",
    createProxyMiddleware({
      target: "https://api.groq.com",
      changeOrigin: true,
      pathRewrite: { "^/api/groq": "/openai/v1/chat/completions" },
    })
  );
};
