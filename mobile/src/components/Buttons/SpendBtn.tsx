import { Animated, Pressable, View } from "react-native";
import { useRef } from "react";
import { MyText } from "../MyText";
import { LinearGradient } from "expo-linear-gradient";

export default function SpendBtn({ onPress }: { onPress: () => void }) {
  const translateY = useRef(new Animated.Value(-10)).current;

  const pressIn = () => {
    Animated.spring(translateY, {
      toValue: -2,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(translateY, {
      toValue: -10,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  return (
    <View className="w-[12rem] h-[12rem] bg-my-white-dark items-center justify-center rounded-3xl">
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        className="w-[8rem] h-[8rem] items-center justify-center"
      >
        {/* Shadow/base layer */}
        <View
          style={{ position: "absolute", top: -8}}
          className="w-[9rem] h-[9rem] rounded-full bg-my-black-dark"
        />
        {/* Raised button layer */}
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="w-[8rem] h-[8rem] rounded-full bg-my-green-light items-center justify-center"
        >
          <LinearGradient
            colors={["#f54263", "#ad0241", "#fcca68", "#076346", "#f2055c"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MyText className="text-my-white-light text-[5rem]">$</MyText>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
}
