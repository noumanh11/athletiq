import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import ChoiceChips from '../components/ChoiceChips';
import InputField from '../components/InputField';
import ModalSheet from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import {
  currentWeightKg, formatPace, formatWeight, healthyWeightRange, keepNumbersOnly, validateTargetWeight, WEEKLY_PACE_OPTIONS,
  weightFromInput, weightToDisplay, weightUnit,
} from '../fitness';
import { colors, radius, space, type } from '../theme';

export default function GoalSheet({ visible, onClose }) {
  const state = useAthletiq();
  const toast = useToast();
  const { unitSystem } = state.settings;
  const { goals, profile, actions } = state;
  const current = currentWeightKg(state);
  const [target, setTarget] = useState(goals.targetWeightKg ? String(weightToDisplay(goals.targetWeightKg, unitSystem)) : '');
  const [pace, setPace] = useState(goals.weeklyWeightChangeKg ? String(goals.weeklyWeightChangeKg) : 'none');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const paceOptions = [
    { key: 'none', label: 'No pace' },
    ...WEEKLY_PACE_OPTIONS.map((kg) => ({ key: String(kg), label: `${formatPace(kg, unitSystem)} / wk` })),
  ];
  const range = profile ? healthyWeightRange(profile.heightCm) : null;

  function save() {
    const message = validateTargetWeight(target, unitSystem);
    setError(message);
    setAttempt((count) => count + 1);
    if (message) return;
    Keyboard.dismiss();
    actions.setGoal(
      { targetWeightKg: Math.round(weightFromInput(target, unitSystem) * 10) / 10, weeklyWeightChangeKg: pace === 'none' ? null : Number(pace) },
      current,
    );
    toast('Goal saved');
    onClose();
  }

  return (
    <ModalSheet visible={visible} title={goals.targetWeightKg ? 'Edit goal' : 'Set a goal'} subtitle={current ? `Current weight ${formatWeight(current, unitSystem)}` : undefined} onClose={onClose}>
      <InputField
        label="Target weight"
        icon="target"
        placeholder={current ? String(weightToDisplay(current, unitSystem)) : '68'}
        suffix={weightUnit(unitSystem)}
        keyboardType="decimal-pad"
        value={target}
        onChangeText={(text) => {
          const next = keepNumbersOnly(text);
          setTarget(next);
          if (error) setError(validateTargetWeight(next, unitSystem));
        }}
        error={error}
        shakeKey={attempt}
      />
      <ChoiceChips label="Weekly pace (optional)" options={paceOptions} value={pace} onChange={setPace} />

      {range ? (
        <View style={styles.reference}>
          <Text style={styles.referenceLabel}>ADULT BMI REFERENCE 18.5 TO 24.9</Text>
          <Text style={styles.referenceValue}>
            About {formatWeight(range.minKg, unitSystem)} to {formatWeight(range.maxKg, unitSystem)} at your height
          </Text>
        </View>
      ) : null}
      <Text style={styles.disclaimer}>Goals are a personal tracking tool, not medical advice.</Text>

      <Button label="Save goal" icon="check" onPress={save} style={styles.save} />
      {goals.targetWeightKg ? (
        <Button
          label="Remove goal"
          variant="quiet"
          icon="delete-outline"
          compact
          onPress={() => {
            actions.clearGoal();
            toast('Goal removed');
            onClose();
          }}
          style={styles.remove}
        />
      ) : null}
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  reference: { padding: space.md, borderRadius: radius.sm, backgroundColor: colors.track, marginTop: space.xs },
  referenceLabel: { ...type.eyebrow, color: colors.muted },
  referenceValue: { ...type.body, fontWeight: '700', color: colors.ink, marginTop: space.xs },
  disclaimer: { ...type.caption, color: colors.muted, marginTop: space.md, marginLeft: space.xs },
  save: { marginTop: space.lg },
  remove: { marginTop: space.sm },
});
