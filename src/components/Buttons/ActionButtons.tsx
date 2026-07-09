import type { RefObject } from "react";
import { Pressable, View } from "react-native";
import { MyText } from "../MyText";
import { LinearGradient } from "expo-linear-gradient";

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
    <View className="flex-row w-full justify-center gap-4 items-center">
      {/* Payment Button */}
      <Pressable
        ref={paymentRef}
        onPress={onPaymentClick}
        style={{
          shadowColor: "#121212",
          shadowOffset: { width: 5, height: 4 },
          shadowOpacity: 0.85,
          shadowRadius: 6,
        }}
        className="bg-my-white-dark rounded-lg p-[1px]"
      >
        <LinearGradient
          colors={[ "#121212", "#ffe0a3", "#121212"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <MyText className="text-[3rem]">💸</MyText>
          <MyText className="text-sm w-full text-center bg-my-white-base text-my-black-dark">
            Payment
          </MyText>
        </LinearGradient>
      </Pressable>

      {/* Cash Button */}
      <Pressable
        ref={cashRef}
        onPress={onCashClick}
        style={{
          shadowColor: "#121212",
          shadowOffset: { width: 5, height: 4 },
          shadowOpacity: 0.85,
          shadowRadius: 6,
        }}
        className="bg-my-white-dark rounded-lg p-[1px]"
      >
        <LinearGradient
          colors={[ "#121212", "#ffe0a3", "#121212"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <MyText className="text-[3rem]">💰</MyText>
          <MyText className="text-sm w-full text-center bg-my-white-base text-my-black-dark">
            Cash
          </MyText>
        </LinearGradient>
      </Pressable>

      {/* Nvelope Button */}
      <Pressable
        ref={envelopeRef}
        onPress={onEnvelopeClick}
        style={{
          shadowColor: "#121212",
          shadowOffset: { width: 5, height: 4 },
          shadowOpacity: 0.85,
          shadowRadius: 6,
        }}
        className="bg-my-white-dark rounded-lg p-[1px]"
      >
        <LinearGradient
          colors={[ "#121212", "#ffe0a3", "#121212"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <MyText className="text-[3rem]">📨</MyText>
          <MyText className="text-sm w-full text-center bg-my-white-base text-my-black-dark">
            Nvelope
          </MyText>
        </LinearGradient>
      </Pressable>

      {/* Clear Button */}
      <Pressable
        ref={clearRef}
        onPress={onClearClick}
        style={{
          shadowColor: "#121212",
          shadowOffset: { width: 5, height: 4 },
          shadowOpacity: 0.85,
          shadowRadius: 6,
        }}
        className="bg-my-white-dark rounded-lg p-[1px]"
      >
        <LinearGradient
          colors={[ "#121212", "#ffe0a3", "#121212"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <MyText className="text-[3rem]">♻️</MyText>
          <MyText className="text-sm w-full text-center bg-my-white-base text-my-black-dark">
            Clear
          </MyText>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
