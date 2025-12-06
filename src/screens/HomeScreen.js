import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import WebSocketService from '../services/WebSocketService';

const { width } = Dimensions.get('window');

// Storage helper for cross-platform compatibility
const Storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    }
  }
};

const HomeScreen = () => {
  const isSmallScreen = width < 400;
  const isTablet = width > 768;
  
  // State for meter data from WebSocket (Live Meter Page)
  const [meterData, setMeterData] = useState({
    1: { energy: 50, power: 1200 },
    2: { energy: 45, power: 1080 },
    3: { energy: 62, power: 1435 },
    4: { energy: 55, power: 1254 },
  });
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  // State for energy tracking (in Units - 1 kWh = 1 Unit)
  const [dailyUnits, setDailyUnits] = useState(0); // Daily energy in Units from live MQTT data
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // State for user input product profit calculation (power WITHOUT product)
  const [userInputKW, setUserInputKW] = useState(''); // User input in kW
  const [confirmedUserKW, setConfirmedUserKW] = useState(0); // User's power in kW without product
  const [confirmedUserUnits, setConfirmedUserUnits] = useState(0); // Converted to yearly units (kW × 24 × 365)

  // Rate per Unit (₹6 per Unit/kWh)
  const ratePerUnit = 6;

  // Connect to WebSocket to get live meter data
  useEffect(() => {
    WebSocketService.connect();
    setConnectionStatus('Connecting...');

    const handleWebSocketMessage = (message) => {
      if (message.data && message.meterId) {
        const meterDataReceived = message.data;
        const meterId = message.meterId;

        setMeterData(prevData => ({
          ...prevData,
          [meterId]: {
            ...prevData[meterId],
            ...meterDataReceived
          }
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

  // Calculate total energy (Units) from meters 1, 2, and 3
  const calculateTotalMeterUnits = () => {
    let totalUnits = 0;
    // Sum energy from meters 1, 2, and 3
    [1, 2, 3].forEach(meterId => {
      const meter = meterData[meterId];
      if (meter && meter.energy !== undefined) {
        totalUnits += meter.energy; // 1 kWh = 1 Unit
      }
    });
    return totalUnits;
  };

  // Load saved user input on mount
  useEffect(() => {
    const loadUserInput = async () => {
      try {
        const savedData = await Storage.getItem('@home_energy_data_v3');
        if (savedData) {
          const data = JSON.parse(savedData);
          const savedKW = data.confirmedUserKW || 0;
          setConfirmedUserKW(savedKW);
          setUserInputKW(savedKW ? savedKW.toString() : '');
          // Convert kW to yearly units: kW × 24 hours × 365 days
          setConfirmedUserUnits(savedKW * 24 * 365);
        }
      } catch (error) {
        console.log('Error loading user input:', error);
      }
    };
    loadUserInput();
    setLastUpdateDate(new Date().toDateString());
  }, []);

  // Update daily units from live MQTT meter data
  useEffect(() => {
    const meterUnits = calculateTotalMeterUnits();
    if (meterUnits > 0) {
      setDailyUnits(meterUnits); // Live daily units from MQTT
    }
  }, [meterData]);

  // Save user input whenever it changes
  useEffect(() => {
    const saveUserInput = async () => {
      try {
        const data = {
          confirmedUserKW,
          confirmedUserUnits,
        };
        await Storage.setItem('@home_energy_data_v3', JSON.stringify(data));
      } catch (error) {
        console.log('Error saving user input:', error);
      }
    };
    if (confirmedUserKW > 0) {
      saveUserInput();
    }
  }, [confirmedUserKW, confirmedUserUnits]);

  // Calculate money (₹6 per Unit)
  const dailyMoney = dailyUnits * ratePerUnit; // Daily Units (from live MQTT) × ₹6
  
  // Calculate yearly values
  const yearlyUnitsWithProduct = dailyUnits * 365; // Yearly units WITH product (extrapolated from daily)
  const yearlyMoneyWithProduct = yearlyUnitsWithProduct * ratePerUnit; // Yearly money WITH product
  
  // User input represents yearly units WITHOUT product
  const yearlyMoneyWithoutProduct = confirmedUserUnits * ratePerUnit; // Money earned per year WITHOUT product (user input × ₹6)
  
  // Product profit calculation (savings by using the product)
  const productProfit = yearlyMoneyWithoutProduct - yearlyMoneyWithProduct; // Savings = (Without product) - (With product)

  // Handle user input - auto calculate on input change
  const handleUserInputChange = (value) => {
    setUserInputKW(value);
    const kwValue = parseFloat(value);
    if (!isNaN(kwValue) && kwValue >= 0) {
      setConfirmedUserKW(kwValue);
      // Convert kW to yearly units: kW × 24 hours/day × 365 days/year = kWh/year
      setConfirmedUserUnits(kwValue * 24 * 365);
    } else {
      setConfirmedUserKW(0);
      setConfirmedUserUnits(0);
    }
  };

  // Format number with commas for Indian number system
  const formatIndianNumber = (num) => {
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };
  
  const getCardWidth = () => {
    if (isSmallScreen) return '100%';
    if (isTablet) return '23%';
    return '47%';
  };

  // Get current power from meters
  const getTotalPower = () => {
    let totalPower = 0;
    Object.values(meterData).forEach(meter => {
      if (meter && meter.power !== undefined) {
        totalPower += meter.power;
      }
    });
    return totalPower;
  };

  // Count online meters
  const getOnlineMeters = () => {
    return Object.values(meterData).filter(meter => meter !== null).length;
  };

  const quickStats = [
    { title: 'Total Units', value: formatIndianNumber(dailyUnits), unit: 'Units', icon: 'flash', gradient: ['#6366f1', '#8b5cf6'], bgColor: '#eef2ff' },
    { title: 'Active Meters', value: getOnlineMeters().toString(), unit: 'Online', icon: 'speedometer', gradient: ['#10b981', '#34d399'], bgColor: '#ecfdf5' },
    { title: 'Total Power', value: formatIndianNumber(getTotalPower()), unit: 'W', icon: 'sunny', gradient: ['#f59e0b', '#fbbf24'], bgColor: '#fffbeb' },
    { title: 'Connection', value: connectionStatus === 'Connected' ? 'Live' : 'Offline', unit: '', icon: 'wifi', gradient: ['#06b6d4', '#22d3ee'], bgColor: '#ecfeff' },
  ];

  const systemStatus = [
    { name: 'Meter 1', status: 'Online', value: '1200 W', icon: 'speedometer', color: '#6366f1' },
    { name: 'Meter 2', status: 'Online', value: '850 W', icon: 'speedometer', color: '#8b5cf6' },
    { name: 'Solar Panel', status: 'Online', value: '850 W', icon: 'sunny', color: '#f59e0b' },
    { name: 'Wind Turbine', status: 'Online', value: '320 W', icon: 'leaf', color: '#06b6d4' },
  ];

  const alerts = [
    { type: 'warning', icon: 'warning', color: '#f59e0b', bgColor: '#fef3c7', text: 'Power factor low on Meter 2', time: '2 hours ago' },
    { type: 'info', icon: 'information-circle', color: '#3b82f6', bgColor: '#dbeafe', text: 'Maintenance scheduled for tomorrow', time: '1 day ago' },
  ];

  return (
    <View style={styles.container}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Good Morning! ☀️</Text>
            <Text style={styles.welcomeText}>Energy Dashboard</Text>
            <Text style={styles.subText}>Monitor your microgrid in real-time</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.profileGradient}
            >
              <Ionicons name="person" size={20} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Energy Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Daily Units</Text>
              <Text style={styles.summaryValue}>{formatIndianNumber(dailyUnits)} Units</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money Per Day</Text>
              <Text style={styles.summaryValue}>₹{formatIndianNumber(dailyMoney)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Profit Cards Section */}
        <View style={styles.profitSection}>
          <Text style={styles.sectionTitle}>Profit Overview</Text>
          
          {/* Profit Per Year Card */}
          <View style={styles.profitCard}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.profitCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profitCardIcon}>
                <Ionicons name="calendar" size={24} color="#ffffff" />
              </View>
              <View style={styles.profitCardContent}>
                <Text style={styles.profitCardLabel}>Money Earned Per Year (Without Product)</Text>
                <Text style={styles.profitCardValue}>₹{formatIndianNumber(yearlyMoneyWithoutProduct)}</Text>
                <Text style={styles.profitCardSubtext}>Based on {formatIndianNumber(confirmedUserUnits)} Units yearly</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Profit by Product Card */}
          <View style={styles.profitCard}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.profitCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profitCardIcon}>
                <Ionicons name="cube" size={24} color="#ffffff" />
              </View>
              <View style={styles.profitCardContent}>
                <Text style={styles.profitCardLabel}>Profit Earned by Product</Text>
                <Text style={styles.profitCardValue}>₹{formatIndianNumber(Math.max(0, productProfit))}</Text>
                <Text style={styles.profitCardSubtext}>Yearly Money - Your Input Money</Text>
              </View>
            </LinearGradient>
          </View>

          {/* User Input Section for Product Profit */}
          <View style={styles.userInputCard}>
            <View style={styles.userInputHeader}>
              <Ionicons name="calculator" size={20} color="#6366f1" />
              <Text style={styles.userInputTitle}>Calculate Product Profit</Text>
            </View>
            <Text style={styles.userInputDescription}>Enter your power consumption WITHOUT using our product:</Text>
            
            <View style={styles.userInputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.energyInput}
                  placeholder="Enter Power (kW)"
                  placeholderTextColor="#94a3b8"
                  value={userInputKW}
                  onChangeText={handleUserInputChange}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>kW</Text>
              </View>
            </View>

            {confirmedUserUnits > 0 && (
              <View style={styles.calculationDisplay}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Your Input Power:</Text>
                  <Text style={styles.calcValue}>{formatIndianNumber(confirmedUserKW)} kW</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Yearly Units (Without Product):</Text>
                  <Text style={styles.calcValue}>{formatIndianNumber(confirmedUserUnits)} Units</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Money (Without Product) (×₹{ratePerUnit}):</Text>
                  <Text style={styles.calcValue}>₹{formatIndianNumber(yearlyMoneyWithoutProduct)}</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Yearly Units (With Product):</Text>
                  <Text style={styles.calcValue}>{formatIndianNumber(yearlyUnitsWithProduct)} Units</Text>
                </View>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Money (With Product) (×₹{ratePerUnit}):</Text>
                  <Text style={styles.calcValue}>₹{formatIndianNumber(yearlyMoneyWithProduct)}</Text>
                </View>
                <View style={[styles.calcRow, styles.calcResultRow]}>
                  <Text style={styles.calcResultLabel}>Product Profit (Savings):</Text>
                  <Text style={styles.calcResultValue}>₹{formatIndianNumber(Math.max(0, productProfit))}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.statCardContainer, { width: getCardWidth() }]}
              activeOpacity={0.7}
            >
              <View style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={stat.gradient}
                    style={styles.statIconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={stat.icon} size={20} color="#ffffff" />
                  </LinearGradient>
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <View style={styles.statValueRow}>
                    <Text style={[styles.statValue, { color: stat.gradient[0] }]}>{stat.value}</Text>
                    <Text style={styles.statUnit}>{stat.unit}</Text>
                  </View>
                </View>
                <View style={styles.statArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* System Status Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
          <View style={styles.statusContainer}>
            {systemStatus.map((system, index) => (
              <View 
                key={index} 
                style={[
                  styles.statusItem,
                  index === systemStatus.length - 1 && styles.statusItemLast
                ]}
              >
                <View style={[styles.statusIconContainer, { backgroundColor: system.color + '15' }]}>
                  <Ionicons name={system.icon} size={20} color={system.color} />
                </View>
                <View style={styles.statusInfo}>
                  <Text style={styles.systemName}>{system.name}</Text>
                  <Text style={styles.systemValue}>{system.value}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{system.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Alerts Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            <View style={styles.alertBadgeCount}>
              <Text style={styles.alertBadgeText}>2</Text>
            </View>
          </View>
          <View style={styles.alertContainer}>
            {alerts.map((alert, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.alertItem,
                  index === alerts.length - 1 && styles.alertItemLast
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.alertIconContainer, { backgroundColor: alert.bgColor }]}>
                  <Ionicons name={alert.icon} size={20} color={alert.color} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertText}>{alert.text}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  profileButton: {
    marginLeft: 16,
  },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCardContainer: {
    marginBottom: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 4,
  },
  statArrow: {
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
    marginRight: 2,
  },
  alertBadgeCount: {
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusItemLast: {
    borderBottomWidth: 0,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  systemValue: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  alertContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  alertItemLast: {
    borderBottomWidth: 0,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  
  // Profit Section Styles
  profitSection: {
    marginBottom: 24,
  },
  profitCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profitCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  profitCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profitCardContent: {
    flex: 1,
  },
  profitCardLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profitCardValue: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 4,
  },
  profitCardSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  
  // User Input Card Styles
  userInputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  userInputDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '400',
  },
  userInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  energyInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
  },
  inputUnit: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  calculationDisplay: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  calcLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  calcValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  calcResultRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#6366f1',
  },
  calcResultLabel: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  calcResultValue: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: '700',
  },
  
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen; 