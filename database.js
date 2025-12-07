import pkg from 'pg';
const { Client } = pkg;

// Primary and fallback IPs
const PRIMARY_IP = "100.69.116.48";
const FALLBACK_IP = "192.168.43.147";

// Database configuration
const dbConfig = {
    host: PRIMARY_IP,
    port: 5432,
    user: "postgres",
    password: "Ghost+10125",
    database: "microgrid_db",
};

// Table configuration
const tableConfig = {
    meter: "meter_data",
    solar: "solar_data"
};

let client = new Client(dbConfig);

// Try to connect with primary IP, fallback to secondary if it fails
async function connectWithFallback() {
    try {
        await client.connect();
        console.log(`Connected to PostgreSQL at ${PRIMARY_IP}`);
    } catch (err) {
        console.log(`Primary IP ${PRIMARY_IP} failed, trying fallback ${FALLBACK_IP}...`);
        client = new Client({ ...dbConfig, host: FALLBACK_IP });
        try {
            await client.connect();
            console.log(`Connected to PostgreSQL at ${FALLBACK_IP}`);
        } catch (fallbackErr) {
            console.error("Connection error on both IPs:", fallbackErr);
            throw fallbackErr;
        }
    }
}

connectWithFallback();

export { client, dbConfig, tableConfig };
