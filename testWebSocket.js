const WebSocket = require('ws');

// Test WebSocket connection to the bridge
const ws = new WebSocket('ws://192.168.43.205:8080');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket bridge');
  console.log('Waiting for MQTT messages...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Received message:');
    console.log(`   Topic: ${message.topic}`);
    console.log(`   Data:`, message.data);
    console.log(`   Timestamp: ${message.timestamp}`);
    console.log('---');
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', () => {
  console.log('❌ WebSocket connection closed');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep the script running
console.log('🔌 Attempting to connect to WebSocket bridge...');
console.log('Press Ctrl+C to exit');