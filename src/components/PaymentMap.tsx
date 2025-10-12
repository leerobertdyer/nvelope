import {
  IoIosCheckmarkCircle,
  IoIosCheckmarkCircleOutline,
  IoIosClipboard,
  IoIosTrash,
} from "react-icons/io";
import type { Payment } from "../types";
import { format, isAfter, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { useAuth } from "../Context/AuthContext/useAuth";
import ShowAndHide from "./ShowAndHide";
import {
  getCurrentIntervalDateRange,
  getVirtualPaymentsForPeriod,
  isDateInCurrentPayPeriod,
} from "../util";

interface PaymentMapProps {
  handleUpdatePaid: (payment: Payment) => void;
  handleEditBill: (payment: Payment) => void;
  handleDeleteBill: (payment: Payment) => void;
}
export default function PaymentMap({
  handleUpdatePaid,
  handleEditBill,
  handleDeleteBill,
}: PaymentMapProps) {
  const { payments, payPeriodInterval, payDate } = useDatabase();
  const { user } = useAuth();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { start: periodStart, end: periodEnd } = useMemo(
    () => getCurrentIntervalDateRange(payPeriodInterval, payDate!),
    [payPeriodInterval, payDate]
  );

  const [pastPayments, setPastPayments] = useState<Payment[]>([]);
  const [currentPayments, setCurrentPayments] = useState<Payment[]>([]);
  const [futurePayments, setFuturePayments] = useState<Payment[]>([]);

  const [showPast, setShowPast] = useState(false);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showFuture, setShowFuture] = useState(false);

  useEffect(() => {
    if (!payments || !payDate) return;
    if (!user) return;
    const virtualPayments = getVirtualPaymentsForPeriod(
      payments,
      payPeriodInterval
    );
    setPastPayments(
      virtualPayments.filter((p) => p.dueDate.toDate() < periodStart)
    );
    setCurrentPayments(
      virtualPayments.filter((p) =>
        isDateInCurrentPayPeriod(
          payPeriodInterval,
          payDate.toDate(),
          p.dueDate.toDate()
        )
      )
    );
    setFuturePayments(
      virtualPayments.filter((p) => isAfter(p.dueDate.toDate(), periodEnd))
    );
  }, [
    payments,
    periodEnd,
    payDate,
    user,
    payPeriodInterval,
    today,
    periodStart,
  ]);

  function RenderPayments({ p }: { p: Payment }) {
    return (
      <div
        key={p.id}
        className={`grid grid-cols-8 py-2 border-2 text-center
          ${
            p.paid
              ? "bg-[#969696] border-none text-my-black-dark"
              : p.type === "BILL"
              ? "border-my-red-light bg-my-black-base text-my-white-dark"
              : "border-my-blue-light bg-my-black-base text-my-white-dark"
          } `}
      >
        <p className={`flex items-center justify-center rounded-sm text-my-black-dark p-2 text-xs w-[1rem] m-auto ${p.paid ? "bg-[#969696]" : "bg-my-white-base"}`}>
          {format(p.dueDate.toDate(), "do")}
        </p>
        <p className="flex items-center justify-center text-xs col-span-3">
          {p.name}
        </p>
        {p.total && !p.paid ? (
          <p className="flex items-center justify-center col-span-2 gap-[2px]">
            <span className="text-sm text-my-blue-light">${p.amount}</span>/
            <span className="text-sm text-my-blue-dark">
              {Math.ceil(p.total)}
            </span>
          </p>
        ) : (
          <p className="text-sm flex items-center justify-center col-span-2">
            ${p.amount.toFixed(2)}
          </p>
        )}

        <div className="flex gap-[2px] items-start justify-center mr-2 col-span-2">
          <IoIosClipboard
            className="text-my-red-light bg-my-white-dark cursor-pointer hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark"
            size={20}
            onClick={() => handleEditBill(p)}
          />
          <IoIosTrash
            className="text-my-white-dark bg-my-red-dark cursor-pointer hover:text-my-red-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
            size={20}
            onClick={() => handleDeleteBill(p)}
          />
          {p.paid ? (
            <IoIosCheckmarkCircle
              onClick={() => handleUpdatePaid(p)}
              className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={20}
            />
          ) : (
            <IoIosCheckmarkCircleOutline
              onClick={() => handleUpdatePaid(p)}
              className="text-my-green-dark bg-my-white-dark cursor-pointer hover:text-my-green-dark hover:bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={20}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-fit max-w-[60rem] w-[95vw] border-2 border-my-white-light rounded-md mb-[5rem] overflow-auto">
        {showPast ? (
          <div className="p-2 bg-my-black-light">
            <ShowAndHide
              onClick={() => setShowPast(false)}
              border={false}
              up={true}
              label="Hide Past Payments"
              additionalDetails={`$${Math.ceil(
                pastPayments.reduce((acc, p) => p.amount + acc, 0)
              )}`}
            />
            {pastPayments.map((p) => (
              <RenderPayments p={p} />
            ))}
            <hr className="w-full h-[.25rem] bg-my-white-light text-my-white-light" />
          </div>
        ) : (
          <>
            <ShowAndHide
              onClick={() => setShowPast(true)}
              up={false}
              label="Show Past Payments"
              additionalDetails={`$${Math.ceil(
                pastPayments.reduce((acc, p) => p.amount + acc, 0)
              )}`}
            />
            <hr className="w-full h-[.25rem] bg-my-white-light text-my-white-light" />
          </>
        )}
        {showCurrent ? (
          <>
            <ShowAndHide
              onClick={() => setShowCurrent(false)}
              up={true}
              border={false}
              label="Hide Current Payments"
              additionalDetails={`$${Math.ceil(
                currentPayments.reduce((acc, p) => p.amount + acc, 0)
              )}`}
            />
            {currentPayments.map((p) => (
              <RenderPayments p={p} />
            ))}
            <hr className="w-full h-[.25rem] bg-my-white-light text-my-white-light" />
          </>
        ) : (
          <>
            <ShowAndHide
              onClick={() => setShowCurrent(true)}
              up={false}
              label="Show Current Payments"
              additionalDetails={`$${Math.ceil(
                currentPayments.reduce((acc, p) => p.amount + acc, 0)
              )}`}
            />
            <hr className="w-full h-[.25rem] bg-my-white-light text-my-white-light" />
          </>
        )}
        {showFuture ? (
          <div className="p-2 bg-my-black-light">
            <ShowAndHide
              onClick={() => setShowFuture(false)}
              border={false}
              up={true}
              label="Hide Future Payments"
              additionalDetails={`$${Math.ceil(
                futurePayments.reduce((acc, p) => p.amount + acc, 0)
              )}`}
            />
            {futurePayments.map((p) => (
              <RenderPayments p={p} />
            ))}
            <hr className="w-full h-[.25rem] bg-my-white-light text-my-white-light" />
          </div>
        ) : (
          <ShowAndHide
            onClick={() => setShowFuture(true)}
            up={false}
            label="Show Future Payments"
            additionalDetails={`$${Math.ceil(
              futurePayments.reduce((acc, p) => p.amount + acc, 0)
            )}`}
          />
        )}
      </div>
    </>
  );
}
