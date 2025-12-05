import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    host: '192.168.43.147',
    port: 5432,
    user: 'postgres',
    password: 'Ghost+10125',
    database: 'microgrid_db'
});

async function checkTables() {
    try {
        await client.connect();
        console.log('Connected to database!\n');

        // Get meter_data columns
        const meterResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'meter_data' 
            ORDER BY ordinal_position
        `);
        
        console.log('=== METER_DATA TABLE COLUMNS ===');
        meterResult.rows.forEach(row => {
            console.log(`  ${row.column_name} (${row.data_type})`);
        });

        // Get solar_data columns
        const solarResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'solar_data' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n=== SOLAR_DATA TABLE COLUMNS ===');
        solarResult.rows.forEach(row => {
            console.log(`  ${row.column_name} (${row.data_type})`);
        });

        // Get sample data from meter_data
        const meterSample = await client.query('SELECT * FROM meter_data LIMIT 2');
        console.log('\n=== SAMPLE METER DATA ===');
        console.log(meterSample.rows);

        // Get sample data from solar_data
        const solarSample = await client.query('SELECT * FROM solar_data LIMIT 2');
        console.log('\n=== SAMPLE SOLAR DATA ===');
        console.log(solarSample.rows);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTables();
