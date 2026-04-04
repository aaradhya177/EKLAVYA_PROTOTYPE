module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo", "nativewind/babel"],
    plugins: ["expo-router/babel", "transform-inline-environment-variables", "react-native-reanimated/plugin"]
  };
};
