require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: [
      "https://facturador.lidutech.net",
      "https://api.facturador.lidutech.net"
    ],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Responder preflight OPTIONS para todas las rutas API
app.options('*', (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": "https://facturador.lidutech.net",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  });
  res.sendStatus(204);
});


// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

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

// Start server (esperando a que la BD esté lista, con reintentos)
async function start() {
  try {
    await db.waitForDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('🚨 No se pudo conectar a MySQL tras varios intentos. Abortando arranque.');
    console.error(err);
    process.exit(1); // Dokploy/Docker reiniciará el contenedor automáticamente
  }
}

start();