# Background Execution & Notifications Setup

## Overview
Your Energy Monitoring App now supports **background execution** and **persistent notifications** even when the app is minimized or in the background (Recent Apps).

## What's Been Implemented

### 1. **Background Task Monitoring**
- Uses `expo-background-fetch` to run periodic checks every 15 minutes (iOS minimum)
- Monitors WebSocket connection status and meter data
- Automatically sends notifications for critical conditions

### 2. **Enhanced Notifications**
- Notifications now work when app is:
  - In foreground ✅
  - In background (minimized) ✅
  - Completely closed (Recent Apps) ✅
- Badge count on app icon
- Persistent notifications (Android)
- Sound and visual alerts

### 3. **App State Management**
- Monitors when app goes to background/foreground
- Maintains WebSocket connection
- Reconnects automatically when app returns to foreground

## Files Modified/Created

### New Files
- **`src/services/BackgroundTaskService.js`** - Background task management

### Modified Files
- **`App.js`** - Added background task registration and app state listeners
- **`app.json`** - Added background modes and notification permissions
- **`src/services/NotificationService.js`** - Enhanced with badge counts and persistent notifications
- **`src/screens/LiveScreen.js`** - Integrated with background task service
- **`package.json`** - Already had required packages

## Alert Conditions Monitored

The app monitors and sends notifications for:

1. **⚠️ Voltage Alerts**
   - When voltage drops to 0V
   - When voltage is below 180V

2. **📉 Power Factor Alerts**
   - When power factor < 0.85 (85%)

3. **⚡ Overcurrent Alerts** (NEW)
   - When current exceeds 50A

4. **🔄 Frequency Alerts** (NEW)
   - When frequency is outside 48-52 Hz range

## Configuration

### iOS Settings (app.json)
```json
"ios": {
  "infoPlist": {
    "UIBackgroundModes": ["fetch", "remote-notification"]
  }
}
```

### Android Settings (app.json)
```json
"android": {
  "permissions": [
    "RECEIVE_BOOT_COMPLETED",
    "WAKE_LOCK",
    "FOREGROUND_SERVICE"
  ]
}
```

## How It Works

### When App is in Foreground
- Real-time WebSocket connection active
- Immediate notifications for critical conditions
- Live data updates every second

### When App is in Background (Minimized)
- WebSocket connection maintained
- Background task runs every 15 minutes
- Notifications sent for any critical conditions detected
- Badge count updated on app icon

### When App is Closed (Recent Apps)
- Background task continues to run
- Limited to iOS 15-minute intervals
- Android can use more aggressive background execution
- Notifications still delivered

## Testing Background Execution

### Test Steps:
1. **Start the app** and ensure notifications are enabled
2. **Minimize the app** (don't close completely)
3. **Wait for critical conditions**:
   - Voltage drop to 0V
   - Power factor < 0.85
   - Current > 50A
   - Frequency outside range
4. **Check notification tray** - Should see alerts even though app is in background

### For Development Testing:
```javascript
// In LiveScreen.js or any component
import BackgroundTaskService from '../services/BackgroundTaskService';

// Manually trigger background task (for testing)
await BackgroundTaskService.registerBackgroundFetchAsync();
```

## Notification Management

### Clear All Notifications
```javascript
import NotificationService from './src/services/NotificationService';

// Clear all notifications and reset badge
await NotificationService.clearAllNotifications();
```

### Reset Badge Count
```javascript
await NotificationService.resetBadgeCount();
```

### Get Current Badge Count
```javascript
const count = await NotificationService.getBadgeCount();
console.log('Current badge count:', count);
```

## Important Notes

### iOS Limitations
- Background fetch runs **every 15 minutes minimum** (iOS restriction)
- iOS decides when to run background tasks based on user behavior
- More frequent if user uses app regularly

### Android Advantages
- Can run more frequently than iOS
- Better background execution support
- Foreground service capability

### Battery Optimization
- Background tasks are optimized for battery life
- iOS/Android may throttle background execution if battery is low
- Users can disable background refresh in device settings

## Permissions Required

### iOS
- **Notification Permission** - Requested on first launch
- **Background Fetch** - Configured in app.json

### Android
- **Notification Permission** - Requested on first launch
- **Wake Lock** - Keeps device awake for critical tasks
- **Boot Completed** - Restart background tasks after reboot
- **Foreground Service** - Run services in foreground

## Troubleshooting

### Notifications Not Showing
1. Check notification permissions: Settings > Apps > Energy Monitoring App > Notifications
2. Ensure background refresh is enabled: Settings > General > Background App Refresh (iOS)
3. Check battery optimization settings (Android)

### Background Tasks Not Running
1. Verify in code:
```javascript
const isRegistered = await BackgroundTaskService.isBackgroundTaskRegistered();
console.log('Background task registered:', isRegistered);
```

2. Check Background Fetch status:
```javascript
import * as BackgroundFetch from 'expo-background-fetch';
const status = await BackgroundFetch.getStatusAsync();
console.log('Background fetch status:', status);
```

### WebSocket Disconnecting
- Background tasks maintain connection
- Auto-reconnect when app returns to foreground
- Check network connectivity

## Next Steps

To further enhance background execution:

1. **Add Foreground Service (Android)**
   - For critical monitoring, use a foreground service
   - Shows persistent notification that service is running

2. **Implement Push Notifications**
   - Use Firebase Cloud Messaging (FCM)
   - Backend server can push notifications
   - Works even when app is completely killed

3. **Add Local Database**
   - Cache meter data locally
   - Background tasks can read from local DB
   - Reduces network dependency

## Running the App

### Development Mode
```bash
# Terminal 1 - WebSocket Bridge
npm run bridge

# Terminal 2 - Analytics Server
node analyticsServer.js

# Terminal 3 - Expo App
npm start
```

### Or Run All Together
```bash
npm run dev
```

## Resources

- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native AppState](https://reactnative.dev/docs/appstate)
