import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { calculatePayoffDate, paymentsTotal } from "../util";
import Loading from "../components/Loading";
import type { Payment } from "../types";
import ShowAndHide from "../components/Buttons/ShowAndHide";
import { editPayments } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { format } from "date-fns";

export default function Debt() {
    const { user } = useAuth();
    const { payments, payPeriodInterval, payDate } = useDatabase();
    const { remainingDebt } = paymentsTotal(payments, payPeriodInterval, payDate!)

    const [isLoading, setIsLoading] = useState(true);
    const [debtsMissingInfo, setDebtsMissingInfo] = useState<Payment[]>([])
    const [debts, setDebts] = useState<Payment[]>([])
    const [showMissingInfoDebts, setShowMissingInfoDebts] = useState(false)
    const [interestRate, setInterestRate] = useState<number>();

    function debtHasAllValues(d: Payment) {
        return (typeof d.total === "number" && typeof d.amount === "number" && typeof d.interestRate === "number")
    }

    const updatedPayOffDates = useRef(false);

    const updateAllPayOffDatesIfNeeded = useCallback(async () => {
        if (!payments?.length || !user?.uid) return;

        let changed = false;

        const nextPayments = payments.map((p) => {
            if (p.type !== "DEBT") return p;

            const resp = calculatePayoffDate(p);
            if (!resp) return p;
            const {payOffDate, paymentsLeft} = resp;

            const next = payOffDate ? format(payOffDate, "MMM do, yyyy") : undefined;

            if (next !== p.payOffDate) changed = true;
            if (paymentsLeft !== p.paymentsLeft) changed = true;
            return { ...p, payOffDate: next, paymentsLeft };
        });

        if (!changed) return;
        await editPayments(nextPayments, user.uid);
    }, [payments, user?.uid]);

    useEffect(() => {
        if (updatedPayOffDates.current) return;
        if (!payments?.length || !user?.uid) return;

        updatedPayOffDates.current = true;
        updateAllPayOffDatesIfNeeded();
    }, [payments, user?.uid, updateAllPayOffDatesIfNeeded]);


    useEffect(() => {
        const nextMissingInfo: Payment[] = [];
        const nextDebts: Payment[] = [];

        for (const p of payments) {
            if (p.type === "DEBT") {
                if (!debtHasAllValues(p)) {
                    nextMissingInfo.push(p)
                    continue
                }

                nextDebts.push(p);
            }
        }

        setDebtsMissingInfo(nextMissingInfo);
        setDebts(nextDebts);
        setIsLoading(false);

    }, [payments])

    async function saveDebtInformation(d: Payment) {
        const nextPayments = payments.map((p) => {
            if (p.id === d.id) return { ...d, interestRate: interestRate };
            return p;
        })
        await editPayments(nextPayments, user!.uid);
        setInterestRate(undefined);
    }


    if (isLoading) return <Loading text="Crunching Numbers" />

    interface iDebtGrid {
        name: string
        interest: string
        owed: string
        color?: string
        paymentsLeft?: string
        payOffDate?: string
    }

    function DebtGrid({ name, interest, owed, color, paymentsLeft, payOffDate }: iDebtGrid) {
        let cols = 5;
        if (paymentsLeft) cols = cols + 2
        if (payOffDate) cols = cols + 2

        return (
            <div className={
                `w-full grid 
                grid-cols-${cols}
                text-${color}`}>
                <p className="col-span-2 text-left">{name}</p>
                <p className="col-span-1 text-center">{interest}</p>
                <p className="col-span-2 text-right">{owed}</p>
                {paymentsLeft && <p className="col-span-1 text-right">{paymentsLeft}</p>}
                {payOffDate && <p className="col-span-3 text-right">{payOffDate}</p>}
            </div>)
    }


    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-my-blue-dark text-my-white-dark">
            <h1 className="text-3xl">Debt</h1>
            <p className="bg-my-black-base p-2 rounded-md text-my-red-light mb-[2rem]"><span className="text-my-white-light">TOTAL:</span> ${remainingDebt.toFixed(2)}</p>

            {debtsMissingInfo.length > 0 && <div className="flex flex-col items-center text-my-white-light bg-my-black-base p-4 rounded-md w-[20rem] margin-auto">
                <p className="text-my-red-light">Missing Information on {debtsMissingInfo.length} debts:</p>
                {showMissingInfoDebts
                    ? <div className="w-full ">
                        <DebtGrid name="Name" interest="Interest" owed="Owed" color="my-white-dark" />
                        {debtsMissingInfo.map((d: Payment) => <div className="w-full grid grid-cols-5" key={d.id}>
                            <p className="col-span-2 text-left">{d.name}</p>
                            {d.interestRate
                                ? <p className="col-span-1 text-center mb-2">{d.interestRate}</p>
                                : <input className="bg-white rounded-md mb-2 text-black px-2" onChange={(e) => setInterestRate(Number(e.target.value))} onBlur={() => saveDebtInformation(d)} type="number" min={0} max={100} placeholder="0" />}
                            <p className="col-span-2 text-right">{d.total}</p>
                        </div>)}
                        <ShowAndHide label="Hide" onClick={() => setShowMissingInfoDebts(false)}></ShowAndHide>
                    </div>
                    : <ShowAndHide label="Show" up={false} onClick={() => setShowMissingInfoDebts(true)}></ShowAndHide>}
            </div>
            }

            {debts.length > 0 && <div className=" text-my-white-light bg-my-black-base p-4 rounded-md w-[30rem] margin-auto">
                <DebtGrid name="Name" interest="Interest" owed="Owed" color="my-white-dark" paymentsLeft="Payments" payOffDate="Final" />
                {debts.map((d: Payment) => (
                    <div key={d.id} >
                        <DebtGrid
                            color="my-white-light"
                            name={d.name}
                            interest={d.interestRate ? d.interestRate.toString() + " %" : ''}
                            owed={d.total?.toString() ?? ''}
                            paymentsLeft={d.paymentsLeft?.toString()}
                            payOffDate={d.payOffDate}
                        />
                    </div>))}
            </div>}
        </div>
    )
}