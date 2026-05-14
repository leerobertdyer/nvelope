import { useEffect, useState } from "react";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import NavMenu from "./NavMenu";
import { calculateCurrentIntervalStart, getIntervalDateRange, getNumberOfDaysFromInterval } from "../../util";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import EditSpendingBudget from "../Forms/EditSpendingBudget";

export default function Header({ links }: { links: { label: string, href: string }[] }) {
  const { totalSpendingBudget, payPeriodInterval, payDate } = useDatabase();
  const [daysTillReset, setDaysTillReset] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSpendingBudget, setShowEditSpendingBudget] = useState(false);

  useEffect(() => {
      // Handle Display for payPeriod and remaining Budget
      if (!payDate || !payPeriodInterval) {
        setDaysTillReset(0);
        return;
      }
      const today = startOfDay(new Date());

      const currentPayPeriodStart = calculateCurrentIntervalStart(payDate.toDate(), payPeriodInterval)
      // If today IS the period start, show the full period length
      if (startOfDay(currentPayPeriodStart).getTime() === today.getTime()) {
        const periodLength = getNumberOfDaysFromInterval(payPeriodInterval);
        setDaysTillReset(periodLength);
        return;
      } 

      let { end } = getIntervalDateRange(payPeriodInterval, currentPayPeriodStart);

      const beginningOfPayday = startOfDay(payDate.toDate())
      if (beginningOfPayday > today) {
        // If setting payday to future, set end to the day BEFORE payday (last day of current period)
        // This matches getIntervalDateRange which also subtracts 1 day to get the last day
        end = startOfDay(payDate.toDate())
        const diffDays = differenceInCalendarDays(end, today);
        // Don't add 1 here since end is the reset day, not the last day of period
        setDaysTillReset(diffDays > 0 ? diffDays : 1);
        return;
      }
      
      // Use differenceInCalendarDays for accurate day counting (adds 1 to include today)
      const diffDays = differenceInCalendarDays(end, today);

      setDaysTillReset(diffDays >= 0 ? diffDays + 1 : 0);
  }, [payPeriodInterval, payDate, totalSpendingBudget]);
  
  if (showEditSpendingBudget) return <EditSpendingBudget handleBack={() => setShowEditSpendingBudget(false)}/>

  return (
    <>
      <div className="fixed inset-0 z-9990 flex items-center justify-evenly gap-8 w-full py-4 h-[2rem] bg-my-white-base border-b-2 select-none">
        <p
          className={`text-xl rounded-md text-my-white-light py-[.3rem] px-3 font-bold border-2 border-my-white-light
              ${daysTillReset > 3
                ? "bg-my-red-dark"
                : "bg-my-green-dark"}`}>
          {daysTillReset} days
        </p>
        <p
          onClick={() => setShowEditSpendingBudget(true)}
          className={`text-xl rounded-md text-my-white-light py-[.3rem] px-3 font-bold border-2 border-my-white-light cursor-pointer hover:opacity-80 transition-opacity
            ${totalSpendingBudget <= 0 ? "bg-my-red-dark" : "bg-my-green-dark"}`}>
          ${totalSpendingBudget.toFixed(2)}
        </p>
        <NavMenu showMenu={showMenu} setShowMenu={setShowMenu} links={links}/>
      </div>
      <div className="h-[4rem] w-full"></div>
    </>
  );
}
