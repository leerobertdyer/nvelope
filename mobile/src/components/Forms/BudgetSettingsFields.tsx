import { DateData, Calendar } from "react-native-calendars";
import { Interval } from "../../types";
import IntervalSelector from "./IntervalSelector";
import { Pressable, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MyText } from "../MyText";
import { format } from "date-fns";

const cardClass =
  "flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4";

export interface BudgetSettingsFieldsProps {
  /** "create" = interval + pay date only; "edit" = Edit Remaining Balance card + interval + pay date */
  mode: "create" | "edit";
  intervalValue: Interval | null;
  onIntervalChange: (interval: Interval) => void;
  payDate: Date | null;
  onPayDateChange: (d: DateData) => void;
  /** Only used when mode === "edit" */
  onEditRemainingBalance?: () => void;
  /** Optional label for interval (e.g. "Pay period interval" in create) */
  intervalLabel?: string;
}

/**
 * Shared budget settings UI: Edit Remaining Balance card (edit only),
 * IntervalSelector, and PayDateCalendar. Used in both Create New Budget and Edit Budget flows.
 */
export default function BudgetSettingsFields({
  mode,
  intervalValue,
  onIntervalChange,
  payDate,
  onPayDateChange,
  onEditRemainingBalance,
  intervalLabel,
}: BudgetSettingsFieldsProps) {
  const newPaymentDate = payDate
    ? format(payDate, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd"); // Default to today's date string if it's a brand new payment

  return (
    <View className="flex flex-col items-center w-full">
      {mode === "edit" && onEditRemainingBalance && (
        <Pressable className={cardClass} onPress={onEditRemainingBalance}>
          <FontAwesome
            name="pencil-square-o"
            className="border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-dark text-my-black-dark p-[2px] border-my-black-dark"
          />
          <MyText className="text-sm">Edit Remaining Balance</MyText>
        </Pressable>
      )}
      <IntervalSelector
        value={intervalValue}
        onChange={onIntervalChange}
        label={
          intervalLabel ??
          (mode === "create" ? "Pay period interval" : undefined)
        }
      />
      <Calendar
        markedDates={{
          [newPaymentDate]: { selected: true, selectedColor: "#fcca68" },
        }}
        theme={{
          calendarBackground: "#fff2d9",
          textSectionTitleColor: "#b6c1cd",
          selectedDayTextColor: "#fff2d9",
          todayTextColor: "#00adf5",
          dayTextColor: "#2d4150",
          textDisabledColor: "#d9e1e8",
          arrowColor: "orange",
          monthTextColor: "#038894",
          indicatorColor: "#038894",
          textDayFontFamily: "monospace",
          textMonthFontFamily: "monospace",
          textDayHeaderFontFamily: "monospace",
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
        onDayPress={onPayDateChange}
        date={newPaymentDate}
      />
    </View>
  );
}
