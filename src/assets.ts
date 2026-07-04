export const Assets = {
  logo: require('../assets/logo/mtb-logo.png'),

  sprites: {
    batter: require('../assets/sprites/batter.png'),
    pitcher: require('../assets/sprites/pitcher.png'),
    fielder: require('../assets/sprites/fielder.png'),
    baseRunner: require('../assets/sprites/base-runner.png'),
    variants: {
      skin: {
        veryLight: require('../assets/sprites/variants/skin/skin-very-light.png'),
        light: require('../assets/sprites/variants/skin/skin-light.png'),
        medium: require('../assets/sprites/variants/skin/skin-medium.png'),
        dark: require('../assets/sprites/variants/skin/skin-dark.png'),
        deep: require('../assets/sprites/variants/skin/skin-deep.png'),
      },
      hair: {
        short: require('../assets/sprites/variants/hair/hair-short.png'),
        shortBlonde: require('../assets/sprites/variants/hair/hair-short-blonde.png'),
        shortRed: require('../assets/sprites/variants/hair/hair-short-red.png'),
        curly: require('../assets/sprites/variants/hair/hair-curly.png'),
        curlyBlack: require('../assets/sprites/variants/hair/hair-curly-black.png'),
        long: require('../assets/sprites/variants/hair/hair-long.png'),
        longBlonde: require('../assets/sprites/variants/hair/hair-long-blonde.png'),
        buzz: require('../assets/sprites/variants/hair/hair-buzz.png'),
      },
      glasses: {
        sports: require('../assets/sprites/variants/glasses/sports-glasses.png'),
        sunglasses: require('../assets/sprites/variants/glasses/sunglasses.png'),
      },
      handedness: {
        badgeL: require('../assets/sprites/variants/handedness/badge-L.png'),
        badgeR: require('../assets/sprites/variants/handedness/badge-R.png'),
      },
    },
  },

  field: require('../assets/field/baseball-field.png'),

  jerseys: {
    front: require('../assets/jerseys/jersey-template-front.png'),
    back: require('../assets/jerseys/jersey-template-back.png'),
    variants: {
      forestGreen: require('../assets/jerseys/variants/forest-green.png'),
      navy: require('../assets/jerseys/variants/navy.png'),
      red: require('../assets/jerseys/variants/red.png'),
      purple: require('../assets/jerseys/variants/purple.png'),
      orange: require('../assets/jerseys/variants/orange.png'),
      teal: require('../assets/jerseys/variants/teal.png'),
      charcoal: require('../assets/jerseys/variants/charcoal.png'),
    },
  },

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