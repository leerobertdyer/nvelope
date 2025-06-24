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

** Another issue is that I am using the max of 28 calendar days.
This is going to cause bugs down the road.... anytime at the end of the month if a bill is marked as 28th it is technically in the past, even though it isn't... lol Have to fix this....

1. Fix totalSpendingBudget:
    - When Deleting a bill
    - When Adding a bill
    - When Editing a bill

2. Only Allow adding of funds to envelope when available
3. Make sure data is persisted between budget resets
4. Implement a non-time based budget that uses fixed income, never resets, and use of permanent envelopes
    - Use Erin's business as model

# Nice To Have
- Make money flip like it's an actual counter like at a baseball game
- Finish 3d button and give it time before it moves to next page...
- Report page
- Tie in bank account with Plaid and import transactions...
- Turn into a full app available on app store
