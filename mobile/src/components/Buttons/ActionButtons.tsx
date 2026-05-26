import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import EvilIcons from "@expo/vector-icons/EvilIcons";

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
  highlightPayment?: boolean;
  highlightCash?: boolean;
  highlightEnvelope?: boolean;
  highlightClear?: boolean;
  /** When true, disables hover effects */
  disableHover?: boolean;
  className?: string;
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
  highlightPayment,
  highlightCash,
  highlightEnvelope,
  highlightClear,
  disableHover = false,
  className = "",
}: ActionButtonsProps) {
  const hoverClass = disableHover
    ? ""
    : "hover:transform-[scale(1.05)] cursor-pointer";

  const getHighlightClass = (isHighlighted?: boolean) =>
    isHighlighted ? "relative z-[9950] ring-4" : "";

  return (
    <View
      className={`flex flex-row w-full justify-center gap-4 items-center ${className}`}
    >
      {/* Payment Button */}
      <Pressable
        ref={paymentRef}
        onPress={onPaymentClick}
        className={`${hoverClass} flex flex-col justify-between h-[4.5rem] w-[4.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark text-my-red-dark shadow-my-red-light ${getHighlightClass(highlightPayment)} ${highlightPayment ? "ring-my-red-light" : ""}`}
      >
        <FontAwesome6
          name="sack-dollar"
          color="black"
          size={15}
          className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base text-center"
        />
        <Text className="text-xs">Payment</Text>
      </Pressable>

      {/* Cash Button */}
      <Pressable
        ref={cashRef}
        onPress={onCashClick}
        className={`${hoverClass} flex flex-col justify-between h-[4.5rem] w-[4.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark text-my-green-dark shadow-my-green-light ${getHighlightClass(highlightCash)} ${highlightCash ? "ring-my-green-light" : ""}`}
      >
        <FontAwesome6
          name="sack-dollar"
          color="black"
          size={15}
          className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base text-center"
        />
        <Text className="text-xs">Cash</Text>
      </Pressable>

      {/* Nvelope Button */}
      <Pressable
        ref={envelopeRef}
        onPress={onEnvelopeClick}
        className={`${hoverClass} flex flex-col justify-between h-[4.5rem] w-[4.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark text-my-green-dark shadow-my-green-light ${getHighlightClass(highlightEnvelope)} ${highlightEnvelope ? "ring-my-green-light" : ""}`}
      >
        <FontAwesome
          name="envelope"
          color="#076346"
          size={15}
          className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base text-center"
        />
        <Text className="text-xs">Nvelope</Text>
      </Pressable>

      {/* Clear Button */}
      <Pressable
        ref={clearRef}
        onPress={onClearClick}
        className={`${hoverClass} flex flex-col justify-between h-[4.5rem] w-[4.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark text-my-red-dark shadow-my-red-light ${getHighlightClass(highlightClear)} ${highlightClear ? "ring-my-red-light" : ""}`}
      >
        <FontAwesome
          name="envelope"
          color="#ad0241"
          size={15}
          fill="green"
          className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base text-center"
        />
        <Text className="text-xs">Clear</Text>
      </Pressable>
    </View>
  );
}
