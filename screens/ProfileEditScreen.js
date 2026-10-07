import { useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

import { useAthletiq } from '../AthletiqContext';
import BrandMark from '../components/BrandMark';
import Button from '../components/Button';
import InputField from '../components/InputField';
import GenderSelector from '../components/GenderSelector';
import ResultCard from '../components/ResultCard';
import Icon from '../components/Icon';
import UnitToggle from '../components/UnitToggle';
import ImperialHeightField from '../components/ImperialHeightField';
import { useToast } from '../components/Toast';
import {
  GENDER_OPTIONS, calculateAge, calculateBMI, cmToInches, formatDate, formatMeasure, getBMICategory,
  inchesToCm, keepNumbersOnly, kgToPounds, parseISODate, poundsToKg, toISODate, validateField, validateForm,
} from '../fitness';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

const FIELD_ORDER = ['name', 'dob', 'gender', 'height', 'weight'];

// Saved profile (kg/cm) -> the text values the form shows in the chosen units.
function toFormValues(profile, unitSystem) {
  if (!profile) return { height: '', heightInches: '0', weight: '' };
  if (unitSystem === 'imperial') {
    const roundedInches = Math.round(cmToInches(profile.heightCm) * 10) / 10;
    return {
      height: String(Math.floor(roundedInches / 12)),
      heightInches: formatMeasure(roundedInches % 12),
      weight: formatMeasure(kgToPounds(profile.weightKg)),
    };
  }
  return { height: formatMeasure(profile.heightCm), heightInches: '0', weight: formatMeasure(profile.weightKg) };
}

// The original Athletiq calculator, now also the profile editor.
// Calculate validates the form, saves the profile, and shows the results card.
export default function ProfileEditScreen() {
  const { profile, settings, actions } = useAthletiq();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const stackMetrics = width < 360; // very small phones: height/weight one under the other
  const isSetup = !profile;

  // Form state, pre-filled from the saved profile
  const initial = toFormValues(profile, settings.unitSystem);
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile ? parseISODate(profile.dateOfBirth) : null); // a Date object, or null if not chosen
  const [gender, setGender] = useState(profile?.gender || '');
  const [height, setHeight] = useState(initial.height);
  const [heightInches, setHeightInches] = useState(initial.heightInches);
  const [weight, setWeight] = useState(initial.weight);
  const [unitSystem, setUnitSystem] = useState(settings.unitSystem);
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
    const message = validateField(field, value, unitSystem, heightInches);
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

  function changeUnits(nextUnit) {
    if (nextUnit === unitSystem) return;
    const validHeight = !validateField('height', height, unitSystem, heightInches);
    const validWeight = !validateField('weight', weight, unitSystem, heightInches);
    if (nextUnit === 'imperial') {
      const totalInches = cmToInches(Number(height));
      if (validHeight) {
        const roundedInches = Math.round(totalInches * 10) / 10;
        setHeight(String(Math.floor(roundedInches / 12)));
        setHeightInches(formatMeasure(roundedInches % 12));
      } else {
        setHeight('');
        setHeightInches('0');
      }
      setWeight(validWeight ? formatMeasure(kgToPounds(Number(weight))) : '');
    } else {
      const feet = Number(height);
      const inches = Number(heightInches);
      setHeight(validHeight
        ? formatMeasure(inchesToCm(feet * 12 + inches)) : '');
      setWeight(validWeight ? formatMeasure(poundsToKg(Number(weight))) : '');
    }
    setUnitSystem(nextUnit);
    actions.setUnits(nextUnit); // the unit choice is an app-wide preference
    setErrors({});
    setResult(null);
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
    Keyboard.dismiss();
    const newErrors = validateForm({ name, dob, gender, height, weight }, unitSystem, heightInches);
    setErrors(newErrors);
    setAttempt((count) => count + 1);

    if (Object.keys(newErrors).length > 0) {
      setResult(null);
      const fieldRefs = { name: nameRef, dob: dobRef, gender: genderRef, height: heightRef, weight: weightRef };
      const firstError = FIELD_ORDER.find((field) => newErrors[field]);
      scrollToField(fieldRefs[firstError], 250);
      return; // stop here, do not calculate
    }

    const heightCm = unitSystem === 'metric' ? Number(height) : inchesToCm(Number(height) * 12 + Number(heightInches));
    const weightKg = unitSystem === 'metric' ? Number(weight) : poundsToKg(Number(weight));
    const bmi = calculateBMI(weightKg, heightCm);

    actions.saveProfile({
      name: name.trim(),
      dateOfBirth: toISODate(dob),
      gender,
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: Math.round(weightKg * 10) / 10,
    });
    toast(isSetup ? 'Profile created' : 'Profile saved');

    setResult({
      name: name.trim(),
      age: calculateAge(dob),
      heightCm,
      weightKg,
      unitSystem,
      bmi: bmi.toFixed(1),
      bmiValue: bmi,
    });
    // Wait for the card to be drawn, then scroll down to it.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 360);
  }

  // Hide the results but keep the entered values, so changing one metric is quick.
  function handleRecalculate() {
    setResult(null);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
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
          <View style={styles.topRow}>
            <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
              <Icon name="arrow-left" size={iconSize.lg} color={colors.ink} />
            </Pressable>
            <BrandMark />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {isSetup ? <>Your body.{'\n'}Your numbers. Your progress.</> : 'Edit profile'}
          </Text>
          {!isSetup ? (
            <Text style={styles.subtitle}>A new weight here is also saved as today&apos;s weigh-in.</Text>
          ) : null}

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

          <UnitToggle value={unitSystem} onChange={changeUnits} />

          <View style={[styles.metricsRow, (stackMetrics || unitSystem === 'imperial') && styles.metricsStacked]}>
            {unitSystem === 'metric' ? (
              <InputField
                style={!stackMetrics && styles.metricField}
                label="Height"
                icon="human-male-height"
                placeholder="175"
                suffix="cm"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={(text) => onEdit('height', keepNumbersOnly(text), setHeight)}
                onBlur={() => checkField('height', height)}
                onFocusField={scrollToField}
                wrapperRef={heightRef}
                error={errors.height}
                valid={height !== '' && !validateField('height', height, unitSystem, heightInches)}
                showValid={false}
                shakeKey={attempt}
              />
            ) : (
              <View style={!stackMetrics && styles.metricField}>
                <ImperialHeightField
                  feet={height}
                  inches={heightInches}
                  onFeetChange={(text) => onEdit('height', keepNumbersOnly(text), setHeight)}
                  onInchesChange={(text) => {
                    const next = keepNumbersOnly(text);
                    setHeightInches(next);
                    setResult(null);
                    if (errors.height) setErrors((previous) => ({ ...previous, height: validateField('height', height, unitSystem, next) }));
                  }}
                  onBlur={() => checkField('height', height)}
                  onFocusField={scrollToField}
                  wrapperRef={heightRef}
                  error={errors.height}
                  shakeKey={attempt}
                />
              </View>
            )}

            <InputField
              style={!(stackMetrics || unitSystem === 'imperial') && styles.metricField}
              label="Weight"
              icon="scale-bathroom"
              placeholder={unitSystem === 'metric' ? '70' : '154'}
              suffix={unitSystem === 'metric' ? 'kg' : 'lb'}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={(text) => onEdit('weight', keepNumbersOnly(text), setWeight)}
              onBlur={() => checkField('weight', weight)}
              onFocusField={scrollToField}
              wrapperRef={weightRef}
              error={errors.weight}
              valid={weight !== '' && !validateField('weight', weight, unitSystem, heightInches)}
              showValid={false}
              shakeKey={attempt}
            />
          </View>

          <Button
            label="Calculate My Metrics"
            icon="arrow-right"
            onPress={handleCalculate}
            accessibilityHint="Saves your profile and calculates your age and BMI"
            style={styles.primaryButton}
          />

          {/* Only drawn when there is a result. `key` replays the entrance animation on every calculation. */}
          {result && (
            <>
              <ResultCard
                key={attempt}
                result={result}
                category={getBMICategory(result.bmiValue)}
                onRecalculate={handleRecalculate}
              />
              <Button label="Go to dashboard" icon="home" onPress={() => router.dismissTo('/')} style={styles.done} />
            </>
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

  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  back: { width: TOUCH, height: TOUCH, marginLeft: -space.sm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  backPressed: { backgroundColor: colors.track },

  title: { ...type.title, color: colors.ink, marginTop: space.xxxl },
  subtitle: { ...type.body, color: colors.muted, marginTop: space.xs },

  section: { ...type.section, color: colors.muted, marginTop: space.xxxl, marginBottom: space.md },

  metricsRow: { flexDirection: 'row', gap: space.md },
  metricsStacked: { flexDirection: 'column', gap: 0 },
  metricField: { flex: 1 },

  primaryButton: { marginTop: space.lg },
  done: { marginTop: space.md },
});
