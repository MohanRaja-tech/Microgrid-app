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
    this.TEMP_POWER_TABLE = {
      24.09: { min: 3, max: 5 }, // At 24.09°C, expected power is 3-5W
    };
    
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
          console.log('📦 Using cached weather data');
          return this.weatherCache;
        }
      }

      const url = `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      console.log('🌤️ Fetching weather data...');
      console.log(`📍 Location: Lat ${lat}, Lon ${lon}`);
      
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
      
      console.log('✅ Weather data fetched:', this.weatherCache);
      console.log(`🌡️ Temperature: ${this.weatherCache.temperature}°C`);
      console.log(`📍 Location: ${this.weatherCache.location}`);
      return this.weatherCache;
      
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
      return null;
    }
  }

  // Calculate expected power output based on temperature
  // Uses lookup table for specific temperatures, otherwise uses formula
  calculateExpectedPower(ratedPower, currentTemperature) {
    // Check if we have a specific temperature reference
    const tempKey = Object.keys(this.TEMP_POWER_TABLE).find(temp => 
      Math.abs(parseFloat(temp) - currentTemperature) < 0.5 // Within 0.5°C tolerance
    );

    if (tempKey) {
      // Use the reference table (return average of min and max)
      const { min, max } = this.TEMP_POWER_TABLE[tempKey];
      const expectedPower = (min + max) / 2;
      console.log(`   📋 Using reference table for ${tempKey}°C: ${min}-${max}W (avg: ${expectedPower}W)`);
      return expectedPower;
    }

    // Otherwise use formula: P_expected = P_rated * (1 + coefficient * (T_actual - T_stc))
    const tempDifference = currentTemperature - this.STC_TEMPERATURE;
    const powerLossFactor = 1 + (this.TEMPERATURE_COEFFICIENT / 100) * tempDifference;
    const expectedPower = ratedPower * powerLossFactor;
    
    return Math.max(0, expectedPower); // Power cannot be negative
  }

  // Analyze if dust is present on the panel
  analyzeDustPresence(actualPower, expectedPower, ratedPower, currentTemp = null) {
    if (actualPower <= 0 || expectedPower <= 0) {
      return {
        hasDust: false,
        dustLevel: 'unknown',
        efficiency: 0,
        powerLoss: 0,
        recommendation: 'Panel not generating power'
      };
    }

    let hasDust = false;
    let dustLevel = 'clean';
    let recommendation = 'Panel is operating normally';
    let efficiency = (actualPower / expectedPower) * 100;
    let powerLossPercent = ((expectedPower - actualPower) / expectedPower) * 100;

    // Check if we're using a reference temperature with min-max range
    if (currentTemp !== null) {
      const tempKey = Object.keys(this.TEMP_POWER_TABLE).find(temp => 
        Math.abs(parseFloat(temp) - currentTemp) < 0.5
      );

      if (tempKey) {
        const { min, max } = this.TEMP_POWER_TABLE[tempKey];
        
        // If actual power is within the acceptable range, panel is clean
        if (actualPower >= min && actualPower <= max) {
          hasDust = false;
          dustLevel = 'clean';
          efficiency = 100; // Within acceptable range
          powerLossPercent = 0;
          recommendation = `✅ Panel is clean. Power ${actualPower.toFixed(2)}W is within expected range ${min}-${max}W at ${currentTemp}°C`;
          console.log(`   ✅ Power within acceptable range: ${min}W ≤ ${actualPower.toFixed(2)}W ≤ ${max}W`);
        } else if (actualPower < min) {
          // Below minimum acceptable power - dust detected
          const powerDeficit = ((min - actualPower) / min) * 100;
          hasDust = true;
          
          if (powerDeficit >= 15) {
            dustLevel = 'heavy';
            recommendation = `⚠️ Heavy dust detected! Power ${actualPower.toFixed(2)}W is below expected minimum ${min}W at ${currentTemp}°C`;
          } else {
            dustLevel = 'light';
            recommendation = `⚠️ Light dust detected. Power ${actualPower.toFixed(2)}W is slightly below expected minimum ${min}W at ${currentTemp}°C`;
          }
          
          efficiency = (actualPower / min) * 100;
          powerLossPercent = powerDeficit;
          console.log(`   ⚠️ Power below minimum: ${actualPower.toFixed(2)}W < ${min}W (${powerDeficit.toFixed(2)}% deficit)`);
        } else {
          // Above maximum (unusual but possible on very clear days)
          efficiency = (actualPower / max) * 100;
          powerLossPercent = 0;
          recommendation = `✅ Panel performing above expected! Power ${actualPower.toFixed(2)}W exceeds maximum ${max}W`;
          console.log(`   🌟 Power above maximum: ${actualPower.toFixed(2)}W > ${max}W`);
        }

        return {
          hasDust,
          dustLevel,
          efficiency: efficiency.toFixed(2),
          powerLoss: powerLossPercent.toFixed(2),
          actualPower: actualPower.toFixed(2),
          expectedPower: `${min}-${max}`,
          recommendation
        };
      }
    }

    // Standard analysis using single expected power value
    if (powerLossPercent >= this.DUST_THRESHOLD_PERCENT) {
      hasDust = true;
      dustLevel = 'heavy';
      recommendation = '⚠️ Heavy dust detected! Clean panel immediately to restore efficiency';
    } else if (powerLossPercent >= this.LIGHT_DUST_THRESHOLD) {
      hasDust = true;
      dustLevel = 'light';
      recommendation = '⚠️ Light dust accumulation detected. Consider cleaning soon';
    }

    return {
      hasDust,
      dustLevel,
      efficiency: efficiency.toFixed(2),
      powerLoss: powerLossPercent.toFixed(2),
      actualPower: actualPower.toFixed(2),
      expectedPower: expectedPower.toFixed(2),
      recommendation
    };
  }

  // Main function to check dust on solar panel
  async checkPanelDust(panelId, actualVoltage, actualCurrent, actualPower, ratedPower) {
    try {
      console.log(`\n🔍 Checking dust on Solar Panel ${panelId}...`);
      
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
      
      console.log(`\n📊 Panel ${panelId} Analysis:`);
      console.log(`   🌡️ Temperature: ${currentTemp}°C`);
      console.log(`   📍 Location: ${weather.location || 'Unknown'}`);
      console.log(`   ⚡ Expected Power: ${typeof expectedPower === 'number' ? expectedPower.toFixed(2) + 'W' : expectedPower}`);
      console.log(`   ⚡ Actual Power: ${actualPower}W`);
      
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
