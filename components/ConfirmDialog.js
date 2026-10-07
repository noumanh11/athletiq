import { Modal, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Icon from './Icon';
import { colors, iconSize, radius, space, type } from '../theme';

// Confirmation for destructive actions. Nothing is deleted until the user presses the red button.
export default function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal accessibilityRole="alert">
          <View style={styles.iconTile}>
            <Icon name="delete-outline" size={iconSize.lg} color={colors.danger} />
          </View>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" compact onPress={onCancel} style={styles.action} />
            <Button label={confirmLabel} variant="danger" compact onPress={onConfirm} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.xl },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.xl },
  iconTile: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.dangerTint, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.heading, color: colors.ink, marginTop: space.lg },
  message: { ...type.body, color: colors.muted, marginTop: space.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl },
  action: { flexGrow: 1, flexBasis: 120 },
});
