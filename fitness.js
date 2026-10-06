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
