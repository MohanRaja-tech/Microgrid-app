import React from 'react';
import { View, StyleSheet, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

// Disable all LogBox notifications (yellow boxes and red boxes in development)
LogBox.ignoreAllLogs(true);

import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import SolarScreen from './src/screens/SolarScreen';
import WindScreen from './src/screens/WindScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AIChatScreen from './src/screens/AIChatScreen';

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

export default function App() {
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
}); 