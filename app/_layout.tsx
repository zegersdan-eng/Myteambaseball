import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { TeamProvider } from '../src/context/TeamContext';

export default function RootLayout() {
  return (
    <TeamProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1A56DB' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#f0f4f8' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'My Team Baseball', headerShown: false }} />
        <Stack.Screen name="roster" options={{ title: 'Team Roster' }} />
        <Stack.Screen name="game" options={{ title: 'Play Ball!', headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Team Settings' }} />
        <Stack.Screen name="player/[id]" options={{ title: 'Player Details' }} />
        <Stack.Screen name="import-roster" options={{ title: 'Import Roster' }} />
        <Stack.Screen name="manual-roster" options={{ title: 'Manual Roster Entry' }} />
        <Stack.Screen name="manage-teams" options={{ title: 'My Teams' }} />
        <Stack.Screen name="select-opponent" options={{ title: 'Select Opponent' }} />
      </Stack>
    </TeamProvider>
  );
}