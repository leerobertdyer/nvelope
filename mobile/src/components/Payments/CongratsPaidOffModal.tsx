import { Pressable, Text, View } from "react-native";
import FullScreen from "../../../../web/src/Views/FullScreen";

interface IProps {
  debtName: string;
  onClose: () => void;
}

export default function CongratsPaidOffModal({ debtName, onClose }: IProps) {
  return (
    <Pressable onPress={onClose}>
      <View className="flex flex-col items-center justify-center text-center w-full px-4 py-8">
        <Text className="text-2xl md:text-3xl text-my-green-light mb-2">
          🎉 Congrats! 🎉
        </Text>
        <Text className="text-lg text-my-white-light">
          You paid off <strong>{debtName}</strong>.
        </Text>
      </View>
    </Pressable>
  );
}
