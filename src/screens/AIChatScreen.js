import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  Modal,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://192.168.43.147:5000';

const AIChatScreen = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisQuestion, setAnalysisQuestion] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard listener to hide tab bar when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        navigation.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
            display: 'flex',
          }
        });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  useEffect(() => {
    checkHealth();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setStartTime('00:00');
    setEndTime('23:59');
  }, []);

  const handleStartDateChange = (newDate) => {
    setStartDate(newDate);
    if (newDate === endDate) {
      setStartTime('00:00');
      setEndTime('23:59');
    }
  };

  const handleEndDateChange = (newDate) => {
    setEndDate(newDate);
    if (newDate === startDate) {
      setStartTime('00:00');
      setEndTime('23:59');
    }
  };

  const checkHealth = async () => {
    try {
      const response = await fetch('http://192.168.43.147:5000/api/health');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      setSystemStatus({ status: 'Backend Offline', database: 'Unknown', ollama_server: 'Unknown' });
    }
  };

  const fetchDateRangeAnalysis = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setIsAnalyzing(true);
    try {
      const fullStartDate = `${startDate}T${startTime}`;
      const fullEndDate = `${endDate}T${endTime}`;
      
      const response = await fetch('http://192.168.43.147:5000/api/date-range-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: fullStartDate,
          end_date: fullEndDate,
          question: analysisQuestion
        }),
      });

      const data = await response.json();
      
      const dateDisplay = startDate === endDate 
        ? `${new Date(startDate).toLocaleDateString()} (${startTime} - ${endTime})`
        : `${new Date(startDate).toLocaleDateString()} ${startTime} to ${new Date(endDate).toLocaleDateString()} ${endTime}`;
      
      setMessages(prev => [...prev, {
        type: 'analysis',
        content: `📅 Analysis for ${dateDisplay}${analysisQuestion ? ` - "${analysisQuestion}"` : ''}`,
        analysisData: data
      }]);
      
    } catch (error) {
      console.error('Date range analysis error:', error);
      alert('Failed to fetch date range analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.43.147:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: data.response,
        meterData: data.meter_data,
        solarData: data.solar_data,
        gridStatus: data.grid_status,
        historicalData: data.historical_data
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Error: Could not connect to the server. Make sure the backend is running on port 5000.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const setQuickRange = (type) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 5);

    switch (type) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        setStartTime('00:00');
        setEndTime('23:59');
        break;
      case '1hour':
        const pastTime1h = new Date(now.getTime() - 1 * 60 * 60 * 1000).toTimeString().slice(0, 5);
        setStartDate(today);
        setEndDate(today);
        setStartTime(pastTime1h);
        setEndTime(currentTime);
        break;
      case '6hours':
        const past6h = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        setStartDate(past6h.toISOString().slice(0, 10));
        setEndDate(today);
        setStartTime(past6h.toTimeString().slice(0, 5));
        setEndTime(currentTime);
        break;
      case '24hours':
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        setStartDate(past24h.toISOString().slice(0, 10));
        setEndDate(today);
        setStartTime(past24h.toTimeString().slice(0, 5));
        setEndTime(currentTime);
        break;
      case '7days':
        const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(past7d.toISOString().slice(0, 10));
        setEndDate(today);
        setStartTime('00:00');
        setEndTime('23:59');
        break;
    }
  };

  const renderDataCard = (item, type, idx) => {
    const isSolar = type === 'solar';
    const isPeak = type === 'peak';
    const isLow = type === 'low';
    const isStats = type === 'stats';

    return (
      <View key={idx} style={[
        styles.dataCard,
        isSolar && styles.solarCard,
        isPeak && styles.peakCard,
        isLow && styles.lowCard,
        isStats && styles.statsCard
      ]}>
        <Text style={styles.cardTitle}>
          {isStats ? `Meter ${item.meter_id}` : 
           isPeak ? `Meter ${item.meter_id} - PEAK` :
           isLow ? `Meter ${item.meter_id} - LOW` :
           isSolar ? `Panel ${item.panel_id}` : `Meter ${item.meter_id}`}
        </Text>
        {isStats ? (
          <>
            <Text style={styles.cardText}>Readings: {item.total_readings}</Text>
            <Text style={styles.cardText}>Avg Power: {item.avg_power}W</Text>
            <Text style={styles.cardText}>Max Power: {item.max_power}W</Text>
            <Text style={styles.cardText}>Min Power: {item.min_power}W</Text>
            <Text style={styles.cardText}>Avg Voltage: {item.avg_voltage}V</Text>
            <Text style={styles.cardText}>Avg PF: {item.avg_pf}</Text>
          </>
        ) : isPeak || isLow ? (
          <>
            <Text style={styles.cardText}>🕐 {formatTime(item.time)}</Text>
            <Text style={styles.cardText}>⚡ {item.power.toFixed(1)}W</Text>
          </>
        ) : (
          <>
            <Text style={styles.cardText}>⚡ {item.voltage.toFixed(1)}V</Text>
            <Text style={styles.cardText}>🔌 {item.current.toFixed(2)}A</Text>
            <Text style={styles.cardText}>💡 {item.power.toFixed(1)}W</Text>
            {item.pf && <Text style={styles.cardText}>📈 PF: {item.pf.toFixed(2)}</Text>}
            <Text style={styles.cardText}>🔧 {item.state}</Text>
            {item.timestamp && <Text style={styles.timestamp}>🕐 {formatTime(item.timestamp)}</Text>}
          </>
        )}
      </View>
    );
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.type === 'user';
    const isAI = msg.type === 'ai';
    const isError = msg.type === 'error';
    const isAnalysis = msg.type === 'analysis';

    return (
      <View key={index} style={[styles.messageRow, isUser && styles.userMessageRow]}>
        {/* Avatar */}
        {!isUser && (
          <View style={[styles.avatar, isError && styles.errorAvatar]}>
            <Ionicons 
              name={isError ? "warning" : "flash"} 
              size={20} 
              color="#fff" 
            />
          </View>
        )}
        
        <View style={[styles.messageContent, isUser && styles.userMessageContent]}>
          {/* Sender Label */}
          <Text style={[styles.senderLabel, isUser && styles.userSenderLabel]}>
            {isUser ? 'You' : isError ? 'Error' : 'Microgrid AI'}
          </Text>
          
          {/* Message Text */}
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {msg.content}
          </Text>

          {/* Alerts */}
          {msg.gridStatus?.alerts?.length > 0 && (
            <View style={styles.alertsContainer}>
              {msg.gridStatus.alerts.map((alert, idx) => (
                <View key={idx} style={styles.alertBadge}>
                  <Ionicons name="alert-circle" size={14} color="#fff" />
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Analysis Results */}
          {isAnalysis && msg.analysisData && (
            <View style={styles.analysisResults}>
              {msg.analysisData.insights?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="bulb" size={18} color="#10b981" />
                    <Text style={styles.sectionTitle}>Insights</Text>
                  </View>
                  {msg.analysisData.insights.map((insight, idx) => (
                    <Text key={idx} style={styles.insightText}>{insight}</Text>
                  ))}
                </View>
              )}
              
              {msg.analysisData.recommendations?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="construct" size={18} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                  </View>
                  {msg.analysisData.recommendations.map((rec, idx) => (
                    <Text key={idx} style={styles.recommendationText}>{rec}</Text>
                  ))}
                </View>
              )}
              
              {msg.analysisData.peak_times?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="trending-up" size={18} color="#ef4444" />
                    <Text style={styles.sectionTitle}>Peak Consumption</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {msg.analysisData.peak_times.map((peak, idx) => renderDataCard(peak, 'peak', idx))}
                  </ScrollView>
                </View>
              )}
              
              {msg.analysisData.low_times?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="trending-down" size={18} color="#22c55e" />
                    <Text style={styles.sectionTitle}>Low Consumption</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {msg.analysisData.low_times.map((low, idx) => renderDataCard(low, 'low', idx))}
                  </ScrollView>
                </View>
              )}
              
              {msg.analysisData.meter_analysis?.statistics && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="stats-chart" size={18} color="#6366f1" />
                    <Text style={styles.sectionTitle}>Statistics</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {msg.analysisData.meter_analysis.statistics.map((stat, idx) => renderDataCard(stat, 'stats', idx))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Meter Data */}
          {msg.meterData?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="speedometer" size={18} color="#6366f1" />
                <Text style={styles.sectionTitle}>Meter Data</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {msg.meterData.map((meter, idx) => renderDataCard(meter, 'meter', idx))}
              </ScrollView>
            </View>
          )}
          
          {/* Solar Data */}
          {msg.solarData?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sunny" size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Solar Panels</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {msg.solarData.map((panel, idx) => renderDataCard(panel, 'solar', idx))}
              </ScrollView>
            </View>
          )}

          {/* Timestamp */}
          <Text style={styles.messageTime}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* User Avatar */}
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Ionicons name="menu" size={24} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.modelSelector}>
            <Ionicons name="flash" size={18} color="#10b981" />
            <Text style={styles.modelText}>Microgrid AI</Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => setMessages([])}
        >
          <Ionicons name="create-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, systemStatus?.database === 'Connected' && styles.statusOnline]} />
        <Text style={styles.statusText}>
          {systemStatus?.database === 'Connected' ? 'Connected' : 'Connecting...'}
        </Text>
        <TouchableOpacity 
          style={styles.dateAnalysisBtn}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons name="calendar" size={16} color="#6366f1" />
          <Text style={styles.dateAnalysisBtnText}>Date Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Date Range Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Date Range Analysis</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.analysisInput}
              placeholder="What do you want to analyze?"
              placeholderTextColor="#6b7280"
              value={analysisQuestion}
              onChangeText={setAnalysisQuestion}
            />
            
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={startDate}
                  onChangeText={handleStartDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
                <TextInput
                  style={styles.timeInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#6b7280"
                />
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={endDate}
                  onChangeText={handleEndDateChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
                <TextInput
                  style={styles.timeInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>
            
            <View style={styles.quickRanges}>
              {['Today', '1 Hour', '6 Hours', '24 Hours', '7 Days'].map((label, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={styles.quickBtn} 
                  onPress={() => setQuickRange(['today', '1hour', '6hours', '24hours', '7days'][idx])}
                >
                  <Text style={styles.quickBtnText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
              onPress={() => {
                fetchDateRangeAnalysis();
                setShowDatePicker(false);
              }}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analyze Period</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Ionicons name="flash" size={48} color="#10b981" />
              </View>
              <Text style={styles.welcomeTitle}>Microgrid AI Assistant</Text>
              <Text style={styles.welcomeSubtitle}>Your intelligent energy management companion</Text>
              
              <View style={styles.suggestionGrid}>
                {[
                  { icon: 'speedometer', text: 'Current power status', color: '#6366f1' },
                  { icon: 'sunny', text: 'Solar panel output', color: '#f59e0b' },
                  { icon: 'trending-up', text: 'Peak consumption times', color: '#ef4444' },
                  { icon: 'analytics', text: 'Energy efficiency tips', color: '#10b981' },
                ].map((item, idx) => (
                  <TouchableOpacity 
                    key={idx}
                    style={styles.suggestionCard}
                    onPress={() => {
                      setInputMessage(item.text === 'Current power status' 
                        ? 'What is the current power consumption?'
                        : item.text === 'Solar panel output'
                        ? 'Show me the solar panel performance'
                        : item.text === 'Peak consumption times'
                        ? 'When are the peak consumption times?'
                        : 'Give me energy efficiency recommendations');
                    }}
                  >
                    <Ionicons name={item.icon} size={24} color={item.color} />
                    <Text style={styles.suggestionText}>{item.text}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6b7280" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {messages.map((msg, index) => renderMessage(msg, index))}
          
          {isLoading && (
            <View style={styles.messageRow}>
              <View style={styles.avatar}>
                <Ionicons name="flash" size={20} color="#fff" />
              </View>
              <View style={styles.messageContent}>
                <Text style={styles.senderLabel}>Microgrid AI</Text>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Message Microgrid AI..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={2000}
              editable={!isLoading}
              textAlignVertical="center"
              selectionColor="#6366f1"
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              <Ionicons 
                name="arrow-up" 
                size={20} 
                color={inputMessage.trim() && !isLoading ? '#fff' : '#6b7280'} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>
            AI can make mistakes. Verify important energy data.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Side Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.sideMenu}>
            <View style={styles.menuHeader}>
              <Ionicons name="flash" size={32} color="#10b981" />
              <Text style={styles.menuTitle}>Microgrid AI</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMessages([]);
                setShowMenu(false);
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.menuItemText}>New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={22} color="#fff" />
              <Text style={styles.menuItemText}>Date Analysis</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>System Status</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusIndicator, systemStatus?.database === 'Connected' && styles.statusGreen]} />
                <Text style={styles.statusLabel}>Database: {systemStatus?.database || 'Checking...'}</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusIndicator, systemStatus?.ollama_server === 'Connected' && styles.statusGreen]} />
                <Text style={styles.statusLabel}>LLM: {systemStatus?.ollama_server || 'Checking...'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 44 : 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modelText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  newChatButton: {
    padding: 8,
  },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  statusOnline: {
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#64748b',
    fontSize: 12,
  },
  dateAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    marginLeft: 'auto',
  },
  dateAnalysisBtnText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#2f2f2f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  analysisInput: {
    backgroundColor: '#424242',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#525252',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: '#9ca3af',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: '#424242',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#525252',
  },
  timeInput: {
    backgroundColor: '#424242',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#525252',
  },
  quickRanges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    backgroundColor: '#424242',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#525252',
  },
  quickBtnText: {
    color: '#fff',
    fontSize: 13,
  },
  analyzeBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  analyzeBtnDisabled: {
    backgroundColor: '#4b5563',
  },
  analyzeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center',
  },
  suggestionGrid: {
    width: '100%',
    gap: 10,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
  },

  // Message Styles
  messageRow: {
    flexDirection: 'row',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorAvatar: {
    backgroundColor: '#ef4444',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  messageContent: {
    flex: 1,
    maxWidth: width - 100,
  },
  userMessageContent: {
    alignItems: 'flex-end',
  },
  senderLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userSenderLabel: {
    textAlign: 'right',
  },
  messageText: {
    color: '#1e293b',
    fontSize: 15,
    lineHeight: 24,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userMessageText: {
    backgroundColor: '#6366f1',
    color: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderWidth: 0,
  },
  messageTime: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },

  // Alerts
  alertsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  alertText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Analysis Results
  analysisResults: {
    marginTop: 12,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  insightText: {
    color: '#10b981',
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#10b981',
  },
  recommendationText: {
    color: '#f59e0b',
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#f59e0b',
  },

  // Data Cards
  dataCard: {
    backgroundColor: '#424242',
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#525252',
  },
  solarCard: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  peakCard: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  lowCard: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statsCard: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  cardTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
    fontSize: 14,
  },
  cardText: {
    color: '#d1d5db',
    fontSize: 13,
    marginBottom: 4,
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 6,
  },

  // Input Area
  inputWrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
    maxHeight: 100,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  disclaimer: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },

  // Side Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  sideMenu: {
    width: width * 0.75,
    maxWidth: 300,
    backgroundColor: '#171717',
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingHorizontal: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    marginBottom: 10,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2f2f2f',
    marginVertical: 16,
  },
  menuSection: {
    paddingHorizontal: 12,
  },
  menuSectionTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
  },
  statusGreen: {
    backgroundColor: '#10b981',
  },
  statusLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
});

export default AIChatScreen;
