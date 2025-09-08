import { IoStar } from "react-icons/io5";
import { useDatabase } from "../../Context/DatabaseContext/useDatabase";
import { transformIntervalMidSentence } from "../../util";
import Button from "../Button";
import type { Envelope } from "../../types";

interface IProps {
    newEnvelopeName: string
    setNewEnvelopeName: (s: string) => void
    newEnvelopeTotal: string
    setNewEnvelopeTotal: (s: string) => void
    newEnvelopeSaving: boolean
    setNewEnvelopeSaving: (b: boolean) => void
    newEnvelopeResetTotal: string
    setNewEnvelopeResetTotal: (s: string) => void
    isEditing: boolean
    handleBack?: () => void;
    handleSaveEnvelope?: (envelope: Envelope) => Promise<void>;
    editEnvelope?: (envelope: Envelope) => Promise<void>;
    envelope?: Envelope
    newEnvelopeSpent?: string
    setNewEnvelopeSpent?: (s: string) => void
}

export default function EnvelopeForm(props: IProps) {
    const { 
        newEnvelopeName, 
        setNewEnvelopeName, 
        newEnvelopeTotal, 
        setNewEnvelopeTotal,
        newEnvelopeSaving,
        setNewEnvelopeSaving,
        newEnvelopeResetTotal,
        setNewEnvelopeResetTotal,
        handleSaveEnvelope,
        handleBack,
        isEditing,
        editEnvelope,
        envelope,
        newEnvelopeSpent,
        setNewEnvelopeSpent
     } = props

    const { payPeriodInterval } = useDatabase();

    return (
            <div className="min-h-screen w-full absolute inset-0 bg-my-blue-dark text-white">
              <div className="flex flex-col items-center justify-center gap-2 max-w-[40rem] my-20">
                <h2 className="text-2xl">{isEditing ? 'Edit Envelope' : 'Add New Envelope'}</h2>
                <input
                  type="text"
                  maxLength={16}
                  className="w-[85%] border p-2 rounded-l"
                  value={newEnvelopeName ?? ""}
                  onChange={(e) =>
                    setNewEnvelopeName(e.target.value.toLowerCase())
                  }
                  placeholder="Envelope name"
                />
                {newEnvelopeName && <>
                  <label className="text-[.75rem] sm:text-[1rem] text-my-white-light" htmlFor="newTotal">
                    How much will you spend on this every {transformIntervalMidSentence(payPeriodInterval)}
                  </label>
                  <input
                    id="newTotal"
                    type="number"
                    className="w-[85%] border p-2 rounded-md"
                    value={newEnvelopeTotal}
                    onChange={(e) => setNewEnvelopeTotal(e.target.value)}
                    placeholder="Envelope Amount"
                  />
                  {setNewEnvelopeSpent && <>
                  <label className="text-[.75rem] sm:text-[1rem] text-my-white-light" htmlFor="newSpent">
                    How much is already spent
                  </label>
                  <input
                    id="newSpent"
                    type="number"
                    className="w-[85%] border p-2 rounded-md"
                    value={newEnvelopeSpent}
                    onChange={(e) => setNewEnvelopeSpent(e.target.value)}
                    placeholder="Spent"
                  />
                  </>
                  }
                  {newEnvelopeTotal && <>
                    <div className="w-full flex justify-center items-center gap-2 text-[.75rem] text-my-white-light">
                      <IoStar className="text-my-white-dark" size={20} />
                      Save up the $$ every {transformIntervalMidSentence(payPeriodInterval)}?
                    </div>
                    <div className="flex justify-center items-center gap-4 w-full">
    
                      <div className="flex w-fit gap-2">
                        <label className="text-[.75rem] sm:text-[1rem] text-my-white-light" htmlFor="newEnvelopeSaving">No</label>
                        <input
                          type="radio"
                          value={"no"}
                          checked={!newEnvelopeSaving}
                          id="newEnvelopeSaving"
                          onChange={() =>
                            setNewEnvelopeSaving(false)
                          }
                        />
                      </div>
                      <div className="flex w-fit gap-2">
                        <label className="text-[.75rem] sm:text-[1rem] text-my-white-light" htmlFor="newEnvelopeSaving">Yes</label>
                        <input
                          type="radio"
                          value={"yes"}
                          checked={newEnvelopeSaving}
                          id="newEnvelopeSaving"
                          onChange={() =>
                            setNewEnvelopeSaving(true)
                          }
                        />
                      </div>
                    </div>
                    {!newEnvelopeSaving &&
                      <div className="text-center text-[.75rem] sm:text-[1rem] text-my-white-light flex justify-center items-center flex-col gap-2 w-[85%]">
                        <label className="text-[.75rem] sm:text-[1rem] text-my-white-light"
                          htmlFor="newEnvelopeResetTotal">
                          Amount to reset to every {transformIntervalMidSentence(payPeriodInterval)}</label>
                        <input
                          id="newEnvelopeResetTotal"
                          type="number"
                          className="w-[100%] border p-2 rounded-md"
                          value={newEnvelopeResetTotal}
                          onChange={(e) => setNewEnvelopeResetTotal(e.target.value)}
                          placeholder="Amount To Reset To"
                        />
    
                      </div>}
                  </>}
                </>}
                <Button
                  onClick={
                    isEditing && envelope
                    ? () => {
                    editEnvelope?.({
                        id: envelope!.id,
                        name: newEnvelopeName || "",
                        total: Number(newEnvelopeTotal || envelope.total),
                        spent: Number(newEnvelopeSpent || envelope.spent),
                        saving: newEnvelopeSaving || envelope.saving,
                        resetTotal: Number(newEnvelopeResetTotal || envelope.resetTotal),
                        order: envelope.order || 1000
                    })}
                    : () => {
                    handleSaveEnvelope?.({
                      id: crypto.randomUUID(),
                      name: newEnvelopeName || "",
                      total: Number(newEnvelopeTotal || 0),
                      resetTotal: Number(newEnvelopeResetTotal || 0),
                      spent: Number(0), // setting new envelopes to 0 automatically
                      saving: newEnvelopeSaving,
                      order: 0
                    });
                  }}
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