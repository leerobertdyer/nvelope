import { View } from "react-native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Pressable } from 'react-native-gesture-handler';

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
    <Pressable onPress={onPress} className=" z-100 w-[4rem] h-[4rem] flex justify-center items-center ">
      <View
        className={`text-xs rounded-xl
          ${theme === "DARK" ? "bg-my-black-dark text-my-white-dark" : "bg-my-white-base text-my-black-dark"} 
           p-[1px] rounded-sm border-[1px] border-my-white-light`}
      >
        <View>
          {isShown ? (
            <FontAwesome6 name="arrow-up" size={13} color="#fcca68" className="p-2"/>
          ) : (
            <FontAwesome6 name="arrow-down" size={13} color="#fcca68"className="p-2" />
          )}
        </View>
      </View>
    </Pressable>
  );
}
