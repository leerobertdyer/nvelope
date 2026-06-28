import React from "react";
import { View, TextInput, BlurEvent } from "react-native";
import { MyText } from "./MyText";

interface ITextInput {
  id?: string;
  placeholder: string;
  onChange: (text: string) => void;
  value: string;
  label?: string;
  numeric?: boolean;
  maxLength?: number;
  ref?: React.RefObject<TextInput | null>;
  onBlur?: (e: BlurEvent) => void;
}

export default function Input({
  placeholder,
  onChange,
  value,
  label,
  numeric,
  maxLength,
  ref,
  onBlur,
}: ITextInput) {
  return (
    // self-center ensures the w-[90%] centers itself within its parent container
    <View className="w-[90%] h-fit  gap-2 items-center justify-center self-center">
      {label && <MyText className="p-2 w-full text-center">{label}</MyText>}
      <TextInput
        ref={ref}
        className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark text-center"
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "decimal-pad" : "default"}
        maxLength={maxLength}
        onBlur={onBlur}
      />
    </View>
  );
}
