import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AthletiqProvider, useAthletiq } from '../../AthletiqContext';
import { BrandTile } from '../../components/BrandMark';
import Button from '../../components/Button';
import { ToastProvider } from '../../components/Toast';
import { useReducedMotion } from '../../motion';
import { SheetProvider } from '../../sheets/SheetProvider';
import { colors, space, type } from '../../theme';

// Root of the app: data + feedback providers, a short loading state while saved data is read,
// then a stack with the four tabs and the detail screens pushed on top of them.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AthletiqProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AthletiqProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { status, reload } = useAthletiq();
  const reduced = useReducedMotion();

  if (status === 'loading') {
    return (
      <View style={styles.center} accessible accessibilityLabel="Loading Athletiq">
        <StatusBar style="dark" />
        <BrandTile size={56} />
        <ActivityIndicator color={colors.muted} style={styles.spinner} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <BrandTile size={56} />
        <Text style={styles.title} accessibilityRole="header">Could not load your data</Text>
        <Text style={styles.body}>Your saved Athletiq data could not be read. Nothing has been deleted.</Text>
        <Button label="Try again" icon="refresh" onPress={reload} style={styles.retry} />
      </View>
    );
  }

  return (
    <SheetProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduced ? 'none' : 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SheetProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, backgroundColor: colors.background },
  spinner: { marginTop: space.xl },
  title: { ...type.heading, color: colors.ink, marginTop: space.xl, textAlign: 'center' },
  body: { ...type.body, color: colors.muted, marginTop: space.sm, textAlign: 'center' },
  retry: { marginTop: space.xl, alignSelf: 'stretch' },
});
