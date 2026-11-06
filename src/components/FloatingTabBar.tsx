import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { type ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hapticTap } from "../lib/haptics";
import { colors } from "../theme/colors";
import { fonts } from "./AppText";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
type IconName = keyof typeof Ionicons.glyphMap;

/** Routes not listed here (e.g. `href: null` screens) get no tab button. */
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home", inactive: "home-outline" },
  quran: { active: "book", inactive: "book-outline" },
  tracker: { active: "calendar", inactive: "calendar-outline" },
  settings: { active: "settings", inactive: "settings-outline" },
};

const BAR_HEIGHT = 68;
const BAR_GAP = 14;

function barBottom(safeBottom: number): number {
  return Math.max(safeBottom, BAR_GAP);
}

/** Bottom padding a tab screen's scroll content needs to clear the floating bar. */
export function useFloatingTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return barBottom(insets.bottom) + BAR_HEIGHT + 24;
}

export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedRoute = state.routes[state.index];

  if (!TAB_ICONS[focusedRoute.name]) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center px-5"
      style={{ bottom: barBottom(insets.bottom) }}
    >
      <View
        className="w-full max-w-md flex-row items-center rounded-full border border-gold/25 bg-forest-deep px-2"
        style={{
          height: BAR_HEIGHT,
          shadowColor: colors.forestDeep,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.28,
          shadowRadius: 20,
          elevation: 14,
        }}
      >
        {state.routes.map((route, index) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;

          const { options } = descriptors[route.key];
          const label = typeof options.title === "string" ? options.title : route.name;
          const focused = state.index === index;
          const tint = focused ? colors.gold : "rgba(248,240,212,0.55)";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              hapticTap("light");
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              className="h-full flex-1 items-center justify-center active:opacity-80"
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            >
              <View
                className={`h-8 w-14 items-center justify-center rounded-full ${focused ? "bg-gold/20" : ""}`}
              >
                <Ionicons name={focused ? icons.active : icons.inactive} size={21} color={tint} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color: tint,
                  fontFamily: focused ? fonts.sans.semibold : fonts.sans.medium,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
