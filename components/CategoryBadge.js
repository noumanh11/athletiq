import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '../theme';

// BMI category pill: a coloured dot on the category tint. Text stays near-black for contrast.
export default function CategoryBadge({ category, style }) {
  return (
    <View style={[styles.badge, { backgroundColor: category.tint }, style]}>
      <View style={[styles.dot, { backgroundColor: category.color }]} />
      <Text style={styles.text} numberOfLines={1}>{category.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.sm,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 13, fontWeight: '700', color: colors.ink, flexShrink: 1 },
});
