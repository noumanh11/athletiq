import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { formatChange, formatShortDate, lengthToDisplay, lengthUnit } from '../fitness';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// Tile for one body measurement: latest value and the change since the first entry.
export default function MeasurementCard({ item, unitSystem, onPress }) {
  const unit = lengthUnit(unitSystem);
  const hasData = item.latest != null;
  const changeText = item.change != null ? formatChange(lengthToDisplay(item.change, unitSystem), unit) : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!hasData}
      accessibilityRole="button"
      accessibilityState={{ disabled: !hasData }}
      accessibilityLabel={hasData
        ? `${item.label}, ${lengthToDisplay(item.latest, unitSystem)} ${unit}${changeText ? `, ${changeText} since first entry` : ''}`
        : `${item.label}, not tracked yet`}
      accessibilityHint={hasData ? 'Opens measurement history' : undefined}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <Text style={styles.label}>{item.label.toUpperCase()}</Text>
        {hasData ? <Icon name="chevron-right" size={iconSize.sm} color={colors.placeholder} /> : null}
      </View>
      {hasData ? (
        <>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {lengthToDisplay(item.latest, unitSystem)}
            <Text style={styles.unit}> {unit}</Text>
          </Text>
          <Text style={styles.caption} numberOfLines={1}>
            {changeText ? `${changeText} since first` : formatShortDate(item.date)}
          </Text>
        </>
      ) : (
        <Text style={styles.empty}>Not tracked</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: TOUCH + space.xxxl,
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.track },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...type.eyebrow, color: colors.muted },
  value: { ...type.stat, color: colors.ink, marginTop: space.xs },
  unit: { fontSize: 14, fontWeight: '500', color: colors.muted },
  caption: { ...type.caption, color: colors.muted, marginTop: 2 },
  empty: { ...type.body, color: colors.placeholder, marginTop: space.sm },
});
