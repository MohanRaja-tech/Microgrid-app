import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TicketsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTicket, setNewTicket] = useState({
    description: '',
    priority: 'Medium',
  });

  const [tickets, setTickets] = useState([
    { id: 'TKT001', description: 'Meter 2 showing inconsistent power factor readings', status: 'Open', priority: 'High', dateTime: '2024-01-15 14:30', assignedTo: 'John Smith' },
    { id: 'TKT002', description: 'Solar Panel Array 3 efficiency dropped below 15%', status: 'In Progress', priority: 'Medium', dateTime: '2024-01-14 09:15', assignedTo: 'Sarah Johnson' },
    { id: 'TKT003', description: 'Wind Turbine 4 requires scheduled maintenance', status: 'Resolved', priority: 'Low', dateTime: '2024-01-12 16:45', assignedTo: 'Mike Davis' },
    { id: 'TKT004', description: 'Dashboard not loading real-time data for Meter 1', status: 'Open', priority: 'High', dateTime: '2024-01-15 11:20', assignedTo: 'Lisa Wilson' },
    { id: 'TKT005', description: 'Request for additional monitoring parameters', status: 'In Progress', priority: 'Low', dateTime: '2024-01-13 13:00', assignedTo: 'Tom Brown' },
  ]);

  const statusConfig = {
    'Open': { bg: '#fef2f2', color: '#ef4444', icon: 'alert-circle' },
    'In Progress': { bg: '#fffbeb', color: '#f59e0b', icon: 'time' },
    'Resolved': { bg: '#ecfdf5', color: '#10b981', icon: 'checkmark-circle' },
  };

  const priorityConfig = {
    'High': { bg: '#fef2f2', color: '#ef4444', gradient: ['#ef4444', '#f87171'] },
    'Medium': { bg: '#fffbeb', color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] },
    'Low': { bg: '#ecfdf5', color: '#10b981', gradient: ['#10b981', '#34d399'] },
  };

  const handleCreateTicket = () => {
    if (!newTicket.description.trim()) {
      Alert.alert('Error', 'Please enter a description for the ticket.');
      return;
    }

    const ticket = {
      id: `TKT${String(tickets.length + 1).padStart(3, '0')}`,
      description: newTicket.description,
      status: 'Open',
      priority: newTicket.priority,
      dateTime: new Date().toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).replace(',', ''),
      assignedTo: 'Auto-assigned',
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({ description: '', priority: 'Medium' });
    setModalVisible(false);
    Alert.alert('Success', 'Ticket created successfully!');
  };

  const renderTicketCard = (ticket) => {
    const status = statusConfig[ticket.status];
    const priority = priorityConfig[ticket.priority];

    return (
      <TouchableOpacity key={ticket.id} style={styles.ticketCard} activeOpacity={0.7}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketIdRow}>
            <View style={[styles.ticketIdBadge, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="receipt-outline" size={14} color="#6366f1" />
              <Text style={styles.ticketId}>{ticket.id}</Text>
            </View>
          </View>
          <View style={styles.badgesRow}>
            <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
              <View style={[styles.priorityDot, { backgroundColor: priority.color }]} />
              <Text style={[styles.priorityText, { color: priority.color }]}>{ticket.priority}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{ticket.status}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.ticketDescription}>{ticket.description}</Text>

        <View style={styles.ticketFooter}>
          <View style={styles.ticketMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{ticket.dateTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color="#94a3b8" />
              <Text style={styles.metaText}>{ticket.assignedTo}</Text>
            </View>
          </View>
          <View style={styles.viewMoreBtn}>
            <Ionicons name="chevron-forward" size={18} color="#6366f1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ec4899', '#be185d']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Support Tickets 🎫</Text>
            <Text style={styles.headerSubtitle}>Track and manage requests</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={22} color="#ec4899" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <Ionicons name="alert-circle" size={18} color="#ffffff" />
            </View>
            <Text style={styles.summaryValue}>{openTickets}</Text>
            <Text style={styles.summaryLabel}>Open</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]}>
              <Ionicons name="time" size={18} color="#ffffff" />
            </View>
            <Text style={styles.summaryValue}>{inProgressTickets}</Text>
            <Text style={styles.summaryLabel}>In Progress</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            </View>
            <Text style={styles.summaryValue}>{resolvedTickets}</Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tickets.map((ticket) => renderTicketCard(ticket))}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Ticket</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the issue..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={4}
                value={newTicket.description}
                onChangeText={(text) => setNewTicket({...newTicket, description: text})}
              />

              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.priorityContainer}>
                {['High', 'Medium', 'Low'].map((priority) => {
                  const config = priorityConfig[priority];
                  const isSelected = newTicket.priority === priority;
                  return (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        isSelected && { backgroundColor: config.bg, borderColor: config.color }
                      ]}
                      onPress={() => setNewTicket({...newTicket, priority})}
                    >
                      <View style={[
                        styles.priorityRadio,
                        isSelected && { backgroundColor: config.color, borderColor: config.color }
                      ]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                      </View>
                      <Text style={[
                        styles.priorityOptionText,
                        isSelected && { color: config.color, fontWeight: '600' }
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.submitButton}
                  onPress={handleCreateTicket}
                >
                  <LinearGradient
                    colors={['#ec4899', '#be185d']}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add" size={18} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Create Ticket</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ticketId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginLeft: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
    marginBottom: 14,
    fontWeight: '400',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  ticketMeta: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
  viewMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {},
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 20,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#f8fafc',
  },
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  priorityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  priorityOptionText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitButtonText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default TicketsScreen; 