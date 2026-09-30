import { Platform } from 'react-native';
import {
  createAgoraRtcEngine,
  type RtcStats,
  type RemoteVideoState,
  type RemoteAudioState,
  ClientRoleType,
  ChannelProfileType,
  VideoCodecType,
  RenderModeType,
  AudioProfileType,
  AudioScenarioType,
  type IRtcEngine,
  type IRtcEngineEventHandler,
  type UserOfflineReasonType,
  type RemoteVideoStateReason,
  type RemoteAudioStateReason,
  type AudioVolumeInfo,
} from 'react-native-agora';
import { env } from '@/config/env';

/**
 * Agora call service — wraps the native SDK in a typed, event-driven API.
 */

export type CallEvents = {
  connectionStateChanged: [state: number, reason: number];
  userJoined: [uid: number, elapsed: number];
  userOffline: [uid: number, reason: UserOfflineReasonType];
  networkQuality: [txQuality: number, rxQuality: number];
  audioVolumeIndication: [speakers: AudioVolumeInfo[], totalVolume: number];
  error: [err: number, msg: string];
  localVideoStateChanged: [state: number, error: number];
  remoteVideoStateChanged: [uid: number, state: RemoteVideoState, reason: RemoteVideoStateReason, elapsed: number];
  remoteAudioStateChanged: [uid: number, state: RemoteAudioState, reason: RemoteAudioStateReason, elapsed: number];
  localAudioStateChanged: [state: number, error: number];
  callEnded: [];
};

export type CallService = {
  join: (channel: string, token: string | null, uid: number) => Promise<void>;
  leave: () => Promise<void>;
  muteAudio: (muted: boolean) => void;
  muteVideo: (muted: boolean) => void;
  switchCamera: () => void;
  setSpeakerEnabled: (enabled: boolean) => void;
  startPreview: () => void;
  stopPreview: () => void;
  isConnected: () => boolean;
  on: <K extends keyof CallEvents>(event: K, listener: (...args: CallEvents[K]) => void) => void;
  off: <K extends keyof CallEvents>(event: K, listener: (...args: CallEvents[K]) => void) => void;
  destroy: () => void;
};

// Simple event emitter that works without @types/node
type Listener = (...args: any[]) => void;

class SimpleEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((listener) => listener(...args));
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

const emitter = new SimpleEmitter();

let engine: IRtcEngine | null = null;
let isConnectedFlag = false;

function getEngine(): IRtcEngine {
  if (engine == null) {
    engine = createAgoraRtcEngine();
    engine.initialize({
      appId: env.AGORA_APP_ID ?? '',
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      audioScenario: AudioScenarioType.AudioScenarioGameStreaming,
    });
    engine.enableVideo();
    engine.setAudioProfile(
      AudioProfileType.AudioProfileSpeechStandard,
      AudioScenarioType.AudioScenarioGameStreaming
    );
    engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
  }
  return engine;
}

const handler: IRtcEngineEventHandler = {
  onConnectionStateChanged(_connection, state, reason) {
    isConnectedFlag = state === 3;
    emitter.emit('connectionStateChanged', state, reason);
  },
  onUserJoined(_connection, remoteUid, elapsed) {
    emitter.emit('userJoined', remoteUid, elapsed);
  },
  onUserOffline(_connection, remoteUid, reason) {
    emitter.emit('userOffline', remoteUid, reason);
  },
  onNetworkQuality(_connection, remoteUid, txQuality, rxQuality) {
    emitter.emit('networkQuality', txQuality, rxQuality);
  },
  onAudioVolumeIndication(_connection, speakers, totalVolume) {
    emitter.emit('audioVolumeIndication', speakers, totalVolume);
  },
  onError(err, msg) {
    emitter.emit('error', err, msg ?? '');
  },
  onLocalVideoStateChanged(_source, state, error) {
    emitter.emit('localVideoStateChanged', state, error);
  },
  onRemoteVideoStateChanged(_connection, remoteUid, state, reason, elapsed) {
    emitter.emit('remoteVideoStateChanged', remoteUid, state, reason, elapsed);
  },
  onRemoteAudioStateChanged(_connection, remoteUid, state, reason, elapsed) {
    emitter.emit('remoteAudioStateChanged', remoteUid, state, reason, elapsed);
  },
  onLocalAudioStateChanged(_state, error) {
    emitter.emit('localAudioStateChanged', _state, error);
  },
};

export function createCallService(): CallService {
  const eng = getEngine();
  eng.registerEventHandler(handler);

  return {
    async join(channel, token, uid) {
      await eng.joinChannel(token ?? '', channel, uid, {
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
        publishCameraTrack: true,
        publishMicrophoneTrack: true,
      });
    },

    async leave() {
      await eng.leaveChannel();
      isConnectedFlag = false;
      emitter.emit('callEnded');
    },

    muteAudio(muted) {
      eng.muteLocalAudioStream(muted);
    },

    muteVideo(muted) {
      eng.muteLocalVideoStream(muted);
    },

    switchCamera() {
      eng.switchCamera();
    },

    setSpeakerEnabled(enabled) {
      if (Platform.OS === 'android') {
        eng.setEnableSpeakerphone(enabled);
      }
    },

    startPreview() {
      eng.startPreview();
    },

    stopPreview() {
      eng.stopPreview();
    },

    isConnected() {
      return isConnectedFlag;
    },

    on(event, listener) {
      emitter.on(event, listener);
    },

    off(event, listener) {
      emitter.off(event, listener);
    },

    destroy() {
      eng.unregisterEventHandler(handler);
      eng.release();
      engine = null;
      isConnectedFlag = false;
      emitter.removeAllListeners();
    },
  };
}

export { RenderModeType, VideoCodecType };
