import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The web tab bar floats over the top of the page, so the screen needs extra
 * top padding there to keep the wordmark clear of it. */
const topInset = Platform.select({ web: 120, default: Spacing.two }) ?? Spacing.two;

const activeContacts = ['Ada', 'Grace', 'Alan', 'Katherine', 'Radia', 'Margaret'];

type CallStatus = 'ongoing' | 'upcoming' | 'missed' | 'completed';

type RecentCall = {
  id: string;
  name: string;
  status: CallStatus;
  /** When the call happened, or when an upcoming one starts. */
  time: string;
  /** Only present once the two people have actually spoken. */
  duration?: string;
};

/** Shown next to the name for the states worth calling out. */
const statusIcons = {
  ongoing: { ios: 'phone.arrow.up.right', android: 'call_made', web: 'call_made' },
  upcoming: { ios: 'clock', android: 'schedule', web: 'schedule' },
  missed: { ios: 'phone.down', android: 'call_missed', web: 'call_missed' },
} as const;

const recentCalls: RecentCall[] = [
  { id: '1', name: 'Ada Lovelace', status: 'ongoing', time: 'Now', duration: '12:04' },
  { id: '2', name: 'Grace Hopper', status: 'upcoming', time: 'Starts in 5 min' },
  { id: '3', name: 'Alan Turing', status: 'missed', time: 'Yesterday, 9:12 PM' },
  { id: '4', name: 'Katherine Johnson', status: 'completed', time: 'Yesterday, 4:30 PM', duration: '5:32' },
  { id: '5', name: 'Radia Perlman', status: 'completed', time: 'Monday, 11:05 AM', duration: '1:04' },
  { id: '6', name: 'Margaret Hamilton', status: 'missed', time: 'Monday, 8:02 AM' },
];

function ActiveContact({ name }: { name: string }) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.contact}>
      <ThemedView type="backgroundSelected" style={styles.avatar}>
        <ThemedText style={styles.avatarInitial}>{name.charAt(0)}</ThemedText>
        <ThemedView
          style={[
            styles.onlineDot,
            { backgroundColor: theme.success, borderColor: theme.background },
          ]}
        />
      </ThemedView>
      <ThemedText numberOfLines={1} style={styles.contactName}>
        {name}
      </ThemedText>
    </ThemedView>
  );
}

function RecentCallRow({ call, isLast }: { call: RecentCall; isLast: boolean }) {
  const theme = useTheme();
  const isOngoing = call.status === 'ongoing';
  const statusIcon = call.status === 'completed' ? null : statusIcons[call.status];
  const statusColor =
    call.status === 'missed'
      ? theme.danger
      : call.status === 'ongoing'
        ? theme.success
        : theme.text;

  return (
    <ThemedView
      style={[
        styles.callRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <ThemedView type="backgroundSelected" style={styles.callAvatar}>
        <ThemedText style={styles.callAvatarInitial}>{call.name.charAt(0)}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.callInfo}>
        <ThemedView style={styles.callNameRow}>
          <ThemedText numberOfLines={1} style={styles.callName}>
            {call.name}
          </ThemedText>
          {statusIcon != null && <SymbolView name={statusIcon} size={13} tintColor={statusColor} />}
        </ThemedView>

        <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.callMeta}>
          {call.duration != null ? `${call.time} · ${call.duration}` : call.time}
        </ThemedText>
      </ThemedView>

      <Pressable
        onPress={() => {}}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={isOngoing ? `End call with ${call.name}` : `Call ${call.name}`}>
        <ThemedView
          type={isOngoing ? 'background' : 'backgroundElement'}
          style={[styles.callButton, isOngoing && { backgroundColor: theme.danger }]}>
          <SymbolView
            name={
              isOngoing
                ? { ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }
                : { ios: 'phone.fill', android: 'call', web: 'call' }
            }
            size={18}
            tintColor={isOngoing ? theme.background : theme.text}
          />
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <ThemedView style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {action != null && (
        <Pressable
          onPress={() => {}}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${title.toLowerCase()}`}>
          <ThemedText type="small" themeColor="textSecondary">
            {action}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

export default function CallScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerSlot} />
            <ThemedText style={styles.appName}>
              Meet
              <ThemedText themeColor="textSecondary">Now</ThemedText>
            </ThemedText>
            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [styles.newCallButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Start a new call">
              <ThemedView style={[styles.newCallButtonFill, { backgroundColor: theme.text }]}>
                <SymbolView
                  name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                  size={19}
                  tintColor={theme.background}
                />
              </ThemedView>
            </Pressable>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.searchBar}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={17}
              tintColor={theme.textSecondary}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.text}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search"
            />

            {query.length > 0 && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <SymbolView
                  name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
                  size={17}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            )}
          </ThemedView>

          <SectionHeader title="Active" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeRowScroll}
            contentContainerStyle={styles.activeRow}>
            {activeContacts.map((name) => (
              <ActiveContact key={name} name={name} />
            ))}
          </ScrollView>

          <SectionHeader title="Recently" action="Clear" />

          <ThemedView style={styles.callList}>
            {recentCalls.map((call, index) => (
              <RecentCallRow
                key={call.id}
                call={call}
                isLast={index === recentCalls.length - 1}
              />
            ))}
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
    paddingTop: topInset,
    maxWidth: MaxContentWidth,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.four,
  },
  headerSlot: {
    width: 40,
  },
  appName: {
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  newCallButton: {
    width: 40,
  },
  newCallButtonFill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.two,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    marginBottom: Spacing.five,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  activeRowScroll: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
    marginBottom: Spacing.five,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingRight: Spacing.four,
  },
  contact: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 64,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.rounded,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  contactName: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  callList: {
    alignSelf: 'stretch',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
  },
  callAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callAvatarInitial: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  callInfo: {
    flex: 1,
    gap: 2,
  },
  callNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  callName: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 1,
  },
  callMeta: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
