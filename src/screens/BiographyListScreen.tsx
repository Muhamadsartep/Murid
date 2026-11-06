import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, TextInput, View, type ListRenderItem } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, fonts } from "../components/AppText";
import { Screen } from "../components/Screen";
import { useStrings } from "../hooks/usePreferences";
import { biographies, type Biography } from "../lib/biographies";
import { hapticTap } from "../lib/haptics";
import { colors } from "../theme/colors";

export function BiographyListScreen() {
  const t = useStrings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const results = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return biographies;
    return biographies.filter((item) => item.name.includes(query));
  }, [searchQuery]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  const openMaster = useCallback(
    (id: number) => {
      hapticTap("light");
      router.push({ pathname: "/biography/[id]", params: { id: String(id) } });
    },
    [router],
  );

  const renderItem = useCallback<ListRenderItem<Biography>>(
    ({ item }) => <MasterRow item={item} onPress={openMaster} />,
    [openMaster],
  );

  return (
    <Screen>
      <View className="flex-row items-center px-5 pb-3 pt-3">
        <Pressable
          onPress={goBack}
          className="h-11 w-11 items-center justify-center rounded-full border border-gold/70 bg-ivory active:opacity-70"
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Ionicons name="chevron-back" size={20} color={colors.forest} />
        </Pressable>
        <AppText variant="arabic" weight="bold" className="flex-1 pl-3 text-right text-xl leading-8 text-forest">
          {t.home.biographyTitle}
        </AppText>
      </View>

      <View className="mx-5 mb-3 h-12 flex-row items-center rounded-2xl border border-forest/10 bg-ivory px-3">
        <Ionicons name="search" size={18} color={colors.goldDeep} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t.biography.searchPlaceholder}
          placeholderTextColor="rgba(26,77,46,0.45)"
          selectionColor={colors.gold}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityRole="search"
          accessibilityLabel={t.biography.searchPlaceholder}
          className="mx-2 h-12 flex-1 text-right text-base text-forest"
          style={{ writingDirection: "rtl", textAlign: "right", fontFamily: fonts.sans.medium }}
        />
        {searchQuery.length > 0 ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t.biography.clearSearch}
          >
            <Ionicons name="close-circle" size={18} color={colors.goldDeep} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <AppText variant="arabic" className="px-4 py-10 text-center text-base text-forest/50">
            {t.biography.searchEmpty}
          </AppText>
        }
      />
    </Screen>
  );
}

const MasterRow = memo(function MasterRow({
  item,
  onPress,
}: {
  item: Biography;
  onPress: (id: number) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      className="mb-2.5 min-h-[72px] flex-row items-center rounded-2xl border border-forest/10 bg-ivory px-4 py-3.5 active:bg-gold-soft"
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <Ionicons name="chevron-back" size={18} color={colors.forest} style={{ opacity: 0.35 }} />
      <View className="mx-3 flex-1">
        <AppText variant="arabic" weight="semibold" className="text-right text-lg leading-7 text-forest">
          {item.name}
        </AppText>
      </View>
      <View className="h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-cream">
        <AppText weight="semibold" className="text-sm text-forest">
          {item.id}
        </AppText>
      </View>
    </Pressable>
  );
});
