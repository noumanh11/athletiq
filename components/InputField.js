import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, useAnimatedValue, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, space, type } from '../theme';

// A labelled input: icon + small label + value, inside one rounded container.
// - Focus: the border turns near-black. Only the border colour changes; toggling
//   elevation/shadow on Android re-creates the native view and steals the TextInput's focus.
// - Error: red border + a short message underneath. The field shakes when `shakeKey` changes.
// - When `onPress` is given, the field is a button (used for the date picker).
export default function InputField({
  label, icon, error, valid, showValid = true, shakeKey, wrapperRef, style,
  value, onChangeText, onBlur, placeholder, keyboardType, suffix, onFocusField,
  onPress, displayText,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const shake = useAnimatedValue(0);
  const errorAnim = useAnimatedValue(0);

  // Fade the error message in when it appears.
  useEffect(() => {
    errorAnim.setValue(0);
    if (error) {
      Animated.timing(errorAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }
  }, [error, errorAnim]);

  // Short left-right shake when Calculate is pressed and this field is wrong.
  useEffect(() => {
    if (!shakeKey || !error) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeKey]);

  const isButton = Boolean(onPress);
  const borderColor = error ? colors.danger : focused ? colors.ink : colors.border;
  const iconColor = error ? colors.danger : focused || valid ? colors.ink : colors.muted;

  return (
    <View ref={wrapperRef} collapsable={false} style={[styles.field, style]}>
      <Animated.View
        style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }}
      >
        <Pressable
          onPress={isButton ? onPress : () => inputRef.current?.focus()}
          accessible={isButton}
          accessibilityRole={isButton ? 'button' : undefined}
          accessibilityLabel={isButton ? `${label}, ${displayText || 'not selected'}` : undefined}
          accessibilityHint={isButton ? 'Opens a date picker' : undefined}
          style={[styles.box, { borderColor }]}
        >
          <Icon name={icon} size={22} color={iconColor} />

          <View style={styles.textColumn}>
            <Text style={[styles.label, error && styles.labelError]} numberOfLines={1}>{label}</Text>
            {isButton ? (
              <Text style={[styles.value, !displayText && styles.placeholder]} numberOfLines={1}>
                {displayText || placeholder}
              </Text>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.value, styles.input]}
                  placeholder={placeholder}
                  placeholderTextColor={colors.placeholder}
                  keyboardType={keyboardType}
                  value={value}
                  onChangeText={onChangeText}
                  accessibilityLabel={label}
                  underlineColorAndroid="transparent"
                  selectionColor={colors.ink}
                  cursorColor={colors.ink}
                  onFocus={() => {
                    setFocused(true);
                    if (onFocusField) onFocusField(wrapperRef);
                  }}
                  onBlur={() => {
                    setFocused(false);
                    if (onBlur) onBlur();
                  }}
                />
                {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
              </View>
            )}
          </View>

          {showValid && valid && !error ? <Icon name="check-circle" size={20} color={colors.ink} label="Valid" /> : null}
        </Pressable>
      </Animated.View>

      {error ? (
        <Animated.View style={[styles.errorRow, { opacity: errorAnim }]}>
          <Icon name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: space.md },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  textColumn: { flex: 1 },
  label: { ...type.label, color: colors.muted, marginBottom: 2 },
  labelError: { color: colors.danger },
  value: { ...type.value, color: colors.ink },
  placeholder: { color: colors.placeholder },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  input: { flex: 1, padding: 0, margin: 0, includeFontPadding: false },
  suffix: { ...type.value, color: colors.muted },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger, flexShrink: 1 },
});
