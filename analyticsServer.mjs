import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Client } = pkg;

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    host: "192.168.43.147",
    port: 5432,
    user: "postgres",
    password: "Ghost+10125",
    database: "microgrid_db",
};

// Table configuration with actual column names
const tableConfig = {
    meter: {
        name: "meter_data",
        columns: {
            timestamp: "time",
            id: "meter_id",
            voltage: "voltage",
            current: "current",
            power: "power",
            energy: "energy",
            pf: "pf",
            frequency: "frequency"
        }
    },
    solar: {
        name: "solar_data",
        columns: {
            timestamp: "time",
            id: "panel_id",
            voltage: "voltage",
            current: "current",
            power: "power"
        }
    }
};

// Create database client
let client;

async function connectToDatabase() {
    try {
        client = new Client(dbConfig);
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        return false;
    }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: client ? 'Connected' : 'Disconnected',
        tables: tableConfig 
    });
});

// Get table configuration
app.get('/api/config', (req, res) => {
    res.json({
        tables: tableConfig,
        database: dbConfig.database
    });
});

// Analytics data endpoint
app.post('/api/analytics', async (req, res) => {
    try {
        const { table, sourceType, filterColumn, filterValue, fromDate, toDate } = req.body;

        // Validate required fields
        if (!sourceType || !fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: sourceType, fromDate, toDate'
            });
        }

        // Determine table config based on source type
        const tableConf = sourceType === 'Meter' ? tableConfig.meter : tableConfig.solar;
        const tableName = tableConf.name;
        const cols = tableConf.columns;

        // Build the query based on source type
        let query;
        let params;

        if (sourceType === 'Meter') {
            // Query for meter data - using actual column names
            // Columns: time, meter_id, voltage, current, power, energy, pf, frequency
            query = `
                SELECT 
                    ${cols.timestamp} as timestamp,
                    ${cols.id} as meter_id,
                    ${cols.voltage} as voltage,
                    ${cols.current} as current,
                    ${cols.power} as power,
                    ${cols.energy} as energy,
                    ${cols.pf} as pf,
                    ${cols.frequency} as frequency
                FROM ${tableName}
                WHERE ${cols.timestamp} >= $1 
                AND ${cols.timestamp} <= $2
                ${filterValue ? `AND ${cols.id} = $3` : ''}
                ORDER BY ${cols.timestamp} ASC
                LIMIT 1000
            `;
            params = filterValue 
                ? [fromDate, toDate + ' 23:59:59', parseInt(filterValue)]
                : [fromDate, toDate + ' 23:59:59'];
        } else {
            // Query for solar data - using actual column names
            // Columns: time, panel_id, voltage, current, power
            query = `
                SELECT 
                    ${cols.timestamp} as timestamp,
                    ${cols.id} as panel_id,
                    ${cols.voltage} as voltage,
                    ${cols.current} as current,
                    ${cols.power} as power
                FROM ${tableName}
                WHERE ${cols.timestamp} >= $1 
                AND ${cols.timestamp} <= $2
                ${filterValue ? `AND ${cols.id} = $3` : ''}
                ORDER BY ${cols.timestamp} ASC
                LIMIT 1000
            `;
            params = filterValue 
                ? [fromDate, toDate + ' 23:59:59', parseInt(filterValue)]
                : [fromDate, toDate + ' 23:59:59'];
        }

        console.log('Executing query:', query);
        console.log('With params:', params);

        const result = await client.query(query, params);
        
        console.log(`✅ Query returned ${result.rows.length} rows`);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows,
            query: {
                table: tableName,
                sourceType,
                filterColumn,
                filterValue,
                fromDate,
                toDate
            }
        });

    } catch (error) {
        console.error('❌ Query error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message,
            error: 'Database query failed'
        });
    }
});

