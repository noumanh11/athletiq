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

`npm run android` needs Java and Gradle on your machine. If Java is blocked or not installed, build the release APK with Docker instead: see [Android release build with Docker](#android-release-build-with-docker-windows-no-local-java).

## Scripts

| Command                         | What it does                                                     |
| ------------------------------- | ---------------------------------------------------------------- |
| `npm start`                     | Start the Expo dev server                                        |
| `npm run android`               | Generate the native project and run it on Android (needs local Java) |
| `npm run lint`                  | Lint the project with ESLint                                     |
| `npx expo-doctor`               | Check dependencies and config                                    |
| `npm run build:android`         | Build the APK/AAB inside Docker, interactive menu                |
| `npm run build:android:install` | Docker build with defaults, then install and launch on a device  |
| `npm run build:android:shell`   | Open a bash shell inside the build container                     |

## Android release build with Docker (Windows, no local Java)

On machines where Java cannot run (for example when endpoint protection blocks it), the APK or AAB is built entirely inside a Linux container. The host only needs:

- **Docker Desktop** with Linux containers (WSL 2 backend)
- **Node.js** (to run the npm scripts)
- **adb** (Android platform-tools), only for installing on a device

All commands below are for the Windows **Command Prompt** (cmd).

### One-time setup: keep build data off the C: drive

A first build downloads several GB (toolchain image, Gradle and npm caches) and the Docker VM can use a lot of memory. These steps keep all of it on D:. Run them once, as a normal user, with Docker Desktop, the emulator and Android Studio closed.

**1. Docker Desktop disk image on D:**
Docker Desktop > Settings > Resources > Advanced > **Disk image location** > choose a folder on D: (for example `D:\DockerDesktopWSL`) > Apply & restart. Docker moves its existing data there. Images, build cache and all `athletiq-android-*` volumes live inside this disk.

**2. Limit Docker's memory and put the WSL swap file on D:**
Without a limit, the Docker VM takes about half of the PC's RAM and Windows starts paging to `C:\pagefile.sys`. 8 GB is enough for this build with `-MaxWorkers 4`.

```cmd
(
echo [wsl2]
echo memory=8GB
echo swap=8GB
echo swapFile=D:\\DockerDesktopWSL\\swap.vhdx
) > "%USERPROFILE%\.wslconfig"

wsl --shutdown
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

When Docker Desktop shows "Engine running", confirm the limit (should print about 8 GB in bytes):

```cmd
docker info --format "{{.MemTotal}}"
```

`.wslconfig` applies to every WSL distribution on the PC, not only Docker.

**3. Android emulators on D:**

```cmd
setx ANDROID_AVD_HOME "D:\Android\AVD"
mkdir "D:\Android\AVD"
dir "%USERPROFILE%\.android\avd"
```

For each emulator listed (a `<name>.avd` folder and a `<id>.ini` file), move both and point the `.ini` at the new folder. Example for an emulator called `Medium_Phone`:

```cmd
robocopy "%USERPROFILE%\.android\avd\Medium_Phone.avd" "D:\Android\AVD\Medium_Phone.avd" /E /MOVE
move "%USERPROFILE%\.android\avd\Medium_Phone_API_37.0.ini" "D:\Android\AVD\"
notepad "D:\Android\AVD\Medium_Phone_API_37.0.ini"
```

In Notepad change the `path=` line to `path=D:\Android\AVD\Medium_Phone.avd`, save, then reopen Android Studio and start the emulator from Device Manager.

**4. npm and Gradle caches on D:**

```cmd
npm config set cache D:\npm-cache --location=user
setx GRADLE_USER_HOME "D:\Gradle"
```

After that the old copies can be deleted: `rmdir /S /Q "%LOCALAPPDATA%\npm-cache"` and `rmdir /S /Q "%USERPROFILE%\.gradle"` (they only hold re-downloadable caches; check that `%USERPROFILE%\.gradle` has no `gradle.properties` you need first).

**5. Build output on D:**

```cmd
mkdir "D:\Builds\athletiq-android"
setx ATHLETIQ_ANDROID_OUTPUT "D:\Builds\athletiq-android"
```

`setx` only affects newly opened windows. Close the Command Prompt and open a new one before building, then check with `echo %ATHLETIQ_ANDROID_OUTPUT%`.

**Page file (optional, needs admin):** if Windows policy allows it, move most of the page file to D: with `SystemPropertiesPerformance` > Advanced > Virtual memory > Change (C: custom 1024 to 2048 MB, D: system managed), then restart. Step 2 already keeps paging low when this is not allowed.

### Build commands

Start Docker Desktop first. From the project folder:

```cmd
cd /d C:\path\to\athletiq
```

| Goal                                                     | Command                                                           |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| Interactive menu (APK/AAB, ABIs, clean build, install)   | `npm run build:android`                                           |
| Build APK with defaults, no prompts                      | `npm run build:android -- -Yes -MaxWorkers 4`                     |
| Build, then install and launch on the only connected device | `npm run build:android -- -Yes -Install -MaxWorkers 4`         |
| Build, then install on a specific phone                  | `npm run build:android -- -Yes -Install -Device <serial> -MaxWorkers 4` |
| Emulator-only APK (x86_64, fastest)                      | `npm run build:android -- -Yes -Abis emulator -Install -MaxWorkers 4` |
| Play Store bundle for all ABIs                           | `npm run build:android -- -Yes -Format aab -Abis all -MaxWorkers 4` |
| Clean build (regenerate the native project)              | `npm run build:android -- -Yes -Clean -MaxWorkers 4`              |
| Rebuild the toolchain image from scratch                 | `npm run build:android -- -Yes -RebuildImage`                     |
| Debug shell in the build container                       | `npm run build:android:shell` (run `athletiq-build` inside to build, `exit` to leave) |

The same script can be run without npm: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\docker-android-build.ps1 -Yes -Install -MaxWorkers 4`.

| Option          | Meaning                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `-Format`       | `apk` (default) or `aab`                                                      |
| `-Abis`         | `standard` (arm64-v8a + x86_64, default), `emulator` (x86_64 only), `all`     |
| `-Install`      | Install with `adb install -r` and launch the app (APK only)                  |
| `-Device`       | adb serial to install on (default: the only device, or the first emulator)   |
| `-Clean`        | Regenerate the native project and drop native build outputs                  |
| `-RebuildImage` | Rebuild the toolchain image without the Docker layer cache                   |
| `-MaxWorkers`   | Gradle workers in the container (default: CPU count, max 6; use 4 with an 8 GB Docker limit) |
| `-OutputRoot`   | Where run folders go (default: `%ATHLETIQ_ANDROID_OUTPUT%`, else `dist\android`) |
| `-KeepRuns`     | Run folders to keep; older ones are deleted (default 5, `0` keeps all)       |
| `-Yes`          | No prompts; defaults for anything not passed                                  |

**How long it takes:** the first build is about 20 minutes (toolchain image about 4 minutes, then Gradle downloads and compiles native code). Later builds reuse the image, `node_modules`, the generated native project and the Gradle/ccache caches, so they are much faster. A run prints `[n/5]` pipeline stages on the host and `[n/6]` stages inside the container, each with its duration.

### Output

Each run creates a folder named after its start time:

```
D:\Builds\athletiq-android\            (or dist\android\ if ATHLETIQ_ANDROID_OUTPUT is not set)
├── 20261007-152845\
│   ├── athletiq-1.0.0-<commit>-release.apk
│   ├── build.log             full container log (npm, prebuild, Gradle)
│   ├── image-build.log       only when the toolchain image was (re)built
│   └── build-info.json       SHA-256, size, ABIs, Gradle task, duration, toolchain versions
└── latest\                   copy of the newest successful run
```

Only the last 5 run folders are kept (change with `-KeepRuns`).

### Install on a phone or emulator

**Prepare the phone (once):**

1. Settings > About phone > tap **Build number** (on Xiaomi: **OS version**) seven times to enable Developer options.
2. Developer options > enable **USB debugging**. On Xiaomi/Redmi also enable **Install via USB** and **USB debugging (Security settings)**; these need a Mi account and a SIM.
3. Connect the USB cable, choose **File transfer** mode, and accept the "Allow USB debugging" prompt on the phone.

**Check that the phone is connected:**

```cmd
adb devices
```

The phone appears with its serial number and the word `device`. `unauthorized` means the prompt on the phone has not been accepted yet; `emulator-5554` is the Android Studio emulator.

**Install the latest build:**

```cmd
for %f in ("D:\Builds\athletiq-android\latest\*.apk") do adb -s <serial> install -r "%f"
adb -s <serial> shell monkey -p com.vitalyn.app -c android.intent.category.LAUNCHER 1
```

Use `dist\android\latest\*.apk` instead if `ATHLETIQ_ANDROID_OUTPUT` is not set. Inside a `.bat` file write `%%f` instead of `%f`. Keep the phone unlocked during the install; Xiaomi phones may ask to confirm it on screen.

**Other useful adb commands:**

```cmd
adb -s <serial> shell pm list packages com.vitalyn.app
adb -s <serial> uninstall com.vitalyn.app
adb -s <serial> shell getprop ro.product.cpu.abilist
```

`uninstall` deletes the app's data on that device. The APK runs on arm64 phones (Android 7.0 or newer) and x86_64 emulators; build with `-Abis all` for older 32-bit phones.

Every build is signed with the same key (the project's debug keystore), so a new build installs over the previous one and keeps the app's data. That key is fine for testing and side-loading; configure a real upload key before publishing to Google Play.

### How the pipeline works

1. **Toolchain image** (`docker/android/Dockerfile`): JDK 17 (what React Native 0.86 and AGP 8.12 support), Node 24, Android SDK 36, build-tools 36.0.0, NDK 27.1, CMake 3.22.1 and ccache. It is tagged with a hash of `docker/android/*`, so it is only rebuilt when the toolchain changes. After an Expo SDK upgrade, compare these versions with `node_modules/react-native/gradle/libs.versions.toml`.
2. **Build container** (`docker/android/build.sh`): copies the sources from a read-only mount into a workspace volume, runs `npm ci` only when `package-lock.json` changed, runs `expo prebuild` only when `app.json` or dependencies changed, then `gradlew assembleRelease` (or `bundleRelease`). The local `android/` folder is never used or modified.
3. **Host script** (`scripts/docker-android-build.ps1`): preflight checks, image build, container run, artifact summary, cleanup of old runs, adb install and launch.

**Caches (Docker volumes)**

| Volume                         | Contents                                         |
| ------------------------------ | ------------------------------------------------ |
| `athletiq-android-workspace`   | Synced sources, Linux `node_modules`, generated `android/` project |
| `athletiq-android-gradle`      | Gradle distribution, dependencies, build cache   |
| `athletiq-android-npm`         | npm download cache                               |
| `athletiq-android-ccache`      | Compiled C++ objects                             |

```cmd
docker volume ls --filter name=athletiq-android
docker system df
docker volume rm athletiq-android-workspace athletiq-android-gradle athletiq-android-npm athletiq-android-ccache
docker builder prune
```

Removing the volumes or pruning the builder cache frees space; the next build is then as slow as the first one.

### Troubleshooting

| Message or symptom | Cause and fix |
| ------------------ | ------------- |
| `Docker engine is not reachable` | Start Docker Desktop and wait for "Engine running". |
| `failed to receive status: rpc error ... EOF` while exporting the image | Docker Desktop dropped the connection while unpacking the large image. The script checks whether the image works and continues, or retries once; if it still stops, run the build again (layers are cached). |
| `npm ci` fails with `ERESOLVE` / `Conflicting peer dependency` | `package-lock.json` has packages that do not fit the Expo SDK versions. Add or update packages only with `npx expo install <package>`, then commit the lockfile. |
| `A restricted method in java.lang.System has been called` | Gradle ran on JDK 24 or newer, which breaks AGP's prefab step. Keep the image on JDK 17 (`JDK_IMAGE` in the Dockerfile). |
| `Cannot find a Java installation ... languageVersion=...` | A JDK version required by the build is missing from the image. Gradle toolchain downloads are off on purpose; add that JDK to the Dockerfile. |
| Build is very slow, or the container is killed | Not enough memory. Use `-MaxWorkers 2` to `4`, close the emulator and Android Studio during the build, or raise `memory=` in `.wslconfig`. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | The installed app was signed with a different key. Uninstall it first (`adb -s <serial> uninstall com.vitalyn.app`, deletes its data). |
| `INSTALL_FAILED_USER_RESTRICTED` (Xiaomi) | Enable **Install via USB** in Developer options and confirm the prompt on the phone. |
| `adb: device '<serial>' not found` | The cable was disconnected or USB mode changed. Reconnect, choose File transfer, run `adb devices`. |
| Output still goes to `dist\android` on C: | The Command Prompt was opened before `setx`. Open a new one and check `echo %ATHLETIQ_ANDROID_OUTPUT%`. |
| `EBUSY` / folder locked when running `npx expo prebuild` locally | Android Studio has the local `android/` folder open. The Docker build does not use that folder, so this does not affect it. |

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
├── docker/android/              # Toolchain image (Dockerfile) and in-container build script
├── scripts/docker-android-build.ps1  # Host side of the Docker build pipeline
├── assets/images/               # App icon, adaptive icon layers, splash, favicon
├── app.json                     # Expo app config
└── eslint.config.js
```

The `android/` and `ios/` folders are generated by Expo ([Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/)) and are not committed. Change native settings in `app.json`, not in those folders.

## License

[MIT](LICENSE)
