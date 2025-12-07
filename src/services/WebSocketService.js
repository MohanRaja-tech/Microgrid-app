class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageListeners = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
    // WebSocket bridge runs on this PC (100.125.43.74), not on database server
    this.PRIMARY_WS_URL = 'ws://100.125.43.74:8080';  // This PC Tailscale IP
    //this.FALLBACK_WS_URL = 'ws://192.168.43.205:8080'; // Local Wi-Fi fallback
    this.FALLBACK_WS_URL = 'ws://10.206.140.68:8080'; // Local Wi-Fi fallback
    this.currentUrl = this.PRIMARY_WS_URL;
  }

  connect(url) {
    // Use provided URL or try current URL (primary or fallback)
    const wsUrl = url || this.currentUrl;
    
    try {
      console.log(`Attempting WebSocket connection to ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`WebSocket connected to ${wsUrl}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.currentUrl = wsUrl; // Remember successful URL
        this.notifyConnectionStatus('Connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Notify all listeners
          this.messageListeners.forEach(callback => {
            callback(message);
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.notifyConnectionStatus('Disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`WebSocket error on ${wsUrl}:`, error);
        this.isConnected = false;
        
        // Try fallback if primary failed and not manually provided URL
        if (wsUrl === this.PRIMARY_WS_URL && !url) {
          console.log('Primary WebSocket failed, trying fallback...');
          this.currentUrl = this.FALLBACK_WS_URL;
          setTimeout(() => this.connect(), 1000);
        } else {
          this.notifyConnectionStatus('Error');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyConnectionStatus('Failed to Connect');
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.notifyConnectionStatus('Reconnecting...');
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached');
      this.notifyConnectionStatus('Connection Failed');
    }
  }

  addMessageListener(callback) {
    this.messageListeners.push(callback);
  }

  removeMessageListener(callback) {
    const index = this.messageListeners.indexOf(callback);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  notifyConnectionStatus(status) {
    // This will be used to notify components about connection status changes
    this.connectionStatusListeners = this.connectionStatusListeners || [];
    this.connectionStatusListeners.forEach(callback => callback(status));
  }

  addConnectionStatusListener(callback) {
    this.connectionStatusListeners = this.connectionStatusListeners || [];
    this.connectionStatusListeners.push(callback);
  }

  removeConnectionStatusListener(callback) {
    if (this.connectionStatusListeners) {
      const index = this.connectionStatusListeners.indexOf(callback);
      if (index > -1) {
        this.connectionStatusListeners.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.messageListeners = [];
      this.connectionStatusListeners = [];
    }
  }

  send(data) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected');
    }
  }
}

// Export singleton instance
export default new WebSocketService();