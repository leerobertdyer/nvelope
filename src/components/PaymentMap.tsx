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
import ShowHideButton from "./Buttons/ShowHideButton";

interface PaymentMapProps {
  handleUpdatePaid: (payment: Payment) => void;
  handleEditBill: (payment: Payment) => void;
  handleDeleteBill: (payment: Payment) => void;
}
export default function PaymentMap({
  handleEditBill,
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
        onClick={() => handleEditBill(p)}
        className={`grid grid-cols-8 py-2 text-center border-y-1 border-my-black-dark rounded-xs w-full cursor-pointer
          ${p.paid
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
        <p className="flex items-center justify-start text-xs col-span-4">
          {p.name}
        </p>
        {p.total && !p.paid ? (
          <p className="flex items-center justify-end col-span-3 gap-[2px] mr-2">
            <span className="text-sm text-my-blue-light">${p.amount}</span>/
            <span className="text-sm text-my-blue-dark">
              {Math.ceil(p.total)}
            </span>
          </p>
        ) : (
          <p className="text-sm flex items-center justify-end col-span-3 mr-2">
            ${p.amount.toFixed(2)}
          </p>
        )}
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
        {pastPayments && pastPayments.length > 0 && <>
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
        </>
        }
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
        {futurePayments && futurePayments.length > 0 && <>
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
        </>}
      </div>
    </>
  );
}
