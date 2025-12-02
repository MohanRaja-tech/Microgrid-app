import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService from '../services/WebSocketService';
import NotificationService from '../services/NotificationService';

const LiveScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(0);
  const [meterRealTimeData, setMeterRealTimeData] = useState({
    1: null, // Data for Meter 1 (pzem1/all)
    2: null, // Data for Meter 2 (pzem2/all)
    3: null, // Data for Meter 3 (pzem3/all)
  });
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  // Initialize WebSocket connection and subscribe to data
  useEffect(() => {
    // Initialize notification service
    NotificationService.initialize();

    // Connect to WebSocket server
    WebSocketService.connect();
    setConnectionStatus('Connecting...');

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (message) => {
      console.log('Received WebSocket message:', message);
      
      // Extract the actual sensor data and meter ID from the message
      if (message.data && message.meterId) {
        const meterData = message.data;
        const meterId = message.meterId;
        const meterName = `Meter ${meterId}`;

        // Check for voltage alerts (voltage = 0)
        if (meterData.voltage === 0) {
          NotificationService.showVoltageAlert(meterId, meterName);
        }

        // Check for power factor alerts (pf < 0.85)
        if (meterData.pf !== undefined && meterData.pf < 0.85 && meterData.pf > 0) {
          NotificationService.showPowerFactorAlert(meterId, meterName, meterData.pf);
        }

        // Update state with new data
        setMeterRealTimeData(prevData => ({
          ...prevData,
          [meterId]: meterData
        }));
      }
    };

    // Handle connection status changes
    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
    };

    // Add listeners
    WebSocketService.addMessageListener(handleWebSocketMessage);
    WebSocketService.addConnectionStatusListener(handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      WebSocketService.removeMessageListener(handleWebSocketMessage);
      WebSocketService.removeConnectionStatusListener(handleConnectionStatus);
    };
  }, []);

  // Sample data for fallback when no real data is available
  const metersData = [
    {
      id: 1,
      name: 'Meter 1',
      voltage: 230,
      current: 5.2,
      power: 1200,
      instEnergy: 0.1,
      energy: 50,
      powerFactor: 0.95,
      frequency: 50,
      harmonics: 3.2,
      status: 'Offline',
    },
    {
      id: 2,
      name: 'Meter 2',
      voltage: 225,
      current: 4.8,
      power: 1080,
      instEnergy: 0.1,
      energy: 45,
      powerFactor: 0.92,
      frequency: 50.2,
      harmonics: 2.8,
      status: 'Offline',
    },
    {
      id: 3,
      name: 'Meter 3',
      voltage: 235,
      current: 6.1,
      power: 1435,
      instEnergy: 0.1,
      energy: 62,
      powerFactor: 0.97,
      frequency: 49.8,
      harmonics: 3.5,
      status: 'Offline',
    },
    {
      id: 4,
      name: 'Meter 4',
      voltage: 228,
      current: 5.5,
      power: 1254,
      instEnergy: 0.1,
      energy: 55,
      powerFactor: 0.94,
      frequency: 50.1,
      harmonics: 3.0,
      status: 'Offline',
    },
  ];

  // Function to get current meter data (real-time or fallback)
  const getCurrentMeterData = () => {
    const updatedMetersData = [...metersData];
    
    // Update each meter with its corresponding real-time data
    updatedMetersData.forEach((meter, index) => {
      const meterId = meter.id; // Using meter.id (1, 2, 3, 4)
      const realTimeData = meterRealTimeData[meterId];
      
      if (realTimeData) {
        updatedMetersData[index] = {
          ...updatedMetersData[index],
          voltage: realTimeData.voltage !== undefined ? realTimeData.voltage : updatedMetersData[index].voltage,
          current: realTimeData.current !== undefined ? realTimeData.current : updatedMetersData[index].current,
          power: realTimeData.power !== undefined ? realTimeData.power : updatedMetersData[index].power,
          energy: realTimeData.energy !== undefined ? realTimeData.energy : updatedMetersData[index].energy,
          powerFactor: realTimeData.pf !== undefined ? realTimeData.pf : updatedMetersData[index].powerFactor,
          frequency: realTimeData.freq !== undefined ? realTimeData.freq : updatedMetersData[index].frequency,
          harmonics: realTimeData.thd !== undefined ? realTimeData.thd : updatedMetersData[index].harmonics,
          status: 'Online', // Since we're receiving data
        };
      }
    });
    
    return updatedMetersData;
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Force reconnection to WebSocket if needed
    if (connectionStatus !== 'Connected') {
      WebSocketService.connect();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getParameterIcon = (parameter) => {
    const icons = {
      voltage: 'flash',
      current: 'trending-up',
      power: 'speedometer',
      instEnergy: 'battery-charging',
      energy: 'battery-charging',
      powerFactor: 'analytics',
      frequency: 'pulse',
      harmonics: 'radio',
    };
    return icons[parameter] || 'information-circle';
  };

  const getParameterColor = (parameter) => {
    const colors = {
      voltage: '#3b82f6',
      current: '#10b981',
      power: '#f59e0b',
      instEnergy: '#8b5cf6',
      energy: '#8b5cf6',
      powerFactor: '#ef4444',
      frequency: '#06b6d4',
      harmonics: '#f97316',
    };
    return colors[parameter] || '#6b7280';
  };

  const renderMeterCard = (meter) => {
    // Check for alerts
    const hasVoltageAlert = meter.voltage === 0;
    const hasPowerFactorAlert = meter.powerFactor < 0.85 && meter.powerFactor > 0;
    const hasAnyAlert = hasVoltageAlert || hasPowerFactorAlert;

    const parameters = [
      { 
        key: 'voltage', 
        label: 'Voltage', 
        value: `${meter.voltage} V`, 
        unit: 'V',
        hasAlert: hasVoltageAlert,
        alertIcon: 'warning'
      },
      { key: 'current', label: 'Current', value: `${meter.current} A`, unit: 'A' },
      { key: 'power', label: 'Power', value: `${meter.power} W`, unit: 'W' },
      { key: 'instEnergy', label: 'Instantaneous Energy', value: `${meter.instEnergy} kWh`, unit: 'kWh' },
      { key: 'energy', label: 'Energy', value: `${meter.energy} kWh`, unit: 'kWh' },
      { 
        key: 'powerFactor', 
        label: 'Power Factor', 
        value: meter.powerFactor.toString(), 
        unit: '',
        hasAlert: hasPowerFactorAlert,
        alertIcon: 'trending-down'
      },
      { key: 'frequency', label: 'Frequency', value: `${meter.frequency} Hz`, unit: 'Hz' },
      { key: 'harmonics', label: 'Harmonics', value: `${meter.harmonics} %`, unit: '%' },
    ];

    return (
      <View key={meter.id} style={[
        styles.meterCard,
        hasAnyAlert && styles.meterCardAlert
      ]}>
        <View style={styles.meterHeader}>
          <View style={styles.meterTitleContainer}>
            <Ionicons name="speedometer-outline" size={24} color="#1a365d" />
            <Text style={styles.meterTitle}>{meter.name}</Text>
            {hasAnyAlert && (
              <View style={styles.alertBadge}>
                <Ionicons name="warning" size={16} color="#fff" />
              </View>
            )}
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: meter.status === 'Online' ? '#10b981' : '#ef4444' }
          ]}>
            <Text style={styles.statusText}>{meter.status}</Text>
          </View>
        </View>

        <View style={styles.parametersGrid}>
          {parameters.map((param, index) => (
            <View key={index} style={[
              styles.parameterCard,
              param.hasAlert && styles.parameterCardAlert
            ]}>
              <View style={styles.parameterHeader}>
                <Ionicons
                  name={getParameterIcon(param.key)}
                  size={20}
                  color={param.hasAlert ? '#ef4444' : getParameterColor(param.key)}
                />
                <Text style={[
                  styles.parameterLabel,
                  param.hasAlert && styles.parameterLabelAlert
                ]}>{param.label}</Text>
                {param.hasAlert && (
                  <Ionicons name={param.alertIcon} size={16} color="#ef4444" />
                )}
              </View>
              <Text style={[
                styles.parameterValue, 
                { color: param.hasAlert ? '#ef4444' : getParameterColor(param.key) }
              ]}>
                {param.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a365d', '#2d3748']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Live Meter Readings</Text>
        <Text style={styles.headerSubtitle}>Real-time energy monitoring</Text>
        
        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View style={[
            styles.connectionIndicator,
            { backgroundColor: connectionStatus === 'Connected' ? '#10b981' : '#ef4444' }
          ]} />
          <Text style={styles.connectionText}>WebSocket: {connectionStatus}</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Meters List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getCurrentMeterData().map((meter) => renderMeterCard(meter))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a0aec0',
    marginBottom: 10,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  refreshText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  meterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  meterCardAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  meterTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  meterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginLeft: 10,
    flex: 1,
  },
  alertBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  parameterCard: {
    width: '48%',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  parameterCardAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  parameterLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  parameterLabelAlert: {
    color: '#ef4444',
  },
  parameterValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LiveScreen; 