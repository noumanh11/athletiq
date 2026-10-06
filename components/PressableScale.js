import { Animated, Pressable, useAnimatedValue } from 'react-native';

// A Pressable that shrinks a little while your finger is down (press feedback).
export default function PressableScale({ children, style, wrapperStyle, onPress, disabled, accessibilityLabel, accessibilityHint }) {
  const scale = useAnimatedValue(1);

  function animateTo(value) {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }

  return (
    <Pressable
      style={wrapperStyle}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
