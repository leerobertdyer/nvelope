import type { Payment } from "../../types";
import { format } from "date-fns";
import { useState } from "react";
import { getEffectivePaymentAmount } from "../../util";
import ShowHideButton from "../Buttons/ShowHideButton";
import {
  IoIosCheckmarkCircle,
  IoIosCheckmarkCircleOutline,
} from "react-icons/io";

interface PaymentMapProps {
  handleUpdatePaid: (payment: Payment) => void;
  handleEditBill: (payment: Payment) => void;
  paymentsThisPeriod: Payment[];
}
export default function PaymentMap({
  handleEditBill,
  handleUpdatePaid,
  paymentsThisPeriod,
}: PaymentMapProps) {
  const [showCurrent, setShowCurrent] = useState(true);

  function RenderPayment({ p, time }: { p: Payment; time: string }) {
    // Check if this is a SPLIT payment (ID contains "-SPLIT-")
    const isSplitPayment = p.id.includes("-SPLIT-");
    const isLastPayment =
      p.type === "DEBT" && p.total != null && p.total <= p.amount;

    let t;
    if (time === "PAST" || time === "FUTURE")
      t = "bg-my-black-light text-white";
    else if (p.type === "FUND" || isSplitPayment)
      t =
        "bg-my-black-base text-my-green-light border-l-4 border-l-my-green-dark";
    else if (p.type === "BILL") t = "bg-my-black-base text-my-red-light";
    else t = "bg-my-black-base text-my-white-dark";

    return (
      <div
        key={p.id}
        onClick={() => handleEditBill(p)}
        className={`grid grid-cols-9 py-2 text-center border-y-1 border-my-black-dark rounded-xs w-full cursor-pointer 
          ${isLastPayment ? "border-2 border-my-white-dark" : ""}
          ${
            p.paid
              ? "bg-my-black-light text-white"
              : p.type === "DEBT"
                ? "text-my-blue-light bg-my-black-base"
                : p.type === "FUND"
                  ? "text-my-green-light bg-my-black-base"
                  : t
          } `}
      >
        <div
          className="flex items-center justify-start col-span-1 ml-[.75rem] min-h-[2rem] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdatePaid(p);
          }}
          role="button"
          aria-label={p.paid ? "Mark as not paid" : "Mark as paid"}
        >
          {p.paid ? (
            <IoIosCheckmarkCircle
              className="text-my-green-dark bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={16}
            />
          ) : (
            <IoIosCheckmarkCircleOutline
              className="text-my-green-dark bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={16}
            />
          )}
        </div>
        <p
          className={`flex items-center justify-start text-xs col-span-1 text-my-white-dark`}
        >
          {format(p.dueDate.toDate(), "do")}
        </p>
        <p className="flex items-center justify-start text-xs col-span-5 gap-1">
          {p.name}
          {isSplitPayment && (
            <span className="text-[10px] bg-my-green-dark text-my-white-light px-1 rounded">
              SPLIT
            </span>
          )}
        </p>
        {p.total != null && !p.paid ? (
          <p className="flex items-center justify-end col-span-2 gap-[2px] mr-[1rem] md:mr-[2.8rem]">
            <span className="text-sm text-my-blue-light">
              ${getEffectivePaymentAmount(p).toFixed(2)}
            </span>
            /
            <span className="text-sm text-my-blue-dark">
              {Math.ceil(p.total)}
            </span>
          </p>
        ) : (
          <p className="text-sm flex items-center justify-end col-span-2 mr-[1rem] md:mr-[2.8rem]">
            ${getEffectivePaymentAmount(p).toFixed(2)}
          </p>
        )}
      </div>
    );
  }

  const currentPaymentsTotal = `$${Math.ceil(
    paymentsThisPeriod.reduce((acc, p) => getEffectivePaymentAmount(p) + acc, 0),
  ).toFixed(2)}`;

  function PaymentBox({
    name,
    total,
    isShown,
    setter,
  }: {
    isShown: boolean;
    setter: () => void;
    total: string;
    name: string;
  }) {
    return (
      <div className="relative grid grid-cols-4 py-2 text-center rounded-xs  bg-my-black-dark text-my-white-base">
        <div className="absolute ml-2 w-fit h-full">
          <ShowHideButton isShown={isShown} onClick={setter} />
        </div>
        <p className="col-span-3">{name}</p>
        <p className="col-span-1 text-my-blue-light">{total}</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-fit w-screen max-w-[40.25rem] overflow-auto ">
        <PaymentBox
          name="Current Payments"
          total={currentPaymentsTotal}
          isShown={showCurrent}
          setter={() => setShowCurrent(!showCurrent)}
        />
        {showCurrent && (
          <div className=" bg-my-black-dark">
            {paymentsThisPeriod.map((p) => (
              <RenderPayment key={p.id} p={p} time="PRESENT" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
