const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'invoice_app_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 seconds timeout
};

console.log(`Intentando conectar a MySQL en host: ${dbConfig.host}, usuario: ${dbConfig.user}, base de datos: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error fatal al conectar a la base de datos MySQL:', err.message);
        // We do not exit the process here so the frontend can still load, 
        // but API calls will fail with logs.
    });

module.exports = pool;