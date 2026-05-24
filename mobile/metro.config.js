const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// FORCE METRO TO TRANSPILE NATIVEWIND'S UNDERLYING ENGINE
config.transformer.unstable_allowRequireContext = true; 
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });