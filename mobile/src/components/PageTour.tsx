import { Button, View } from "react-native";

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
export default function PageTour({ visible, onDismiss, children }: PageTourProps) {
  if (!visible) return null;

  return (
    <View
      className="fixed inset-0 z-[9700] flex items-center justify-center bg-my-black-dark/80 p-4"
      role="dialog"
      aria-label="Page tour"
    >
      <View className="bg-my-black-base border border-my-white-dark/20 rounded-lg shadow-lg max-w-md w-full p-5 flex flex-col gap-4 text-my-white-light">
        <View className="text-sm sm:text-base [&_span]:font-semibold [&_.text-my-green-light]:text-my-green-light [&_.text-my-red-light]:text-my-red-light [&_.text-my-blue-light]:text-my-blue-light">
          {children}
        </View>
        <View className="flex justify-end px-4 py-2 rounded-md bg-my-green-dark text-my-white-light hover:bg-my-green-base font-medium">
          <Button
            title="Got it"
            onPress={onDismiss}
          />
        </View>
      </View>
    </View>
  );
}
