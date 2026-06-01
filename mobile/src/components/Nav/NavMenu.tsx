import { Modal, Pressable, View } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Btn from "../Buttons/Btn";
import { useNavigation } from "@react-navigation/native";

interface NavMenuProps {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  links: string[];
}

export default function NavMenu({
  showMenu,
  setShowMenu,
  links,
}: NavMenuProps) {
  const navigation = useNavigation();
  return (
    <>
      <Pressable onPress={() => setShowMenu(true)}>
        <Entypo
          name="menu"
          size={28}
          color="white"
          className="bg-my-black-dark rounded-md p-2"
        />
      </Pressable>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowMenu(false)}
        >
          <View
            className="bg-my-white-dark w-[100%] h-[70%] p-4 mb-auto"
            onStartShouldSetResponder={() => true} // prevents tap-through closing when tapping menu itself
          >
            <View className="flex-col gap-2 p-4 justify-center h-fit m-auto w-full">
              <View className="my-[2rem]" />
              {links.map((link) => (
                <Btn
                  key={link}
                  color="gold"
                  onPress={() => {
                    navigation.navigate(link as never);
                    setShowMenu(false);
                  }}
                  text={link}
                />
              ))}
            </View>
            <Btn color="red" onPress={() => setShowMenu(false)} text="Close" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
