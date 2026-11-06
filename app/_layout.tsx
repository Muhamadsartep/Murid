import "../global.css";

import { Amiri_400Regular, Amiri_700Bold, useFonts } from "@expo-google-fonts/amiri";
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from "@expo-google-fonts/vazirmatn";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { fonts } from "../src/components/AppText";
import { BootReveal } from "../src/components/BootScreen";
import { AwradProgressProvider } from "../src/hooks/useAwradProgress";
import { PreferencesProvider, usePreferences } from "../src/hooks/usePreferences";
import { UnifiedAwradProvider, useUnifiedAwrad } from "../src/hooks/useUnifiedAwrad";
import { ZikrStoreProvider, useZikrStore } from "../src/hooks/useZikrStore";
import { colors } from "../src/theme/colors";

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <PreferencesProvider>
        <ZikrStoreProvider>
          <AwradProgressProvider>
            <UnifiedAwradProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </UnifiedAwradProvider>
          </AwradProgressProvider>
        </ZikrStoreProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;

function RootNavigator() {
  const { ready } = useZikrStore();
  const { ready: awradReady } = useUnifiedAwrad();
  const { ready: prefsReady } = usePreferences();
  // On a font error, fall back to the system font rather than blocking boot.
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
    [fonts.mushaf]: require("../assets/fonts/UthmanicHafs1Ver18.ttf"),
  });

  const appReady = ready && awradReady && prefsReady && (fontsLoaded || fontError != null);

  return (
    <BootReveal ready={appReady}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: "slide_from_left",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quran/[id]" />
        <Stack.Screen name="daily" />
        <Stack.Screen name="biography" />
      </Stack>
    </BootReveal>
  );
}
