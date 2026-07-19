import { Modal, View } from "react-native";
import MainEnvelope from "./Nvelopes/MainNvelope";
import { MyText } from "./MyText";

export default function Loading({ text }: { text: string }) {
  return (
    <Modal>
      <View className="gap-2 justify-center items-center w-full flex-1 bg-my-black-dark">
        <MainEnvelope
          envelope={{
            id: "1",
            name: "Loading...",
            total: 0,
            spent: 0,
          }}
          kind="dash"
        />
        <MyText className="text-my-white-dark">{text}</MyText>
      </View>
    </Modal>
  );
}
