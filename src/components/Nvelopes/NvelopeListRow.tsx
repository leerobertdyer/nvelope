import React from "react";
import { View, Pressable } from "react-native";
import { Envelope } from "../../types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MyText } from "../MyText";

interface IListEnvelopeProps {
  envelope: Envelope;
  onPress: () => void;
}

export default function ListEnvelope({
  envelope,
  onPress,
}: IListEnvelopeProps) {
  // 1. Calculate color logic dynamically
  const isHighSpend = envelope.spent >= envelope.total * 0.75;
  const isMidSpend = envelope.spent >= envelope.total * 0.5;

  const bgClass = isHighSpend
    ? "bg-my-red-dark"
    : isMidSpend
      ? "bg-my-white-dark"
      : "bg-my-green-dark";

  const textClass = isHighSpend
    ? "text-my-white-light"
    : isMidSpend
      ? "text-my-black-dark"
      : "text-my-white-dark";

  return (
    <Pressable
      onPress={onPress}
      className={`${bgClass} w-full max-w-[40rem] h-12 flex-row border-b-2 border-my-black-dark`}
    >
      <View className="w-[43%] flex-row items-center pl-2 border-r-2 border-my-black-dark">
        {/* <View className="w-6 h-5 justify-center items-center bg-my-white-light rounded-[.14rem] mr-3"> */}
          <FontAwesome name="envelope" size={20} color="#FFF" className="p-2 " />
        {/* </View> */}
        <MyText
          numberOfLines={1}
          className={`${textClass} text-xs font-semibold flex-1`}
        >
          {envelope.name}
        </MyText>
      </View>

      <View className="w-[28.5%] justify-center items-center border-r-2 border-my-black-dark">
        <MyText className={`${textClass} text-sm font-medium`}>
          ${(envelope.total - envelope.spent).toFixed(2)}
        </MyText>
      </View>

      <View className="w-[28.5%] justify-center items-end pr-2">
        <MyText className={`${textClass} text-sm font-medium`}>
          ${envelope.total.toFixed(2)}
        </MyText>
      </View>
    </Pressable>
  );
}
