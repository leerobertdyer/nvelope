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
import { Timestamp } from "firebase/firestore";
import { editPayments } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import ShowAndHide from "./ShowAndHide/ShowAndHide";
import { getCurrentIntervalDateRange, isDateInCurrentPayPeriod } from "../util";

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
  const { end: endOfPayPeriod } = useMemo(() => getCurrentIntervalDateRange(payPeriodInterval, payDate!), [payPeriodInterval, payDate])

  const [pastPayments, setPastPayments] = useState<Payment[]>([]);
  const [currentPayments, setCurrentPayments] = useState<Payment[]>([]);
  const [futurePayments, setFuturePayments] = useState<Payment[]>([]);

  const [showPast, setShowPast] = useState(false);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showFuture, setShowFuture] = useState(false);

  useEffect(() => {
    if (!payments || !payDate) return;
    async function updatePaymentDatesToCurrentMonth() {
      if (!user) return;
      const newPayments = payments
        .map((p) => ({
          ...p,
          dueDate: Timestamp.fromDate(
            new Date(
              today.getFullYear(),
              today.getMonth(),
              p.dueDate.toDate().getDate()
            )
          ),
        }))
        .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());
      await editPayments(newPayments, user.uid);
    }
    updatePaymentDatesToCurrentMonth();
    setPastPayments(payments.filter((p) => p.dueDate.toDate() < today));
    setCurrentPayments(
      payments.filter(
        (p) => isDateInCurrentPayPeriod(payPeriodInterval, payDate.toDate(), p.dueDate.toDate())
      )
    );
    setFuturePayments(payments.filter((p) =>  isAfter(p.dueDate.toDate(), endOfPayPeriod)));
  }, [payments, endOfPayPeriod, payDate, user, payPeriodInterval, today]);

  function RenderPayments({ p }: { p: Payment }) {
    return (
      <div
        key={p.id}
        className={`grid grid-cols-8 py-2 bg-my-black-base text-my-white-dark border-2 text-center
          ${
            p.type === "BILL" ? "border-my-red-light" : "border-my-blue-light"
          } `}
      >
        <p className="flex items-center justify-center bg-my-white-base rounded-lg text-my-black-dark p-2 text-xs w-[1rem] m-auto">
          {format(p.dueDate.toDate(), "do")}
        </p>
        <p className="flex items-center justify-center text-xs col-span-3">
          {p.name}
        </p>
        {p.total ? (
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
      <div className="h-fit max-w-[60rem] w-[90vw] border-2 border-my-white-light rounded-md mb-[5rem] overflow-auto">
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
