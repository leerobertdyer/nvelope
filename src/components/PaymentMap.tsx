import {
  IoIosCheckmarkCircle,
  IoIosCheckmarkCircleOutline,
  IoIosTrash,
} from "react-icons/io";
import type { Payment } from "../types";
import { format, isAfter, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { useAuth } from "../Context/AuthContext/useAuth";
import {
  getCurrentIntervalDateRange,
  getVirtualPaymentsForPeriod,
  isDateInCurrentPayPeriod,
} from "../util";
import { IoPencil } from "react-icons/io5";
import ShowHideButton from "./ShowHideButton";

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
  const [showFuture, setShowFuture] = useState(true);

  useEffect(() => {
    if (!payments || !payDate) return;
    if (!user) return;
    const virtualPayments = getVirtualPaymentsForPeriod(
      payments,
      payPeriodInterval,
      payDate
    );
    const pastPayments = virtualPayments.filter(
      (p) => p.dueDate.toDate() < periodStart
    );
    const currentPayments = virtualPayments.filter((p) =>
      isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate.toDate(),
        p.dueDate.toDate()
      )
    );
    const futurePayments = virtualPayments.filter((p) =>
      isAfter(p.dueDate.toDate(), periodEnd)
    );
    console.log(
      "pastPayments",
      pastPayments.map((p) => {
        return { ...p, dueDate: p.dueDate.toDate() };
      })
    );
    console.log(
      "currentPayments",
      currentPayments.map((p) => {
        return { ...p, dueDate: p.dueDate.toDate() };
      })
    );
    console.log(
      "futurePayments",
      futurePayments.map((p) => {
        return { ...p, dueDate: p.dueDate.toDate() };
      })
    );
    setPastPayments(pastPayments);
    setCurrentPayments(currentPayments);
    setFuturePayments(futurePayments);
  }, [
    payments,
    periodEnd,
    payDate,
    user,
    payPeriodInterval,
    today,
    periodStart,
  ]);

  function RenderPayment({ p, time }: { p: Payment; time: string }) {
    let t;
    if (time === "PAST" || time === "FUTURE")
      t = "bg-my-black-light text-white";
    else if (p.type === "BILL") t = "bg-my-black-base text-my-red-light";
    else t = "bg-my-black-base text-my-white-dark";

    return (
      <div
        key={p.id}
        className={`grid grid-cols-8 py-2 text-center border-y-1 border-my-black-dark rounded-xs w-full
          ${
            p.paid
              ? "bg-my-black-light text-white"
              : p.type === "DEBT"
              ? "text-my-blue-light bg-my-black-base"
              : t
          } `}
      >
        <p
          className={`flex items-center justify-center text-xs w-[1rem] m-auto col-span-1 text-my-white-dark`}
        >
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

        <div className="flex gap-[2px] items-start justify-end mr-2 col-span-2">
          <IoPencil
            className="text-my-black-base bg-my-white-dark cursor-pointer hover:text-my-white-dark hover:bg-my-red-light rounded-lg p-[2px] border-2 border-my-black-dark"
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

  const pastPaymentsTotal = `$${Math.ceil(
    pastPayments.reduce((acc, p) => p.amount + acc, 0)
  ).toFixed(2)}`;

  const currentPaymentsTotal = `$${Math.ceil(
    currentPayments.reduce((acc, p) => p.amount + acc, 0)
  ).toFixed(2)}`;

  const futurePaymentsTotal = `$${Math.ceil(
    futurePayments.reduce((acc, p) => p.amount + acc, 0)
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
      <div className="relative grid grid-cols-3 py-2 text-center rounded-xs border-[1px] border-my-white-light bg-my-black-dark text-my-white-base">
        <div className="absolute ml-2 w-fit h-full">
          <ShowHideButton isShown={isShown} onClick={setter} />
        </div>
        <p className="col-span-2">{name}</p>
        <p className="col-span-1 text-my-blue-light">{total}</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-fit max-w-[60rem] w-[95vw] border-2 border-my-white-light rounded-md mb-[5rem] overflow-auto ">
        <PaymentBox
          isShown={showPast}
          setter={() => setShowPast(!showPast)}
          name="Past Payments"
          total={pastPaymentsTotal}
        />
        {showPast && (
          <div className=" bg-my-black-dark">
            {pastPayments.map((p) => (
              <RenderPayment p={p} time="PAST" />
            ))}
          </div>
        )}
        <PaymentBox
          name="Current Payments"
          total={currentPaymentsTotal}
          isShown={showCurrent}
          setter={() => setShowCurrent(!showCurrent)}
        />
        {showCurrent && (
          <div className=" bg-my-black-dark">
            {currentPayments.map((p) => (
              <RenderPayment p={p} time="PRESENT" />
            ))}
          </div>
        )}
        <PaymentBox
          name="Future Payments"
          total={futurePaymentsTotal}
          isShown={showFuture}
          setter={() => setShowFuture(!showFuture)}
        />
        {showFuture && (
          <div className=" bg-my-black-dark">
            {futurePayments.map((p) => (
              <RenderPayment p={p} time="FUTURE" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
