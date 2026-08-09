import type { Envelope } from "../../types";
import MyIcon from "../MyIcon";

interface INvelopeActionBtns {
  onTake: (n: Envelope) => void;
  onAdd: (n: Envelope) => void;
  onEdit: (n: Envelope) => void;
  onDelete: (id: string) => void;
  n: Envelope;
}

export default function NvelopeActionBtns({
  n,
  onTake,
  onAdd,
  onEdit,
  onDelete,
}: INvelopeActionBtns) {
  const tileClass =
    "flex flex-col items-center pt-2 pb-1 border-2 border-my-black-dark rounded-lg h-[6rem] w-[6rem] cursor-pointer hover:scale-105 transition-transform";

  return (
    <div className="flex w-full justify-center gap-4 items-center">
      <div
        onClick={() => onTake(n)}
        className={`${tileClass} bg-[#9c6d00]`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="TAKE" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Take</p>
      </div>

      <div
        onClick={() => onAdd(n)}
        className={`${tileClass} bg-my-green-dark`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="CASH" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Add</p>
      </div>

      <div
        onClick={() => onEdit(n)}
        className={`${tileClass} bg-my-blue-dark`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="NVELOPE" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Edit</p>
      </div>

      <div
        onClick={() => onDelete(n.id)}
        className={`${tileClass} bg-my-red-dark`}
      >
        <div className="flex-1 flex items-center justify-center">
          <MyIcon type="DELETE" size={42} />
        </div>
        <p className="text-sm w-full text-center text-my-white-light">Delete</p>
      </div>
    </div>
  );
}
