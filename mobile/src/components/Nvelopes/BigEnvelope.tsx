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
    <View className=" pt-[2rem] bg-my-white-light w-full overflow-y-auto z-999 h-screen">
      <View className="w-full flex flex-col items-center justify-start">
        <View className="p-2 text-lg text-my-white-dark text-center w-full flex justify-center gap-2 bg-my-black-base">
          <MyText>{envelope.name}</MyText>
          <MyText className="text-my-green-base">${envelopeRemainder}</MyText>
        </View>
        <Hr />
        <Btn onPress={handleBack} color="red">
          <MyText>Go Back</MyText>
        </Btn>
        <View style={{ paddingTop: 10 }} />
        <View className="flex flex-col justify-center items-center gap-2 ">
          <Pressable
            className="shadow shadow-black flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
            onPress={(e) => {
              e.stopPropagation();
              handleAddCashToEnvelope(envelope);
            }}
          >
            <FontAwesome6
              name="sack-dollar"
              color="black"
              className="p-[2px] border-2 rounded-md bg-my-green-dark text-white border-my-black-dark"
              size={27}
            />
            <MyText className="text-xs">Add Money From Available Budget</MyText>
          </Pressable>
          <Pressable
            className="shadow shadow-black flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px] "
            onPress={(e) => {
              e.stopPropagation();
              setUpShowGiveAndTake(envelope);
            }}
          >
            <Entypo
              name="hand"
              color="black"
              className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark"
              size={27}
            />
            <MyText className="text-xs">Take from this envelope</MyText>
          </Pressable>
          <Pressable
            className="shadow shadow-black flex justify-start gap-2 items-center w-full border-2 rounded-md p-[5px]"
            onPress={(e) => {
              e.stopPropagation();
              handleSetupEdit(envelope);
            }}
          >
            <EvilIcons
              name="pencil"
              color="black"
              className="p-[2px] border-2 rounded-md bg-my-white-dark text-black border-my-black-dark"
              size={27}
            />
            <MyText className="text-xs">Manually Edit Envelope</MyText>
          </Pressable>
          <Pressable
            className="shadow shadow-black flex justify-start gap-2 items-center w-full mb-8 border-2 rounded-md p-[5px]"
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteEnvelope(envelope.id);
            }}
          >
            <FontAwesome
              name="trash"
              color="black"
              className="p-[2px] border-2 rounded-md bg-my-red-dark text-white border-my-black-dark"
              size={27}
            />
            <MyText className="text-xs">Delete Envelope</MyText>
          </Pressable>
          {/* <SpendBtn onPress={() => handleSetShowSpendingPage(envelope)} /> */}
        </View>
      </View>
    </View>
  );
}
