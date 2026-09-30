// Migraciones ligeras e idempotentes que se ejecutan al arrancar el backend.
// Se usa information_schema en vez de "ADD COLUMN IF NOT EXISTS" para ser
// compatible con MySQL (esa sintaxis solo existe en MariaDB).

const db = require('./database');

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await db.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`🛠️  Migración: columna ${table}.${column} agregada`);
  }
}

async function runMigrations() {
  // Facturas en USD: moneda de los ítems y TRM (COP por 1 USD) fijada al generar la factura.
  // totalAmount siempre queda en COP para que reportes, saldos y pagos sigan funcionando.
  await addColumnIfMissing('invoices', 'currency', "VARCHAR(3) NOT NULL DEFAULT 'COP' AFTER notes");
  await addColumnIfMissing('invoices', 'exchangeRate', 'DECIMAL(12, 2) NULL AFTER currency');
}

module.exports = { runMigrations };
