import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAthletiq } from '../AthletiqContext';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import ListRow from '../components/ListRow';
import ProgressChart from '../components/ProgressChart';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import { useToast } from '../components/Toast';
import { useSheet } from '../sheets/SheetProvider';
import { formatChange, formatLength, formatLongDate, lengthToDisplay, lengthUnit, measurementSeries, measurementType } from '../fitness';
import { colors, space, type } from '../theme';

export default function MeasurementHistoryScreen() {
  const { key } = useLocalSearchParams();
  const { measurements, settings, actions } = useAthletiq();
  const router = useRouter();
  const openSheet = useSheet();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState(null);
  const { unitSystem } = settings;
  const unit = lengthUnit(unitSystem);
  const item = measurementType(key) || { key, label: 'Measurement' };
  const series = measurementSeries(measurements, item.key); // oldest first
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/progress'));

  if (!series.length) {
    return (
      <Screen onBack={goBack} eyebrow="MEASUREMENT" title={item.label}>
        <EmptyState
          icon="tape-measure"
          title={`No ${item.label.toLowerCase()} entries yet`}
          message="Add a measurement to start tracking it."
          actionLabel="Add measurement"
          onAction={() => openSheet('measurement')}
        />
      </Screen>
    );
  }

  const first = series[0].values[item.key];
  const latest = series[series.length - 1].values[item.key];
  const newestFirst = [...series].reverse();

  return (
    <Screen onBack={goBack} eyebrow="MEASUREMENT" title={item.label}>
      <Card index={0}>
        <View style={styles.top}>
          <Text style={styles.value}>
            {lengthToDisplay(latest, unitSystem)}
            <Text style={styles.unit}> {unit}</Text>
          </Text>
          {series.length > 1 ? (
            <View style={styles.changeBlock}>
              <Text style={styles.change}>{formatChange(lengthToDisplay(latest - first, unitSystem), unit)}</Text>
              <Text style={styles.caption}>since first entry</Text>
            </View>
          ) : null}
        </View>
        {series.length < 2 ? <Text style={styles.caption}>Add another entry to see a trend.</Text> : null}
      </Card>

      {series.length > 1 ? (
        <Card index={1} title="Trend" icon="chart-line">
          <ProgressChart
            points={series.map((entry) => ({ id: entry.id, date: entry.date, value: lengthToDisplay(entry.values[item.key], unitSystem) }))}
            unit={unit}
            height={150}
            label={`${item.label} chart`}
          />
        </Card>
      ) : null}

      <SectionHeader title="History" actionLabel="Add" actionIcon="plus" onAction={() => openSheet('measurement')} actionHint="Add body measurements" />
      <Card index={2}>
        {newestFirst.map((entry, index) => (
          <ListRow
            key={entry.id}
            title={formatLength(entry.values[item.key], unitSystem)}
            subtitle={formatLongDate(entry.date)}
            accessibilityLabel={`${formatLength(entry.values[item.key], unitSystem)}, ${formatLongDate(entry.date)}`}
            onDelete={() => setPendingDelete(entry)}
            deleteLabel={`Delete ${item.label.toLowerCase()} entry from ${formatLongDate(entry.date)}`}
            last={index === newestFirst.length - 1}
          />
        ))}
      </Card>

      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title={`Delete this ${item.label.toLowerCase()} entry?`}
        message={pendingDelete ? `${formatLength(pendingDelete.values[item.key], unitSystem)} on ${formatLongDate(pendingDelete.date)} will be removed. Other measurements from that day are kept.` : ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          actions.deleteMeasurementValue(pendingDelete.id, item.key);
          setPendingDelete(null);
          toast('Entry deleted');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  value: { ...type.metric, color: colors.ink, lineHeight: 60 },
  unit: { ...type.value, fontSize: 18, color: colors.muted },
  changeBlock: { alignItems: 'flex-end', paddingBottom: space.sm },
  change: { ...type.stat, color: colors.ink },
  caption: { ...type.caption, color: colors.muted, marginTop: space.xs },
});
