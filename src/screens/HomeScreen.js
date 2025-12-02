import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const isSmallScreen = width < 400;
  const isMediumScreen = width >= 400 && width <= 768;
  const isTablet = width > 768;
  
  const getCardWidth = () => {
    if (isSmallScreen) return '100%';
    if (isTablet) return '23%';
    return '48%';
  };
  const quickStats = [
    { title: 'Total Energy', value: '2,450 kWh', icon: 'flash', color: ['#667eea', '#764ba2'] },
    { title: 'Active Meters', value: '4', icon: 'speedometer', color: ['#f093fb', '#f5576c'] },
    { title: 'Solar Output', value: '850 W', icon: 'sunny', color: ['#4facfe', '#00f2fe'] },
    { title: 'Wind Output', value: '320 W', icon: 'leaf', color: ['#43e97b', '#38f9d7'] },
  ];

  const systemStatus = [
    { name: 'Meter 1', status: 'Online', value: '1200 W' },
    { name: 'Meter 2', status: 'Online', value: '850 W' },
    { name: 'Solar Panel', status: 'Online', value: '850 W' },
    { name: 'Wind Turbine', status: 'Online', value: '320 W' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <Text style={styles.subText}>Energy Monitoring Dashboard</Text>
      </View>

      {/* Quick Stats Cards */}
      <View style={[
        styles.statsContainer,
        isSmallScreen && styles.statsContainerSmall,
        isTablet && styles.statsContainerTablet
      ]}>
        {quickStats.map((stat, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.statCardContainer,
              { width: getCardWidth() },
              isSmallScreen && styles.statCardContainerSmall,
              isTablet && styles.statCardContainerTablet
            ]}
          >
            <LinearGradient
              colors={stat.color}
              style={[
                styles.statCard,
                isSmallScreen && styles.statCardSmall
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons 
                name={stat.icon} 
                size={isSmallScreen ? 24 : isTablet ? 36 : 30} 
                color="#ffffff" 
              />
              <Text style={[
                styles.statValue,
                isSmallScreen && styles.statValueSmall,
                isTablet && styles.statValueTablet
              ]}>
                {stat.value}
              </Text>
              <Text style={[
                styles.statTitle,
                isSmallScreen && styles.statTitleSmall,
                isTablet && styles.statTitleTablet
              ]}>
                {stat.title}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* System Status */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusContainer}>
          {systemStatus.map((system, index) => (
            <View key={index} style={styles.statusItem}>
              <View style={styles.statusInfo}>
                <Text style={styles.systemName}>{system.name}</Text>
                <Text style={styles.systemValue}>{system.value}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                <Text style={styles.statusText}>{system.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Alerts */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <View style={styles.alertContainer}>
          <View style={styles.alertItem}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>Power factor low on Meter 2</Text>
              <Text style={styles.alertTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.alertItem}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <View style={styles.alertContent}>
              <Text style={styles.alertText}>Maintenance scheduled for tomorrow</Text>
              <Text style={styles.alertTime}>1 day ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a365d',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subText: {
    fontSize: 16,
    color: '#a0aec0',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCardContainer: {
    minWidth: 150,
    marginBottom: 15,
    marginHorizontal: '1%',
  },
  statCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 3,
  },
  systemValue: {
    fontSize: 14,
    color: '#718096',
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
  alertContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertText: {
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 3,
  },
  alertTime: {
    fontSize: 12,
    color: '#718096',
  },
  // Responsive styles for small screens
  statsContainerSmall: {
    paddingHorizontal: 10,
  },
  statCardContainerSmall: {
    marginHorizontal: 0,
    marginBottom: 12,
  },
  statCardSmall: {
    padding: 15,
    borderRadius: 12,
  },
  statValueSmall: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  statTitleSmall: {
    fontSize: 12,
  },
  // Responsive styles for tablets
  statsContainerTablet: {
    paddingHorizontal: 20,
  },
  statCardContainerTablet: {
    minWidth: 180,
    maxWidth: 250,
  },
  statValueTablet: {
    fontSize: 26,
    marginTop: 12,
    marginBottom: 6,
  },
  statTitleTablet: {
    fontSize: 16,
  },
});

export default HomeScreen; 