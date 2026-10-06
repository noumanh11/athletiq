import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import BrandMark from './components/BrandMark';
import InputField from './components/InputField';
import GenderSelector from './components/GenderSelector';
import ResultCard from './components/ResultCard';
import PressableScale from './components/PressableScale';
import Icon from './components/Icon';
import {
  GENDER_OPTIONS, calculateAge, calculateBMI, formatDate, getBMICategory,
  keepNumbersOnly, validateField, validateForm,
} from './fitness';
import { colors, radius, space, type, TOUCH } from './theme';

const FIELD_ORDER = ['name', 'dob', 'gender', 'height', 'weight'];

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const stackMetrics = width < 360; // very small phones: height/weight one under the other

  // Form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState(null); // a Date object, or null if not chosen
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null); // null = hide the results card
  const [attempt, setAttempt] = useState(0); // counts Calculate presses (triggers the shake + replays the result animation)

  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  // One ref per field, used to scroll to the first field with an error.
  const nameRef = useRef(null);
  const dobRef = useRef(null);
  const genderRef = useRef(null);
  const heightRef = useRef(null);
  const weightRef = useRef(null);

  // Scroll a field into view (used when a text field is focused, and to jump to the first error).
  function scrollToField(fieldRef, delay = 250) {
    setTimeout(() => {
      if (!fieldRef?.current || !contentRef.current) return;
      fieldRef.current.measureLayout(
        contentRef.current,
        (x, y) => scrollRef.current?.scrollTo({ y: Math.max(y - 120, 0), animated: true }),
        () => {}
      );
    }, delay);
  }

  // Validate one field and store (or clear) its error message.
  function checkField(field, value) {
    const message = validateField(field, value);
    setErrors((previous) => ({ ...previous, [field]: message }));
  }

  // When the user edits a field that currently shows an error, re-check it live
  // so the message disappears as soon as the value becomes valid.
  // Any edit also hides old results, so the card never shows numbers that no longer match the form.
  function onEdit(field, value, setter) {
    setter(value);
    setResult(null);
    if (errors[field]) checkField(field, value);
  }

  function openDatePicker() {
    DateTimePickerAndroid.open({
      value: dob || new Date(2000, 0, 1), // date shown when the picker opens
      mode: 'date',
      maximumDate: new Date(), // greys out future dates
      // Called when the user taps OK. `date` is the chosen Date.
      onValueChange: (event, date) => {
        setDob(date);
        setResult(null);
        checkField('dob', date);
      },
    });
  }

  function handleCalculate() {
    const newErrors = validateForm({ name, dob, gender, height, weight });
    setErrors(newErrors);
    setAttempt((count) => count + 1);

    if (Object.keys(newErrors).length > 0) {
      setResult(null);
      const fieldRefs = { name: nameRef, dob: dobRef, gender: genderRef, height: heightRef, weight: weightRef };
      const firstError = FIELD_ORDER.find((field) => newErrors[field]);
      scrollToField(fieldRefs[firstError], 0);
      return; // stop here, do not calculate
    }

    const heightCm = Number(height);
    const weightKg = Number(weight);
    const bmi = calculateBMI(weightKg, heightCm);

    setResult({
      name: name.trim(),
      age: calculateAge(dob),
      height: heightCm,
      weight: weightKg,
      bmi: bmi.toFixed(1),
    });
    // Wait for the card to be drawn, then scroll down to it.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }

  // Hide the results but keep the entered values, so changing one metric is quick.
  function handleRecalculate() {
    setResult(null);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View ref={contentRef} collapsable={false} style={styles.content}>
          <BrandMark />

          <Text style={styles.title}>Your body.{'\n'}Your numbers. Your progress.</Text>

          <Text style={styles.section} accessibilityRole="header">PERSONAL DETAILS</Text>

          <InputField
            label="Name"
            icon="account-outline"
            placeholder="Enter your name"
            value={name}
            onChangeText={(text) => onEdit('name', text, setName)}
            onBlur={() => checkField('name', name)}
            onFocusField={scrollToField}
            wrapperRef={nameRef}
            error={errors.name}
            valid={name !== '' && !validateField('name', name)}
            shakeKey={attempt}
          />

          <InputField
            label="Date of birth"
            icon="calendar-month-outline"
            placeholder="Select date"
            displayText={dob ? formatDate(dob) : ''}
            onPress={openDatePicker}
            wrapperRef={dobRef}
            error={errors.dob}
            valid={dob !== null && !validateField('dob', dob)}
            shakeKey={attempt}
          />

          <GenderSelector
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(option) => {
              setGender(option);
              setResult(null);
              checkField('gender', option);
            }}
            wrapperRef={genderRef}
            error={errors.gender}
          />

          <Text style={styles.section} accessibilityRole="header">BODY METRICS</Text>

          <View style={[styles.metricsRow, stackMetrics && styles.metricsStacked]}>
            <InputField
              style={!stackMetrics && styles.metricField}
              label="Height"
              icon="human-male-height"
              placeholder="175"
              suffix="cm"
              keyboardType="numeric"
              value={height}
              onChangeText={(text) => onEdit('height', keepNumbersOnly(text), setHeight)}
              onBlur={() => checkField('height', height)}
              onFocusField={scrollToField}
              wrapperRef={heightRef}
              error={errors.height}
              valid={height !== '' && !validateField('height', height)}
              showValid={false}
              shakeKey={attempt}
            />

            <InputField
              style={!stackMetrics && styles.metricField}
              label="Weight"
              icon="scale-bathroom"
              placeholder="70"
              suffix="kg"
              keyboardType="numeric"
              value={weight}
              onChangeText={(text) => onEdit('weight', keepNumbersOnly(text), setWeight)}
              onBlur={() => checkField('weight', weight)}
              onFocusField={scrollToField}
              wrapperRef={weightRef}
              error={errors.weight}
              valid={weight !== '' && !validateField('weight', weight)}
              showValid={false}
              shakeKey={attempt}
            />
          </View>

          <PressableScale
            style={styles.primaryButton}
            onPress={handleCalculate}
            accessibilityLabel="Calculate my metrics"
            accessibilityHint="Calculates your age and BMI"
          >
            <Text style={styles.primaryButtonText}>Calculate My Metrics</Text>
            <View style={styles.primaryButtonIcon}>
              <Icon name="arrow-right" size={20} color={colors.ink} />
            </View>
          </PressableScale>

          {/* Only drawn when there is a result. `key` replays the entrance animation on every calculation. */}
          {result && (
            <ResultCard
              key={attempt}
              result={result}
              category={getBMICategory(Number(result.bmi))}
              onRecalculate={handleRecalculate}
            />
          )}
        </View>
      </ScrollView>
      {/* Solid strip behind the status bar so scrolled content never overlaps the clock/icons. */}
      <View style={[styles.statusBarBackdrop, { height: insets.top }]} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  statusBarBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.background },
  content: { paddingHorizontal: space.xl },

  title: { ...type.title, color: colors.ink, marginTop: space.xxxl },

  section: { ...type.section, color: colors.muted, marginTop: space.xxxl, marginBottom: space.md },

  metricsRow: { flexDirection: 'row', gap: space.md },
  metricsStacked: { flexDirection: 'column', gap: 0 },
  metricField: { flex: 1 },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: TOUCH + space.sm,
    marginTop: space.lg,
    paddingLeft: space.xxl,
    paddingRight: space.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  primaryButtonText: { ...type.button, color: colors.surface },
  primaryButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
