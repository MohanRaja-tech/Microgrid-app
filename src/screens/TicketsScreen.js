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
    {
      id: 'TKT001',
      description: 'Meter 2 showing inconsistent power factor readings',
      status: 'Open',
      priority: 'High',
      dateTime: '2024-01-15 14:30',
      assignedTo: 'John Smith',
    },
    {
      id: 'TKT002',
      description: 'Solar Panel Array 3 efficiency dropped below 15%',
      status: 'In Progress',
      priority: 'Medium',
      dateTime: '2024-01-14 09:15',
      assignedTo: 'Sarah Johnson',
    },
    {
      id: 'TKT003',
      description: 'Wind Turbine 4 requires scheduled maintenance',
      status: 'Resolved',
      priority: 'Low',
      dateTime: '2024-01-12 16:45',
      assignedTo: 'Mike Davis',
    },
    {
      id: 'TKT004',
      description: 'Dashboard not loading real-time data for Meter 1',
      status: 'Open',
      priority: 'High',
      dateTime: '2024-01-15 11:20',
      assignedTo: 'Lisa Wilson',
    },
    {
      id: 'TKT005',
      description: 'Request for additional monitoring parameters',
      status: 'In Progress',
      priority: 'Low',
      dateTime: '2024-01-13 13:00',
      assignedTo: 'Tom Brown',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#ef4444';
      case 'In Progress': return '#f59e0b';
      case 'Resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return 'alert-circle';
      case 'Medium': return 'warning';
      case 'Low': return 'information-circle';
      default: return 'help-circle';
    }
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
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', ''),
      assignedTo: 'Auto-assigned',
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({ description: '', priority: 'Medium' });
    setModalVisible(false);
    Alert.alert('Success', 'Ticket created successfully!');
  };

  const renderTicketCard = (ticket) => {
    return (
      <View key={ticket.id} style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={styles.ticketIdContainer}>
            <Ionicons name="receipt-outline" size={20} color="#1a365d" />
            <Text style={styles.ticketId}>{ticket.id}</Text>
          </View>
          <View style={styles.statusPriorityContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Ionicons name={getPriorityIcon(ticket.priority)} size={12} color="#ffffff" />
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Text style={styles.statusText}>{ticket.status}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.ticketDescription}>{ticket.description}</Text>

        <View style={styles.ticketFooter}>
          <View style={styles.ticketInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#718096" />
              <Text style={styles.infoText}>{ticket.dateTime}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={16} color="#718096" />
              <Text style={styles.infoText}>{ticket.assignedTo}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#3182ce" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <Text style={styles.headerSubtitle}>Manage and track support requests</Text>
        
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{openTickets}</Text>
            <Text style={styles.summaryLabel}>Open</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{inProgressTickets}</Text>
            <Text style={styles.summaryLabel}>In Progress</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{resolvedTickets}</Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.createButtonText}>Create Ticket</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tickets List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tickets.map((ticket) => renderTicketCard(ticket))}
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Ticket</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Describe the issue or request..."
                multiline={true}
                numberOfLines={4}
                value={newTicket.description}
                onChangeText={(text) => setNewTicket({...newTicket, description: text})}
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {['High', 'Medium', 'Low'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newTicket.priority === priority && styles.priorityOptionSelected
                    ]}
                    onPress={() => setNewTicket({...newTicket, priority})}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newTicket.priority === priority && styles.priorityOptionTextSelected
                    ]}>
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                  <Text style={styles.submitButtonText}>Create Ticket</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginLeft: 8,
  },
  statusPriorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#2d3748',
    lineHeight: 20,
    marginBottom: 15,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f7fafc',
  },
  viewButtonText: {
    fontSize: 12,
    color: '#3182ce',
    fontWeight: '600',
    marginRight: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  priorityOptionTextSelected: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default TicketsScreen; 