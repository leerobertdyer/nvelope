import { useEffect, useState } from "react";
import type { NvelopesTransaction } from "../../types";
import { format } from "date-fns";
import Button from "../Buttons/Button";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";

export default function BigTransaction({
  t,
  onClose,
}: {
  t: NvelopesTransaction;
  onClose: () => void;
}) {
  const { envelopes, payments } = useDatabase();
  const isEnvelopeOrPayment = !!t.nvelopeOrPaymentId;
  const [transactionDesc, setTransactionDesc] = useState("");

  useEffect(() => {
    if (isEnvelopeOrPayment) {
      const envelope = envelopes.find((e) => e.id === t.nvelopeOrPaymentId);
      if (envelope) {
        setTransactionDesc(createDesc(envelope.name));
      } else {
        const payment = payments.find((p) => p.id === t.nvelopeOrPaymentId);
        if (payment) {
          setTransactionDesc(createDesc(payment.name));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelopes, payments]);

  function createDesc(name: string): string {
    const workingTimestamp = t.modifiedAt ?? t.createdAt;
    const workingDate = format(workingTimestamp.toDate(), "MM/dd/yyyy");
    switch (t.type) {
      case "EDIT":
        return `On ${workingDate}, ${t.createdBy} manually edited "${name}".`;
      case "EXTRA":
        return `On ${workingDate}, ${t.createdBy} paid $${t.amount} extra towards "${name}".`;
      case "FILL":
        return `On ${workingDate}, ${t.createdBy} added $${t.amount} to "${name}".`;
      case "SPEND":
        return `On ${workingDate}, ${t.createdBy} spent $${t.amount} from "${name}".`;
      case "PAID":
        return `On ${workingDate}, ${t.createdBy} toggled "${name}" as Paid/Unpaid`;
      default:
        return t.description ?? "";
    }
  }

  return (
    <div className="fixed inset-0 z-[10100] w-full h-full flex justify-center items-center bg-my-blue-dark/90">
      <div className="w-[90%] max-w-[24rem] p-8 flex flex-col items-center justify-center gap-4 bg-my-white-light text-my-black-dark rounded-md">
        <h2 className="text-2xl mb-2">Transaction Details</h2>
        {transactionDesc ? (
          <p className="text-center">{transactionDesc}</p>
        ) : (
          <>
            <p>{format(t.createdAt.toDate(), "MM/dd/yyyy")}</p>
            <p>{t.createdBy}</p>
            <p>{t.description}</p>
          </>
        )}
        <Button onClick={onClose} color="red">
          Back
        </Button>
      </div>
    </div>
  );
}
