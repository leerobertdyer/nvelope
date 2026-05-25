import { Calendar, DateData } from "react-native-calendars";
import { Checkbox } from "expo-checkbox";
import { BIWEEKLY, MONTHLY, SPLIT, WEEKLY, YEARLY } from "../../constants";
import type { Interval, Payment } from "../../types";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import { editPayments } from "../../firebase/editData";
import {
  generateFreshPayment,
  isDateInCurrentPayPeriod,
  removeVirtualIdPortion,
} from "../../util";
import { format, addDays } from "date-fns";
// import { useToast } from "../../Context/ToastContext/useToast";
import PaymentTypeSelector, {
  type PaymentTypeOption,
} from "./PaymentTypeSelector";
import { ScrollView, Text, View } from "react-native";
import Input from "../Input";
import { useBudget } from "../../context/BudgetContext/useBudget";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import MoneyInput from "../Payments/MoneyInput";
import Btn from "../../../../mobile/src/components/Buttons/Btn";
import { Picker } from "@react-native-picker/picker";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
type User = FirebaseAuthTypes.User

interface IPaymentForm {
  paymentToEdit: Payment | null;
  user: User;
  handleUpdateBudget: (d: number) => Promise<void>;
  handleBack: () => void;
  /** Called when a payment is updated in place (e.g. Pay extra on a debt). Optional. */
  onPaymentUpdated?: (payment: Payment) => void;
}

