import { useRef, useEffect } from "react";
import {
  dollarsToCents,
  centsToDollars,
  formatCentsForDisplay,
} from "../util/bankStyleMoney";

const MAX_CENTS = 999999999999; // 9999999999.99 dollars

interface MoneyInputProps {
  value: number;
  onChange: (dollars: number) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  allowNegative?: boolean;
}

export default function MoneyInput({
  value,
  onChange,
  id = "money-input",
  label,
  placeholder = "0.00",
  allowNegative = false,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const cents = dollarsToCents(value);
  const displayStr = formatCentsForDisplay(cents);

  // Keep cursor at end when display updates (e.g. after typing)
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      el.setSelectionRange(displayStr.length, displayStr.length);
    }
  }, [displayStr]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      const digit = parseInt(e.key, 10);
      const sign = cents < 0 ? -1 : 1;
      const absCents = Math.abs(cents);
      const newAbsCents = absCents * 10 + digit;
      if (newAbsCents > MAX_CENTS) return;
      onChange(centsToDollars(sign * newAbsCents));
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const sign = cents < 0 ? -1 : 1;
      const absCents = Math.abs(cents);
      const newAbsCents = Math.floor(absCents / 10);
      onChange(centsToDollars(sign * newAbsCents));
      return;
    }
    if (allowNegative && (e.key === "-" || e.key === "±")) {
      e.preventDefault();
      onChange(-value);
      return;
    }
    // Allow Tab, Escape, Arrow keys, etc.
    if (
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key.startsWith("Arrow") ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      return;
    }
    // Block any other character (letters, decimal point typed manually, etc.)
    e.preventDefault();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").trim().replace(/^[$,\s]+|\s+$/g, "");
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      const capped = Math.max(
        allowNegative ? -MAX_CENTS / 100 : 0,
        Math.min(MAX_CENTS / 100, parsed)
      );
      onChange(capped);
    }
  }

  return (
    <div className="w-[90%] flex flex-col gap-2 items-center justify-center">
      {label != null && label !== "" && (
        <label
          className="p-2 w-full text-center text-my-white-light"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={displayStr}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark box-border text-center"
        aria-label={label ?? "Amount"}
      />
    </div>
  );
}
