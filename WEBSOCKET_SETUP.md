# WebSocket Bridge Setup and Usage Guide

## 🚀 How to Run the Complete Setup

### Step 1: Start the WebSocket Bridge Server
Open your first terminal in the project directory and run:
```bash
node mqttWebSocketBridge.js
```

You should see output like:
```
WebSocket server started on port 8080
MQTT to WebSocket bridge started
MQTT Broker: mqtt://192.168.43.109:1883
MQTT Topic: pzem1/all
Connected to MQTT broker
Subscribed to topic: pzem1/all
```

**Keep this terminal open** - the bridge server must remain running.

### Step 2: Start Your React Native App
Open a second terminal in the project directory and run:
```bash
npm start
```

### Step 3: Navigate to Live Screen
1. Once your app loads, navigate to the **"Live"** tab
2. You should see:
   - **WebSocket: Connected** status indicator
   - Real-time meter data updating automatically
   - Live sensor readings from your MQTT broker

## 📱 What You'll See in the App

### Connection Status Indicator
- 🟢 **Green dot + "Connected"**: Successfully receiving data
- 🔴 **Red dot + "Reconnecting..."**: Attempting to reconnect
- 🔴 **Red dot + "Disconnected"**: No connection

### Real-Time Data Display
The app will show live data for:
- **Voltage** (V)
- **Current** (A) 
- **Power** (W)
- **Energy** (kWh)
- **Power Factor**
- **Frequency** (Hz)
- **Harmonics** (%)

## Overview
This setup uses a WebSocket bridge server that connects to your MQTT broker and forwards the data to your React Native app via WebSocket connections.

## Architecture Flow
```
MQTT Sensors → MQTT Broker → WebSocket Bridge Server → React Native App
```

## How to Run the WebSocket Bridge

### 1. Install Required Dependencies
Make sure you have the WebSocket package installed (you already did this):
```bash
npm install ws
```

### 2. Start the WebSocket Bridge Server
Open a terminal in your project directory and run:
```bash
node mqttWebSocketBridge.js
```

You should see output like:
```
WebSocket server started on port 8080
Connected to MQTT broker
Subscribed to topic: pzem1/all
```

### 3. Run Your React Native App
In another terminal, start your React Native app:
```bash
npm start
```

## Configuration Details

### WebSocket Bridge Server (`mqttWebSocketBridge.js`)
- **WebSocket Port**: 8080
- **MQTT Broker**: `mqtt://192.168.43.109:1883`
- **MQTT Topic**: `pzem1/all`

### React Native App (`WebSocketService.js`)
- **WebSocket URL**: `ws://192.168.43.109:8080`
- **Auto-reconnection**: Yes (up to 5 attempts)
- **Reconnection Interval**: 3 seconds

## Data Flow

1. **MQTT Sensors** publish data to topic `pzem1/all`
2. **WebSocket Bridge** receives MQTT data and forwards it to all connected WebSocket clients
3. **React Native App** receives real-time data via WebSocket and updates the UI

## Message Format

The WebSocket bridge sends messages in this format:
```json
{
  "topic": "pzem1/all",
  "data": {
    "voltage": 230,
    "current": 5.2,
    "power": 1200,
    "energy": 50,
    "powerFactor": 0.95,
    "frequency": 50
  },
  "timestamp": "2025-09-19T10:30:00.000Z"
}
```

## Troubleshooting

### If WebSocket connection fails:
1. Make sure the bridge server is running
2. Check that the IP address `192.168.43.109` is correct
3. Ensure port 8080 is not blocked by firewall

### If MQTT connection fails:
1. Verify the MQTT broker is running at `192.168.43.109:1883`
2. Check network connectivity
3. Ensure the topic `pzem1/all` is correct

### For debugging:
- Check the bridge server console for connection logs
- Check React Native app console for WebSocket messages
- Use network debugging tools to verify WebSocket traffic

## Benefits of WebSocket Bridge Approach

✅ **Separation of Concerns**: MQTT logic is separate from React Native app  
✅ **Multiple Clients**: Multiple React Native instances can connect to the same bridge  
✅ **Reliability**: Auto-reconnection and error handling  
✅ **Real-time**: Low latency data transmission  
✅ **Scalability**: Easy to add more MQTT topics or WebSocket features