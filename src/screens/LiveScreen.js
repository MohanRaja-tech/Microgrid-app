import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService from '../services/WebSocketService';
import NotificationService from '../services/NotificationService';
import BackgroundTaskService from '../services/BackgroundTaskService';

const LiveScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState(0);
  const [meterRealTimeData, setMeterRealTimeData] = useState({
    1: null,
    2: null,
    3: null,
  });
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const pulseAnim = new Animated.Value(1);

  // Pulse animation for live indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    NotificationService.initialize();
    WebSocketService.connect();
    setConnectionStatus('Connecting...');

    const handleWebSocketMessage = (message) => {
      console.log('Received WebSocket message:', message);
      
      if (message.data && message.meterId) {
        const meterData = message.data;
        const meterId = message.meterId;
        const meterName = `Meter ${meterId}`;

        // Update background task service with latest data
        BackgroundTaskService.updateMeterData(meterId, meterData);

        if (meterData.voltage === 0) {
          NotificationService.showVoltageAlert(meterId, meterName);
        }

        if (meterData.pf !== undefined && meterData.pf < 0.85 && meterData.pf > 0) {
          NotificationService.showPowerFactorAlert(meterId, meterName, meterData.pf);
        }

        setMeterRealTimeData(prevData => ({
          ...prevData,
          [meterId]: meterData
        }));
      }
    };

    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
    };

    WebSocketService.addMessageListener(handleWebSocketMessage);
    WebSocketService.addConnectionStatusListener(handleConnectionStatus);

    return () => {
      WebSocketService.removeMessageListener(handleWebSocketMessage);
      WebSocketService.removeConnectionStatusListener(handleConnectionStatus);
    };
  }, []);

  const metersData = [
    { id: 1, name: 'Meter 1', voltage: 230, current: 5.2, power: 1200, instEnergy: 0.1, energy: 50, powerFactor: 0.95, frequency: 50, harmonics: 3.2, status: 'Offline' },
    { id: 2, name: 'Meter 2', voltage: 225, current: 4.8, power: 1080, instEnergy: 0.1, energy: 45, powerFactor: 0.92, frequency: 50.2, harmonics: 2.8, status: 'Offline' },
    { id: 3, name: 'Meter 3', voltage: 235, current: 6.1, power: 1435, instEnergy: 0.1, energy: 62, powerFactor: 0.97, frequency: 49.8, harmonics: 3.5, status: 'Offline' },
    { id: 4, name: 'Meter 4', voltage: 228, current: 5.5, power: 1254, instEnergy: 0.1, energy: 55, powerFactor: 0.94, frequency: 50.1, harmonics: 3.0, status: 'Offline' },
  ];

  const getCurrentMeterData = () => {
    const updatedMetersData = [...metersData];
    
    updatedMetersData.forEach((meter, index) => {
      const meterId = meter.id;
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
          status: 'Online',
        };
      }
    });
    
    return updatedMetersData;
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (connectionStatus !== 'Connected') {
      WebSocketService.connect();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const parameterConfig = {
    voltage: { icon: 'flash', gradient: ['#6366f1', '#8b5cf6'], label: 'Voltage', bgColor: '#eef2ff' },
    current: { icon: 'trending-up', gradient: ['#10b981', '#34d399'], label: 'Current', bgColor: '#ecfdf5' },
    power: { icon: 'speedometer', gradient: ['#f59e0b', '#fbbf24'], label: 'Power', bgColor: '#fffbeb' },
    instEnergy: { icon: 'battery-charging', gradient: ['#ec4899', '#f472b6'], label: 'Inst. Energy', bgColor: '#fdf2f8' },
    energy: { icon: 'battery-full', gradient: ['#8b5cf6', '#a78bfa'], label: 'Energy', bgColor: '#f5f3ff' },
    powerFactor: { icon: 'analytics', gradient: ['#ef4444', '#f87171'], label: 'Power Factor', bgColor: '#fef2f2' },
    frequency: { icon: 'pulse', gradient: ['#06b6d4', '#22d3ee'], label: 'Frequency', bgColor: '#ecfeff' },
    harmonics: { icon: 'radio', gradient: ['#f97316', '#fb923c'], label: 'THD', bgColor: '#fff7ed' },
  };

  const renderMeterCard = (meter) => {
    const hasVoltageAlert = meter.voltage === 0;
    const hasPowerFactorAlert = meter.powerFactor < 0.85 && meter.powerFactor > 0;
    const hasAnyAlert = hasVoltageAlert || hasPowerFactorAlert;

    const parameters = [
      { key: 'voltage', value: `${meter.voltage}`, unit: 'V', hasAlert: hasVoltageAlert },
      { key: 'current', value: `${meter.current}`, unit: 'A' },
      { key: 'power', value: `${meter.power}`, unit: 'W' },
      { key: 'instEnergy', value: `${meter.instEnergy}`, unit: 'kWh' },
      { key: 'energy', value: `${meter.energy}`, unit: 'kWh' },
      { key: 'powerFactor', value: meter.powerFactor.toFixed(2), unit: '', hasAlert: hasPowerFactorAlert },
      { key: 'frequency', value: `${meter.frequency}`, unit: 'Hz' },
      { key: 'harmonics', value: `${meter.harmonics}`, unit: '%' },
    ];

    return (
      <View key={meter.id} style={[styles.meterCard, hasAnyAlert && styles.meterCardAlert]}>
        <View style={styles.meterHeader}>
          <View style={styles.meterTitleRow}>
            <View style={[styles.meterIconContainer, { backgroundColor: hasAnyAlert ? '#fef2f2' : '#eef2ff' }]}>
              <Ionicons name="speedometer" size={22} color={hasAnyAlert ? '#ef4444' : '#6366f1'} />
            </View>
            <View style={styles.meterTitleContainer}>
              <Text style={styles.meterTitle}>{meter.name}</Text>
              <Text style={styles.meterSubtitle}>Energy Meter</Text>
            </View>
            {hasAnyAlert && (
              <View style={styles.alertIndicator}>
                <Ionicons name="warning" size={16} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={[
            styles.statusPill,
            { backgroundColor: meter.status === 'Online' ? '#ecfdf5' : '#fef2f2' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: meter.status === 'Online' ? '#10b981' : '#ef4444' }
            ]} />
            <Text style={[
              styles.statusPillText,
              { color: meter.status === 'Online' ? '#10b981' : '#ef4444' }
            ]}>{meter.status}</Text>
          </View>
        </View>

        <View style={styles.parametersGrid}>
          {parameters.map((param, index) => {
            const config = parameterConfig[param.key];
            return (
              <View 
                key={index} 
                style={[
                  styles.parameterCard,
                  param.hasAlert && styles.parameterCardAlert
                ]}
              >
                <View style={[styles.paramIconContainer, { backgroundColor: param.hasAlert ? '#fef2f2' : config.bgColor }]}>
                  <Ionicons
                    name={config.icon}
                    size={16}
                    color={param.hasAlert ? '#ef4444' : config.gradient[0]}
                  />
                </View>
                <Text style={[styles.parameterLabel, param.hasAlert && { color: '#ef4444' }]}>
                  {config.label}
                </Text>
                <View style={styles.parameterValueRow}>
                  <Text style={[
                    styles.parameterValue, 
                    { color: param.hasAlert ? '#ef4444' : config.gradient[0] }
                  ]}>
                    {param.value}
                  </Text>
                  <Text style={styles.parameterUnit}>{param.unit}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Live Readings</Text>
            <Text style={styles.headerSubtitle}>Real-time energy monitoring</Text>
          </View>
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveIndicatorDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
        </View>
        
        <View style={styles.connectionCard}>
          <View style={styles.connectionRow}>
            <View style={[
              styles.connectionDot,
              { backgroundColor: connectionStatus === 'Connected' ? '#ffffff' : '#fbbf24' }
            ]} />
            <Text style={styles.connectionText}>WebSocket: {connectionStatus}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#10b981" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
        }
      >
        {getCurrentMeterData().map((meter) => renderMeterCard(meter))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  liveIndicatorText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  connectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshText: {
    color: '#10b981',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  meterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  meterCardAlert: {
    borderWidth: 2,
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  meterIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  meterTitleContainer: {
    flex: 1,
  },
  meterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  meterSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  alertIndicator: {
    backgroundColor: '#ef4444',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  parameterCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    marginHorizontal: '1%',
  },
  parameterCardAlert: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  paramIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  parameterLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  parameterValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  parameterValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  parameterUnit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 3,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default LiveScreen; 