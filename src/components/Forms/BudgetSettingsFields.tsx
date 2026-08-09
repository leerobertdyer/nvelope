import { IoPencil } from "react-icons/io5";
import type { Value } from "react-calendar/src/shared/types.js";
import type { Interval } from "../../types";
import IntervalSelector from "./IntervalSelector";
import PayDateCalendar from "./PayDateCalendar";

const cardClass =
  "hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark shadow-lg shadow-my-black-dark mb-4";

export interface BudgetSettingsFieldsProps {
  /** "create" = interval + pay date only; "edit" = Edit Remaining Balance card + interval + pay date */
  mode: "create" | "edit";
  intervalValue: Interval | null;
  onIntervalChange: (interval: Interval) => void;
  payDateValue: Date | null;
  onPayDateChange: (value: Value) => void;
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
  payDateValue,
  onPayDateChange,
  onEditRemainingBalance,
  intervalLabel,
}: BudgetSettingsFieldsProps) {
  return (
    <div className="flex flex-col items-center w-full">
      {mode === "edit" && onEditRemainingBalance && (
        <div
          className={cardClass}
          onClick={onEditRemainingBalance}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && onEditRemainingBalance?.()
          }
        >
          <IoPencil className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-dark text-my-black-dark p-[2px] border-my-black-dark" />
          <p className="text-sm">Edit Remaining Balance</p>
        </div>
      )}
      <IntervalSelector
        value={intervalValue}
        onChange={onIntervalChange}
        label={intervalLabel ?? (mode === "create" ? "Pay period interval" : undefined)}
      />
      <PayDateCalendar
        value={payDateValue}
        onChange={onPayDateChange}
      />
    </div>
  );
}
