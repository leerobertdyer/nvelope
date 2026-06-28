import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
// import SpendBtn from "../components/Btns/SpendBtn";
import { Modal, Pressable, View } from "react-native";
import Hr from "../Hr";
import Btn from "../Buttons/Btn";
import { Envelope } from "../../types";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MyText } from "../MyText";
import SpendBtn from "../Buttons/SpendBtn";

interface IBigEnvelope {
  handleBack: () => void;
  envelope: Envelope;
  resetState: () => void;
  handleSetShowSpendingPage: (envelope: Envelope) => void;
  handleSetupEdit: (envelope: Envelope) => void;
  setUpShowGiveAndTake: (envelope: Envelope) => void;
  handleDeleteEnvelope: (id: string) => void;
  handleAddCashToEnvelope: (envelope: Envelope) => void;
}

export default function BigEnvelope({
  handleBack,
  envelope,
  handleSetShowSpendingPage,
  handleSetupEdit,
  setUpShowGiveAndTake,
  handleDeleteEnvelope,
  handleAddCashToEnvelope,
}: IBigEnvelope) {
  const envelopeRemainder = (
    Number(envelope.total) - Number(envelope.spent)
  ).toFixed(2);
  return (
    <Modal>
      <View className="bg-my-green-base w-full overflow-y-auto™ h-screen">
        <View className="w-full h-fit m-auto items-center justify-start gap-4">
          <View className="p-2 text-lg text-center w-[20rem] rounded-md flex justify-center gap-2">
            <MyText className="text-my-black-dark text-center text-3xl">
              "{envelope.name}"
            </MyText>
            <MyText className="text-my-green-base text-center">
              ${envelopeRemainder}
            </MyText>
          </View>
          <SpendBtn onPress={() => handleSetShowSpendingPage(envelope)} />
          <Btn onPress={handleBack} color="red" text="Go Back" />
          <View className="flex flex-col justify-center items-center gap-2 w-full ">
            <Pressable
              className="border-2 rounded-md p-2 bg-white w-[20rem]"
              onPress={() => handleAddCashToEnvelope(envelope)}
            >
              <View className="flex-row items-center w-full gap-4 p-[2px] border-2 rounded-md bg-my-white-base text-black border-my-black-dark">
                <FontAwesome6 name="sack-dollar" color="#076346" size={20} />
                <MyText>Add Money From Budget</MyText>
              </View>
            </Pressable>
            <Pressable
              className="border-2 rounded-md p-2 bg-white w-[20rem]"
              onPress={() => setUpShowGiveAndTake(envelope)}
            >
              <View className="flex-row items-center w-full gap-4 p-[2px] border-2 rounded-md bg-my-white-base text-black border-my-black-dark">
                <Entypo name="hand" color="black" size={20} />
                <MyText>Take From This Envelope</MyText>
              </View>
            </Pressable>
            <Pressable
              className="border-2 rounded-md p-2 bg-white w-[20rem]"
              onPress={() => handleSetupEdit(envelope)}
            >
              <View className="flex-row items-center w-full gap-4 p-[2px] border-2 rounded-md bg-my-white-base text-black border-my-black-dark">
                <FontAwesome name="pencil-square-o" size={20} />
                <MyText>Manually Edit Envelope</MyText>
              </View>
            </Pressable>
            <Pressable
              className="border-2 rounded-md p-2 bg-white w-[20rem]"
              onPress={() => handleDeleteEnvelope(envelope.id)}
            >
              <View className="flex-row items-center w-full gap-4 p-[2px] border-2 rounded-md bg-my-white-base border-my-black-dark">
                <EvilIcons name="trash" size={24} color="#ad0241" />
                <MyText>Delete Envelope</MyText>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
