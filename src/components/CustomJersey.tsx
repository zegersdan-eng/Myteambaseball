import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Assets } from '../assets';

interface CustomJerseyProps {
  primaryColor: string;
  secondaryColor: string;
  number?: number;
  size?: number;
  showBack?: boolean;
  teamPhotoUri?: string | null;
}

export default function CustomJersey({
  primaryColor,
  secondaryColor,
  number,
  size = 120,
  showBack = false,
  teamPhotoUri,
}: CustomJerseyProps) {
  const jerseySource = showBack ? Assets.jerseys.back : Assets.jerseys.front;
  const jerseySize = { width: size, height: size };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Base jersey template with primary color tint */}
      <Image
        source={jerseySource}
        style={[jerseySize, styles.jerseyImage, { tintColor: primaryColor }]}
        resizeMode="contain"
      />
      {/* Secondary color trim overlay (SVG simulated via positioned View) */}
      <View
        style={[
          styles.trimTop,
          { backgroundColor: secondaryColor, width: size * 0.8, height: size * 0.12, left: size * 0.1, top: size * 0.05 },
        ]}
      />
      <View
        style={[
          styles.trimBottom,
          { backgroundColor: secondaryColor, width: size * 0.8, height: size * 0.08, left: size * 0.1, bottom: size * 0.05 },
        ]}
      />
      {/* Team photo overlay */}
      {teamPhotoUri && !showBack && (
        <Image
          source={{ uri: teamPhotoUri }}
          style={[
            styles.teamPhoto,
            { width: size * 0.5, height: size * 0.3, top: size * 0.3, left: size * 0.25 },
          ]}
          resizeMode="cover"
        />
      )}
      {/* Number on back */}
      {number !== undefined && number > 0 && (
        <Text
          style={[
            styles.numberText,
            {
              fontSize: size * 0.35,
              top: showBack ? size * 0.32 : size * 0.42,
            },
          ]}
        >
          {number}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jerseyImage: {
    position: 'absolute',
  },
  trimTop: {
    position: 'absolute',
    borderRadius: 4,
    opacity: 0.7,
  },
  trimBottom: {
    position: 'absolute',
    borderRadius: 4,
    opacity: 0.7,
  },
  teamPhoto: {
    position: 'absolute',
    borderRadius: 8,
    opacity: 0.75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  numberText: {
    position: 'absolute',
    alignSelf: 'center',
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    fontFamily: 'System',
    letterSpacing: 2,
  },
});