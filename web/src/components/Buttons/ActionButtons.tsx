import { GiEnvelope, GiMoneyStack } from "react-icons/gi";
import type { RefObject } from "react";

interface ActionButtonsProps {
  onPaymentClick?: () => void;
  onCashClick?: () => void;
  onEnvelopeClick?: () => void;
  onClearClick?: () => void;
  paymentRef?: RefObject<HTMLDivElement | null>;
  cashRef?: RefObject<HTMLDivElement | null>;
  envelopeRef?: RefObject<HTMLDivElement | null>;
  clearRef?: RefObject<HTMLDivElement | null>;
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
  const hoverClass = disableHover ? "" : "hover:transform-[scale(1.05)] cursor-pointer";
  
  const getHighlightClass = (isHighlighted?: boolean) => 
    isHighlighted ? "relative z-[9950] ring-4" : "";

  return (
    <div className={`flex w-full justify-center gap-4 items-center ${className}`}>
      {/* Payment Button */}
      <div
        ref={paymentRef}
        onClick={onPaymentClick}
        className={`${hoverClass} flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark text-my-red-dark shadow-my-red-light ${getHighlightClass(highlightPayment)} ${highlightPayment ? "ring-my-red-light" : ""}`}
      >
        <GiMoneyStack className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
        <p className="text-xs">Payment</p>
      </div>

      {/* Cash Button */}
      <div
        ref={cashRef}
        onClick={onCashClick}
        className={`${hoverClass} flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark text-my-green-dark shadow-my-green-light ${getHighlightClass(highlightCash)} ${highlightCash ? "ring-my-green-light" : ""}`}
      >
        <GiMoneyStack className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
        <p className="text-xs">Cash</p>
      </div>

      {/* Nvelope Button */}
      <div
        ref={envelopeRef}
        onClick={onEnvelopeClick}
        className={`${hoverClass} flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-green-dark text-my-green-dark shadow-my-green-light ${getHighlightClass(highlightEnvelope)} ${highlightEnvelope ? "ring-my-green-light" : ""}`}
      >
        <GiEnvelope className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
        <p className="text-xs">Nvelope</p>
      </div>

      {/* Clear Button */}
      <div
        ref={clearRef}
        onClick={onClearClick}
        className={`${hoverClass} flex flex-col justify-between h-[3.5rem] w-[3.5rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-red-dark text-my-red-dark shadow-my-red-light ${getHighlightClass(highlightClear)} ${highlightClear ? "ring-my-red-light" : ""}`}
      >
        <GiEnvelope className="border-2 rounded-md w-[2rem] h-[2rem] p-[2px] bg-my-white-base" />
        <p className="text-xs">Clear</p>
      </div>
    </div>
  );
}

