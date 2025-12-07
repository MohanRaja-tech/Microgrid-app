import React, { useEffect, useRef, Component } from 'react';
import { View, Text, StyleSheet, Platform, LogBox, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

// Disable all LogBox notifications (yellow boxes and red boxes in development)
LogBox.ignoreAllLogs(true);

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>Please restart the app</Text>
          <Text style={styles.errorDetails}>{this.state.error?.toString()}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import SolarScreen from './src/screens/SolarScreen';
import WindScreen from './src/screens/WindScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import BackgroundTaskService from './src/services/BackgroundTaskService';
import NotificationService from './src/services/NotificationService';
import WebSocketService from './src/services/WebSocketService';

// Configure notifications to show even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ focused, iconName, color, gradientColors }) => {
  if (focused) {
    return (
      <View style={styles.activeIconContainer}>
        <LinearGradient
          colors={gradientColors}
          style={styles.activeIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={iconName} size={22} color="#ffffff" />
        </LinearGradient>
      </View>
    );
  }
  return <Ionicons name={iconName + '-outline'} size={24} color={color} />;
};

function MainApp() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize services with error handling
    const initializeApp = async () => {
      try {
        // Initialize notification service
        await NotificationService.initialize();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }

      try {
        // Register background fetch task
        await BackgroundTaskService.registerBackgroundFetchAsync();
      } catch (error) {
        console.error('Failed to register background task:', error);
      }

      try {
        // Keep WebSocket connection alive
        WebSocketService.connect();
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    initializeApp();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
        // Reconnect WebSocket when app comes to foreground
        if (!WebSocketService.isConnected) {
          WebSocketService.connect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App has gone to the background!');
        // Keep WebSocket connection alive in background
      }

      appState.current = nextAppState;
    });

    // Handle notification responses (when user taps on notification)
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;
        // You can navigate to specific screen based on notification data
        if (data.type === 'voltage_alert' || data.type === 'powerFactor') {
          // Navigate to Live screen
          console.log('Navigate to Live screen for meter:', data.meterId);
        }
      }
    );

    return () => {
      subscription.remove();
      notificationResponseSubscription.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName;
            let gradientColors;

            if (route.name === 'Home') {
              iconName = 'home';
              gradientColors = ['#6366f1', '#8b5cf6'];
            } else if (route.name === 'Live') {
              iconName = 'pulse';
              gradientColors = ['#10b981', '#34d399'];
            } else if (route.name === 'Solar') {
              iconName = 'sunny';
              gradientColors = ['#f59e0b', '#fbbf24'];
            } else if (route.name === 'Wind') {
              iconName = 'leaf';
              gradientColors = ['#06b6d4', '#22d3ee'];
            } else if (route.name === 'Analytics') {
              iconName = 'analytics';
              gradientColors = ['#8b5cf6', '#a78bfa'];
            } else if (route.name === 'AI Chat') {
              iconName = 'chatbubble-ellipses';
              gradientColors = ['#06b6d4', '#22d3ee'];
            } else if (route.name === 'Tickets') {
              iconName = 'receipt';
              gradientColors = ['#ec4899', '#f472b6'];
            }

            return (
              <TabIcon
                focused={focused}
                iconName={iconName}
                color={color}
                gradientColors={gradientColors}
              />
            );
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Live" component={LiveScreen} />
        <Tab.Screen name="Solar" component={SolarScreen} />
        <Tab.Screen name="Wind" component={WindScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="AI Chat" component={AIChatScreen} />
        <Tab.Screen name="Tickets" component={TicketsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Export wrapped app with error boundary
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f1f5f9',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
}); 