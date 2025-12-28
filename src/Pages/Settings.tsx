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
  getSafeBackups,
  restoreFromSafeBackup,
  getLocalStorageBackup,
  restoreFromLocalStorageBackup,
  type LocalStorageBackup,
} from "../firebase/editData";
import { useAuth } from "../Context/AuthContext/useAuth";
import signout from "../firebase/signOut";
import { getIncomeByInterval, recalculateBudget } from "../util";
import { IoPencil } from "react-icons/io5";
import { GiMoneyStack } from "react-icons/gi";
import Calendar from "react-calendar";
import { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";
import { BIWEEKLY, MONTHLY, WEEKLY, YEARLY } from "../constants";
import EditSpendingBudget from "../components/Forms/EditSpendingBudget";
import TextInput from "../components/TextInput";
import FullScreen from "../Views/FullScreen";
import CreateLoginWithEmail from "../components/Forms/CreateLoginWithEmail";
import { format } from "date-fns";
import { useToast } from "../Context/ToastContext/useToast";

export default function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();
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
  
  // Safe backups (stored in separate collection - survives user doc corruption)
  const [safeBackups, setSafeBackups] = useState<Array<BackupData & { id: string }>>([]);
  const [selectedSafeBackup, setSelectedSafeBackup] = useState<(BackupData & { id: string }) | null>(null);
  const [isLoadingSafeBackups, setIsLoadingSafeBackups] = useState(false);
  
  // LocalStorage backup (for undo last restore)
  const [localStorageBackup, setLocalStorageBackup] = useState<LocalStorageBackup | null>(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const currentProviderTypes = ["google.com"];
  
  // Load safe backups and check for localStorage backup on mount
  useEffect(() => {
    if (!user) return;
    async function loadSafeBackups() {
      setIsLoadingSafeBackups(true);
      const backups = await getSafeBackups(user!);
      setSafeBackups(backups as Array<BackupData & { id: string }>);
      setIsLoadingSafeBackups(false);
    }
    loadSafeBackups();
    
    // Check for localStorage backup (undo capability)
    const lsBackup = getLocalStorageBackup();
    setLocalStorageBackup(lsBackup);
  }, [user]);

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
    showToast("Budget interval updated");
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
    showToast("Income updated");
  }

  async function handlePayDateChange(value: Value) {
    if (value instanceof Date) {
      setPayDate(Timestamp.fromDate(value));
      await editPayDate(value, user!.uid);
      showToast("Pay date updated");
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
    showToast("Rent updated");
  }
  
  function handleSelectBackup(backupId: string) {
    const backup = safeBackups.find(b => b.id === backupId);
    if (backup) {
      setSelectedSafeBackup(backup);
    }
  }

  function handleCloseBackup() {
    setSelectedSafeBackup(null);
  }
  
  async function handleRestoreBackup() {
    if (!user || !selectedSafeBackup) return;
    const result = await restoreFromSafeBackup(selectedSafeBackup.id, user);
    if (result) {
      setPayments(result.payments ?? []);
      setEnvelopes(result.nvelopes ?? []);
      setIncome(Number(result.income));
      setTotalSpendingBudget(Number(result.totalSpendingBudget));
      handleCloseBackup();
      // After restore, update localStorage backup state (now available for undo)
      const lsBackup = getLocalStorageBackup();
      setLocalStorageBackup(lsBackup);
      showToast("Backup restored successfully");
    } else {
      showToast("Failed to restore backup", "error");
    }
  }
  
  async function handleUndoRestore() {
    if (!user || !localStorageBackup) return;
    const success = await restoreFromLocalStorageBackup(user);
    if (success) {
      // Update local state with restored values
      const { data } = localStorageBackup;
      setPayments(data.payments ?? []);
      setEnvelopes(data.envelopes ?? []);
      setIncome(Number(data.income));
      setTotalSpendingBudget(Number(data.totalSpendingBudget));
      setRent(Number(data.rent));
      // Clear the localStorage backup state
      setLocalStorageBackup(null);
      setShowUndoConfirm(false);
      showToast("Restore undone successfully");
    } else {
      showToast("Failed to undo restore", "error");
    }
  }

  function resetPasswordForEmail(email: string) {
    console.log('Reset password for email:', email);
    showToast('Feature not implemented yet', 'error');
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
          <div className="w-full bg-my-white-light cursor-pointer flex flex-col justify-center items-center p-2"
              onClick={() => resetPasswordForEmail(user?.email ?? '')}
          >
            <Button color="red" onClick={() => resetPasswordForEmail(user?.email ?? '')}>Reset Password</Button>
            <p className="text-sm">For {user?.email}</p>
          </div>
        )}

        {/* Restore from backup */}
        <div className="flex flex-col justify-between h-[6rem] w-[80%] max-w-[20rem] items-center p-2 bg-my-red-dark rounded-md border-2 border-my-white-dark text-my-white-light animate-glow shadow-lg shadow-my-black-dark my-4">
          <p className="text-sm font-bold">⚠️ Revert To A Backup</p>
          <p className="text-xs">Restores payments and envelopes</p>
          <div>
            {isLoadingSafeBackups ? (
              <p className="text-xs py-2">Loading backups...</p>
            ) : safeBackups.length === 0 ? (
              <p className="text-xs py-2">No backups yet</p>
            ) : (
              <select
                className="py-2 px-4 bg-white rounded-md text-my-black-dark my-2 cursor-pointer"
                onChange={(e) => handleSelectBackup(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select A Backup</option>
                {safeBackups.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                  >
                    {format(b.backupTimeStamp.toDate(), "MMMM dd, yyyy hh:mm")}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {selectedSafeBackup && (
          <FullScreen
            theme="DARK"
            onClose={handleCloseBackup}
            onSave={handleRestoreBackup}
            showButtons
          >
            <div className="w-full text-center">
              <h1 className="text-xl text-my-red-light">Are you sure?</h1>
              <p>You can undo this restore if needed.</p>
              <p>Your income will reset to {selectedSafeBackup.income}</p>
              <p>Your budget will reset to {selectedSafeBackup.totalSpendingBudget}</p>
              <p>You will have {selectedSafeBackup.payments?.length ?? 0} payments totaling ${(selectedSafeBackup.payments ?? []).reduce((acc, p) => p.amount + acc, 0).toFixed(2)}</p>
              <p>You will have {selectedSafeBackup.nvelopes?.length ?? 0} envelopes totaling ${(selectedSafeBackup.nvelopes ?? []).reduce((acc, p) => p.total + acc, 0).toFixed(2)}</p>
            </div>
          </FullScreen>
        )}
        
        {/* Undo Last Restore - only shown when localStorage backup exists */}
        {localStorageBackup && (
          <div 
            className="flex flex-col justify-around h-[6rem] w-[80%] max-w-[20rem] h-fit items-center p-2 bg-my-blue-dark rounded-md border-2 border-my-white-dark text-my-white-light animate-glow shadow-lg shadow-my-black-dark my-4 cursor-pointer hover:bg-my-blue-base gap-2"
            onClick={() => setShowUndoConfirm(true)}
          >
            <p className="text-sm font-bold">Undo Last Restore</p>
            <p className="text-xs">Saved: {new Date(localStorageBackup.timestamp).toLocaleString()}</p>
            <p className="text-xs">{localStorageBackup.data.envelopes?.length ?? 0} envelopes, {localStorageBackup.data.payments?.length ?? 0} payments</p>
            <button className="bg-my-white-dark rounded-md border-2 border-my-black-dark text-my-black-dark p-2 w-[80%]" onClick={() => setShowUndoConfirm(true)}>Undo</button>
          </div>
        )}
        
        {showUndoConfirm && localStorageBackup && (
          <FullScreen
            theme="DARK"
            onClose={() => setShowUndoConfirm(false)}
            onSave={handleUndoRestore}
            showButtons
          >
            <div className="w-full text-center">
              <h1 className="text-xl text-my-blue-light">Undo Last Restore?</h1>
              <p className="mb-4">This will restore your data to the state before the last restore.</p>
              <p>Your income will reset to {localStorageBackup.data.income}</p>
              <p>Your budget will reset to {localStorageBackup.data.totalSpendingBudget}</p>
              <p>You will have {localStorageBackup.data.payments?.length ?? 0} payments</p>
              <p>You will have {localStorageBackup.data.envelopes?.length ?? 0} envelopes</p>
            </div>
          </FullScreen>
        )}
      </div>
    </div>
  );
}
