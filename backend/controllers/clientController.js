const db = require('../database');
const { v4: uuidv4 } = require('uuid');

exports.getAllClients = async (req, res, next) => {
  try {
    const [clients] = await db.query('SELECT * FROM clients ORDER BY name ASC');
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const { nitOrCc, name, city, phone, address } = req.body;
    if (!nitOrCc || !name) {
      return res.status(400).json({ message: 'NIT/CC y Nombre son requeridos' });
    }
    const newClientId = uuidv4();
    const newClient = { id: newClientId, nitOrCc, name, city, phone, address };
    
    await db.query('INSERT INTO clients SET ?', newClient);
    res.status(201).json(newClient);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe un cliente con ese NIT/CC.' });
    }
    next(err);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nitOrCc, name, city, phone, address } = req.body;
     if (!nitOrCc || !name) {
      return res.status(400).json({ message: 'NIT/CC y Nombre son requeridos' });
    }

    const [result] = await db.query(
      'UPDATE clients SET nitOrCc = ?, name = ?, city = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [nitOrCc, name, city, phone, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para actualizar' });
    }
    res.json({ id, nitOrCc, name, city, phone, address });
  } catch (err) {
     if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe otro cliente con ese NIT/CC.' });
    }
    next(err);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM clients WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado para eliminar' });
    }
    res.status(204).send(); // No content
  } catch (err) {
    // Handle foreign key constraint error (e.g., client has invoices)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'No se puede eliminar el cliente porque tiene facturas asociadas.' });
    }
    next(err);
  }
};
