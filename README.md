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

- Move the edit payments to it's own component form and improve the showButtons. 
    - Currently if you attempt to edit the total of a debt the save button doesn't show because it relies on handleEditType...
- Display dates in order for payments. 
    - Especially during end of month where there is potential for dates from next month (1st, 2nd, 3rd, etc) to show up along side dates from end (28th 29th, etc...) Currently they are mixed in, and not sorted at all.
    - The real trick will involve knowing the dates so we can show later dates first if need be...
- Weekly bills only show up one week at a time, but I'd like to see all of them for the month
- Handle Paid checkmark appropriately. Needs to reset at some point but not sure how that will work with different intervals. Perhaps can use actual date? Like if it's a new date we reset to paid...?


# Nice To Have
- A way to set a bill to "last friday of month" etc...
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