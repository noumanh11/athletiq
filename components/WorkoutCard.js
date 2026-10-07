import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { formatDuration, formatRelativeDate, workoutType } from '../fitness';
import { useEntrance } from '../motion';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// One logged workout in a list. Tapping opens the workout details.
export default function WorkoutCard({ workout, onPress, index }) {
  const entrance = useEntrance(index);
  const kind = workoutType(workout.type);
  const when = formatRelativeDate(workout.date);

  return (
    <Animated.View style={entrance}>
      <PressableScale
        onPress={onPress}
        style={styles.card}
        accessibilityLabel={`${kind.label}, ${formatDuration(workout.durationMin)}, ${when}`}
        accessibilityHint="Opens workout details"
      >
        <View style={styles.iconTile}>
          <Icon name={kind.icon} size={iconSize.lg} color={colors.accent} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>{kind.label}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{workout.note || when}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.duration}>{formatDuration(workout.durationMin)}</Text>
          {workout.note ? <Text style={styles.when}>{when}</Text> : null}
        </View>
        <Icon name="chevron-right" size={iconSize.md} color={colors.placeholder} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: TOUCH + space.xl,
    padding: space.md,
    marginBottom: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconTile: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { ...type.value, fontWeight: '700', color: colors.ink },
  subtitle: { ...type.caption, color: colors.muted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  duration: { ...type.value, fontWeight: '800', color: colors.ink },
  when: { ...type.caption, color: colors.muted, marginTop: 2 },
});
