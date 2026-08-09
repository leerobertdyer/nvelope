import type { RefObject } from "react";
import MyIcon from "../MyIcon";

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
 * Reusable action buttons bar for Payment, Cash, Nvelope, and Reset actions.
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
    : "hover:scale-105 cursor-pointer transition-transform";

  const getHighlightClass = (isHighlighted?: boolean) =>
    isHighlighted ? "relative z-[9950] ring-4" : "";

  return (
    <div className={`flex w-full justify-center gap-4 items-center ${className}`}>
      <div
        ref={paymentRef}
        onClick={onPaymentClick}
        className={`${hoverClass} flex flex-col items-center pt-2 pb-1 bg-[#9c6d00] border-2 border-my-black-dark rounded-lg h-[6rem] w-[6rem] ${getHighlightClass(highlightPayment)} ${highlightPayment ? "ring-my-red-light" : ""}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="PAYMENT" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Payment</p>
      </div>

      <div
        ref={cashRef}
        onClick={onCashClick}
        className={`${hoverClass} flex flex-col items-center pt-2 pb-1 bg-my-green-dark border-2 border-my-black-dark rounded-lg h-[6rem] w-[6rem] ${getHighlightClass(highlightCash)} ${highlightCash ? "ring-my-green-light" : ""}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="CASH" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Cash</p>
      </div>

      <div
        ref={envelopeRef}
        onClick={onEnvelopeClick}
        className={`${hoverClass} flex flex-col items-center pt-2 pb-1 bg-my-blue-dark border-2 border-my-black-dark rounded-lg h-[6rem] w-[6rem] ${getHighlightClass(highlightEnvelope)} ${highlightEnvelope ? "ring-my-blue-light" : ""}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="NVELOPE" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Nvelope</p>
      </div>

      <div
        ref={clearRef}
        onClick={onClearClick}
        className={`${hoverClass} flex flex-col items-center pt-2 pb-1 bg-my-red-dark border-2 border-my-black-dark rounded-lg h-[6rem] w-[6rem] ${getHighlightClass(highlightClear)} ${highlightClear ? "ring-my-red-light" : ""}`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="RESET" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Reset</p>
      </div>
    </div>
  );
}
