import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import ActivityCard from '../components/ActivityCard';
import BmiScale from '../components/BmiScale';
import BrandMark from '../components/BrandMark';
import Card from '../components/Card';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import GoalCard from '../components/GoalCard';
import Icon from '../components/Icon';
import PressableScale from '../components/PressableScale';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import WorkoutCard from '../components/WorkoutCard';
import { useSheet } from '../sheets/SheetProvider';
import {
  byNewest, calculateBMI, currentWeightKg, formatDate, formatWeight, getBMICategory, greeting, monthlyChange,
  todayISO, weightToDisplay, weightUnit,
} from '../fitness';
import { useEntrance } from '../motion';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

const QUICK_ACTIONS = [
  { sheet: 'weight', label: 'Weight', icon: 'scale-bathroom', a11y: 'Add weight' },
  { sheet: 'workout', label: 'Workout', icon: 'dumbbell', a11y: 'Log workout' },
  { sheet: 'activity', label: 'Activity', icon: 'walk', a11y: 'Add activity' },
  { sheet: 'measurement', label: 'Measure', icon: 'tape-measure', a11y: 'Add measurements' },
];

function QuickActions({ onOpen }) {
  const { width } = useWindowDimensions();
  const entrance = useEntrance(1);
  return (
    <Animated.View style={[styles.actions, entrance]}>
      {QUICK_ACTIONS.map((action) => (
        <PressableScale
          key={action.sheet}
          onPress={() => onOpen(action.sheet)}
          accessibilityLabel={action.a11y}
          wrapperStyle={[styles.actionWrap, width < 360 && styles.actionWrapHalf]}
          style={styles.action}
        >
          <View style={styles.actionIcon}>
            <Icon name={action.icon} size={iconSize.lg} color={colors.accent} />
            <View style={styles.actionPlus}>
              <Icon name="plus" size={12} color={colors.ink} />
            </View>
          </View>
          <Text style={styles.actionLabel} numberOfLines={1}>{action.label}</Text>
        </PressableScale>
      ))}
    </Animated.View>
  );
}

function BodySnapshot({ state, onOpenProgress }) {
  const { unitSystem } = state.settings;
  const weightKg = currentWeightKg(state);
  const bmi = calculateBMI(weightKg, state.profile.heightCm);
  const category = getBMICategory(bmi);
  const change = monthlyChange(state.weightHistory);
  const unit = weightUnit(unitSystem);

  return (
    <Card index={0} title="Current weight" icon="scale-bathroom">
      <PressableScale onPress={onOpenProgress} accessibilityLabel={`Current weight ${formatWeight(weightKg, unitSystem)}${change != null ? `, ${change < 0 ? 'down' : 'up'} ${formatWeight(Math.abs(change), unitSystem)} this month` : ''}. Opens progress.`} style={styles.weightRow}>
        <Text style={styles.weight}>
          {weightToDisplay(weightKg, unitSystem).toFixed(1)}
          <Text style={styles.weightUnit}> {unit}</Text>
        </Text>
        {change != null ? (
          <View style={styles.changeChip}>
            <Icon name={change < 0 ? 'arrow-down' : change > 0 ? 'arrow-up' : 'minus'} size={iconSize.sm} color={colors.ink} />
            <Text style={styles.changeText}>{formatWeight(Math.abs(change), unitSystem)} this month</Text>
          </View>
        ) : (
          <Text style={styles.changeHint}>Add weigh-ins to see your trend</Text>
        )}
      </PressableScale>

      <View style={styles.divider} />

      <View style={styles.bmiRow} accessible accessibilityLabel={`BMI ${bmi.toFixed(1)}, ${category.label}`}>
        <View>
          <Text style={styles.eyebrow}>BMI</Text>
          <Text style={styles.bmi}>{bmi.toFixed(1)}</Text>
        </View>
        <CategoryBadge category={category} style={styles.bmiBadge} />
      </View>
      <BmiScale bmi={bmi} category={category} />
    </Card>
  );
}

export default function HomeScreen() {
  const state = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const { profile, settings, goals, workouts, dailyActivity } = state;
  const firstName = profile?.name.split(' ')[0];
  const todayActivity = dailyActivity.find((record) => record.date === todayISO());
  const recentWorkouts = [...workouts].sort(byNewest).slice(0, 2);

  return (
    <Screen inTabs>
      <BrandMark />
      <View style={styles.hello}>
        <Text style={styles.greeting} accessibilityRole="header">
          {greeting()}{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.subtitle}>{profile ? `Your fitness snapshot for ${formatDate(new Date()).replace(/^0/, '')}` : 'Welcome to Athletiq'}</Text>
      </View>

      {!profile ? (
        <EmptyState
          icon="lightning-bolt"
          title="Start tracking"
          message="Add your details to see your BMI, then track your weight, workouts and goals. Everything stays on this device."
          actionLabel="Set up profile"
          actionIcon="arrow-right"
          onAction={() => router.push('/profile-edit')}
        />
      ) : (
        <>
          <BodySnapshot state={state} onOpenProgress={() => router.navigate('/progress')} />

          <QuickActions onOpen={openSheet} />

          <ActivityCard index={2} activity={todayActivity} onUpdate={() => openSheet('activity')} />

          <GoalCard index={3} goals={goals} currentKg={currentWeightKg(state)} unitSystem={settings.unitSystem} onEdit={() => openSheet('goal')} />

          <SectionHeader
            title="Recent workouts"
            actionLabel={recentWorkouts.length ? 'See all' : undefined}
            onAction={recentWorkouts.length ? () => router.navigate('/workouts') : undefined}
          />
          {recentWorkouts.length ? (
            recentWorkouts.map((workout, index) => (
              <WorkoutCard key={workout.id} workout={workout} index={index + 4} onPress={() => router.push(`/workout/${workout.id}`)} />
            ))
          ) : (
            <EmptyState
              index={4}
              icon="dumbbell"
              title="Start your first workout"
              message="Log a session to see it here and in your weekly summary."
              actionLabel="Log workout"
              onAction={() => openSheet('workout')}
            />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { marginTop: space.xxl, marginBottom: space.xl },
  greeting: { ...type.title, color: colors.ink },
  subtitle: { ...type.body, color: colors.muted, marginTop: space.xs },

  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  weight: { ...type.metric, color: colors.ink, lineHeight: 60 },
  weightUnit: { ...type.value, fontSize: 18, color: colors.muted },
  changeChip: { flexDirection: 'row', alignItems: 'center', gap: space.xs, backgroundColor: colors.accentTint, borderRadius: radius.pill, paddingVertical: space.xs, paddingHorizontal: space.md },
  changeText: { ...type.caption, fontWeight: '700', color: colors.ink },
  changeHint: { ...type.caption, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.lg },
  bmiRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.lg },
  eyebrow: { ...type.eyebrow, color: colors.muted },
  bmi: { ...type.number, color: colors.ink },
  bmiBadge: { alignSelf: 'auto', marginBottom: space.xs },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md },
  actionWrap: { flexGrow: 1, flexBasis: '22%' },
  actionWrapHalf: { flexBasis: '45%' },
  action: {
    alignItems: 'center',
    gap: space.sm,
    minHeight: TOUCH + space.xxxl,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  actionPlus: { position: 'absolute', right: -4, bottom: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...type.caption, fontWeight: '700', color: colors.ink },
});
