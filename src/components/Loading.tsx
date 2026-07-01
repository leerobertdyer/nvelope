import { View } from "react-native";
import Nvelope from "./Nvelopes/Nvelope";
import { MyText } from "./MyText";

export default function Loading({ text }: { text: string }) {
  return (
      <View className="gap-2 justify-center items-center w-full h-screen bg-my-black-dark">
        <Nvelope
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
  );
}
