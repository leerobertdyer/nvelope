import { useState } from "react";
import { editTotalSpendingBudget } from "../../firebase/editData";
import { useBudget } from "../../Context/BudgetContext/useBudget";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import FullScreen from "../../Views/FullScreen";
import MoneyInput from "../MoneyInput";

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

  return (
    <FullScreen
      showButtons
      onSave={manuallySetBudgetInDB}
      onClose={resetState}>
      <div className="flex flex-col items-center justify-center gap-2 max-w-[20rem] m-auto">
        <MoneyInput
          label="Manually Adjust Your Remaining Budget"
          id="newBudgetAmount"
          value={cashAmount}
          onChange={setCashAmount}
          placeholder="Amount"
        />
      </div>
    </FullScreen>
  );
}
