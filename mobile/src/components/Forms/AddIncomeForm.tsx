import Loading from "../Loading";
import TextInput from "../Input";
import { View } from "react-native";
import MoneyInput from "../Payments/MoneyInput";
import Btn from "../Buttons/Btn";
import { MyText } from "../MyText";

interface IAddIncomeForm {
  showLoading: boolean;
  loadingText: string;
  setIsAddingCash: (b: boolean) => void;
  addCashToDb: () => Promise<void>;
  cashAmount: number;
  setCashAmount: (n: number) => void;
  cashName: string;
  setCashName: (s: string) => void;
}
export default function AddIncomeForm({
  showLoading,
  loadingText,
  setIsAddingCash,
  addCashToDb,
  cashAmount,
  setCashAmount,
  cashName,
  setCashName,
}: IAddIncomeForm) {
  async function handleSave() {
    await addCashToDb();
    setCashName("");
    setCashAmount(0);
    setIsAddingCash(false);
  }

  function handleBack() {
    setCashName("");
    setCashAmount(0);
    setIsAddingCash(false);
  }

  return (
    <>
      {showLoading && <Loading text={loadingText} />}
      <View>
        <MyText className="text-center w-full text-my-white-light p-2 text-3xl mb-4">
          Add Income
        </MyText>
        <View className="bg-my-green-dark rounded-md text-my-white-light w-[90vw] md:w-[30rem] m-auto p-4 pb-6 flex flex-col gap-4 items-center">
          <View className="w-full max-w-[20rem] m-auto h-fit flex flex-col items-center justify-center">
            <MyText className="text-my-white-dark text-lg py-2">
              Add Cash
            </MyText>
            <MoneyInput
              label=""
              id="newCashAmount"
              placeholder="Amount to add"
              value={cashAmount}
              onChange={setCashAmount}
            />
            <TextInput
              id="newCashName"
              label=""
              value={cashName}
              onChange={(e) => setCashName(e)}
              placeholder="Income Source"
            />
          </View>
          {cashAmount > 0 && cashName.length > 0 && (
            <Btn text="Save" onPress={handleSave} color="green" />
          )}
          <Btn text="Back" onPress={handleBack} color="red" />
        </View>
      </View>
    </>
  );
}
