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

const SolarScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const solarData = [
    {
      id: 1,
      name: 'Solar Panel Array 1',
      voltage: 48.5,
      current: 17.5,
      power: 850,
      temperature: 45.2,
      efficiency: 18.5,
      irradiance: 950,
      status: 'Online',
    },
    {
      id: 2,
      name: 'Solar Panel Array 2',
      voltage: 47.8,
      current: 16.2,
      power: 775,
      temperature: 43.8,
      efficiency: 17.8,
      irradiance: 920,
      status: 'Online',
    },
    {
      id: 3,
      name: 'Solar Panel Array 3',
      voltage: 49.2,
      current: 18.1,
      power: 890,
      temperature: 46.5,
      efficiency: 19.2,
      irradiance: 980,
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
      temperature: 'thermometer',
      efficiency: 'analytics',
      irradiance: 'sunny',
    };
    return icons[parameter] || 'information-circle';
  };

  const getParameterColor = (parameter) => {
    const colors = {
      voltage: '#3b82f6',
      current: '#10b981',
      power: '#f59e0b',
      temperature: '#ef4444',
      efficiency: '#8b5cf6',
      irradiance: '#f97316',
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

  const renderSolarCard = (panel) => {
    const parameters = [
      { key: 'voltage', label: 'Voltage', value: `${panel.voltage} V`, unit: 'V' },
      { key: 'current', label: 'Current', value: `${panel.current} A`, unit: 'A' },
      { key: 'power', label: 'Power', value: `${panel.power} W`, unit: 'W' },
      { key: 'temperature', label: 'Temperature', value: `${panel.temperature} °C`, unit: '°C' },
      { key: 'efficiency', label: 'Efficiency', value: `${panel.efficiency} %`, unit: '%' },
      { key: 'irradiance', label: 'Irradiance', value: `${panel.irradiance} W/m²`, unit: 'W/m²' },
    ];

    return (
      <View key={panel.id} style={styles.solarCard}>
        <LinearGradient
          colors={['#fbbf24', '#f59e0b']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name="sunny" size={28} color="#ffffff" />
              <Text style={styles.panelTitle}>{panel.name}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(panel.status) }
            ]}>
              <Text style={styles.statusText}>{panel.status}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.parametersContainer}>
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

          {/* Performance Indicator */}
          <View style={styles.performanceContainer}>
            <Text style={styles.performanceTitle}>Performance Today</Text>
            <View style={styles.performanceBar}>
              <LinearGradient
                colors={['#10b981', '#34d399']}
                style={[styles.performanceFill, { width: `${panel.efficiency * 4}%` }]}
              />
            </View>
            <Text style={styles.performanceText}>{panel.efficiency}% Efficiency</Text>
          </View>
        </View>
      </View>
    );
  };

  const totalPower = solarData.reduce((sum, panel) => sum + panel.power, 0);
  const avgEfficiency = (solarData.reduce((sum, panel) => sum + panel.efficiency, 0) / solarData.length).toFixed(1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Solar Energy Monitoring</Text>
        <Text style={styles.headerSubtitle}>Real-time solar panel performance</Text>
        
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalPower}W</Text>
            <Text style={styles.summaryLabel}>Total Power</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{avgEfficiency}%</Text>
            <Text style={styles.summaryLabel}>Avg Efficiency</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{solarData.filter(p => p.status === 'Online').length}</Text>
            <Text style={styles.summaryLabel}>Online Panels</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
          <Text style={styles.refreshText}>Refresh Data</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Solar Panels List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {solarData.map((panel) => renderSolarCard(panel))}
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
  solarCard: {
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
  panelTitle: {
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
  performanceContainer: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },
  performanceBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceText: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
  },
});

export default SolarScreen; 