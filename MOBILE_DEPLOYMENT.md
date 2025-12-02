# 📱 Mobile Deployment Guide

## 🚀 How to Run the Energy Monitoring App on Mobile

### 📋 Prerequisites
- Node.js installed on your computer
- Expo CLI installed (`npm install -g expo-cli`)
- Expo Go app installed on your mobile device
- Your computer and mobile device on the same WiFi network

### 🔧 Setup Steps

#### Step 1: Install Dependencies
```bash
cd "SIH app"
npm install
```
This will automatically install:
- ✅ `mqtt` - For MQTT broker communication
- ✅ `ws` - For WebSocket server
- ✅ All React Native dependencies

#### Step 2: Configure Network Settings
1. **Find your computer's IP address:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
   Look for your local IP (e.g., `192.168.43.205`)

2. **Update WebSocket Service** (if needed):
   - File: `src/services/WebSocketService.js`
   - Make sure it connects to your computer's IP: `ws://YOUR_IP:8080`

#### Step 3: Start the WebSocket Bridge Server
```bash
# Terminal 1: Start the bridge server
node mqttWebSocketBridge.js
```
You should see:
```
WebSocket server started on port 8080 (all interfaces)
Connected to MQTT broker
Subscribed to topic: pzem1/all
Subscribed to topic: pzem2/all  
Subscribed to topic: pzem3/all
```

#### Step 4: Start the React Native App
```bash
# Terminal 2: Start the mobile app
npm start
```

#### Step 5: Connect Your Mobile Device
1. **Scan QR Code**: Use Expo Go app to scan the QR code displayed in terminal
2. **Or Enter URL**: Manually enter the URL shown in terminal

### 📡 Network Architecture

```
MQTT Sensors → MQTT Broker → WebSocket Bridge (Computer) → Mobile App
   (pzem1/all)   (192.168.43.109)     (192.168.43.205:8080)    (WiFi)
```

### 🔒 Firewall Configuration

**Windows Firewall:**
```bash
# Allow Node.js through Windows Firewall
# Go to: Windows Security → Firewall → Allow an app through firewall
# Add: Node.js (for port 8080)
```

**Or manually allow port 8080:**
```bash
netsh advfirewall firewall add rule name="WebSocket Bridge" dir=in action=allow protocol=TCP localport=8080
```

### 📱 Mobile Testing Steps

1. **Open Expo Go** on your mobile device
2. **Scan QR code** from terminal
3. **Navigate to "Live" tab** in the app
4. **Check connection status**: Should show "WebSocket: Connected"
5. **Verify real-time data**: All three meters should show live data

### 🔍 Troubleshooting

#### WebSocket Connection Issues:
```bash
# Test WebSocket connection from computer
node testWebSocket.js
```

#### Mobile Can't Connect:
1. **Check WiFi**: Ensure mobile and computer are on same network
2. **Check IP Address**: Verify computer's IP in WebSocketService.js
3. **Check Firewall**: Allow port 8080 through firewall
4. **Restart Bridge**: Stop and restart `mqttWebSocketBridge.js`

#### No Real-time Data:
1. **Check MQTT Broker**: Ensure `192.168.43.109:1883` is accessible
2. **Check Topics**: Verify `pzem1/all`, `pzem2/all`, `pzem3/all` are publishing
3. **Check Bridge Logs**: Look for "Received MQTT data" messages

### 📊 Expected Mobile Experience

**Live Screen Display:**
- 🟢 **Connection Status**: "WebSocket: Connected"
- 📊 **Meter 1**: Real-time data from `pzem1/all`
- 📊 **Meter 2**: Real-time data from `pzem2/all`  
- 📊 **Meter 3**: Real-time data from `pzem3/all`
- 📊 **Meter 4**: Static fallback data

**Real-time Updates:**
- Voltage, Current, Power values updating every few seconds
- Status indicators showing "Online" for active meters
- Smooth UI with pull-to-refresh functionality

### 🚀 Production Deployment

For production deployment, consider:

1. **VPS/Cloud Server**: Deploy WebSocket bridge on cloud server
2. **Domain/SSL**: Use secure WebSocket (`wss://`) for production
3. **Load Balancing**: Handle multiple mobile clients
4. **Authentication**: Add user authentication for security

### 📂 File Structure Summary
```
SIH app/
├── mqttWebSocketBridge.js     # Bridge server (run on computer)
├── testWebSocket.js           # Testing tool
├── package.json              # Dependencies (mqtt, ws included)
├── src/
│   ├── services/
│   │   └── WebSocketService.js # Mobile WebSocket client
│   └── screens/
│       └── LiveScreen.js      # Mobile UI for real-time data
└── WEBSOCKET_SETUP.md        # Setup documentation
```

### 🎯 Quick Start Commands
```bash
# Terminal 1: Start bridge server
node mqttWebSocketBridge.js

# Terminal 2: Start mobile app  
npm start

# Terminal 3: Test connection (optional)
node testWebSocket.js
```

Your mobile app will now display real-time energy monitoring data from all three PZEM sensors! 📱⚡