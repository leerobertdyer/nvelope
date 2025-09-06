import { useEffect, useRef, useState } from "react";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import SpotlightOverlay from "./SpotlightOverlay";
import NavMenu from "./NavMenu";
import { getIntervalDateRange } from "../util";
import { intervalToDuration, startOfDay } from "date-fns";

export default function Header({ step, links }: { step?: number, links: { label: string, href: string }[] }) {
  const { totalSpendingBudget, interval, payDate } = useDatabase();
  const [daysTillReset, setDaysTillReset] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const stepRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => { 
      // Handle Spotlight Setup and Resize

      if (step) setShowMenu(false);

      if (step === 10) {
        updateRect(null);
        return;
      }
      updateRect(stepRef); 
      window.addEventListener("resize", () => updateRect(stepRef));
      window.addEventListener("scroll", () => updateRect(stepRef), true); // use capture to catch scrolls on parents

      return () => {
        window.removeEventListener("resize", () => updateRect(stepRef));
        window.removeEventListener("scroll", () => updateRect(stepRef), true);
      };
  }, [stepRef, step]); 

  function updateRect(currentRef: React.RefObject<HTMLDivElement | null> | null) {
    if (currentRef && currentRef.current) {
      setRect(currentRef.current.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }

  useEffect(() => {
      // Handle Display for payPeriod and remaining Budget
      if (!payDate || !interval) {
        setDaysTillReset(0);
        return;
      }
      const today = startOfDay(new Date());

      let { end } = getIntervalDateRange(interval, payDate.toDate());

      const beginningOfPayday = startOfDay(payDate.toDate())
      if (beginningOfPayday > today) {
        // If setting payday to future set the end to that date instead of the end of that interval
        end = payDate.toDate()
      }
      const diffDays = intervalToDuration({start: today, end}).days || 0

      setDaysTillReset(diffDays > 0 ? diffDays : 0);
  }, [interval, payDate, totalSpendingBudget]);
  

  return (
    <>
      <div className="fixed inset-0 z-9990 flex items-center justify-evenly gap-8 w-full py-4 h-[2rem] bg-my-white-base border-b-2 select-none">
        {rect && step && <SpotlightOverlay targetRect={rect} />}
        <p ref={step === 2 || step === 3 ? stepRef : null}
          className={`text-xl rounded-md text-my-white-light py-[.3rem] px-3 font-bold border-2 border-my-white-light
              ${daysTillReset > 3
                ? "bg-my-red-dark"
                : "bg-my-green-dark"}`}>
              {daysTillReset} days
            </p>
            <p ref={step && step > 3 && step < 9? stepRef : null}
              className={`text-xl rounded-md text-my-white-light py-[.3rem] px-3 font-bold border-2 border-my-white-light
                        ${totalSpendingBudget <= 0 ? "bg-my-red-dark" : "bg-my-green-dark"}`}>
              ${totalSpendingBudget.toFixed(2)}
            </p>
            <NavMenu showMenu={showMenu} setShowMenu={setShowMenu} links={links}/>
        </div>  
        <div className="h-[4rem] w-full"></div>
    </>
    );
}
