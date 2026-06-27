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

// Log connection attempt (masking password)
console.log(`🔌 Intentando conectar a MySQL...`);
console.log(`   Host: ${dbConfig.host}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Port: ${dbConfig.port}`);

const pool = mysql.createPool(dbConfig);

/**
 * Prueba la conexión real a MySQL con reintentos.
 * Necesario en Docker/Swarm/Dokploy: no hay garantía de que el DNS
 * del host de la BD esté resuelto en el instante en que arranca el backend.
 */
async function waitForDatabase(maxRetries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log(`✅ Conexión MySQL OK (intento ${attempt}/${maxRetries})`);
      return true;
    } catch (err) {
      console.error(`❌ Intento ${attempt}/${maxRetries} fallido: ${err.code || err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = pool;
module.exports.waitForDatabase = waitForDatabase;