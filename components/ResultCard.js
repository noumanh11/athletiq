import { useEffect } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Icon from './Icon';
import MetricCard from './MetricCard';
import PressableScale from './PressableScale';
import BmiScale from './BmiScale';
import CategoryBadge from './CategoryBadge';
import { cmToInches, formatMeasure, kgToPounds } from '../fitness';
import HealthyWeightPlanner from './HealthyWeightPlanner';
import { colors, radius, space, type, TOUCH } from '../theme';

// Fades + slides in once when shown. The numbers are shown straight away (no fake loading).
export default function ResultCard({ result, category, onRecalculate }) {
  const enter = useAnimatedValue(0);
  const bmi = Number(result.bmi);
  const imperial = result.unitSystem === 'imperial';
  const totalInches = Math.round(cmToInches(result.heightCm) * 10) / 10;
  const heightValue = imperial
    ? `${Math.floor(totalInches / 12)} ft ${formatMeasure(totalInches % 12)} in`
    : formatMeasure(result.heightCm);
  const weightValue = formatMeasure(imperial ? kgToPounds(result.weightKg) : result.weightKg);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.section} accessibilityRole="header">YOUR RESULTS</Text>
        <Text style={styles.name} numberOfLines={1}>{result.name}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat} accessible accessibilityLabel={`BMI ${result.bmi}, ${category.label}`}>
          <Text style={styles.statCaption}>BMI</Text>
          <Text style={styles.metric} numberOfLines={1} adjustsFontSizeToFit>{result.bmi}</Text>
          <CategoryBadge category={category} />
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat} accessible accessibilityLabel={`Age ${result.age} years`}>
          <Text style={styles.statCaption}>AGE</Text>
          <Text style={styles.metric} numberOfLines={1} adjustsFontSizeToFit>{result.age}</Text>
          <Text style={styles.statUnit}>years</Text>
        </View>
      </View>

      <BmiScale bmi={bmi} category={category} />

      <View style={styles.tipRow}>
        <Icon name="information-outline" size={18} color={colors.muted} />
        <Text style={styles.tip}>{category.tip}</Text>
      </View>

      <View style={styles.metrics}>
        <MetricCard icon="human-male-height" label="HEIGHT" value={heightValue} unit={imperial ? '' : 'cm'} />
        <MetricCard icon="scale-bathroom" label="WEIGHT" value={weightValue} unit={imperial ? 'lb' : 'kg'} />
      </View>

      <HealthyWeightPlanner heightCm={result.heightCm} weightKg={result.weightKg} unitSystem={result.unitSystem} />

      <PressableScale
        style={styles.recalculate}
        onPress={onRecalculate}
        accessibilityLabel="Recalculate"
        accessibilityHint="Hides the results so you can edit your details"
      >
        <Icon name="refresh" size={20} color={colors.ink} />
        <Text style={styles.recalculateText}>Recalculate</Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginTop: space.xxl,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  section: { ...type.section, color: colors.muted },
  name: { ...type.body, fontWeight: '600', color: colors.ink, flexShrink: 1 },

  stats: { flexDirection: 'row', marginTop: space.lg, marginBottom: space.xxl },
  stat: { flex: 1, alignItems: 'flex-start' },
  statDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: space.lg },
  statCaption: { ...type.section, fontSize: 11, color: colors.muted },
  metric: { ...type.metric, color: colors.ink, lineHeight: 60 },
  statUnit: { ...type.body, fontWeight: '600', color: colors.muted },

  tipRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  tip: { ...type.body, color: colors.muted, flex: 1 },

  metrics: { flexDirection: 'row', gap: space.md, marginTop: space.xl },

  recalculate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: TOUCH + 4,
    marginTop: space.xl,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
  },
  recalculateText: { ...type.button, fontSize: 16, color: colors.ink },
});
