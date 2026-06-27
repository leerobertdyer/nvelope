import { Pressable, View } from "react-native";
import { MyText } from "../MyText";

interface IProps {
  debtName: string;
  onClose: () => void;
}

export default function CongratsPaidOffModal({ debtName, onClose }: IProps) {
  return (
    <Pressable onPress={onClose}>
      <View className="flex flex-col items-center justify-center text-center w-full px-4 py-8">
        <MyText className="text-2xl text-my-green-light mb-2">
          🎉 Congrats! 🎉
        </MyText>
        <MyText className="text-lg text-my-white-light">
          You paid off <strong>{debtName}</strong>.
        </MyText>
      </View>
    </Pressable>
  );
}
