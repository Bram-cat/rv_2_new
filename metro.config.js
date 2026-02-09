const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports resolution for @clerk/shared subpath imports
config.resolver.unstable_enablePackageExports = true;
// Prefer react-native condition so Clerk packages resolve RN-compatible entry points
config.resolver.unstable_conditionNames = ["react-native", "browser", "require"];

// Apply NativeWind first
const finalConfig = withNativeWind(config, { input: "./global.css" });

// Shim react-dom AFTER withNativeWind so it doesn't get overridden
const originalResolveRequest = finalConfig.resolver.resolveRequest;
finalConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-dom") {
    return {
      filePath: path.resolve(__dirname, "react-dom-shim.js"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = finalConfig;
