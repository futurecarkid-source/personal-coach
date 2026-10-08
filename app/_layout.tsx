import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from '@/context';
import { useTheme } from '@/theme';

function RootNavigator(): React.JSX.Element {
  const { hydrated, state } = useAppState();
  const { colors, isDark } = useTheme();

  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const hasPlayer = state.player !== null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={hasPlayer}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout" options={{ presentation: 'modal', gestureEnabled: true }} />
        </Stack.Protected>
        <Stack.Protected guard={!hasPlayer}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
