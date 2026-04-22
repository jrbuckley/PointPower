/** @param {{ config: import('expo/config').ExpoConfig }} ctx */
module.exports = ({ config }) => ({
  ...config,
  name: "PointsExchange",
  slug: "points-exchange",
  scheme: "points-exchange",
  plugins: [...(config.plugins ?? []), "expo-router"],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    router: {
      root: "src/app",
    },
  },
});
