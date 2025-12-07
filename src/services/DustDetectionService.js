// Dust Detection Service - Detects dust accumulation on solar panels
// Uses weather API to get temperature and compares expected vs actual power output

const WEATHER_API_KEY = 'd8775601a4486e566e69e908c87962db';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Default location (can be configured)
const DEFAULT_LAT = 13.0827; // Chennai, India
const DEFAULT_LON = 80.2707;

class DustDetectionService {
  constructor() {
    this.weatherCache = null;
    this.lastWeatherUpdate = null;
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    
    // Temperature-to-Power reference table (based on real-world data)
    // For temperature range 10-29°C, expected power is 2.5-5W
    this.TEMP_POWER_TABLE = {
      10: { min: 2.5, max: 5 },
      15: { min: 2.5, max: 5 },
      20: { min: 2.5, max: 5 },
      25: { min: 2.5, max: 5 },
      29: { min: 2.5, max: 5 },
    };
    
    // Temperature range for dust detection
    this.TEMP_RANGE = { min: 10, max: 29 };
    this.POWER_RANGE = { min: 2.5, max: 5 };
    
    // Standard Test Conditions (STC) reference values
    this.STC_TEMPERATURE = 25; // 25°C standard temperature
    this.TEMPERATURE_COEFFICIENT = -0.45; // -0.45% per °C (typical for silicon panels)
    
    // Dust detection thresholds
    this.DUST_THRESHOLD_PERCENT = 15; // 15% or more reduction indicates dust
    this.LIGHT_DUST_THRESHOLD = 10; // 10-15% reduction
  }

