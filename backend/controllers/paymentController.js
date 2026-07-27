const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { syncPaymentToGestor, updatePaymentInGestor, deletePaymentInGestor } = require('../services/gestorSync');

// Helper to ensure values are numbers or null
const parseOptionalFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const [payments] = await db.query('SELECT * FROM payments ORDER BY date DESC');
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const { clientId, amount, date, method, notes, proofUrl } = req.body;

    if (!clientId || amount === undefined || !date) {
      return res.status(400).json({ message: 'clientId, amount, and date are required fields.' });
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    // Basic date validation (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
    }

    const newPaymentId = uuidv4();
    const paymentData = {
      id: newPaymentId,
      clientId,
      amount: parsedAmount,
      date,
      method: method || null,
      notes: notes || null,
      proofUrl: proofUrl || null,
    };

    await db.query('INSERT INTO payments SET ?', paymentData);

    // Sincronizar el abono como INGRESO en el Gestor Financiero (best-effort, no bloquea la respuesta).
    syncPaymentToGestor(paymentData).catch((e) =>
      console.error('[createPayment] Fallo al sincronizar con el Gestor:', e.message)
    );

    res.status(201).json(paymentData);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Client ID does not exist.' });
    }
    next(err);
  }
};

exports.getPaymentsByClientId = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required.' });
    }
    const [payments] = await db.query('SELECT * FROM payments WHERE clientId = ? ORDER BY date DESC', [clientId]);
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, date, method, notes } = req.body;

    if (amount === undefined || !date) {
      return res.status(400).json({ message: 'amount and date are required fields.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format.' });
    }

    const [result] = await db.query(
      'UPDATE payments SET amount = ?, date = ?, method = ?, notes = ? WHERE id = ?',
      [parsedAmount, date, method || null, notes || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    const [rows] = await db.query('SELECT * FROM payments WHERE id = ?', [id]);

    // Sincronizar la edición con el Gestor (best-effort). rows[0] incluye clientId.
    if (rows[0]) {
      updatePaymentInGestor(rows[0]).catch((e) =>
        console.error('[updatePayment] Fallo al sincronizar con el Gestor:', e.message)
      );
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Payment ID is required.' });
    }
    const [result] = await db.query('DELETE FROM payments WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Eliminar el ingreso correspondiente en el Gestor (best-effort).
    deletePaymentInGestor(id).catch((e) =>
      console.error('[deletePayment] Fallo al sincronizar con el Gestor:', e.message)
    );

    res.status(204).send(); // No Content
  } catch (err) {
    next(err);
  }
};
