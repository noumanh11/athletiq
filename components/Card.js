import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useEntrance } from '../motion';
import { colors, iconSize, radius, space, type } from '../theme';

// The one card surface used across screens. `dark` gives the ink card used for highlights.
// `index` staggers the entrance animation when several cards appear together.
export default function Card({ children, title, icon, right, dark, index = 0, style, accessibilityLabel }) {
  const entrance = useEntrance(index);
  return (
    <Animated.View style={[styles.card, dark && styles.dark, entrance, style]} accessibilityLabel={accessibilityLabel}>
      {title ? (
        <View style={styles.header}>
          {icon ? <Icon name={icon} size={iconSize.sm} color={dark ? colors.accent : colors.muted} /> : null}
          <Text style={[styles.title, dark && styles.titleDark]} accessibilityRole="header" numberOfLines={1}>{title}</Text>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
  },
  dark: { backgroundColor: colors.ink, borderColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md, minHeight: 20 },
  title: { ...type.eyebrow, color: colors.muted, flex: 1, textTransform: 'uppercase' },
  titleDark: { color: colors.accent },
  right: { marginLeft: 'auto' },
});
