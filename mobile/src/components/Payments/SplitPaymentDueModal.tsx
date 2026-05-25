import { format } from "date-fns";
import Btn from "../Buttons/Btn";
import { Payment } from "../../types";
import { Text, View } from "react-native";

interface SplitPaymentDueModalProps {
  payment: Payment;
  onMarkPaid: (payment: Payment) => void;
  onExtendDate: (payment: Payment) => void;
  onDismiss: () => void;
}

/**
 * Modal shown when a Fund (planned expense) payment's target date has been reached.
 * User can mark it as paid, extend the date, or dismiss.
 */
export default function SplitPaymentDueModal({
  payment,
  onMarkPaid,
  onExtendDate,
  onDismiss,
}: SplitPaymentDueModalProps) {
  return (
    <View>
      <View className="flex flex-col items-center justify-center min-h-screen p-4">
        <View className="bg-my-black-base border-2 border-my-white-dark rounded-lg p-6 max-w-md w-full text-center">
          <Text className="text-xl text-my-white-light mb-4">
            Target Date Reached! 🎯
          </Text>

          <View className="text-my-white-dark mb-6">
            <Text className="mb-2">
              Your planned expense for{" "}
              <Text className="text-my-green-light font-bold">
                {payment.name}
              </Text>{" "}
              is due!
            </Text>
            <Text className="text-sm">
              Target:{" "}
              <Text className="text-my-blue-light">
                ${payment.amount.toFixed(2)}
              </Text>
            </Text>
            <Text className="text-sm">
              Due:{" "}
              <Text className="text-my-blue-light">
                {format(payment.dueDate.toDate(), "MMM do, yyyy")}
              </Text>
            </Text>
          </View>

          <Text className="text-my-white-dark text-sm mb-6">
            Did you complete this payment?
          </Text>

          <View className="flex flex-col gap-3">
            <Btn color="green" onPress={() => onMarkPaid(payment)}>
              Yes, Mark as Paid
            </Btn>
            <Btn color="blue" onPress={() => onExtendDate(payment)}>
              Extend Date
            </Btn>
            <View className="text-my-white-dark text-sm hover:text-my-white-light underline">
              <Btn color="Gold" onPress={onDismiss}>
                Remind me later
              </Btn>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
