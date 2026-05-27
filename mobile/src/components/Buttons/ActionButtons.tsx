import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import type { RefObject } from "react";
import { Pressable, Text, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface ActionButtonsProps {
  onPaymentClick?: () => void;
  onCashClick?: () => void;
  onEnvelopeClick?: () => void;
  onClearClick?: () => void;
  paymentRef?: RefObject<View | null>;
  cashRef?: RefObject<View | null>;
  envelopeRef?: RefObject<View | null>;
  clearRef?: RefObject<View | null>;
}

/**
 * Reusable action buttons bar for Payment, Cash, Nvelope, and Clear actions.
 * Used in MainView.
 */
export default function ActionButtons({
  onPaymentClick,
  onCashClick,
  onEnvelopeClick,
  onClearClick,
  paymentRef,
  cashRef,
  envelopeRef,
  clearRef,
}: ActionButtonsProps) {
  return (
    <View
      className="flex-row w-full justify-center gap-4 items-center"
    >
      {/* Payment Button */}
      <Pressable
        ref={paymentRef}
        onPress={onPaymentClick}
        className="flex-col justify-between h-[5.5rem] w-[5.5rem] items-center p-2 bg-my-white-light rounded-md border-[3px] border-my-red-dark text-my-red-dark shadow-my-red-light"
      >
        <View className="border-2 rounded-md w-[3rem] h-[3rem] p-[2px] bg-my-white-base items-center justify-center">
          <FontAwesome6 name="money-bill-wave" color="#ad0241" size={18} />
        </View>
        <Text className="text-xs">Payment</Text>
      </Pressable>

      {/* Cash Button */}
      <Pressable
        ref={cashRef}
        onPress={onCashClick}
        className="flex-col justify-between h-[5.5rem] w-[5.5rem] items-center p-2 bg-my-white-light rounded-md border-[3px] border-my-green-dark text-my-green-dark shadow-my-green-light"
      >
        <View className="border-2 rounded-md w-[3rem] h-[3rem] p-[2px] bg-my-white-base items-center justify-center">
          <FontAwesome6 name="sack-dollar" color="green" size={18} />
        </View>
        <Text className="text-xs">Cash</Text>
      </Pressable>

      {/* Nvelope Button */}
      <Pressable
        ref={envelopeRef}
        onPress={onEnvelopeClick}
        className="flex-col justify-between h-[5.5rem] w-[5.5rem] items-center p-2 bg-my-white-light rounded-md border-[3px] border-my-green-dark text-my-green-dark shadow-my-green-light"
      >
        <View className="border-2 rounded-md w-[3rem] h-[3rem] p-[2px] bg-my-white-base items-center justify-center">
          <FontAwesome name="envelope" color="green" size={18} />
        </View>
        <Text className="text-xs">Nvelope</Text>
      </Pressable>

      {/* Clear Button */}
      <Pressable
        ref={clearRef}
        onPress={onClearClick}
        className="flex-col justify-between h-[5.5rem] w-[5.5rem] items-center p-2 bg-my-white-light rounded-md border-[3px] border-my-green-dark text-my-green-dark shadow-my-green-light"
      >
        <View className="border-2 rounded-md w-[3rem] h-[3rem] p-[2px] bg-my-white-base items-center justify-center">
          <FontAwesome name="envelope" color="#ad0241" size={18} />
        </View>
        <Text className="text-xs">Clear</Text>
      </Pressable>
    </View>
  );
}
