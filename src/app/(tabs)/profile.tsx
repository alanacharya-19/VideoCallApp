import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Avatar } from '@/components/avatar';
import { IconButton } from '@/components/icon-button';
import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing, TopBarInset } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { backend } from '@/services';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const trimmed = name.trim();
  const isValid = trimmed.length >= 2;
  const hasChanges = trimmed !== user?.name;

  async function handleSave() {
    if (!isValid || !hasChanges) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePhoto() {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUploadingPhoto(true);
    try {
      const photoUrl = await (backend as any).updateProfilePhoto(user.id);
      if (photoUrl) {
        await updateProfile({ photoUrl });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
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
            title="Edit profile"
            action={
              <IconButton
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                onPress={() => router.back()}
                accessibilityLabel="Back"
              />
            }
          />

          <View style={styles.avatarSection}>
            <Avatar
              name={user?.name ?? '?'}
              size={96}
              colorIndex={user?.colorIndex}
              photoUrl={user?.photoUrl}
            />
            <PrimaryButton
              label={uploadingPhoto ? 'Uploading…' : 'Change photo'}
              onPress={handleChangePhoto}
              loading={uploadingPhoto}
              disabled={uploadingPhoto}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.avatarHint}>
              Your photo is stored securely in Cloudinary
            </ThemedText>
          </View>

          <View style={styles.form}>
            <TextField
              label="Display name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              error={name.length > 0 && !isValid ? 'Name must be at least 2 characters' : undefined}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
            />

            <TextField
              label="Email"
              value={user?.email ?? ''}
              editable={false}
              placeholder="Email"
            />
          </View>

          <PrimaryButton
            label="Save changes"
            onPress={() => void handleSave()}
            loading={saving}
            disabled={!isValid || !hasChanges}
          />
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
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  avatarHint: {
    textAlign: 'center',
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.four,
    marginBottom: Spacing.five,
  },
});
