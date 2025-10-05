import { useState } from "react";
import Button from "./Button";
import { editTotalSpendingBudget } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import Modal from "./Modal";

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
    <Modal>
        <p className="text-lg mb-4 text-my-red-dark">
          Manually Adjusts Your Remaining Budget
        </p>
        <input
          value={cashAmount}
          onChange={(e) => setCashAmount(e.target.value)}
          type="number"
          placeholder="Amount"
          className="max-w-[35rem] w-[80%] border-2 rounded-md p-2 bg-my-white-base text-my-green-dark mb-4 relative"
        />

        <div className="flex flex-col w-full gap-2 justify-center items-center">
          <Button onClick={manuallySetBudgetInDB} color="green">
            Save
          </Button>
          <Button onClick={resetState} color="red">
            Back
          </Button>
        </div>
    </Modal>
  );
}
