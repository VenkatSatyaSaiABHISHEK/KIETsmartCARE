const { withAndroidManifest } = require('@expo/config-plugins');

function withAndroidAlarms(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];

    if (mainApplication && mainApplication.activity) {
      mainApplication.activity.forEach((activity) => {
        if (activity.$ && activity.$['android:name'] === '.MainActivity') {
          // Allow the activity to wake the screen and display over the Android lock screen
          activity.$['android:showWhenLocked'] = 'true';
          activity.$['android:turnScreenOn'] = 'true';
          activity.$['android:inheritShowWhenLocked'] = 'true';
        }
      });
    }

    return config;
  });
}

module.exports = withAndroidAlarms;
