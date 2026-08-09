/**
 * Nvelopes – Main envelope card grid on the main view.
 * Renders draggable NvelopeCards (swap-to-reorder), and handles give/take between
 * envelopes and opening the selected envelope in BigEnvelope (Views). Parent of
 * DraggableNvelope/NvelopeCard; coordinates drag-and-drop reorder and selection state.
 */
import { useState } from "react";
import type { Envelope } from "../../types";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import { useBudget } from "../../Context/BudgetContext/useBudget";
import { useAuth } from "../../Context/AuthContext/useAuth";
import {
  addTransaction,
  editDatabaseWithTransaction,
  editEnvelopes,
  editTotalSpendingBudget,
} from "../../firebase/editData";
import { createTransactionId } from "../../util";
import { Timestamp } from "firebase/firestore";
import GiveAndTake from "../../Views/GiveAndTake";
import BigEnvelope from "../../Views/BigEnvelope";
import DraggableNvelope from "./DraggableNvelope";
import Loading from "../Loading";

interface NvelopeProps {
  resetState: () => void;
  handleSetupEdit: (envelope: Envelope) => void;
  editEnvelope: (envelope: Envelope) => Promise<void>;
  handleSetShowSpendingPage: (envelope: Envelope) => void;
  handleDeleteEnvelope: (id?: string) => void;
  handleAddCashToEnvelope: (envelope: Envelope) => void;
}

export default function Nvelopes({
  resetState,
  handleSetupEdit,
  editEnvelope,
  handleSetShowSpendingPage,
  handleDeleteEnvelope,
  handleAddCashToEnvelope,
}: NvelopeProps) {
  const {
    totalSpendingBudget,
    setTotalSpendingBudget,
    envelopes,
    setEnvelopes,
  } = useDatabase();
  const { activeBudgetId } = useBudget();
  const { user } = useAuth();

  const [showGiveAndTake, setShowGiveAndTake] = useState(false);
  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
  const [isEnvelopeSelected, setIsEnvelopeSelected] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  function handleBack() {
    setShowGiveAndTake(false);
    setIsEnvelopeSelected(false);
    setEnvelopeToEdit(null);
    resetState();
  }

  async function takeBalanceFromEnvelope(amount?: number) {
    if (!envelopeToEdit || !user || !activeBudgetId) return;
    setLoadingText("Taking...");
    let remainingBalancePlusTotal;
    if (amount) {
      envelopeToEdit.total -= amount;
      remainingBalancePlusTotal = totalSpendingBudget + amount;
    } else {
      remainingBalancePlusTotal =
        totalSpendingBudget + (envelopeToEdit.total - envelopeToEdit.spent);
      envelopeToEdit.total = envelopeToEdit.spent;
    }
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "TAKE",
        description: `Put $${amount} from ${envelopeToEdit.name} back into available funds`,
        nvelopeOrPaymentId: envelopeToEdit.id,
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId,
      func: () => editEnvelope(envelopeToEdit),
    });
    await editTotalSpendingBudget(remainingBalancePlusTotal, activeBudgetId);
    setTotalSpendingBudget(remainingBalancePlusTotal);
    setLoadingText("");
    handleBack();
  }

  async function takeAndGive(envelope: Envelope, amount: number) {
    if (!envelope || !envelopeToEdit || !user || !activeBudgetId) return;
    envelope.total += amount;
    envelopeToEdit.total -= amount;
    const newEnvelopes = [...envelopes];
    const envelopeIndex = newEnvelopes.findIndex((e) => e.id === envelope.id);
    newEnvelopes[envelopeIndex] = envelope;
    const envelopeToEditIndex = newEnvelopes.findIndex(
      (e) => e.id === envelopeToEdit.id
    );
    newEnvelopes[envelopeToEditIndex] = envelopeToEdit;
    await editDatabaseWithTransaction({
      t: {
        id: createTransactionId(user),
        type: "TAKE",
        description: `${user.email ?? user.uid} took $${amount} from "${envelopeToEdit.name}" and put it in "${envelope.name}"`,
        nvelopeOrPaymentId: envelope.id,
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId,
      func: () => editEnvelopes(newEnvelopes, activeBudgetId),
    });
    await addTransaction(
      {
        id: createTransactionId(user),
        type: "GIVE",
        description: `Gave $${amount} to ${envelope.name} from ${envelopeToEdit.name}.`,
        nvelopeOrPaymentId: envelopeToEdit.id,
        createdAt: Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      activeBudgetId
    );
    setEnvelopes(newEnvelopes);
    handleBack();
  }

  function setUpShowGiveAndTake(envelope: Envelope) {
    setShowGiveAndTake(true);
    setEnvelopeToEdit(envelope);
  }

  function handleSelectEnvelope(envelope: Envelope) {
    setIsEnvelopeSelected(true);
    setEnvelopeToEdit(envelope);
  }

  async function handleReorderNvelopes(newEnvelopes: Envelope[]) {
    if (!activeBudgetId) return;
    setEnvelopes(newEnvelopes);
    await editEnvelopes(newEnvelopes, activeBudgetId);
  }

  if (loadingText) return <Loading text={loadingText} />;

  if (showGiveAndTake && envelopeToEdit) {
    return (
      <GiveAndTake
        envelope={envelopeToEdit}
        handleBack={handleBack}
        takeAndGive={takeAndGive}
        takeFromEnvelope={takeBalanceFromEnvelope}
      />
    );
  }

  if (isEnvelopeSelected) {
    return (
      <BigEnvelope
        handleAddCashToEnvelope={handleAddCashToEnvelope}
        handleBack={() => setIsEnvelopeSelected(false)}
        envelope={envelopeToEdit!}
        resetState={resetState}
        handleSetShowSpendingPage={handleSetShowSpendingPage}
        handleSetupEdit={handleSetupEdit}
        setUpShowGiveAndTake={setUpShowGiveAndTake}
        handleDeleteEnvelope={handleDeleteEnvelope}
      />
    );
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-fit">
      {envelopes.length > 0 && (
        <DraggableNvelope
          onReorder={handleReorderNvelopes}
          envelopes={envelopes}
          onPress={handleSelectEnvelope}
        />
      )}
    </div>
  );
}
