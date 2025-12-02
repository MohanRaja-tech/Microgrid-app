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

const WindScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const windData = [
    { id: 1, name: 'Wind Turbine 1', voltage: 24.5, current: 13.1, power: 320, windSpeed: 12.5, direction: 'NW', efficiency: 85.2, rotorSpeed: 28, status: 'Online' },
    { id: 2, name: 'Wind Turbine 2', voltage: 23.8, current: 12.4, power: 295, windSpeed: 11.8, direction: 'W', efficiency: 82.7, rotorSpeed: 26, status: 'Online' },
    { id: 3, name: 'Wind Turbine 3', voltage: 25.2, current: 14.2, power: 358, windSpeed: 14.2, direction: 'NW', efficiency: 88.5, rotorSpeed: 32, status: 'Online' },
    { id: 4, name: 'Wind Turbine 4', voltage: 0, current: 0, power: 0, windSpeed: 8.5, direction: 'N', efficiency: 0, rotorSpeed: 0, status: 'Maintenance' },
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
    windSpeed: { icon: 'leaf', gradient: ['#06b6d4', '#22d3ee'], bgColor: '#ecfeff' },
    direction: { icon: 'compass', gradient: ['#8b5cf6', '#a78bfa'], bgColor: '#f5f3ff' },
    rotorSpeed: { icon: 'refresh-circle', gradient: ['#f97316', '#fb923c'], bgColor: '#fff7ed' },
  };

  const getWindSpeedCategory = (speed) => {
    if (speed < 5) return { label: 'Low', color: '#10b981' };
    if (speed < 12) return { label: 'Moderate', color: '#f59e0b' };
    if (speed < 20) return { label: 'High', color: '#06b6d4' };
    return { label: 'Very High', color: '#ef4444' };
  };

  const renderWindCard = (turbine) => {
    const windCategory = getWindSpeedCategory(turbine.windSpeed);
    const parameters = [
      { key: 'voltage', label: 'Voltage', value: `${turbine.voltage}`, unit: 'V' },
      { key: 'current', label: 'Current', value: `${turbine.current}`, unit: 'A' },
      { key: 'power', label: 'Power', value: `${turbine.power}`, unit: 'W' },
      { key: 'windSpeed', label: 'Wind Speed', value: `${turbine.windSpeed}`, unit: 'm/s' },
      { key: 'direction', label: 'Direction', value: turbine.direction, unit: '' },
      { key: 'rotorSpeed', label: 'Rotor', value: `${turbine.rotorSpeed}`, unit: 'RPM' },
    ];

    return (
      <View key={turbine.id} style={styles.windCard}>
        <LinearGradient
          colors={['#06b6d4', '#0891b2']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="leaf" size={22} color="#06b6d4" />
              </View>
              <View>
                <Text style={styles.turbineTitle}>{turbine.name}</Text>
                <Text style={styles.turbineSubtitle}>Wind Power System</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#ffffff' }]} />
              <Text style={styles.statusText}>{turbine.status}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.parametersContainer}>
          {/* Wind Speed Highlight */}
          <View style={styles.windSpeedHighlight}>
            <View style={styles.windSpeedLeft}>
              <View style={styles.windIconLarge}>
                <Ionicons name="leaf" size={28} color="#06b6d4" />
              </View>
              <View>
                <Text style={styles.windSpeedLabel}>Wind Speed</Text>
                <View style={styles.windSpeedValueRow}>
                  <Text style={styles.windSpeedValue}>{turbine.windSpeed}</Text>
                  <Text style={styles.windSpeedUnit}>m/s</Text>
                </View>
              </View>
            </View>
            <View style={styles.windSpeedRight}>
              <View style={[styles.categoryBadge, { backgroundColor: windCategory.color + '20' }]}>
                <Text style={[styles.categoryText, { color: windCategory.color }]}>{windCategory.label}</Text>
              </View>
              <Text style={styles.directionText}>Direction: {turbine.direction}</Text>
            </View>
          </View>

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

          <View style={styles.efficiencyContainer}>
            <View style={styles.efficiencyHeader}>
              <Ionicons name="analytics" size={18} color="#06b6d4" />
              <Text style={styles.efficiencyTitle}>Turbine Efficiency</Text>
            </View>
            <View style={styles.efficiencyBarContainer}>
              <View style={styles.efficiencyBar}>
                <LinearGradient
                  colors={['#06b6d4', '#22d3ee']}
                  style={[styles.efficiencyFill, { width: `${turbine.efficiency}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.efficiencyPercent}>{turbine.efficiency}%</Text>
            </View>
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
      <LinearGradient
        colors={['#06b6d4', '#0891b2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Wind Energy 🍃</Text>
            <Text style={styles.headerSubtitle}>Turbine monitoring system</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#06b6d4" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalPower}</Text>
            <Text style={styles.summaryUnit}>W</Text>
            <Text style={styles.summaryLabel}>Total Power</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{avgWindSpeed}</Text>
            <Text style={styles.summaryUnit}>m/s</Text>
            <Text style={styles.summaryLabel}>Avg Wind</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{activeTurbines}</Text>
            <Text style={styles.summaryUnit}>/{windData.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#06b6d4']} />
        }
      >
        {windData.map((turbine) => renderWindCard(turbine))}
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
  windCard: {
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
  turbineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  turbineSubtitle: {
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
  windSpeedHighlight: {
    flexDirection: 'row',
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  windSpeedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  windIconLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#cffafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  windSpeedLabel: {
    fontSize: 11,
    color: '#0e7490',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  windSpeedValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  windSpeedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#06b6d4',
    letterSpacing: -1,
  },
  windSpeedUnit: {
    fontSize: 14,
    color: '#0891b2',
    fontWeight: '500',
    marginLeft: 4,
  },
  windSpeedRight: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  directionText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
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
  efficiencyContainer: {
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    padding: 14,
  },
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  efficiencyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0e7490',
    marginLeft: 8,
  },
  efficiencyBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  efficiencyBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#cffafe',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  efficiencyFill: {
    height: '100%',
    borderRadius: 4,
  },
  efficiencyPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#06b6d4',
    minWidth: 40,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default WindScreen; 