import { Modal, Pressable, View } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Btn from "../Buttons/Btn";
import { MyText } from "../MyText";
import { navigationRef } from "../../../App";

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
            className="bg-my-white-dark w-[100%] h-[70%] p-4"
            onStartShouldSetResponder={() => true} // prevents tap-through closing when tapping menu itself
          >
            <View className="p-4 w-full justify-around h-fit m-auto gap-8">
              <View className="gap-8">
                {links.map((link) => (
                  <Pressable
                    key={link}
                    onPress={() => {
                      navigationRef.navigate(link as never);
                      setShowMenu(false);
                    }}
                  >
                    <MyText className="text-5xl text-my-blue-dark text-center underline">
                      {link}
                    </MyText>
                  </Pressable>
                ))}
              </View>
              <Btn
                color="red"
                onPress={() => setShowMenu(false)}
                text="Close"
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
