module.exports = {
  packagerConfig: {
    name: 'VoiceFlow',
    executableName: 'voiceflow',
    asar: true,
    // icon: './assets/icons/app-icon' // Uncomment when icon exists
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'VoiceFlow',
        // setupIcon: './assets/icons/app-icon.ico' // Uncomment when icon exists
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
