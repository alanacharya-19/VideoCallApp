import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Avatar } from '@/components/avatar';
import { ContactActions } from '@/components/contact-actions';
import { IconButton } from '@/components/icon-button';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Radius,
  Spacing,
  TopBarInset,
} from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { useSocial } from '@/providers/social-provider';
import { useTheme } from '@/hooks/use-theme';
import type { FriendRequest, User } from '@/services/types';

type ListKey = 'friends' | 'requests' | 'discover';

const lists: { key: ListKey; label: string }[] = [
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
  { key: 'discover', label: 'Discover' },
];

type RowProps = {
  user: User;
  isLast: boolean;
  onSelect: () => void;
  trailing?: ReactNode;
};

function PersonRow({ user, isLast, onSelect, trailing }: RowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.personRowInner,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Pressable
        onPress={onSelect}
        style={styles.personIdentity}
        accessibilityRole="button"
        accessibilityLabel={`Call options for ${user.name}`}>
        <Avatar name={user.name} isOnline={user.isOnline} colorIndex={user.colorIndex} photoUrl={user.photoUrl} />

        <View style={styles.personInfo}>
          <ThemedText numberOfLines={1} style={styles.personName}>
            {user.name}
          </ThemedText>
          <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.personMeta}>
            {user.isOnline ? 'Online' : user.email}
          </ThemedText>
        </View>
      </Pressable>

      {trailing}
    </View>
  );
}

