import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/navigation';

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Hoy' }} />
      <Tabs.Screen name="entrenar" options={{ title: 'Entrenar' }} />
      <Tabs.Screen name="partido" options={{ title: 'Partido' }} />
      <Tabs.Screen name="tactica" options={{ title: 'Táctica' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
