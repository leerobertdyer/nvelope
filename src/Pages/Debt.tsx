import { useCallback, useEffect, useRef, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { calculatePayoffDate, calculateSnowballPayoffDate, paymentsTotal } from "../util";
import Loading from "../components/Loading";
import type { Payment } from "../types";
import ShowAndHide from "../components/Buttons/ShowAndHide";
import Header from "../components/Header";
import { editPayments, editSnowballTargetPaymentId } from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { format, parse } from "date-fns";
import { IoWarning } from "react-icons/io5";
import PaymentForm from "../components/Forms/PaymentForm";
import TextInput from "../components/TextInput";

export default function Debt() {
    const { user } = useAuth();
    const { payments, setPayments, payPeriodInterval, payDate, snowball, snowballTargetPaymentId, setSnowballTargetPaymentId } = useDatabase();
    const { remainingDebt } = paymentsTotal(payments, payPeriodInterval, payDate!)

    const [isLoading, setIsLoading] = useState(true);
    const [debtsMissingInfo, setDebtsMissingInfo] = useState<Payment[]>([])
    const [debts, setDebts] = useState<Payment[]>([])
    const [paidOffDebts, setPaidOffDebts] = useState<Payment[]>([])
    const [showMissingInfoDebts, setShowMissingInfoDebts] = useState(false)
    const [interestRate, setInterestRate] = useState<number>();
    const [editingDebt, setEditingDebt] = useState<Payment | null>(null);
    const [extraMonthlyInput, setExtraMonthlyInput] = useState("");

    function debtHasAllValues(d: Payment) {
        return (typeof d.total === "number" && typeof d.amount === "number" && typeof d.interestRate === "number")
    }

    const updatedPayOffDates = useRef(false);
    const previousEditingDebtRef = useRef<Payment | null>(null);

    const updateAllPayOffDatesIfNeeded = useCallback(async () => {
        if (!payments?.length || !user?.uid) return;

        let changed = false;

        const nextPayments = payments.map((p) => {
            if (p.type !== "DEBT") return p;

            const resp = calculatePayoffDate(p);
            if (!resp) return p;
            const { payOffDate, paymentsLeft } = resp;

            const next = payOffDate ? format(payOffDate, "MMM do, yyyy") : undefined;

            if (next !== p.payOffDate) changed = true;
            if (paymentsLeft !== p.paymentsLeft) changed = true;
            return { ...p, payOffDate: next, paymentsLeft };
        });

        if (!changed) return;
        setPayments(nextPayments);
        await editPayments(nextPayments, user.uid);
    }, [payments, user?.uid, setPayments]);

    useEffect(() => {
        if (updatedPayOffDates.current) return;
        if (!payments?.length || !user?.uid) return;

        updatedPayOffDates.current = true;
        updateAllPayOffDatesIfNeeded();
    }, [payments, user?.uid, updateAllPayOffDatesIfNeeded]);

    // When returning from edit form, recalc payoff dates so UI shows latest
    useEffect(() => {
        if (previousEditingDebtRef.current !== null && editingDebt === null && payments?.length && user?.uid) {
            updatedPayOffDates.current = false;
            updateAllPayOffDatesIfNeeded();
            updatedPayOffDates.current = true;
        }
        previousEditingDebtRef.current = editingDebt;
    }, [editingDebt, payments?.length, user?.uid, updateAllPayOffDatesIfNeeded]);


    useEffect(() => {
        const nextMissingInfo: Payment[] = [];
        const nextDebts: Payment[] = [];
        const nextPaidOff: Payment[] = [];

        for (const p of payments) {
            if (p.type === "DEBT") {
                if (p.total != null && p.total <= 0) {
                    nextPaidOff.push(p);
                    continue;
                }
                if (!debtHasAllValues(p)) {
                    nextMissingInfo.push(p)
                    continue
                }

                nextDebts.push(p);
            }
        }

        setDebtsMissingInfo(nextMissingInfo);
        setDebts(nextDebts);
        setPaidOffDebts(nextPaidOff);
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

    const effectiveSnowballTargetId =
        snowballTargetPaymentId && debts.some((d) => d.id === snowballTargetPaymentId)
            ? snowballTargetPaymentId
            : debts.length > 0
                ? [...debts].sort((a, b) => (a.total ?? 0) - (b.total ?? 0))[0]?.id ?? null
                : null;

    async function handleSnowballTargetChange(debtId: string) {
        setSnowballTargetPaymentId(debtId);
        await editSnowballTargetPaymentId(user!, debtId);
    }


    if (isLoading) return <Loading text="Crunching Numbers" />;

    if (editingDebt && user) {
        return (
            <PaymentForm
                paymentToEdit={editingDebt}
                user={user}
                handleBack={() => setEditingDebt(null)}
                handleUpdateBudget={async () => {}}
            />
        );
    }

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
                `text-xs md:text-sm
                w-full grid 
                grid-cols-${cols}
                text-${color}`}>
                <p className="col-span-3 text-left">{name}</p>
                <p className="col-span1 text-center">{interest}</p>
                <p className="col-span-1 text-right">{owed}</p>
                {paymentsLeft && <p className="col-span-2 text-center">{paymentsLeft}</p>}
                {payOffDate && <p className="col-span-2 text-right">{payOffDate}</p>}
            </div>)
    }


    // Final payoff date = when the last debt is paid off (max of per-debt payoff dates)
    const payoffDatesParsed = debts
        .map((d) => (d.payOffDate ? parse(d.payOffDate, "MMM do, yyyy", new Date()) : null))
        .filter((d): d is Date => d !== null);
    const finalPaymentDate =
        payoffDatesParsed.length > 0
            ? new Date(Math.max(...payoffDatesParsed.map((d) => d.getTime())))
            : new Date();
    const finalPaymentDateStr = format(finalPaymentDate, "MMM yyyy");

    const extraMonthly = Number(extraMonthlyInput) || 0;
    const snowballPayoffDate = calculateSnowballPayoffDate(debts, snowball, effectiveSnowballTargetId, new Date(), extraMonthly || undefined);
    const snowballPayoffDateStr = snowballPayoffDate ? format(snowballPayoffDate, "MMM yyyy") : null;

    const snowballWithExtraDate = extraMonthly > 0 ? snowballPayoffDate : null;
    const snowballWithExtraDateStr = snowballWithExtraDate ? format(snowballWithExtraDate, "MMM yyyy") : null;

    return (
        <div className="flex flex-col items-center justify-start py-[5rem] w-full h-full bg-my-blue-dark text-my-white-dark">
            <Header links={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }]} />
            <h1 className="text-3xl">Debt</h1>
            <p className="bg-my-black-base p-2 rounded-md text-my-red-light mb-[1rem] w-[20rem] text-center "><span className="text-my-white-light">TOTAL:</span> ${remainingDebt.toFixed(2)}</p>
            <div className="bg-my-black-base p-2 rounded-md text-my-blue-base mb-[1rem] w-[20rem] text-center "><span className="text-my-white-light">Final Payoff Date:</span> {finalPaymentDateStr}
            </div>
            {snowballPayoffDateStr && (
                <div className="bg-my-black-base p-2 rounded-md text-my-green-light mb-[1rem] w-[20rem] text-center">
                    <span className="text-my-white-light">With snowball:</span> {snowballPayoffDateStr}
                </div>
            )}

            {debts.length > 0 && (
                <div className="bg-my-black-base p-2 rounded-md text-my-white-light mb-[2rem] w-[20rem] md:w-[24rem]">
                    <p className="text-my-white-dark text-sm font-medium mb-2 text-center">What if I pay an extra amount each month?</p>
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <TextInput
                            id="extra-monthly"
                            label="Extra per month ($)"
                            placeholder="e.g. 400"
                            value={extraMonthlyInput}
                            onChange={(e) => setExtraMonthlyInput(e.target.value)}
                            numeric
                        />
                    </div>
                    {snowballWithExtraDateStr && extraMonthly > 0 && (
                        <p className="text-my-green-dark text-sm text-center">
                            With ${extraMonthly.toFixed(0)}/mo extra: <strong>{snowballWithExtraDateStr}</strong>
                        </p>
                    )}
                </div>
            )}

            {debtsMissingInfo.length > 0 && <div className="flex flex-col items-center text-my-white-light bg-my-black-base p-2 rounded-md w-[20rem] margin-auto">
                <p className="text-my-red-light">Missing Information on {debtsMissingInfo.length} debts:</p>
                {showMissingInfoDebts
                    ? <div className="w-full ">
                        <DebtGrid name="Name" interest="Interest" owed="Owed" color="my-white-dark" />
                        {debtsMissingInfo.map((d: Payment) => (
                            <div
                                key={d.id}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && setEditingDebt(d)}
                                className="w-full grid grid-cols-5 cursor-pointer hover:bg-my-black-light rounded px-1 -mx-1"
                            >
                                <p className="col-span-3 text-left">{d.name}</p>
                                {d.interestRate
                                    ? <p className="col-span-1 text-center mb-2">{d.interestRate}</p>
                                    : <input className="col-span-1 text-center bg-white rounded-md mb-2 text-black" onChange={(e) => setInterestRate(Number(e.target.value))} onBlur={() => saveDebtInformation(d)} type="number" min={0} max={100} placeholder="0" />}
                                <p className="col-span-1 text-right">{d.total}</p>
                            </div>
                        ))}
                        <ShowAndHide label="Hide" onClick={() => setShowMissingInfoDebts(false)}></ShowAndHide>
                    </div>
                    : <ShowAndHide label="Show" up={false} onClick={() => setShowMissingInfoDebts(true)}></ShowAndHide>}
            </div>
            }

            {debts.length > 0 && (() => {
                const debtsByLowestOwed = [...debts].sort((a, b) => (a.total ?? 0) - (b.total ?? 0));
                return (
                <div className=" text-my-white-light bg-my-black-base p-4 rounded-md w-[20rem] md:w-[30rem] margin-auto mt-[2rem]">
                    <div className="flex flex-col gap-2 mb-4">
                        <label htmlFor="snowball-target" className="text-my-white-dark text-sm">Snowball target</label>
                        <select
                            id="snowball-target"
                            value={effectiveSnowballTargetId ?? ""}
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id) handleSnowballTargetChange(id);
                            }}
                            className="w-[90%] max-w-[20rem] border-2 p-2 rounded-md border-my-white-dark bg-my-white-light text-my-black-dark text-sm"
                        >
                            {debtsByLowestOwed.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name} (${d.total?.toFixed(0) ?? "0"})
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-my-white-dark mb-1">Click a debt to edit</p>
                    <DebtGrid name="Name" interest="Interest" owed="Owed" color="my-white-dark" paymentsLeft="Payments" payOffDate="Final" />
                    {debtsByLowestOwed.map((d: Payment) => {
                        const cannotPayOff = d.paymentsLeft == null || d.payOffDate == null;
                        return (
                        <div
                            key={d.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setEditingDebt(d)}
                            onKeyDown={(e) => e.key === "Enter" && setEditingDebt(d)}
                            className={`cursor-pointer hover:bg-my-black-light rounded px-1 -mx-1 flex items-center gap-1 ${d.id === effectiveSnowballTargetId ? "ring-2 ring-my-white-dark rounded px-1 -mx-1" : ""}`}
                        >
                            <div className="flex-1 min-w-0">
                                <DebtGrid
                                    color="my-white-light"
                                    name={d.name + (d.id === effectiveSnowballTargetId ? " ❄️" : "")}
                                    interest={d.interestRate != null ? d.interestRate.toString() + " %" : "—"}
                                    owed={`$${d.total?.toFixed(0) ?? ''}`}
                                    paymentsLeft={d.paymentsLeft?.toString() ?? "—"}
                                    payOffDate={d.payOffDate ?? "—"}
                                />
                            </div>
                            {cannotPayOff && (
                                <span
                                    title="Payoff cannot be calculated. Your minimum payment may be too low to cover interest – try increasing the payment amount."
                                    className="flex-shrink-0 text-my-red-light"
                                    aria-label="Warning: payoff cannot be calculated"
                                >
                                    <IoWarning size={20} />
                                </span>
                            )}
                        </div>
                    );})}
                </div>
                );
            })()}

            {paidOffDebts.length > 0 && (
                <div className="text-my-white-light bg-my-black-base p-4 rounded-md w-[20rem] md:w-[30rem] margin-auto mt-[2rem]">
                    <p className="text-my-white-dark text-sm mb-2">Paid off</p>
                    <ul className="list-none text-my-green-dark">
                        {paidOffDebts.map((d) => (
                            <li key={d.id}>{d.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}