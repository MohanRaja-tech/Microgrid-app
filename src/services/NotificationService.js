import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.lastNotifications = {
      voltage: {}, // Track last voltage alert for each meter
      powerFactor: {}, // Track last power factor alert for each meter
    };
    this.cooldownTime = 30000; // 30 seconds cooldown between same alerts
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });

      console.log('Notification sent:', title);
    } catch (error) {
      console.error('Error sending notification:', error);
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