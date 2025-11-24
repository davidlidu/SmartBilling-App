require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);

// --- SERVE FRONTEND STATIC FILES ---
// This tells Express to serve the built React files from the 'dist' folder located in the project root
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React Routing (SPA Catch-all)
// Any request that doesn't match an API route will return the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: err.message || 'Algo salió mal en el servidor!' });
});

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('Conexión a la base de datos MySQL exitosa.');
    connection.release();
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos MySQL:', err);
  });

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});