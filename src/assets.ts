export const Assets = {
  logo: require('../assets/logo/mtb-logo.png'),

  sprites: {
    batter: require('../assets/sprites/batter.png'),
    pitcher: require('../assets/sprites/pitcher.png'),
    fielder: require('../assets/sprites/fielder.png'),
    baseRunner: require('../assets/sprites/base-runner.png'),
  },

  field: require('../assets/field/baseball-field.png'),

  ui: {
    playButton: require('../assets/ui/play-button.png'),
    scoreboard: require('../assets/ui/scoreboard.png'),
    menuBackground: require('../assets/ui/menu-background.png'),
    statCard: require('../assets/ui/stat-card.png'),
    settingsButton: require('../assets/ui/settings-button.png'),
    baseballIcon: require('../assets/ui/baseball-icon.png'),
  },

  appIcon: require('../assets/app-icon/app-icon.png'),
  splash: require('../assets/splash/splash-screen.png'),
} as const;