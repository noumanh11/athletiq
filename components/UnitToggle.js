import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { colors, radius, space, type, TOUCH } from '../theme';

function Option({ label, detail, selected, onPress }) {
  const scale = useAnimatedValue(selected ? 1 : 0.96);

  useEffect(() => {
    Animated.spring(scale, { toValue: selected ? 1 : 0.96, speed: 24, bounciness: 4, useNativeDriver: true }).start();
  }, [scale, selected]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${detail}`}
      style={styles.option}
    >
      <Animated.View style={[styles.optionInner, selected && styles.selected, { transform: [{ scale }] }]}>
        <Text style={[styles.optionLabel, selected && styles.selectedText]}>{label}</Text>
        <Text style={[styles.optionDetail, selected && styles.selectedDetail]}>{detail}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function UnitToggle({ value, onChange }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>MEASUREMENT UNITS</Text>
      <View style={styles.track} accessibilityRole="radiogroup">
        <Option label="Metric" detail="cm · kg" selected={value === 'metric'} onPress={() => onChange('metric')} />
        <Option label="Imperial" detail="ft · in · lb" selected={value === 'imperial'} onPress={() => onChange('imperial')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  label: { ...type.section, color: colors.muted, marginBottom: space.md },
  track: { flexDirection: 'row', gap: space.xs, padding: space.xs, borderRadius: radius.md, backgroundColor: colors.track },
  option: { flex: 1, minHeight: TOUCH },
  optionInner: { flex: 1, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingVertical: space.sm },
  selected: { backgroundColor: colors.ink },
  optionLabel: { ...type.value, fontWeight: '700', color: colors.muted },
  selectedText: { color: colors.surface },
  optionDetail: { ...type.caption, color: colors.muted, marginTop: space.xs },
  selectedDetail: { color: colors.accent },
});
