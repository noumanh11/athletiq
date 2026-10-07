import { Tabs } from 'expo-router';
import BottomTabBar from '../../../components/BottomTabBar';
import { useReducedMotion } from '../../../motion';
import { colors } from '../../../theme';

export default function TabsLayout() {
  const reduced = useReducedMotion();
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: reduced ? 'none' : 'fade',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
