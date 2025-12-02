import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SolarScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const solarData = [
    { id: 1, name: 'Solar Array 1', voltage: 48.5, current: 17.5, power: 850, temperature: 45.2, efficiency: 18.5, irradiance: 950, status: 'Online' },
    { id: 2, name: 'Solar Array 2', voltage: 47.8, current: 16.2, power: 775, temperature: 43.8, efficiency: 17.8, irradiance: 920, status: 'Online' },
    { id: 3, name: 'Solar Array 3', voltage: 49.2, current: 18.1, power: 890, temperature: 46.5, efficiency: 19.2, irradiance: 980, status: 'Maintenance' },
  ];

  const onRefresh = () => {
    setRefreshing(true);
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
            <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#ffffff' }]} />
              <Text style={styles.statusText}>{panel.status}</Text>
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
                  style={[styles.performanceFill, { width: `${panel.efficiency * 5}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.performancePercent}>{panel.efficiency}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const totalPower = solarData.reduce((sum, panel) => sum + panel.power, 0);
  const avgEfficiency = (solarData.reduce((sum, panel) => sum + panel.efficiency, 0) / solarData.length).toFixed(1);
  const onlinePanels = solarData.filter(p => p.status === 'Online').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Solar Energy ☀️</Text>
            <Text style={styles.headerSubtitle}>Photovoltaic monitoring</Text>
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
            <Text style={styles.summaryUnit}>/{solarData.length}</Text>
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
        {solarData.map((panel) => renderSolarCard(panel))}
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
  bottomSpacer: {
    height: 20,
  },
});

export default SolarScreen; 