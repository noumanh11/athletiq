import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// The app's buttons, all built on PressableScale so press feedback is identical everywhere.
// - primary:   near-black with a lime icon tile (the original "Calculate" style)
// - secondary: outlined
// - danger:    filled red, only for destructive confirmations
// - quiet:     light filled, for less important actions
export default function Button({ label, icon, variant = 'primary', onPress, disabled, accessibilityHint, compact, style }) {
  const isPrimary = variant === 'primary';
  const textColor = variant === 'primary' || variant === 'danger' ? colors.surface : colors.ink;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      wrapperStyle={style}
      style={[
        styles.base,
        compact && styles.compact,
        styles[variant],
        isPrimary && icon && styles.primaryWithIcon,
        disabled && styles.disabled,
      ]}
    >
      {!isPrimary && icon ? <Icon name={icon} size={iconSize.md} color={variant === 'danger' ? colors.surface : colors.ink} /> : null}
      <Text style={[styles.text, compact && styles.compactText, { color: textColor }]} numberOfLines={1}>{label}</Text>
      {isPrimary && icon ? (
        <View style={[styles.iconTile, compact && styles.iconTileCompact]}>
          <Icon name={icon} size={iconSize.md} color={colors.ink} />
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: TOUCH + space.sm,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
  },
  compact: { minHeight: TOUCH, paddingHorizontal: space.lg },
  primary: { backgroundColor: colors.ink },
  primaryWithIcon: { justifyContent: 'space-between', paddingLeft: space.xxl, paddingRight: space.sm },
  secondary: { borderWidth: 1.5, borderColor: colors.ink },
  danger: { backgroundColor: colors.danger },
  quiet: { backgroundColor: colors.track },
  disabled: { opacity: 0.4 },
  text: { ...type.button, flexShrink: 1 },
  compactText: { fontSize: 15 },
  iconTile: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  iconTileCompact: { width: 32, height: 32, borderRadius: radius.xs },
});
