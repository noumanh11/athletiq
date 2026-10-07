import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, useAnimatedValue } from 'react-native';
import { duration } from './theme';

// Shared motion helpers. Every animation in the app is short, runs once, and is skipped
// when the user has turned on "Remove animations" in the system accessibility settings.

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduced(value));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

// Fade + small upward slide when a card first appears. `index` staggers cards in a list.
export function useEntrance(index = 0) {
  const progress = useAnimatedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: duration.base,
      delay: Math.min(index, 6) * duration.stagger,
      useNativeDriver: true,
    }).start();
  }, [progress, index, reduced]);

  return {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
}
