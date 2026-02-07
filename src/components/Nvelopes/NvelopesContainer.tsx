/**
 * Nvelopes – Main envelope list container on the main view.
 * Renders the envelope section header (Nvelope / Remaining / Total), uses ListEnvelope
 * for each envelope row, and handles give/take between envelopes and opening the
 * selected envelope in BigEnvelope (Views). Parent of ListEnvelope; coordinates
 * drag-and-drop reorder and selection state.
 */
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import type { Envelope } from "../../types";
import {
  editEnvelopes,
  editTotalSpendingBudget,
} from "../../firebase/editData";
import { useBudget } from "../../Context/BudgetContext/useBudget";
import { useEffect, useState } from "react";
import GiveAndTake from "../../Views/GiveAndTake";
import ListEnvelope from "./NvelopeListRow";
import BigEnvelope from "../../Views/BigEnvelope";
import ShowHideButton from "../Buttons/ShowHideButton";

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
  const [showGiveAndTake, setShowGiveAndTake] = useState(false);
  const [envelopeToEdit, setEnvelopeToEdit] = useState<Envelope | null>(null);
  const [isEnvelopeSelected, setIsEnvelopeSelected] = useState(false);
  const [sortedEnvelopes, setSortedEnvelopes] = useState<Envelope[]>([]);
  const [showEnvelopes, setShowEnvelopes] = useState(true);

  useEffect(() => {
    const stupidLargeNumber = 1000;
    const sorted = [...envelopes].sort(
      (a, b) => (a.order || stupidLargeNumber) - (b.order || stupidLargeNumber),
    );
    setSortedEnvelopes(sorted);
  }, [envelopes]);

  function handleBack() {
    setShowGiveAndTake(false);
    setIsEnvelopeSelected(false);
    setEnvelopeToEdit(null);
    resetState();
  }

  async function takeBalanceFromEnvelope(amount?: number) {
    if (!envelopeToEdit) return;
    let remainingBalancePlusTotal;
    if (amount) {
      envelopeToEdit.total -= amount;
      remainingBalancePlusTotal = totalSpendingBudget + amount;
    } else {
      remainingBalancePlusTotal =
        totalSpendingBudget + (envelopeToEdit.total - envelopeToEdit.spent);
      envelopeToEdit.total = envelopeToEdit.spent;
    }
    await editEnvelope(envelopeToEdit);
    await editTotalSpendingBudget(remainingBalancePlusTotal, activeBudgetId!);
    setTotalSpendingBudget(remainingBalancePlusTotal);
    handleBack();
  }

  async function takeAndGive(envelope: Envelope, amount: number) {
    if (!envelope || !envelopeToEdit) return;
    envelope.total += amount;
    envelopeToEdit.total -= amount;
    const newEnvelopes = [...envelopes];
    const envelopeIndex = newEnvelopes.findIndex((e) => e.id === envelope.id);
    newEnvelopes[envelopeIndex] = envelope;
    const envelopeToEditIndex = newEnvelopes.findIndex(
      (e) => e.id === envelopeToEdit.id,
    );
    newEnvelopes[envelopeToEditIndex] = envelopeToEdit;
    await editEnvelopes(newEnvelopes, activeBudgetId!);
    setEnvelopes(newEnvelopes);
    handleBack();
  }

  function setUpShowGiveAndTake(envelope: Envelope) {
    setShowGiveAndTake(true);
    setEnvelopeToEdit(envelope);
  }

  function handleSelectListEnvelope(envelope: Envelope) {
    setIsEnvelopeSelected(true);
    setEnvelopeToEdit(envelope);
  }

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

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", event.currentTarget.id);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const draggedEnvelope = envelopes.find((e) => e.id === id);
    if (!draggedEnvelope) return;
    const newEnvelopes = [...envelopes];
    const draggedEnvelopeIndex = newEnvelopes.findIndex((e) => e.id === id);
    newEnvelopes.splice(draggedEnvelopeIndex, 1); // removes the dragged envelope
    const targetEnvelopeIndex = newEnvelopes.findIndex(
      (e) => e.id === event.currentTarget.id,
    );
    newEnvelopes.splice(targetEnvelopeIndex, 0, draggedEnvelope); // places the dragged envelope in the new position
    // set the new order by looping over the newEnvelopes
    for (let i = 0; i < newEnvelopes.length; i++) {
      newEnvelopes[i].order = i + 1;
    }
    setEnvelopes(newEnvelopes);
    await editEnvelopes(newEnvelopes, activeBudgetId!);
  }

  function handleDragEnd(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  const envelopesTotal = sortedEnvelopes.reduce((sum, e) => sum + e.total, 0);
  const envelopesTotalStr = `$${Math.ceil(envelopesTotal).toFixed(2)}`;

  function EnvelopeBox({
    name,
    total,
    isShown,
    setter,
  }: {
    isShown: boolean;
    setter: () => void;
    total: string;
    name: string;
  }) {
    return (
      <div className="relative grid grid-cols-4 py-2 text-center bg-my-white-base text-my-black-dark">
        <div className="absolute ml-2 w-fit h-full flex items-center">
          <ShowHideButton isShown={isShown} onClick={setter} />
        </div>
        <p className="col-span-3">{name}</p>
        <p className="col-span-1 text-my-green-dark">{total}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center w-full h-fit overflow-y-auto overflow-x-hidden">
      <div className="w-screen max-w-[40rem]">
        <EnvelopeBox
          name="Nvelopes"
          total={envelopesTotalStr}
          isShown={showEnvelopes}
          setter={() => setShowEnvelopes(!showEnvelopes)}
        />
        {showEnvelopes && (
          <>
            <div className="w-screen max-w-[40rem] h-[2rem] grid grid-cols-7 divide-x-2 divide-my-black-dark border-x-2 border-my-white-dark bg-my-white-dark text-my-black-light font-bold ">
              <div className="col-span-3 flex justify-start items-center ml-2">
                <p className="text-sm">Nvelope</p>
              </div>
              <div className="flex justify-center items-center col-span-2">
                <p className="text-sm">Remaining</p>
              </div>
              <div className="flex justify-end items-center mr-2 col-span-2">
                <p className="text-sm">Total</p>
              </div>
            </div>
            {sortedEnvelopes.map((e) => (
              <div key={e.id}>
                <ListEnvelope
                  envelope={e}
                  onClick={() => handleSelectListEnvelope(e)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
