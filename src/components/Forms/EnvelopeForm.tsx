import Button from "../Buttons/Button";
import type { Envelope } from "../../types";

interface IProps {
  newEnvelopeName: string;
  setNewEnvelopeName: (s: string) => void;
  newEnvelopeTotal: string;
  setNewEnvelopeTotal: (s: string) => void;
  isEditing: boolean;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  editEnvelope?: (envelope: Envelope) => Promise<void>;
  envelope?: Envelope;
  newEnvelopeSpent?: string;
  setNewEnvelopeSpent?: (s: string) => void;
}

export default function EnvelopeForm(props: IProps) {
  const {
    newEnvelopeName,
    setNewEnvelopeName,
    newEnvelopeTotal,
    setNewEnvelopeTotal,
    handleSaveEnvelope,
    handleBack,
    isEditing,
    editEnvelope,
    envelope,
    newEnvelopeSpent,
    setNewEnvelopeSpent,
  } = props;

  return (
    <div className="min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
      <div className="flex flex-col items-center justify-startgap-2 h-full max-w-[40rem] pt-[10rem] my-20 mx-auto gap-4">
        <h2 className="text-2xl">
          {isEditing ? "Edit Envelope" : "Add New Envelope"}
        </h2>
        <input
          placeholder="Envelope name"
          type="text"
          maxLength={16}
          className="w-[85%] border p-2 rounded-l"
          value={newEnvelopeName ?? ""}
          onChange={(e) => setNewEnvelopeName(e.target.value.toLowerCase())}
        />
        {newEnvelopeName && (
          <>
            <label
              htmlFor="newTotal"
              className="text-[.75rem] sm:text-[1rem] text-my-white-light"
            >
              How much do you want to add?
            </label>
            <input
              placeholder="Envelope Amount"
              id="newTotal"
              type="number"
              className="w-[85%] border p-2 rounded-md"
              value={newEnvelopeTotal}
              onChange={(e) => setNewEnvelopeTotal(e.target.value)}
            />
            {setNewEnvelopeSpent && (
              <>
                {/* This is for editing envelope */}
                <label
                  htmlFor="newSpent"
                  className="text-[.75rem] sm:text-[1rem] text-my-white-light"
                >
                  How much is already spent
                </label>
                <input
                  placeholder="Spent"
                  id="newSpent"
                  type="number"
                  className="w-[85%] border p-2 rounded-md"
                  value={newEnvelopeSpent}
                  onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                />
              </>
            )}
          </>
        )}
        <Button
          onClick={
            isEditing && envelope
              ? () => {
                  editEnvelope?.({
                    id: envelope!.id,
                    name: newEnvelopeName || "",
                    total: Number(newEnvelopeTotal || envelope.total),
                    spent: Number(newEnvelopeSpent || envelope.spent),
                    order: envelope.order || 1000,
                  });
                }
              : () => {
                  handleSaveEnvelope?.({
                    id: crypto.randomUUID(),
                    name: newEnvelopeName || "",
                    total: Number(newEnvelopeTotal || 0),
                    spent: Number(0), // setting new envelopes to 0 automatically
                    order: 0,
                  });
                }
          }
          color="green"
        >
          Save
        </Button>
        <Button
          onClick={() => {
            handleBack?.();
            // setNewEnvelopeName("");
            // setNewEnvelopeTotal("");
            // setNewEnvelopeSpent("");
          }}
          color="red"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
