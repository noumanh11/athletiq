import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Card from './Card';
import Icon from './Icon';
import { colors, radius, space, type } from '../theme';

// An intentional "nothing here yet" card: icon, short title, one line of guidance, one action.
export default function EmptyState({ icon, title, message, actionLabel, actionIcon = 'plus', onAction, index }) {
  return (
    <Card index={index} style={styles.card}>
      <View style={styles.iconTile}>
        <Icon name={icon} size={26} color={colors.accent} />
      </View>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction ? <Button label={actionLabel} icon={actionIcon} onPress={onAction} compact style={styles.button} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: space.xxl },
  iconTile: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.heading, color: colors.ink, marginTop: space.lg, textAlign: 'center' },
  message: { ...type.body, color: colors.muted, marginTop: space.xs, textAlign: 'center', maxWidth: 280 },
  button: { marginTop: space.xl, alignSelf: 'stretch' },
});
