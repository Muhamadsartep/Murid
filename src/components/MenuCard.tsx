import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View, type ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { AppText } from "./AppText";

type IconName = keyof typeof Ionicons.glyphMap;

type MenuCardProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  wide?: boolean;
};

const cardShadow: ViewStyle = {
  shadowColor: colors.forestDeep,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.07,
  shadowRadius: 14,
  elevation: 2,
};

const cardSurface = "rounded-[22px] border border-forest/[0.08] bg-ivory";

export function MenuCard({ title, subtitle, icon, onPress, wide }: MenuCardProps) {
  if (wide) {
    return (
      <View className={`w-full overflow-hidden ${cardSurface}`} style={cardShadow}>
        <MenuRow title={title} subtitle={subtitle} icon={icon} onPress={onPress} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[136px] flex-1 p-4 active:scale-[0.98] active:bg-cream ${cardSurface}`}
      style={cardShadow}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View className="flex-row items-start justify-between">
        <Ionicons name="chevron-back" size={15} color={colors.forest} style={{ opacity: 0.3, marginTop: 4 }} />
        <IconTile icon={icon} />
      </View>
      <View className="mt-auto items-end pt-4">
        <CardTitle title={title} subtitle={subtitle} />
      </View>
    </Pressable>
  );
}

function MenuRow({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4 active:bg-cream"
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Ionicons name="chevron-back" size={16} color={colors.forest} style={{ opacity: 0.35 }} />
      <View className="mr-3 flex-1 items-end">
        <CardTitle title={title} subtitle={subtitle} />
      </View>
      <IconTile icon={icon} />
    </Pressable>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <AppText variant="arabic" weight="semibold" className="text-right text-lg leading-7 text-forest">
        {title}
      </AppText>
      <AppText variant="arabic" className="text-right text-[13px] leading-5 text-forest/50">
        {subtitle}
      </AppText>
    </>
  );
}

function IconTile({ icon }: { icon: IconName }) {
  return (
    <View className="h-11 w-11 items-center justify-center rounded-2xl border border-forest/10 bg-forest/[0.06]">
      <Ionicons name={icon} size={21} color={colors.forest} />
    </View>
  );
}
