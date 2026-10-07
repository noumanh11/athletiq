import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// Single-choice chips that wrap onto several lines (workout type, goal pace).
// The selected chip turns near-black, like the gender and unit controls.
export default function ChoiceChips({ label, options, value, onChange, error, wrapperRef, columns = 2 }) {
  return (
    <View ref={wrapperRef} collapsable={false} style={styles.field}>
      {label ? <Text style={[styles.label, error && styles.labelError]}>{label}</Text> : null}
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <Pressable
              key={option.key}
              onPress={() => onChange(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={({ pressed }) => [
                styles.chip,
                { flexBasis: `${100 / columns - 3}%` },
                selected && styles.selected,
                error && !selected && styles.chipError,
                pressed && !selected && styles.pressed,
              ]}
            >
              {option.icon ? <Icon name={option.icon} size={iconSize.md} color={selected ? colors.accent : colors.muted} /> : null}
              <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: space.md },
  label: { ...type.label, color: colors.muted, marginBottom: space.sm, marginLeft: space.xs },
  labelError: { color: colors.danger },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: TOUCH,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipError: { borderColor: colors.danger },
  pressed: { backgroundColor: colors.track },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { ...type.value, fontWeight: '600', color: colors.ink, flexShrink: 1 },
  textSelected: { color: colors.surface, fontWeight: '700' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger, flexShrink: 1 },
});
