/**
 * Nvelopes – Main envelope list container on the main view.
 * Renders the envelope section header (Nvelope / Remaining / Total), uses ListEnvelope
 * for each envelope row, and handles give/take between envelopes and opening the
 * selected envelope in BigEnvelope (Views). Parent of ListEnvelope; coordinates
 * drag-and-drop reorder and selection state.
 */

import { useEffect, useState } from "react";
import { Nvelope } from "../../types";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { useBudget } from "../../context/BudgetContext/useBudget";
import {
  editDatabaseWithTransaction,
  editEnvelopes,
  editTotalSpendingBudget,
} from "../../firebase/editData";
import ListEnvelope from "./NvelopeListRow";
import { View } from "react-native";
import GiveAndTake from "../Payments/GiveAndTake";
import BigEnvelope from "./BigEnvelope";
import { Pressable } from "react-native-gesture-handler";
import { MyText } from "../MyText";
import Entypo from "@expo/vector-icons/Entypo";
import firestore from "@react-native-firebase/firestore"
import { useAuth } from "../../context/AuthContext/useAuth";


interface NvelopeProps {
  resetState: () => void;
  handleSetupEdit: (envelope: Nvelope) => void;
  editEnvelope: (envelope: Nvelope) => Promise<void>;
  handleSetShowSpendingPage: (envelope: Nvelope) => void;
  handleDeleteEnvelope: (id?: string) => void;
  handleAddCashToEnvelope: (envelope: Nvelope) => void;
}

function EnvelopeBox({
  name,
  isShown,
  total,
  setter,
}: {
  name: string;
  isShown: boolean;
  setter: () => void;
  total: string;
}) {
  return (
    <Pressable onPress={setter}>
      <View className="flex-row p-2 w-full h-[3rem] justify-between bg-my-white-dark text-my-black-dark border-b-2 border-my-black-dark">
        {isShown ? (
          <View className="ml-[6px] p-[2px] w-[1.75rem] h-[1.75rem] justify-center items-center bg-my-black-base rounded-md">
            <Entypo name={"chevron-up"} size={20} color="#fcca68" />
          </View>
        ) : (
          <View className="ml-[6px] p-[2px] w-[1.75rem] h-[1.75rem] justify-center items-center bg-my-black-base rounded-md">
            <Entypo name={"chevron-down"} size={20} color="#fcca68" />
          </View>
        )}
        <MyText className="text-center">{name}</MyText>
        <MyText className="text-center">{total}</MyText>
      </View>
    </Pressable>
  );
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
  const [envelopeToEdit, setEnvelopeToEdit] = useState<Nvelope | null>(null);
  const [isEnvelopeSelected, setIsEnvelopeSelected] = useState(false);
  const [sortedEnvelopes, setSortedEnvelopes] = useState<Nvelope[]>([]);
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
    if (!envelopeToEdit || !user) return;
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
       id: `${new Date().getTime()}-${user.uid.slice(0, 6)}-${Math.random().toString(36).slice(2, 8)}`,
        type: "TAKE",
        description: `Put $${amount} from ${envelopeToEdit.name} back into available funds`,
        createdAt: firestore.Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editEnvelope(envelopeToEdit),
    });
    await editTotalSpendingBudget(remainingBalancePlusTotal, activeBudgetId!);
    setTotalSpendingBudget(remainingBalancePlusTotal);
    handleBack();
  }

  async function takeAndGive(envelope: Nvelope, amount: number) {
    if (!envelope || !envelopeToEdit || !user) return;
    envelope.total += amount;
    envelopeToEdit.total -= amount;
    const newEnvelopes = [...envelopes];
    const envelopeIndex = newEnvelopes.findIndex((e) => e.id === envelope.id);
    newEnvelopes[envelopeIndex] = envelope;
    const envelopeToEditIndex = newEnvelopes.findIndex(
      (e) => e.id === envelopeToEdit.id,
    );
    newEnvelopes[envelopeToEditIndex] = envelopeToEdit;
    await editDatabaseWithTransaction({
      t: {
       id: `${new Date().getTime()}-${user.uid.slice(0, 6)}-${Math.random().toString(36).slice(2, 8)}`,
        type: "GIVE",
        description: `Took $${amount} from ${envelopeToEdit.name} and put it in ${envelope}`,
        createdAt: firestore.Timestamp.now(),
        createdBy: user.email ?? user.uid,
      },
      budgetId: activeBudgetId!,
      func: () => editEnvelopes(newEnvelopes, activeBudgetId!),
    });
    setEnvelopes(newEnvelopes);
    handleBack();
  }

  function setUpShowGiveAndTake(envelope: Nvelope) {
    setShowGiveAndTake(true);
    setEnvelopeToEdit(envelope);
  }

  function handleSelectListEnvelope(envelope: Nvelope) {
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

  const envelopesTotal = sortedEnvelopes.reduce((sum, e) => sum + e.total, 0);
  const envelopesTotalStr = `$${Math.ceil(envelopesTotal).toFixed(2)}`;

  return (
    <View className="justify-center items-center w-full h-fit overflow-y-auto overflow-x-hidden">
      <View className="w-full">
        <EnvelopeBox
          isShown={showEnvelopes}
          name="Nvelopes"
          total={envelopesTotalStr}
          setter={() => setShowEnvelopes(!showEnvelopes)}
        />
        {showEnvelopes && sortedEnvelopes.length > 0 && (
          <>
            <View className="w-screen max-w-[40rem] h-[2rem] flex-row divide-x-2 divide-my-black-dark border-x-2 border-my-white-dark bg-my-white-dark text-my-black-light font-bold">
              <View className="flex-[3] flex-row justify-start items-center pl-2">
                <MyText className="text-sm font-bold">Nvelope</MyText>
              </View>

              <View className="flex-[2] flex-row justify-center items-center">
                <MyText className="text-sm font-bold">Remaining</MyText>
              </View>

              <View className="flex-[2] flex-row justify-end items-center pr-2">
                <MyText className="text-sm font-bold">Total</MyText>
              </View>
            </View>
            {sortedEnvelopes.map((e) => (
              <View key={e.id} className="w-full">
                <ListEnvelope
                  envelope={e}
                  onPress={() => handleSelectListEnvelope(e)}
                />
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}
