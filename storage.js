import AsyncStorage from '@react-native-async-storage/async-storage';

// All Athletiq data lives in ONE AsyncStorage entry on this device. Nothing is sent anywhere.
const STORAGE_KEY = 'athletiq:data';
export const DATA_VERSION = 1;

export function createEmptyData() {
  return {
    version: DATA_VERSION,
    settings: { unitSystem: 'metric' },
    profile: null, // { name, dateOfBirth: 'YYYY-MM-DD', gender, heightCm, weightKg }
    goals: { targetWeightKg: null, startWeightKg: null, weeklyWeightChangeKg: null, setOn: null },
    weightHistory: [], // { id, date, createdAt, weightKg, heightCm, bmi, note }
    measurements: [], // { id, date, createdAt, values: { waist, chest, hips, arms, thighs } } in cm
    workouts: [], // { id, type, durationMin, date, createdAt, note }
    dailyActivity: [], // { date, steps, activeMinutes, calories } one record per day
  };
}

// Fill in anything missing so data saved by an older version still loads cleanly.
function withDefaults(saved) {
  const empty = createEmptyData();
  return {
    ...empty,
    ...saved,
    version: DATA_VERSION,
    settings: { ...empty.settings, ...saved.settings },
    goals: { ...empty.goals, ...saved.goals },
  };
}

export async function loadData() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyData();
  return withDefaults(JSON.parse(raw));
}

export function saveData(data) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData() {
  return AsyncStorage.removeItem(STORAGE_KEY);
}
