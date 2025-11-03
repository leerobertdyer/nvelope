import { useState } from "react";
import { editTotalSpendingBudget } from "../../firebase/editData";
import { useAuth } from "../../Context/AuthContext/useAuth";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import FullScreen from "../Views/FullScreen";
import TextInput from "../TextInput";

interface IProps {
  handleBack: () => void;
}

export default function EditSpendingBudget({ handleBack }: IProps) {
  const [cashAmount, setCashAmount] = useState("");
  const { user } = useAuth();
  const { setTotalSpendingBudget } = useDatabase();

  function resetState() {
    setCashAmount("");
    handleBack();
  }

  async function manuallySetBudgetInDB() {
    if (!cashAmount || !user) return;
    await editTotalSpendingBudget(Number(cashAmount), user.uid);
    setTotalSpendingBudget(Number(cashAmount));
    handleBack();
  }

  return (
    <FullScreen
      showButtons
      onSave={manuallySetBudgetInDB}
      onClose={resetState}>
      <div className="flex flex-col items-center justify-center gap-2 max-w-[20rem] m-auto">
        <TextInput
          label="Manually Adjust Your Remaining Budget"
          id="newBudgetAmount"
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
          textOrNumber="number"
          placeholder="Amount" />
      </div>
    </FullScreen>
  );
}
