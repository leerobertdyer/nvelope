import { Modal, View } from "react-native";
import { MyText } from "../MyText";
import Btn from "../Buttons/Btn";

interface IProps {
  debtName: string;
  onClose: () => void;
}

export default function CongratsPaidOffModal({ debtName, onClose }: IProps) {
  return (
    <Modal backdropColor={"#242424"}>
      <View className="h-[50%] m-auto w-full p-4 items-center">
        <MyText className="text-2xl text-my-green-light">
          🎉 Congrats! 🎉
        </MyText>
        <MyText className="text-lg text-my-white-light">You paid off</MyText>
        <MyText className="text-my-white-dark">"{debtName}"</MyText>
        {/* TODO: Right here we could tell the user that the snowball has triggered and which debt it went to and they could accept or refuse it */}
        <Btn color="red" onPress={onClose} text="Close" />
      </View>
    </Modal>
  );
}
