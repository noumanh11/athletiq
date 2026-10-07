import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import DateField from '../components/DateField';
import Icon from '../components/Icon';
import InputField from '../components/InputField';
import ModalSheet from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { keepDigitsOnly, todayISO, validateActivity } from '../fitness';
import { colors, iconSize, radius, space, type } from '../theme';

const FIELDS = [
  { key: 'steps', label: 'Steps', icon: 'walk', placeholder: '6000', suffix: '' },
  { key: 'activeMinutes', label: 'Active minutes', icon: 'timer-outline', placeholder: '30', suffix: 'min' },
  { key: 'calories', label: 'Calories burned', icon: 'fire', placeholder: '300', suffix: 'kcal' },
];

const toText = (record) => ({
  steps: record?.steps != null ? String(record.steps) : '',
  activeMinutes: record?.activeMinutes != null ? String(record.activeMinutes) : '',
  calories: record?.calories != null ? String(record.calories) : '',
});

// One activity record per day. Opening a day that already has values pre-fills them for editing.
export default function ActivitySheet({ visible, params, onClose }) {
  const { dailyActivity, actions } = useAthletiq();
  const toast = useToast();
  const recordFor = (day) => dailyActivity.find((record) => record.date === day);
  const [date, setDate] = useState(params.date || todayISO());
  const [values, setValues] = useState(() => toText(recordFor(params.date || todayISO())));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const existing = recordFor(date);

  function changeDate(next) {
    setDate(next);
    setValues(toText(recordFor(next)));
    setErrors({});
    setFormError('');
  }

  function save() {
    const nextErrors = {};
    FIELDS.forEach(({ key }) => {
      const message = validateActivity(key, values[key]);
      if (message) nextErrors[key] = message;
    });
    const empty = FIELDS.every(({ key }) => values[key] === '');
    setErrors(nextErrors);
    setAttempt((count) => count + 1);
    setFormError(empty && !existing ? 'Enter at least one value.' : '');
    if (Object.keys(nextErrors).length || (empty && !existing)) return;

    const toNumber = (text) => (text === '' ? null : Number(text));
    Keyboard.dismiss();
    actions.saveActivity({ date, steps: toNumber(values.steps), activeMinutes: toNumber(values.activeMinutes), calories: toNumber(values.calories) });
    toast(empty ? 'Activity cleared' : 'Activity saved');
    onClose();
  }

  return (
    <ModalSheet visible={visible} title={existing ? 'Update activity' : 'Add activity'} onClose={onClose}>
      <View style={styles.notice}>
        <Icon name="information-outline" size={iconSize.md} color={colors.muted} />
        <Text style={styles.noticeText}>Enter these values yourself, for example from your watch or phone. Athletiq does not read health sensors.</Text>
      </View>
      <DateField value={date} onChange={changeDate} />
      {FIELDS.map((field) => (
        <InputField
          key={field.key}
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          suffix={field.suffix}
          keyboardType="number-pad"
          value={values[field.key]}
          onChangeText={(text) => {
            const next = keepDigitsOnly(text);
            setValues((previous) => ({ ...previous, [field.key]: next }));
            setFormError('');
            if (errors[field.key]) setErrors((previous) => ({ ...previous, [field.key]: validateActivity(field.key, next) }));
          }}
          error={errors[field.key]}
          shakeKey={attempt}
        />
      ))}
      {formError ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.error}>{formError}</Text>
        </View>
      ) : null}
      <Button label="Save activity" icon="check" onPress={save} style={styles.save} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.track, marginBottom: space.lg },
  noticeText: { ...type.caption, lineHeight: 17, color: colors.muted, flex: 1 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger },
  save: { marginTop: space.md },
});
