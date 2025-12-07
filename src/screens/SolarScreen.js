import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import WebSocketService from '../services/WebSocketService';
import DustDetectionService from '../services/DustDetectionService';

const SOLAR_STORAGE_KEY = '@solar_panel_data';

// Simple storage helper that works on all platforms
const Storage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.log('Storage getItem error:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.log('Storage setItem error:', e);
    }
  }
};

const SolarScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [solarRealTimeData, setSolarRealTimeData] = useState({
    1: null,
    2: null,
  });
  const [dustAnalysis, setDustAnalysis] = useState({});
  const [weatherData, setWeatherData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const shouldSaveToStorage = React.useRef(true);

  // initialize panel list with per-panel date fields
  const [solarData, setSolarData] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [
      { id: 1, name: 'Solar Array 1', voltage: '-', current: '-', power: '-', temperature: '-', efficiency: '-', irradiance: '-', status: 'Connecting', date: today, inputDate: today, startDate: today, confirmed: false },
      { id: 2, name: 'Solar Array 2', voltage: '-', current: '-', power: '-', temperature: '-', efficiency: '-', irradiance: '-', status: 'Connecting', date: today, inputDate: today, startDate: today, confirmed: false },
    ];
  });

  // Request location permission and get current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        console.log('📍 Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status);
        
        if (status === 'granted') {
          console.log('✅ Location permission granted');
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
          };
          
          setCurrentLocation(locationData);
          console.log('📍 Current Location:', locationData);
          console.log(`📍 Lat: ${locationData.latitude}, Lon: ${locationData.longitude}`);
        } else {
          console.log('❌ Location permission denied');
          Alert.alert(
            'Location Permission',
            'Location permission is required to get accurate weather data for dust detection.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('❌ Error getting location:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await Storage.getItem(SOLAR_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only load date-related fields, not sensor values
          setSolarData(prevData => 
            prevData.map(panel => {
              const saved = parsed.find(p => p.id === panel.id);
              if (saved) {
                return {
                  ...panel,
                  date: saved.date || panel.date,
                  inputDate: saved.inputDate || panel.inputDate,
                  startDate: saved.startDate || panel.startDate,
                  confirmed: saved.confirmed || panel.confirmed
                };
              }
              return panel;
            })
          );
        }
      } catch (e) {
        console.log('Failed to load solar data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // WebSocket connection using WebSocketService (same as LiveScreen)
  useEffect(() => {
    WebSocketService.connect();
    setConnectionStatus('Connecting...');

    const handleWebSocketMessage = (message) => {
      console.log('Solar Screen received WebSocket message:', message);
      
      // Only process solar panel data (solar1/all, solar2/all)
      if (message.panelId && message.data) {
        const panelId = message.panelId;
        const panelData = message.data;
        
        console.log(`Updating Solar Array ${panelId}:`, panelData);
        
        // Update real-time data state
        setSolarRealTimeData(prevData => ({
          ...prevData,
          [panelId]: panelData
        }));
      }
    };

    const handleConnectionStatus = (status) => {
      console.log('Solar Screen connection status:', status);
      setConnectionStatus(status);
    };

    WebSocketService.addMessageListener(handleWebSocketMessage);
    WebSocketService.addConnectionStatusListener(handleConnectionStatus);

    return () => {
      WebSocketService.removeMessageListener(handleWebSocketMessage);
      WebSocketService.removeConnectionStatusListener(handleConnectionStatus);
    };
  }, []);

  // Save data to AsyncStorage for date/confirmation changes only
  useEffect(() => {
    if (!isLoaded || !shouldSaveToStorage.current) {
      shouldSaveToStorage.current = true; // Reset flag
      return;
    }
    const saveData = async () => {
      try {
        // Only save date-related fields, not live sensor data
        const dataToSave = solarData.map(panel => ({
          id: panel.id,
          name: panel.name,
          date: panel.date,
          inputDate: panel.inputDate,
          startDate: panel.startDate,
          confirmed: panel.confirmed,
          status: panel.status === 'Online' ? 'Connecting' : panel.status
        }));
        await Storage.setItem(SOLAR_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.log('Failed to save solar data', e);
      }
    };
    saveData();
  }, [solarData, isLoaded]);

  // Check dust when real-time data updates (using live location if available)
  useEffect(() => {
    const checkDust = async () => {
      const panelsWithData = Object.keys(solarRealTimeData).filter(id => solarRealTimeData[id] !== null);
      
      if (panelsWithData.length === 0) return;

      // Use live location if available, otherwise use default
      let latitude, longitude;
      if (currentLocation) {
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
        console.log('📍 Using live location for weather data');
      }

      for (const panelId of panelsWithData) {
        const realTimeData = solarRealTimeData[panelId];
        const panel = solarData.find(p => p.id === parseInt(panelId));
        
        if (realTimeData && panel && realTimeData.voltage !== undefined && realTimeData.current !== undefined && realTimeData.power !== undefined) {
          const voltage = parseFloat(realTimeData.voltage);
          const current = parseFloat(realTimeData.current);
          const power = parseFloat(realTimeData.power);
          
          // Assume rated power of 1000W for each panel (can be configured)
          const ratedPower = 1000;
          
          // Fetch weather with live location first
          let weather = null;
          if (latitude && longitude) {
            weather = await DustDetectionService.fetchWeatherData(latitude, longitude);
          } else {
            weather = await DustDetectionService.fetchWeatherData();
          }

          if (weather) {
            setWeatherData(weather);
            console.log(`🌡️ Temperature at location: ${weather.temperature}°C`);
            console.log(`📍 Weather location: ${weather.location || 'Unknown'}`);
          }
          
          const result = await DustDetectionService.checkPanelDust(
            parseInt(panelId),
            voltage,
            current,
            power,
            ratedPower
          );

          if (result.success) {
            setDustAnalysis(prev => ({
              ...prev,
              [panelId]: result.dustAnalysis
            }));
          }
        }
      }
    };

    // Check dust every 5 minutes
    checkDust();
    const interval = setInterval(checkDust, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [solarRealTimeData, currentLocation]);

  // Get current solar data with real-time updates (similar to LiveScreen's getCurrentMeterData)
  const getCurrentSolarData = () => {
    return solarData.map(panel => {
      const realTimeData = solarRealTimeData[panel.id];
      
      if (realTimeData) {
        console.log(`Merging real-time data for panel ${panel.id}:`, realTimeData);
        return {
          ...panel,
          voltage: realTimeData.voltage !== undefined ? parseFloat(realTimeData.voltage).toFixed(1) : panel.voltage,
          current: realTimeData.current !== undefined ? parseFloat(realTimeData.current).toFixed(2) : panel.current,
          power: realTimeData.power !== undefined ? parseFloat(realTimeData.power).toFixed(1) : panel.power,
          temperature: '-',
          efficiency: '-',
          irradiance: '-',
          status: 'Online',
        };
      }
      
      return panel;
    });
  };

  // Helper to calculate day count
  const getDayCount = (startDate, currentDate) => {
    try {
      const start = new Date(startDate);
      const current = new Date(currentDate);
      const diffTime = current.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1; // Day 1 is the start date
    } catch (e) {
      return 1;
    }
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
    voltage: { icon: 'flash', gradient: ['#6366f1', '#8b5cf6'], bgColor: '#eef2ff' },
    current: { icon: 'trending-up', gradient: ['#10b981', '#34d399'], bgColor: '#ecfdf5' },
    power: { icon: 'speedometer', gradient: ['#f59e0b', '#fbbf24'], bgColor: '#fffbeb' },
    temperature: { icon: 'thermometer', gradient: ['#ef4444', '#f87171'], bgColor: '#fef2f2' },
    efficiency: { icon: 'analytics', gradient: ['#8b5cf6', '#a78bfa'], bgColor: '#f5f3ff' },
    irradiance: { icon: 'sunny', gradient: ['#f97316', '#fb923c'], bgColor: '#fff7ed' },
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Online': return { bg: '#ecfdf5', color: '#10b981', dot: '#10b981' };
      case 'Offline': return { bg: '#fef2f2', color: '#ef4444', dot: '#ef4444' };
      case 'Maintenance': return { bg: '#fffbeb', color: '#f59e0b', dot: '#f59e0b' };
      case 'Connecting': return { bg: '#eff6ff', color: '#3b82f6', dot: '#3b82f6' };
      default: return { bg: '#f1f5f9', color: '#64748b', dot: '#64748b' };
    }
  };

  const renderSolarCard = (panel) => {
    const statusConfig = getStatusConfig(panel.status);
    
    const parameters = [
      { key: 'voltage', label: 'Voltage', value: `${panel.voltage}`, unit: 'V' },
      { key: 'current', label: 'Current', value: `${panel.current}`, unit: 'A' },
      { key: 'power', label: 'Power', value: `${panel.power}`, unit: 'W' },
      { key: 'temperature', label: 'Temp', value: `${panel.temperature}`, unit: '°C' },
      { key: 'efficiency', label: 'Efficiency', value: `${panel.efficiency}`, unit: '%' },
      { key: 'irradiance', label: 'Irradiance', value: `${panel.irradiance}`, unit: 'W/m²' },
    ];

    return (
      <View key={panel.id} style={styles.solarCard}>
        <LinearGradient
          colors={['#f59e0b', '#fbbf24']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="sunny" size={22} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.panelTitle}>{panel.name}</Text>
                <Text style={styles.panelSubtitle}>Photovoltaic System</Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <View style={[styles.statusDot, { backgroundColor: '#ffffff' }]} />
                <Text style={styles.statusText}>{panel.status}</Text>
              </View>
              {panel.confirmed && (
                <Text style={styles.dayCountText}>Day {getDayCount(panel.startDate, panel.date)}</Text>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.parametersContainer}>
          <View style={styles.parametersGrid}>
            {parameters.map((param, index) => {
              const config = parameterConfig[param.key];
              return (
                <View key={index} style={styles.parameterCard}>
                  <View style={[styles.paramIconContainer, { backgroundColor: config.bgColor }]}>
                    <Ionicons name={config.icon} size={16} color={config.gradient[0]} />
                  </View>
                  <Text style={styles.parameterLabel}>{param.label}</Text>
                  <View style={styles.parameterValueRow}>
                    <Text style={[styles.parameterValue, { color: config.gradient[0] }]}>{param.value}</Text>
                    <Text style={styles.parameterUnit}>{param.unit}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.performanceContainer}>
            <View style={styles.performanceHeader}>
              <Ionicons name="trending-up" size={18} color="#10b981" />
              <Text style={styles.performanceTitle}>Today's Performance</Text>
            </View>
            <View style={styles.performanceBarContainer}>
              <View style={styles.performanceBar}>
                <LinearGradient
                  colors={['#10b981', '#34d399']}
                  style={[styles.performanceFill, { width: panel.efficiency === '-' ? '0%' : `${parseFloat(panel.efficiency) * 5}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.performancePercent}>{panel.efficiency === '-' ? '-' : `${panel.efficiency}%`}</Text>
            </View>
          </View>

          {/* Dust Detection Section */}
          {dustAnalysis[panel.id] && (
            <View style={[
              styles.dustSection,
              { backgroundColor: dustAnalysis[panel.id].hasDust ? '#fef2f2' : '#ecfdf5' }
            ]}>
              <View style={styles.dustHeader}>
                <Ionicons 
                  name={dustAnalysis[panel.id].hasDust ? "warning" : "checkmark-circle"} 
                  size={20} 
                  color={dustAnalysis[panel.id].hasDust ? "#ef4444" : "#10b981"} 
                />
                <Text style={[
                  styles.dustTitle,
                  { color: dustAnalysis[panel.id].hasDust ? "#ef4444" : "#10b981" }
                ]}>
                  {dustAnalysis[panel.id].hasDust ? 'Dust Detected' : 'Panel Clean'}
                </Text>
              </View>
              
              <View style={styles.dustDetails}>
                <View style={styles.dustRow}>
                  <Text style={styles.dustLabel}>Efficiency:</Text>
                  <Text style={[
                    styles.dustValue,
                    { color: dustAnalysis[panel.id].hasDust ? "#ef4444" : "#10b981" }
                  ]}>
                    {dustAnalysis[panel.id].efficiency}%
                  </Text>
                </View>
                <View style={styles.dustRow}>
                  <Text style={styles.dustLabel}>Power Loss:</Text>
                  <Text style={[
                    styles.dustValue,
                    { color: dustAnalysis[panel.id].hasDust ? "#ef4444" : "#64748b" }
                  ]}>
                    {dustAnalysis[panel.id].powerLoss}%
                  </Text>
                </View>
                {weatherData && (
                  <View style={styles.dustRow}>
                    <Text style={styles.dustLabel}>Temperature:</Text>
                    <Text style={styles.dustValue}>{weatherData.temperature}°C</Text>
                  </View>
                )}
              </View>

              {dustAnalysis[panel.id].hasDust && (
                <View style={styles.dustAlert}>
                  <Text style={styles.dustAlertText}>
                    {dustAnalysis[panel.id].recommendation}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Date input + controls per panel */}
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>Selected Date</Text>
            <Text style={styles.dateDisplay}>{panel.date}</Text>

            {/* Show input row only if not confirmed */}
            {!panel.confirmed && (
              <View style={styles.dateInputRow}>
                <TextInput
                  value={panel.inputDate}
                  onChangeText={(val) => setSolarData(prev => prev.map(p => p.id === panel.id ? { ...p, inputDate: val } : p))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                  style={styles.dateInput}
                />
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    // confirm input date, set as panel.date and startDate, mark confirmed
                    setSolarData(prev => prev.map(p => {
                      if (p.id !== panel.id) return p;
                      const newDate = p.inputDate || p.date;
                      return { ...p, date: newDate, startDate: newDate, confirmed: true };
                    }));
                  }}
                >
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Get current data with real-time updates
  const currentSolarData = getCurrentSolarData();

  const totalPower = currentSolarData.reduce((sum, panel) => {
    const power = panel.power === '-' ? 0 : parseFloat(panel.power);
    return sum + power;
  }, 0);
  
  const efficiencyValues = currentSolarData.filter(p => p.efficiency !== '-').map(p => parseFloat(p.efficiency));
  const avgEfficiency = efficiencyValues.length > 0 
    ? (efficiencyValues.reduce((sum, val) => sum + val, 0) / efficiencyValues.length).toFixed(1)
    : '-';
    
  const onlinePanels = currentSolarData.filter(p => p.status === 'Online').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Solar Energy ☀️</Text>
            <Text style={styles.headerSubtitle}>Photovoltaic monitoring</Text>
            {weatherData && (
              <View style={styles.weatherInfo}>
                <Ionicons name="location" size={12} color="#ffffff" />
                <Text style={styles.weatherText}>
                  {weatherData.location || 'Unknown'} • {weatherData.temperature}°C • {weatherData.description}
                </Text>
              </View>
            )}
            {currentLocation && (
              <Text style={styles.locationText}>
                📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#f59e0b" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalPower}</Text>
            <Text style={styles.summaryUnit}>W</Text>
            <Text style={styles.summaryLabel}>Total Power</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgEfficiency}</Text>
            <Text style={styles.summaryUnit}>%</Text>
            <Text style={styles.summaryLabel}>Avg Efficiency</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{onlinePanels}</Text>
            <Text style={styles.summaryUnit}>/{currentSolarData.length}</Text>
            <Text style={styles.summaryLabel}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />
        }
      >
        {currentSolarData.map((panel) => renderSolarCard(panel))}
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
    marginBottom: 20,
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
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  weatherText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 4,
  },
  locationText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginTop: 4,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: -2,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  solarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 18,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  panelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  panelSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  dayCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  parametersContainer: {
    padding: 18,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginHorizontal: -4,
  },
  parameterCard: {
    width: '31%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: '1%',
  },
  paramIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  parameterLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  parameterValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  parameterValue: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  parameterUnit: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 2,
  },
  performanceContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    marginLeft: 8,
  },
  performanceBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performancePercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    minWidth: 40,
    textAlign: 'right',
  },
  // Dust Detection Styles
  dustSection: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dustTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  dustDetails: {
    marginBottom: 8,
  },
  dustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dustLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dustValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  dustAlert: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  dustAlertText: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '500',
    lineHeight: 16,
  },
  // Date controls
  dateSection: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    fontSize: 14,
    marginRight: 8,
  },
  confirmBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  nextBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default SolarScreen; 