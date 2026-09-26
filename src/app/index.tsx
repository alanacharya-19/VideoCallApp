import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/icon-button';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing, TopBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const activeContacts = [
  { name: 'Ada', isOnline: true },
  { name: 'Grace', isOnline: true },
  { name: 'Alan', isOnline: true },
  { name: 'Katherine', isOnline: false },
  { name: 'Radia', isOnline: true },
  { name: 'Margaret', isOnline: false },
];

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

const filters = [
  { key: 'all', label: 'All' },
  { key: 'missed', label: 'Missed' },
] as const;

type Filter = (typeof filters)[number]['key'];

function statusColor(status: CallStatus, success: string, danger: string, text: string) {
  if (status === 'missed') return danger;
  if (status === 'ongoing') return success;
  return text;
}

function CallRow({ call, isLast }: { call: RecentCall; isLast: boolean }) {
  const theme = useTheme();
  const isOngoing = call.status === 'ongoing';
  const statusIcon = call.status === 'completed' ? null : statusIcons[call.status];

  return (
    <View
      style={[
        styles.callRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Avatar name={call.name} />

      <View style={styles.callInfo}>
        <View style={styles.callNameRow}>
          <ThemedText numberOfLines={1} style={styles.callName}>
            {call.name}
          </ThemedText>
          {statusIcon != null && (
            <SymbolView
              name={statusIcon}
              size={13}
              tintColor={statusColor(call.status, theme.success, theme.danger, theme.text)}
            />
          )}
        </View>

        <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.callMeta}>
          {call.duration != null ? `${call.time} · ${call.duration}` : call.time}
        </ThemedText>
      </View>

      <IconButton
        variant={isOngoing ? 'danger' : 'subtle'}
        name={
          isOngoing
            ? { ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }
            : { ios: 'phone.fill', android: 'call', web: 'call' }
        }
        onPress={() => {}}
        accessibilityLabel={isOngoing ? `End call with ${call.name}` : `Call ${call.name}`}
      />
    </View>
  );
}

export default function CallScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const visibleCalls = useMemo(
    () =>
      (filter === 'missed' ? recentCalls.filter((call) => call.status === 'missed') : recentCalls),
    [filter]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={
              <>
                Meet
                <ThemedText themeColor="textSecondary">Now</ThemedText>
              </>
            }
            action={
              <IconButton
                variant="filled"
                name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                onPress={() => {}}
                accessibilityLabel="Start a new call"
              />
            }
          />

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search" />

          <SectionHeader title="Active" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeRowScroll}
            contentContainerStyle={styles.activeRow}>
            {activeContacts.map((contact) => (
              <View key={contact.name} style={styles.contact}>
                <Avatar name={contact.name} size={56} isOnline={contact.isOnline} />
                <ThemedText numberOfLines={1} style={styles.contactName}>
                  {contact.name}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          <SectionHeader title="Recently" action={filter === 'all' ? 'Clear' : undefined} />

          <View style={styles.filterRow}>
            {filters.map((option) => {
              const isSelected = filter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setFilter(option.key)}
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Show ${option.label.toLowerCase()} calls`}>
                  <ThemedView
                    type={isSelected ? 'backgroundSelected' : 'background'}
                    style={styles.filterPill}>
                    <ThemedText type="small" themeColor={isSelected ? 'text' : 'textSecondary'}>
                      {option.label}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.callList}>
            {visibleCalls.map((call, index) => (
              <CallRow
                key={call.id}
                call={call}
                isLast={index === visibleCalls.length - 1}
              />
            ))}
          </View>
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
  contactName: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
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
  pressed: {
    opacity: 0.7,
  },
});
