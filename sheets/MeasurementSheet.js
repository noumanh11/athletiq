import { useState } from 'react';
import { Keyboard, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import DateField from '../components/DateField';
import Icon from '../components/Icon';
import InputField from '../components/InputField';
import ModalSheet from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { keepNumbersOnly, lengthFromInput, lengthUnit, MEASUREMENT_TYPES, todayISO, validateMeasurement } from '../fitness';
import { colors, space, type } from '../theme';

const EMPTY = { waist: '', chest: '', hips: '', arms: '', thighs: '' };

// Any subset of the five measurements can be saved; values are stored in cm.
export default function MeasurementSheet({ visible, onClose }) {
  const { settings, actions } = useAthletiq();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { unitSystem } = settings;
  const [values, setValues] = useState(EMPTY);
  const [date, setDate] = useState(todayISO());
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [attempt, setAttempt] = useState(0);

  function update(key, text) {
    const next = keepNumbersOnly(text);
    setValues((previous) => ({ ...previous, [key]: next }));
    setFormError('');
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: validateMeasurement(next, unitSystem) }));
  }

  function save() {
    const nextErrors = {};
    MEASUREMENT_TYPES.forEach(({ key }) => {
      const message = validateMeasurement(values[key], unitSystem);
      if (message) nextErrors[key] = message;
    });
    const filled = MEASUREMENT_TYPES.filter(({ key }) => values[key] !== '');
    setErrors(nextErrors);
    setAttempt((count) => count + 1);
    setFormError(filled.length ? '' : 'Enter at least one measurement.');
    if (!filled.length || Object.keys(nextErrors).length) return;

    const cmValues = {};
    filled.forEach(({ key }) => {
      cmValues[key] = Math.round(lengthFromInput(values[key], unitSystem) * 10) / 10;
    });
    Keyboard.dismiss();
    actions.addMeasurement(date, cmValues);
    toast('Measurements saved');
    onClose();
  }

  return (
    <ModalSheet visible={visible} title="Add measurements" subtitle={`Fill in any you want to track, in ${lengthUnit(unitSystem)}`} onClose={onClose}>
      <DateField value={date} onChange={setDate} />
      <View style={styles.grid}>
        {MEASUREMENT_TYPES.map((item) => (
          <InputField
            key={item.key}
            style={width >= 360 ? styles.half : styles.full}
            label={item.label}
            icon="tape-measure"
            placeholder="-"
            suffix={lengthUnit(unitSystem)}
            keyboardType="decimal-pad"
            value={values[item.key]}
            onChangeText={(text) => update(item.key, text)}
            onBlur={() => setErrors((previous) => ({ ...previous, [item.key]: validateMeasurement(values[item.key], unitSystem) }))}
            error={errors[item.key]}
            shakeKey={attempt}
          />
        ))}
      </View>
      {formError ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.error}>{formError}</Text>
        </View>
      ) : null}
      <Button label="Save measurements" icon="check" onPress={save} style={styles.save} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md },
  half: { flexBasis: '46%', flexGrow: 1 },
  full: { flexBasis: '100%' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger },
  save: { marginTop: space.md },
});
