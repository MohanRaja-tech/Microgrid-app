const mqtt = require('mqtt');

// Replace with your friend's laptop IP address and the port (default is 1883)
const brokerUrl = 'mqtt://192.168.43.109:1883'; // Update with the correct IP and port

// The topic you want to subscribe to
const topic = 'pzem1/all';

// Connect to the MQTT broker
const client = mqtt.connect(brokerUrl);

// Event handler when the client successfully connects
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to the topic
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Subscription failed:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// Event handler when a message is received
client.on('message', (topic, message) => {
  // Decode the message (assuming it's in UTF-8 and JSON format)
  const payload = message.toString();
  console.log(`Received message on topic ${topic}: ${payload}`);
  
  try {
    // Parse the JSON data
    const jsonData = JSON.parse(payload);
    console.log('Parsed JSON data:', jsonData);
    
    // Now you can work with jsonData, for example:
    // Example: access a specific property from the JSON
    if (jsonData.someKey) {
      console.log('Some Key Value:', jsonData.someKey);
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});

// Event handler for errors
client.on('error', (err) => {
  console.error('MQTT Client Error:', err);
});
