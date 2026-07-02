import { Modal, View } from "react-native";
import Btn from "./Buttons/Btn";

interface PageTourProps {
  /** Show the tour only when true (e.g. isNewUser from budget data). */
  visible: boolean;
  /** Called when user clicks "Got it"; parent should set isNewUser to false in DB and context. */
  onDismiss: () => void;
  children: React.ReactNode;
}

/**
 * Shows a one-time dismissible popup when visible (e.g. isNewUser). On "Got it", calls onDismiss
 * so the parent can persist that the user has seen the tour (e.g. editIsNewUser(false)).
 */
export default function PageTour({
  visible,
  onDismiss,
  children,
}: PageTourProps) {
  if (!visible) return null;

  return (
    <Modal        
    visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => (false)}>

      <View className="flex-row items-center justify-center bg-my-black-dark/80  w-full h-[42%] p-4 ml-auto mt-auto">
        <View className="bg-my-black-base border border-my-white-dark/20 rounded-lg shadow-lg w-full p-5  gap-4 text-my-white-light">
          <View className="text-sm">{children}</View>
          <Btn color="gold" text="Got it" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}
