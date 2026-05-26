/**
 * Nvelopes – Main envelope list container on the main view.
 * Renders the envelope section header (Nvelope / Remaining / Total), uses ListEnvelope
 * for each envelope row, and handles give/take between envelopes and opening the
 * selected envelope in BigEnvelope (Views). Parent of ListEnvelope; coordinates
 * drag-and-drop reorder and selection state.
 */
import { useEffect, useState } from "react";
import { Envelope } from "../../types";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { useBudget } from "../../context/BudgetContext/useBudget";
import {
  editEnvelopes,
  editTotalSpendingBudget,
} from "../../firebase/editData";
import ShowHideButton from "../Buttons/ShowHideButton";
import ListEnvelope from "./NvelopeListRow";
import { Text, View } from "react-native";
import GiveAndTake from "../Payments/GiveAndTake";
import BigEnvelope from "./BigEnvelope";

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
      <View className="relative grid grid-cols-4 p-2 text-center bg-my-white-dark text-my-black-dark border-b-2 border-my-black-dark">
        <View className="absolute ml-2 w-fit h-full flex items-center">
          <ShowHideButton isShown={isShown} onPress={setter} />
        </View>
        <Text className="col-span-3">{name}</Text>
        <Text className="col-span-1 text-my-green-dark">{total}</Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col justify-center items-center w-full h-fit overflow-y-auto overflow-x-hidden">
      <View className="w-screen max-w-[40rem]">
        <EnvelopeBox
          name="Nvelopes"
          total={envelopesTotalStr}
          isShown={showEnvelopes}
          setter={() => setShowEnvelopes(!showEnvelopes)}
        />
        {showEnvelopes && (
          <>
            <View className="w-screen max-w-[40rem] h-[2rem] flex-row divide-x-2 divide-my-black-dark border-x-2 border-my-white-dark bg-my-white-dark text-my-black-light font-bold">
              <View className="flex-[3] flex-row justify-start items-center pl-2">
                <Text className="text-sm font-bold">Nvelope</Text>
              </View>

              <View className="flex-[2] flex-row justify-center items-center">
                <Text className="text-sm font-bold">Remaining</Text>
              </View>

              <View className="flex-[2] flex-row justify-end items-center pr-2">
                <Text className="text-sm font-bold">Total</Text>
              </View>
            </View>
            {sortedEnvelopes.map((e) => (
              <View key={e.id}>
                <ListEnvelope
                  envelope={e}
                  onPress={() => handleSelectListEnvelope(e)}
                  // onDragStart={handleDragStart}
                  // onDragOver={handleDragOver}
                  // onDrop={handleDrop}
                  // onDragEnd={handleDragEnd}
                />
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}
