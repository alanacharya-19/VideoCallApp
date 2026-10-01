import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configures push notifications for incoming call alerts.
 * Call this once at app startup.
 */
export async function setupNotifications(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('incoming-calls', {
      name: 'Incoming Calls',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8637A',
      sound: 'default',
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  return true;
}

/**
 * Shows a local notification for an incoming call.
 */
export async function showIncomingCallNotification(callerName: string, callerId: string, mode: 'audio' | 'video' = 'audio') {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: mode === 'video' ? 'Incoming Video Call' : 'Incoming Call',
      body: `${callerName} is calling`,
      data: { callerId, callerName, mode },
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier: 'incoming-call',
    },
    trigger: null,
  });
}

/**
 * Clears all notifications (e.g., after answering or declining a call).
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Gets the notification response listener for handling notification taps.
 */
export function onNotificationResponse(callback: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
