import { useEffect, useState } from "react";
import Button from "../components/Buttons/Button";
import Header from "../components/Header";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { type BackupData, type Interval } from "../types";
import {
  editIncome,
  editPayPeriodInterval,
  editPayDate,
  editTotalSpendingBudget,
  editRent,
  restoreDataFromBackup,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import signout from "../firebase/signOut";
import { getBackupDataFromTimestampString, getIncomeByInterval, recalculateBudget } from "../util";
import { IoPencil } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import Calendar from "react-calendar";
import { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../constants";
import EditSpendingBudget from "../components/Forms/EditSpendingBudget";
import TextInput from "../components/TextInput";
import FullScreen from "../components/Views/FullScreen";
import CreateLoginWithEmail from "../components/Forms/CreateLoginWithEmail";
import Notification from "../components/Notification";
import { format } from "date-fns";

export default function Settings() {
  const { user } = useAuth();
  const {
    payPeriodInterval,
    rent,
    setRent,
    setIncome,
    setTotalSpendingBudget,
    setPayPeriodInterval,
    totalSpendingBudget,
    income,
    payDate,
    setPayDate,
    setPayments,
    setEnvelopes,
    backups,
  } = useDatabase();

  const [showIntervalSettings, setShowIntervalSettings] =
    useState<boolean>(false);
  const [newIncome, setNewIncome] = useState<string>("");
  const [newInterval, setNewInterval] = useState<Interval | null>(null);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [showEditIncome, setShowEditIncome] = useState(false);
  const [showEditRent, setShowEditRent] = useState(false);
  const [providerType, setProviderType] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [selectedBackupTimestamp, setSelectedBackupTimestamp] = useState("");
  const [backupData, setBackupData] = useState<BackupData>();

  const currentProviderTypes = ["google.com"];

  useEffect(() => {
    if (user) {
      // Check what providers are linked to this user
      user.providerData.forEach((profile) => {
        setProviderType(profile.providerId);
        console.log("Sign-in provider:", profile.providerId);
      });
      // Check if password exists already
      user.providerData.some((provider) => {
        setHasPassword(provider.providerId === "password");
      });
    }
  }, [user]);

  useEffect(() => {
    if (income) setNewIncome(income.toString());
  }, [income]);

  function resetState() {
    setShowIntervalSettings(false);
    setNewIncome("");
    setNewInterval(null);
    setIsEditingCash(false);
    setShowEditIncome(false);
  }

  function handleIntervalChange(interval: Interval) {
    setShowIntervalSettings(true);
    setNewInterval(interval);
  }

  async function handleUpdateInterval() {
    if (!newIncome || !newInterval) return;
    const diffAmount = getIncomeByInterval(
      payPeriodInterval,
      newInterval,
      Number(newIncome)
    );
    setIncome(Number(newIncome));
    setPayPeriodInterval(newInterval);
    await editPayPeriodInterval(newInterval, user!.uid);
    const nextBudget = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(nextBudget, user!.uid);
    setTotalSpendingBudget(nextBudget);
    setShowIntervalSettings(false);
  }

  async function updateIncome() {
    if (!newIncome || !income) return;
    const diffAmount = Number(newIncome) - Number(income);
    const newBal = recalculateBudget({
      currentAvailableBudget: totalSpendingBudget,
      diffAmount,
    });
    await editTotalSpendingBudget(newBal, user!.uid);
    await editIncome(Number(newIncome), user!.uid);
    setTotalSpendingBudget(newBal);
    setIncome(Number(newIncome));
    setShowEditIncome(false);
  }

  async function handlePayDateChange(value: Value) {
    if (value instanceof Date) {
      setPayDate(Timestamp.fromDate(value));
      await editPayDate(value, user!.uid);
      // TODO: recalculate budget based on paydate change
      // This involves checking which bills in the current interval are paid
      // If not paid, and no longer in interval add the amount to budget
      // If paid and no longer in interval - not sure lol
    }
  }

  function handleAddPassword() {
    setHasPassword(true);
  }

  async function handleEditRent() {
    await editRent(rent, user!.uid);
  }

  function handleCloseBackup() {
    setSelectedBackupTimestamp("");
    setBackupData(undefined);
  }

  async function handleRestorePayments() {
    if (!user) return
    const b = await restoreDataFromBackup(selectedBackupTimestamp, user);
    if (!b) return;
      setPayments(b.payments);
      setEnvelopes(b.nvelopes);
      setIncome(Number(b.income));
      setTotalSpendingBudget(Number(b.totalSpendingBudget));
      handleCloseBackup();
  }

  async function handleSelectBackup(ts: string) {
    if (!ts || !backups) return;
    setSelectedBackupTimestamp(ts);
    const b = getBackupDataFromTimestampString(ts, backups)
    setBackupData(b)
  }

  if (isEditingCash) {
    return <EditSpendingBudget handleBack={resetState} />;
  }

  if (showEditIncome)
    return (
      <FullScreen
        showButtons
        onClose={() => setShowEditIncome(false)}
        onSave={updateIncome}
      >
        <div className="flex flex-col items-center justify-center gap-2 max-w-[20rem] m-auto text-center">
          <TextInput
            id="newIncome"
            label="Paycheck Amount"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            textOrNumber="number"
            placeholder="Enter new income"
          />
        </div>
      </FullScreen>
    );

  if (showEditRent)
    return (
      <FullScreen
        showButtons
        onClose={() => setShowEditRent(false)}
        onSave={handleEditRent}
      >
        <div className="flex flex-col items-center justify-center gap-2 max-w-[20rem] m-auto text-center">
          <TextInput
            id="changeRent"
            label="Edit Monthly Rent/Mortage"
            value={rent.toString()}
            placeholder="New Rent Amount"
            onChange={(e) => setRent(Number(e.target.value))}
          />
        </div>
      </FullScreen>
    );

  if (showIntervalSettings) {
    return (
      <div className="absolute inset-0 w-screen h-screen z-100 select-none">
        <div className="flex flex-col bg-my-black-dark w-screen h-screen justify-center items-center ">
          <p className="p-4 rounded-md text-my-white-dark w-full text-center">
            What will your new {newInterval} total budget be?
          </p>
          <input
            type="number"
            className="w-[85%] max-w-[20rem] border p-2 rounded-md my-4 border-my-white-dark bg-my-white-light text-my-black-dark"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            placeholder="Enter new income"
          />
          <div className="flex flex-col items-center gap-4 w-full">
            <Button color="red" onClick={() => setShowIntervalSettings(false)}>
              Cancel
            </Button>
            <Button color="green" onClick={() => handleUpdateInterval()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-scroll bg-my-white-light">
      <Header links={[{ label: "Home", href: "/" }]} />
      <h1 className="text-3xl font-bold mb-4 w-fit m-auto text-my-black-dark text-center p-2 mt-4 rounded-b-md ">
        Settings
      </h1>
      <div className="w-full flex flex-col items-center justify-center">
        You are logged in as {user?.email}
        <Button color="red" onClick={() => signout()}>
          Log Out
        </Button>
      </div>
      <div className="overflow-y-scroll  flex flex-col items-center justify-start py-4  bg-my-white-dark mt-[3rem] border-y-4 border-my-black-dark">
        <div
          className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4"
          onClick={() => setIsEditingCash(true)}
        >
          <IoPencil className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-dark text-my-black-dark p-[2px] border-my-black-dark" />
          <p className="text-sm">Edit Remaining Balance</p>
        </div>
        <div
          className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4"
          onClick={() => setShowEditRent(true)}
        >
          <IoPencil className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-white-dark text-my-black-dark p-[2px] border-my-black-dark" />
          <p className="text-sm">Edit Rent</p>
        </div>
        <div
          className="hover:transform-[scale(1.05)] cursor-pointer flex flex-col justify-between h-[5rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-white-light rounded-md border-2 border-my-white-dark text-my-black-dark animate-glow shadow-lg shadow-my-black-dark mb-4"
          onClick={() => setShowEditIncome(true)}
        >
          <GiMoneyStack className="cursor-pointer border-2 rounded-md w-[2rem] h-[2rem] bg-my-green-dark text-my-white-light p-[2px] border-my-black-dark" />
          <p className="text-sm">Edit Recurring Income</p>
        </div>
        <div className="bg-my-black-base w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center">
          <p className="text-my-white-dark text-center w-full">
            Change Budget Interval
          </p>
          <select
            value={payPeriodInterval ?? ""}
            onChange={(e) =>
              handleIntervalChange(e.target.value.toUpperCase() as Interval)
            }
            className="w-[80%] max-w-[20rem] border-2 bg-my-white-light p-2 rounded-md my-4"
          >
            <option value="" disabled>
              Select Interval
            </option>
            <option value={WEEKLY}>Weekly</option>
            <option value={BIWEEKLY}>Biweekly</option>
            <option value={MONTHLY}>Monthly</option>
            <option value={YEARLY}>Yearly</option>
          </select>
        </div>
        <div className="bg-my-black-base text-my-black-light w-[80%] max-w-[20rem] border-2 p-2 rounded-md my-4 flex flex-col items-center">
          <p className="text-my-white-dark text-center w-full pb-2">
            Change Pay Date
          </p>
          <Calendar
            onChange={handlePayDateChange}
            value={payDate?.toDate() || new Date()}
            calendarType="gregory"
            selectRange={false}
            className="cursor-pointer-calendar"
          />
        </div>

        {/* If the user doesn't yet have a password and has signed in with one of current provider */}
        {currentProviderTypes.includes(providerType) && !hasPassword && (
          <CreateLoginWithEmail onDone={() => handleAddPassword()} />
        )}

        {/* Once account is created simply display email has password */}
        {hasPassword && (
          <Notification text={`Password has been set for ${user?.email}`} />
        )}

        {/* Restore payments from backup */}
        <div className="flex flex-col justify-between h-[6rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-red-dark rounded-md border-2 border-my-white-dark text-my-white-light animate-glow shadow-lg shadow-my-black-dark mb-4">
          <p className="text-sm font-bold">⚠️ Revert To A Backup</p>
          <p className="text-xs">Restores payments and envelopes</p>
          <div>
            <select
              className="py-2 px-4 bg-white rounded-md text-my-black-dark my-2 cursor-pointer"
              onChange={(e) => handleSelectBackup(e.target.value)}
            >
              <option defaultChecked disabled label="Select A Backup" />
              {backups &&
                backups.data &&
                backups.data.length > 0 &&
                backups.data.map((b) => (
                  <option
                    key={b.backupTimeStamp.toString()}
                    label={format(
                      b.backupTimeStamp.toDate(),
                      "MMMM dd, yyyy hh:mm"
                    )}
                    value={b.backupTimeStamp.toString()}
                  />
                ))}
            </select>
          </div>
        </div>
        {backupData && (
          <FullScreen
            theme="DARK"
            onClose={handleCloseBackup}
            onSave={handleRestorePayments}
            showButtons
          >
            <div className="w-full text-center">
              <h1 className="text-xl text-my-red-light">Are you sure?</h1>
              <p>This cannot be undone.</p>
              <p>Your income will reset to {backupData.income} </p>
              <p>Your budget will reset to {backupData.totalSpendingBudget} </p>
              <p>You will have {backupData.payments.length} payments totaling ${backupData.payments.reduce((acc, p) => p.amount + acc, 0).toFixed(2)}</p>
              <p>You will have {backupData.nvelopes.length} envelolpes totaling ${backupData.nvelopes.reduce((acc, p) => p.total + acc, 0).toFixed(2)}</p>
            </div>
          </FullScreen>
        )}
      </div>
    </div>
  );
}
