# Notification System Implementation Summary

## Features Implemented

### 1. Voltage Zero Alert
- **Trigger**: When meter voltage equals 0
- **Visual Indicators**: 
  - Red border around meter card
  - Red background on meter card
  - Warning icon in meter header
  - Red coloring on voltage parameter
  - Warning icon next to voltage parameter
- **Notifications**: 
  - Alert dialog with "Voltage Alert" title
  - Push notification if permissions granted
  - 30-second cooldown to prevent spam

### 2. Power Factor Alert
- **Trigger**: When power factor < 0.85 (and > 0 to avoid false positives)
- **Visual Indicators**:
  - Same visual treatment as voltage alert
  - Trending-down icon next to power factor parameter
- **Notifications**:
  - Alert dialog with "Power Factor Alert" title
  - Push notification if permissions granted
  - 30-second cooldown to prevent spam

## Files Modified

### 1. `package.json`
- Added `expo-notifications: ~0.20.1` dependency

### 2. `src/services/NotificationService.js` (NEW)
- Handles notification permissions
- Implements cooldown logic to prevent spam
- Provides voltage and power factor alert methods
- Shows both alert dialogs and push notifications

### 3. `src/screens/LiveScreen.js`
- Imported NotificationService
- Enhanced WebSocket message handler to check for alerts
- Updated renderMeterCard with visual alert indicators
- Added alert-specific styling classes
- Integrated alert checking for both voltage and power factor

### 4. `mqttWebSocketBridge.js` (Previously)
- Already supports three MQTT topics (pzem1/all, pzem2/all, pzem3/all)
- Properly routes data with meterId for correct meter assignment

## How It Works

1. **Data Flow**: PZEM Sensors → MQTT Broker → WebSocket Bridge → Mobile App
2. **Alert Detection**: When WebSocket receives data, checks voltage === 0 or powerFactor < 0.85
3. **Visual Feedback**: Updates meter card styling to show red borders and warning icons
4. **Notifications**: Triggers both in-app alerts and system notifications
5. **Spam Prevention**: 30-second cooldown prevents excessive notifications

## Testing

The system is designed to:
- Monitor real-time data from three PZEM meters
- Display appropriate alerts when conditions are met
- Provide both visual and audible feedback
- Prevent notification spam with cooldown timers
- Work on both Android and iOS devices

## Usage

1. Start the application: `npm run dev`
2. Connect to your WiFi network (192.168.43.x)
3. Ensure MQTT broker is running on 192.168.43.109:1883
4. Monitor real-time data with automatic alerts
5. Grant notification permissions for push notifications

## Alert Conditions

- **Voltage Alert**: voltage === 0
- **Power Factor Alert**: 0 < powerFactor < 0.85

The system now provides comprehensive monitoring with both visual indicators and notifications for critical electrical parameters.