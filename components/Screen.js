import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, iconSize, radius, space, type, TOUCH } from '../theme';

// Shared screen shell: scrolling content, a solid strip behind the status bar,
// and a header with a large title. Pass `onBack` for screens pushed on top of the tabs.
export default function Screen({ title, subtitle, eyebrow, onBack, right, children, scrollRef, inTabs = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: (inTabs ? 0 : insets.bottom) + space.xxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={4}
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          >
            <Icon name="arrow-left" size={iconSize.lg} color={colors.ink} />
          </Pressable>
        ) : null}

        {title ? (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title} accessibilityRole="header">{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {right}
          </View>
        ) : null}

        {children}
      </ScrollView>
      {/* Solid strip behind the status bar so scrolled content never overlaps the clock/icons. */}
      <View style={[styles.statusBarBackdrop, { height: insets.top }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.xl },
  statusBarBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.background },
  back: {
    width: TOUCH,
    height: TOUCH,
    marginLeft: -space.sm,
    marginBottom: space.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { backgroundColor: colors.track },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.xl },
  headerText: { flex: 1 },
  eyebrow: { ...type.section, color: colors.muted, marginBottom: space.xs },
  title: { ...type.title, color: colors.ink },
  subtitle: { ...type.body, color: colors.muted, marginTop: space.xs },
});
