import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, duration, iconSize, radius, space, type } from '../theme';

// A short confirmation ("Weight saved") shown above the tab bar, also announced to screen readers.
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const progress = useAnimatedValue(0);
  const timer = useRef(null);

  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    Animated.timing(progress, { toValue: 1, duration: duration.fast, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(progress, { toValue: 0, duration: duration.base, useNativeDriver: true }).start();
    }, 1800);
  }, [progress]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="none" style={[styles.layer, { bottom: insets.bottom + 88 }]}>
        <Animated.View
          style={[styles.toast, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.check}>
            <Icon name="check" size={iconSize.sm} color={colors.ink} />
          </View>
          <Text style={styles.text} numberOfLines={2}>{message}</Text>
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: space.xl, right: space.xl, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    paddingLeft: space.md,
    paddingRight: space.lg,
  },
  check: { width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  text: { ...type.body, fontWeight: '700', color: colors.surface, flexShrink: 1 },
});
