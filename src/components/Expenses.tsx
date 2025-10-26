import type { OneTimeAmount } from "../types";
import ShowHideButton from "./ShowHideButton";
import { useState } from "react";

export default function Expenses({ expenses }: { expenses: OneTimeAmount[] }) {
  const [showExpenses, setShowExpenses] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-screen max-w-[40rem] h-[2rem] grid grid-cols-4 divide-x-2 divide-my-black-dark border-2 border-my-black-dark bg-my-white-dark text-my-black-light font-bold">
        <div className="relative col-span-3 flex justify-center px-[1rem] items-center">
          <div className="absolute ml-[12px] w-full h-full">
            <ShowHideButton
              onClick={() => setShowExpenses(!showExpenses)}
              isShown={showExpenses}
            />
          </div>
          <p className="text-sm">Expense</p>
        </div>
        <div className="flex justify-center items-center col-span-1">
          <p className="text-sm">Amount</p>
        </div>
      </div>
      {showExpenses &&
        expenses.map((e) => (
          <div key={e.id}>
            <div className="w-screen max-w-[40rem] h-[2rem] grid grid-cols-4 divide-x-2 divide-my-black-dark border-2 border-my-black-dark bg-my-red-dark text-my-white-light font-bold">
              <div className="col-span-3 flex justify-center items-center">
                <p className="text-sm">{e.name}</p>
              </div>
              <div className="flex justify-center items-center col-span-1">
                <p className="text-sm">${Math.ceil(e.amount)}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
