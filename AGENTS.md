This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

This project uses npm (`package-lock.json`).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npm run build:android       # release APK/AAB built inside Docker (docker/android, scripts/docker-android-build.ps1)
npm run build:android:install  # Docker build, then adb install + launch on the emulator
```

Java is blocked on the development host, so do not run Gradle locally; Android builds go through the Docker pipeline. Its toolchain versions (JDK, SDK, build-tools, NDK, CMake) are pinned in `docker/android/Dockerfile` and must match `node_modules/react-native/gradle/libs.versions.toml` after SDK upgrades.

Run lint before declaring any task done. The project is plain JavaScript (no TypeScript), so there is no typecheck step.

## Project structure

Athletiq uses **Expo Router** (`"main": "expo-router/entry"`). Docs: https://docs.expo.dev/router/introduction.md

- `src/app/` - routes only. Each route file re-exports a screen; `_layout.js` holds the providers and the stack, `(tabs)/_layout.js` the bottom tabs
- `screens/` - screen components (Home, Progress, Workouts, Profile, ProfileEdit, Settings, WorkoutDetail, MeasurementHistory)
- `sheets/` - quick-action bottom sheets, opened from anywhere with `useSheet()('weight' | 'workout' | 'measurement' | 'activity' | 'goal')`
- `components/` - reusable UI; use `Icon.js` for every icon and `PressableScale`/`Button` for pressables
- `AthletiqContext.js` - app state (Context + `useReducer`) and persistence; screens call `useAthletiq()`
- `storage.js` - the only file that touches AsyncStorage (one JSON object under one key)
- `fitness.js` - pure helpers (age, BMI, categories, units, dates, stats, validation); no React here
- `motion.js` - `useReducedMotion` and the shared `useEntrance` animation
- `theme.js` - design tokens; import colours, spacing, radius, type, icon sizes and durations from here instead of hard-coding values

Data rules: store weights in kg, lengths in cm and dates as `YYYY-MM-DD`; convert only for display. Do not use em dashes in UI copy.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
