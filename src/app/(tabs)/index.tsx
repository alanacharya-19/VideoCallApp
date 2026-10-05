import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/icon-button';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Radius,
  Shadows,
  Spacing,
  TopBarInset,
} from '@/constants/theme';
import { env } from '@/config/env';
import { useTheme } from '@/hooks/use-theme';
import { useSocial } from '@/providers/social-provider';
import type { CallRecord, User } from '@/services/types';

type Filter = 'all' | 'missed';

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'missed', label: 'Missed' },
];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return sameDay
    ? `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString(
        [],
        { hour: 'numeric', minute: '2-digit' }
      )}`;
}

const outcomeIcons = {
  completed: { ios: 'phone.arrow.up.right', android: 'call_made', web: 'call_made' },
  missed: { ios: 'phone.down', android: 'call_missed', web: 'call_missed' },
} as const;

function HistoryRow({
  record,
  isLast,
  onCall,
}: {
  record: CallRecord;
  isLast: boolean;
  onCall: () => void;
}) {
  const theme = useTheme();
  const isMissed = record.outcome === 'missed';
  const color = isMissed ? theme.danger : theme.success;

  return (
    <View
      style={[
        styles.historyRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Avatar name={record.peerName} colorIndex={record.peerColorIndex} />

      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <ThemedText numberOfLines={1} style={styles.rowTitle}>
            {record.peerName}
          </ThemedText>
          <SymbolView name={outcomeIcons[record.outcome]} size={13} tintColor={color} />
        </View>
        <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.rowMeta}>
          {record.durationSeconds > 0
            ? `${formatWhen(record.startedAt)} · ${formatDuration(record.durationSeconds)}`
            : formatWhen(record.startedAt)}
        </ThemedText>
      </View>

      <IconButton
        size={36}
        iconSize={16}
        name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
        onPress={onCall}
        accessibilityLabel={`Call ${record.peerName} again`}
      />
    </View>
  );
}

function PersonRow({
  person,
  isLast,
  onCall,
  onAdd,
}: {
  person: User;
  isLast: boolean;
  onCall: () => void;
  onAdd?: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.historyRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Avatar name={person.name} isOnline={person.isOnline} colorIndex={person.colorIndex} photoUrl={person.photoUrl} />

      <View style={styles.rowInfo}>
        <ThemedText numberOfLines={1} style={styles.rowTitle}>
          {person.name}
        </ThemedText>
        <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.rowMeta}>
          {person.isOnline ? 'Online' : person.email}
        </ThemedText>
      </View>

      {onAdd != null ? (
        <IconButton
          size={36}
          iconSize={16}
          variant="filled"
          name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
          onPress={onAdd}
          accessibilityLabel={`Add ${person.name} as a friend`}
        />
      ) : (
        <IconButton
          size={36}
          iconSize={16}
          name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
          onPress={onCall}
          accessibilityLabel={`Call ${person.name}`}
        />
      )}
    </View>
  );
}

export default function CallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { friends, directory, callHistory, sendFriendRequest, isFriend, clearCallHistory, loading } =
    useSocial();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const onlineFriends = useMemo(() => friends.filter((friend) => friend.isOnline), [friends]);

  const results = useMemo(() => {
    if (!isSearching) return [];
    return directory
      .filter(
        (person) =>
          person.name.toLowerCase().includes(trimmed) ||
          person.email.toLowerCase().includes(trimmed)
      )
      .sort((a, b) => {
        if (isFriend(a.id) !== isFriend(b.id)) return isFriend(a.id) ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [directory, isSearching, isFriend, trimmed]);

  const visibleHistory = useMemo(
    () => (filter === 'missed' ? callHistory.filter((call) => call.outcome === 'missed') : callHistory),
    [callHistory, filter]
  );

  function handleCall(person: User) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/call/${person.id}`);
  }

  function handleAddFriend(person: User) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void sendFriendRequest(person.id);
  }

  function handleClearHistory() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    void clearCallHistory();
  }

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
                name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
                onPress={() => router.push('/profile')}
                accessibilityLabel="Your profile"
              />
            }
          />

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search people by name or email"
          />

          {isSearching ? (
            <>
              <SectionHeader title={results.length > 0 ? 'People' : 'No matches'} />
              {results.length > 0 && (
                <View style={styles.list}>
                  {results.map((person, index) => (
                    <PersonRow
                      key={person.id}
                      person={person}
                      isLast={index === results.length - 1}
                      onCall={() => handleCall(person)}
                      onAdd={
                        isFriend(person.id) ? undefined : () => handleAddFriend(person)
                      }
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <SectionHeader title="Active" />
              {loading ? (
                <ActivityIndicator style={styles.loader} />
              ) : onlineFriends.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.activeRowScroll}
                  contentContainerStyle={styles.activeRow}>
                  {onlineFriends.map((friend) => (
                    <Pressable
                      key={friend.id}
                      onPress={() => handleCall(friend)}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${friend.name}`}
                      style={({ pressed }) => [styles.contact, pressed && styles.pressed]}>
                      <Avatar
                        name={friend.name}
                        size={56}
                        isOnline
                        colorIndex={friend.colorIndex}
                        photoUrl={friend.photoUrl}
                      />
                      <ThemedText numberOfLines={1} style={styles.contactName}>
                        {friend.name.split(' ')[0]}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <ThemedText themeColor="textSecondary" style={styles.hint}>
                  No friends are online right now.
                </ThemedText>
              )}

              <SectionHeader
                title="Recently"
                action={callHistory.length > 0 ? 'Clear' : undefined}
                onActionPress={handleClearHistory}
              />

              {callHistory.length > 0 && (
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
                          <ThemedText
                            type="small"
                            themeColor={isSelected ? 'text' : 'textSecondary'}>
                            {option.label}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {visibleHistory.length > 0 ? (
                <View style={styles.list}>
                  {visibleHistory.map((record, index) => (
                    <HistoryRow
                      key={record.id}
                      record={record}
                      isLast={index === visibleHistory.length - 1}
                      onCall={() => {
                        const person = [...friends, ...directory].find(
                          (p) => p.id === record.peerId
                        );
                        if (person) handleCall(person);
                      }}
                    />
                  ))}
                </View>
              ) : loading ? (
                <ActivityIndicator style={styles.loader} />
              ) : (
                <View style={styles.empty}>
                  <ThemedText themeColor="textSecondary" style={styles.hint}>
                    {filter === 'missed'
                      ? 'No missed calls.'
                      : 'Calls you make will show up here.'}
                  </ThemedText>
                  {callHistory.length > 0 && (
                    <Pressable
                      onPress={handleClearHistory}
                      accessibilityRole="button"
                      accessibilityLabel="Clear call history"
                      style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
                      <SymbolView
                        name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                        size={15}
                        tintColor={theme.danger}
                      />
                      <ThemedText type="smallBold" style={{ color: theme.danger }}>
                        Clear history
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}
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
  list: {
    alignSelf: 'stretch',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  rowTitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowMeta: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
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
  loader: {
    marginVertical: Spacing.four,
  },
  filterPill: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  empty: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  hint: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.6,
  },
});
