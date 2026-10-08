import React, { useEffect } from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import { FloatingTabBar, TABS, useTabsMode } from '@/navigation';
import { useTheme } from '@/theme';

/** Respaldo: barra de vidrio propia (iOS anterior a 26, o si la barra del sistema falló en un arranque anterior). */
function FloatingTabs(): React.JSX.Element {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}

/** Si la barra del sistema lanza un error al dibujarse, se cambia a la barra propia. */
class NativeTabsBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override render(): React.ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function TabsLayout(): React.JSX.Element {
  const { mode, confirmHealthy } = useTabsMode();
  const { colors } = useTheme();

  useEffect(() => {
    if (mode !== 'native') return undefined;
    // Si la app sigue viva unos segundos con la barra del sistema, se considera sana.
    const id = setTimeout(confirmHealthy, 4000);
    return () => clearTimeout(id);
  }, [mode, confirmHealthy]);

  if (mode === 'native') {
    return (
      <NativeTabsBoundary fallback={<FloatingTabs />}>
        <NativeTabs tintColor={colors.accent} minimizeBehavior="onScrollDown" sidebarAdaptable>
          {TABS.map((tab) => (
            <NativeTabs.Trigger key={tab.name} name={tab.name}>
              <NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={{ default: tab.icon, selected: tab.iconSelected }} />
            </NativeTabs.Trigger>
          ))}
        </NativeTabs>
      </NativeTabsBoundary>
    );
  }
  return <FloatingTabs />;
}
