import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import Button from '../components/Button';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import ListRow from '../components/ListRow';
import Screen from '../components/Screen';
import { useToast } from '../components/Toast';
import { useSheet } from '../sheets/SheetProvider';
import { formatDuration, formatLongDate, formatRelativeDate, workoutType } from '../fitness';
import { colors, radius, space, type } from '../theme';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const { workouts, actions } = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const workout = workouts.find((item) => item.id === id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/workouts'));

  if (!workout) {
    return (
      <Screen onBack={goBack} title="Workout">
        <EmptyState icon="dumbbell" title="Workout not found" message="This workout may have been deleted." actionLabel="Back to workouts" actionIcon="arrow-left" onAction={goBack} />
      </Screen>
    );
  }

  const kind = workoutType(workout.type);

  return (
    <Screen onBack={goBack} eyebrow="WORKOUT" title={kind.label} subtitle={formatRelativeDate(workout.date)}>
      <Card index={0} dark>
        <View style={styles.hero}>
          <View style={styles.iconTile}>
            <Icon name={kind.icon} size={30} color={colors.ink} />
          </View>
          <View accessible accessibilityLabel={`Duration ${formatDuration(workout.durationMin)}`}>
            <Text style={styles.heroLabel}>DURATION</Text>
            <Text style={styles.heroValue}>{formatDuration(workout.durationMin)}</Text>
          </View>
        </View>
      </Card>

      <Card index={1}>
        <ListRow icon="calendar" title="Date" value={formatLongDate(workout.date)} accessibilityLabel={`Date, ${formatLongDate(workout.date)}`} />
        <ListRow icon={kind.icon} title="Type" value={kind.label} accessibilityLabel={`Type, ${kind.label}`} />
        <ListRow icon="note-text-outline" title="Note" subtitle={workout.note || 'No note'} accessibilityLabel={`Note, ${workout.note || 'none'}`} last />
      </Card>

      <View style={styles.actions}>
        <Button label="Edit" icon="pencil" variant="secondary" compact onPress={() => openSheet('workout', { workout })} style={styles.action} />
        <Button label="Delete" icon="delete-outline" variant="quiet" compact onPress={() => setConfirming(true)} style={styles.action} />
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Delete this workout?"
        message={`${kind.label}, ${formatDuration(workout.durationMin)} on ${formatLongDate(workout.date)} will be removed.`}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          goBack();
          actions.deleteWorkout(workout.id);
          toast('Workout deleted');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  iconTile: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  heroLabel: { ...type.eyebrow, color: colors.inkMuted },
  heroValue: { ...type.number, color: colors.surface },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  action: { flex: 1 },
});
