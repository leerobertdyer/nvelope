import AntDesign from '@expo/vector-icons/AntDesign';

import { View } from "react-native";
import Btn from "./Btn";

export default function ShowHideButton({
  onPress,
  isShown,
  theme = "DARK",
}: {
  onPress: () => void;
  isShown: boolean;
  theme?: "LIGHT" | "DARK";
}) {
  return (
    <View className="absolute z-100 w-[2rem] h-full flex justify-center items-center">
      <View
        className={`text-xs 
          ${theme === "DARK" ? "bg-my-black-dark text-my-white-dark" : "bg-my-white-base text-my-black-dark"} 
          cursor-pointer  p-[1px] rounded-sm border-[1px] border-my-white-light`}
      >
        <Btn onPress={onPress} color="Green">
          {isShown ? (
            <AntDesign name="arrow-up" size={18} color="black" />
          ) : (
            <AntDesign name="arrow-down" size={18} color="black" />
          )}
        </Btn>
      </View>
    </View>
  );
}
