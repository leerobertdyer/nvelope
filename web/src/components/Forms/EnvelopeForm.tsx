import Button from "../Buttons/Button";
import type { Envelope } from "../../types";
import FullScreen from "../../Views/FullScreen";
import MoneyInput from "../MoneyInput";
import TextInput from "../TextInput";
import { randomUUID } from "../../util";

interface IProps {
  newEnvelopeName: string;
  setNewEnvelopeName: (s: string) => void;
  newEnvelopeTotal: number;
  setNewEnvelopeTotal: (n: number) => void;
  isEditing: boolean;
  handleBack?: () => void;
  handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
  editEnvelope?: (envelope: Envelope) => Promise<void>;
  envelope?: Envelope;
  newEnvelopeSpent?: number;
  setNewEnvelopeSpent?: (n: number) => void;
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
    <FullScreen>
      <h2 className="text-2xl text-my-white-base p-2 text-3xl text-center w-full">
        {isEditing ? "Edit Envelope" : "Add New Nvelope"}
      </h2>
      <div className="md:rounded-md bg-my-white-base text-my-black-dark flex flex-col items-center justify-start gap-2 max-w-[40rem] p-4 gap-4 m-auto">
        <TextInput 
          id="newEnvelopeName"
          label="What is the name of the envelope?"
          placeholder="Envelope name"
          maxLength={16}
          value={newEnvelopeName ?? ""}
          onChange={(e) => setNewEnvelopeName(e.target.value.toLowerCase())}
        />
        {newEnvelopeName && (
          <>
            <MoneyInput
              id="newTotal"
              label="How much do you want to add?"
              placeholder="Envelope Amount"
              value={newEnvelopeTotal}
              onChange={setNewEnvelopeTotal}
            />
            {setNewEnvelopeSpent != null && (
              <>
                {/* This is for editing envelope */}
                <MoneyInput
                  id="newSpent"
                  label="How much is already spent?"
                  placeholder="Spent"
                  value={newEnvelopeSpent ?? 0}
                  onChange={(n) => setNewEnvelopeSpent(n)}
                />
              </>
            )}
          </>
        )}
        {newEnvelopeName && newEnvelopeTotal > 0 && (
          <Button
            onClick={
              isEditing && envelope
                ? () => {
                    editEnvelope?.({
                      id: envelope!.id,
                      name: newEnvelopeName,
                      total: newEnvelopeTotal,
                      spent: newEnvelopeSpent ?? envelope.spent,
                      order: envelope.order || 1000,
                    });
                  }
                : () => {
                    handleSaveEnvelope?.({
                      id: randomUUID(),
                      name: newEnvelopeName,
                      total: newEnvelopeTotal,
                      spent: 0,
                      order: 0,
                    });
                  }
            }
            color="green"
          >
            Save
          </Button>
        )}
        <Button
          onClick={() => {
            handleBack?.();
            // setNewEnvelopeName("");
            // setNewEnvelopeTotal("");
            // setNewEnvelopeSpent("");
          }}
          color="red"
        >
          Back
        </Button>
      </div>
    </FullScreen>
  );
}
