# Nvelope

A personal finance management app built with React, TypeScript, and Firebase.

## Features

- User authentication with Google
- Folder management
- Envelope management

## Tech Stack

- React
- TypeScript
- Firebase
- Tailwind CSS


# TODO

🐛 => Nvelope.Total is not reset properly. Need to add a ResetTotal to the envelopes so we can giveandtake from each envelope and when we reset it will use the ResetTotal instead. 


1. I am using the max of 28 calendar days.
This is going to cause bugs down the road.... anytime at the end of the month if a bill is marked as 28th it is technically in the past, even though it isn't... lol Have to fix this....

2. There's no current method to add a bill by weekday (ie every thursday)

3. No way to set a bill to "last friday of month" etc...

4. weekly/biweekly/monthly bill option would be nice same as above. For example: ACORNS doesn't fit my model atm.



# Nice To Have
- Make money flip like it's an actual counter like at a baseball game
- Finish 3d button and give it time before it moves to next page...
- Report page
- Tie in bank account with Plaid and import transactions...
- Turn into a full app available on app store


Phase 2 (Automatic adjustments)

1. Make sure the user can change days of their payment.
2. Add ability to temporarily change days. 
3. Confirm with user before updating.


Phase 3 (TELLER - bank monitoring and notifications)
1. Use Teller to get live read on bank account
2. Prompt spending that doesn't match envelopes
3. Auto-apply certain transactions to specific envelopes
4. Auto-apply income


Phase 4 (Baas Banking Envelopes) ** Dream app || Very Challenging **
1. Add Moov or Unit for real envelopes + money movement
2. Card Issuing with Real-Time Authorization Hooks
3. in-App NFC Payments (not Apple Pay) (android app)
4. UX Timing & Transaction Matching (IE "what envelope?")
5. $$ ACTUALLY comes out of envelope