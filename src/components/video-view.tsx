import { View, StyleSheet, type ViewProps } from 'react-native';

/**
 * Video views for Agora. When the native module is available (development build),
 * these render real video. In Expo Go or when the module isn't linked, they
 * render as empty views so the app still works with the simulated call flow.
 */

function isAgoraAvailable(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-agora');
    return true;
  } catch {
    return false;
  }
}

const AgoraAvailable = isAgoraAvailable();

let AgoraSurfaceView: any = null;
let AgoraVideoView: any = null;

if (AgoraAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Agora = require('react-native-agora');
    AgoraSurfaceView = requireNativeComponentSafe('AgoraSurfaceView');
    AgoraVideoView = requireNativeComponentSafe('AgoraVideoView');
  } catch {
    AgoraSurfaceView = null;
    AgoraVideoView = null;
  }
}

function requireNativeComponentSafe(name: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeComponent } = require('react-native');
    return requireNativeComponent(name);
  } catch {
    return null;
  }
}

type VideoViewProps = ViewProps & {
  uid: number;
  channelId?: string;
  renderMode?: number;
  mirrorMode?: number;
  zOrderMediaOverlay?: boolean;
};

export function RemoteVideoView({ style, ...rest }: VideoViewProps) {
  if (AgoraVideoView == null) {
    return <View style={[styles.video, style]} {...rest} />;
  }
  return <AgoraVideoView style={[styles.video, style]} {...rest} />;
}

export function LocalVideoView({ style, ...rest }: VideoViewProps) {
  if (AgoraSurfaceView == null) {
    return <View style={[styles.video, style]} {...rest} />;
  }
  return <AgoraSurfaceView style={[styles.video, style]} {...rest} />;
}

const styles = StyleSheet.create({
  video: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
