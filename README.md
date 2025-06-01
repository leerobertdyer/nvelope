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
1. Fix totalSpendingBudget
    - It was in a useeffect that only updated the state, but needs to be handled manually to update both state AND DB
    - Triggered By:
        * Add Bill 
        * Add Envelope 
        * Add OneTimeCash 
        * Edit Envelope 
        * Edit Bill 
        * Edit OneTimeCash 
        * Delete Bill 
        * Delete Envelope 
        * Delete OneTimeCash 
        * Edit CASH (mainpage edit) 
        * Edit interval
    - Make sure to check Demo as well

2. Only Allow adding of funds to envelope when available
3. Make sure data is persisted between resets
4. Implement a non-time based budget that uses fixed income, never resets, and use of permanent envelopes
    - Use Erin's business as model

# Nice To Have
- Make money flip like it's an actual counter like at a baseball game
- Finish 3d button and give it time before it moves to next page...
- Report page
- Tie in bank account with Plaid and import transactions...
- Turn into a full app available on app store
