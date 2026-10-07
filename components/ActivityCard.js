import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Button from './Button';
import Card from './Card';
import MetricCard from './MetricCard';
import { formatNumber } from '../fitness';
import { colors, space, type } from '../theme';

// Today's manually entered activity. Athletiq does not read step counters or health sensors.
export default function ActivityCard({ activity, onUpdate, index }) {
  const { width } = useWindowDimensions();
  const stacked = width < 360;
  const show = (value) => (value == null ? '-' : formatNumber(value));

  return (
    <Card index={index} title="Today" icon="calendar">
      <View style={[styles.row, stacked && styles.stacked]}>
        <MetricCard icon="walk" label="STEPS" value={show(activity?.steps)} unit="" />
        <MetricCard icon="timer-outline" label="ACTIVE" value={show(activity?.activeMinutes)} unit={activity?.activeMinutes != null ? 'min' : ''} />
        <MetricCard icon="fire" label="CALORIES" value={show(activity?.calories)} unit={activity?.calories != null ? 'kcal' : ''} />
      </View>
      <Text style={styles.note}>
        {activity ? 'Entered manually. Athletiq does not read step or health sensors.' : 'Nothing logged today. Add your steps, active minutes or calories by hand.'}
      </Text>
      <Button
        label={activity ? 'Update activity' : 'Add activity'}
        icon={activity ? 'pencil' : 'plus'}
        variant="quiet"
        compact
        onPress={onUpdate}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  stacked: { flexDirection: 'column' },
  note: { ...type.caption, color: colors.muted, marginTop: space.md },
  button: { marginTop: space.md },
});
