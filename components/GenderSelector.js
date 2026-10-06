import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, space, type, TOUCH } from '../theme';

const ICONS = { Male: 'gender-male', Female: 'gender-female' };

// A two-option segmented control. The selected segment turns near-black with white text,
// so the state is clear without relying on colour alone (fill + weight change).
export default function GenderSelector({ options, value, onChange, error, wrapperRef }) {
  return (
    <View ref={wrapperRef} collapsable={false} style={styles.field}>
      <Text style={[styles.label, error && styles.labelError]}>Gender</Text>
      <View style={[styles.track, error && styles.trackError]} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option}
              style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && !selected && styles.segmentPressed]}
            >
              <Icon name={ICONS[option]} size={20} color={selected ? colors.accent : colors.muted} />
              <Text style={[styles.text, selected && styles.textSelected]}>{option}</Text>
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
  track: {
    flexDirection: 'row',
    gap: space.xs,
    padding: space.xs,
    backgroundColor: colors.track,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.track,
  },
  trackError: { borderColor: colors.danger },
  segment: {
    flex: 1,
    minHeight: TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.sm,
  },
  segmentPressed: { backgroundColor: colors.border },
  segmentSelected: { backgroundColor: colors.ink },
  text: { ...type.value, fontWeight: '600', color: colors.muted },
  textSelected: { color: colors.surface, fontWeight: '700' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.sm, marginLeft: space.xs },
  error: { ...type.caption, color: colors.danger, flexShrink: 1 },
});
