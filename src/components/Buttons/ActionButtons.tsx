
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
      >
        <LinearGradient
          colors={[
            "#fff2d9",
            "#fff2d9",
            "#fcca68",
            "#f79902",

            "#fff2d9",
            "#fcca68",
            "#fff2d9",
            "#ad0241",
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <MyText className="text-[3rem]">💸</MyText>
          <MyText className="text-sm">Payment</MyText>
        </LinearGradient>
      </Pressable>

      {/* Cash Button */}
      <Pressable
        ref={cashRef}
        onPress={onCashClick}
      >
        <LinearGradient
          colors={[
            "#0bb07c",
            "#f79902",
            "#fff2d9",
            "#0bb07c",
            "#fcca68",
            "#fff2d9",
            "#0bb07c",
            "#f79902",
            "#f79902",
            "#fff2d9",
            "#fcca68",
            "#fff2d9",
            "#fcca68",
            "#f79902",
            "#f79902",
            "#fff2d9",
            "#0bb07c",
            "#0bb07c",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <MyText className="text-[3rem]">💰</MyText>
          <MyText className="text-sm">Cash</MyText>
        </LinearGradient>
      </Pressable>

      {/* Nvelope Button */}
      <Pressable
        ref={envelopeRef}
        onPress={onEnvelopeClick}
      >
        <LinearGradient
          colors={[
            "#f79902",
            "#fff2d9",
            "#FFFFFF",
            "#fff2d9",
            "#fcca68",
            "#fff2d9",
            "#f79902",
            "#fcca68",
            "#FFFFFF",
            "#fff2d9",
            "#f79902",
          ]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <MyText className="text-[3rem]">📨</MyText>
          <MyText className="text-sm text-my-black-dark">Nvelope</MyText>
        </LinearGradient>
      </Pressable>

      {/* Clear Button */}
      <Pressable
        ref={clearRef}
        onPress={onClearClick}
      >
        <LinearGradient
          colors={[
            "#ad0241",
            "#fff2d9",
            "#fcca68",
            "#fff2d9",
            "#fcca68",
            "#fff2d9",
            "#ad0241",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 77,
            height: 77,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <MyText className="text-[3rem]">♻️</MyText>
          <MyText className="text-sm text-my-black-dark">Clear</MyText>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
