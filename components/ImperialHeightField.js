import { Animated, StyleSheet, Text, TextInput, useAnimatedValue, View } from 'react-native';
import { useEffect } from 'react';
import { colors, radius, space, type } from '../theme';

export default function ImperialHeightField({ feet, inches, onFeetChange, onInchesChange, onBlur, onFocusField, wrapperRef, error, shakeKey }) {
  const shake = useAnimatedValue(0);

  useEffect(() => {
    if (!shakeKey || !error) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeKey]);

  return (
    <View ref={wrapperRef} collapsable={false} style={styles.field}>
      <Text style={[styles.label, error && styles.labelError]}>Height</Text>
      <Animated.View style={[styles.row, { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }]}>
        {[
          { label: 'Feet', suffix: 'ft', value: feet, onChange: onFeetChange },
          { label: 'Inches', suffix: 'in', value: inches, onChange: onInchesChange },
        ].map((part) => (
          <View key={part.label} style={[styles.box, error && styles.boxError]}>
            <TextInput
              style={styles.input}
              value={part.value}
              onChangeText={part.onChange}
              onBlur={onBlur}
              onFocus={() => onFocusField(wrapperRef)}
              keyboardType="decimal-pad"
              placeholder={part.label === 'Feet' ? '5' : '9'}
              placeholderTextColor={colors.placeholder}
              accessibilityLabel={`Height ${part.label.toLowerCase()}`}
              selectionColor={colors.ink}
              cursorColor={colors.ink}
            />
            <Text style={styles.suffix}>{part.suffix}</Text>
          </View>
        ))}
      </Animated.View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: space.md },
  label: { ...type.label, color: colors.muted, marginBottom: space.sm, marginLeft: space.xs },
  labelError: { color: colors.danger },
  row: { flexDirection: 'row', gap: space.md },
  box: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md },
  boxError: { borderColor: colors.danger },
  input: { flex: 1, ...type.value, color: colors.ink, padding: 0, minWidth: 32 },
  suffix: { ...type.value, color: colors.muted, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger, marginTop: space.sm, marginLeft: space.xs },
});
