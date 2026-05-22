# Nvelopes iOS Migration Audit

## Strategy

- Web app (`main` branch + Vercel) stays untouched throughout
- All RN work lives on `ios-app` branch in a separate Expo project directory
- Firebase backend is shared — same project, same collections, new client
- Port file by file; swap browser APIs as you go

---

## Browser APIs to Replace

### `localStorage` — 🔴 High surface area
**Files:**
- `src/Context/BudgetContext/BudgetProvider.tsx` (active budget key, read/write/remove)
- `src/firebase/editData.ts` (backup before restore, undo restore, clear backup)
- `src/Pages/Settings.tsx` (backup state, undo UI)

**Replace with:** `@react-native-async-storage/async-storage`

**Notes:**
- API is nearly identical — `getItem`, `setItem`, `removeItem` all exist
- Main difference: all methods are `async` (you're already guarding with `typeof window !== "undefined"` so the abstraction layer is already half-there)
- Consider wrapping in a small `storage.ts` util so web and RN can share the interface

```ts
// Install
npx expo install @react-native-async-storage/async-storage

// Usage (same shape, just await)
await AsyncStorage.setItem(key, value)
await AsyncStorage.getItem(key)
await AsyncStorage.removeItem(key)
```

---

### `window.location` — 🟡 Low surface area
**Files:**
- `src/firebase/emailAndPassword.ts` — `window.location.origin` (used for Firebase action URL)
- `src/Pages/Settings.tsx` — `window.location.href = "/"` (redirect after action)
- `src/Pages/Home.tsx` — `window.location.reload()` (force refresh)

**Replace with:** `react-navigation` calls

**Notes:**
- `window.location.origin` in `emailAndPassword.ts` is likely for email verification redirect — in RN this either goes away or uses a deep link URL instead
- `href = "/"` and `reload()` are just navigation resets — use `navigation.reset()` or `navigation.navigate()`

---

### `document.body.style.overflow` — 🟡 Modal scroll lock
**File:** `src/Views/FullScreen.tsx`

**Replace with:** React Native `<Modal>` component

**Notes:**
- You're manually locking body scroll to simulate a full-screen overlay
- RN's `<Modal>` handles this natively and declaratively — no DOM manipulation needed
- This component probably gets rewritten from scratch; the logic is simple enough

```tsx
import { Modal } from 'react-native'

<Modal visible={isOpen} animationType="slide">
  {children}
</Modal>
```

---

### `document.activeElement` + wheel event listener — 🟡 Input focus hook
**File:** `src/hooks.ts`

**Replace with:** RN native input behavior

**Notes:**
- This hook is likely managing scroll-while-focused behavior for `MoneyInput`
- RN's `ScrollView` has `keyboardShouldPersistTaps` prop that handles this pattern
- `TextInput` manages its own focus natively — the hook probably gets deleted entirely
- Check `src/components/MoneyInput.tsx` at port time for related `document.activeElement` usage

---

### `createRoot` / `document.getElementById` — 🟢 Entry point only
**File:** `src/main.tsx`

**Replace with:** `AppRegistry.registerComponent()` (Expo scaffolds this automatically)

**Notes:**
- One-time swap, handled when you scaffold Expo
- Nothing to do manually — just don't copy `main.tsx` into the RN project

---

## Package.json — Check at Port Time

Run this after scaffolding Expo to catch incompatible deps:

```bash
npx expo install [your-packages]
npx expo-doctor
```

**Known likely issues to check:**
- `react-router-dom` → replace with `react-navigation`
- Any CSS modules or CSS-in-JS that touches `document` internally
- Charting libraries if any (Chart.js / Recharts don't work in RN — use Victory Native or Skia)
- `react-hook-form` — works in RN but needs minor tweaks

---

## Firebase Notes

- Firebase JS SDK works in React Native with minor setup differences
- Auth persistence requires `AsyncStorage` to be passed explicitly:

```ts
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})
```

- Firestore and all other Firebase services work the same as web
- Your existing `firebaseConfig` object copies over verbatim

---

## First Steps When Ready to Port

```bash
# 1. Create branch
git checkout -b ios-app

# 2. Scaffold Expo project (in a subdirectory or sibling folder)
npx create-expo-app NvelopesNative --template blank-typescript

# 3. Install Firebase
cd NvelopesNative
npx expo install firebase @react-native-async-storage/async-storage

# 4. Copy firebaseConfig, types, and context logic first
# 5. Get auth + one screen working end-to-end before porting everything

# 6. Run doctor
npx expo-doctor
```

**Apple Developer Program:** $99/year — sign up before you need to test on a real device. Provisioning takes time.

---

## Summary

| Issue | Severity | Files | RN Replacement |
|---|---|---|---|
| `localStorage` | 🔴 Most work | BudgetProvider, editData, Settings | `AsyncStorage` |
| `window.location` | 🟡 Easy | emailAndPassword, Settings, Home | `react-navigation` |
| `document.body` scroll lock | 🟡 Rewrite | FullScreen.tsx | RN `<Modal>` |
| DOM focus/wheel hook | 🟡 Likely delete | hooks.ts, MoneyInput | RN native behavior |
| `createRoot` entry point | 🟢 Auto-handled | main.tsx | Expo scaffolds this |



Original grep command:

```
grep -r "window\." src/                                                              
grep -r "document\." src/
grep -r "localStorage\|sessionStorage" src/
grep -r "navigator\." src/
```

original response:
```
src/firebase/emailAndPassword.ts:    typeof window !== "undefined" ? window.location.origin : "";
src/Pages/Settings.tsx:        window.location.href = "/";
src/Pages/Home.tsx:            onClick={() => window.location.reload()} 
src/main.tsx:createRoot(document.getElementById("root")!).render(
src/components/MoneyInput.tsx:    if (el && document.activeElement === el) {
src/Views/FullScreen.tsx:    const originalOverflow = document.body.style.overflow;
src/Views/FullScreen.tsx:    document.body.style.overflow = "hidden";
src/Views/FullScreen.tsx:      document.body.style.overflow = originalOverflow;
src/hooks.ts:            const el = document.activeElement;
src/hooks.ts:        document.addEventListener("wheel", handler, { passive: true });
src/hooks.ts:        return () => document.removeEventListener("wheel", handler);
src/Context/BudgetContext/BudgetProvider.tsx:      const stored = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_BUDGET_KEY) : null;
src/Context/BudgetContext/BudgetProvider.tsx:          localStorage.setItem(ACTIVE_BUDGET_KEY, nextActive);
src/Context/BudgetContext/BudgetProvider.tsx:        if (typeof window !== "undefined") localStorage.removeItem(ACTIVE_BUDGET_KEY);
src/Context/BudgetContext/BudgetProvider.tsx:        if (typeof window !== "undefined") localStorage.setItem(ACTIVE_BUDGET_KEY, newId);
src/Context/BudgetContext/BudgetProvider.tsx:      if (id) localStorage.setItem(ACTIVE_BUDGET_KEY, id);
src/Context/BudgetContext/BudgetProvider.tsx:      else localStorage.removeItem(ACTIVE_BUDGET_KEY);
src/Context/BudgetContext/BudgetProvider.tsx:      if (typeof window !== "undefined") localStorage.setItem(ACTIVE_BUDGET_KEY, budgetId);
src/firebase/editData.ts: * Saves the current user data to localStorage before a restore operation.
src/firebase/editData.ts: * Save current user data to localStorage before restore
src/firebase/editData.ts:    localStorage.setItem(ASYNCSTORAGE_BACKUP_KEY, JSON.stringify(backup));
src/firebase/editData.ts:    console.error("Error saving to localStorage:", error);
src/firebase/editData.ts: * Get the localStorage backup if it exists
src/firebase/editData.ts:    const stored = localStorage.getItem(ASYNCSTORAGE_BACKUP_KEY);
src/firebase/editData.ts:    console.error("Error reading localStorage backup:", error);
src/firebase/editData.ts: * Clear the localStorage backup after successful undo
src/firebase/editData.ts:    localStorage.removeItem(ASYNCSTORAGE_BACKUP_KEY);
src/firebase/editData.ts:    console.log("🗑️ Cleared localStorage backup");
src/firebase/editData.ts:    console.error("Error clearing localStorage backup:", error);
src/firebase/editData.ts: * Restore from localStorage backup (undo last restore) into the given budget.
src/firebase/editData.ts:    console.error("Error restoring from localStorage backup:", error);
src/Pages/Settings.tsx:  const [localStorageBackup, setLocalStorageBackup] =
src/Pages/Settings.tsx:  // Load safe backups for active budget and check for localStorage backup
src/Pages/Settings.tsx:      // After restore, update localStorage backup state (now available for undo)
src/Pages/Settings.tsx:    if (!user || !localStorageBackup || !activeBudgetId) return;
src/Pages/Settings.tsx:      const { data } = localStorageBackup;
src/Pages/Settings.tsx:      // Clear the localStorage backup state
src/Pages/Settings.tsx:    if (!localStorageBackup) return null;
src/Pages/Settings.tsx:          Saved: {new Date(localStorageBackup.timestamp).toLocaleString()}
src/Pages/Settings.tsx:          {localStorageBackup.data.envelopes?.length ?? 0} envelopes,{" "}
src/Pages/Settings.tsx:          {localStorageBackup.data.payments?.length ?? 0} payments
src/Pages/Settings.tsx:            {showUndoConfirm && localStorageBackup && (
src/Pages/Settings.tsx:                    {localStorageBackup.data.totalSpendingBudget}
src/Pages/Settings.tsx:                    {localStorageBackup.data.payments?.length ?? 0} payments
src/Pages/Settings.tsx:                    {localStorageBackup.data.envelopes?.length ?? 0} envelopes
```
