import { useState } from "react";
import { useBudget } from "../Context/BudgetContext/useBudget";
import FullScreen from "../Views/FullScreen";

export default function InviteModal() {
  const { pendingInvites, acceptInvite, declineInvite } = useBudget();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const invite = pendingInvites[0];
  if (!invite) return null;

  async function handleAccept() {
    setIsAccepting(true);
    try {
      await acceptInvite(invite.budgetId);
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleDecline() {
    setIsDeclining(true);
    try {
      await declineInvite(invite.inviteId);
    } finally {
      setIsDeclining(false);
    }
  }

  return (
    <FullScreen
      theme="LIGHT"
      onSave={handleAccept}
      onClose={handleDecline}
      showButtons
      saveButtonText="Accept"
      saveButtonColor="green"
      closeButtonText="Decline"
      saveButtonDisabled={isAccepting}
      closeOnSave={false}
    >
      <div className="w-full text-center px-4">
        <p className="text-lg text-my-white-dark">
          <span className="font-semibold">{invite.inviterEmail}</span> invited you
          to use their budget &quot;{invite.budgetName}&quot;
        </p>
        {(isAccepting || isDeclining) && (
          <p className="text-sm text-my-white-light mt-2">Updating…</p>
        )}
      </div>
    </FullScreen>
  );
}
