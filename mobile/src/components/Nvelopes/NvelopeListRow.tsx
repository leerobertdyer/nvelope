import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Envelope } from "../../types";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface IListEnvelopeProps {
  envelope: Envelope;
  onPress: () => void;
}

export default function ListEnvelope({ envelope, onPress }: IListEnvelopeProps) {
  // 1. Calculate color logic dynamically
  const isHighSpend = envelope.spent >= envelope.total * 0.75;
  const isMidSpend = envelope.spent >= envelope.total * 0.5;

  const bgClass = isHighSpend
    ? 'bg-my-red-dark'
    : isMidSpend
    ? 'bg-my-white-dark'
    : 'bg-my-green-dark';

  const textClass = isHighSpend
    ? 'text-my-white-light'
    : isMidSpend
    ? 'text-my-black-dark'
    : 'text-my-white-dark';

  return (
    // Pressable replaces onClick/onPress for web elements in RN
    <Pressable 
      onPress={onPress}
      className={`${bgClass} w-full max-w-[40rem] h-12 flex flex-row border-2 border-my-black-dark self-center`}
    >
      {/* Column 1: Icon and Name (Taking up roughly 3/7 of space -> ~43%) */}
      <View className="w-[43%] flex flex-row items-center pl-2 border-r-2 border-my-black-dark">
        <View className="w-8 h-8 justify-center items-center bg-white rounded-sm mr-3">
          {/* Note: Vector icons use native color/size props, not className for dimensions */}
          <FontAwesome name="envelope" size={20} color="#1A1A1A" />
        </View>
        <Text className={`${textClass} text-xs font-semibold numberOfLines={1}`}>
          {envelope.name}
        </Text>
      </View>

      {/* Column 2: Remaining Amount (Taking up roughly 2/7 of space -> ~28.5%) */}
      <View className="w-[28.5%] justify-center items-center border-r-2 border-my-black-dark">
        <Text className={`${textClass} text-sm font-medium`}>
          ${(envelope.total - envelope.spent).toFixed(2)}
        </Text>
      </View>

      {/* Column 3: Total Amount (Taking up roughly 2/7 of space -> ~28.5%) */}
      <View className="w-[28.5%] justify-center items-end pr-2">
        <Text className={`${textClass} text-sm font-medium`}>
          ${envelope.total.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}