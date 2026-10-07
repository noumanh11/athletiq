import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import BmiScale from '../components/BmiScale';
import { BrandTile } from '../components/BrandMark';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import GoalCard from '../components/GoalCard';
import ListRow from '../components/ListRow';
import MeasurementCard from '../components/MeasurementCard';
import MetricCard from '../components/MetricCard';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import UnitToggle from '../components/UnitToggle';
import { useSheet } from '../sheets/SheetProvider';
import {
  calculateAge, calculateBMI, currentWeightKg, formatHeight, getBMICategory, isImperial, measurementSummary,
  parseISODate, weightToDisplay, weightUnit,
} from '../fitness';
import { colors, space, type } from '../theme';

function ProfileSummary({ state, onEdit }) {
  const { profile, settings } = state;
  const { width } = useWindowDimensions();
  const { unitSystem } = settings;
  const weightKg = currentWeightKg(state);
  const bmi = calculateBMI(weightKg, profile.heightCm);
  const category = getBMICategory(bmi);
  const age = calculateAge(parseISODate(profile.dateOfBirth));
  const height = formatHeight(profile.heightCm, unitSystem);

  return (
    <Card index={0}>
      <View style={styles.identity}>
        <BrandTile size={52} />
        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={2} accessibilityRole="header">{profile.name}</Text>
          <Text style={styles.meta}>{age} years {'·'} {profile.gender}</Text>
        </View>
      </View>

      <View style={[styles.metrics, width < 360 && styles.metricsStacked]}>
        <MetricCard icon="human-male-height" label="HEIGHT" value={isImperial(unitSystem) ? height : height.replace(' cm', '')} unit={isImperial(unitSystem) ? '' : 'cm'} />
        <MetricCard icon="scale-bathroom" label="WEIGHT" value={weightToDisplay(weightKg, unitSystem)} unit={weightUnit(unitSystem)} />
      </View>

      <View style={styles.bmiRow} accessible accessibilityLabel={`BMI ${bmi.toFixed(1)}, ${category.label}`}>
        <View>
          <Text style={styles.eyebrow}>BMI</Text>
          <Text style={styles.bmi}>{bmi.toFixed(1)}</Text>
        </View>
        <CategoryBadge category={category} style={styles.badge} />
      </View>
      <BmiScale bmi={bmi} category={category} />

      <Button label="Edit profile" icon="pencil" variant="secondary" compact onPress={onEdit} style={styles.edit} accessibilityHint="Opens the profile form and BMI calculator" />
    </Card>
  );
}

export default function ProfileScreen() {
  const state = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const { profile, goals, measurements, settings, actions } = state;

  return (
    <Screen inTabs title="Profile" subtitle="Your details, goals and preferences">
      {profile ? (
        <ProfileSummary state={state} onEdit={() => router.push('/profile-edit')} />
      ) : (
        <EmptyState
          icon="account"
          title="Create your profile"
          message="Add your name, date of birth, height and weight to unlock your dashboard."
          actionLabel="Set up profile"
          actionIcon="arrow-right"
          onAction={() => router.push('/profile-edit')}
        />
      )}

      {profile ? (
        <>
          <SectionHeader title="Goal" />
          <GoalCard index={1} goals={goals} currentKg={currentWeightKg(state)} unitSystem={settings.unitSystem} onEdit={() => openSheet('goal')} />

          <SectionHeader title="Measurements" actionLabel="Add" actionIcon="plus" onAction={() => openSheet('measurement')} actionHint="Add body measurements" />
          {measurements.length ? (
            <Card index={2}>
              <View style={styles.measureGrid}>
                {measurementSummary(measurements).map((item) => (
                  <MeasurementCard key={item.key} item={item} unitSystem={settings.unitSystem} onPress={() => router.push(`/measurement/${item.key}`)} />
                ))}
              </View>
            </Card>
          ) : (
            <EmptyState
              index={2}
              icon="tape-measure"
              title="Start tracking your body measurements"
              message="Waist, chest, hips, arms and thighs. Add only what you want to follow."
              actionLabel="Add measurement"
              onAction={() => openSheet('measurement')}
            />
          )}
        </>
      ) : null}

      <SectionHeader title="Preferences" />
      <Card index={3}>
        <UnitToggle value={settings.unitSystem} onChange={actions.setUnits} />
        <Text style={styles.unitNote}>Values are saved in kg and cm and converted for display, so switching never changes your data.</Text>
      </Card>

      <Card index={4}>
        <ListRow icon="cog" title="Settings" subtitle="Units, export, clear data, about" onPress={() => router.push('/settings')} last />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  identityText: { flex: 1 },
  name: { ...type.heading, fontSize: 22, color: colors.ink },
  meta: { ...type.body, color: colors.muted, marginTop: 2 },
  metrics: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  metricsStacked: { flexDirection: 'column' },
  bmiRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: space.lg, marginBottom: space.lg },
  eyebrow: { ...type.eyebrow, color: colors.muted },
  bmi: { ...type.number, color: colors.ink },
  badge: { alignSelf: 'auto', marginBottom: space.xs },
  edit: { marginTop: space.xl },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  unitNote: { ...type.caption, color: colors.muted, marginTop: -space.xs },
});
