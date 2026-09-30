import { requireNativeComponent, View, StyleSheet, type ViewProps } from 'react-native';
import { RenderModeType } from 'react-native-agora';

const AgoraSurfaceView = requireNativeComponent<any>('AgoraSurfaceView');
const AgoraVideoView = requireNativeComponent<any>('AgoraVideoView');

type VideoViewProps = ViewProps & {
  uid: number;
  channelId?: string;
  renderMode?: number;
  mirrorMode?: number;
  zOrderMediaOverlay?: boolean;
};

/**
 * Renders a remote Agora video stream.
 * For local preview, use `LocalVideoView` instead.
 */
export function RemoteVideoView({
  uid,
  channelId,
  renderMode = RenderModeType.RenderModeHidden,
  mirrorMode,
  zOrderMediaOverlay,
  style,
  ...rest
}: VideoViewProps) {
  return (
    <AgoraVideoView
      style={[styles.video, style]}
      uid={uid}
      channelId={channelId}
      renderMode={renderMode}
      mirrorMode={mirrorMode}
      zOrderMediaOverlay={zOrderMediaOverlay}
      {...rest}
    />
  );
}

/**
 * Renders the local camera preview.
 */
export function LocalVideoView({
  uid,
  channelId,
  renderMode = RenderModeType.RenderModeHidden,
  mirrorMode = 1,
  style,
  ...rest
}: VideoViewProps) {
  return (
    <AgoraSurfaceView
      style={[styles.video, style]}
      uid={uid}
      channelId={channelId}
      renderMode={renderMode}
      mirrorMode={mirrorMode}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
});