export default function PaymentForm({
  paymentToEdit,
  user,
  handleUpdateBudget,
  handleBack,
}: IPaymentForm) {
  const { activeBudgetId } = useBudget();
  const { payDate, payPeriodInterval, payments, setPayments } = useDatabase();
  // const { showToast } = useToast();

  const [newPaymentDate, setNewPaymentDate] = useState<string>(
    paymentToEdit?.dueDate.toDate()
      ? format(paymentToEdit.dueDate.toDate(), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"), // Default to today's date string if it's a brand new payment
  );
  const [newPayment, setNewPayment] = useState<Payment>(
    paymentToEdit ?? generateFreshPayment(),
  );

  // For new payments, start with type selection
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<PaymentTypeOption | null>(
      paymentToEdit ? getPaymentTypeFromPayment(paymentToEdit) : null,
    );

  // Track if user wants to split bill across pay periods (for BILL type only)
  const [splitBillAcrossPayPeriods, setSplitBillAcrossPayPeriods] = useState(
    paymentToEdit?.interval === SPLIT && paymentToEdit?.recurring === true,
  );

  // Helper to determine PaymentTypeOption from existing Payment
  function getPaymentTypeFromPayment(p: Payment): PaymentTypeOption {
    if (p.type === "FUND") return "FUND";
    if (p.type === "DEBT") return "DEBT";
    // For BILL with SPLIT interval, it's still a Bill (just split across pay periods)
    return "BILL";
  }

  // Handle payment type selection
  function handleSelectPaymentType(type: PaymentTypeOption) {
    setSelectedPaymentType(type);
    setSplitBillAcrossPayPeriods(false); // Reset split toggle

    switch (type) {
      case "BILL":
        setNewPayment({
          ...newPayment,
          type: "BILL",
          interval: undefined, // Let user choose
          recurring: undefined,
          total: undefined,
        });
        break;
      case "DEBT":
        setNewPayment({
          ...newPayment,
          type: "DEBT",
          interval: undefined, // Let user choose
          recurring: undefined,
        });
        break;
      case "FUND":
        // Fund is a planned expense to save toward - uses SPLIT interval
        setNewPayment({
          ...newPayment,
          type: "FUND",
          interval: SPLIT,
          recurring: false,
          total: newPayment.amount,
        });
        break;
    }
  }

  // Handle toggling split for BILL type
  function handleToggleSplitBill(enabled: boolean) {
    setSplitBillAcrossPayPeriods(enabled);
    if (enabled) {
      setNewPayment({
        ...newPayment,
        interval: SPLIT,
        recurring: true,
      });
    } else {
      setNewPayment({
        ...newPayment,
        interval: undefined,
        recurring: undefined,
      });
    }
  }

  function resetForm() {
    setNewPayment(generateFreshPayment());
    setSelectedPaymentType(null);
    setSplitBillAcrossPayPeriods(false);
  }

  function handleSetNewInterval(i: Interval) {
    setNewPayment({
      ...newPayment,
      interval: i,
      recurring: undefined, // Clear recurring for non-SPLIT intervals
    });
  }
  function handleCalendarChange(d: DateData) {
    const dateString = d.dateString;
    setNewPaymentDate(dateString);

    // Split the string into numbers to avoid the UTC timezone shift bug
    const [year, month, day] = dateString.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    setNewPayment({
      ...newPayment,
      dueDate: Timestamp.fromDate(localDate),
    });
  }

  async function editPayment() {
    if (!user || !newPayment || !paymentToEdit) return;
    // If payment is in the interval and we change the price, we need to update the budget
    const diffAmount = newPayment.amount - paymentToEdit.amount;
    const originalPaymentToEditId = removeVirtualIdPortion(paymentToEdit);
    setPayments((prev) => {
      const updatedPayments = prev.map((p) => {
        const currentPaymentOriginalId = removeVirtualIdPortion(p);
        return currentPaymentOriginalId === originalPaymentToEditId
          ? { ...newPayment, id: originalPaymentToEditId }
          : p;
      });
      if (activeBudgetId) editPayments(updatedPayments, activeBudgetId);
      return updatedPayments;
    });
    if (paymentToEdit.isInInterval && !paymentToEdit.paid) {
      await handleUpdateBudget(diffAmount);
    }
    resetForm();
    // showToast("Payment updated");
    console.warn("TODO: Notifications");
  }

  async function addPayment() {
    if (!user || !newPayment) return;
    if (payments.some((p) => p.id === newPayment.id)) {
      // showToast("Payment name already exists", "error");
      console.warn("TODO: Notifications");
      return;
    }
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    if (!activeBudgetId) return;
    await editPayments(updatedPayments, activeBudgetId);
    if (
      payDate &&
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        newPayment.dueDate.toDate(),
      ) &&
      !newPayment.paid
    ) {
      await handleUpdateBudget(newPayment.amount * -1);
    }
    // showToast("Payment added");
    console.warn("TODO: Notifications");
    resetForm();
  }

  async function handleSavePayment() {
    if (paymentToEdit) await editPayment();
    else await addPayment();
    resetForm();
    handleBack();
  }

  function handleClickBack() {
    resetForm();
    handleBack();
  }

  // Get label for payment type
  function getPaymentTypeLabel(): string {
    switch (selectedPaymentType) {
      case "BILL":
        return splitBillAcrossPayPeriods ? "Bill (Split)" : "Bill";
      case "DEBT":
        return "Debt";
      case "FUND":
        return "Fund";
      default:
        return "";
    }
  }

  // Check if form is complete enough to save
  const canSave =
    selectedPaymentType &&
    newPayment.name &&
    newPayment.amount > 0 &&
    newPayment.interval &&
    newPaymentDate;

  // If type is FUND, minDate is tomorrow. Otherwise, there is no minimum date constraint.
  const minDateString =
    selectedPaymentType === "FUND"
      ? format(addDays(new Date(), 1), "yyyy-MM-dd")
      : undefined;

  return (
    <ScrollView className="h-screen absolute inset-0 z-9999 flex flex-col justify-center items-center m-auto overflow-y-scroll w-full overflow-x-hidden">
      <View className="flex flex-col gap-2 items-center md:h-[100vh] overflow-y-auto text-my-white-dark bg-my-green-dark w-full text-center rounded-md p-2 pb-8">
        <Text className="text-center w-full text-my-white-light p-2 text-3xl">
          {paymentToEdit ? "Edit Payment" : "Add Payment"}
        </Text>
        {/* Step 1: Payment Type Selection (for new payments only) */}
        {!selectedPaymentType && !paymentToEdit ? (
          <View className="w-full flex-1 min-h-0 flex flex-col justify-center px-2">
            <PaymentTypeSelector
              onSelect={handleSelectPaymentType}
              onBack={handleClickBack}
            />
          </View>
        ) : (
          <>
            {/* Show current type with option to change */}
            {!paymentToEdit && (
              <View className="flex items-center gap-2 mb-2">
                <Text className="text-sm text-my-white-light">
                  Type:{" "}
                  <Text className="font-bold">{getPaymentTypeLabel()}</Text>
                </Text>

                <Btn color="red" onPress={() => setSelectedPaymentType(null)}>
                  <View className="text-xs text-my-blue-base underline cursor-pointer">
                    Change
                  </View>
                </Btn>
              </View>
            )}

            {/* Payment Name */}
            <Input
              id="name"
              value={newPayment?.name.toLowerCase()}
              placeholder="Enter payment name"
              onChange={(e) =>
                setNewPayment({
                  ...newPayment,
                  name: e.toLowerCase(),
                })
              }
            />

            {/* Payment Amount */}
            {newPayment.name && (
              <View className="flex flex-col items-center w-full mb-4">
                <MoneyInput
                  id="amount"
                  label={
                    selectedPaymentType === "FUND" ? "Target Amount" : "Amount"
                  }
                  value={newPayment?.amount ?? 0}
                  onChange={(amount) => {
                    setNewPayment({
                      ...newPayment,
                      amount,
                      ...(selectedPaymentType === "FUND"
                        ? { total: amount }
                        : {}),
                    });
                  }}
                  placeholder={
                    selectedPaymentType === "FUND"
                      ? "Target amount to save"
                      : "Payment amount"
                  }
                />
                {selectedPaymentType === "FUND" && (
                  <Text className="text-xs text-my-white-light mt-1">
                    This amount will be split across your pay periods until the
                    target date
                  </Text>
                )}
                {splitBillAcrossPayPeriods && (
                  <Text className="text-xs text-my-white-light mt-1">
                    This monthly amount will be split across your pay periods
                  </Text>
                )}
              </View>
            )}

            {/* Split toggle for BILL type only */}
            {selectedPaymentType === "BILL" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <Text className="flex items-center gap-3 mb-4">
                  <Text className="text-sm cursor-pointer">
                    Split across pay periods (for rent, mortgage, etc.)
                  </Text>
                  <Checkbox
                    className="w-5 h-5 cursor-pointer accent-my-green-light"
                    value={splitBillAcrossPayPeriods}
                    onValueChange={(e) => handleToggleSplitBill(e)}
                  />
                </Text>
              )}

            {/* Due/Target Date */}
            {newPayment.name && newPayment.amount > 0 && (
              <View className="flex flex-col items-center w-full">
                <Text>
                  {selectedPaymentType === "FUND"
                    ? "Target Date (when you need the money)"
                    : "Due Date"}
                </Text>
                <View className="text-black rounded-md overflow-hidden border-2 border-my-white-dark text-center bg-my-white-light p-2">
                  <Calendar
                    onDayPress={handleCalendarChange}
                    date={newPaymentDate}
                    className="cursor-pointer-calendar"
                    minDate={minDateString}
                  />
                </View>
              </View>
            )}

            {/* Total Owed (for DEBT type only) */}
            {selectedPaymentType === "DEBT" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <div className="flex flex-col items-center w-full mt-4">
                  <MoneyInput
                    id="total"
                    label="Total Owed"
                    value={newPayment?.total ?? 0}
                    onChange={(total) =>
                      setNewPayment({
                        ...newPayment,
                        total,
                      })
                    }
                    placeholder="Total remaining balance"
                  />
                  <p className="text-xs text-my-blue-dark mt-1">
                    Track how much you still owe
                  </p>
                </div>
              )}

            {/* Interest rate (optional, for DEBT type only) */}
            {selectedPaymentType === "DEBT" &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <View className="flex flex-col items-center w-full mt-4">
                  <Text>Interest rate (%) – optional</Text>
                  <Input
                    id="interestRate"
                    numeric
                    // className="w-[80%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                    value={newPayment?.interestRate?.toString() ?? ""}
                    onChange={(e) => {
                      const val = e;
                      setNewPayment({
                        ...newPayment,
                        interestRate: val === "" ? undefined : Number(val),
                      });
                    }}
                    placeholder="e.g. 5.5"
                  />
                </View>
              )}

            {/* Interval selector for BILL (non-split) and DEBT */}
            {((selectedPaymentType === "BILL" && !splitBillAcrossPayPeriods) ||
              selectedPaymentType === "DEBT") &&
              newPayment.name &&
              newPayment.amount > 0 && (
                <View className="flex flex-col items-center w-full mt-4">
                  <Text>Payment Frequency</Text>
                  <Picker
                    selectedValue={newPayment.interval || ""}
                    onValueChange={(e) =>
                      handleSetNewInterval(e.toUpperCase() as Interval)
                    }
                    className="w-full max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark"
                  >
                    <Picker.Item
                      value=""
                      enabled={false}
                      label="-- Select Frequency --"
                    />
                    <Picker.Item value={MONTHLY} label="Monthly" />
                    <Picker.Item value={WEEKLY} label="Weekly" />
                    <Picker.Item value={BIWEEKLY} label="Bi-Weekly" />
                    <Picker.Item value={YEARLY} label="Yearly" />
                  </Picker>
                </View>
              )}
          </>
        )}
        {/* Save/Back buttons - show when we have enough info */}
        {canSave ? (
          <View className="text-my-black-base pb-8 w-full mt-4">
            <View className="text-center mb-4 p-3 bg-my-white-light rounded-md mx-4">
              <Text className="text-my-green-dark font-bold">
                {newPayment?.name}
              </Text>{" "}
              -{" "}
              <Text className="text-my-red-dark">
                ${newPayment?.amount.toFixed(2)}
              </Text>
              <View className="text-sm mt-1">
                {splitBillAcrossPayPeriods ? (
                  <>Monthly amount split across your pay periods</>
                ) : selectedPaymentType === "FUND" ? (
                  <>
                    Planned expense due{" "}
                    <Text className="text-my-blue-dark">
                      {format(newPayment.dueDate.toDate(), "MMM do, yyyy")}
                    </Text>
                  </>
                ) : (
                  <>
                    Due {newPayment.interval?.toLowerCase()} on the{" "}
                    <Text className="text-my-blue-dark">
                      {format(newPayment.dueDate.toDate(), "do")}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View className="flex flex-col gap-4 items-center justify-center w-full">
              <Btn color="gold" onPress={handleSavePayment}>
                Save
              </Btn>
              <Btn color="red" onPress={() => handleClickBack()}>
                Cancel
              </Btn>
            </View>
          </View>
        ) : selectedPaymentType ? (
          <View className="mt-4 w-full flex justify-center items-center">
            <Btn color="red" onPress={() => handleClickBack()}>
              Cancel
            </Btn>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
