import { SyncAction, SyncMessage, PairingData, ConnectionStatus } from '../../types/sync.types';
import { deserializeMessage, serializeMessage, createPong } from './syncProtocol';
import { useSyncStore } from '../../store/useSyncStore';
import { useQueueStore } from '../../store/useQueueStore';
import { APP_CONFIG } from '../../constants/config';

// LAN Sync Manager - handles WebSocket communication between devices
// Uses a simple polling-based approach for React Native compatibility

type MessageHandler = (message: SyncMessage) => void;

class LANSyncManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<SyncAction, MessageHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private deviceId: string = '';

  setDeviceId(id: string): void {
    this.deviceId = id;
  }

  // Connect to a paired device (assistant connects to doctor)
  connect(ipAddress: string, port: number): void {
    const url = `ws://${ipAddress}:${port}`;
    useSyncStore.getState().setConnectionStatus(ConnectionStatus.CONNECTING);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        useSyncStore.getState().setConnectionStatus(ConnectionStatus.CONNECTED);
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        const message = deserializeMessage(event.data as string);
        if (message) {
          this.handleMessage(message);
        }
      };

      this.ws.onclose = () => {
        useSyncStore.getState().setConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.stopPingLoop();
        this.scheduleReconnect(ipAddress, port);
      };

      this.ws.onerror = () => {
        useSyncStore.getState().setConnectionStatus(ConnectionStatus.ERROR);
      };
    } catch {
      useSyncStore.getState().setConnectionStatus(ConnectionStatus.ERROR);
    }
  }

  disconnect(): void {
    this.stopPingLoop();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useSyncStore.getState().disconnect();
  }

  send(message: SyncMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(serializeMessage(message));
    }
  }

  on(action: SyncAction, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(action) || [];
    handlers.push(handler);
    this.messageHandlers.set(action, handlers);
  }

  off(action: SyncAction, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(action) || [];
    this.messageHandlers.set(
      action,
      handlers.filter((h) => h !== handler)
    );
  }

  private handleMessage(message: SyncMessage): void {
    // Auto-respond to pings
    if (message.action === SyncAction.PING) {
      this.send(createPong(this.deviceId));
      return;
    }

    // Update sync timestamp
    if (message.action === SyncAction.PONG) {
      useSyncStore.getState().updateLastSync();
      return;
    }

    // Handle queue updates
    if (message.action === SyncAction.QUEUE_UPDATE) {
      useQueueStore.getState().loadQueue();
    }

    // Handle doctor status
    if (message.action === SyncAction.DOCTOR_STATUS) {
      const payload = message.payload as { isReady: boolean };
      useQueueStore.getState().setDoctorReady(payload.isReady);
    }

    // Dispatch to registered handlers
    const handlers = this.messageHandlers.get(message.action) || [];
    for (const handler of handlers) {
      handler(message);
    }
  }

  private startPingLoop(): void {
    this.pingTimer = setInterval(() => {
      this.send({
        id: Date.now().toString(),
        action: SyncAction.PING,
        payload: {},
        senderId: this.deviceId,
        timestamp: new Date().toISOString(),
      });
    }, APP_CONFIG.sync.pingInterval);
  }

  private stopPingLoop(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(ip: string, port: number): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(ip, port);
    }, APP_CONFIG.sync.reconnectDelay);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const lanSync = new LANSyncManager();
