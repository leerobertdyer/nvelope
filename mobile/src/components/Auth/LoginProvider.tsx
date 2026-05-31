import { Image, ImageSourcePropType, Pressable, View } from "react-native";
import { signInWithGoogle } from "../../firebase/signInWithGoogle";
import { MyText } from "../MyText";

export default function LoginProvider({
  src,
  text,
}: {
  src: ImageSourcePropType;
  text: string;
}) {
  return (
    <View className="w-full h-fit rounded-xl p-4 bg-my-white-dark">
      <Pressable onPress={signInWithGoogle}>
        <View className="w-full h-fit flex-row justify-center items-center gap-6 bg-white p-4 rounded-md">
          <Image
            source={src}
            alt={text}
            className="w-[2rem] h-[2rem] object-cover rounded-md"
          />
          <MyText>{text}</MyText>
        </View>
      </Pressable>
    </View>
  );
}
