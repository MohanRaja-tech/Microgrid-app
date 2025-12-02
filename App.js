import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import LiveScreen from './src/screens/LiveScreen';
import SolarScreen from './src/screens/SolarScreen';
import WindScreen from './src/screens/WindScreen';
import TicketsScreen from './src/screens/TicketsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#1a365d" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Live') {
              iconName = focused ? 'flash' : 'flash-outline';
            } else if (route.name === 'Solar') {
              iconName = focused ? 'sunny' : 'sunny-outline';
            } else if (route.name === 'Wind') {
              iconName = focused ? 'leaf' : 'leaf-outline';
            } else if (route.name === 'Tickets') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3182ce',
          tabBarInactiveTintColor: '#718096',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e2e8f0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: '#1a365d',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Live" component={LiveScreen} />
        <Tab.Screen name="Solar" component={SolarScreen} />
        <Tab.Screen name="Wind" component={WindScreen} />
        <Tab.Screen name="Tickets" component={TicketsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 