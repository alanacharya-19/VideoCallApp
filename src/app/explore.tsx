import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ContactActions } from '@/components/contact-actions';
import { IconButton } from '@/components/icon-button';
import { ScreenHeader } from '@/components/screen-header';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing, TopBarInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Contact = {
  id: string;
  name: string;
  isOnline?: boolean;
};

const contacts: Contact[] = [
  { id: '1', name: 'Ada Lovelace', isOnline: true },
  { id: '2', name: 'Alan Turing', isOnline: true },
  { id: '3', name: 'Grace Hopper', isOnline: true },
  { id: '4', name: 'Katherine Johnson', isOnline: false },
  { id: '5', name: 'Margaret Hamilton', isOnline: false },
  { id: '6', name: 'Radia Perlman', isOnline: true },
];

type ContactGroup = {
  letter: string;
  contacts: Contact[];
};

/** Groups contacts alphabetically, the way a phone book does. */
function groupByLetter(list: Contact[]): ContactGroup[] {
  return list.reduce<ContactGroup[]>((groups, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    const last = groups.at(-1);

    if (last?.letter === letter) {
      last.contacts.push(contact);
    } else {
      groups.push({ letter, contacts: [contact] });
    }
    return groups;
  }, []);
}

function ContactRow({
  contact,
  isLast,
  onPress,
}: {
  contact: Contact;
  isLast: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Call options for ${contact.name}`}>
      <View
        style={[
          styles.contactRowInner,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.separator,
          },
        ]}>
        <Avatar name={contact.name} isOnline={contact.isOnline} />

        <ThemedText numberOfLines={1} style={styles.contactName}>
          {contact.name}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function ContactsScreen() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);

  const groups = useMemo(() => {
    const filtered = contacts.filter((contact) =>
      contact.name.toLowerCase().includes(query.trim().toLowerCase())
    );
    return groupByLetter(filtered);
  }, [query]);

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
              <IconButton
                name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                onPress={() => {}}
                accessibilityLabel="Add a contact"
              />
            }
          />

          <SearchBar value={query} onChangeText={setQuery} placeholder="Search contacts" />

          {groups.length === 0 ? (
            <SectionHeader title="No results" />
          ) : (
            groups.map((group) => (
              <View key={group.letter} style={styles.group}>
                <ThemedText style={styles.groupLetter}>{group.letter}</ThemedText>

                <View style={styles.groupList}>
                  {group.contacts.map((contact, index) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      isLast={index === group.contacts.length - 1}
                      onPress={() => setSelected(contact)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <ContactActions
          name={selected?.name ?? null}
          onClose={() => setSelected(null)}
          onCall={() => {}}
          onVideo={() => {}}
        />
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
  group: {
    alignSelf: 'stretch',
    marginBottom: Spacing.four,
  },
  groupLetter: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  groupList: {
    alignSelf: 'stretch',
  },
  contactRow: {
    alignSelf: 'stretch',
  },
  contactRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
  },
  contactName: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
