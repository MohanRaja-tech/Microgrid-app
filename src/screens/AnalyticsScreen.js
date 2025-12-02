import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AnalyticsService from '../services/AnalyticsService';

const { width } = Dimensions.get('window');

// Custom Calendar Component
const CustomCalendarPicker = ({ visible, onClose, onSelect, selectedDate, title }) => {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [tempDate, setTempDate] = useState(selectedDate || new Date());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate years from 2000 to 2050
  const years = Array.from({ length: 51 }, (_, i) => 2000 + i);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        currentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleYearSelect = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setShowYearPicker(false);
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setShowMonthPicker(false);
  };

  const handleDaySelect = (dayInfo) => {
    if (dayInfo.currentMonth) {
      setTempDate(dayInfo.date);
    } else {
      setViewDate(dayInfo.date);
      setTempDate(dayInfo.date);
    }
  };

  const handleConfirm = () => {
    const finalDate = new Date(
      tempDate.getFullYear(),
      tempDate.getMonth(),
      tempDate.getDate()
    );
    onSelect(finalDate);
    onClose();
  };

  const isSelectedDay = (dayInfo) => {
    if (!tempDate) return false;
    return dayInfo.date.toDateString() === tempDate.toDateString();
  };

  const isToday = (dayInfo) => {
    return dayInfo.date.toDateString() === new Date().toDateString();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={calendarStyles.overlay}>
        <View style={calendarStyles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            style={calendarStyles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={calendarStyles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={calendarStyles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Year & Month Selector */}
          <View style={calendarStyles.monthYearRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={calendarStyles.navBtn}>
              <Ionicons name="chevron-back" size={24} color="#6366f1" />
            </TouchableOpacity>
            
            <View style={calendarStyles.monthYearCenter}>
              <TouchableOpacity 
                onPress={() => { setShowMonthPicker(true); setShowYearPicker(false); }}
                style={calendarStyles.monthYearBtn}
              >
                <Text style={calendarStyles.monthYearText}>
                  {months[viewDate.getMonth()]}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6366f1" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { setShowYearPicker(true); setShowMonthPicker(false); }}
                style={calendarStyles.monthYearBtn}
              >
                <Text style={calendarStyles.monthYearText}>
                  {viewDate.getFullYear()}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6366f1" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={handleNextMonth} style={calendarStyles.navBtn}>
              <Ionicons name="chevron-forward" size={24} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Year Picker Dropdown */}
          {showYearPicker && (
            <View style={calendarStyles.pickerDropdown}>
              <ScrollView style={calendarStyles.pickerScroll} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      calendarStyles.pickerItem,
                      viewDate.getFullYear() === year && calendarStyles.pickerItemSelected
                    ]}
                    onPress={() => handleYearSelect(year)}
                  >
                    <Text style={[
                      calendarStyles.pickerItemText,
                      viewDate.getFullYear() === year && calendarStyles.pickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Month Picker Dropdown */}
          {showMonthPicker && (
            <View style={calendarStyles.pickerDropdown}>
              <ScrollView style={calendarStyles.pickerScroll} showsVerticalScrollIndicator={false}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      calendarStyles.pickerItem,
                      viewDate.getMonth() === index && calendarStyles.pickerItemSelected
                    ]}
                    onPress={() => handleMonthSelect(index)}
                  >
                    <Text style={[
                      calendarStyles.pickerItemText,
                      viewDate.getMonth() === index && calendarStyles.pickerItemTextSelected
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Days of Week Header */}
          <View style={calendarStyles.daysHeader}>
            {daysOfWeek.map((day) => (
              <Text key={day} style={calendarStyles.dayHeaderText}>{day}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={calendarStyles.calendarGrid}>
            {generateCalendarDays().map((dayInfo, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  calendarStyles.dayCell,
                  !dayInfo.currentMonth && calendarStyles.dayCellOther,
                  isSelectedDay(dayInfo) && calendarStyles.dayCellSelected,
                  isToday(dayInfo) && calendarStyles.dayCellToday,
                ]}
                onPress={() => handleDaySelect(dayInfo)}
              >
                <Text style={[
                  calendarStyles.dayText,
                  !dayInfo.currentMonth && calendarStyles.dayTextOther,
                  isSelectedDay(dayInfo) && calendarStyles.dayTextSelected,
                  isToday(dayInfo) && !isSelectedDay(dayInfo) && calendarStyles.dayTextToday,
                ]}>
                  {dayInfo.day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected Date Preview */}
          <View style={calendarStyles.previewSection}>
            <Text style={calendarStyles.previewLabel}>Selected:</Text>
            <Text style={calendarStyles.previewValue}>
              {tempDate ? `${months[tempDate.getMonth()]} ${tempDate.getDate()}, ${tempDate.getFullYear()}` : 'None'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={calendarStyles.actionRow}>
            <TouchableOpacity style={calendarStyles.cancelBtn} onPress={onClose}>
              <Text style={calendarStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={calendarStyles.confirmBtn} onPress={handleConfirm}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={calendarStyles.confirmBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={calendarStyles.confirmBtnText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AnalyticsScreen = () => {
  // State for selections
  const [selectedSource, setSelectedSource] = useState(null); // 'Meter' or 'Solar'
  const [selectedSubOption, setSelectedSubOption] = useState(null); // Line 1/2/3 or Panel 1/2
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  // State for data
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, max: 0, min: 0, total: 0, count: 0 });
  const [error, setError] = useState(null);

  // Options configuration
  const sourceOptions = [
    { id: 'Meter', label: 'Meter', icon: 'speedometer', gradient: ['#6366f1', '#8b5cf6'] },
    { id: 'Solar', label: 'Solar', icon: 'sunny', gradient: ['#f59e0b', '#fbbf24'] },
  ];

  const subOptions = {
    Meter: [
      { id: 'Line 1', label: 'Line 1', icon: 'git-branch' },
      { id: 'Line 2', label: 'Line 2', icon: 'git-branch' },
      { id: 'Line 3', label: 'Line 3', icon: 'git-branch' },
    ],
    Solar: [
      { id: 'Panel 1', label: 'Panel 1', icon: 'sunny' },
      { id: 'Panel 2', label: 'Panel 2', icon: 'sunny' },
    ],
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setSelectedSubOption(null); // Reset sub-option when source changes
    setFromDate(null);
    setToDate(null);
  };

  const handleSubOptionSelect = (option) => {
    setSelectedSubOption(option);
    setFromDate(null);
    setToDate(null);
    setAnalyticsData(null);
    setChartData([]);
    setStats({ avg: 0, max: 0, min: 0, total: 0, count: 0 });
    setError(null);
  };

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!selectedSource || !selectedSubOption || !fromDate || !toDate) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the filter value (1, 2, or 3 for Line, 1 or 2 for Panel)
      const filterValue = selectedSubOption.split(' ')[1]; // "Line 1" -> "1"
      
      // Format dates for API
      const fromDateStr = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
      const toDateStr = `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, '0')}-${String(toDate.getDate()).padStart(2, '0')}`;

      console.log('Fetching data:', { selectedSource, filterValue, fromDateStr, toDateStr });

      const response = await AnalyticsService.fetchAnalyticsData(
        selectedSource,
        filterValue,
        fromDateStr,
        toDateStr
      );

      console.log('Response:', response);

      if (response.success && response.data) {
        setAnalyticsData(response.data);
        
        // Process data for chart
        const processed = AnalyticsService.processDataForChart(response.data, selectedSource);
        setChartData(processed.chartData);
        setStats(processed.stats);
      } else {
        setError(response.message || 'Failed to fetch data');
        Alert.alert('Error', response.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Connection error');
      Alert.alert('Connection Error', 'Unable to connect to the server. Make sure the analytics server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when all selections are made
  useEffect(() => {
    if (selectedSource && selectedSubOption && fromDate && toDate) {
      fetchAnalyticsData();
    }
  }, [fromDate, toDate]);

  const formatDate = (date) => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const canShowGraph = selectedSource && selectedSubOption && fromDate && toDate;

  // Calculate bar heights based on actual data
  const getBarData = () => {
    if (chartData.length === 0) {
      return [
        { label: 'No', value: 0 },
        { label: 'Data', value: 0 },
        { label: 'Yet', value: 0 },
      ];
    }

    // Get up to 7 data points for display
    const maxPoints = 7;
    const step = Math.max(1, Math.floor(chartData.length / maxPoints));
    const displayData = [];
    
    for (let i = 0; i < chartData.length && displayData.length < maxPoints; i += step) {
      const item = chartData[i];
      displayData.push({
        label: item.label || String(i + 1),
        value: item.value || 0,
      });
    }
    
    return displayData;
  };

  const barData = getBarData();
  const maxValue = Math.max(...barData.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#6366f1']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Analytics 📊</Text>
            <Text style={styles.headerSubtitle}>View historical data trends</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="bar-chart" size={24} color="rgba(255,255,255,0.3)" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Step 1: Source Selection */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Select Data Source</Text>
          </View>
          
          <View style={styles.optionsRow}>
            {sourceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sourceCard,
                  selectedSource === option.id && styles.sourceCardSelected,
                ]}
                onPress={() => handleSourceSelect(option.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={selectedSource === option.id ? option.gradient : ['#f1f5f9', '#f1f5f9']}
                  style={styles.sourceIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={selectedSource === option.id ? '#ffffff' : option.gradient[0]} 
                  />
                </LinearGradient>
                <Text style={[
                  styles.sourceLabel,
                  selectedSource === option.id && styles.sourceLabelSelected
                ]}>
                  {option.label}
                </Text>
                {selectedSource === option.id && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2: Sub-option Selection (Conditional) */}
        {selectedSource && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepTitle}>
                Select {selectedSource === 'Meter' ? 'Line' : 'Panel'}
              </Text>
            </View>
            
            <View style={styles.subOptionsContainer}>
              {subOptions[selectedSource].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.subOptionCard,
                    selectedSubOption === option.id && styles.subOptionCardSelected,
                  ]}
                  onPress={() => handleSubOptionSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.subOptionIcon,
                    selectedSubOption === option.id && styles.subOptionIconSelected
                  ]}>
                    <Ionicons 
                      name={option.icon} 
                      size={18} 
                      color={selectedSubOption === option.id ? '#ffffff' : '#6366f1'} 
                    />
                  </View>
                  <Text style={[
                    styles.subOptionLabel,
                    selectedSubOption === option.id && styles.subOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  {selectedSubOption === option.id && (
                    <Ionicons name="checkmark" size={18} color="#6366f1" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Date Range Selection */}
        {selectedSubOption && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Select Date Range</Text>
            </View>
            
            <View style={styles.dateContainer}>
              {/* From Date */}
              <View style={styles.datePickerWrapper}>
                <Text style={styles.dateLabel}>From Date</Text>
                <TouchableOpacity
                  style={[styles.dateInput, fromDate && styles.dateInputSelected]}
                  onPress={() => setShowFromDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={fromDate ? '#6366f1' : '#94a3b8'} />
                  <Text style={[styles.dateText, fromDate && styles.dateTextSelected]} numberOfLines={2}>
                    {fromDate ? formatDate(fromDate) : 'Tap to select'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* To Date */}
              <View style={styles.datePickerWrapper}>
                <Text style={styles.dateLabel}>To Date</Text>
                <TouchableOpacity
                  style={[styles.dateInput, toDate && styles.dateInputSelected]}
                  onPress={() => setShowToDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={toDate ? '#6366f1' : '#94a3b8'} />
                  <Text style={[styles.dateText, toDate && styles.dateTextSelected]} numberOfLines={2}>
                    {toDate ? formatDate(toDate) : 'Tap to select'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendar Pickers */}
            <CustomCalendarPicker
              visible={showFromDatePicker}
              onClose={() => setShowFromDatePicker(false)}
              onSelect={(date) => setFromDate(date)}
              selectedDate={fromDate}
              title="Select Start Date"
            />
            <CustomCalendarPicker
              visible={showToDatePicker}
              onClose={() => setShowToDatePicker(false)}
              onSelect={(date) => setToDate(date)}
              selectedDate={toDate}
              title="Select End Date"
            />
          </View>
        )}

        {/* Step 4: Graph Placeholder */}
        {canShowGraph && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Data Visualization</Text>
              {isLoading && <ActivityIndicator size="small" color="#6366f1" style={{ marginLeft: 10 }} />}
            </View>

            {/* Selection Summary */}
            <View style={styles.selectionSummary}>
              <View style={styles.summaryItem}>
                <Ionicons name="server-outline" size={16} color="#6366f1" />
                <Text style={styles.summaryText}>{selectedSource} - {selectedSubOption}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={16} color="#6366f1" />
                <Text style={styles.summaryText}>{formatDate(fromDate)} → {formatDate(toDate)}</Text>
              </View>
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchAnalyticsData}>
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Fetching data from database...</Text>
              </View>
            )}
            
            {/* Graph Container */}
            {!isLoading && !error && (
              <View style={styles.graphContainer}>
                <View style={styles.graphHeader}>
                  <Text style={styles.graphTitle}>Power Consumption (W)</Text>
                  <View style={styles.dataCountBadge}>
                    <Ionicons name="analytics" size={12} color="#6366f1" />
                    <Text style={styles.dataCountText}>{stats.count} readings</Text>
                  </View>
                </View>

                {/* Dynamic Graph Bars */}
                <View style={styles.graphArea}>
                  <View style={styles.yAxis}>
                    <Text style={styles.axisLabel}>{maxValue.toFixed(0)}</Text>
                    <Text style={styles.axisLabel}>{(maxValue * 0.75).toFixed(0)}</Text>
                    <Text style={styles.axisLabel}>{(maxValue * 0.5).toFixed(0)}</Text>
                    <Text style={styles.axisLabel}>{(maxValue * 0.25).toFixed(0)}</Text>
                    <Text style={styles.axisLabel}>0</Text>
                  </View>
                  <View style={styles.barsContainer}>
                    {barData.map((item, index) => {
                      const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                      return (
                        <View key={index} style={styles.barWrapper}>
                          <Text style={styles.barValue}>{item.value.toFixed(1)}</Text>
                          <LinearGradient
                            colors={selectedSource === 'Meter' ? ['#6366f1', '#8b5cf6'] : ['#f59e0b', '#fbbf24']}
                            style={[styles.bar, { height: `${Math.max(heightPercent, 2)}%` }]}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 0, y: 0 }}
                          />
                          <Text style={styles.barLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Graph Footer - Statistics */}
                <View style={styles.graphFooter}>
                  <View style={styles.graphStat}>
                    <Text style={styles.graphStatLabel}>Peak</Text>
                    <Text style={styles.graphStatValue}>{stats.max.toFixed(2)} W</Text>
                  </View>
                  <View style={styles.graphStat}>
                    <Text style={styles.graphStatLabel}>Average</Text>
                    <Text style={styles.graphStatValue}>{stats.avg.toFixed(2)} W</Text>
                  </View>
                  <View style={styles.graphStat}>
                    <Text style={styles.graphStatLabel}>Minimum</Text>
                    <Text style={styles.graphStatValue}>{stats.min.toFixed(2)} W</Text>
                  </View>
                </View>

                {/* Data Status Badge */}
                {chartData.length > 0 ? (
                  <View style={styles.dataBadgeContainer}>
                    <View style={styles.dataBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={styles.dataBadgeText}>Live data from PostgreSQL</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.dataBadgeContainer}>
                    <View style={[styles.dataBadge, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="information-circle" size={14} color="#f59e0b" />
                      <Text style={[styles.dataBadgeText, { color: '#f59e0b' }]}>No data for selected period</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Refresh Button */}
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={fetchAnalyticsData}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.refreshBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="refresh" size={18} color="#ffffff" />
                <Text style={styles.refreshBtnText}>Refresh Data</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Export Buttons (UI Only) */}
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7}>
                <Ionicons name="download-outline" size={18} color="#6366f1" />
                <Text style={styles.exportBtnText}>Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7}>
                <Ionicons name="share-outline" size={18} color="#6366f1" />
                <Text style={styles.exportBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    alignItems: 'center',
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
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sourceCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#faf5ff',
  },
  sourceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sourceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  sourceLabelSelected: {
    color: '#6366f1',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  subOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  subOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginVertical: 2,
  },
  subOptionCardSelected: {
    backgroundColor: '#eef2ff',
  },
  subOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subOptionIconSelected: {
    backgroundColor: '#6366f1',
  },
  subOptionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  subOptionLabelSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  dateInputSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#faf5ff',
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 10,
  },
  dateTextSelected: {
    color: '#1e293b',
    fontWeight: '500',
  },
  dateDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  dateOption: {
    padding: 12,
    borderRadius: 8,
  },
  dateOptionSelected: {
    backgroundColor: '#eef2ff',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#475569',
  },
  dateOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  selectionSummary: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 6,
  },
  graphContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  graphLegend: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  graphArea: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  axisLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingLeft: 10,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 28,
    borderRadius: 6,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  graphFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  graphStat: {
    alignItems: 'center',
  },
  graphStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 4,
  },
  graphStatValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '700',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  placeholderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  placeholderText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '500',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    marginLeft: 10,
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  dataCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dataCountText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 4,
  },
  barValue: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  dataBadgeContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  dataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dataBadgeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 6,
  },
  refreshBtn: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  refreshBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  refreshBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  exportBtnText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});

// Calendar Picker Styles
const calendarStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 4,
  },
  pickerDropdown: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
    maxHeight: 250,
  },
  pickerScroll: {
    padding: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: '#eef2ff',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dayCellOther: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  dayTextOther: {
    color: '#94a3b8',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#6366f1',
    fontWeight: '700',
  },
  previewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#faf5ff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginRight: 8,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
});

export default AnalyticsScreen;
