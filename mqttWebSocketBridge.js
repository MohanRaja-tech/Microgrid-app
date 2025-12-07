import mqtt from 'mqtt';
import { WebSocketServer } from 'ws';
import net from 'net';

// WebSocket Server setup - bind to all interfaces
const wss = new WebSocketServer({ 
  port: 8080,
  host: '0.0.0.0'  // Accept connections from any IP
});
console.log('WebSocket server started on port 8080 (all interfaces)');

// Primary and fallback IPs
const PRIMARY_IP = '100.69.116.48';
const FALLBACK_IP = '192.168.43.147';
const MQTT_PORT = 1883;

// MQTT setup
const topic = 'pzem1/all';
const additionalTopics = ['pzem2/all', 'pzem3/all'];
let client;

// Function to check if IP is reachable
function checkIPAvailability(ip, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, ip);
  });
}

// Connect to MQTT with fallback
let brokerUrl = '';
async function connectMQTT() {
  const primaryAvailable = await checkIPAvailability(PRIMARY_IP, MQTT_PORT);
  brokerUrl = primaryAvailable 
    ? `mqtt://${PRIMARY_IP}:${MQTT_PORT}`
    : `mqtt://${FALLBACK_IP}:${MQTT_PORT}`;
  
  console.log(`Connecting to MQTT broker at ${brokerUrl}`);
  client = mqtt.connect(brokerUrl);
  return client;
}

// Initialize MQTT connection
await connectMQTT();

// Store connected WebSocket clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// MQTT connection handler
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to main topic (pzem1/all) - keeping existing logic
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Subscription failed:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });

  // Subscribe to additional topics (pzem2/all, pzem3/all)
  additionalTopics.forEach(additionalTopic => {
    client.subscribe(additionalTopic, (err) => {
      if (err) {
        console.error(`Subscription failed for ${additionalTopic}:`, err);
      } else {
        console.log(`Subscribed to topic: ${additionalTopic}`);
      }
    });
  });
});

// MQTT message handler - forward to WebSocket clients
client.on('message', (topic, message) => {
  try {
    const payload = message.toString();
    const jsonData = JSON.parse(payload);
    console.log(`Received MQTT data from ${topic}:`, jsonData);
    
    // Determine meter ID based on topic, keeping pzem1/all as default behavior
    let meterId = 1; // Default for pzem1/all (maintaining existing logic)
    if (topic === 'pzem2/all') meterId = 2;
    else if (topic === 'pzem3/all') meterId = 3;
    
    // Broadcast to all connected WebSocket clients
    const dataToSend = JSON.stringify({
      topic: topic,
      meterId: meterId,
      data: jsonData,
      timestamp: new Date().toISOString()
    });

    clients.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(dataToSend);
      }
    });
    
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});

client.on('error', (err) => {
  console.error('MQTT Client Error:', err);
});

console.log('MQTT to WebSocket bridge started');
console.log(`MQTT Broker: ${brokerUrl}`);
console.log(`Main Topic: ${topic}`);
console.log(`Additional Topics: ${additionalTopics.join(', ')}`);