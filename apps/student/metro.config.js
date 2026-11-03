const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure audio extensions and assets are recognized and bundled into production APK builds
config.resolver.assetExts.push('wav', 'mp3', 'm4a', 'ogg');

module.exports = config;
