import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useAppState } from '@/context';
import { TabsModeProvider } from '@/navigation';
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
          <Stack.Screen
            name="coach"
            options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.6, 1], sheetInitialDetentIndex: 0, sheetCornerRadius: 34, contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="pain"
            options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1], sheetInitialDetentIndex: 0, sheetCornerRadius: 34, contentStyle: { backgroundColor: 'transparent' } }}
          />
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
          <TabsModeProvider>
            <RootNavigator />
          </TabsModeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
