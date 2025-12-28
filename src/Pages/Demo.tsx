import Button from "../components/Buttons/Button";
import ClosingX from "../components/Buttons/ClosingX";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import {
  editPayments,
  editIncome,
  editPayPeriodInterval,
  editIsNewUser,
  editPayDate,
  editTotalSpendingBudget,
  createUserDocument,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import Header from "../components/Header";
import "react-calendar/dist/Calendar.css";
import DemoStep from "../components/DemoStep";
import type { Payment, Interval } from "../types";
import { IoIosSad } from "react-icons/io";
import Popup from "../components/Popup";
import { Timestamp } from "firebase/firestore";
import SpendBtn from "../components/Buttons/SpendBtn";
import {
  getIncomeByInterval,
  isDateInCurrentPayPeriod,
  recalculateBudget,
  transformIntervalMidSentence,
} from "../util";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { MONTHLY } from "../constants";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Demo() {
  const {
    isNewUser,
    setIsNewUser,
    payDate,
    setPayDate,
    income,
    setIncome,
    payPeriodInterval,
    payments,
    setPayments,
    setTotalSpendingBudget,
    totalSpendingBudget,
    documentExists,
    setDocumentExists,
  } = useDatabase();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [newPayDate, setNewPayDate] = useState<Value | null>(null);
  const [newIncome, setNewIncome] = useState<number | null>(null);
  const [newInterval, setNewInterval] = useState<string | null>(null);
  const [newBills, setNewBills] = useState<Payment[]>([]);
  const [newBillName, setNewBillName] = useState("rent");
  const [newBillAmount, setNewBillAmount] = useState<number | null>(null);
  const [newBillOriginalDate, setNewBillOriginalDate] = useState<Date | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showBillAdded, setShowBillAdded] = useState<boolean>(false);
  const [showBillError, setShowBillError] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      setShowBillAdded(false);
      setShowBillError(false);
    }, 2500);
  }, [showBillAdded, showBillError]);

  useEffect(() => {
    // Give firebase time to load user data
    // That way if there is already a startDate but user has not finished remaining steps
    // We allow them to start where left off
    setTimeout(() => {
      setIsLoading(false);
    }, 2500);
  }, []);

  function handleCalendarChange(value: Value) {
    if (value instanceof Date) {
      setNewBillOriginalDate(value);
    }
  }

  async function handleAddNewBill() {
    if (!newBillName || !newBillAmount) return;
    console.log("handleAddNewBill");

    // check to see if name is already used
    if (newBills.some((bill) => bill.name === newBillName)) {
      setShowBillError(true);
      return;
    }

    if (!newBillOriginalDate || !payDate) {
      return;
    }

    await editPayments(
      [
        ...newBills,
        {
          name: newBillName,
          amount: newBillAmount,
          dueDate: Timestamp.fromDate(newBillOriginalDate),
          paid: false,
          interval: MONTHLY,
        } as Payment,
      ],
      user?.uid || ""
    );
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount: isDateInCurrentPayPeriod(
        payPeriodInterval,
        payDate?.toDate(),
        newBillOriginalDate
      )
        ? newBillAmount
        : 0,
    });
    await editTotalSpendingBudget(nextBudget, user?.uid || "");
    setTotalSpendingBudget(nextBudget);
    setNewBills([
      ...newBills,
      {
        name: newBillName,
        amount: newBillAmount,
        dueDate: Timestamp.fromDate(newBillOriginalDate),
        paid: false,
        interval: MONTHLY,
      } as Payment,
    ]);
    setPayments([
      ...newBills,
      {
        name: newBillName,
        amount: newBillAmount,
        dueDate: Timestamp.fromDate(newBillOriginalDate),
        paid: false,
        interval: MONTHLY,
      } as Payment,
    ]);
    setNewBillName("");
    setNewBillAmount(0);
    setShowBillAdded(true);
  }

  async function handleClickAddBill() {
    handleAddNewBill();
  }

  async function handleFirstStep() {
    console.log("[DEMO] handleFirstStep");
    
    // If no document exists yet, create it now (user has intentionally started onboarding)
    if (documentExists === false && user) {
      console.log("[DEMO] Creating user document...");
      const created = await createUserDocument(user);
      if (created) {
        setDocumentExists(true);
      } else {
        console.error("[DEMO] Failed to create user document");
        // Could show an error to the user here
        return;
      }
    }
    
    if (payDate) {
      console.log("[DEMO] payDate found: ", payDate);
      setNewPayDate(payDate.toDate());
      if (payPeriodInterval) {
        setNewInterval(payPeriodInterval);
        setStep(4);
      } else {
        console.log("[DEMO] payDate found, No interval found");
        setStep(3);
      }
    } else {
      console.log("[DEMO] No pay date found");
      setStep(2);
    }
  }

  async function handleSecondStep() {
    console.log("[DEMO] handleSecondStep");
    if (!newPayDate || Array.isArray(newPayDate)) return;
    await editPayDate(newPayDate, user!.uid);
    if (newPayDate instanceof Date) {
      setPayDate(Timestamp.fromDate(newPayDate));
    }
    setStep(3);
  }

  async function handleThirdStep() {
    console.log("handleThirdStep");
    if (!newInterval && !payPeriodInterval) return;
    const newIncomeAmount = getIncomeByInterval(
      payPeriodInterval,
      newInterval as Interval,
      income
    );
    await editPayPeriodInterval(newInterval as Interval, user!.uid);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: newIncomeAmount,
      diffAmount: 0,
    });
    await editTotalSpendingBudget(nextBudget, user!.uid);
    setTotalSpendingBudget(nextBudget);
    // TODO: FIX THIS
    // setInterval(newInterval as Interval)
    setStep(4);
  }

  function handleFourthStep() {
    if (income) {
      setStep(6);
    } else {
      if (newIncome) {
        setIncome(newIncome);
      }
      setStep(5);
    }
  }

  async function handleFifthStep() {
    console.log("handleFifthStep");
    if (!newIncome) return;
    const diffAmount = newIncome - income;
    await editIncome(newIncome, user!.uid);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, user!.uid);
    setTotalSpendingBudget(nextBudget);
    setIncome(newIncome);
    setStep(6);
  }

  function handleSixthStep() {
    console.log("handleSixthStep");
    if (payments && payments.length > 0) {
      setStep(8);
    } else {
      if (newBills) {
        setPayments(newBills);
      }
      setStep(7);
    }
  }

  async function handleSeventhStep() {
    console.log("handleSeventhStep");
    if (!newBills) return;
    const diffAmount =
      newBills.reduce((acc, bill) => acc + bill.amount, 0) * -1;
    await editPayments(newBills, user!.uid);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, user!.uid);
    setTotalSpendingBudget(nextBudget);
    setPayments(newBills);
    setStep(8);
  }

  function handleEighthStep() {
    console.log("handleEighthStep");
    setStep(9);
  }

  async function handleNinthStep() {
    console.log("handleNinthStep");
    await editIsNewUser(false, user!.uid);
    setIsNewUser(false);
    setStep(10);
    navigate("/");
  }

  if (isLoading) {
    return <Loading text="Loading Demo..." />;
  }

  return (
    <div className="absolute inset-0 z-9990">
      {user && (
        <Header
          links={[
            { label: "Payments", href: "/payments" },
            { label: "Settings", href: "/settings" },
          ]}
          step={step}
        />
      )}
      {showBillAdded && <Popup type="success">Bill added!</Popup>}
      {showBillError && <Popup type="error">Bill name already exists</Popup>}
      <div
        className={`absolute z-9999 left-0 right-0 bottom-0 
            ${step > 1 ? "top-[20vh] h-[80vh]" : "top-0 h-screen"}
            bg-my-black-dark text-center 
            flex flex-col items-center justify-around`}
      >
        {isNewUser && step === 0 ? (
          <SpendBtn onClick={() => setStep(1)} />
        ) : step == 1 ? (
          <>
            <div className="absolute inset-0 bg-my-black-dark opacity-80"></div>
            <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center text-white">
              <h3>Let's get you set up first...</h3>
              <ClosingX text="New Account" onClick={handleFirstStep} />
            </div>
          </>
        ) : step === 2 ? (
          <DemoStep
            onClick={handleSecondStep}
            text="Save Pay Date"
            changeValue={newPayDate}
          >
            <h3 className="text-sm sm:text-lg p-2">
              Here are days remaining til your next paycheck
            </h3>
            <p className="text-sm sm:text-lg">
              Speaking of which, when was{" "}
              <span className="text-my-green-base">your last paycheck?</span>
            </p>
            <div className="text-black rounded-md overflow-hidden border-2">
              <Calendar
                calendarType="gregory"
                onChange={setNewPayDate}
                value={newPayDate || new Date()}
                maxDate={new Date()}
                selectRange={false}
                className="cursor-pointer-calendar"
              />
            </div>
          </DemoStep>
        ) : step === 3 ? (
          <DemoStep
            onClick={handleThirdStep}
            text="Save Schedule"
            changeValue={newInterval}
          >
            <h3 className="text-sm sm:text-lg p-2">
              And how often are you{" "}
              <span className="text-my-green-base">paid?</span>
            </h3>
            <p className="text-sm">
              (Or how often do you want to{" "}
              <span className="text-my-red-light">budget?</span>)
            </p>
            <p className="text-sm">
              Note: If you are paid bi-weekly but want to budget weekly, no
              problem!
            </p>
            <select
              className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
              onChange={(e) => {
                setNewInterval(e.target.value as Interval ?? '');
                console.log(e);
              }} // TODO: FIX THIS e.target.value as Interval)}
              value={newInterval ?? ""}
            >
              <option disabled value="">
                Select
              </option>
              <option value={"WEEKLY"}>Weekly</option>
              <option value={"BIWEEKLY"}>Biweekly</option>
              <option value={"MONTHLY"}>Monthly</option>
              <option value={"YEARLY"}>Yearly</option>
            </select>
          </DemoStep>
        ) : step === 4 ? (
          <DemoStep onClick={handleFourthStep} text="Next" changeValue={true}>
            <h3 className="text-sm sm:text-lg p-2">
              This is your budget until your next{" "}
              <span className="text-my-green-light">paycheck</span>
            </h3>
            <p className="text-sm sm:text-lg">
              It includes <span className="text-my-green-light">$$$</span> from
              all your <span className="text-my-red-light">Nvelopes</span>, and
              any unspent cash as well.
            </p>
          </DemoStep>
        ) : step === 5 ? (
          <DemoStep
            onClick={handleFifthStep}
            text="Save Income"
            changeValue={newIncome}
          >
            <h3 className="text-sm sm:text-lg p-2">
              Now, how much do you make every {transformIntervalMidSentence(newInterval as Interval)}?
            </h3>
            <p className="text-sm sm:text-lg italic">
              Include all household income{" "}
              <span className="text-my-red-light">before expenses.</span>
            </p>
            <input
              className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem]"
              type="number"
              placeholder="Estimated Income"
              value={newIncome?.toString() || ""}
              onChange={(e) => setNewIncome(Number(e.target.value))}
            />
          </DemoStep>
        ) : step === 6 ? (
          <DemoStep onClick={handleSixthStep} text="Next" changeValue={true}>
            <h3 className="text-sm sm:text-lg p-2">
              Time for the final and most exciting step
            </h3>
            <p className="text-sm sm:text-lg">
              Let's add your{" "}
              <span className="text-my-red-light">
                bills <IoIosSad className="inline" size={30} />
              </span>
            </p>
          </DemoStep>
        ) : step === 7 ? (
          <DemoStep
            onClick={handleSeventhStep}
            text="Save Bills"
            changeValue={newBills}
          >
            <p className="text-sm sm:text-lg">
              Add your fixed{" "}
              <span className="text-my-green-base underline">monthly</span>{" "}
              expenses.
            </p>
            <p className="text-sm sm:text-lg">
              Think <span className="text-my-red-light">rent</span>,{" "}
              <span className="text-my-white-base">utilities</span>,{" "}
              <span className="text-my-white-dark">loans</span>, etc.
            </p>
            <p className="text-sm sm:text-lg">
              For everything else we will use{" "}
              <span className="text-my-red-light">Nvelopes</span>
            </p>
            <form className="flex flex-col gap-2 w-full items-center">
              <input
                className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
                type="text"
                placeholder="Bill Name"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value.toLowerCase())}
              />
              <input
                className="bg-white border-2 border-white text-black p-2 rounded-md w-[80%] max-w-[30rem] text-center"
                type="number"
                placeholder="Monthly Amount"
                value={newBillAmount || ""}
                onChange={(e) => setNewBillAmount(Number(e.target.value))}
              />
              <div className="text-black">
                <Calendar
                  calendarType="gregory"
                  onChange={handleCalendarChange}
                  value={newBillOriginalDate || new Date()}
                  selectRange={false}
                  className="cursor-pointer-calendar"
                />
              </div>
              <Button
                onClick={handleClickAddBill}
                color="green"
                children="Add Bill"
              />
            </form>
            <div className="flex flex-col gap-2">
              {newBills.map((bill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{bill.name}</span>
                  <span>${bill.amount}</span>
                </div>
              ))}
            </div>
          </DemoStep>
        ) : step === 8 ? (
          <DemoStep onClick={handleEighthStep} text="Next" changeValue={true}>
            <h3 className="text-sm sm:text-lg p-2">
              Note the balance changed according to your bills
            </h3>
            <p className="text-sm sm:text-lg">
              This is the amount you have left until your next{" "}
              <span className="text-my-green-light">paycheck</span>
            </p>
            <p className="text-sm sm:text-lg">
              And takes into account the{" "}
              <span className="text-my-white-dark">pay period</span> you
              selected earlier.
            </p>
          </DemoStep>
        ) : (
          step === 9 && (
            <DemoStep
              onClick={handleNinthStep}
              text="Let's Go!"
              changeValue={true}
            >
              <h3 className="text-sm sm:text-lg p-2">We're all set up!</h3>
              <p className="text-sm sm:text-lg">
                If you need to make changes later, you can always head to{" "}
                <span className="text-my-green-base">settings</span> in the menu
              </p>
              <p className="text-sm sm:text-lg">
                For now, let's stuff some{" "}
                <span className="text-my-red-light">Nvelopes</span>!
              </p>
            </DemoStep>
          )
        )}
      </div>
    </div>
  );
}
