import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Icon from './Icon';
import { calculateBMI, formatMeasure, getBMICategory, healthyWeightRange, kgToPounds, poundsToKg } from '../fitness';
import { colors, radius, space, type, TOUCH } from '../theme';

function StepButton({ icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed, disabled && styles.stepDisabled]}
    >
      <Icon name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

export default function HealthyWeightPlanner({ heightCm, weightKg, unitSystem }) {
  const isImperial = unitSystem === 'imperial';
  const unit = isImperial ? 'lb' : 'kg';
  const current = Number(formatMeasure(isImperial ? kgToPounds(weightKg) : weightKg));
  const [target, setTarget] = useState(current);
  const pulse = useAnimatedValue(1);
  const range = healthyWeightRange(heightCm);
  const targetKg = isImperial ? poundsToKg(target) : target;
  const targetBmi = calculateBMI(targetKg, heightCm);
  const targetCategory = getBMICategory(targetBmi);
  const lower = Number(formatMeasure(isImperial ? kgToPounds(range.minKg) : range.minKg));
  const upper = Number(formatMeasure(isImperial ? kgToPounds(range.maxKg) : range.maxKg));
  const difference = Math.abs(target - current);
  const direction = target > current ? 'above' : 'below';
  const minTarget = isImperial ? 22 : 10;
  const maxTarget = isImperial ? 661 : 300;

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.spring(pulse, { toValue: 1, speed: 26, bounciness: 8, useNativeDriver: true }).start();
  }, [target, pulse]);

  function step(amount) {
    setTarget((previous) => Math.min(maxTarget, Math.max(minTarget, Math.round((previous + amount) * 10) / 10)));
  }

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.iconTile}><Icon name="target" size={22} color={colors.ink} /></View>
        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>WEIGHT EXPLORER</Text>
          <Text style={styles.heading}>Explore a weight</Text>
        </View>
      </View>

      <Text style={styles.intro}>See how a different weight would change your BMI at your current height.</Text>

      <View style={styles.rangeCard}>
        <Text style={styles.rangeLabel}>ADULT BMI REFERENCE · 18.5–24.9</Text>
        <Text style={styles.rangeValue}>About {formatMeasure(lower)}–{formatMeasure(upper)} {unit}</Text>
        <Text style={styles.rangeCaption}>Approximate weight range at your height</Text>
      </View>

      <View style={styles.controlHeader}>
        <Text style={styles.controlLabel}>Explore weight</Text>
        <Pressable onPress={() => setTarget(current)} accessibilityRole="button" accessibilityLabel="Reset explored weight to current weight" style={styles.reset}>
          <Icon name="restore" size={16} color={colors.accent} />
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>
      <View style={styles.controls}>
        <StepButton icon="minus" label={`Decrease explored weight by 1 ${unit}`} onPress={() => step(-1)} disabled={target <= minTarget} />
        <Animated.View style={[styles.targetValue, { transform: [{ scale: pulse }] }]} accessible accessibilityLabel={`Explored weight ${formatMeasure(target)} ${unit}`}>
          <Text style={styles.targetNumber} adjustsFontSizeToFit numberOfLines={1}>{formatMeasure(target)}</Text>
          <Text style={styles.targetUnit}>{unit}</Text>
        </Animated.View>
        <StepButton icon="plus" label={`Increase explored weight by 1 ${unit}`} onPress={() => step(1)} disabled={target >= maxTarget} />
      </View>

      <View style={styles.projection}>
        <View>
          <Text style={styles.projectionLabel}>PROJECTED BMI</Text>
          <Text style={styles.projectionValue}>{targetBmi.toFixed(1)}</Text>
        </View>
        <View style={[styles.categoryPill, { backgroundColor: targetCategory.tint }]}>
          <View style={[styles.categoryDot, { backgroundColor: targetCategory.color }]} />
          <Text style={styles.categoryText}>{targetCategory.label}</Text>
        </View>
      </View>
      <Text style={styles.difference}>
        {difference < 0.05 ? 'This is your current weight.' : `${formatMeasure(difference)} ${unit} ${direction} your current weight.`}
      </Text>
      <Text style={styles.disclaimer}>BMI is a screening measure, not a diagnosis or personal weight goal.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: space.xl, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.ink },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconTile: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1 },
  eyebrow: { ...type.section, color: colors.accent, fontSize: 10 },
  heading: { fontSize: 20, fontWeight: '800', color: colors.surface, marginTop: space.xs },
  intro: { ...type.body, color: colors.border, marginTop: space.md },
  rangeCard: { backgroundColor: colors.inkSurface, borderRadius: radius.md, padding: space.md, marginTop: space.lg },
  rangeLabel: { ...type.section, color: colors.accent, fontSize: 10 },
  rangeValue: { fontSize: 20, fontWeight: '800', color: colors.surface, marginTop: space.xs },
  rangeCaption: { ...type.caption, color: colors.border, marginTop: space.xs },
  controlHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg },
  controlLabel: { ...type.body, fontWeight: '700', color: colors.surface },
  reset: { flexDirection: 'row', gap: space.xs, alignItems: 'center', minHeight: TOUCH, paddingHorizontal: space.sm },
  resetText: { ...type.caption, color: colors.accent, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  step: { width: TOUCH, height: TOUCH, backgroundColor: colors.accent, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stepPressed: { opacity: 0.7 },
  stepDisabled: { opacity: 0.35 },
  targetValue: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: space.xs },
  targetNumber: { fontSize: 34, fontWeight: '800', color: colors.surface },
  targetUnit: { ...type.body, color: colors.border },
  projection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.inkBorder, marginTop: space.lg },
  projectionLabel: { ...type.section, color: colors.border, fontSize: 10 },
  projectionValue: { fontSize: 28, fontWeight: '800', color: colors.surface, marginTop: space.xs },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, flexShrink: 1 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 12, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  difference: { ...type.body, color: colors.surface, marginTop: space.sm },
  disclaimer: { ...type.caption, color: colors.border, marginTop: space.md, lineHeight: 17 },
});
