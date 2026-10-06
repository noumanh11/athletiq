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
export function validateField(field, value) {
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
      if (value > new Date()) return 'Date of birth cannot be in the future.';
      if (calculateAge(value) > 120) return 'Please select a realistic date of birth.';
      return '';
    }
    case 'gender':
      return value === '' ? 'Please select your gender.' : '';
    case 'height': {
      if (value.trim() === '') return 'Please enter your height.';
      const number = Number(value);
      if (Number.isNaN(number)) return 'Height must be a number.';
      if (number < 50 || number > 250) return 'Height must be between 50 and 250 cm.';
      return '';
    }
    case 'weight': {
      if (value.trim() === '') return 'Please enter your weight.';
      const number = Number(value);
      if (Number.isNaN(number)) return 'Weight must be a number.';
      if (number < 10 || number > 300) return 'Weight must be between 10 and 300 kg.';
      return '';
    }
    default:
      return '';
  }
}

// Validates the whole form. Returns an object with only the fields that have errors.
export function validateForm(values) {
  const errors = {};
  Object.keys(values).forEach((field) => {
    const message = validateField(field, values[field]);
    if (message !== '') errors[field] = message;
  });
  return errors;
}
