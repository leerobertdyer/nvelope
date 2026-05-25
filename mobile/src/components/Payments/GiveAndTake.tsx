import { useState } from "react";
import MoneyInput from "./MoneyInput";
import { Text, View } from "react-native";
import RadioBtn from "../Buttons/RadioBtn";
import { Picker } from "@react-native-picker/picker";
import Btn from "../Buttons/Btn";
import { Envelope } from "../../types";
import { useDatabase } from "../../context/DatabaseContext/useDatabase";

interface GiveAndTakeProps {
    envelope: Envelope;
    handleBack: () => void;
    takeAndGive: (e: Envelope, n: number) => Promise<void>;
    takeFromEnvelope: (n?: number) => Promise<void>;
}

export default function GiveAndTake({ envelope, handleBack, takeAndGive, takeFromEnvelope }: GiveAndTakeProps) {
    const [amountToGiveOrTake, setAmountToGiveOrTake] = useState(0);
    const [isGiving, setIsGiving] = useState(false);
    const [envelopeToGiveTo, setEnvelopeToGiveTo] = useState<Envelope | null>(null);
    const { envelopes } = useDatabase();

    return (
        <View className="absolute z-[9999] inset-0 w-full h-screen flex flex-col items-center justify-center bg-my-black-base text-my-white-dark">
            <Text className="text-2xl font-bold mb-4">Give and Take</Text>
            <View className="flex flex-col items-center gap-2">
                <Text className="text-my-white-light">Enter amount to <span className="text-my-red-light">take</span> from {envelope.name}</Text>
                <MoneyInput
                    id="amount"
                    value={amountToGiveOrTake}
                    onChange={setAmountToGiveOrTake}
                    placeholder="Enter amount"
                    allowNegative
                />
                <Text className="text-my-white-light">Where do you want to put the $$$?</Text>
                <View className="flex justify-center w-full gap-2 items-center">
                    <RadioBtn option={{id: "give", label: "Another Envelope"}} onSelect={() => setIsGiving(true)}/>
                    <RadioBtn option={{id: "take", label: "Available Budget"}} onSelect={() => setIsGiving(false)}/>
                </View>
                {isGiving && (
                    <>
                        <Text>Enter envelope to give to</Text>
                        <Picker 
                            className="bg-my-white-light border-2 border-my-white-dark rounded-md p-2 w-[80%] max-w-[20rem] text-my-black-dark"
                            onValueChange={(e) => setEnvelopeToGiveTo(envelopes.find(envelope => envelope.id === e) || null)}
                            selectedValue={envelopeToGiveTo?.id || ''}
                        >
                            <Picker.Item enabled={false} value="" label="Select an envelope"/>
                            {envelopes.map(e => (
                               e.id !== envelope.id && <Picker.Item key={e.id} value={e.id} label={e.name} />
                            ))}
                        </Picker>
                    </>
                )}
                {isGiving && envelopeToGiveTo !== null 
                    ? <Btn
                        onPress={() => takeAndGive(envelopeToGiveTo, amountToGiveOrTake)}
                        color="green"
                    >
                        Give
                    </Btn>
                    : !isGiving &&<>
                        <Btn
                            onPress={() => takeFromEnvelope(amountToGiveOrTake)}
                            color="gold"
                            >
                            Take
                        </Btn>
                        <Btn
                            onPress={() => takeFromEnvelope(envelope.total - envelope.spent)}
                            color="green"
                            >
                            Take All
                        </Btn>
                            </>
                }
                <Btn
                    onPress={handleBack}
                    color="red"
                >
                    Cancel
                </Btn>
            </View>
        </View>
    );
}