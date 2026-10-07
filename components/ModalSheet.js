import { useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { useReducedMotion } from '../motion';
import { colors, duration, iconSize, radius, space, type, TOUCH } from '../theme';

// Bottom sheet for quick actions (add weight, log workout...). Slides up over a dimmed backdrop,
// closes with the X button, a tap on the backdrop, or the Android back button.
export default function ModalSheet({ visible, title, subtitle, onClose, children }) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(0);
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 0 : visible ? duration.base : duration.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, mounted, progress, reduced]);

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={styles.fill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      </Animated.View>

      <KeyboardAvoidingView style={styles.avoider} behavior="padding" pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + space.lg, maxHeight: '92%' },
            { transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) }] },
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <Icon name="close" size={iconSize.lg} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body} bounces={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay },
  fill: { flex: 1 },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg + space.xs,
    borderTopRightRadius: radius.lg + space.xs,
    paddingTop: space.sm,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: space.xl, paddingRight: space.sm, marginTop: space.sm },
  headerText: { flex: 1 },
  title: { ...type.heading, color: colors.ink },
  subtitle: { ...type.caption, color: colors.muted, marginTop: 2 },
  close: { width: TOUCH, height: TOUCH, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: colors.track },
  body: { paddingHorizontal: space.xl, paddingTop: space.lg },
});
