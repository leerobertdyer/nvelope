import { forwardRef } from "react";
import Calendar from "react-calendar";
import type { Value } from "react-calendar/src/shared/types.js";
import "react-calendar/dist/Calendar.css";

interface PayDateCalendarProps {
  value: Date | null;
  onChange: (value: Value) => void;
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
      value,
      onChange,
      label = "Change Pay Date",
      className = "",
      maxDate,
      minDate,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-my-black-base text-my-black-light w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center ${className}`}
      >
        {label && (
          <p className="text-my-white-dark text-center w-full pb-2">{label}</p>
        )}
        <Calendar
          onChange={onChange}
          value={value || new Date()}
          calendarType="gregory"
          selectRange={false}
          className="cursor-pointer-calendar"
          maxDate={maxDate}
          minDate={minDate}
        />
      </div>
    );
  }
);

PayDateCalendar.displayName = "PayDateCalendar";

export default PayDateCalendar;

