import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import WebSocketService from './WebSocketService';

const BACKGROUND_FETCH_TASK = 'energy-monitoring-background-task';

// This will store the last known data state
let lastMeterData = {};

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('Background task running...');

    // Check WebSocket connection status
    if (!WebSocketService.isConnected) {
      console.log('WebSocket disconnected in background, attempting to reconnect...');
      WebSocketService.connect();
    }

    // Monitor for critical conditions
    const criticalConditions = checkCriticalConditions(lastMeterData);
    
    if (criticalConditions.length > 0) {
      // Send notifications for critical conditions
      for (const condition of criticalConditions) {
        await sendBackgroundNotification(condition);
      }
    }

    // Return success status
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Check for critical conditions in meter data
function checkCriticalConditions(meterData) {
  const conditions = [];

  Object.keys(meterData).forEach(meterId => {
    const data = meterData[meterId];
    if (!data) return;

    // Check for voltage drop
    if (data.voltage === 0 || data.voltage < 180) {
      conditions.push({
        type: 'voltage',
        meterId,
        meterName: `Meter ${meterId}`,
        value: data.voltage,
        message: data.voltage === 0 
          ? 'Voltage has dropped to 0V! Check electrical connection.'
          : `Low voltage detected: ${data.voltage}V`,
      });
    }

    // Check for low power factor
    if (data.pf !== undefined && data.pf < 0.85 && data.pf > 0) {
      conditions.push({
        type: 'powerFactor',
        meterId,
        meterName: `Meter ${meterId}`,
        value: data.pf,
        message: `Low Power Factor: ${data.pf} (${Math.round(data.pf * 100)}%)`,
      });
    }

    // Check for overcurrent
    if (data.current > 50) {
      conditions.push({
        type: 'overcurrent',
        meterId,
        meterName: `Meter ${meterId}`,
        value: data.current,
        message: `High current detected: ${data.current}A - Potential overload!`,
      });
    }

    // Check for high frequency deviation
    if (data.frequency && (data.frequency < 48 || data.frequency > 52)) {
      conditions.push({
        type: 'frequency',
        meterId,
        meterName: `Meter ${meterId}`,
        value: data.frequency,
        message: `Frequency out of range: ${data.frequency}Hz (Normal: 50±2Hz)`,
      });
    }
  });

  return conditions;
}

// Send notification in background
async function sendBackgroundNotification(condition) {
  try {
    const titleMap = {
      voltage: '⚠️ Voltage Alert',
      powerFactor: '📉 Power Factor Alert',
      overcurrent: '⚡ Overcurrent Alert',
      frequency: '🔄 Frequency Alert',
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: titleMap[condition.type] || '⚠️ Alert',
        body: `${condition.meterName}: ${condition.message}`,
        data: {
          type: condition.type,
          meterId: condition.meterId,
          value: condition.value,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        badge: 1,
      },
      trigger: null, // Show immediately
    });

    console.log(`Background notification sent: ${condition.type} for ${condition.meterName}`);
  } catch (error) {
    console.error('Error sending background notification:', error);
  }
}

// Update meter data from WebSocket messages
export function updateMeterData(meterId, data) {
  lastMeterData[meterId] = data;
}

// Register the background fetch task
export async function registerBackgroundFetchAsync() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        console.log('Background execution is restricted');
        return false;
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        console.log('Background execution is denied');
        return false;
      default:
        console.log('Background execution is available');
        break;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('Background task already registered');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed by iOS)
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start after device restart (Android)
    });

    console.log('Background fetch task registered successfully');
    return true;
  } catch (error) {
    console.error('Failed to register background task:', error);
    return false;
  }
}

// Unregister the background fetch task
export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch task unregistered');
    return true;
  } catch (error) {
    console.error('Failed to unregister background task:', error);
    return false;
  }
}

// Check if background task is registered
export async function isBackgroundTaskRegistered() {
  return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
}

export default {
  registerBackgroundFetchAsync,
  unregisterBackgroundFetchAsync,
  isBackgroundTaskRegistered,
  updateMeterData,
};
