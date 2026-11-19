
const mysql = require('mysql2/promise');
require('dotenv').config();

const isRemote = process.env.DB_HOST &&
  !['localhost', '127.0.0.1'].includes(process.env.DB_HOST);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'batloung_farm',

  // TiDB Cloud Starter requires TLS.
  ssl: isRemote ? {
    minVersion: 'TLSv1.2'
  } : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  connectTimeout: 30000
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();

    console.log('MySQL/TiDB database connection established.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.code, error.message);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { pool, testConnection };
