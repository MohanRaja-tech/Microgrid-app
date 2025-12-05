import pkg from 'pg';
const { Client } = pkg;

// Database configuration
const dbConfig = {
    host: "100.69.116.48",
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

const client = new Client(dbConfig);

client.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("Connection error", err));

export { client, dbConfig, tableConfig };
