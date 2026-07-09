import { Modal, View } from "react-native";
import { NvelopesTransaction } from "../types";
import Btn from "./Buttons/Btn";
import { MyText } from "./MyText";
import { format } from "date-fns";

interface ITransactions {
  transactions: NvelopesTransaction[];
  onClose: () => void;
}
export default function Transactions({ transactions, onClose }: ITransactions) {
  return (
    <Modal>
      <View className="w-full h-full bg-my-white-dark items-center">
        <View className="bg-my-white-light rounded-md gap-2 w-[90%] m-auto justify-center items-center p-4">
          <MyText className="text-3xl w-full text-center">Transactions</MyText>
          {transactions.map((t) => (
            <View
              key={t.id}
              className="flex-row items-center justify-between px-2 w-[90%] h-[1.5rem] bg-my-black-base rounded-md"
            >
              <MyText className="text-my-white-dark">
                {format(t.createdAt.toDate(), "MMMM do")}
              </MyText>
              <MyText className="text-my-white-dark">{t.type}</MyText>
              <MyText className="text-my-white-dark">{t.description}</MyText>
            </View>
          ))}
        </View>
        <Btn color="red" text="Back" onPress={onClose} />
      </View>
    </Modal>
  );
}
