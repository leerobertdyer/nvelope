import Button from "../Buttons/Button";
import type { Envelope } from "../../types";
import FullScreen from "../../Views/FullScreen";
import TextInput from "../TextInput";

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
            <TextInput
              id="newTotal"
              label="How much do you want to add?"
              placeholder="Envelope Amount"
              value={newEnvelopeTotal}
              onChange={(e) => setNewEnvelopeTotal(e.target.value)}
            />
            {setNewEnvelopeSpent && (
              <>
                {/* This is for editing envelope */}
                <TextInput
                  placeholder="Spent"
                  id="newSpent"
                  numeric
                  label="How much is already spent?"
                  value={newEnvelopeSpent ?? ""}
                  onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                />
              </>
            )}
          </>
        )}
        {newEnvelopeName && Number(newEnvelopeTotal) > 0 && (
          <Button
            onClick={
              isEditing && envelope
                ? () => {
                    editEnvelope?.({
                      id: envelope!.id,
                      name: newEnvelopeName,
                      total: Number(newEnvelopeTotal),
                      spent: Number(newEnvelopeSpent || envelope.spent),
                      order: envelope.order || 1000,
                    });
                  }
                : () => {
                    handleSaveEnvelope?.({
                      id: crypto.randomUUID(),
                      name: newEnvelopeName,
                      total: Number(newEnvelopeTotal),
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
