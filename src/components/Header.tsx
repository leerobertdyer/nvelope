import { useEffect, useRef, useState } from "react";
import { useGetDatabase } from "../Context/DatabaseContext/useGetDatabase";
import { Link, useLocation } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { IoMenu } from "react-icons/io5";
import SpotlightOverlay from "./SpotlightOverlay";
import { BsEnvelopeHeartFill, BsFillEnvelopeHeartFill } from "react-icons/bs";

export default function Header({ step }: { step?: number }) {
  const { totalSpendingBudget, interval, payDate } = useGetDatabase();
  const [daysTillReset, setDaysTillReset] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  // Map pathnames to screen names
  const routeMap: Record<string, string> = {
    "/": "home",
    "/settings": "settings",
    "/nvelopes": "nvelopes",
    "/bills": "bills"
  };
  const currentScreen = routeMap[location.pathname] || "home";

  const stepRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => { 
      // Handle Spotlight Setup and Resize
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

      // Convert Firebase Timestamp to JS Date
      const start = payDate instanceof Timestamp 
        ? payDate.toDate() 
        : new Date(payDate);

      const now = new Date();

      let nextPayPeriod: Date;

      if (interval === "monthly") {
        // Find the next month where the day and time matches payDate
        nextPayPeriod = new Date(start);
        nextPayPeriod.setFullYear(
          now.getFullYear(),
          now.getMonth(),
          start.getDate()
        );
        nextPayPeriod.setHours(
          start.getHours(),
          start.getMinutes(),
          start.getSeconds(),
          0
        );

        // If the next pay period is in the past, move to the next month
        if (nextPayPeriod <= now) {
          nextPayPeriod.setMonth(nextPayPeriod.getMonth() + 1);
        }
      } else if (interval === "weekly") {
        // Weekly: find the next week where the weekday and time matches payDate
        nextPayPeriod = new Date(now);
        nextPayPeriod.setHours(
          start.getHours(),
          start.getMinutes(),
          start.getSeconds(),
          0
        );

        // Calculate the difference in days to the next weekday (0=Sunday, 5=Friday, etc.)
        const startWeekday = start.getDay();
        const nowWeekday = now.getDay();
        let daysUntil = (startWeekday - nowWeekday + 7) % 7;
        if (daysUntil === 0 && nextPayPeriod <= now) daysUntil = 7; // If today but time passed, move to next week
        nextPayPeriod.setDate(now.getDate() + daysUntil);
      } else if (interval === "biweekly") {
        // Biweekly: find the next 14-day period since payDate
        const msInDay = 24 * 60 * 60 * 1000;
        const diff = Math.floor((now.getTime() - start.getTime()) / msInDay);
        const daysSinceLast = diff % 14;
        let daysUntil = 14 - daysSinceLast;
        // If today but time passed, move to next period
        const lastPay = new Date(now.getTime() - daysSinceLast * msInDay);
        lastPay.setHours(
          start.getHours(),
          start.getMinutes(),
          start.getSeconds(),
          0
        );
        if (daysUntil === 14 && lastPay > now) daysUntil = 0;
        nextPayPeriod = new Date(now.getTime() + daysUntil * msInDay);
        nextPayPeriod.setHours(
          start.getHours(),
          start.getMinutes(),
          start.getSeconds(),
          0
        );
      } else {
        setDaysTillReset(0);
        return;
      }

      // Calculate days difference (rounded up)
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.ceil(
        (nextPayPeriod.getTime() - now.getTime()) / msPerDay
      );
    setDaysTillReset(days);
  }, [interval, payDate]);

  useEffect(() => {
    if (step) setShowMenu(false);
  }, [step]);
  

  return (
    <>
      <div className="fixed z-100 flex items-center justify-evenly gap-8 w-full py-4 h-[2rem] bg-my-white-base border-b-2 select-none">
        {!showMenu ? (
          <>
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
          {currentScreen !== "home" && <Link
            to={"/"}
            className="hidden sm:block shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
            Home
          </Link>}
          {currentScreen !== "nvelopes" && <Link
            to={"/nvelopes"}
            className="hidden sm:block shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
            Nvelopes
          </Link>}
          {currentScreen !== "settings" && <Link
            to={"/settings"}
            className="hidden sm:block shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
            Settings
          </Link>}
          {currentScreen !== "bills" && <Link
            to={"/bills"}
            className="hidden sm:block shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
            Bills
          </Link>}
          <IoMenu
            onClick={() => setShowMenu(true)}
            className="sm:hidden w-10 h-10 cursor-pointer rounded-md shadow-md shadow-black bg-my-white-light hover:bg-my-white-dark"/>
          </>
        ) : (
          <>
            {currentScreen !== "home" &&
              <Link to="/" className="sm:block shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">Home</Link>
            }
            {(currentScreen !== "settings" || step === 9) &&
              <Link
                to="/settings"
                className="text-sm shadow-md shadow-black rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
                Settings
              </Link>}
             {currentScreen !== "nvelopes" &&
              <Link to="/nvelopes"
                className="text-sm shadow-md shadow-black rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
                <BsEnvelopeHeartFill className="w-5 h-5" />
              </Link>
            }
            {currentScreen !== "bills" &&
              <Link to="/bills"
                className="text-sm shadow-md shadow-black rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark">
                Bills
              </Link>
            }
            <p className="shadow-md shadow-black text-xl rounded-md bg-my-white-light cursor-pointer py-[.3rem] px-3 font-bold border hover:bg-my-white-dark" 
              onClick={() => setShowMenu(false)}>X</p>
          </>
        )}
      </div>
      <div className="h-[4rem]"></div> {/* Spacer */}
    </>
  );
}
