import { Client } from '@stomp/stompjs';
import { tokenStorage } from './api';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
    this.pendingCallbacks = [];
  }

  connect(onConnect) {
    if (this.client) {
      if (this.client.connected) {
        if (onConnect) onConnect();
      } else if (onConnect) {
        this.pendingCallbacks.push(onConnect);
      }
      return;
    }

    const token = tokenStorage.get();
    if (!token) return;

    if (onConnect) this.pendingCallbacks.push(onConnect);

    // Use ws:// or wss:// depending on API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const brokerUrl = apiUrl.replace(/^http/, 'ws').replace('/api/v1', '/ws');

    this.client = new Client({
      brokerURL: brokerUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        const callbacks = this.pendingCallbacks.splice(0);
        callbacks.forEach((cb) => {
          try { cb(); } catch (e) { console.error(e); }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketError: (error) => {
        console.error('Error with websocket', error);
      }
    });

    this.client.activate();
  }

  subscribe(destination, callback) {
    if (!this.client || !this.client.connected) {
      console.warn('Cannot subscribe: STOMP client is not connected.');
      return null;
    }

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message) => {
      if (message.body) {
        callback(JSON.parse(message.body));
      }
    });

    this.subscriptions.set(destination, subscription);
    return subscription;
  }

  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.subscriptions.clear();
    this.pendingCallbacks = [];
  }
}

export const socketService = new WebSocketService();
