import { format } from "date-fns";
import type { Payment } from "../types";
import Button from "./Buttons/Button";
import FullScreen from "../Views/FullScreen";

interface SplitPaymentDueModalProps {
  payment: Payment;
  onMarkPaid: (payment: Payment) => void;
  onExtendDate: (payment: Payment) => void;
  onDismiss: () => void;
}

/**
 * Modal shown when a save-up SPLIT payment's target date has been reached.
 * User can mark it as paid, extend the date, or dismiss.
 */
export default function SplitPaymentDueModal({
  payment,
  onMarkPaid,
  onExtendDate,
  onDismiss,
}: SplitPaymentDueModalProps) {
  return (
    <FullScreen>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-my-black-base border-2 border-my-white-dark rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl text-my-white-light mb-4">
            Target Date Reached! 🎯
          </h2>
          
          <div className="text-my-white-dark mb-6">
            <p className="mb-2">
              Your save-up goal for{" "}
              <span className="text-my-green-light font-bold">{payment.name}</span>{" "}
              is due!
            </p>
            <p className="text-sm">
              Target: <span className="text-my-blue-light">${payment.amount.toFixed(2)}</span>
            </p>
            <p className="text-sm">
              Due: <span className="text-my-blue-light">
                {format(payment.dueDate.toDate(), "MMM do, yyyy")}
              </span>
            </p>
          </div>
          
          <p className="text-my-white-dark text-sm mb-6">
            Did you complete this payment?
          </p>
          
          <div className="flex flex-col gap-3">
            <Button color="green" onClick={() => onMarkPaid(payment)}>
              Yes, Mark as Paid
            </Button>
            <Button color="blue" onClick={() => onExtendDate(payment)}>
              Extend Date
            </Button>
            <button
              onClick={onDismiss}
              className="text-my-white-dark text-sm hover:text-my-white-light underline"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </FullScreen>
  );
}

