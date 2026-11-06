import { Pressable, View } from "react-native";

import { usePreferences } from "../hooks/usePreferences";
import { daysInMonth, saturdayIndex, weekdayHeaders } from "../lib/dates";
import type { DayMark } from "../lib/streaks";
import { AppText } from "./AppText";

type CalendarMonthProps = {
  year: number;
  month: number;
  marks: Record<number, DayMark>;
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
};

const markClass: Record<DayMark, string> = {
  none: "bg-transparent",
  partial: "bg-gold/25",
  complete: "bg-gold",
};

export function CalendarMonth({ year, month, marks, selectedDay, onSelectDay }: CalendarMonthProps) {
  const { language } = usePreferences();
  const total = daysInMonth(year, month);
  const lead = saturdayIndex(new Date(year, month, 1));
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View className="flex-row">
        {weekdayHeaders(language).map((day) => (
          <View key={day} className="flex-1 items-center py-2">
            <AppText className="text-xs text-forest/45">{day}</AppText>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          const mark = day ? (marks[day] ?? "none") : "none";
          const selected = day === selectedDay;
          return (
            <Pressable
              key={`${year}-${month}-${index}`}
              className="aspect-square items-center justify-center"
              style={{ width: "14.2857%" }}
              disabled={!day}
              onPress={() => day && onSelectDay?.(day)}
            >
              {day ? (
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${markClass[mark]} ${selected ? "border border-forest" : ""}`}
                >
                  <AppText className={`text-sm ${mark === "complete" ? "text-forest-deep" : "text-forest"}`}>
                    {day}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
