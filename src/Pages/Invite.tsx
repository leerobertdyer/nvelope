import { useEffect, useState } from "react";
import { type Invite } from "../types";
import { acceptToken, getInviteToken } from "../firebase/invites";
import { AppStoreBanner } from "../components/IosAppStoreBanner";
import { useAuth } from "../Context/AuthContext/useAuth";
import { useBudget } from "../Context/BudgetContext/useBudget";
import Button from "../components/Buttons/Button";
import { useNavigate } from "react-router-dom";

export default function InviteLandingPage() {
  const path = window.location.pathname;
  const pathParts = path.split("/"); // ["", "invite", "mockToken123"]
  const inviteToken = pathParts[2];
  const inviteLink = `https://invite.nvelopes.app/i/${inviteToken}`;
  const { user } = useAuth();
  const { refetchBudgets, setActiveBudgetId } = useBudget();
  const navigate = useNavigate();

  const [tokenMeta, setTokenMeta] = useState<Invite | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function getTokenMeta() {
      const meta = await getInviteToken(inviteToken);
      setTokenMeta(meta);
    }
    getTokenMeta();
  }, [inviteToken]);

  async function handleAccept() {
    if (!user) return;
    setIsAccepting(true);
    setAcceptError(null);
    const result = await acceptToken(inviteToken, user);
    setIsAccepting(false);
    if (result.success) {
      setAccepted(true);
      await refetchBudgets();
      if (result.budgetId) setActiveBudgetId(result.budgetId);
      navigate("/");
    } else {
      setAcceptError(result.error ?? "Failed to accept invite");
    }
  }

  if (!tokenMeta) return null;

  const statusMessage = accepted
    ? `You've joined "${tokenMeta.budgetName}"!`
    : tokenMeta.status === "pending"
      ? "Pending..."
      : tokenMeta.status === "consumed"
        ? "This token has already been used."
        : tokenMeta.status === "expired"
          ? `This token has expired. Reach out to ${tokenMeta.invitedEmail} for a new one.`
          : `Token rejected. Reach out to ${tokenMeta.invitedEmail} for a new one.`;

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full gap-8">
      <AppStoreBanner appStoreId="" />
      {!accepted && tokenMeta.status === "pending" && user && (
        <div className="flex flex-col items-center gap-2 w-full">
          <Button color="green" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? "Joining..." : "Accept Invite (Web)"}
          </Button>
          {acceptError && (
            <p className="text-my-red-light text-sm text-center">
              {acceptError}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 text-my-white-light justify-center items-center  p-8 rounded-md w-full">
        <div className="flex justify-between items-center w-fit gap-4 bg-my-white-dark/80 text-my-black-dark pr-8 overflow-hidden rounded-md">
          <p className="w-[30%] p-4 h-full flex items-center justify-center bg-my-black-base text-my-white-base">
            Status:{" "}
          </p>
          <p className="p-4">{statusMessage}</p>
        </div>
        {!accepted && (
          <p className="w-[30rem] text-sm text-center flex flex-col items-center">
            Click the link below once you've downloaded the app to access
            <span className="text-my-white-dark">
              "{tokenMeta.budgetName}"
            </span>{" "}
          </p>
        )}
      </div>
      {!accepted && (
        <a href={inviteLink} className="w-fit underline ">
          {inviteLink}
        </a>
      )}
    </div>
  );
}
