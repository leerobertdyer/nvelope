import { forwardRef } from "react";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../../constants";
import type { Interval } from "../../types";

interface IntervalSelectorProps {
  value: Interval | null;
  onChange: (interval: Interval) => void;
  label?: string;
  className?: string;
}

/**
 * Reusable interval selector component for pay period selection.
 * Used in both Settings and Demo for consistent UI and spotlight targeting.
 */
const IntervalSelector = forwardRef<HTMLDivElement, IntervalSelectorProps>(
  ({ value, onChange, label = "Change Budget Interval", className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-my-black-base w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center ${className}`}
      >
        {label && (
          <p className="text-my-white-dark text-center w-full">{label}</p>
        )}
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.toUpperCase() as Interval)}
          className="w-[80%] max-w-[20rem] border-2 bg-my-white-light p-2 rounded-md my-4 text-my-black-dark"
        >
          <option value="" disabled>
            Select Interval
          </option>
          <option value={WEEKLY}>Weekly</option>
          <option value={BIWEEKLY}>Biweekly</option>
          <option value={MONTHLY}>Monthly</option>
          <option value={YEARLY}>Yearly</option>
        </select>
      </div>
    );
  }
);

IntervalSelector.displayName = "IntervalSelector";

export default IntervalSelector;

