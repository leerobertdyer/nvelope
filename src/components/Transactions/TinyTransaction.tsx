import { View } from "react-native";
import { NvelopesTransaction } from "../../types";
import { MyText } from "../MyText";
import { format } from "date-fns";

export default function TinyTransaction({ t }: { t: NvelopesTransaction }) {
  const isAdding =
    t.type === "CASH" ||
    t.type === "EXTRA" ||
    t.type === "FILL" ||
    t.type === "TAKE";
  const isRemoving =
    t.type === "DELETE" || t.type === "SPEND" || t.type === "GIVE";
  const borderColor = isAdding
    ? "border-my-green-dark"
    : isRemoving
      ? "border-my-red-dark"
      : "border-my-black-dark";

  return (
    <View
      className={`${borderColor} flex-row items-center justify-between px-2 w-[100%] h-[2.5rem] border-[3px] bg-white rounded-sm overflow-hidden gap-4 `}
    >
      <MyText className={`w-[4rem]`}>
        {format(t.createdAt.toDate(), "MMM do")}
      </MyText>
      <MyText className={`flex-1`} numberOfLines={1}>
        {t.description}
      </MyText>
    </View>
  );
}
