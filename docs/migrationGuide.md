# Nvelopes → Expo Migration Guide

## Status Checklist

- [x] Apple Developer account enrolled
- [x] Xcode installed
- [x] `create-expo-app mobile --template blank-typescript`
- [x] `expo-dev-client` installed
- [x] `pod-install` run
- [ ] Dependencies installed
- [ ] NativeWind configured
- [ ] Files migrated

---

## 1. Install Dependencies

```bash
npx expo install \
  nativewind \
  react-native-safe-area-context \
  react-native-calendars \
  @react-native-async-storage/async-storage \
  @expo/vector-icons
```

> `@expo/vector-icons` may already be included — check your package.json first.

---

## 2. Configure NativeWind v4

### `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### `metro.config.js`

Create this file at the project root if it doesn't exist:

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

### `global.css`

Create at project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### `app/_layout.tsx`

Import the global CSS at the top of your root layout:

```tsx
import "../global.css";
```

---

## 3. Dependency Mapping

| Web | Native Equivalent | Notes |
|---|---|---|
| `react-router-dom` | Expo Router | Already included, file-based routing |
| `react-calendar` | `react-native-calendars` | Most full-featured RN option |
| `react-icons` | `@expo/vector-icons` | Wraps Ionicons, FontAwesome, etc. |
| `tailwindcss` | NativeWind v4 | Same class names, RN primitives |
| `firebase` | `firebase` | Same SDK, RN compatible |
| `date-fns` | `date-fns` | Plain JS, no changes needed |
| `localStorage` | `@react-native-async-storage/async-storage` | Async API |
| `div` / `span` / `p` | `View` / `View` / `Text` | All RN primitives |
| CSS files | `StyleSheet.create` or NativeWind | No CSS modules in RN |

**Drop entirely:** `vite`, `react-dom`, `postcss`, `@vitejs/plugin-react`

---

## 4. Migration Strategy

### Start with the data layer (zero RN-specific changes needed)

- TypeScript types/interfaces
- Utility functions
- Firebase config and service functions
- Any business logic not tied to the DOM

### Then migrate components one at a time

Replace HTML primitives as you go:

```tsx
// Web
<div className="flex flex-col p-4">
  <p className="text-lg font-bold">Hello</p>
</div>

// Native (NativeWind)
<View className="flex flex-col p-4">
  <Text className="text-lg font-bold">Hello</Text>
</View>
```

### Wrap your root in SafeAreaProvider

```tsx
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* your app */}
    </SafeAreaProvider>
  );
}
```

---

## 5. Routing (Expo Router)

Expo Router is file-based like Next.js App Router. Files live in `/app`.

```
app/
  _layout.tsx       ← root layout
  index.tsx         ← "/" route
  dashboard.tsx     ← "/dashboard"
  budget/
    [id].tsx        ← "/budget/123"
```

Navigation:

```tsx
import { router } from "expo-router";

router.push("/dashboard");
router.push(`/budget/${id}`);
```

---

## 6. AsyncStorage (replaces localStorage)

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Set
await AsyncStorage.setItem("key", JSON.stringify(value));

// Get
const raw = await AsyncStorage.getItem("key");
const value = raw ? JSON.parse(raw) : null;

// Remove
await AsyncStorage.removeItem("key");
```

---

## 7. First Build

Once dependencies are installed and NativeWind is configured, do your first local build:

```bash
npx expo run:ios
```

Plug in your iPhone via USB if you want it on device instead of simulator.
First build takes a few minutes — subsequent builds are faster.

---

## Future: Notifications + Biometrics

When you're ready:

```bash
npx expo install expo-notifications expo-local-authentication
```

Both require a dev client rebuild after install (one-time), then JS iteration as normal.

- `expo-local-authentication` — Face ID / Touch ID
- `expo-notifications` — push + local notifications, does **not** work in Expo Go or simulator

---

## Future: App Store / TestFlight

When ready to ship:

```bash
npm install -g eas-cli
eas login
eas build --profile production --platform ios
eas submit --platform ios
```
