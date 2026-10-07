import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import WorkoutCard from '../components/WorkoutCard';
import { useSheet } from '../sheets/SheetProvider';
import { byNewest, weeklyWorkoutSummary } from '../fitness';
import { colors, space, type } from '../theme';

const PREVIEW = 20;

export default function WorkoutsScreen() {
  const { workouts } = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const [showAll, setShowAll] = useState(false);
  const week = weeklyWorkoutSummary(workouts);
  const sorted = [...workouts].sort(byNewest);
  const shown = showAll ? sorted : sorted.slice(0, PREVIEW);

  return (
    <Screen inTabs title="Workouts" subtitle="Log sessions and see your week at a glance">
      <Card index={0} dark title="This week" icon="calendar">
        <View style={styles.summary}>
          <View style={styles.stat} accessible accessibilityLabel={`${week.count} ${week.count === 1 ? 'workout' : 'workouts'} this week`}>
            <Text style={styles.statValue}>{week.count}</Text>
            <Text style={styles.statLabel}>{week.count === 1 ? 'workout' : 'workouts'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat} accessible accessibilityLabel={`${week.minutes} minutes this week`}>
            <Text style={styles.statValue}>{week.minutes}</Text>
            <Text style={styles.statLabel}>minutes</Text>
          </View>
        </View>
        <Text style={styles.weekNote}>Monday to today</Text>
      </Card>

      {/* The empty state below has its own button, so this one only shows once there is history. */}
      {sorted.length ? <Button label="Log workout" icon="plus" onPress={() => openSheet('workout')} /> : null}

      <SectionHeader title="Recent workouts" />
      {sorted.length ? (
        <>
          {shown.map((workout, index) => (
            <WorkoutCard key={workout.id} workout={workout} index={index + 1} onPress={() => router.push(`/workout/${workout.id}`)} />
          ))}
          {sorted.length > PREVIEW ? (
            <Button
              label={showAll ? 'Show less' : `Show all ${sorted.length} workouts`}
              variant="quiet"
              compact
              onPress={() => setShowAll((value) => !value)}
              style={styles.showAll}
            />
          ) : null}
        </>
      ) : (
        <EmptyState
          index={1}
          icon="dumbbell"
          title="Start your first workout"
          message="Record the type, duration and a quick note. Your weekly totals update automatically."
          actionLabel="Log workout"
          onAction={() => openSheet('workout')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1 },
  statValue: { ...type.metric, color: colors.surface, lineHeight: 60 },
  statLabel: { ...type.body, fontWeight: '600', color: colors.inkMuted },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.inkBorder, marginHorizontal: space.lg },
  weekNote: { ...type.caption, color: colors.inkMuted, marginTop: space.md },
  showAll: { marginTop: space.sm },
});
