import { format } from "date-fns";
import { useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";
import { Pressable, View } from "react-native";
import { Payment } from "../../types";
import { getEffectivePaymentAmount } from "../../util";
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

    let t;
    if (p.type === "FUND" || isSplitPayment)
      t =
        "bg-my-black-base text-my-green-light border-l-4 border-l-my-green-dark";
    else if (p.type === "BILL") t = "bg-my-black-base text-my-red-light";
    else t = "bg-my-black-base text-my-white-dark";

    return (
      <Pressable
        key={p.id}
        onPress={() => handleEditBill(p)}
        className={`flex-row py-2 text-center border-y-[1px] items-center border-my-black-dark w-full 
          ${isLastPayment ? "border-2 border-my-white-dark" : ""}
          ${
            p.paid
              ? "bg-my-black-light text-white"
              : p.type === "DEBT"
                ? "text-my-blue-light bg-my-black-base"
                : p.type === "FUND"
                  ? "text-my-green-light bg-my-black-base"
                  : t
          } `}
      >
        <Pressable
          className="flex items-center justify-start flex-[1] ml-[.75rem] min-h-[2rem] cursor-pointer"
          onPress={(e) => {
            e.stopPropagation();
            handleUpdatePaid(p);
          }}
          role="button"
          aria-label={p.paid ? "Mark as not paid" : "Mark as paid"}
        >
          {p.paid ? (
            <FontAwesome
              name="check-circle"
              color={"#076346"}
              className="bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={16}
            />
          ) : (
            <FontAwesome
              name="check-circle-o"
              color={"#076346"}
              className="bg-my-white-dark rounded-lg p-[2px] border-2 border-my-black-dark"
              size={16}
            />
          )}
        </Pressable>
        <MyText
          className={`flex items-center justify-start text-xs flex-[1] text-my-white-dark`}
        >
          {format(p.dueDate.toDate(), "do")}
        </MyText>
        <View className="flex-row items-center justify-start text-xs flex-[5] w-full ">
          <MyText className="text-my-white-light">{p.name}</MyText>
          {isSplitPayment && (
            <MyText className="text-[10px] bg-my-green-dark px-2 rounded ml-2 text-my-white-light">
              SPLIT
            </MyText>
          )}
        </View>
        {p.total != null && !p.paid ? (
          <MyText className="flex items-center justify-end flex-[2] gap-[2px] mr-[1rem] md:mr-[2.8rem]">
            <MyText className="text-sm text-my-blue-light">
              ${getEffectivePaymentAmount(p).toFixed(2)}
            </MyText>
            /
            <MyText className="text-sm text-my-blue-dark">
              {Math.ceil(p.total)}
            </MyText>
          </MyText>
        ) : (
          <MyText className="text-sm flex items-center justify-end flex-[2] mr-[1rem] md:mr-[2.8rem] text-my-white-light">
            ${getEffectivePaymentAmount(p).toFixed(2)}
          </MyText>
        )}
      </Pressable>
    );
  }

  const currentPaymentsTotal = `$${Math.ceil(
    paymentsThisPeriod.reduce(
      (acc, p) => getEffectivePaymentAmount(p) + acc,
      0,
    ),
  ).toFixed(2)}`;

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
          <MyText className="text-my-blue-light">{total}</MyText>
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
