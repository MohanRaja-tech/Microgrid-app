import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const isSmallScreen = width < 400;
  const isTablet = width > 768;
  
  const getCardWidth = () => {
    if (isSmallScreen) return '100%';
    if (isTablet) return '23%';
    return '47%';
  };

  const quickStats = [
    { title: 'Total Energy', value: '2,450', unit: 'kWh', icon: 'flash', gradient: ['#6366f1', '#8b5cf6'], bgColor: '#eef2ff' },
    { title: 'Active Meters', value: '4', unit: 'Online', icon: 'speedometer', gradient: ['#10b981', '#34d399'], bgColor: '#ecfdf5' },
    { title: 'Solar Output', value: '850', unit: 'W', icon: 'sunny', gradient: ['#f59e0b', '#fbbf24'], bgColor: '#fffbeb' },
    { title: 'Wind Output', value: '320', unit: 'W', icon: 'leaf', gradient: ['#06b6d4', '#22d3ee'], bgColor: '#ecfeff' },
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
              <Text style={styles.summaryLabel}>Today's Generation</Text>
              <Text style={styles.summaryValue}>1,170 W</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Efficiency</Text>
              <Text style={styles.summaryValue}>94.5%</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>CO₂ Saved</Text>
              <Text style={styles.summaryValue}>12.4 kg</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
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
  bottomSpacer: {
    height: 20,
  },
});

export default HomeScreen; 