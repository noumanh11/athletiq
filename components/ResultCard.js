import { useEffect } from 'react';
import { Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Icon from './Icon';
import MetricCard from './MetricCard';
import PressableScale from './PressableScale';
import { BMI_CATEGORIES } from '../fitness';
import { colors, radius, space, type, TOUCH } from '../theme';

// Where the marker sits on the scale, as a percentage.
// Each category gets an equal quarter of the bar, and the BMI is placed proportionally inside its quarter.
function markerPercent(bmi) {
  let index = BMI_CATEGORIES.findIndex((c) => bmi < c.to);
  if (index === -1) index = BMI_CATEGORIES.length - 1; // BMI of 40 or more
  const segment = BMI_CATEGORIES[index];
  const clamped = Math.min(Math.max(bmi, segment.from), segment.to);
  const inside = (clamped - segment.from) / (segment.to - segment.from);
  return ((index + inside) / BMI_CATEGORIES.length) * 100;
}

function BmiScale({ bmi, category }) {
  return (
    <View accessible accessibilityLabel={`BMI scale. ${category.label}.`}>
      <View style={styles.bar}>
        {BMI_CATEGORIES.map((c) => (
          <View
            key={c.label}
            style={[styles.segment, { backgroundColor: c.color, opacity: c === category ? 1 : 0.3 }]}
          />
        ))}
        <View style={[styles.marker, { left: `${markerPercent(bmi)}%` }]} />
      </View>
      <View style={styles.scaleLabels}>
        {BMI_CATEGORIES.map((c) => (
          <Text
            key={c.label}
            style={[styles.scaleLabel, c === category && styles.scaleLabelActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {c.short}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Fades + slides in once when shown. The numbers are shown straight away (no fake loading).
export default function ResultCard({ result, category, onRecalculate }) {
  const enter = useAnimatedValue(0);
  const bmi = Number(result.bmi);

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
          <View style={[styles.badge, { backgroundColor: category.tint }]}>
            <View style={[styles.badgeDot, { backgroundColor: category.color }]} />
            <Text style={styles.badgeText}>{category.label}</Text>
          </View>
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
        <MetricCard icon="human-male-height" label="HEIGHT" value={result.height} unit="cm" />
        <MetricCard icon="scale-bathroom" label="WEIGHT" value={result.weight} unit="kg" />
      </View>

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

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: '700', color: colors.ink },

  bar: { flexDirection: 'row', gap: space.xs, height: 8, justifyContent: 'center' },
  segment: { flex: 1, borderRadius: radius.pill },
  marker: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.ink,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  scaleLabels: { flexDirection: 'row', gap: space.xs, marginTop: space.md },
  scaleLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted },
  scaleLabelActive: { color: colors.ink, fontWeight: '700' },

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
