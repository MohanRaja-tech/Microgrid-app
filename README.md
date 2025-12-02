# 📱 Energy Monitoring React Native App

Real-time energy monitoring app for PZEM sensors using MQTT and WebSocket bridge.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run on Mobile
```bash
# Option A: Run bridge and app separately
npm run bridge    # Terminal 1: Start WebSocket bridge
npm start         # Terminal 2: Start React Native app

# Option B: Run both together
npm run dev       # Starts both bridge and app concurrently
```

### 3. Connect Mobile Device
- Install **Expo Go** app on your phone
- Scan QR code from terminal
- Navigate to **"Live"** tab to see real-time data

## 📡 How It Works

```
PZEM Sensors → MQTT Broker → WebSocket Bridge → Mobile App
   (pzem1/all)   (192.168.43.109)   (port 8080)     (WiFi)
```

## 🔧 Available Scripts

- `npm start` - Start React Native app
- `npm run bridge` - Start WebSocket bridge server
- `npm run dev` - Start both bridge and app together
- `npm run test-websocket` - Test WebSocket connection
- `npm run tunnel` - Use Expo tunnel (for remote access)

## 📊 Features

- ✅ Real-time monitoring of 3 PZEM energy meters
- ✅ Live voltage, current, power, energy readings
- ✅ WebSocket-based communication
- ✅ Auto-reconnection handling
- ✅ Mobile-responsive UI with bottom tab navigation

## 📱 Mobile Screens

- **Home**: Overview and dashboard
- **Live**: Real-time meter readings ⚡
- **Solar**: Solar energy monitoring
- **Wind**: Wind energy monitoring  
- **Tickets**: Support and tickets

## 🔧 Configuration

- **MQTT Broker**: `192.168.43.109:1883`
- **WebSocket Port**: `8080`
- **Topics**: `pzem1/all`, `pzem2/all`, `pzem3/all`

## 📁 Key Files

- `mqttWebSocketBridge.js` - WebSocket bridge server
- `src/services/WebSocketService.js` - Mobile WebSocket client
- `src/screens/LiveScreen.js` - Real-time data display

For detailed setup instructions, see [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md)

## 🛠️ Dependencies

The following packages are automatically installed with `npm install`:

### Main Dependencies
- `mqtt` - MQTT client for sensor communication
- `ws` - WebSocket server for bridge
- `expo` - React Native framework
- `@react-navigation/native` - Navigation
- `expo-linear-gradient` - UI gradients

### Development Dependencies  
- `concurrently` - Run multiple commands simultaneously

## 🚀 Deployment Options

### Local Development
- Use `npm run dev` to run everything locally
- Mobile connects via local WiFi network

### Production Deployment
- Deploy WebSocket bridge to cloud server (VPS/AWS/Azure)
- Update WebSocket URL in `WebSocketService.js`
- Use secure WebSocket (wss://) for production

## 📞 Support

For detailed mobile deployment instructions and troubleshooting, see:
- [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) - Complete mobile setup guide
- [WEBSOCKET_SETUP.md](WEBSOCKET_SETUP.md) - WebSocket bridge documentation