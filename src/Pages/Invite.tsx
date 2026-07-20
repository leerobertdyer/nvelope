import { useEffect, useState } from 'react';

export default function InviteLandingPage() {
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    // window.location.pathname will return something like "/invite/mockToken123"
    const path = window.location.pathname; 
    const pathParts = path.split('/'); // ["", "invite", "mockToken123"]
    
    if (pathParts[1] === 'invite' && pathParts[2]) {
      setInviteToken(pathParts[2]);
    }
  }, []);

  return (
    <div>
      {/* Render store badges and show the inviteToken on the screen for copy/pasting */}
      {inviteToken && <p>Your Invite Code: {inviteToken}</p>}
    </div>
  );
}