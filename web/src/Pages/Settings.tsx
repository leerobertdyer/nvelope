import { useEffect, useState } from "react";
import Button from "../../../mobile/src/components/Buttons/Btn";
import Header from "../components/Nav/Header";
import { useDatabase } from "../Context/DatabaseContext/useDatabase";
import { useBudget } from "../Context/BudgetContext/useBudget";
import { type BackupData, type Interval } from "../types";
import {
  editIsNewUser,
  editPayPeriodInterval,
  editPayDate,
  editTotalSpendingBudget,
  getSafeBackups,
  restoreFromSafeBackup,
  getAsyncStorageBackup,
  restoreFromAsyncStorageBackup,
  type LocalStorageBackup,
} from "../firebase/editData";
import {
  createBudget,
  getBudgetMeta,
  deleteBudgetAsOwner,
  leaveBudget,
  removeMemberFromBudget,
  addInviteToBudget,
  updateBudgetName,
} from "../firebase/budgets";
import { useAuth } from "../Context/AuthContext/useAuth";
import signout from "../firebase/signOut";
import { deleteAccount } from "../firebase/deleteAccount";
import { sendPasswordResetEmailToUser } from "../firebase/emailAndPassword";
import { Timestamp } from "firebase/firestore";
import type { Value } from "react-calendar/src/shared/types.js";
import MoneyInput from "../components/MoneyInput";
import EditSpendingBudget from "../components/Forms/EditSpendingBudget";
import BudgetSettingsFields from "../components/Forms/BudgetSettingsFields";
import TextInput from "../../../mobile/src/components/Input";
import FullScreen from "../Views/FullScreen";
import CreateLoginWithEmail from "../components/Forms/CreateLoginWithEmail";
import { format } from "date-fns";
import { useToast } from "../Context/ToastContext/useToast";
import type { User } from "firebase/auth";
import { IoTrash } from "react-icons/io5";
import PageTour from "../../../mobile/src/components/PageTour";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export default function Settings() {
  const { user } = useAuth();
  const { activeBudgetId, budgets, setActiveBudgetId, refetchBudgets } =
    useBudget();
  const { showToast } = useToast();
  const {
    payPeriodInterval,
    setTotalSpendingBudget,
    setPayPeriodInterval,
    totalSpendingBudget,
    payDate,
    setPayDate,
    setPayments,
    setEnvelopes,
    isNewUser,
    setIsNewUser,
  } = useDatabase();

  const [showIntervalSettings, setShowIntervalSettings] =
    useState<boolean>(false);
  const [newIntervalBudgetAmount, setNewIntervalBudgetAmount] = useState<string>("");
  const [newInterval, setNewInterval] = useState<Interval | null>(null);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [providerType, setProviderType] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [showBudgets, setShowBudgets] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showShareBudgetModal, setShowShareBudgetModal] = useState(false);

  // Safe backups (stored in separate collection - survives user doc corruption)
  const [safeBackups, setSafeBackups] = useState<
    Array<BackupData & { id: string }>
  >([]);
  const [selectedSafeBackup, setSelectedSafeBackup] = useState<
    (BackupData & { id: string }) | null
  >(null);
  const [isLoadingSafeBackups, setIsLoadingSafeBackups] = useState(false);

  // LocalStorage backup (for undo last restore)
  const [localStorageBackup, setLocalStorageBackup] =
    useState<LocalStorageBackup | null>(null);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  // Delete account
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePasswordStep, setDeletePasswordStep] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Budget management (create, share, delete, leave, members)
  const [budgetMeta, setBudgetMeta] = useState<{
    name: string;
    ownerId: string;
    memberIds: string[];
    memberEmails?: Record<string, string>;
  } | null>(null);
  const [editingBudgetName, setEditingBudgetName] = useState(false);
  const [budgetNameInput, setBudgetNameInput] = useState("");
  const [isSavingBudgetName, setIsSavingBudgetName] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [isLoadingBudgetMeta, setIsLoadingBudgetMeta] = useState(false);
  const [showDeleteBudgetConfirm, setShowDeleteBudgetConfirm] = useState(false);
  const [showLeaveBudgetConfirm, setShowLeaveBudgetConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);
  const [isLeavingBudget, setIsLeavingBudget] = useState(false);
  const [newBudgetPayDate, setNewBudgetPayDate] = useState<Date | null>(null);
  const [newBudgetInterval, setNewBudgetInterval] = useState<Interval | null>(
    null,
  );
  const [showCreateBudgetModal, setShowCreateBudgetModal] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);

  const currentProviderTypes = ["google.com"];
  const isOwner = user && budgetMeta && budgetMeta.ownerId === user.uid;
  const isMember =
    user && budgetMeta && budgetMeta.memberIds.includes(user.uid) && !isOwner;

  // Load safe backups for active budget and check for localStorage backup
  useEffect(() => {
    if (!user || !activeBudgetId) return;
    const budgetId = activeBudgetId;
    async function loadSafeBackups() {
      setIsLoadingSafeBackups(true);
      const backups = await getSafeBackups(user!, budgetId);
      setSafeBackups(backups as Array<BackupData & { id: string }>);
      setIsLoadingSafeBackups(false);
    }
    loadSafeBackups();
    const lsBackup = getAsyncStorageBackup();
    setLocalStorageBackup(lsBackup);
  }, [user, activeBudgetId]);

  // Fresh fetch of available budgets when Settings is shown so "Select A Budget" dropdown is current (e.g. after being removed from a shared budget)
  useEffect(() => {
    refetchBudgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load budget meta for active budget (for share/delete/members)
  useEffect(() => {
    if (!activeBudgetId) {
      setBudgetMeta(null);
      return;
    }
    let cancelled = false;
    setIsLoadingBudgetMeta(true);
    getBudgetMeta(activeBudgetId).then((meta) => {
      if (!cancelled && meta)
        setBudgetMeta({
          name: meta.name,
          ownerId: meta.ownerId,
          memberIds: meta.memberIds,
          memberEmails: meta.memberEmails,
        });
      else if (!cancelled) setBudgetMeta(null);
      setIsLoadingBudgetMeta(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeBudgetId]);

  useEffect(() => {
    if (user) {
      // Check what providers are linked to this user
      user.providerData.forEach((profile) => {
        setProviderType(profile.providerId);
      });
      // Check if password exists already
      user.providerData.some((provider) => {
        setHasPassword(provider.providerId === "password");
      });
    }
  }, [user]);

  function resetState() {
    setShowIntervalSettings(false);
    setNewIntervalBudgetAmount("");
    setNewInterval(null);
    setIsEditingCash(false);
  }

  function handleIntervalChange(interval: Interval) {
    setShowIntervalSettings(true);
    setNewInterval(interval);
    setNewIntervalBudgetAmount(totalSpendingBudget.toString());
  }

  async function handleUpdateInterval() {
    if (!newIntervalBudgetAmount || !newInterval) return;
    try {
      const nextBudget = Number(newIntervalBudgetAmount);
      setPayPeriodInterval(newInterval);
      if (!activeBudgetId) return;
      await editPayPeriodInterval(newInterval, activeBudgetId);
      await editTotalSpendingBudget(nextBudget, activeBudgetId);
      setTotalSpendingBudget(nextBudget);
      setShowIntervalSettings(false);
      showToast("Budget interval updated");
    } catch (e) {
      console.error("Error updating budget interval", e);
      showToast("Failed to update budget interval", "error");
    }
  }

  async function handlePayDateChange(value: Value) {
    if (value instanceof Date) {
      try {
        setPayDate(Timestamp.fromDate(value));
        if (!activeBudgetId) return;
        await editPayDate(value, activeBudgetId);
        showToast("Pay date updated");
        // TODO: recalculate budget based on paydate change
        // This involves checking which bills in the current interval are paid
        // If not paid, and no longer in interval add the amount to budget
        // If paid and no longer in interval - not sure lol
      } catch (e) {
        console.error("Error updating pay date", e);
        showToast("Failed to update pay date", "error");
      }
    }
  }

  function handleAddPassword() {
    setHasPassword(true);
  }

  function handleSelectBackup(backupId: string) {
    const backup = safeBackups.find((b) => b.id === backupId);
    if (backup) {
      setSelectedSafeBackup(backup);
    }
  }

  function handleCloseBackup() {
    setSelectedSafeBackup(null);
  }

  async function handleRestoreBackup() {
    if (!user || !selectedSafeBackup) return;
    if (!activeBudgetId) return;
    const result = await restoreFromSafeBackup(
      selectedSafeBackup.id,
      user,
      activeBudgetId,
    );
    if (result) {
      setPayments(result.payments ?? []);
      setEnvelopes(result.nvelopes ?? []);
      setTotalSpendingBudget(Number(result.totalSpendingBudget));
      handleCloseBackup();
      // After restore, update localStorage backup state (now available for undo)
      const lsBackup = getAsyncStorageBackup();
      setLocalStorageBackup(lsBackup);
      showToast("Backup restored successfully");
    } else {
      showToast("Failed to restore backup", "error");
    }
  }

  async function handleUndoRestore() {
    if (!user || !localStorageBackup || !activeBudgetId) return;
    const success = await restoreFromAsyncStorageBackup(user, activeBudgetId);
    if (success) {
      // Update local state with restored values
      const { data } = localStorageBackup;
      setPayments(data.payments ?? []);
      setEnvelopes(data.envelopes ?? []);
      setTotalSpendingBudget(Number(data.totalSpendingBudget));
      // Clear the localStorage backup state
      setLocalStorageBackup(null);
      setShowUndoConfirm(false);
      showToast("Restore undone successfully");
    } else {
      showToast("Failed to undo restore", "error");
    }
  }

  async function handleDeleteAccount(password?: string) {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount(password ? { password } : undefined);
      if (result.success) {
        setShowDeleteAccountConfirm(false);
        setDeletePasswordStep(false);
        setDeletePassword("");
        window.location.href = "/";
        return;
      }
      if ("needPassword" in result && result.needPassword) {
        setDeletePasswordStep(true);
        return;
      }
      showToast(result.error, "error");
      // If they were on the password step (wrong password, etc.), keep modal open so they can try again or cancel.
      if (!password) {
        setShowDeleteAccountConfirm(false);
        setDeletePasswordStep(false);
        setDeletePassword("");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  }

  async function resetPasswordForEmail(email: string) {
    if (!email?.trim()) {
      showToast("No email address", "error");
      return;
    }
    try {
      await sendPasswordResetEmailToUser(email.trim());
      showToast("Password reset email sent. Check your inbox.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email";
      showToast(message, "error");
    }
  }

  async function handleCreateBudget(): Promise<boolean> {
    if (!user || !newBudgetPayDate || !newBudgetInterval) return false;
    const name = newBudgetName.trim() || `${user.email}'s Budget`;
    setIsCreatingBudget(true);
    try {
      const budgetId = await createBudget(
        user,
        name,
        newBudgetPayDate,
        newBudgetInterval,
      );
      if (budgetId) {
        setNewBudgetName("");
        setNewBudgetPayDate(null);
        setNewBudgetInterval(null);
        await refetchBudgets();
        setActiveBudgetId(budgetId);
        showToast(`Budget "${name}" created`);
        return true;
      } else {
        showToast("Failed to create budget", "error");
        return false;
      }
    } finally {
      setIsCreatingBudget(false);
    }
  }

  async function handleInvite() {
    if (!user || !activeBudgetId || !shareEmail.trim()) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    const toEmail = shareEmail.trim();
    const budgetName = budgets.find((b) => b.id === activeBudgetId)?.name ?? "Budget";
    try {
      const ok = await addInviteToBudget(
        activeBudgetId,
        toEmail,
        user.uid,
        user.email ?? "",
      );
      if (ok) {
        setShareEmail("");
        if (SERVER_URL) {
          try {
            await fetch(`${SERVER_URL}/nvelopes/invite`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                toEmail: toEmail.toLowerCase(),
                inviterEmail: user.email ?? "",
                budgetName,
              }),
            });
          } catch (e) {
            console.error("Failed to send invite email", e);
          }
        }
        showToast(
          `Invite sent to ${toEmail}. They'll receive an email with a link to open or sign up for Nvelopes.`,
        );
      } else {
        showToast("Failed to send invite", "error");
      }
    } finally {
      setShowShareBudgetModal(false);
    }
  }

  async function handleDeleteBudgetConfirm() {
    if (!user || !activeBudgetId) return;
    setIsDeletingBudget(true);
    try {
      const ok = await deleteBudgetAsOwner(user.uid, activeBudgetId);
      setShowDeleteBudgetConfirm(false);
      if (ok) {
        await refetchBudgets();
        const next = budgets.find((b) => b.id !== activeBudgetId)?.id ?? null;
        setActiveBudgetId(next);
        showToast("Budget deleted");
      } else {
        showToast("Failed to delete budget", "error");
      }
    } finally {
      setIsDeletingBudget(false);
    }
  }

  async function handleLeaveBudgetConfirm() {
    if (!user || !activeBudgetId) return;
    setIsLeavingBudget(true);
    try {
      const ok = await leaveBudget(user.uid, activeBudgetId);
      setShowLeaveBudgetConfirm(false);
      if (ok) {
        await refetchBudgets();
        const next = budgets.find((b) => b.id !== activeBudgetId)?.id ?? null;
        setActiveBudgetId(next);
        showToast("You left the budget");
      } else {
        showToast("Failed to leave budget", "error");
      }
    } finally {
      setIsLeavingBudget(false);
    }
  }

  async function handleRemoveMemberConfirm() {
    if (!user || !activeBudgetId || !memberToRemove) return;
    try {
      const ok = await removeMemberFromBudget(
        user.uid,
        activeBudgetId,
        memberToRemove,
      );
      setMemberToRemove(null);
      if (ok) {
        const meta = await getBudgetMeta(activeBudgetId);
        if (meta)
          setBudgetMeta({
            name: meta.name,
            ownerId: meta.ownerId,
            memberIds: meta.memberIds,
            memberEmails: meta.memberEmails,
          });
        showToast("Member removed");
      } else {
        showToast("Failed to remove member", "error");
      }
    } catch {
      showToast("Failed to remove member", "error");
    }
  }

  async function handleSaveBudgetName() {
    if (!user || !activeBudgetId || !budgetNameInput.trim()) return;
    setIsSavingBudgetName(true);
    try {
      const ok = await updateBudgetName(
        activeBudgetId,
        user.uid,
        budgetNameInput.trim(),
      );
      if (ok) {
        const meta = await getBudgetMeta(activeBudgetId);
        if (meta)
          setBudgetMeta({
            name: meta.name,
            ownerId: meta.ownerId,
            memberIds: meta.memberIds,
            memberEmails: meta.memberEmails,
          });
        await refetchBudgets();
        setEditingBudgetName(false);
        setBudgetNameInput("");
        showToast("Budget name updated");
      } else {
        showToast("Failed to update budget name", "error");
      }
    } finally {
      setIsSavingBudgetName(false);
    }
  }

  function SettingsButton({ text }: { text: string }) {
    return (
      <button
        className="p-2 cursor-pointer text-my-blue-dark"
        onPress={() => {
          switch (text.toLowerCase()) {
            case "budgets":
              setShowAccountSettings(false);
              setShowBudgets(true);
              break;
            case "account":
              setShowBudgets(false);
              setShowAccountSettings(true);
              break;
          }
        }}
      >
        {text}
      </button>
    );
  }

  function LogoutButton({
    user,
    onPress,
  }: {
    user: User;
    onPress: () => void;
  }) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-xs sm:text-sm md:text-lg mb-10">
        You are logged in as{" "}
        <span className="text-my-blue-dark">{user?.email}</span>
        <Button color="red" onPress={onPress}>
          Log Out
        </Button>
      </div>
    );
  }

  function DeleteAccountButton() {
    {
      /* Delete Account — only path to account deletion: this block opens the confirm modal; confirmation is the only trigger for handleDeleteAccount. */
    }
    return (
      <div
        className="flex flex-col justify-center h-fit w-[80%] max-w-[20rem] items-center p-4 bg-my-black-dark rounded-md border-2 border-my-red-dark text-my-white-light my-8 cursor-pointer hover:opacity-90"
        onPress={() => {
          setShowDeleteAccountConfirm(true);
          setDeletePasswordStep(false);
          setDeletePassword("");
        }}
      >
        <p className="text-sm font-bold text-my-red-light">Delete Account</p>
        <p className="text-xs text-my-white-dark mt-1">
          Permanently delete your account and all data
        </p>
      </div>
    );
  }

  function BackupSelectionScreen() {
    return (
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
              <option value="" disabled>
                Select A Backup
              </option>
              {safeBackups.map((b) => (
                <option key={b.id} value={b.id}>
                  {format(b.backupTimeStamp.toDate(), "MMMM dd, yyyy hh:mm")}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  function BackupSelectionConfirmScreen() {
    if (!selectedSafeBackup) return null;
    return (
      <FullScreen
        theme="DARK"
        onClose={handleCloseBackup}
        onSave={handleRestoreBackup}
        showButtons
      >
        <div className="w-full text-center">
          <h1 className="text-xl text-my-red-light">Are you sure?</h1>
          <p>You can undo this restore if needed.</p>
          <p>
            Your budget will reset to {selectedSafeBackup.totalSpendingBudget}
          </p>
          <p>
            You will have {selectedSafeBackup.payments?.length ?? 0} payments
            totaling $
            {(selectedSafeBackup.payments ?? [])
              .reduce((acc, p) => p.amount + acc, 0)
              .toFixed(2)}
          </p>
          <p>
            You will have {selectedSafeBackup.nvelopes?.length ?? 0} envelopes
            totaling $
            {(selectedSafeBackup.nvelopes ?? [])
              .reduce((acc, p) => p.total + acc, 0)
              .toFixed(2)}
          </p>
        </div>
      </FullScreen>
    );
  }

  function UndoLastRestoreScreen() {
    if (!localStorageBackup) return null;
    return (
      <div
        className="flex flex-col justify-around h-[6rem] w-[80%] max-w-[20rem] h-fit items-center p-2 bg-my-blue-dark rounded-md border-2 border-my-white-dark text-my-white-light animate-glow shadow-lg shadow-my-black-dark my-4 cursor-pointer hover:bg-my-blue-base gap-2"
        onPress={() => setShowUndoConfirm(true)}
      >
        <p className="text-sm font-bold">Undo Last Restore</p>
        <p className="text-xs">
          Saved: {new Date(localStorageBackup.timestamp).toLocaleString()}
        </p>
        <p className="text-xs">
          {localStorageBackup.data.envelopes?.length ?? 0} envelopes,{" "}
          {localStorageBackup.data.payments?.length ?? 0} payments
        </p>
        <button
          className="bg-my-white-dark rounded-md border-2 border-my-black-dark text-my-black-dark p-2 w-[80%]"
          onPress={() => setShowUndoConfirm(true)}
        >
          Undo
        </button>
      </div>
    );
  }

  if (isEditingCash) {
    return <EditSpendingBudget handleBack={resetState} />;
  }

  if (showCreateBudgetModal)
    return (
      <FullScreen
        showButtons
        onClose={() => setShowCreateBudgetModal(false)}
        onSave={async () => {
          const ok = await handleCreateBudget();
          if (ok) setShowCreateBudgetModal(false);
        }}
        closeOnSave={false}
        saveButtonDisabled={
          isCreatingBudget || !newBudgetPayDate || !newBudgetInterval
        }
      >
        <div className="flex flex-col items-center gap-4 w-full text-center">
          <TextInput
            id="new-budget-name"
            label="New budget name"
            placeholder="e.g. Household"
            value={newBudgetName}
            onChange={(e) => setNewBudgetName(e.target.value)}
          />
          <BudgetSettingsFields
            mode="create"
            intervalValue={newBudgetInterval}
            onIntervalChange={(v) => setNewBudgetInterval(v)}
            payDateValue={newBudgetPayDate}
            onPayDateChange={(v: Value) =>
              setNewBudgetPayDate(
                v instanceof Date
                  ? v
                  : Array.isArray(v) && v[0] instanceof Date
                    ? v[0]
                    : null,
              )
            }
            intervalLabel="Pay period interval"
          />
        </div>
      </FullScreen>
    );

  if (showEditBudgetModal)
    return (
      <FullScreen
        showButtons
        onClose={() => setShowEditBudgetModal(false)}
        closeOnSave={true}
        saveButtonText="Done"
        onSave={() => setShowEditBudgetModal(false)}
      >
        <div className="flex flex-col items-center gap-4 w-full text-center">
          <BudgetSettingsFields
            mode="edit"
            intervalValue={payPeriodInterval}
            onIntervalChange={handleIntervalChange}
            payDateValue={payDate?.toDate() ?? null}
            onPayDateChange={handlePayDateChange}
            onEditRemainingBalance={() => {
              setShowEditBudgetModal(false);
              setIsEditingCash(true);
            }}
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
          <MoneyInput
            id="newIntervalBudgetAmount"
            label=""
            value={Number(newIntervalBudgetAmount) || 0}
            onChange={(d) => setNewIntervalBudgetAmount(d.toString())}
            placeholder="New budget amount"
          />
          <div className="flex flex-col items-center gap-4 w-full">
            <Button color="red" onPress={() => setShowIntervalSettings(false)}>
              Cancel
            </Button>
            <Button color="green" onPress={() => handleUpdateInterval()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-y-scroll bg-my-white-light">
      <PageTour
        visible={isNewUser}
        onDismiss={async () => {
          if (activeBudgetId) {
            await editIsNewUser(false, activeBudgetId);
            setIsNewUser(false);
          }
        }}
      >
        <p>
          Set pay date and budget interval here when you want to adjust. You can also manage budgets, backups, and account options.
        </p>
      </PageTour>
      <Header
        links={[
          { label: "Home", href: "/" },
          { label: "Debt", href: "/debt" },
          { label: "Bills", href: "/bills" },
          { label: "Feedback", href: "/feedback" },
        ]}
      />
      <h1 className="text-3xl font-bold mb-4 w-fit m-auto text-my-black-dark text-center p-2 mt-4 rounded-b-md ">
        Settings
      </h1>
      <div className="w-full flex justify-center items-center gap-4 mb-4">
        <SettingsButton text="Budgets" />
        <SettingsButton text="Account" />
      </div>
      {/* Budgets: name, members, switcher, create, share, edit, delete/leave */}
      {showBudgets && (
        <div className="w-full flex flex-col items-center gap-2 mt-4 py-[1rem]">
          {activeBudgetId && !isLoadingBudgetMeta && budgetMeta && (
            <>
              <div className="w-full flex flex-col items-center gap-1 max-w-[20rem]">
                <p className="text-my-black-light text-xs text-center">Budget name</p>
                {isOwner ? (
                  editingBudgetName ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <TextInput
                        id="budget-name-edit"
                        label=""
                        placeholder="Budget name"
                        value={budgetNameInput}
                        onChange={(e) => setBudgetNameInput(e.target.value)}
                      />
                      <Button
                        color="green"
                        onPress={handleSaveBudgetName}
                        disabled={isSavingBudgetName || !budgetNameInput.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        color="red"
                        onPress={() => {
                          setEditingBudgetName(false);
                          setBudgetNameInput("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-my-black-dark font-medium">{budgetMeta.name}</span>
                      <button
                        type="button"
                        className="p-1 text-my-blue-dark hover:underline text-sm"
                        onPress={() => {
                          setBudgetNameInput(budgetMeta.name);
                          setEditingBudgetName(true);
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-my-black-dark font-medium">{budgetMeta.name}</span>
                )}
              </div>

              {isOwner &&
                budgetMeta.memberIds.filter((id) => id !== budgetMeta.ownerId)
                  .length > 0 && (
                  <div className="w-full max-w-[20rem] flex flex-col gap-1 bg-my-black-base rounded-md p-2 text-my-white-light">
                    <p className="text-xs text-center">{budgetMeta.name} Members</p>
                    <ul className="list-none">
                      {budgetMeta.memberIds
                        .filter((id) => id !== budgetMeta.ownerId)
                        .map((mid) => (
                          <li
                            key={mid}
                            className="flex flex-row items-center justify-between gap-2 py-1 text-my-white-dark text-sm"
                          >
                            <span title={mid}>
                              {budgetMeta.memberEmails?.[mid] ?? mid.slice(0, 8) + "…"}
                            </span>
                            <button
                              type="button"
                              className="p-1.5 text-my-red-light hover:bg-my-white-dark rounded"
                              onPress={() => setMemberToRemove(mid)}
                              title="Remove member"
                            >
                              <IoTrash size={18} />
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
            </>
          )}

          {budgets.length >= 1 && (
            <div className="w-full flex flex-col items-center gap-2">
              <label htmlFor="budget-switcher" className="text-xs">
                Select A Budget
              </label>
              <select
                id="budget-switcher"
                value={activeBudgetId ?? ""}
                onChange={(e) => setActiveBudgetId(e.target.value || null)}
                className="bg-my-white-light border-2 border-my-white-dark rounded-md px-3 py-2 text-my-black-dark max-w-[20rem] w-[80%]"
              >
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button color="gold" onPress={() => setShowCreateBudgetModal(true)}>
            Create new budget
          </Button>
          {activeBudgetId && !isLoadingBudgetMeta && budgetMeta && (
            <>
              {isOwner && (
                <Button
                  color="green"
                  onPress={() => setShowShareBudgetModal(true)}
                >
                  Share budget
                </Button>
              )}
              {isOwner && (
                <Button
                  color="gold"
                  onPress={() => setShowEditBudgetModal(true)}
                >
                  Edit budget
                </Button>
              )}
              {isOwner && showShareBudgetModal && (
                <FullScreen
                  theme="LIGHT"
                  onSave={handleInvite}
                  saveButtonText="Share"
                  onClose={() => setShowShareBudgetModal(false)}
                  showButtons
                >
                  <div className="w-full flex flex-col gap-2 flex flex-col items-center justify-center">
                    <TextInput
                      id="Email to share with"
                      label="Share budget by email"
                      placeholder="email@example.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                  </div>
                </FullScreen>
              )}
              {isOwner && (
                <Button
                  color="red"
                  onPress={() => setShowDeleteBudgetConfirm(true)}
                >
                  Delete this budget
                </Button>
              )}
              {isMember && (
                <Button
                  color="red"
                  onPress={() => setShowLeaveBudgetConfirm(true)}
                >
                  Leave this budget
                </Button>
              )}
            </>
          )}
        </div>
      )}
      <div className="overflow-y-scroll  flex flex-col items-center justify-start py-4  bg-my-white-dark mt-[3rem] border-y-4 border-my-black-dark">
      <LogoutButton user={user!} onPress={() => signout()} />
        
        {showBudgets && (
          <>
            <BackupSelectionScreen />
            <BackupSelectionConfirmScreen />
            <UndoLastRestoreScreen />

            {showUndoConfirm && localStorageBackup && (
              <FullScreen
                theme="DARK"
                onClose={() => setShowUndoConfirm(false)}
                onSave={handleUndoRestore}
                showButtons
              >
                <div className="w-full text-center">
                  <h1 className="text-xl text-my-blue-light">
                    Undo Last Restore?
                  </h1>
                  <p className="mb-4">
                    This will restore your data to the state before the last
                    restore.
                  </p>
                  <p>
                    Your budget will reset to{" "}
                    {localStorageBackup.data.totalSpendingBudget}
                  </p>
                  <p>
                    You will have{" "}
                    {localStorageBackup.data.payments?.length ?? 0} payments
                  </p>
                  <p>
                    You will have{" "}
                    {localStorageBackup.data.envelopes?.length ?? 0} envelopes
                  </p>
                </div>
              </FullScreen>
            )}

            {showDeleteBudgetConfirm && (
              <FullScreen
                theme="DARK"
                closeOnSave={false}
                onClose={() => setShowDeleteBudgetConfirm(false)}
                onSave={handleDeleteBudgetConfirm}
                showButtons
                saveButtonText="Delete budget"
                saveButtonColor="red"
                closeButtonText="Cancel"
                saveButtonDisabled={isDeletingBudget}
              >
                <div className="text-center">
                  <h1 className="text-xl text-my-red-light mb-2">
                    Delete this budget?
                  </h1>
                  <p className="text-my-white-light">
                    All data (envelopes, payments) will be permanently deleted.
                    All members will lose access. This cannot be undone.
                  </p>
                  {isDeletingBudget && (
                    <p className="text-my-white-dark text-sm mt-4">Deleting…</p>
                  )}
                </div>
              </FullScreen>
            )}

            {showLeaveBudgetConfirm && (
              <FullScreen
                theme="DARK"
                closeOnSave={false}
                onClose={() => setShowLeaveBudgetConfirm(false)}
                onSave={handleLeaveBudgetConfirm}
                showButtons
                saveButtonText="Leave budget"
                saveButtonColor="red"
                closeButtonText="Cancel"
                saveButtonDisabled={isLeavingBudget}
              >
                <div className="text-center">
                  <h1 className="text-xl text-my-red-light mb-2">
                    Leave this budget?
                  </h1>
                  <p className="text-my-white-light">
                    You will no longer see or edit this budget. Your data
                    elsewhere is unaffected.
                  </p>
                  {isLeavingBudget && (
                    <p className="text-my-white-dark text-sm mt-4">Leaving…</p>
                  )}
                </div>
              </FullScreen>
            )}

            {memberToRemove && (
              <FullScreen
                theme="DARK"
                onClose={() => setMemberToRemove(null)}
                onSave={handleRemoveMemberConfirm}
                showButtons
                saveButtonText="Remove member"
                saveButtonColor="red"
                closeButtonText="Cancel"
              >
                <div className="text-center">
                  <h1 className="text-xl text-my-red-light mb-2">
                    Remove this member?
                  </h1>
                  <p className="text-my-white-light">
                    They will lose access to this budget.
                  </p>
                </div>
              </FullScreen>
            )}
          </>
        )}

        {user && showAccountSettings && (
          <>
            {/* If the user doesn't yet have a password and has signed in with one of current provider */}
            {currentProviderTypes.includes(providerType) && !hasPassword && (
              <CreateLoginWithEmail onDone={() => handleAddPassword()} />
            )}

            {/* Once account is created simply display email has password */}
            {hasPassword && (
              <Button
                color="red"
                onPress={() => resetPasswordForEmail(user?.email ?? "")}
              >
                Reset Password
              </Button>
            )}
            <DeleteAccountButton />
          </>
        )}
      </div>

      {showDeleteAccountConfirm && (
        <FullScreen
          theme="DARK"
          closeOnSave={false}
          onClose={() => {
            if (!isDeletingAccount) {
              setShowDeleteAccountConfirm(false);
              setDeletePasswordStep(false);
              setDeletePassword("");
            }
          }}
          onSave={() =>
            handleDeleteAccount(deletePasswordStep ? deletePassword : undefined)
          }
          showButtons
          saveButtonText="Delete account"
          saveButtonColor="red"
          closeButtonText="Cancel"
          saveButtonDisabled={
            isDeletingAccount || (deletePasswordStep && !deletePassword.trim())
          }
        >
          <div className="w-full text-center">
            {!deletePasswordStep ? (
              <div className="flex flex-col items-center justify-center w-full">
                <h1 className="text-xl text-my-red-light font-bold mb-4">
                  Are you sure?
                </h1>
                <p className="text-my-white-light mb-2">
                  This will permanently delete your account and all your data
                  (envelopes, payments, backups).
                </p>
                <p className="text-my-white-dark text-sm">
                  This cannot be undone.
                </p>
                <p className="text-my-white-dark text-sm mt-4">
                  To confirm, you may see a Google sign-in window or be asked
                  for your password, depending on how you signed up.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                <h1 className="text-xl text-my-red-light font-bold mb-4">
                  Enter your password
                </h1>
                <p className="text-my-white-light mb-2">
                  Confirm your identity to delete your account.
                </p>
                <TextInput
                  id="deletePassword"
                  label="Password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
            )}
            {isDeletingAccount && (
              <p className="text-my-white-dark text-sm mt-4">Deleting…</p>
            )}
          </div>
        </FullScreen>
      )}
    </div>
  );
}
