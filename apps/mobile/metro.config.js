const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Monorepo + hoisted node_modules: Babel needs a stable project root so
// expo-router can replace process.env.EXPO_ROUTER_APP_ROOT with a real path.
process.env.EXPO_PROJECT_ROOT = projectRoot;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
