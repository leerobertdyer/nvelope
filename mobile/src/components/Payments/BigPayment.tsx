import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import { useState } from "react";
import { format } from "date-fns";
import { Payment } from "../../types";
import { useAuth } from "../../context/AuthContext/useAuth";
import { useBudget } from "../../context/BudgetContext/useBudget";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { deriveIsPaid, removeVirtualIdPortion } from "../../util/util";
import { editPayments } from "../../firebase/editData";
import PaymentForm from "../Forms/PaymentForm";
import Btn from "../Buttons/Btn";
import { View } from "react-native";
import MoneyInput from "./MoneyInput";
import { MyText } from "../MyText";

interface IProps {
  handleBack: () => void;
  paymentToEdit: Payment | null;
  resetState: () => void;
  handleUpdateBudget: (n: number) => Promise<void>;
  handleUpdatePaid: (payment: Payment) => Promise<Payment | undefined>;
  handleDeleteBill: (p: Payment) => void;
  onPaymentUpdated?: (payment: Payment) => void;
}

export default function BigPayment({
  handleBack,
  paymentToEdit,
  handleUpdateBudget,
  handleUpdatePaid,
  handleDeleteBill,
  onPaymentUpdated,
}: IProps) {
  const [showForm, setShowForm] = useState(false);
  const [p, setP] = useState<Payment | null>(paymentToEdit);
  const [showExtraPaymentForm, setShowExtraPaymentForm] = useState(false);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState(0);
  const [extraPaymentError, setExtraPaymentError] = useState<string | null>(
    null,
  );
  const { user } = useAuth();
  const { activeBudgetId } = useBudget();
  const { payments, setPayments } = useDatabase();
  async function updatePaid() {
    if (!p) return;
    setP((prev) => prev && { ...prev, paid: !deriveIsPaid(prev) });
    const updated = await handleUpdatePaid(p);
    if (updated) setP(updated);
  }

  function handlePaymentUpdated(updated: Payment) {
    setP(updated);
    onPaymentUpdated?.(updated);
  }

  function applyExtraToDebt(extra: number) {
    if (!user || !p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    const amount = Math.min(extra, currentTotal);
    const newTotal = Math.max(0, currentTotal - amount);
    const originalId = removeVirtualIdPortion(p);
    const updatedPayment: Payment = { ...p, id: originalId, total: newTotal };
    const updatedPayments = payments.map((pay) =>
      removeVirtualIdPortion(pay) === originalId ? updatedPayment : pay,
    );
    setPayments(updatedPayments);
    if (activeBudgetId) editPayments(updatedPayments, activeBudgetId);
    setP(updatedPayment);
    onPaymentUpdated?.(updatedPayment);
  }

  async function handlePayExtra() {
    if (!p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    if (extraPaymentAmount <= 0) {
      setExtraPaymentError("Enter a positive amount");
      return;
    }
    if (extraPaymentAmount > currentTotal) {
      setExtraPaymentError(`Remaining balance is $${currentTotal.toFixed(2)}`);
      return;
    }
    setExtraPaymentError(null);
    applyExtraToDebt(extraPaymentAmount);
    setExtraPaymentAmount(0);
    setShowExtraPaymentForm(false);
  }

  function handlePayAll() {
    if (!p || p.type !== "DEBT") return;
    const currentTotal = p.total ?? 0;
    if (currentTotal <= 0) return;
    applyExtraToDebt(currentTotal);
    setShowExtraPaymentForm(false);
    setExtraPaymentAmount(0);
    setExtraPaymentError(null);
    handleBack();
  }

  if (showForm && user)
    return (
      <PaymentForm
        paymentToEdit={p}
        user={user}
        handleBack={handleBack}
        handleUpdateBudget={handleUpdateBudget}
        onPaymentUpdated={handlePaymentUpdated}
      />
    );
  if (!p) return <p>Error: Missing Payment To Edit</p>;
  return (
    <View className="pt-[3rem] bg-my-white-light w-full overflow-y-auto">
      <View className="w-full flex-col items-center justify-start">
        <View className="flex-col justify-center items-start p-2 w-[17rem] text-my-black-light rounded-md mb-4">
          <MyText className="text-lg text-my-white-dark mb-4 bg-my-black-light text-center rounded-md w-full">
            {p.name}
          </MyText>
          <View className="items-center w-full">
            <View className="w-full flex-row justify-around">
              <MyText>Type: </MyText>
              <MyText
                className={`${p.type === "BILL" ? "text-my-red-dark" : p.type === "FUND" ? "text-my-green-dark" : "text-my-blue-dark"}`}
              >
                {p.type}
              </MyText>
            </View>
            <View className="w-full flex-row justify-around">
              <MyText>{p.type === "FUND" ? "Per Period:" : "Amount:"} </MyText>
              <MyText className="text-my-green-dark">
                ${Number(p.amount).toFixed(2)}
              </MyText>
            </View>
            <View className="w-full flex-row justify-around">
              <MyText>{p.type === "FUND" ? "Target Date:" : "Due:"} </MyText>
              <MyText className="text-my-green-dark">
                {format(
                  p.dueDate.toDate(),
                  p.type === "FUND" ? "MMM do, yyyy" : "do",
                )}
              </MyText>
            </View>
            {p.type === "DEBT" && (
              <View className="w-full flex-row justify-around">
                <MyText>Remaining Due: </MyText>
                <MyText className="text-my-green-dark">
                  ${Number(p.total).toFixed(2)}
                </MyText>
              </View>
            )}
            {p.type === "FUND" && (
              <View className="w-full flex-row justify-around">
                <MyText>Target Amount: </MyText>
                <MyText className="text-my-green-dark">
                  ${Number(p.total).toFixed(2)}
                </MyText>
              </View>
            )}
          </View>
        </View>
        <View className="h-2" />
        <View className="flex-col justify-center items-center gap-2 w-full">
          <Btn color="green" onPress={() => updatePaid()}>
            <View className="flex-row items-center justify-center gap-8">
              <View
                className={`justify-center items-center border-2 rounded-md bg-my-white-dark text-my-green-dark border-my-black-dark w-[3rem] h-[3rem]`}
              >
                <FontAwesome6 name="sack-dollar" color="#076346" size={24} />
              </View>
              <MyText className="text-xs w-[50%] text-my-white-dark">
                Mark {!deriveIsPaid(p) ? "Paid" : "Not Paid"}
              </MyText>
            </View>
          </Btn>
          <Btn
            color="gold"
            onPress={() => {
              setShowForm(true);
            }}
          >
            <View className="flex-row items-center justify-center gap-8">
              <View className="justify-center items-center border-2 rounded-md bg-my-white-base text-black border-my-black-dark w-[3rem] h-[3rem]">
                <EvilIcons name="pencil" color="black" size={33} />
              </View>
              <MyText className="text-xs w-[50%]">Manually Edit Payment</MyText>
            </View>
          </Btn>
          {p.type === "DEBT" && (p.total ?? 0) > 0 && (
            <Btn
              color="blue"
              onPress={() => {
                setShowExtraPaymentForm(true);
                setExtraPaymentError(null);
                setExtraPaymentAmount(0);
              }}
            >
              <View className="flex-row items-center justify-center gap-8">
                <View className="justify-center items-center border-2 rounded-md bg-my-green-dark text-white border-my-black-dark w-[3rem] h-[3rem]">
                  <Ionicons name="add-circle" size={27} color="white" />
                </View>
                <MyText className="text-xs w-[50%]">Extra Payment</MyText>
              </View>
            </Btn>
          )}
          <Btn
            color="red"
            onPress={() => {
              handleDeleteBill(p);
            }}
          >
            <View className="flex-row items-center justify-center gap-8">
              <View className="w-[3rem] h-[3rem] items-center justify-center bg-my-red-base border-2 border-my-black-dark rounded-md">
                <FontAwesome name="trash" color="white" size={25} />
              </View>
              <MyText className="text-xs w-[50%] text-my-white-light">
                Delete Payment
              </MyText>
            </View>
          </Btn>
          <View className="mt-8" />
          <Btn onPress={handleBack} color="red" text="Go Back" />
        </View>
        {showExtraPaymentForm && p?.type === "DEBT" && (p.total ?? 0) > 0 && (
          <View>
            <View className="items-center justify-center gap-2 w-full">
              <MyText className="text-sm font-medium mb-1">
                Extra Payment
              </MyText>
              <MyText className="text-xs text-my-white-dark mb-2">
                Remaining: ${(p.total ?? 0).toFixed(2)}
              </MyText>
              <Btn color="gold" onPress={handlePayAll}>
                Pay All
              </Btn>
              <MoneyInput
                id="extraPaymentAmount"
                label=""
                value={extraPaymentAmount}
                onChange={(d) => {
                  setExtraPaymentAmount(d);
                  setExtraPaymentError(null);
                }}
                placeholder="Amount"
              />
              <Btn color="green" onPress={handlePayExtra}>
                Apply
              </Btn>
              {extraPaymentError && (
                <MyText className="text-xs text-my-red-light mb-2">
                  {extraPaymentError}
                </MyText>
              )}
              <Btn
                color="red"
                onPress={() => {
                  setShowExtraPaymentForm(false);
                  setExtraPaymentAmount(0);
                  setExtraPaymentError(null);
                }}
              >
                Cancel
              </Btn>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
