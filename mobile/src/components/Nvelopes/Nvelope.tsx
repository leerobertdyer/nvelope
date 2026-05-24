/**
 * Nvelope – Single envelope rendered in different modes (kind).
 */
import { useEffect, useState } from "react";

import FontAwesome from "@expo/vector-icons/FontAwesome";
//<FontAwesome name="envelope" size={24} color="black" /> // <------ BsEnvelopeFill
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, View } from "react-native";
import { Envelope } from "../../types";

interface NvelopeProps {
  kind:
    | "deleteEnvelope"
    | "addEnvelope"
    | "dash"
    | "editEnvelope"
    | "spendingEnvelope";
  envelope: Envelope;
  onPress?: () => void;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  editEnvelope?: (envelope: Envelope) => Promise<void>;
  handleDeleteEnvelope?: () => void;
}
export default function Nvelope({
  kind,
  envelope,
  // onPress,
  handleBack,
  handleSaveEnvelope,
  editEnvelope,
  handleDeleteEnvelope,
}: NvelopeProps) {
  const [newEnvelopeName, setNewEnvelopeName] = useState<string>(
    envelope.name || "",
  );
  const [newEnvelopeTotal, setNewEnvelopeTotal] = useState<number>(
    envelope.total ?? 0,
  );
  const [newEnvelopeSpent, setNewEnvelopeSpent] = useState<number>(
    envelope.spent ?? 0,
  );

  useEffect(() => {
    setNewEnvelopeName(envelope.name || "");
    setNewEnvelopeTotal(envelope.total ?? 0);
    setNewEnvelopeSpent(envelope.spent ?? 0);
  }, [envelope]);

  const dottedWidth = 150;
  const dottedHeight = 80;
  const dottedStrokeWidth = 8;

  function handleEnterAmount(amount: number, n: Envelope) {
    if (amount <= 0) return;
    n.spent = Number(n.spent) + amount;
    editEnvelope?.(n);
    handleBack?.();
  }

  switch (kind) {
    case "deleteEnvelope":
      return (
        <View
        // className="absolute inset-0 w-screen h-screen z-100 select-none"
        >
          <View
          // className="flex flex-col bg-my-red-dark w-screen h-screen justify-center items-center "
          >
            <Text
            // className="p-4 rounded-md text-my-white-dark w-full text-center"
            >
              Are you sure you want to delete {envelope.name}?
            </Text>
            <Text
            // className="text-xs w-[85%] text-center text-white"
            >
              This will not affect your available budget.
            </Text>
            <View
            // className="w-[30rem] h-[50rem] rounded-md py-[1rem] px-[3.5rem] flex justify-center items-center flex-col gap-8"
            >
              <Feather
                name="delete"
                size={24}
                color="red"
                // className="w-[12rem] h-[12rem] text-my-white-light"
              />
              <Button
                title="Delete"
                onPress={() => handleDeleteEnvelope?.()}
                color="gold"
              />
              <Button
                title="Cancel"
                onPress={() => handleBack?.()}
                color="green"
              />
            </View>
          </View>
        </View>
      );
    case "spendingEnvelope":
      return (
        <NvelopeCalculator
          envelope={envelope}
          selectEnvelope={envelope.id === ""}
          handleEnterAmount={handleEnterAmount}
          handleBack={handleBack}
        />
      );
    case "editEnvelope":
      return (
        <EnvelopeForm
          isEditing={true}
          handleBack={handleBack}
          editEnvelope={editEnvelope}
          newEnvelopeSpent={newEnvelopeSpent}
          setNewEnvelopeSpent={setNewEnvelopeSpent}
          envelope={envelope}
          newEnvelopeName={newEnvelopeName}
          newEnvelopeTotal={newEnvelopeTotal}
          setNewEnvelopeName={setNewEnvelopeName}
          setNewEnvelopeTotal={setNewEnvelopeTotal}
        />
      );
    case "addEnvelope":
      return (
        <EnvelopeForm
          isEditing={false}
          handleBack={handleBack}
          handleSaveEnvelope={handleSaveEnvelope}
          newEnvelopeName={newEnvelopeName}
          newEnvelopeTotal={newEnvelopeTotal}
          setNewEnvelopeName={setNewEnvelopeName}
          setNewEnvelopeTotal={setNewEnvelopeTotal}
        />
      );
    case "dash":
      return (
        <View
        // className={`w-fit relative  cursor-pointer bg-white border hover:bg-my-white-dark hover:text-my-green-dark rounded-sm `}
        // onPress={() => onPress?.()}
        >
          <Text
          // className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center text-sm"
          >
            {envelope.name}
          </Text>
          <svg width={dottedWidth} height={dottedHeight}>
            {/* Bottom Line */}
            <line
              className="animate-march"
              x1="0"
              y1={dottedHeight}
              x2={dottedWidth}
              y2={dottedHeight}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Top Line */}
            <line
              className="animate-march"
              x1="0"
              y1="0"
              x2={dottedWidth}
              y2="0"
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Left Line */}
            <line
              className="animate-march"
              x1="0"
              y1={dottedHeight}
              x2="0"
              y2={0}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Right Line */}
            <line
              className="animate-march"
              x1={dottedWidth}
              y1={dottedHeight}
              x2={dottedWidth}
              y2={0}
              stroke="green"
              strokeDasharray="6, 4, 5, 3"
              strokeWidth={dottedStrokeWidth}
            />
            {/* Left Diagnal */}
            <line
              className="animate-march"
              x1="0"
              y1="0"
              x2={dottedWidth * 0.5}
              y2={dottedHeight * 0.35}
              stroke="green"
              strokeDasharray="8, 2"
              strokeWidth={dottedStrokeWidth * 0.35}
            />
            {/* Right Diagnal */}
            <line
              className="animate-march"
              x1={dottedWidth}
              y1="0"
              x2={dottedWidth * 0.5}
              y2={dottedHeight * 0.35}
              stroke="green"
              strokeDasharray="8, 2"
              strokeWidth={dottedStrokeWidth * 0.35}
            />
          </svg>
        </View>
      );
    default:
      return (
        <View
        // className="w-[35vw] h-[35vw] relative"
        >
          <Text
          // className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-2 text-[.6rem]"
          >
            {envelope.name}
          </Text>
          <Text
          // className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-10 text-[.65rem]"
          >
            ${envelope.spent}
          </Text>
          <hr
          // className="absolute w-full h-[2px] bg-black top-12"
          />
          <Text
          // className="absolute w-[60%] left-1/2 -translate-x-1/2 text-center top-14 text-[.65rem]"
          >
            ${envelope.total}
          </Text>
          <FontAwesome
            name="envelope-o"
            size={24}
            color="black"
            // className="w-full h-full"
          />
        </View>
      );
  }
}
