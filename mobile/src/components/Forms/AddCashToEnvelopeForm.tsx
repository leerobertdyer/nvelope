import { Modal, View } from "react-native";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { Envelope } from "../../types";
import Btn from "../Buttons/Btn";
import Loading from "../Loading";
import MoneyInput from "../Payments/MoneyInput";
import { MyText } from "../MyText";

interface iAddCashToEnvelopeForm {
  showLoading: boolean;
  loadingText: string;
  cashAmount: number;
  envelopeToEdit?: Envelope;
  setCashAmount: (n: number) => void;
  addCashToEnvelope: () => Promise<void>;
  setIsAddingCashToEnvelope: (b: boolean) => void;
}

export default function AddCashToEnvelopeForm({
  showLoading,
  loadingText,
  cashAmount,
  envelopeToEdit,
  setCashAmount,
  addCashToEnvelope,
  setIsAddingCashToEnvelope,
}: iAddCashToEnvelopeForm) {
  const { totalSpendingBudget } = useDatabase();

  return (
    <Modal>
      {showLoading && <Loading text={loadingText} />}
      <View className="bg-my-black-base text-my-white-dark w-full h-screen items-center justify-center">
        <View className="h-fit m-auto w-full gap-2">
          <MyText className="text-my-white-base mb-2 text-center">
            Remaining Budget: ${(totalSpendingBudget - cashAmount).toFixed(2)}
          </MyText>
          <MyText className="p-2 text-my-white-light mb-4 text-center">
            Add <MyText className="text-my-green-base">cash</MyText> to{" "}
            <MyText className="text-my-white-dark">
              "{envelopeToEdit?.name}"
            </MyText>
          </MyText>
          <MoneyInput
            id="add-cash-amount"
            label=""
            value={cashAmount}
            onChange={setCashAmount}
            placeholder="Amount"
          />
          <View className="w-full items-center gap-2">
            <Btn text="Add" onPress={addCashToEnvelope} color="green" />
            <Btn
              onPress={() => setIsAddingCashToEnvelope(false)}
              color="red"
              text="Go Back"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
