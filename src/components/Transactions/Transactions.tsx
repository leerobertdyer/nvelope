import { Modal, Pressable, ScrollView, View } from "react-native";
import { NvelopesTransaction } from "../../types";
import Btn from "../Buttons/Btn";
import { MyText } from "../MyText";
import { format } from "date-fns";
import TinyTransaction from "./TinyTransaction";
import { useState } from "react";
import BigTransaction from "./BigTransaction";

interface ITransactions {
  transactions: NvelopesTransaction[];
  onClose: () => void;
  name: string;
}
export default function Transactions({
  transactions,
  onClose,
  name,
}: ITransactions) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<NvelopesTransaction | null>(null);

  function handleSelectTransaction(t: NvelopesTransaction) {
    setTransactionToEdit(t);
    setShowTransactionModal(true);
  }

  function resetState() {
    setShowTransactionModal(false);
    setTransactionToEdit(null);
  }

  if (showTransactionModal && transactionToEdit)
    return <BigTransaction t={transactionToEdit} onClose={resetState} />;


  return (
    <Modal>
      <View className="w-full h-full bg-my-white-light items-center justify-center">
        <View className="w-full gap-4">
          <ScrollView
            contentContainerClassName="justify-center items-center gap-2"
            className="w-full m-auto p-4 bg-my-white-light"
          >
            <MyText className="text-3xl w-full text-center">
              Transactions
            </MyText>
            <MyText className="text-lg w-full text-center">"{name}"</MyText>
            {transactions.map((t) => (
              <Pressable onPress={() => handleSelectTransaction(t)} key={t.id}>
                <TinyTransaction t={t} />
              </Pressable>
            ))}
          </ScrollView>
          <Btn color="red" text="Back" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
