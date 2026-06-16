import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
// import SpendBtn from "../components/Btns/SpendBtn";
import { Pressable, View } from "react-native";
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
    <View className="pt-[2rem] bg-my-white-light w-full overflow-y-auto™ h-full">
      <View className="w-full flex flex-col items-center justify-start">
        <View className="p-2 text-lg text-center w-[20rem] rounded-md flex justify-center gap-2 bg-my-black-base">
          <MyText className="text-my-white-dark text-center">
            {envelope.name}
          </MyText>
          <MyText className="text-my-green-base text-center">
            ${envelopeRemainder}
          </MyText>
        </View>
        <Hr />
        <Btn onPress={handleBack} color="red" text="Go Back" />
        <View style={{ paddingTop: 10 }} />
        <View className="flex flex-col justify-center items-center gap-2 w-[20rem]">
          <Btn color="green" onPress={() => handleAddCashToEnvelope(envelope)}>
            <View className="flex-row items-center w-full gap-4">
              <FontAwesome6
                name="sack-dollar"
                color="white"
                className="p-[2px] border-2 rounded-md bg-my-green-dark text-black border-my-black-dark"
                size={20}
              />
              <MyText className="text-my-green-dark">
                Add Money From Budget
              </MyText>
            </View>
          </Btn>
          <Btn color="blue" onPress={() => setUpShowGiveAndTake(envelope)}>
            <View className="flex-row items-center w-full gap-4">
              <Entypo
                name="hand"
                color="black"
                className="p-[2px] border-2 rounded-md bg-my-blue-base text-black border-my-black-dark"
                size={20}
              />
              <MyText className="text-my-blue-light">
                Take From This Envelope
              </MyText>
            </View>
          </Btn>
          <Btn color="gold" onPress={() => handleSetupEdit(envelope)}>
            <View className="flex-row items-center w-full gap-4">
              <FontAwesome
                name="pencil-square-o"
                size={20}
                className="p-[2px] border-2 rounded-md bg-my-white-base text-black border-my-black-dark"
              />
              <MyText className="text-my-red-dark">
                Manually Edit Envelope
              </MyText>
            </View>
          </Btn>
          <Btn color="red" onPress={() => handleDeleteEnvelope(envelope.id)}>
            <View className="flex-row items-center w-full gap-4">
              <EvilIcons
                name="trash"
                size={24}
                color="#fcca68"
                className="p-[2px] border-2 rounded-md bg-my-black-base border-my-white-base"
              />
              <MyText className="text-my-white-dark">Delete Envelope</MyText>
            </View>
          </Btn>
          <SpendBtn onPress={() => handleSetShowSpendingPage(envelope)} />
        </View>
      </View>
    </View>
  );
}
