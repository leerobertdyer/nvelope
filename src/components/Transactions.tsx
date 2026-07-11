import { Modal, View } from "react-native";
import { NvelopesTransaction } from "../types";
import Btn from "./Buttons/Btn";
import { MyText } from "./MyText";
import { format } from "date-fns";

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
  return (
    <Modal>
      <View className="w-full h-full bg-my-white-light items-center">
        <View className="bg-my-white-dark rounded-md gap-[2px] w-[95%] m-auto justify-center items-center p-4 ">
          <MyText className="text-3xl w-full text-center">Transactions</MyText>
          <MyText className="text-lg w-full text-center">"{name}"</MyText>
          {transactions.map((t) => (
            <View
              key={t.id}
              className="flex-row items-center justify-between px-2 w-[100%] h-[1.75rem] border-2 border-my-black-dark bg-my-white-base rounded-sm overflow-hidden gap-4"
            >
              <MyText className=" w-[4rem]">
                {format(t.createdAt.toDate(), "MMM do")}
              </MyText>
              <MyText className="w-[4rem]">{t.type}</MyText>
              <MyText className="">{t.description}</MyText>
            </View>
          ))}
        </View>
        <Btn color="red" text="Back" onPress={onClose} />
      </View>
    </Modal>
  );
}
