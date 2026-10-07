import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import CategoryBadge from '../components/CategoryBadge';
import DateField from '../components/DateField';
import InputField from '../components/InputField';
import ModalSheet from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import {
  calculateBMI, currentWeightKg, getBMICategory, keepNumbersOnly, todayISO, validateWeightInput, weightFromInput,
  weightToDisplay, weightUnit,
} from '../fitness';
import { colors, space, type } from '../theme';

export default function WeightSheet({ visible, onClose }) {
  const state = useAthletiq();
  const router = useRouter();
  const toast = useToast();
  const { unitSystem } = state.settings;
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  if (!state.profile) {
    return (
      <ModalSheet visible={visible} title="Add weight" onClose={onClose}>
        <Text style={styles.body}>Set up your profile first. Athletiq needs your height to work out the BMI for each weigh-in.</Text>
        <Button
          label="Set up profile"
          icon="arrow-right"
          onPress={() => {
            onClose();
            router.push('/profile-edit');
          }}
          style={styles.save}
        />
      </ModalSheet>
    );
  }

  const valid = weight !== '' && !validateWeightInput(weight, unitSystem);
  const bmi = valid ? calculateBMI(weightFromInput(weight, unitSystem), state.profile.heightCm) : null;
  const current = currentWeightKg(state);

  function save() {
    const message = validateWeightInput(weight, unitSystem);
    setError(message);
    setAttempt((count) => count + 1);
    if (message) return;
    Keyboard.dismiss();
    state.actions.addWeight({ weightKg: weightFromInput(weight, unitSystem), date, note: note.trim() });
    toast('Weight saved');
    onClose();
  }

  return (
    <ModalSheet visible={visible} title="Add weight" subtitle="Record a weigh-in" onClose={onClose}>
      <InputField
        label="Weight"
        icon="scale-bathroom"
        placeholder={current ? String(weightToDisplay(current, unitSystem)) : '70'}
        suffix={weightUnit(unitSystem)}
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={(text) => {
          const next = keepNumbersOnly(text);
          setWeight(next);
          if (error) setError(validateWeightInput(next, unitSystem));
        }}
        onBlur={() => weight !== '' && setError(validateWeightInput(weight, unitSystem))}
        error={error}
        shakeKey={attempt}
      />

      {bmi ? (
        <View style={styles.preview} accessible accessibilityLabel={`BMI ${bmi.toFixed(1)}, ${getBMICategory(bmi).label}`}>
          <Text style={styles.previewLabel}>BMI {bmi.toFixed(1)}</Text>
          <CategoryBadge category={getBMICategory(bmi)} />
        </View>
      ) : null}

      <DateField value={date} onChange={setDate} />
      <InputField label="Note (optional)" icon="note-text-outline" placeholder="Morning weigh-in" value={note} onChangeText={setNote} maxLength={80} />

      <Button label="Save weight" icon="check" onPress={save} style={styles.save} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: colors.muted },
  preview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, marginBottom: space.md, marginTop: -space.xs, paddingHorizontal: space.xs },
  previewLabel: { ...type.body, fontWeight: '700', color: colors.ink },
  save: { marginTop: space.md },
});
