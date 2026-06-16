import { Pressable } from "react-native";
import { MyText } from "../MyText";

export default function Btn({
  children,
  text,
  onPress,
  color,
  disabled = false,
}: {
  children?: React.ReactNode;
  text?: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}) {
  const bgColor = () => {
    switch (color.toUpperCase()) {
      case "RED":
        return "bg-my-red-dark text-my-white-dark";
      case "GOLD":
        return "bg-my-white-dark text-my-red-dark";
      case "BLUE":
        return "bg-my-blue-dark text-my-blue-light";
      case "GREEN":
        return "bg-my-green-light text-my-green-dark";
      default:
        return "bg-my-white-base text-my-black-base";
    }
  };

  return (
    <Pressable
      disabled={disabled}
      className={`rounded-lg h-[4.5rem] w-[80%] max-w-[20rem] p-2 cursor-pointer border-2 items-center justify-center m-auto
          disabled:opacity-60
              ${bgColor()}`}
      onPress={onPress}
    >
      {text && <MyText className={`${bgColor()}`}>{text}</MyText> }
      {children}
    </Pressable>
  );
}
