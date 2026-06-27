import { format } from "date-fns";
import { useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { Pressable, View } from "react-native";
import { Payment } from "../../types";
import { deriveIsPaid, getEffectivePaymentAmount } from "../../util";
import { MyText } from "../MyText";
import FontAwesome from "@expo/vector-icons/FontAwesome";

interface PaymentMapProps {
  handleUpdatePaid: (payment: Payment) => void;
  handleEditBill: (payment: Payment) => void;
  paymentsThisPeriod: Payment[];
}
export default function PaymentMap({
  handleEditBill,
  handleUpdatePaid,
  paymentsThisPeriod,
}: PaymentMapProps) {
  const [showCurrent, setShowCurrent] = useState(true);

  function RenderPayment({ p }: { p: Payment }) {
    // Check if this is a SPLIT payment (ID contains "-SPLIT-")
    const isSplitPayment = p.id.includes("-SPLIT-");
    const isLastPayment =
      p.type === "DEBT" && p.total != null && p.total <= p.amount;
    const textType = isSplitPayment
      ? "text-my-green-base"
      : p.type === "DEBT"
        ? "text-my-blue-dark"
        : p.type === "BILL"
          ? "text-my-red-light"
          : "text-my-white-dark";

    return (
      <Pressable
        key={p.id}
        onPress={() => handleEditBill(p)}
        className={`flex-row py-2 border-y-[1px] items-center border-my-black-dark w-full 
          ${isLastPayment ? "border-2 border-my-white-dark" : ""}
          ${deriveIsPaid(p) ? "bg-my-black-light" : "bg-my-black-base"} `}
      >
        <Pressable
          className="flex items-center justify-start ml-[.75rem] mr-[1rem]"
          onPress={(e) => {
            e.stopPropagation();
            handleUpdatePaid(p);
          }}
          role="button"
          aria-label={deriveIsPaid(p) ? "Mark as not paid" : "Mark as paid"}
        >
          {deriveIsPaid(p) ? (
            <FontAwesome
              name="check-circle"
              color={"#076346"}
              className="bg-my-white-dark rounded-md p-[4px] border-2 border-my-black-dark overflow-hidden"
              size={20}
            />
          ) : (
            <FontAwesome
              name="check-circle-o"
              color={"#076346"}
              className="bg-my-white-light rounded-md p-[4px] border-2 border-my-black-dark overflow-hidden"
              size={20}
            />
          )}
        </Pressable>
        <MyText
          className={`text-xs w-8  ${textType}`}
        >
          {format(p.dueDate.toDate(), "do")}
        </MyText>
        <View className="flex-row items-center justify-start text-xs ml-[1rem] p-2 flex-[5]">
          <MyText className={`${textType}`}>{p.name}</MyText>
          {isSplitPayment && (
            <MyText className="text-[10px] bg-my-green-dark px-2 rounded ml-2 text-my-white-light">
              SPLIT
            </MyText>
          )}
        </View>
        {p.total != null ? (
          <MyText className="text-my-white-light flex-row items-center justify-end gap-[2px] mr-[1rem]">
            <MyText className={`text-sm ${textType}`}>
              ${Math.ceil(getEffectivePaymentAmount(p))}
            </MyText>
            {" "}/{" "}
            <MyText className={`text-sm ${p.type === "DEBT" ? "text-my-blue-light" : textType}`}>
              {Math.ceil(p.total)}
            </MyText>
          </MyText>
        ) : (
          <View className="text-my-white-light flex items-center justify-end gap-[2px] mr-[1rem]">
            <MyText className={`text-sm ${textType}`}>
              ${getEffectivePaymentAmount(p).toFixed(2)}
            </MyText>
          </View>
        )}
      </Pressable>
    );
  }

  const currentPaymentsTotal = `$${paymentsThisPeriod
    .reduce(
      (acc, p) => (deriveIsPaid(p) ? acc : getEffectivePaymentAmount(p) + acc),
      0,
    )
    .toFixed(2)}`;

  function PaymentBox({
    isShown,
    name,
    total,
    setter,
  }: {
    isShown: boolean;
    setter: () => void;
    total: string;
    name: string;
  }) {
    return (
      <Pressable onPress={setter}>
        <View className="flex-row items-center justify-between p-2 w-full h-[3rem] bg-my-black-dark text-my-black-dark border-b-2 border-my-black-dark">
          {isShown ? (
            <Entypo
              name={"chevron-up"}
              size={20}
              color="#fff"
              className="px-2"
            />
          ) : (
            <Entypo
              name={"chevron-down"}
              size={20}
              color="#fff"
              className="px-2"
            />
          )}
          <MyText className="text-my-white-dark">{name}</MyText>
          <MyText className="text-my-red-light">{total}</MyText>
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <View className="h-fit w-full overflow-auto ">
        <PaymentBox
          name="Current Payments"
          total={currentPaymentsTotal}
          isShown={showCurrent}
          setter={() => setShowCurrent(!showCurrent)}
        />
        {showCurrent && (
          <View className=" bg-my-black-dark">
            {paymentsThisPeriod.map((p) => (
              <RenderPayment key={p.id} p={p} />
            ))}
          </View>
        )}
      </View>
    </>
  );
}
