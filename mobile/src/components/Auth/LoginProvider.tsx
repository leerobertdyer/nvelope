import { Image, ImageSourcePropType, View } from "react-native";
import { signInWithGoogle } from "../../firebase/signInWithGoogle";
import Btn from "../Buttons/Btn";

export default function LoginProvider({src, text}: {src: ImageSourcePropType, text: string}) {
  return (
    <Btn
        color={'green'}
        onPress={signInWithGoogle}
        >
        <View className="w-fit h-[3rem] flex justify-center items-center gap-6">
            <Image source={src} alt={text} className="w-[3rem] h-[3rem] object-cover rounded-md"/>
            <p>{text}</p>
        </View>
    </Btn>
  )
}