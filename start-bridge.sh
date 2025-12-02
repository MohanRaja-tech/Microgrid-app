#!/bin/bash

echo "===================================="
echo " SIH Energy Monitoring App Setup"
echo "===================================="
echo ""
echo "Starting WebSocket Bridge Server..."
echo ""
echo "The bridge will connect to:"
echo "- MQTT Broker: 192.168.43.109:1883"
echo "- WebSocket Port: 8080"
echo "- Topic: pzem1/all"
echo ""
echo "Keep this terminal open while using the app!"
echo ""
echo "===================================="
echo ""

node mqttWebSocketBridge.js