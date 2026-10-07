# Athletiq

Personal fitness companion for Android, built with Expo and React Native.

Athletiq tracks your body metrics, weight, BMI, goals, workouts, body measurements and daily activity. It works fully offline: there is no account, no server and no analytics, and everything is stored locally on the device.

## Features

### Dashboard (Home)
- Greeting and a snapshot of your current weight, change over the last 30 days, BMI, category badge and BMI scale
- Quick actions for **Weight**, **Workout**, **Activity** and **Measure**, each opening a bottom sheet
- Today's manually entered activity (steps, active minutes, calories)
- Goal card with progress bar, percentage, remaining weight and an optional weekly pace estimate
- Two most recent workouts
- Intentional empty states when there is no profile or no data yet (no fake numbers)

### Progress
- Weight summary: current, change since first entry, start, lowest and highest
- Line chart (SVG) with a **Weight / BMI** switch; tap or drag to read any entry, draws in once on load
- BMI history: every weigh-in stores the height and BMI used at that moment, so editing your height later never rewrites history
- Body measurements overview, recent activity days and full weight history with delete (with confirmation)

### Workouts
- Weekly summary (Monday to today): number of workouts and total minutes
- Log a workout: type (Strength, Cardio, Running, Cycling, Walking, Sports, Mobility, Other), duration, date, optional note
- Workout details with **Edit** and **Delete** (with confirmation)

### Profile
- Profile summary: name, age, gender, height, current weight, BMI and category
- **Edit profile** opens the original Athletiq calculator: same fields, validation, shake on error, scroll to the first error, results card, weight explorer and Recalculate. Saving a new weight also records it as today's weigh-in
- Goal (target weight, optional weekly pace, "Goal reached" state with a small one-off animation)
- Body measurements: waist, chest, hips, arms, thighs (any subset). Each tile shows the latest value and the change since the first entry; tap for history, a trend chart and per-value delete
- Unit preference (metric / imperial)

### Settings
- Units: metric (kg, cm) or imperial (lb, ft/in, in). Workout durations always use minutes
- **Export data** as a JSON file through the Android share sheet
- **Clear all data** with a confirmation dialog
- About (version) and a plain-language privacy note

### Across the app
- One design system in `theme.js` (colours, spacing, radius, type, icon sizes, shadow, animation durations, touch size)
- One icon set (Material Community Icons through `components/Icon.js`), no emoji icons
- Restrained motion: card entrances, chart draw-in, goal progress fill, press scale, tab fade. All of it is skipped when Android's "Remove animations" setting is on
- Accessible labels and roles, 48 dp minimum touch targets, screen reader support for the chart (swipe up/down to step through entries)
- Small phones (< 360 dp wide): metric tiles, quick actions and form fields stack

## BMI categories

BMI = weight (kg) ÷ height (m)²

| Category      | BMI range     |
| ------------- | ------------- |
| Underweight   | below 18.5    |
| Normal weight | 18.5 to 24.9  |
| Overweight    | 25 to 29.9    |
| Obesity       | 30 and over   |

BMI is a screening measure, not a diagnosis. Goals are a personal tracking tool, not medical advice.

## Validation rules

| Field            | Rule                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| Name             | Required, at least 2 characters, letters only (plus space, `.`, `'`, `-`) |
| Date of birth    | Required, not in the future, age 20 to 120 (adult BMI ranges)             |
| Gender           | Required (Male / Female)                                                  |
| Height           | Required, 50 to 250 cm (or the equivalent in feet and inches)             |
| Weight / target  | Required, 10 to 300 kg (or the equivalent in pounds)                      |
| Workout          | Type required; duration required, whole minutes, 1 to 600                 |
| Measurements     | At least one value; each 10 to 300 cm (4 to 118 in)                       |
| Activity         | At least one value; steps 0 to 100,000, active minutes 0 to 1,440, calories 0 to 10,000 |

## Offline architecture and local storage

```
UI (screens, sheets, components)
        |
AthletiqContext.js   React Context + useReducer: app state, actions, persistence
        |
fitness.js           pure helpers: age, BMI, categories, units, dates, stats, validation
storage.js           AsyncStorage wrapper: load / save / clear one JSON object
```

- All data is one object saved under a single AsyncStorage key. It is written after each change; forms only dispatch on submit, so typing never triggers a write.
- Weights are stored in **kg**, lengths in **cm**, dates as **`YYYY-MM-DD`** local calendar dates. Values are converted only for display, so switching units never changes or slowly rounds your data.
- On launch the app shows a small loading state, reads the saved data (or starts empty), then renders. If the data cannot be read, it shows a retry screen and deletes nothing.
- AsyncStorage is local app storage, not encrypted by Athletiq. Android may include app data in device backups depending on your backup settings. The JSON export goes only where you choose to share it.

Data shape:

```js
{
  version: 1,
  settings: { unitSystem: 'metric' },
  profile: { name, dateOfBirth, gender, heightCm, weightKg },
  goals: { targetWeightKg, weeklyWeightChangeKg, startWeightKg, setOn },
  weightHistory: [{ id, date, createdAt, weightKg, heightCm, bmi, note }],
  measurements: [{ id, date, createdAt, values: { waist, chest, hips, arms, thighs } }],
  workouts: [{ id, type, durationMin, date, createdAt, note }],
  dailyActivity: [{ date, steps, activeMinutes, calories }],
}
```

## Navigation

