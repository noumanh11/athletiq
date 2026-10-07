import { useEffect } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Card from './Card';
import EmptyState from './EmptyState';
import Icon from './Icon';
import { formatPace, formatWeight, goalProgress, weightToDisplay, weightUnit } from '../fitness';
import { useReducedMotion } from '../motion';
import { colors, duration, iconSize, radius, space, type, TOUCH } from '../theme';

function ProgressBar({ fraction, label }) {
  const fill = useAnimatedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      fill.setValue(fraction);
      return;
    }
    Animated.timing(fill, { toValue: fraction, duration: duration.slow, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fill, fraction, reduced]);

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
    >
      <Animated.View style={[styles.fill, { transform: [{ scaleX: fill }] }]} />
    </View>
  );
}

// Small one-off celebration: the check pops in and a lime ring fades outwards. No confetti, no loop.
function ReachedMark() {
  const pop = useAnimatedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      pop.setValue(1);
      return;
    }
    Animated.timing(pop, { toValue: 1, duration: duration.slow + 180, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
  }, [pop, reduced]);

  return (
    <View style={styles.markWrap}>
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: pop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.7] }) }],
          },
        ]}
      />
      <Animated.View style={[styles.mark, { transform: [{ scale: pop }] }]}>
        <Icon name="check" size={iconSize.xl} color={colors.ink} />
      </Animated.View>
    </View>
  );
}

export default function GoalCard({ goals, currentKg, unitSystem, onEdit, index }) {
  const progress = goalProgress(goals, currentKg);

  if (!progress) {
    return (
      <EmptyState
        index={index}
        icon="target"
        title="Set a target weight"
        message="Pick a weight to work towards and Athletiq will track your progress."
        actionLabel="Set goal"
        onAction={onEdit}
      />
    );
  }

  const unit = weightUnit(unitSystem);
  const percent = Math.round(progress.fraction * 100);
  const pace = goals.weeklyWeightChangeKg;
  const weeks = pace ? Math.ceil(progress.remaining / pace) : null;

  return (
    <Card
      index={index}
      dark
      title="Your goal"
      icon="target"
      right={(
        <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit goal" hitSlop={8} style={styles.edit}>
          <Icon name="pencil" size={iconSize.md} color={colors.accent} />
        </Pressable>
      )}
    >
      {progress.reached ? (
        <View style={styles.reachedRow} accessible accessibilityLabel={`Goal reached. Target ${formatWeight(progress.target, unitSystem)}.`}>
          <ReachedMark />
          <View style={styles.reachedText}>
            <Text style={styles.reachedTitle}>Goal reached</Text>
            <Text style={styles.caption}>You reached your target of {formatWeight(progress.target, unitSystem)}. Set a new goal whenever you are ready.</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.numbers}>
            <View>
              <Text style={styles.caption}>Target</Text>
              <Text style={styles.target}>
                {weightToDisplay(progress.target, unitSystem)}
                <Text style={styles.unit}> {unit}</Text>
              </Text>
            </View>
            <View style={styles.remaining}>
              <Text style={styles.remainingValue}>{formatWeight(progress.remaining, unitSystem)}</Text>
              <Text style={styles.caption}>to go</Text>
            </View>
          </View>

          <ProgressBar fraction={progress.fraction} label={`Goal progress, ${percent} percent`} />

          <View style={styles.ends}>
            <Text style={styles.caption}>Start {formatWeight(progress.start, unitSystem)}</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>
          {weeks ? (
            <Text style={styles.pace}>
              About {weeks} {weeks === 1 ? 'week' : 'weeks'} at {formatPace(pace, unitSystem)} per week
            </Text>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  edit: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center', margin: -space.md },
  numbers: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.lg },
  caption: { ...type.caption, color: colors.inkMuted },
  target: { ...type.number, color: colors.surface },
  unit: { ...type.value, color: colors.inkMuted },
  remaining: { alignItems: 'flex-end' },
  remainingValue: { ...type.stat, color: colors.accent },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.inkSurface, overflow: 'hidden' },
  fill: { flex: 1, borderRadius: radius.pill, backgroundColor: colors.accent, transformOrigin: 'left' },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  percent: { ...type.caption, fontWeight: '800', color: colors.surface },
  pace: { ...type.caption, color: colors.inkMuted, marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.inkBorder },
  reachedRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  markWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.accent },
  mark: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  reachedText: { flex: 1 },
  reachedTitle: { ...type.heading, color: colors.surface, marginBottom: space.xs },
});
