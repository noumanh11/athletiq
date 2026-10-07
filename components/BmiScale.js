import { StyleSheet, Text, View } from 'react-native';
import { BMI_CATEGORIES } from '../fitness';
import { colors, radius, space } from '../theme';

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

// Four-segment BMI scale with a marker. Used in the results card, dashboard and profile.
export default function BmiScale({ bmi, category, markerBorder = colors.surface }) {
  return (
    <View accessible accessibilityLabel={`BMI scale. ${category.label}.`}>
      <View style={styles.bar}>
        {BMI_CATEGORIES.map((c) => (
          <View
            key={c.label}
            style={[styles.segment, { backgroundColor: c.color, opacity: c === category ? 1 : 0.3 }]}
          />
        ))}
        <View style={[styles.marker, { left: `${markerPercent(bmi)}%`, borderColor: markerBorder }]} />
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

const styles = StyleSheet.create({
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
  },
  scaleLabels: { flexDirection: 'row', gap: space.xs, marginTop: space.md },
  scaleLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.muted },
  scaleLabelActive: { color: colors.ink, fontWeight: '700' },
});
