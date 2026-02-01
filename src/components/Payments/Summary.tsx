
import type { Payment } from "../../types";
import { paymentsTotal } from "../../util";
import ShowAndHide from "../Buttons/ShowAndHide";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";

interface IProps {
    payments: Payment[]
    setShowPaymentsMenu: (b: boolean) => void
    setShowEditSnowball: (b: boolean) => void
}


export default function PaymentsSummary({ payments, setShowEditSnowball, setShowPaymentsMenu }: IProps) {
    const { snowball, payPeriodInterval, payDate } = useDatabase();
    if (!payDate) return;

    return (
        <div className="flex flex-col gap-2 items-center justify-center w-full pb-2 bg-my-black-dark">
            <h3 className="pt-2 rounded-md text-my-white-dark w-full text-center text-xl md:text-2xl">
                Payments
            </h3>
            <div className="bg-my-black-dark border-my-black-light border-2 rounded-md p-2">
                <div className="text-lg md:text-xl w-full flex justify-between text-my-white-light">
                    Due Monthly
                    <span className="text-my-red-base ml-2">
                        $
                        {Math.ceil(
                            paymentsTotal(payments, payPeriodInterval, payDate)
                                .totalMonthlyPayments
                        )}
                    </span>
                </div>
                <div className="text-lg md:text-xl w-full flex justify-between text-my-white-light">
                    Remaining Debt
                    <span className="text-my-blue-dark ml-2">
                        $
                        {Math.ceil(
                            paymentsTotal(payments, payPeriodInterval, payDate)
                                .remainingDebt
                        )}
                    </span>
                </div>
                <div
                    className="text-lg md:text-xl w-full flex justify-between text-my-white-light"
                    onClick={() => setShowEditSnowball(true)}
                >
                    Snowball ❄️
                    <span className="text-my-blue-light ml-2">${snowball}</span>
                </div>
            </div>
            <ShowAndHide
                onClick={() => setShowPaymentsMenu(false)}
                label="Hide Summary"
                up={true}
                border={false}
                iconSize={25}
            />
        </div>
    )
}