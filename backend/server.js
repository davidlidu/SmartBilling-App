require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database'); // Ensure database connection is tested or pool is ready

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // Added payment routes

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '5mb' })); // Parse JSON request bodies, increased limit for potential base64 data if handled later
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes); // Use payment routes

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: err.message || 'Algo salió mal en el servidor!' });
});

// Test database connection (optional, pool handles connections on demand)
db.getConnection()
  .then(connection => {
    console.log('Conexión a la base de datos MySQL exitosa.');
    connection.release();
  })
  .catch(err => {
    console.error('Error al conectar con la base de datos MySQL:', err);
    // process.exit(1); // Optionally exit if DB connection fails on startup
  });


const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor API escuchando en el puerto ${PORT}`);
});
