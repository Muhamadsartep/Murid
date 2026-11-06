import { Tabs } from "expo-router";

import { FloatingTabBar } from "../../src/components/FloatingTabBar";
import { useStrings } from "../../src/hooks/usePreferences";
import { colors } from "../../src/theme/colors";

export default function TabsLayout() {
  const t = useStrings();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.home }} />
      <Tabs.Screen name="quran" options={{ title: t.tabs.quran }} />
      <Tabs.Screen name="tracker" options={{ title: t.tabs.tracker }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings }} />
      <Tabs.Screen name="zikr" options={{ href: null, title: t.home.zikrTitle }} />
    </Tabs>
  );
}
