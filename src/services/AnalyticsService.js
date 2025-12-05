// Analytics Service - Handles database queries for analytics data
// This service connects to the PostgreSQL database and fetches meter/solar data

// Database configuration (matching database.js)
const DB_CONFIG = {
  host: '192.168.43.147',
  port: 5432,
  database: 'microgrid_db',
  tables: {
    meter: 'meter_data',
    solar: 'solar_data'
  },
  // Actual column names from database
  columns: {
    meter: {
      timestamp: 'time',
      id: 'meter_id',
      voltage: 'voltage',
      current: 'current',
      power: 'power',
      energy: 'energy',
      pf: 'pf',
      frequency: 'frequency'
    },
    solar: {
      timestamp: 'time',
      id: 'panel_id',
      voltage: 'voltage',
      current: 'current',
      power: 'power'
    }
  }
};

// API Base URL - Points to the backend server running on your local machine
// The backend server (analyticsServer.js) connects to PostgreSQL at 100.69.116.48
// Updated to current local IPv4 (detected on this machine)
const API_BASE_URL = 'http://10.200.163.158:3001';

class AnalyticsService {
  constructor() {
    this.isConnected = false;
  }

  // Format date for PostgreSQL query
  formatDateForQuery(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get table name based on source type
  getTableName(sourceType) {
    return sourceType === 'Meter' ? DB_CONFIG.tables.meter : DB_CONFIG.tables.solar;
  }

  // Fetch analytics data from the backend
  async fetchAnalyticsData(sourceType, filterValue, fromDateStr, toDateStr) {
    try {
      const tableName = this.getTableName(sourceType);

      console.log('Fetching analytics data:', {
        sourceType,
        filterValue,
        fromDateStr,
        toDateStr,
        tableName
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: tableName,
          sourceType: sourceType,
          filterColumn: sourceType === 'Meter' ? 'meter_id' : 'panel_id',
          filterValue: filterValue,
          fromDate: fromDateStr,
          toDate: toDateStr,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          count: result.count,
          message: 'Data fetched successfully'
        };
      } else {
        return {
          success: false,
          data: [],
          message: result.message || 'Failed to fetch data'
        };
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        success: false,
        data: [],
        message: error.message || 'Failed to fetch data'
      };
    }
  }

  // Process raw data for chart display
  processDataForChart(rawData, sourceType) {
    if (!rawData || rawData.length === 0) {
      return {
        chartData: [],
        stats: { avg: 0, max: 0, min: 0, total: 0, count: 0 }
      };
    }

    // Group data by date/hour and calculate averages
    const groupedData = {};
    
    rawData.forEach(item => {
      // Use 'timestamp' (aliased from 'time' in the query)
      const timestamp = item.timestamp || item.time;
      if (!timestamp) return;
      
      const date = new Date(timestamp);
      let dateKey;
      
      // If data spans multiple days, group by day; otherwise group by hour
      if (rawData.length > 100) {
        dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        dateKey = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { values: [], count: 0 };
      }
      
      // Get the power value
      const value = parseFloat(item.power) || 0;
      
      groupedData[dateKey].values.push(value);
      groupedData[dateKey].count++;
    });

    // Convert to chart data format
    const chartData = Object.keys(groupedData).map(label => {
      const group = groupedData[label];
      const avgValue = group.values.reduce((a, b) => a + b, 0) / group.count;
      return {
        label: label,
        value: avgValue
      };
    });

    // Calculate statistics
    const allValues = rawData.map(item => parseFloat(item.power) || 0).filter(v => !isNaN(v));

    const stats = {
      max: allValues.length > 0 ? Math.max(...allValues) : 0,
      min: allValues.length > 0 ? Math.min(...allValues.filter(v => v > 0)) : 0,
      avg: allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0,
      total: allValues.reduce((a, b) => a + b, 0),
      count: rawData.length
    };

    console.log('Processed chart data:', chartData.length, 'points');
    console.log('Stats:', stats);

    return { chartData, stats };
  }

  // Generate sample data for testing (when database is not available)
  generateSampleData(sourceType, subOption, fromDate, toDate) {
    const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
    const dataPoints = Math.min(days, 7);
    
    const labels = [];
    const values = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(fromDate);
      date.setDate(date.getDate() + i);
      labels.push(`${months[date.getMonth()]} ${date.getDate()}`);
      
      // Generate realistic values based on source type
      if (sourceType === 'Meter') {
        // Meter power in Watts (500-2000W range)
        values.push(Math.floor(Math.random() * 1500) + 500);
      } else {
        // Solar power in Watts (200-1200W range, peak during midday)
        values.push(Math.floor(Math.random() * 1000) + 200);
      }
    }

    const stats = {
      peak: Math.max(...values),
      min: Math.min(...values),
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      total: values.reduce((a, b) => a + b, 0)
    };

    return { labels, values, stats };
  }
}

export default new AnalyticsService();
