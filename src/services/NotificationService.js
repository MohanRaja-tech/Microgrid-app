import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification behavior - shows notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Show badge count on app icon
  }),
});

class NotificationService {
  constructor() {
    this.lastNotifications = {
      voltage: {}, // Track last voltage alert for each meter
      powerFactor: {}, // Track last power factor alert for each meter
      overcurrent: {}, // Track overcurrent alerts
      frequency: {}, // Track frequency alerts
    };
    this.cooldownTime = 30000; // 30 seconds cooldown between same alerts
    this.notificationCount = 0; // Track total notification count for badge
  }

  async initialize() {
    // Request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    console.log('Notification permissions granted');
    return true;
  }

  async showVoltageAlert(meterId, meterName) {
    const now = Date.now();
    const lastAlert = this.lastNotifications.voltage[meterId];

    // Check cooldown period
    if (lastAlert && (now - lastAlert) < this.cooldownTime) {
      return; // Skip if within cooldown period
    }

    this.lastNotifications.voltage[meterId] = now;

    // Show notification
    await this.sendNotification(
      '⚠️ Voltage Alert',
      `${meterName}: Voltage has dropped to 0V! Check electrical connection.`,
      {
        type: 'voltage_alert',
        meterId: meterId,
        meterName: meterName,
      }
    );

    // Also show in-app alert for immediate attention
    Alert.alert(
      '⚠️ Voltage Alert',
      `${meterName}: Voltage has dropped to 0V!\n\nThis may indicate:\n• Power outage\n• Disconnected cables\n• Circuit breaker tripped\n\nPlease check the electrical connection immediately.`,
      [{ text: 'OK', style: 'default' }]
    );
  }

  async showPowerFactorAlert(meterId, meterName, powerFactor) {
    const now = Date.now();
    const lastAlert = this.lastNotifications.powerFactor[meterId];

    // Check cooldown period
    if (lastAlert && (now - lastAlert) < this.cooldownTime) {
      return; // Skip if within cooldown period
    }

    this.lastNotifications.powerFactor[meterId] = now;

    const pfPercentage = Math.round(powerFactor * 100);

    // Show notification
    await this.sendNotification(
      '📉 Low Power Factor Alert',
      `${meterName}: Power Factor is ${powerFactor} (${pfPercentage}%) - Below optimal range!`,
      {
        type: 'power_factor_alert',
        meterId: meterId,
        meterName: meterName,
        powerFactor: powerFactor,
      }
    );

    // Also show in-app alert
    Alert.alert(
      '📉 Low Power Factor Alert',
      `${meterName}: Power Factor is ${powerFactor} (${pfPercentage}%)\n\nOptimal range: ≥ 0.85 (85%)\n\nLow power factor may cause:\n• Higher electricity bills\n• Equipment inefficiency\n• Voltage drops\n\nConsider installing power factor correction equipment.`,
      [{ text: 'OK', style: 'default' }]
    );
  }

  async sendNotification(title, body, data = {}) {
    try {
      this.notificationCount++;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: this.notificationCount, // Update badge count
          sticky: true, // Make notification persistent on Android
          autoDismiss: false, // Don't auto-dismiss
        },
        trigger: null, // Show immediately
      });

      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      this.notificationCount = 0;
      await Notifications.setBadgeCountAsync(0);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Reset badge count
  async resetBadgeCount() {
    try {
      this.notificationCount = 0;
      await Notifications.setBadgeCountAsync(0);
      console.log('Badge count reset');
    } catch (error) {
      console.error('Error resetting badge count:', error);
    }
  }

  // Method to clear notification history (for testing)
  clearNotificationHistory() {
    this.lastNotifications = {
      voltage: {},
      powerFactor: {},
    };
  }

  // Method to check if notifications are enabled
  async areNotificationsEnabled() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export default new NotificationService();