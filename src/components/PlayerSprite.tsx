import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Assets } from '../assets';
import { Player } from '../data/models';

interface Props {
  player: Player;
  spriteKey: 'batter' | 'pitcher' | 'fielder' | 'baseRunner';
  size?: number;
  flipHorizontal?: boolean;
}

const SKIN_MAP: Record<string, any> = {
  light: Assets.sprites.variants.skin.light,
  medium: Assets.sprites.variants.skin.medium,
  tan: Assets.sprites.variants.skin.dark,
  dark: Assets.sprites.variants.skin.dark,
  deep: Assets.sprites.variants.skin.deep,
};

const HAIR_MAP: Record<string, any> = {
  short: Assets.sprites.variants.hair.short,
  buzz: Assets.sprites.variants.hair.buzz,
  curly: Assets.sprites.variants.hair.curly,
  long: Assets.sprites.variants.hair.long,
  bald: null,
};

const HAIR_OFFSET = { x: 380, y: 80 };
const HAIR_SIZE = { w: 264, h: 120 };
const GLASSES_OFFSET = { x: 410, y: 160 };
const GLASSES_SIZE = { w: 204, h: 80 };
const BADGE_OFFSET = { x: 420, y: 380 };
const BADGE_SIZE = { w: 48, h: 48 };

const SCALE = 0.25; // shrink 1024x1536 to ~256x384

export default function PlayerSprite({ player, spriteKey, size = 256, flipHorizontal = false }: Props) {
  const baseSprite = Assets.sprites[spriteKey];
  const skinOverlay = player.skinTone ? SKIN_MAP[player.skinTone] : null;
  const hairOverlay = player.hairStyle ? HAIR_MAP[player.hairStyle] : null;
  const glasses = player.glasses ? Assets.sprites.variants.glasses.sports : null;
  const badge = player.throwsHand === 'left' ? Assets.sprites.variants.handedness.badgeL : Assets.sprites.variants.handedness.badgeR;

  return (
    <View style={[styles.container, { width: size, height: size * 1.5 }]}>
      <Image
        source={baseSprite}
        style={[styles.baseSprite, { width: size, height: size * 1.5, transform: flipHorizontal ? [{ scaleX: -1 }] : [] }]}
        resizeMode="contain"
      />
      {skinOverlay && (
        <Image source={skinOverlay} style={[styles.overlay, { width: size, height: size * 1.5, opacity: 0.5 }]} resizeMode="contain" />
      )}
      {hairOverlay && (
        <Image
          source={hairOverlay}
          style={{
            position: 'absolute',
            left: HAIR_OFFSET.x * SCALE,
            top: HAIR_OFFSET.y * SCALE,
            width: HAIR_SIZE.w * SCALE,
            height: HAIR_SIZE.h * SCALE,
          }}
          resizeMode="contain"
        />
      )}
      {glasses && (
        <Image
          source={glasses}
          style={{
            position: 'absolute',
            left: GLASSES_OFFSET.x * SCALE,
            top: GLASSES_OFFSET.y * SCALE,
            width: GLASSES_SIZE.w * SCALE,
            height: GLASSES_SIZE.h * SCALE,
          }}
          resizeMode="contain"
        />
      )}
      {badge && (
        <Image
          source={badge}
          style={{
            position: 'absolute',
            left: BADGE_OFFSET.x * SCALE,
            top: BADGE_OFFSET.y * SCALE,
            width: BADGE_SIZE.w * SCALE,
            height: BADGE_SIZE.h * SCALE,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  baseSprite: { position: 'absolute' },
  overlay: { position: 'absolute' },
});
