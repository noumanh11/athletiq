import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// One row inside a card: icon tile, title + optional subtitle, value or chevron on the right.
// Pressable when `onPress` is given; `onDelete` adds a trailing delete button.
export default function ListRow({ icon, title, subtitle, value, valueCaption, onPress, onDelete, deleteLabel, accessibilityLabel, accessibilityHint, last, tone }) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, tone === 'danger' && styles.iconTileDanger]}>
          <Icon name={icon} size={iconSize.md} color={tone === 'danger' ? colors.danger : colors.ink} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text style={[styles.title, tone === 'danger' && styles.titleDanger]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {value != null ? (
        <View style={styles.valueBlock}>
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
          {valueCaption ? <Text style={styles.valueCaption} numberOfLines={1}>{valueCaption}</Text> : null}
        </View>
      ) : null}
      {onPress ? <Icon name="chevron-right" size={iconSize.md} color={colors.placeholder} /> : null}
    </>
  );

  return (
    <View style={[styles.wrap, !last && styles.divider]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.row} accessible accessibilityLabel={accessibilityLabel}>{content}</View>
      )}
      {onDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel || `Delete ${title}`}
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Icon name="delete-outline" size={iconSize.md} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH + space.md, paddingVertical: space.sm },
  pressed: { opacity: 0.6 },
  iconTile: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  iconTileDanger: { backgroundColor: colors.dangerTint },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.value, fontWeight: '700', color: colors.ink },
  titleDanger: { color: colors.danger },
  subtitle: { ...type.caption, color: colors.muted, marginTop: 2 },
  valueBlock: { alignItems: 'flex-end', maxWidth: '45%' },
  value: { ...type.value, fontWeight: '700', color: colors.ink },
  valueCaption: { ...type.caption, color: colors.muted, marginTop: 2 },
  delete: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', marginRight: -space.sm },
});
