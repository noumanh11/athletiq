import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import ChoiceChips from '../components/ChoiceChips';
import DateField from '../components/DateField';
import InputField from '../components/InputField';
import ModalSheet from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { keepDigitsOnly, todayISO, validateDuration, WORKOUT_TYPES } from '../fitness';
import { space } from '../theme';

// Log a new workout, or edit one when `params.workout` is passed.
export default function WorkoutSheet({ visible, params, onClose }) {
  const { actions } = useAthletiq();
  const toast = useToast();
  const existing = params.workout;
  const [type, setType] = useState(existing?.type || '');
  const [duration, setDuration] = useState(existing ? String(existing.durationMin) : '');
  const [date, setDate] = useState(existing?.date || todayISO());
  const [note, setNote] = useState(existing?.note || '');
  const [errors, setErrors] = useState({});
  const [attempt, setAttempt] = useState(0);

  function save() {
    const next = { type: type ? '' : 'Please choose a workout type.', duration: validateDuration(duration) };
    setErrors(next);
    setAttempt((count) => count + 1);
    if (next.type || next.duration) return;
    Keyboard.dismiss();
    actions.saveWorkout({ id: existing?.id, type, durationMin: Number(duration), date, note: note.trim() });
    toast(existing ? 'Workout updated' : 'Workout saved');
    onClose();
  }

  return (
    <ModalSheet visible={visible} title={existing ? 'Edit workout' : 'Log workout'} onClose={onClose}>
      <ChoiceChips
        label="Workout type"
        options={WORKOUT_TYPES}
        value={type}
        onChange={(key) => {
          setType(key);
          setErrors((previous) => ({ ...previous, type: '' }));
        }}
        error={errors.type}
      />
      <InputField
        label="Duration"
        icon="timer-outline"
        placeholder="45"
        suffix="min"
        keyboardType="number-pad"
        value={duration}
        onChangeText={(text) => {
          const next = keepDigitsOnly(text);
          setDuration(next);
          if (errors.duration) setErrors((previous) => ({ ...previous, duration: validateDuration(next) }));
        }}
        onBlur={() => duration !== '' && setErrors((previous) => ({ ...previous, duration: validateDuration(duration) }))}
        error={errors.duration}
        shakeKey={attempt}
      />
      <DateField value={date} onChange={setDate} />
      <InputField label="Note (optional)" icon="note-text-outline" placeholder="Upper body" value={note} onChangeText={setNote} maxLength={120} />
      <Button label={existing ? 'Save changes' : 'Save workout'} icon="check" onPress={save} style={styles.save} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  save: { marginTop: space.md },
});
