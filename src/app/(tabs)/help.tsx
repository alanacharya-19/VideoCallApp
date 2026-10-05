import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'How do I make a call?',
    answer: 'Go to the Call tab, find a person in your Active list or search for them, then tap their name to start a call.',
  },
  {
    question: 'How do I add friends?',
    answer: 'Go to the Contacts tab, switch to Discover, find someone and tap the add button. They will receive a friend request.',
  },
  {
    question: 'How do I accept a friend request?',
    answer: 'Go to the Contacts tab, switch to Requests, and tap the checkmark to accept or the X to decline.',
  },
  {
    question: 'How do I change my profile photo?',
    answer: 'Go to the Call tab, tap your profile icon, then tap "Change photo" to upload a new picture.',
  },
  {
    question: 'How do I change my display name?',
    answer: 'Go to the Call tab, tap your profile icon, edit your name, and tap "Save changes".',
  },
  {
    question: 'Why is my call not connecting?',
    answer: 'Make sure you have a stable internet connection. If you are using Expo Go, calls are simulated. Use a development build for real video calls.',
  },
  {
    question: 'How do I clear my call history?',
    answer: 'Go to Settings → Calls → Clear call history. This will permanently delete all your call records.',
  },
  {
    question: 'How do I sign out?',
    answer: 'Go to Settings → Session → Sign out. You will be returned to the sign-in screen.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. Your data is stored in Supabase with row-level security. Only you can access your own data.',
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the sign-in screen, tap "Forgot password", enter your email, and follow the reset link sent to your inbox.',
  },
];

function FAQAccordion({ item, isLast }: { item: FAQItem; isLast: boolean }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  function toggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
    height.value = withSpring(expanded ? 0 : 1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(expanded ? 0 : 1, { duration: 200 });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value === 0 ? undefined : height.value * 100,
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.faqItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={item.question}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.faqQuestion}>
          <ThemedText style={styles.faqQuestionText}>{item.question}</ThemedText>
          <SymbolView
            name={{ ios: expanded ? 'chevron.up' : 'chevron.down', android: expanded ? 'expand_less' : 'expand_more', web: expanded ? 'expand_less' : 'expand_more' }}
            size={16}
            tintColor={theme.textSecondary}
          />
        </View>
        {expanded && (
          <ThemedText themeColor="textSecondary" style={styles.faqAnswer}>
            {item.answer}
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

export default function HelpScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Help" />

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            Frequently Asked Questions
          </ThemedText>

          <ThemedView type="card" style={styles.faqCard}>
            {faqs.map((faq, index) => (
              <FAQAccordion
                key={faq.question}
                item={faq}
                isLast={index === faqs.length - 1}
              />
            ))}
          </ThemedView>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
            Contact Support
          </ThemedText>

          <ThemedView type="card" style={styles.contactCard}>
            <ThemedText style={styles.contactText}>
              Need more help? Reach out to our support team and we'll get back to you within 24 hours.
            </ThemedText>
            <Pressable
              onPress={() => {}}
              accessibilityRole="link"
              accessibilityLabel="Email support"
              style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'envelope.fill', android: 'email', web: 'email' }}
                size={16}
                tintColor="#4F46E5"
              />
              <ThemedText type="smallBold" style={styles.contactButtonText}>
                support@meetnow.app
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: TopBarInset,
    maxWidth: MaxContentWidth,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionTitle: {
    alignSelf: 'stretch',
    marginBottom: Spacing.two,
    marginTop: Spacing.four,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCard: {
    alignSelf: 'stretch',
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  faqItem: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  faqQuestionText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  faqAnswer: {
    marginTop: Spacing.two,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    alignSelf: 'stretch',
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  contactText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  contactButtonText: {
    color: '#4F46E5',
  },
  pressed: {
    opacity: 0.6,
  },
});
