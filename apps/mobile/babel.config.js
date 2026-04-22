const expoRouterContextFix = require("./scripts/babel-expo-router-context.cjs");

module.exports = function (api) {
  api.cache(true);
  return {
    // Plugins run before presets — Metro must see string literals in _ctx*.js
    plugins: [expoRouterContextFix],
    presets: ["babel-preset-expo"],
  };
};
