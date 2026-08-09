import { useState } from "react";
import type { NvelopesTransaction } from "../../types";
import { format } from "date-fns";
import BigTransaction from "./BigTransaction";

export default function TinyTransaction({ t }: { t: NvelopesTransaction }) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  if (showTransactionModal)
    return (
      <BigTransaction t={t} onClose={() => setShowTransactionModal(false)} />
    );

  return (
    <button
      type="button"
      onClick={() => setShowTransactionModal(true)}
      className="w-full border-b-2 border-my-black-dark cursor-pointer"
    >
      <div className="flex items-center justify-between px-2 w-full h-[3.5rem] bg-my-white-base rounded-sm gap-4">
        <div className="w-10 h-10 ml-4 rounded-md bg-my-white-light border border-my-black-light mr-4 overflow-hidden shrink-0">
          <div className="h-2 bg-my-red-base" />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold">
              {format(t.createdAt.toDate(), "M/d")}
            </p>
          </div>
        </div>
        <p className="flex-1 underline text-my-blue-dark truncate text-left">
          {t.description}
        </p>
      </div>
    </button>
  );
}
