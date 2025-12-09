import { config } from '@/config/api.config';
import { TokenManager } from '@/utils/storage';

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: any) => void;

interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionallyClosed = false;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private isConnecting = false;

  connect(config: WebSocketConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('[WebSocket] Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('[WebSocket] Connection already in progress');
        return;
      }

      this.config = {
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        ...config,
      };
      this.intentionallyClosed = false;
      this.isConnecting = true;

      try {
        console.log('[WebSocket] Connecting to:', config.url);
        this.ws = new WebSocket(config.url, config.protocols);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach(handler => {
            try {
              handler();
            } catch (e) {
              console.error('[WebSocket] Error in connection handler:', e);
            }
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Message received:', data);
            this.messageHandlers.forEach(handler => {
              try {
                handler(data);
              } catch (e) {
                console.error('[WebSocket] Error in message handler:', e);
              }
            });
          } catch (e) {
            console.error('[WebSocket] Error parsing message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => {
            try {
              handler(error);
            } catch (e) {
              console.error('[WebSocket] Error in error handler:', e);
            }
          });
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;

          this.disconnectionHandlers.forEach(handler => {
            try {
              handler();
            } catch (e) {
              console.error('[WebSocket] Error in disconnection handler:', e);
            }
          });

          if (!this.intentionallyClosed && this.config) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (!this.config) return;
    
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.config && !this.intentionallyClosed) {
        this.connect(this.config).catch(e => {
          console.error('[WebSocket] Reconnect failed:', e);
        });
      }
    }, this.config.reconnectInterval);
  }

  disconnect() {
    console.log('[WebSocket] Disconnecting');
    this.intentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect');
      } catch (e) {
        console.error('[WebSocket] Error closing connection:', e);
      }
      this.ws = null;
    }

    this.isConnecting = false;
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send - not connected');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (e) {
      console.error('[WebSocket] Error sending message:', e);
      return false;
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

// Chat-specific WebSocket service
class ChatWebSocketService {
  private wsService: WebSocketService = new WebSocketService();
  private currentChatId: string | null = null;

  async connectToChatRoom(chatId: string): Promise<void> {
    try {
      if (this.currentChatId === chatId && this.wsService.isConnected()) {
        console.log('[ChatWS] Already connected to this chat room');
        return;
      }

      // Disconnect from previous room if any
      if (this.currentChatId && this.currentChatId !== chatId) {
        try {
          this.disconnect();
        } catch (e) {
          console.warn('[ChatWS] Error disconnecting from previous room:', e);
        }
      }

      this.currentChatId = chatId;

      // Get auth token
      const token = await TokenManager.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build WebSocket URL from API base URL
      const wsUrl = config.api.baseURL.replace(/^http/, 'ws') + `/ws/chat/${chatId}?token=${token}`;

      console.log('[ChatWS] Connecting to chat room:', chatId);
      await this.wsService.connect({ url: wsUrl });
    } catch (error) {
      console.error('[ChatWS] Failed to connect to chat room:', error);
      this.currentChatId = null;
      throw error;
    }
  }

  disconnect() {
    try {
      console.log('[ChatWS] Disconnecting from chat room:', this.currentChatId);
      this.wsService.disconnect();
      this.currentChatId = null;
    } catch (error) {
      console.error('[ChatWS] Error during disconnect:', error);
      // Still reset state even if disconnect fails
      this.currentChatId = null;
    }
  }

  sendMessage(message: any) {
    return this.wsService.send(message);
  }

  onMessage(handler: MessageHandler) {
    return this.wsService.onMessage(handler);
  }

  onConnect(handler: ConnectionHandler) {
    return this.wsService.onConnect(handler);
  }

  onDisconnect(handler: ConnectionHandler) {
    return this.wsService.onDisconnect(handler);
  }

  onError(handler: ErrorHandler) {
    return this.wsService.onError(handler);
  }

  isConnected(): boolean {
    return this.wsService.isConnected();
  }

  getCurrentChatId(): string | null {
    return this.currentChatId;
  }
}

export const chatWebSocket = new ChatWebSocketService();
export const webSocketService = new WebSocketService();
