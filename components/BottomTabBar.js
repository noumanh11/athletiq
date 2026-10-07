import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import Icon from './Icon';
import { useReducedMotion } from '../motion';
import { colors, duration, iconSize, radius, shadow, space, type, TOUCH } from '../theme';

const TAB_ICONS = { index: 'home', progress: 'chart-line', workouts: 'dumbbell', profile: 'account' };

function TabItem({ label, icon, focused, onPress, onLongPress, position, count }) {
  const active = useAnimatedValue(focused ? 1 : 0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      active.setValue(focused ? 1 : 0);
      return;
    }
    Animated.timing(active, { toValue: focused ? 1 : 0, duration: duration.fast, useNativeDriver: true }).start();
  }, [active, focused, reduced]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${label}, tab ${position} of ${count}`}
      style={styles.item}
    >
      <View style={styles.iconWrap}>
        <Animated.View
          style={[
            styles.pill,
            { opacity: active, transform: [{ scaleX: active.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
          ]}
        />
        <Icon name={icon} size={iconSize.lg} color={focused ? colors.accent : colors.muted} />
      </View>
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

// Custom tab bar for the Expo Router <Tabs>, matching the Athletiq look.
export default function BottomTabBar({ state, descriptors, navigation, insets }) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }

        return (
          <TabItem
            key={route.key}
            label={options.title}
            icon={TAB_ICONS[route.name]}
            focused={focused}
            position={index + 1}
            count={state.routes.length}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
    ...shadow.floating,
  },
  item: { flex: 1, minHeight: TOUCH + space.md, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  iconWrap: { width: 56, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.pill, backgroundColor: colors.ink },
  label: { ...type.caption, fontWeight: '600', color: colors.muted },
  labelActive: { color: colors.ink, fontWeight: '800' },
});
