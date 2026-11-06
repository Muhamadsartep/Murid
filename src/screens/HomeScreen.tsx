import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { AppText } from "../components/AppText";
import { useFloatingTabBarInset } from "../components/FloatingTabBar";
import { HeroCard } from "../components/HeroCard";
import { MenuCard } from "../components/MenuCard";
import { Screen } from "../components/Screen";
import { useUnifiedAwrad } from "../hooks/useUnifiedAwrad";
import { useZikrStore } from "../hooks/useZikrStore";
import { formatWeekday } from "../lib/dates";
import { hapticTap } from "../lib/haptics";
import { usePreferences } from "../hooks/usePreferences";

export function HomeScreen() {
  const router = useRouter();
  const { t, language } = usePreferences();
  const bottomInset = useFloatingTabBarInset();
  const { streak } = useZikrStore();
  const { summary } = useUnifiedAwrad();
  const now = new Date();

  const go = (href: "/quran" | "/zikr" | "/tracker" | "/daily" | "/biography") => {
    hapticTap("light");
    router.push(href);
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center pt-2">
          <AppText variant="arabic" className="text-center text-sm leading-6 text-gold-deep">
            {t.home.subtitle}
          </AppText>
        </View>

        <HeroCard
          weekday={formatWeekday(now, language)}
          practiced={summary.done}
          total={summary.total}
          streak={streak}
          onPress={() => go("/daily")}
        />

        <View className="mt-8 flex-row items-center">
          <View className="h-px flex-1 bg-forest/10" />
          <AppText variant="arabic" weight="semibold" className="ml-3 text-base text-forest/80">
            {t.home.library}
          </AppText>
        </View>

        <View className="mt-4 flex-row gap-3">
          <MenuCard
            title={t.home.quranTitle}
            subtitle={t.home.quranSubtitle}
            icon="book-outline"
            onPress={() => go("/quran")}
          />
          <MenuCard
            title={t.home.zikrTitle}
            subtitle={t.home.zikrSubtitle}
            icon="finger-print-outline"
            onPress={() => go("/zikr")}
          />
        </View>

        <View className="mt-3">
          <MenuCard
            wide
            title={t.home.dailyTitle}
            subtitle={t.home.dailySubtitle}
            icon="sunny-outline"
            onPress={() => go("/daily")}
          />
        </View>

        <View className="mt-3">
          <MenuCard
            wide
            title={t.home.trackerTitle}
            subtitle={t.home.trackerSubtitle}
            icon="calendar-outline"
            onPress={() => go("/tracker")}
          />
        </View>

        <View className="mt-3">
          <MenuCard
            wide
            title={t.home.biographyTitle}
            subtitle={t.home.biographySubtitle}
            icon="people-outline"
            onPress={() => go("/biography")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
