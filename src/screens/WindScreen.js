import React, { useState } from 'react';
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

const WindScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const windData = [
    {
      id: 1,
      name: 'Wind Turbine 1',
      voltage: 24.5,
      current: 13.1,
      power: 320,
      windSpeed: 12.5,
      direction: 'NW',
      efficiency: 85.2,
      rotorSpeed: 28,
      status: 'Online',
    },
    {
      id: 2,
      name: 'Wind Turbine 2',
      voltage: 23.8,
      current: 12.4,
      power: 295,
      windSpeed: 11.8,
      direction: 'W',
      efficiency: 82.7,
      rotorSpeed: 26,
      status: 'Online',
    },
    {
      id: 3,
      name: 'Wind Turbine 3',
      voltage: 25.2,
      current: 14.2,
      power: 358,
      windSpeed: 14.2,
      direction: 'NW',
      efficiency: 88.5,
      rotorSpeed: 32,
      status: 'Online',
    },
    {
      id: 4,
      name: 'Wind Turbine 4',
      voltage: 0,
      current: 0,
      power: 0,
      windSpeed: 8.5,
      direction: 'N',
      efficiency: 0,
      rotorSpeed: 0,
      status: 'Maintenance',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getParameterIcon = (parameter) => {
    const icons = {
      voltage: 'flash',
      current: 'trending-up',
      power: 'speedometer',
      windSpeed: 'leaf',
      direction: 'compass',
      efficiency: 'analytics',
      rotorSpeed: 'refresh-circle',
    };
    return icons[parameter] || 'information-circle';
  };

  const getParameterColor = (parameter) => {
    const colors = {
      voltage: '#3b82f6',
      current: '#10b981',
      power: '#f59e0b',
      windSpeed: '#06b6d4',
      direction: '#8b5cf6',
      efficiency: '#ef4444',
      rotorSpeed: '#f97316',
    };
    return colors[parameter] || '#6b7280';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Online': return '#10b981';
      case 'Offline': return '#ef4444';
      case 'Maintenance': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getWindSpeedCategory = (speed) => {
    if (speed < 5) return 'Low';
    if (speed < 12) return 'Moderate';
    if (speed < 20) return 'High';
    return 'Very High';
  };

  const renderWindCard = (turbine) => {
    const parameters = [
      { key: 'voltage', label: 'Voltage', value: `${turbine.voltage} V`, unit: 'V' },
      { key: 'current', label: 'Current', value: `${turbine.current} A`, unit: 'A' },
      { key: 'power', label: 'Power', value: `${turbine.power} W`, unit: 'W' },
      { key: 'windSpeed', label: 'Wind Speed', value: `${turbine.windSpeed} m/s`, unit: 'm/s' },
      { key: 'direction', label: 'Direction', value: turbine.direction, unit: '' },
      { key: 'rotorSpeed', label: 'Rotor Speed', value: `${turbine.rotorSpeed} RPM`, unit: 'RPM' },
    ];

    return (
      <View key={turbine.id} style={styles.windCard}>
        <LinearGradient
          colors={['#06b6d4', '#0891b2']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name="leaf" size={28} color="#ffffff" />
              <Text style={styles.turbineTitle}>{turbine.name}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(turbine.status) }
            ]}>
              <Text style={styles.statusText}>{turbine.status}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.parametersContainer}>
          {/* Wind Speed Highlight */}
          <View style={styles.windSpeedContainer}>
            <View style={styles.windSpeedHeader}>
              <Ionicons name="leaf" size={24} color="#06b6d4" />
              <Text style={styles.windSpeedTitle}>Wind Conditions</Text>
            </View>
            <View style={styles.windSpeedContent}>
              <Text style={styles.windSpeedValue}>{turbine.windSpeed} m/s</Text>
              <Text style={styles.windSpeedCategory}>{getWindSpeedCategory(turbine.windSpeed)}</Text>
              <Text style={styles.windDirection}>Direction: {turbine.direction}</Text>
            </View>
          </View>

          <View style={styles.parametersGrid}>
            {parameters.map((param, index) => (
              <View key={index} style={styles.parameterCard}>
                <View style={styles.parameterHeader}>
                  <Ionicons
                    name={getParameterIcon(param.key)}
                    size={20}
                    color={getParameterColor(param.key)}
                  />
                  <Text style={styles.parameterLabel}>{param.label}</Text>
                </View>
                <Text style={[styles.parameterValue, { color: getParameterColor(param.key) }]}>
                  {param.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Efficiency Indicator */}
          <View style={styles.efficiencyContainer}>
            <Text style={styles.efficiencyTitle}>Turbine Efficiency</Text>
            <View style={styles.efficiencyBar}>
              <LinearGradient
                colors={['#10b981', '#34d399']}
                style={[styles.efficiencyFill, { width: `${turbine.efficiency}%` }]}
              />
            </View>
            <Text style={styles.efficiencyText}>{turbine.efficiency}% Efficiency</Text>
          </View>
        </View>
      </View>
    );
  };

  const totalPower = windData.reduce((sum, turbine) => sum + turbine.power, 0);
  const avgWindSpeed = (windData.reduce((sum, turbine) => sum + turbine.windSpeed, 0) / windData.length).toFixed(1);
  const activeTurbines = windData.filter(t => t.status === 'Online').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#06b6d4', '#0891b2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Wind Energy Monitoring</Text>
        <Text style={styles.headerSubtitle}>Real-time wind turbine performance</Text>
        
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalPower}W</Text>
            <Text style={styles.summaryLabel}>Total Power</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgWindSpeed} m/s</Text>
            <Text style={styles.summaryLabel}>Avg Wind Speed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeTurbines}</Text>
            <Text style={styles.summaryLabel}>Active Turbines</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.refreshText}>Refresh Data</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Wind Turbines List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {windData.map((turbine) => renderWindCard(turbine))}
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
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
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
  windCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
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
  turbineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 12,
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
  parametersContainer: {
    padding: 20,
  },
  windSpeedContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  windSpeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  windSpeedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginLeft: 10,
  },
  windSpeedContent: {
    alignItems: 'center',
  },
  windSpeedValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: 5,
  },
  windSpeedCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 3,
  },
  windDirection: {
    fontSize: 12,
    color: '#64748b',
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  },
  parameterValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  efficiencyContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },
  efficiencyBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  efficiencyFill: {
    height: '100%',
    borderRadius: 4,
  },
  efficiencyText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
});

export default WindScreen; 