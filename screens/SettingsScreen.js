import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAthletiq } from '../AthletiqContext';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import Icon from '../components/Icon';
import ListRow from '../components/ListRow';
import Screen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import { useToast } from '../components/Toast';
import UnitToggle from '../components/UnitToggle';
import { todayISO } from '../fitness';
import { DATA_VERSION } from '../storage';
import { colors, iconSize, space, type } from '../theme';

export default function SettingsScreen() {
  const state = useAthletiq();
  const router = useRouter();
  const toast = useToast();
  const { settings, actions } = state;
  const [confirmClear, setConfirmClear] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const counts = [
    count(state.weightHistory.length, 'weigh-in', 'weigh-ins'),
    count(state.workouts.length, 'workout', 'workouts'),
    count(state.measurements.length, 'measurement entry', 'measurement entries'),
  ].join(', ');

  // Writes all data to a JSON file in the app cache and opens the system share sheet.
  // Nothing is uploaded by Athletiq; the user chooses where the file goes.
  async function exportData() {
    setExportError('');
    setExporting(true);
    try {
      const { profile, goals, weightHistory, measurements, workouts, dailyActivity } = state;
      const payload = {
        app: 'Athletiq',
        dataVersion: DATA_VERSION,
        exportedAt: new Date().toISOString(),
        units: 'Weights in kg, lengths in cm, dates as YYYY-MM-DD',
        settings,
        profile,
        goals,
        weightHistory,
        measurements,
        workouts,
        dailyActivity,
      };
      const file = new File(Paths.cache, `athletiq-export-${todayISO()}.json`);
      file.create({ overwrite: true });
      file.write(JSON.stringify(payload, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        setExportError('Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Athletiq data', UTI: 'public.json' });
    } catch {
      setExportError('The export file could not be created. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function clearEverything() {
    setConfirmClear(false);
    try {
      await actions.clearAll();
      toast('All data cleared');
      router.dismissTo('/');
    } catch {
      toast('Could not clear data. Please try again.');
    }
  }

  return (
    <Screen onBack={() => router.back()} title="Settings">
      <SectionHeader title="Preferences" />
      <Card index={0}>
        <UnitToggle value={settings.unitSystem} onChange={actions.setUnits} />
        <Text style={styles.caption}>Workout durations always use minutes.</Text>
      </Card>

      <SectionHeader title="Data" />
      <Card index={1}>
        <ListRow
          icon="export-variant"
          title={exporting ? 'Preparing export' : 'Export data'}
          subtitle="Save or share everything as a JSON file"
          onPress={exporting ? undefined : exportData}
          accessibilityHint="Creates a JSON file and opens the share sheet"
        />
        {exportError ? (
          <View style={styles.errorRow}>
            <Icon name="alert-circle-outline" size={14} color={colors.danger} />
            <Text style={styles.error}>{exportError}</Text>
          </View>
        ) : null}
        <ListRow
          icon="delete-outline"
          tone="danger"
          title="Clear all data"
          subtitle={counts}
          onPress={() => setConfirmClear(true)}
          accessibilityHint="Asks for confirmation before removing everything"
          last
        />
      </Card>

      <SectionHeader title="About" />
      <Card index={2}>
        <ListRow icon="lightning-bolt" title="Athletiq" subtitle="Personal fitness companion" />
        <ListRow icon="information-outline" title="Version" value={Constants.expoConfig?.version || '1.0.0'} accessibilityLabel={`Version ${Constants.expoConfig?.version || '1.0.0'}`} last />
      </Card>

      <Card index={3}>
        <View style={styles.privacyHeader}>
          <Icon name="shield-lock-outline" size={iconSize.md} color={colors.ink} />
          <Text style={styles.privacyTitle} accessibilityRole="header">Your data stays on your device</Text>
        </View>
        <Text style={styles.body}>
          Athletiq has no account, no server and no analytics. Your profile, goals and history are stored locally by the app on this phone (using AsyncStorage) and are never uploaded by Athletiq.
        </Text>
        <Text style={styles.body}>
          The data is not encrypted by Athletiq, and Android may include app data in your device backups depending on your backup settings. An export file goes only where you choose to share it.
        </Text>
      </Card>

      <ConfirmDialog
        visible={confirmClear}
        title="Clear all Athletiq data?"
        message="This will permanently remove your profile, goals, measurements, workouts and history from this device."
        confirmLabel="Clear Data"
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearEverything}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { ...type.caption, color: colors.muted, marginTop: -space.xs },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: space.sm },
  error: { ...type.caption, color: colors.danger, flexShrink: 1 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  privacyTitle: { ...type.value, fontWeight: '800', color: colors.ink, flex: 1 },
  body: { ...type.body, color: colors.muted, marginTop: space.sm },
});
