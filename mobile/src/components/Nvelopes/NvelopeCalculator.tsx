import { useState } from "react";
import Button from "../Buttons/Btn";
import { Envelope } from "../../types";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import MoneyInput from "../Payments/MoneyInput";
import { MyText } from "../MyText";
import Btn from "../Buttons/Btn";

interface NvelopeCalculatorProps {
  handleEnterAmount: (amount: number, envelope: Envelope) => void;
  handleBack: (() => void) | undefined;
  selectEnvelope?: boolean;
  envelope?: Envelope;
}
export default function NvelopeCalculator({
  handleEnterAmount,
  handleBack,
  selectEnvelope,
  envelope,
}: NvelopeCalculatorProps) {
  const { envelopes } = useDatabase();

  const [amount, setAmount] = useState(0);
  const [selectedEnvelope, setSelectedEnvelope] = useState<
    Envelope | undefined
  >(undefined);

  function handleSetAmount(dollars: number) {
    const env = selectedEnvelope || envelope;
    if (env && dollars > env.total) return;
    setAmount(dollars);
  }

  function handleSetEnvelope(id: string) {
    const env = envelopes.find((e) => e.id === id);
    setSelectedEnvelope(env || undefined);
  }

  function spendAll() {
    handleEnterAmount(
      Number(envelope?.total) - Number(envelope?.spent),
      selectedEnvelope || envelope!,
    );
  }

  return (
    <View className="absolute inset-0 bg-my-black-base text-my-white-dark flex items-center justify-center flex-col gap-5">
      <View className="w-full flex flex-col justify-center items-center gap-2">
        {envelope && (
          <MyText className="w-full text-center text-my-white-light">
            <MyText className="text-my-white-dark">"{envelope.name}"</MyText>{" "}
            balance:
            <MyText className="text-my-green-light ml-2">
              $
              {(
                Number(envelope?.total) -
                Number(envelope?.spent) -
                amount
              ).toFixed(2)}
            </MyText>
          </MyText>
        )}

        <Btn text="Spend All" onPress={spendAll} color="gold" />
        <View className="w-full max-w-[20rem] flex flex-col justify-center items-center gap-4">
          <MoneyInput
            id="newAmountForEnvelope"
            label="Amount To Spend"
            value={amount}
            onChange={handleSetAmount}
            placeholder={`$5 from ${envelope?.name ?? ""}`}
          />
        </View>
        {selectEnvelope && (
          <Picker
            selectedValue={selectedEnvelope?.id || ""}
            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
            onValueChange={(itemValue) => handleSetEnvelope(itemValue)}
          >
            <Picker.Item
              label="Select an envelope"
              enabled={false}
              value="java"
            />
            {envelopes.map((envelope) => (
              <Picker.Item
                key={envelope.id}
                label={envelope.name}
                value={envelope.id}
              />
            ))}
          </Picker>
        )}
      </View>
      <Btn
        text="Spend"
        onPress={() => {
          handleEnterAmount(amount, selectedEnvelope || envelope!);
        }}
        color="green"
      />
      <Btn
        text={selectEnvelope ? "View Nvelopes" : "Cancel"}
        onPress={() => handleBack?.()}
        color="red"
      />
    </View>
  );
}
