import { useRef } from "react";
import { TextInput, View } from "react-native";
import { MyText } from "../MyText";
import {
  centsToDollars,
  dollarsToCents,
  formatCentsForDisplay,
} from "../../util/bankStyleMoney";

const MAX_CENTS = 999999999999;

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
  label,
  placeholder = "0.00",
  allowNegative = false,
}: MoneyInputProps) {
  const inputRef = useRef<TextInput>(null);
  const cents = dollarsToCents(value);
  const displayStr = formatCentsForDisplay(cents);

  function handleChangeText(text: string) {
    // Strip everything except digits (and minus if allowed)
    const digitsOnly = allowNegative
      ? text.replace(/[^0-9-]/g, "").replace(/(?!^)-/g, "") // keep only leading minus
      : text.replace(/[^0-9]/g, "");
    if (digitsOnly === "") {
      onChange(0);
      return;
    }
    const newCents = parseInt(digitsOnly, 10);
    if (newCents > MAX_CENTS) return;
    onChange(centsToDollars(newCents));
  }

  return (
    <View className="w-[90%] flex-col gap-2 items-center justify-center">
      {label != null && label !== "" && (
        <MyText className="p-2 w-full text-my-white-light">{label}</MyText>
      )}
      <TextInput
        ref={inputRef}
        keyboardType="number-pad"
        value={displayStr}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        selection={{ start: displayStr.length, end: displayStr.length }}
        className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark text-center"
      />
    </View>
  );
}
