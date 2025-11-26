require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);

// 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.url}` });
});

// ❗️💥 ELIMINADO: NO servir frontend aquí
// NO static
// NO catch-all
// El backend SOLO responde API

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).send({ message: err.message || 'Algo salió mal en el servidor!', detail: err.message });
});

// Test DB
db.getConnection()
  .then(c => {
    console.log('✅ Conexión MySQL OK');
    c.release();
  })
  .catch(err => {
    console.error('❌ Error MySQL');
    console.error(err);
  });

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
