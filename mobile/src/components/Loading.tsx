import { View } from "react-native";
import Nvelope from "./Nvelopes/Nvelope";
import { MyText } from "./MyText";

export default function Loading({ text }: { text: string }) {
  return (
      <View className="flex flex-col gap-2 justify-center items-center w-full h-screen text-my-black-dark">
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
        {/* animate-pulse in class above will break right now for some reason to do with babel.config.js reanimate */}
      </View>
  );
}
