import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import BmiScale from '../components/BmiScale';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryBadge from '../components/CategoryBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ListRow from '../components/ListRow';
import MeasurementCard from '../components/MeasurementCard';
import MetricCard from '../components/MetricCard';
import ProgressChart from '../components/ProgressChart';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import { useToast } from '../components/Toast';
import { useSheet } from '../sheets/SheetProvider';
import {
  byNewest, formatChange, formatLongDate, formatNumber, formatRelativeDate, formatWeight, getBMICategory,
  measurementSummary, weightStats, weightToDisplay, weightUnit,
} from '../fitness';
import { colors, radius, space, type, TOUCH } from '../theme';

const HISTORY_PREVIEW = 8;

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} chart`}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function activitySummary(record) {
  const parts = [];
  if (record.steps != null) parts.push(`${formatNumber(record.steps)} steps`);
  if (record.activeMinutes != null) parts.push(`${record.activeMinutes} min active`);
  if (record.calories != null) parts.push(`${formatNumber(record.calories)} kcal`);
  return parts.join(' · ');
}

export default function ProgressScreen() {
  const state = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const toast = useToast();
  const { profile, weightHistory, measurements, dailyActivity, settings, actions } = state;
  const { unitSystem } = settings;
  const unit = weightUnit(unitSystem);
  const [series, setSeries] = useState('weight');
  const [showAll, setShowAll] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  if (!profile) {
    return (
      <Screen inTabs title="Progress" subtitle="Your weight, BMI and body over time">
        <EmptyState
          icon="chart-line"
          title="Nothing to show yet"
          message="Set up your profile to start tracking your weight and BMI."
          actionLabel="Set up profile"
          actionIcon="arrow-right"
          onAction={() => router.push('/profile-edit')}
        />
      </Screen>
    );
  }

  const stats = weightStats(weightHistory);
  const history = [...weightHistory].sort(byNewest);
  const latest = history[0];
  const recentActivity = [...dailyActivity].sort(byNewest).slice(0, 7);
  const points = stats
    ? stats.sorted.map((entry) => ({ id: entry.id, date: entry.date, value: series === 'weight' ? weightToDisplay(entry.weightKg, unitSystem) : entry.bmi }))
    : [];

  return (
    <Screen inTabs title="Progress" subtitle="Your weight, BMI and body over time">
      {!stats ? (
        <EmptyState
          icon="scale-bathroom"
          title="Track your first weigh-in"
          message="Add a weight entry to start your progress chart and BMI history."
          actionLabel="Add weight"
          onAction={() => openSheet('weight')}
        />
      ) : (
        <>
          <Card index={0} title="Weight" icon="scale-bathroom">
            <View style={styles.summaryTop}>
              <Text style={styles.current}>
                {weightToDisplay(stats.current, unitSystem).toFixed(1)}
                <Text style={styles.currentUnit}> {unit}</Text>
              </Text>
              <View style={styles.changeBlock} accessible accessibilityLabel={`Change since first entry ${formatChange(weightToDisplay(stats.change, unitSystem), unit)}`}>
                <Text style={styles.change}>{formatChange(weightToDisplay(stats.change, unitSystem), unit)}</Text>
                <Text style={styles.caption}>since first entry</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <MetricCard icon="flag-outline" label="START" value={weightToDisplay(stats.start, unitSystem)} unit={unit} />
              <MetricCard icon="arrow-down" label="LOWEST" value={weightToDisplay(stats.lowest, unitSystem)} unit={unit} />
              <MetricCard icon="arrow-up" label="HIGHEST" value={weightToDisplay(stats.highest, unitSystem)} unit={unit} />
            </View>
          </Card>

          <Card index={1} title="Trend" icon="chart-line" right={(
            <Segmented options={[{ key: 'weight', label: 'Weight' }, { key: 'bmi', label: 'BMI' }]} value={series} onChange={setSeries} />
          )}>
            <ProgressChart
              key={series}
              points={points}
              unit={series === 'weight' ? unit : ''}
              prefix={series === 'weight' ? '' : 'BMI '}
              label={series === 'weight' ? 'Weight chart' : 'BMI chart'}
            />
            <Text style={styles.chartNote}>
              {points.length < 2
                ? 'Add another weigh-in to see your trend line.'
                : series === 'bmi'
                  ? 'Each BMI uses the height saved with that weigh-in.'
                  : 'Tap or drag along the chart to read an entry.'}
            </Text>
          </Card>

          <Card index={2} title="BMI" icon="human-male-height">
            <View style={styles.bmiRow}>
              <Text style={styles.bmi}>{latest.bmi.toFixed(1)}</Text>
              <CategoryBadge category={getBMICategory(latest.bmi)} style={styles.bmiBadge} />
            </View>
            <BmiScale bmi={latest.bmi} category={getBMICategory(latest.bmi)} />
          </Card>
        </>
      )}

      <SectionHeader title="Measurements" actionLabel="Add" actionIcon="plus" onAction={() => openSheet('measurement')} actionHint="Add body measurements" />
      {measurements.length ? (
        <Card index={3}>
          <View style={styles.measureGrid}>
            {measurementSummary(measurements).map((item) => (
              <MeasurementCard key={item.key} item={item} unitSystem={unitSystem} onPress={() => router.push(`/measurement/${item.key}`)} />
            ))}
          </View>
        </Card>
      ) : (
        <EmptyState
          index={3}
          icon="tape-measure"
          title="Start tracking your body measurements"
          message="Record your waist, chest, hips, arms or thighs. Fill in only the ones you want."
          actionLabel="Add measurement"
          onAction={() => openSheet('measurement')}
        />
      )}

      <SectionHeader title="Activity" actionLabel="Add" actionIcon="plus" onAction={() => openSheet('activity')} actionHint="Add activity for a day" />
      {recentActivity.length ? (
        <Card index={4}>
          {recentActivity.map((record, index) => (
            <ListRow
              key={record.date}
              icon="walk"
              title={formatRelativeDate(record.date)}
              subtitle={activitySummary(record)}
              onPress={() => openSheet('activity', { date: record.date })}
              accessibilityHint="Edit activity for this day"
              last={index === recentActivity.length - 1}
            />
          ))}
          <Text style={styles.caption}>Entered manually.</Text>
        </Card>
      ) : (
        <EmptyState
          index={4}
          icon="walk"
          title="No activity logged"
          message="Enter steps, active minutes or calories for a day. Values are entered by you, not read from sensors."
          actionLabel="Add activity"
          onAction={() => openSheet('activity')}
        />
      )}

      {stats ? (
        <>
          <SectionHeader title="Weight history" actionLabel="Add" actionIcon="plus" onAction={() => openSheet('weight')} actionHint="Add a weigh-in" />
          <Card index={5}>
            {(showAll ? history : history.slice(0, HISTORY_PREVIEW)).map((entry, index, shown) => (
              <ListRow
                key={entry.id}
                title={formatWeight(entry.weightKg, unitSystem)}
                subtitle={[formatLongDate(entry.date), entry.note].filter(Boolean).join(' · ')}
                value={entry.bmi.toFixed(1)}
                valueCaption="BMI"
                accessibilityLabel={`${formatWeight(entry.weightKg, unitSystem)}, ${formatLongDate(entry.date)}, BMI ${entry.bmi.toFixed(1)}${entry.note ? `, ${entry.note}` : ''}`}
                onDelete={() => setPendingDelete(entry)}
                deleteLabel={`Delete weigh-in from ${formatLongDate(entry.date)}`}
                last={index === shown.length - 1}
              />
            ))}
            {history.length > HISTORY_PREVIEW ? (
              <Button
                label={showAll ? 'Show less' : `Show all ${history.length} entries`}
                variant="quiet"
                compact
                onPress={() => setShowAll((value) => !value)}
                style={styles.showAll}
              />
            ) : null}
          </Card>
        </>
      ) : null}

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Delete this weigh-in?"
        message={pendingDelete ? `${formatWeight(pendingDelete.weightKg, unitSystem)} on ${formatLongDate(pendingDelete.date)} will be removed from your history.` : ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          actions.deleteWeight(pendingDelete.id);
          setPendingDelete(null);
          toast('Weigh-in deleted');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  current: { ...type.metric, color: colors.ink, lineHeight: 60 },
  currentUnit: { ...type.value, fontSize: 18, color: colors.muted },
  changeBlock: { alignItems: 'flex-end', paddingBottom: space.sm },
  change: { ...type.stat, color: colors.ink },
  caption: { ...type.caption, color: colors.muted, marginTop: space.xs },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },

  segmented: { flexDirection: 'row', padding: 3, gap: 2, borderRadius: radius.sm, backgroundColor: colors.track, marginVertical: -space.md },
  segment: { minHeight: TOUCH - space.sm, minWidth: 64, paddingHorizontal: space.md, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs },
  segmentSelected: { backgroundColor: colors.ink },
  segmentText: { ...type.caption, fontWeight: '700', color: colors.muted },
  segmentTextSelected: { color: colors.surface },
  chartNote: { ...type.caption, color: colors.muted, marginTop: space.sm },

  bmiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.lg },
  bmi: { ...type.number, color: colors.ink },
  bmiBadge: { alignSelf: 'auto' },

  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  showAll: { marginTop: space.md },
});
