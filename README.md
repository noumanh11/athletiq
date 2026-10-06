# Athletiq

Personal fitness & body metrics tracker. Enter your name, date of birth, gender, height and weight to see your age, BMI, BMI category and where you sit on the BMI scale. Works fully offline.

```bash
npm install
npx expo start --android   # run on the Android emulator (Expo Go)
```

- `App.js` – the home screen: form state, validation and calculation flow
- `theme.js` – the Athletiq design system (colours, spacing, radius, type)
- `fitness.js` – age, BMI, BMI categories and validation functions
- `components/` – `BrandMark`, `InputField`, `GenderSelector`, `ResultCard`, `MetricCard`, `PressableScale`, `Icon`

Icons come from `@expo/vector-icons` (Material Community Icons).
