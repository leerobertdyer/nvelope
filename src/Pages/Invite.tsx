import { useEffect, useState } from "react";
import { type Invite } from "../types";
import { getInviteToken } from "../firebase/invites";
import { AppStoreBanner } from "../components/IosAppStoreBanner";

export default function InviteLandingPage() {
  const path = window.location.pathname;
  const pathParts = path.split("/"); // ["", "invite", "mockToken123"]
  const inviteToken = pathParts[2];
  const inviteLink = `https://invite.nvelopes.app/i/${inviteToken}`;

  const [tokenMeta, setTokenMeta] = useState<Invite | null>(null);

  useEffect(() => {
    async function getTokenMeta() {
      console.log("INSIDE: ", inviteToken);
      const meta = await getInviteToken(inviteToken);
      console.log("AFTER: ", meta);
      setTokenMeta(meta);
    }
    getTokenMeta();
  }, [inviteToken]);

  if (!tokenMeta) return null;

  const statusMessage =
    tokenMeta.status === "pending"
      ? "Pending..."
      : tokenMeta.status === "consumed"
        ? "This token has already been used."
        : tokenMeta.status === "expired"
          ? `This token has expired. Reach out to ${tokenMeta.invitedEmail} for a new one.`
          : `Token rejected. Reach out to ${tokenMeta.invitedEmail} for a new one.`;

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full gap-8">
      <AppStoreBanner appStoreId="" />
      <div className="flex flex-col gap-2 text-my-white-light justify-center items-center bg-my-green-dark/80 p-8 rounded-md">
        <div className="flex justify-between items-center w-fit gap-4 bg-my-white-dark/80 text-my-black-dark pr-8 overflow-hidden rounded-md">
          <p className="w-[30%] p-4 h-full flex items-center justify-center bg-my-black-base text-my-white-base">
            Status:{" "}
          </p>
          <p className="p-4">{statusMessage}</p>
        </div>
        <p className="w-[30rem] text-sm text-center flex flex-col items-center">
          Click the link below once you've downloaded the app to access
          <span className="text-my-white-dark">
            "{tokenMeta.budgetName}"
          </span>{" "}
        </p>
      </div>
      <a href={inviteLink} className="w-fit underline ">
        {inviteLink}
      </a>
    </div>
  );
}