  // Fetch current weather data
  async fetchWeatherData(lat = DEFAULT_LAT, lon = DEFAULT_LON) {
    try {
      // Return cached data if still valid
      if (this.weatherCache && this.lastWeatherUpdate) {
        const timeSinceUpdate = Date.now() - this.lastWeatherUpdate;
        if (timeSinceUpdate < this.CACHE_DURATION) {
          return this.weatherCache;
        }
      }

      const url = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.weatherCache = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        clouds: data.clouds.all, // Cloud coverage percentage
        weather: data.weather[0].main,
        description: data.weather[0].description,
        location: data.name,
        latitude: lat,
        longitude: lon,
        timestamp: new Date().toISOString()
      };
      
      this.lastWeatherUpdate = Date.now();
      
      return this.weatherCache;
      
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      return null;
    }
  }

  // Calculate expected power output based on temperature
  // Uses lookup table for specific temperatures, otherwise uses formula
  calculateExpectedPower(ratedPower, currentTemperature) {
    // Check if temperature is within the defined range (10-25°C)
    if (currentTemperature >= this.TEMP_RANGE.min && currentTemperature <= this.TEMP_RANGE.max) {
      // Within the range, return the power range
      return (this.POWER_RANGE.min + this.POWER_RANGE.max) / 2; // Return average for calculation
    }

    // Otherwise use formula: P_expected = P_rated * (1 + coefficient * (T_actual - T_stc))
    const tempDifference = currentTemperature - this.STC_TEMPERATURE;
    const powerLossFactor = 1 + (this.TEMPERATURE_COEFFICIENT / 100) * tempDifference;
    const expectedPower = ratedPower * powerLossFactor;
    
    return Math.max(0, expectedPower); // Power cannot be negative
  }

  // Analyze if dust is present on the panel
  // Hardcoded logic: Temp 10-30°C AND Power 2.5-5W = Clean, Temp 10-30°C AND Power < 2.5W = Not Clean
  analyzeDustPresence(actualPower, expectedPower, ratedPower, currentTemp = null) {
    // Hardcoded thresholds
    const TEMP_MIN = 10;
    const TEMP_MAX = 30;
    const POWER_MIN = 2.5;
    const POWER_MAX = 5;
    
    // Check if temperature is between 10-30°C
    const isTempInRange = currentTemp !== null && currentTemp >= TEMP_MIN && currentTemp <= TEMP_MAX;
    console.log("Temp:"+isTempInRange+" "+actualPower);
    // If temp is between 10-30°C
    if (isTempInRange) {
      // Check if power is between 2.5-5W
      if (actualPower >= POWER_MIN) {
        // Panel is CLEAN
        return {
          hasDust: false,
          dustLevel: 'clean',
          efficiency: '100.00',
          powerLoss: '0.00',
          actualPower: actualPower.toFixed(2),
          expectedPower: `${POWER_MIN}-${POWER_MAX}`,
          recommendation: `✅ Panel is clean. Power ${actualPower.toFixed(2)}W is within expected range ${POWER_MIN}-${POWER_MAX}W at ${currentTemp.toFixed(1)}°C`
        };
      } else if (actualPower < POWER_MIN) {
        // Panel is NOT CLEAN - power below 2.5W
        const deficit = ((POWER_MIN - actualPower) / POWER_MIN) * 100;
        return {
          hasDust: true,
          dustLevel: deficit >= 50 ? 'heavy' : 'light',
          efficiency: ((actualPower / POWER_MIN) * 100).toFixed(2),
          powerLoss: deficit.toFixed(2),
          actualPower: actualPower.toFixed(2),
          expectedPower: `${POWER_MIN}-${POWER_MAX}`,
          recommendation: `⚠️ Dust detected! Power ${actualPower.toFixed(2)}W is below expected minimum ${POWER_MIN}W. Cleaning needed.`
        };
      } else {
        // Power above 5W - not specified but treating as clean
        return {
          hasDust: false,
          dustLevel: 'clean',
          efficiency: '100.00',
          powerLoss: '0.00',
          actualPower: actualPower.toFixed(2),
          expectedPower: `${POWER_MIN}-${POWER_MAX}`,
          recommendation: `✅ Power ${actualPower.toFixed(2)}W exceeds expected maximum ${POWER_MAX}W but panel is performing well.`
        };
      }
    } else {
      // Temperature is outside 10-30°C range - don't check
      return {
        hasDust: false,
        dustLevel: 'unknown',
        efficiency: '0.00',
        powerLoss: '0.00',
        actualPower: actualPower.toFixed(2),
        expectedPower: `${POWER_MIN}-${POWER_MAX}`,
        recommendation: `Temperature ${currentTemp ? currentTemp.toFixed(1) : 'N/A'}°C is outside monitoring range ${TEMP_MIN}-${TEMP_MAX}°C`
      };
    }
  }

  // Main function to check dust on solar panel
  async checkPanelDust(panelId, actualVoltage, actualCurrent, actualPower, ratedPower) {
    try {
      // Fetch current weather
      const weather = await this.fetchWeatherData();
      
      if (!weather) {
        return {
          success: false,
          message: 'Could not fetch weather data'
        };
      }

      const currentTemp = weather.temperature;
      
      // Calculate expected power based on temperature
      const expectedPower = this.calculateExpectedPower(ratedPower, currentTemp);
      
      // Analyze dust presence (pass current temperature for range checking)
      const dustAnalysis = this.analyzeDustPresence(actualPower, expectedPower, ratedPower, currentTemp);
      
      return {
        success: true,
        panelId,
        weather: {
          temperature: currentTemp,
          humidity: weather.humidity,
          clouds: weather.clouds,
          description: weather.description
        },
        dustAnalysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Error checking dust on panel ${panelId}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Check dust for multiple panels
  async checkAllPanels(panelsData) {
    const results = [];
    
    for (const panel of panelsData) {
      if (panel.voltage === '-' || panel.current === '-' || panel.power === '-') {
        continue; // Skip panels without data
      }

      const voltage = parseFloat(panel.voltage);
      const current = parseFloat(panel.current);
      const power = parseFloat(panel.power);
      const ratedPower = panel.ratedPower || 1000; // Default 1000W if not specified

      const result = await this.checkPanelDust(
        panel.id,
        voltage,
        current,
        power,
        ratedPower
      );

      results.push(result);
    }

    return results;
  }

  // Get summary of all panels dust status
  getDustSummary(dustResults) {
    const totalPanels = dustResults.length;
    const dustyPanels = dustResults.filter(r => r.success && r.dustAnalysis.hasDust).length;
    const heavyDustPanels = dustResults.filter(
      r => r.success && r.dustAnalysis.dustLevel === 'heavy'
    ).length;

    return {
      totalPanels,
      cleanPanels: totalPanels - dustyPanels,
      dustyPanels,
      heavyDustPanels,
      needsCleaning: dustyPanels > 0
    };
  }
}

export default new DustDetectionService();
