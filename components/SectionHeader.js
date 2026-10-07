import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, iconSize, space, type, TOUCH } from '../theme';

// Small uppercase section label with an optional text action on the right ("Add", "See all").
export default function SectionHeader({ title, actionLabel, actionIcon, onAction, actionHint }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">{title.toUpperCase()}</Text>
      {onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={actionHint}
          hitSlop={8}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          {actionIcon ? <Icon name={actionIcon} size={iconSize.sm} color={colors.ink} /> : null}
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: space.sm, minHeight: TOUCH - space.sm },
  title: { ...type.section, color: colors.muted },
  action: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: TOUCH, paddingLeft: space.md },
  pressed: { opacity: 0.6 },
  actionText: { ...type.body, fontWeight: '700', color: colors.ink },
});