// Get meter data summary
app.get('/api/meter/summary', async (req, res) => {
    try {
        const cols = tableConfig.meter.columns;
        const query = `
            SELECT 
                ${cols.id} as meter_id,
                COUNT(*) as record_count,
                AVG(${cols.power}) as avg_power,
                MAX(${cols.power}) as max_power,
                MIN(${cols.power}) as min_power,
                SUM(${cols.energy}) as total_energy
            FROM ${tableConfig.meter.name}
            GROUP BY ${cols.id}
            ORDER BY ${cols.id}
        `;

        const result = await client.query(query);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get solar data summary
app.get('/api/solar/summary', async (req, res) => {
    try {
        const cols = tableConfig.solar.columns;
        const query = `
            SELECT 
                ${cols.id} as panel_id,
                COUNT(*) as record_count,
                AVG(${cols.power}) as avg_power,
                MAX(${cols.power}) as max_power,
                MIN(${cols.power}) as min_power,
                AVG(${cols.voltage}) as avg_voltage,
                AVG(${cols.current}) as avg_current
            FROM ${tableConfig.solar.name}
            GROUP BY ${cols.id}
            ORDER BY ${cols.id}
        `;

        const result = await client.query(query);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get data for a specific date range with aggregation
app.post('/api/analytics/aggregated', async (req, res) => {
    try {
        const { sourceType, filterValue, fromDate, toDate, aggregation = 'daily' } = req.body;
        
        // Get table configuration with correct column names
        const tableConf = sourceType === 'Meter' ? tableConfig.meter : tableConfig.solar;
        const tableName = tableConf.name;
        const cols = tableConf.columns;
        
        // Use correct column names: time for timestamp, meter_id/panel_id for filter, power for value
        const timeCol = cols.timestamp;  // 'time'
        const filterCol = cols.id;        // 'meter_id' or 'panel_id'
        const powerCol = cols.power;      // 'power'

        let dateFormat;
        switch (aggregation) {
            case 'hourly':
                dateFormat = `TO_CHAR(${timeCol}, 'YYYY-MM-DD HH24:00')`;
                break;
            case 'daily':
                dateFormat = `TO_CHAR(${timeCol}, 'YYYY-MM-DD')`;
                break;
            case 'weekly':
                dateFormat = `TO_CHAR(DATE_TRUNC('week', ${timeCol}), 'YYYY-MM-DD')`;
                break;
            default:
                dateFormat = `TO_CHAR(${timeCol}, 'YYYY-MM-DD')`;
        }

        const query = `
            SELECT 
                ${dateFormat} as period,
                AVG(${powerCol}) as avg_power,
                MAX(${powerCol}) as max_power,
                MIN(${powerCol}) as min_power,
                COUNT(*) as data_points
            FROM ${tableName}
            WHERE ${timeCol} >= $1 
            AND ${timeCol} <= $2
            ${filterValue ? `AND ${filterCol} = $3` : ''}
            GROUP BY ${dateFormat}
            ORDER BY period ASC
        `;

        const params = filterValue 
            ? [fromDate, toDate + ' 23:59:59', parseInt(filterValue)]
            : [fromDate, toDate + ' 23:59:59'];

        console.log('Aggregated Query:', query);
        console.log('Params:', params);

        const result = await client.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            aggregation,
            data: result.rows
        });

    } catch (error) {
        console.error('❌ Aggregation query error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test endpoint to check database tables and data
app.get('/api/test/tables', async (req, res) => {
    try {
        // Check if tables exist and have data
        const meterCheck = await client.query(`
            SELECT COUNT(*) as count, 
                   MIN(time) as earliest,
                   MAX(time) as latest
            FROM ${tableConfig.meter.name}
        `);
        
        const solarCheck = await client.query(`
            SELECT COUNT(*) as count,
                   MIN(time) as earliest,
                   MAX(time) as latest
            FROM ${tableConfig.solar.name}
        `);

        res.json({
            success: true,
            tables: {
                meter: {
                    name: tableConfig.meter.name,
                    recordCount: parseInt(meterCheck.rows[0].count),
                    earliestRecord: meterCheck.rows[0].earliest,
                    latestRecord: meterCheck.rows[0].latest
                },
                solar: {
                    name: tableConfig.solar.name,
                    recordCount: parseInt(solarCheck.rows[0].count),
                    earliestRecord: solarCheck.rows[0].earliest,
                    latestRecord: solarCheck.rows[0].latest
                }
            }
        });
    } catch (error) {
        console.error('❌ Table check error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test endpoint to get latest records
app.get('/api/test/latest', async (req, res) => {
    try {
        const meterData = await client.query(`
            SELECT * FROM ${tableConfig.meter.name}
            ORDER BY time DESC
            LIMIT 5
        `);
        
        const solarData = await client.query(`
            SELECT * FROM ${tableConfig.solar.name}
            ORDER BY time DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            meter: meterData.rows,
            solar: solarData.rows
        });
    } catch (error) {
        console.error('❌ Latest records error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
async function startServer() {
    const dbConnected = await connectToDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 Analytics API Server running on port ${PORT}`);
        console.log(`📊 Database: ${dbConnected ? 'Connected' : 'Not connected'}`);
        console.log(`\n📋 Available endpoints:`);
        console.log(`   GET  /api/health          - Health check`);
        console.log(`   GET  /api/config          - Get table configuration`);
        console.log(`   GET  /api/test/tables     - Test database tables`);
        console.log(`   GET  /api/test/latest     - Get latest records`);
        console.log(`   POST /api/analytics       - Fetch analytics data`);
        console.log(`   POST /api/analytics/aggregated - Fetch aggregated data`);
        console.log(`   GET  /api/meter/summary   - Meter data summary`);
        console.log(`   GET  /api/solar/summary   - Solar data summary`);
        console.log(`\n🌐 Access from mobile app: http://192.168.43.205:${PORT}`);
    });
}

startServer();
