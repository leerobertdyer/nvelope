import { useState } from "react";
import { editTotalSpendingBudget } from "../../firebase/editData";
import { useBudget } from "../../context/BudgetContext/useBudget";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import MoneyInput from "../Payments/MoneyInput";
import Btn from "../Buttons/Btn";
import { View } from "react-native";

interface IProps {
  handleBack: () => void;
}

export default function EditSpendingBudget({ handleBack }: IProps) {
  const [cashAmount, setCashAmount] = useState(0);
  const { activeBudgetId } = useBudget();
  const { setTotalSpendingBudget } = useDatabase();

  function resetState() {
    setCashAmount(0);
    handleBack();
  }

  async function manuallySetBudgetInDB() {
    if (cashAmount <= 0 || !activeBudgetId) return;
    await editTotalSpendingBudget(cashAmount, activeBudgetId);
    setTotalSpendingBudget(cashAmount);
    handleBack();
  }

  //onSave={manuallySetBudgetInDB} onClose={resetState}
  return (
      <View className="flex flex-col items-center justify-center gap-2 max-w-[20rem] m-auto">
        <MoneyInput
          label="Manually Adjust Your Remaining Budget"
          id="newBudgetAmount"
          value={cashAmount}
          onChange={setCashAmount}
          placeholder="Amount"
        />
        <Btn color="gold" onPress={manuallySetBudgetInDB} />
        <Btn color="red" onPress={resetState} />
      </View>

  );
}
