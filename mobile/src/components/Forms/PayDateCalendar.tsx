import { forwardRef } from "react";
import "react-calendar/dist/Calendar.css";
import { View } from "react-native";
import { DateData, Calendar } from "react-native-calendars";

interface PayDateCalendarProps {
  d: DateData | null;
  onChange: (d: DateData) => void;
  label?: string;
  className?: string;
  maxDate?: Date;
  minDate?: Date;
}

/**
 * Reusable pay date calendar component.
 * Used in Settings and FirstTimeSetup.
 */
const PayDateCalendar = forwardRef<HTMLDivElement, PayDateCalendarProps>(
  (
    {
      d,
      onChange,
      label = "Change Pay Date",
      className = "",
      maxDate,
      minDate,
    },
    ref
  ) => {
    return (
      <View
        ref={ref}
        className={`bg-my-black-base text-my-black-light w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center ${className}`}
      >
        {label && (
          <p className="text-my-white-dark text-center w-full pb-2">{label}</p>
        )}
        <Calendar
          onChange={onChange}
          date={d || new Date}
          maxDate={maxDate}
          minDate={minDate}
        />
      </View>
    );
  }
);

PayDateCalendar.displayName = "PayDateCalendar";

export default PayDateCalendar;

