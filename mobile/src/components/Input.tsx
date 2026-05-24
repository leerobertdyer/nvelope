import React from 'react';
import { View, Text, TextInput } from 'react-native';

interface ITextInput {
  id?: string 
  placeholder: string
  onChange: (text: string) => void 
  value: string
  label: string
  numeric?: boolean
  maxLength?: number
}

export default function Input({ 
  placeholder, 
  onChange, 
  value, 
  label, 
  numeric, 
  maxLength 
}: ITextInput) {
  return (
    // self-center ensures the w-[90%] centers itself within its parent container
    <View className="w-[90%] flex flex-col gap-2 items-center justify-center self-center">
      <Text className="p-2 w-full text-center">{label}</Text>
      
      <TextInput
        className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-full max-w-[20rem] text-my-black-dark"
        placeholder={placeholder}
        placeholderTextColor="#888" 
        value={value}
        onChangeText={onChange} 
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        maxLength={maxLength}
      />
    </View>
  );
}