function RequestRow({
  request,
  sender,
  isLast,
  onSelect,
}: {
  request: FriendRequest;
  sender: User | undefined;
  isLast: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const { acceptFriendRequest, declineFriendRequest } = useSocial();

  return (
    <View
      style={[
        styles.personRowInner,
        styles.requestRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.separator,
        },
      ]}>
      <Pressable
        onPress={onSelect}
        style={styles.requestIdentity}
        accessibilityRole="button"
        accessibilityLabel={`Call options for ${sender?.name ?? 'this person'}`}>
        {sender != null && (
          <Avatar name={sender.name} isOnline={sender.isOnline} colorIndex={sender.colorIndex} photoUrl={sender.photoUrl} />
        )}

        <View style={styles.personInfo}>
          <ThemedText numberOfLines={1} style={styles.personName}>
            {sender?.name ?? 'Unknown'}
          </ThemedText>
          <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.personMeta}>
            Wants to connect
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.requestActions}>
        <IconButton
          size={34}
          iconSize={15}
          variant="subtle"
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          onPress={() => void declineFriendRequest(request.id)}
          accessibilityLabel="Decline request"
        />
        <IconButton
          size={34}
          iconSize={15}
          variant="filled"
          name={{ ios: 'checkmark', android: 'check', web: 'check' }}
          onPress={() => void acceptFriendRequest(request.id)}
          accessibilityLabel="Accept request"
        />
      </View>
    </View>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    directory,
    friends,
    incomingRequests,
    loading,
    sendFriendRequest,
    removeFriend,
    isFriend,
    hasPendingRequest,
    requestSender,
  } = useSocial();

  const [query, setQuery] = useState('');
  const [list, setList] = useState<ListKey>('friends');
  const [selected, setSelected] = useState<User | null>(null);

  const matches = (person: User) =>
    person.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    person.email.toLowerCase().includes(query.trim().toLowerCase());

  const visibleFriends = useMemo(() => friends.filter(matches), [friends, query]);
  const visibleRequests = useMemo(
    () => incomingRequests.filter((request) => {
      const sender = requestSender(request);
      return sender == null || matches(sender);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomingRequests, query, requestSender]
  );
  const visibleDiscover = useMemo(
    () =>
      directory
        .filter(matches)
        .filter((person) => !isFriend(person.id) && !hasPendingRequest(person.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [directory, query, isFriend, hasPendingRequest]
  );

  const counts: Record<ListKey, number> = {
    friends: visibleFriends.length,
    requests: visibleRequests.length,
    discover: visibleDiscover.length,
  };

  const isEmpty =
    !loading &&
    (list === 'friends'
      ? visibleFriends.length === 0
      : list === 'requests'
        ? visibleRequests.length === 0
        : visibleDiscover.length === 0);

  function handleRemoveFriend(person: User) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Remove friend',
      `Remove ${person.name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            void removeFriend(person.id);
          },
        },
      ]
    );
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
            title="Contacts"
            action={
              <View style={styles.headerActions}>
                <IconButton
                  name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
                  onPress={() => void signOut()}
                  accessibilityLabel="Sign out"
                />
              </View>
            }
          />

          <View style={styles.profile}>
            <Avatar name={user?.name ?? '?'} size={44} colorIndex={user?.colorIndex} photoUrl={user?.photoUrl} />
            <View style={styles.personInfo}>
              <ThemedText numberOfLines={1} style={styles.personName}>
                {user?.name}
              </ThemedText>
              <ThemedText numberOfLines={1} themeColor="textSecondary" style={styles.personMeta}>
                {user?.email}
              </ThemedText>
            </View>
          </View>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search people by name or email"
          />

          <View style={styles.filterRow}>
            {lists.map((option) => {
              const isSelected = list === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setList(option.key)}
                  style={({ pressed }) => pressed && styles.pressed}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Show ${option.label.toLowerCase()}`}>
                  <ThemedView
                    type={isSelected ? 'backgroundSelected' : 'background'}
                    style={styles.filterPill}>
                    <ThemedText
                      type="small"
                      themeColor={isSelected ? 'text' : 'textSecondary'}>
                      {option.label}
                      {counts[option.key] > 0 ? `  ${counts[option.key]}` : ''}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : isEmpty ? (
            <EmptyState
              list={list}
              hasQuery={query.trim().length > 0}
              onAddFriend={() => setList('discover')}
            />
          ) : list === 'friends' ? (
            <View style={styles.list}>
              {visibleFriends.map((person, index) => (
                <PersonRow
                  key={person.id}
                  user={person}
                  isLast={index === visibleFriends.length - 1}
                  onSelect={() => setSelected(person)}
                  trailing={
                    <View style={styles.friendActions}>
                      <IconButton
                        size={34}
                        iconSize={15}
                        name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                        onPress={() => router.push(`/call/${person.id}`)}
                        accessibilityLabel={`Call ${person.name}`}
                      />
                      <IconButton
                        size={34}
                        iconSize={15}
                        variant="subtle"
                        name={{ ios: 'person.badge.minus', android: 'person_remove', web: 'person_remove' }}
                        onPress={() => handleRemoveFriend(person)}
                        accessibilityLabel={`Remove ${person.name} from friends`}
                      />
                    </View>
                  }
                />
              ))}
            </View>
          ) : list === 'requests' ? (
            <View style={styles.list}>
              {visibleRequests.map((request, index) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  sender={requestSender(request)}
                  isLast={index === visibleRequests.length - 1}
                  onSelect={() => {
                    const sender = requestSender(request);
                    if (sender != null) setSelected(sender);
                  }}
                />
              ))}
            </View>
          ) : (
            <View style={styles.list}>
              {visibleDiscover.map((person, index) => (
                <PersonRow
                  key={person.id}
                  user={person}
                  isLast={index === visibleDiscover.length - 1}
                  onSelect={() => setSelected(person)}
                  trailing={
                    <IconButton
                      size={34}
                      iconSize={15}
                      variant="filled"
                      name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                      onPress={() => void sendFriendRequest(person.id)}
                      accessibilityLabel={`Add ${person.name} as a friend`}
                    />
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>

        <ContactActions
          name={selected?.name ?? null}
          onClose={() => setSelected(null)}
          onCall={(name) => {
            const person =
              friends.find((friend) => friend.name === name) ??
              directory.find((candidate) => candidate.name === name);
            if (person != null) router.push(`/call/${person.id}`);
          }}
          onVideo={(name) => {
            const person =
              friends.find((friend) => friend.name === name) ??
              directory.find((candidate) => candidate.name === name);
            if (person != null) router.push(`/call/${person.id}?mode=video`);
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

function EmptyState({
  list,
  hasQuery,
  onAddFriend,
}: {
  list: ListKey;
  hasQuery: boolean;
  onAddFriend: () => void;
}) {
  const theme = useTheme();
  const copy = hasQuery
    ? { title: 'No matches', body: 'Try a different name or email.' }
    : list === 'friends'
      ? { title: 'No friends yet', body: 'Add people from Discover to call them faster.' }
      : list === 'requests'
        ? { title: 'No pending requests', body: 'You are all caught up.' }
        : { title: 'Nobody new to show', body: 'Everyone here is already a friend.' };

  return (
    <View style={styles.empty}>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        {copy.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
        {copy.body}
      </ThemedText>
      {!hasQuery && list === 'friends' && (
        <Pressable
          onPress={onAddFriend}
          accessibilityRole="button"
          accessibilityLabel="Browse people"
          style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'person.2', android: 'group', web: 'group' }}
            size={16}
            tintColor={theme.text}
          />
          <ThemedText type="smallBold">Browse people</ThemedText>
        </Pressable>
      )}
    </View>
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
  headerActions: {
    width: 40,
    alignItems: 'center',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
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
    borderRadius: Radius.full,
  },
  list: {
    alignSelf: 'stretch',
  },
  personRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
  },
  personIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
    paddingVertical: Spacing.one,
  },
  personInfo: {
    flex: 1,
    gap: 2,
  },
  personName: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  personMeta: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  requestRow: {
    justifyContent: 'space-between',
  },
  requestIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.five,
  },
  empty: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.6,
  },
});