[Expo Router](https://docs.expo.dev/router/introduction/) with routes in `src/app/`. Route files are thin and re-export screens from `screens/`.

- Bottom tabs (custom tab bar): **Home**, **Progress**, **Workouts**, **Profile**
- Stack screens on top of the tabs: Edit profile, Settings, Workout details, Measurement history
- Quick actions use bottom sheets, not separate screens

## Tech stack

- [Expo SDK 57](https://docs.expo.dev/) with React Native 0.86 and React 19, plain JavaScript
- `expo-router` for navigation
- `@react-native-async-storage/async-storage` for local persistence
- `react-native-svg` for the progress charts
- `expo-file-system` and `expo-sharing` for the JSON export
- `@react-native-community/datetimepicker` for the native Android date picker
- `@expo/vector-icons` (Material Community Icons)
- ESLint with `eslint-config-expo`

All of these modules are included in Expo Go for SDK 57, so no development build is required.

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) (LTS) and an Android emulator or device. Set up the emulator with the [Expo Android Studio guide](https://docs.expo.dev/workflow/android-studio-emulator/).

```bash
git clone https://github.com/noumanh11/athletiq.git
cd athletiq
npm install
```

Run it in **Expo Go** (quickest):

```bash
npx expo start --android
```

Or build and install a **development build** on the emulator/device:

```bash
npm run android      # expo run:android
```

After adding a new library with native code, rebuild the development build (or check that it is included in Expo Go).

## Scripts

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm start`       | Start the Expo dev server                         |
| `npm run android` | Generate the native project and run it on Android |
| `npm run lint`    | Lint the project with ESLint                      |
| `npx expo-doctor` | Check dependencies and config                     |

## Building with EAS

```bash
npx eas-cli@latest build:configure   # first time only: creates eas.json
npx eas-cli@latest build --platform android
```

See the [EAS Build docs](https://docs.expo.dev/build/introduction/).

## Manual test plan

Run these on the Android emulator (small, normal and large phone sizes; keyboard open and closed).

**Original calculator (Profile > Edit profile)**
1. Press *Calculate My Metrics* on an empty form: every field shows an error, wrong fields shake, the screen scrolls to the first error.
2. Fix a field: its error clears as soon as the value is valid.
3. Enter valid values: the results card shows BMI, age, category badge, BMI scale, tip, height/weight tiles and the weight explorer.
4. Switch metric / imperial: values convert and validation uses the selected units.
5. *Recalculate* hides the results and keeps the entries.

**Weight and BMI**
1. Add weigh-ins on different dates; history is newest first and each row shows its BMI.
2. The chart draws, and tapping a point shows its value and date. Switch to *BMI*.
3. Delete a weigh-in: a confirmation appears; after confirming, it is removed everywhere.

**Goals**
1. Set a target and pace: target, remaining weight, percentage and weeks estimate show.
2. Add a weigh-in closer to the target: progress updates.
3. Reach the target: "Goal reached" appears with a short animation. Edit or remove the goal.

**Workouts**
1. Save with no type and no duration, then with 900 minutes: errors show.
2. Log a valid workout: the weekly summary updates. Open it, edit it, delete it (with confirmation).

**Measurements and activity**
1. Save an empty measurement form: "Enter at least one measurement." Then add waist, chest and arms.
2. Open a measurement: latest value, history and delete. Switch units: cm and in convert.
3. Add activity with an out-of-range value: an error shows. Save valid values: Home shows them as manually entered. Reopen to edit.

**Persistence**
1. Add a profile, weight, workout, measurement, goal and activity.
2. Close the app completely and reopen: everything is still there, including the unit choice.
3. Settings > Clear all data > confirm. Close and reopen: the app starts clean.

**Navigation and export**
1. Switch between all four tabs repeatedly: no crashes, correct active tab, data kept.
2. Settings > Export data: the share sheet offers `athletiq-export-YYYY-MM-DD.json`.

## Project structure

```
.
├── src/app/                     # Expo Router routes (thin files that re-export screens)
│   ├── _layout.js               # Providers, loading/error state, stack navigator
│   ├── (tabs)/_layout.js        # Bottom tabs with the custom tab bar
│   ├── (tabs)/index.js          # Home
│   ├── (tabs)/progress.js
│   ├── (tabs)/workouts.js
│   ├── (tabs)/profile.js
│   ├── profile-edit.js
│   ├── settings.js
│   ├── workout/[id].js
│   └── measurement/[key].js
├── screens/                     # Screen components
│   ├── HomeScreen.js
│   ├── ProgressScreen.js
│   ├── WorkoutsScreen.js
│   ├── WorkoutDetailScreen.js
│   ├── ProfileScreen.js
│   ├── ProfileEditScreen.js     # The original calculator, now also the profile editor
│   ├── MeasurementHistoryScreen.js
│   └── SettingsScreen.js
├── sheets/                      # Quick-action bottom sheets and their provider
│   ├── SheetProvider.js
│   ├── WeightSheet.js
│   ├── WorkoutSheet.js
│   ├── MeasurementSheet.js
│   ├── ActivitySheet.js
│   └── GoalSheet.js
├── components/                  # Reusable UI (cards, buttons, inputs, charts, dialogs, tab bar)
├── AthletiqContext.js           # App state (Context + useReducer) and persistence
├── storage.js                   # AsyncStorage load / save / clear
├── fitness.js                   # Pure helpers: age, BMI, units, dates, stats, validation
├── motion.js                    # Reduced-motion hook and shared entrance animation
├── theme.js                     # Design tokens
├── assets/images/               # App icon, adaptive icon layers, splash, favicon
├── app.json                     # Expo app config
└── eslint.config.js
```

The `android/` and `ios/` folders are generated by Expo ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)) and are not committed. Change native settings in `app.json`, not in those folders.

## License

[MIT](LICENSE)
