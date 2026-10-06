import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, space, type } from '../theme';

// The Athletiq brand: a dark rounded tile with a lime bolt + the wordmark.
// It is built from plain views and one icon, so it can be swapped for a real logo later.
export function BrandTile({ size = 40 }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon name="lightning-bolt" size={size * 0.6} color={colors.accent} />
    </View>
  );
}

export default function BrandMark() {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Athletiq, personal fitness metrics">
      <BrandTile />
      <View>
        <Text style={styles.name}>Athletiq</Text>
        <Text style={styles.tagline}>Personal fitness metrics</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tile: { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  name: { ...type.brand, color: colors.ink },
  tagline: { ...type.caption, color: colors.muted, marginTop: 1 },
});
