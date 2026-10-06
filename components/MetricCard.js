import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, space, type } from '../theme';

// A small stat block: icon + caption on top, value + unit underneath.
export default function MetricCard({ icon, label, value, unit }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value} ${unit}`}>
      <View style={styles.top}>
        <Icon name={icon} size={16} color={colors.muted} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.background, borderRadius: radius.sm, padding: space.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginBottom: space.xs },
  label: { ...type.section, fontSize: 11, color: colors.muted },
  value: { fontSize: 22, fontWeight: '700', color: colors.ink },
  unit: { fontSize: 14, fontWeight: '500', color: colors.muted },
});
