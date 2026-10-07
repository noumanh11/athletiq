// Plain JavaScript helper functions. No React in this file.

export const GENDER_OPTIONS = ['Male', 'Female'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Date -> "06 October 2002"
export function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

// Age = year difference, minus 1 if the birthday hasn't happened yet this year.
export function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();
  const birthdayNotYetReached =
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate());

  if (birthdayNotYetReached) {
    age = age - 1;
  }
  return age;
}

// BMI = weight (kg) / height (m)^2
export function calculateBMI(weightKg, heightCm) {
  const heightMeters = heightCm / 100;
  return weightKg / (heightMeters * heightMeters);
}

export const cmToInches = (cm) => cm / 2.54;
export const inchesToCm = (inches) => inches * 2.54;
export const kgToPounds = (kg) => kg * 2.2046226218;
export const poundsToKg = (pounds) => pounds / 2.2046226218;

export function healthyWeightRange(heightCm) {
  const heightMetersSquared = (heightCm / 100) ** 2;
  return { minKg: 18.5 * heightMetersSquared, maxKg: 24.9 * heightMetersSquared };
}

export function formatMeasure(value) {
  return Number(value.toFixed(1)).toString();
}

// The 4 BMI categories in order. `color` is used for the scale bar, `tint` behind the badge text
// (the badge text itself is always near-black, so it stays readable on every tint).
export const BMI_CATEGORIES = [
  { label: 'Underweight', short: 'Underweight', from: 10, to: 18.5, color: '#7CB7FF', tint: '#E3EFFF', tip: 'A little below the healthy range. Balanced meals with enough protein can help.' },
  { label: 'Normal weight', short: 'Normal', from: 18.5, to: 25, color: '#C8F31D', tint: '#EEFBC4', tip: 'Great job! You are in the healthy range. Keep up your routine.' },
  { label: 'Overweight', short: 'Overweight', from: 25, to: 30, color: '#FFB547', tint: '#FFF1D9', tip: 'Slightly above the healthy range. More daily movement can help.' },
  { label: 'Obesity', short: 'Obesity', from: 30, to: 40, color: '#FF6B5E', tint: '#FFE4E1', tip: 'Well above the healthy range. Consider talking to a health professional.' },
];

// Returns the category for a BMI value.
export function getBMICategory(bmi) {
  if (bmi < 18.5) return BMI_CATEGORIES[0];
  if (bmi < 25) return BMI_CATEGORIES[1];
  if (bmi < 30) return BMI_CATEGORIES[2];
  return BMI_CATEGORIES[3];
}

// Keeps only digits and one decimal point, e.g. "7a0.5.2" -> "70.52"
export function keepNumbersOnly(text) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 1 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
}

// Validates ONE field. Returns an error message, or '' when the value is fine.
export function validateField(field, value, unitSystem = 'metric', heightInches = '0') {
  switch (field) {
    case 'name': {
      const trimmed = value.trim();
      if (trimmed === '') return 'Please enter your name.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ .'-]*$/.test(trimmed)) return 'Name can only contain letters.';
      return '';
    }
    case 'dob': {
      if (value === null) return 'Please select your date of birth.';
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Please select a valid date.';
      if (value > new Date()) return 'Date of birth cannot be in the future.';
      if (calculateAge(value) > 120) return 'Please select a realistic date of birth.';
      if (calculateAge(value) < 20) return 'Adult BMI ranges apply from age 20. Please use a child or teen BMI calculator.';
      return '';
    }
    case 'gender':
      return value === '' ? 'Please select your gender.' : '';
    case 'height': {
      if (value.trim() === '') return 'Please enter your height.';
      const number = Number(value);
      if (!Number.isFinite(number)) return 'Height must be a number.';
      if (unitSystem === 'imperial') {
        if (!Number.isInteger(number)) return 'Feet must be a whole number.';
        if (heightInches.trim() === '') return 'Please enter inches (use 0 if exact feet).';
        const inches = Number(heightInches);
        if (!Number.isFinite(inches) || inches < 0 || inches >= 12) return 'Inches must be from 0 to under 12.';
        const cm = inchesToCm(number * 12 + inches);
        if (cm < 50 || cm > 250) return 'Height must be between 1 ft 8 in and 8 ft 2 in.';
      } else if (number < 50 || number > 250) return 'Height must be between 50 and 250 cm.';
      return '';
    }
    case 'weight': {
      if (value.trim() === '') return 'Please enter your weight.';
      const number = Number(value);
      if (!Number.isFinite(number)) return 'Weight must be a number.';
      if (unitSystem === 'imperial') {
        if (poundsToKg(number) < 10 || poundsToKg(number) > 300) return 'Weight must be between 22 and 661 lb.';
      } else if (number < 10 || number > 300) return 'Weight must be between 10 and 300 kg.';
      return '';
    }
    default:
      return '';
  }
}

