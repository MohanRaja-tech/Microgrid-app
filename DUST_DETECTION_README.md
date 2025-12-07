# Solar Panel Dust Detection System

## Overview
This system detects dust accumulation on solar panels by comparing actual power output with expected power output based on current temperature conditions.

## Weather API Configuration
- **API Key**: `d8775601a4486e566e69e908c87962db`
- **Provider**: OpenWeatherMap
- **Update Frequency**: Every 10 minutes (cached)

## How It Works

### 1. Temperature-Based Power Calculation
Solar panels have a temperature coefficient (typically -0.45% per °C for silicon panels). The system:
- Fetches current temperature from OpenWeatherMap API
- Calculates expected power output using the formula:
  ```
  Expected Power = Rated Power × [1 + (coefficient × (T_actual - T_standard))]
  ```
  - T_standard = 25°C (Standard Test Conditions)
  - coefficient = -0.45% per °C

### 2. Dust Detection Logic
The system compares actual power vs expected power:
- **Clean Panel**: Power loss < 10%
- **Light Dust**: Power loss 10-15% 
- **Heavy Dust**: Power loss ≥ 15%

### 3. Real-Time Monitoring
- Dust analysis runs automatically every 5 minutes
- Updates when new solar panel data is received via WebSocket
- Results displayed in each solar panel card

## Display Information

For each solar panel, the dust detection section shows:
- **Status**: Clean panel (green) or Dust detected (red)
- **Efficiency**: Current efficiency percentage
- **Power Loss**: Percentage of power lost due to dust/temperature
- **Temperature**: Current ambient temperature
- **Recommendation**: Action message if cleaning needed

### Visual Indicators
- 🟢 Green background: Panel is clean, operating normally
- 🔴 Red background: Dust detected, cleaning recommended
- ⚠️ Alert box: Specific cleaning recommendations

## Technical Details

### Files Created/Modified
1. **DustDetectionService.js** (NEW)
   - Weather API integration
   - Temperature-based power calculations
   - Dust analysis algorithms

2. **SolarScreen.js** (MODIFIED)
   - Integrated dust detection display
   - Automatic dust checking every 5 minutes
   - Real-time updates with WebSocket data

### Configuration
Default settings in `DustDetectionService.js`:
```javascript
STC_TEMPERATURE = 25°C
TEMPERATURE_COEFFICIENT = -0.45% per °C
DUST_THRESHOLD_PERCENT = 15%
LIGHT_DUST_THRESHOLD = 10%
```

### Default Location
- Latitude: 13.0827 (Chennai, India)
- Longitude: 80.2707

To change location, modify the constants in `DustDetectionService.js`.

## Example Calculation

**Scenario:**
- Panel rated power: 1000W
- Actual power: 750W
- Current temperature: 35°C

**Expected power calculation:**
```
Temp difference = 35°C - 25°C = 10°C
Power factor = 1 + (-0.45% × 10) = 1 - 0.045 = 0.955
Expected power = 1000W × 0.955 = 955W
```

**Dust analysis:**
```
Power loss = (955W - 750W) / 955W × 100% = 21.5%
Result: Heavy dust detected (> 15%)
Recommendation: Clean panel immediately
```

## No Changes to Existing Functionality
✅ All existing solar panel monitoring features remain unchanged
✅ WebSocket real-time updates continue to work
✅ No modifications to MQTT bridge or other services
✅ Dust detection is an additional feature layer

## Future Enhancements
- Configurable dust thresholds per panel
- Historical dust accumulation tracking
- Cleaning schedule recommendations
- Integration with maintenance notifications