// Validates the whole form. Returns an object with only the fields that have errors.
export function validateForm(values, unitSystem = 'metric', heightInches = '0') {
  const errors = {};
  Object.keys(values).forEach((field) => {
    const message = validateField(field, values[field], unitSystem, heightInches);
    if (message !== '') errors[field] = message;
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Dates. Records store local calendar dates as "YYYY-MM-DD" strings; format only for display.

const SHORT_MONTHS = MONTH_NAMES.map((month) => month.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Date -> "2026-10-07" (local calendar date, no time zone shift)
export function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-10-07" -> Date at local midnight
export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const todayISO = () => toISODate(new Date());

function daysBetween(fromIso, toIso) {
  return Math.round((parseISODate(toIso) - parseISODate(fromIso)) / 86400000);
}

// "7 Oct", or "7 Oct 2025" when not this year
export function formatShortDate(iso) {
  const date = parseISODate(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}${sameYear ? '' : ` ${date.getFullYear()}`}`;
}

// "Today", "Yesterday", a weekday within the last week, otherwise "7 Oct"
export function formatRelativeDate(iso) {
  const days = daysBetween(iso, todayISO());
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return WEEKDAYS[parseISODate(iso).getDay()];
  return formatShortDate(iso);
}

// "2026-10-07" -> "7 October 2026"
export const formatLongDate = (iso) => formatDate(parseISODate(iso)).replace(/^0/, '');

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Monday of the current week, as an ISO date.
function startOfWeekISO(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toISODate(monday);
}

// Unique enough for local records.
export const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Newest first: by date, then by creation time for entries on the same day.
export const byNewest = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
const byOldest = (a, b) => byNewest(b, a);

// ---------------------------------------------------------------------------
// Units. Values are stored canonically in kg and cm and converted only for display,
// so switching units never changes (or slowly rounds away) the saved numbers.

export const isImperial = (unitSystem) => unitSystem === 'imperial';
export const weightUnit = (unitSystem) => (isImperial(unitSystem) ? 'lb' : 'kg');
export const lengthUnit = (unitSystem) => (isImperial(unitSystem) ? 'in' : 'cm');

export const weightToDisplay = (kg, unitSystem) => Number(formatMeasure(isImperial(unitSystem) ? kgToPounds(kg) : kg));
export const weightFromInput = (value, unitSystem) => (isImperial(unitSystem) ? poundsToKg(Number(value)) : Number(value));
export const lengthToDisplay = (cm, unitSystem) => Number(formatMeasure(isImperial(unitSystem) ? cmToInches(cm) : cm));
export const lengthFromInput = (value, unitSystem) => (isImperial(unitSystem) ? inchesToCm(Number(value)) : Number(value));

export const formatWeight = (kg, unitSystem) => `${formatMeasure(weightToDisplay(kg, unitSystem))} ${weightUnit(unitSystem)}`;
export const formatLength = (cm, unitSystem) => `${formatMeasure(lengthToDisplay(cm, unitSystem))} ${lengthUnit(unitSystem)}`;

export function formatHeight(cm, unitSystem) {
  if (!isImperial(unitSystem)) return `${formatMeasure(cm)} cm`;
  const totalInches = Math.round(cmToInches(cm) * 10) / 10;
  return `${Math.floor(totalInches / 12)} ft ${formatMeasure(totalInches % 12)} in`;
}

// Signed change for display, e.g. "-1.2 kg" or "+0.4 in" (uses a real minus sign).
export function formatChange(delta, unit) {
  const rounded = Number(formatMeasure(Math.abs(delta)));
  if (rounded === 0) return `0 ${unit}`;
  return `${delta < 0 ? '−' : '+'}${rounded} ${unit}`;
}

// 4820 -> "4,820"
export const formatNumber = (value) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------------------------------------------------------------------------
// Weight history and goals

export function latestWeight(weightHistory) {
  return weightHistory.length ? [...weightHistory].sort(byNewest)[0] : null;
}

// Current weight: the newest weigh-in, falling back to the weight saved in the profile.
export function currentWeightKg(state) {
  return latestWeight(state.weightHistory)?.weightKg ?? state.profile?.weightKg ?? null;
}

// Summary numbers for the Progress screen. Entries can be in any order.
export function weightStats(weightHistory) {
  if (!weightHistory.length) return null;
  const sorted = [...weightHistory].sort(byOldest);
  const weights = sorted.map((entry) => entry.weightKg);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return {
    current: last.weightKg,
    start: first.weightKg,
    lowest: Math.min(...weights),
    highest: Math.max(...weights),
    change: last.weightKg - first.weightKg,
    sorted,
  };
}

// Change over the last 30 days: newest entry compared with the newest entry from before
// that window (or the oldest entry inside it). Null when there is nothing to compare.
export function monthlyChange(weightHistory) {
  if (weightHistory.length < 2) return null;
  const sorted = [...weightHistory].sort(byOldest);
  const latest = sorted[sorted.length - 1];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const before = sorted.filter((entry) => entry.date <= toISODate(cutoff));
  const baseline = before.length ? before[before.length - 1] : sorted[0];
  return baseline === latest ? null : latest.weightKg - baseline.weightKg;
}

// Progress from the weight when the goal was set towards the target weight.
export function goalProgress(goals, currentKg) {
  if (!goals?.targetWeightKg || currentKg == null) return null;
  const target = goals.targetWeightKg;
  const start = goals.startWeightKg ?? currentKg;
  const losing = target < start;
  const reached = Math.abs(currentKg - target) < 0.05 || (losing ? currentKg <= target : currentKg >= target);
  const total = Math.abs(start - target);
  const done = losing ? start - currentKg : currentKg - start;
  const fraction = reached ? 1 : total === 0 ? 0 : Math.min(Math.max(done / total, 0), 1);
  return { target, start, losing, reached, fraction, remaining: reached ? 0 : Math.abs(currentKg - target) };
}

// Weekly pace options for a goal, in kg per week.
export const WEEKLY_PACE_OPTIONS = [0.25, 0.5, 0.75, 1];

// Pace keeps two decimals in kg (0.25 kg), one in lb (0.6 lb).
export function formatPace(kg, unitSystem) {
  return isImperial(unitSystem) ? `${formatMeasure(kgToPounds(kg))} lb` : `${Number(kg.toFixed(2))} kg`;
}

// ---------------------------------------------------------------------------
// Workouts

export const WORKOUT_TYPES = [
  { key: 'strength', label: 'Strength', icon: 'dumbbell' },
  { key: 'cardio', label: 'Cardio', icon: 'heart-pulse' },
  { key: 'running', label: 'Running', icon: 'run' },
  { key: 'cycling', label: 'Cycling', icon: 'bike' },
  { key: 'walking', label: 'Walking', icon: 'walk' },
  { key: 'sports', label: 'Sports', icon: 'basketball' },
  { key: 'mobility', label: 'Mobility', icon: 'yoga' },
  { key: 'other', label: 'Other', icon: 'lightning-bolt-outline' },
];

export const workoutType = (key) => WORKOUT_TYPES.find((item) => item.key === key) || WORKOUT_TYPES[WORKOUT_TYPES.length - 1];

// Workouts from Monday of this week up to today.
export function weeklyWorkoutSummary(workouts) {
  const weekStart = startOfWeekISO();
  const today = todayISO();
  const thisWeek = workouts.filter((workout) => workout.date >= weekStart && workout.date <= today);
  return { count: thisWeek.length, minutes: thisWeek.reduce((sum, workout) => sum + workout.durationMin, 0) };
}

// 45 -> "45 min", 90 -> "1 h 30 min"
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}

// ---------------------------------------------------------------------------
// Body measurements. Each entry: { id, date, createdAt, values: { waist: cm, chest: cm, ... } }

export const MEASUREMENT_TYPES = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'hips', label: 'Hips' },
  { key: 'arms', label: 'Arms' },
  { key: 'thighs', label: 'Thighs' },
];

export const measurementType = (key) => MEASUREMENT_TYPES.find((item) => item.key === key);

// Entries (oldest first) that contain a value for this measurement.
export function measurementSeries(measurements, key) {
  return [...measurements].sort(byOldest).filter((entry) => entry.values[key] != null);
}

// Latest value and change since the first entry, for every measurement type.
export function measurementSummary(measurements) {
  return MEASUREMENT_TYPES.map((item) => {
    const series = measurementSeries(measurements, item.key);
    if (!series.length) return { ...item, latest: null, change: null, count: 0 };
    const last = series[series.length - 1];
    return {
      ...item,
      latest: last.values[item.key],
      date: last.date,
      count: series.length,
      change: series.length > 1 ? last.values[item.key] - series[0].values[item.key] : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Validation for the logging forms. Each returns '' when the value is fine.

// Weight entries reuse the profile weight rule so the limits stay identical.
export const validateWeightInput = (value, unitSystem) => validateField('weight', value, unitSystem);

export function validateTargetWeight(value, unitSystem) {
  return validateField('weight', value, unitSystem).replace('your weight', 'a target weight');
}

export function validateDuration(value) {
  if (value.trim() === '') return 'Please enter the duration.';
  const number = Number(value);
  if (!Number.isInteger(number)) return 'Duration must be whole minutes.';
  if (number < 1 || number > 600) return 'Duration must be between 1 and 600 minutes.';
  return '';
}

// Measurements are optional, so an empty value is valid.
export function validateMeasurement(value, unitSystem) {
  if (value.trim() === '') return '';
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Must be a number.';
  const cm = lengthFromInput(number, unitSystem);
  if (cm < 10 || cm > 300) return isImperial(unitSystem) ? 'Must be between 4 and 118 in.' : 'Must be between 10 and 300 cm.';
  return '';
}

const ACTIVITY_LIMITS = {
  steps: { max: 100000, label: 'Steps' },
  activeMinutes: { max: 1440, label: 'Active minutes' },
  calories: { max: 10000, label: 'Calories' },
};

// Activity values are optional, so an empty value is valid.
export function validateActivity(field, value) {
  if (value.trim() === '') return '';
  const number = Number(value);
  const { max, label } = ACTIVITY_LIMITS[field];
  if (!Number.isInteger(number)) return `${label} must be a whole number.`;
  if (number < 0 || number > max) return `${label} must be between 0 and ${formatNumber(max)}.`;
  return '';
}

export const keepDigitsOnly = (text) => text.replace(/[^0-9]/g, '');
