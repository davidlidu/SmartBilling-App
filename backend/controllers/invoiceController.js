const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Helper function to calculate total amount
const calculateTotalAmount = (lineItems) => {
  return lineItems.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice)), 0);
};

exports.getAllInvoices = async (req, res, next) => {
  try {
    // Fetch invoices and join with client names for easier display on the frontend
    const query = `
      SELECT i.*, c.name as clientName 
      FROM invoices i
      JOIN clients c ON i.clientId = c.id
      ORDER BY i.createdAt DESC
    `;
    const [invoices] = await db.query(query);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [invoiceRows] = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
    if (invoiceRows.length === 0) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    const invoice = invoiceRows[0];
    const [lineItems] = await db.query('SELECT * FROM line_items WHERE invoiceId = ?', [id]);
    invoice.lineItems = lineItems;
    
    // Optionally fetch client details too
    const [clientRows] = await db.query('SELECT * FROM clients WHERE id = ?', [invoice.clientId]);
    if (clientRows.length > 0) {
        invoice.client = clientRows[0];
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { invoiceNumber, date, clientId, notes, lineItems } = req.body;

    if (!invoiceNumber || !date || !clientId || !lineItems || lineItems.length === 0) {
      return res.status(400).json({ message: 'Datos de factura incompletos o incorrectos.' });
    }

    const newInvoiceId = uuidv4();
    const totalAmount = calculateTotalAmount(lineItems);

    const invoiceData = {
      id: newInvoiceId,
      invoiceNumber,
      date,
      clientId,
      notes,
      totalAmount
    };
    await connection.query('INSERT INTO invoices SET ?', invoiceData);

    for (const item of lineItems) {
      const newItemId = uuidv4();
      await connection.query('INSERT INTO line_items SET ?', {
        id: newItemId,
        invoiceId: newInvoiceId,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice)
      });
    }

    await connection.commit();
    res.status(201).json({ ...invoiceData, lineItems }); // Return the full invoice object
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('invoiceNumber')) {
        return res.status(409).json({ message: `Ya existe una factura con el número '${req.body.invoiceNumber}'.` });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('clientId')) {
        return res.status(400).json({ message: `El cliente con ID '${req.body.clientId}' no existe.` });
    }
    next(err);
  } finally {
    connection.release();
  }
};

exports.updateInvoice = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { invoiceNumber, date, clientId, notes, lineItems } = req.body;

    if (!invoiceNumber || !date || !clientId || !lineItems || lineItems.length === 0) {
      return res.status(400).json({ message: 'Datos de factura incompletos o incorrectos.' });
    }
    
    const totalAmount = calculateTotalAmount(lineItems);

    const invoiceData = { invoiceNumber, date, clientId, notes, totalAmount };
    const [updateResult] = await connection.query('UPDATE invoices SET ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [invoiceData, id]);

    if (updateResult.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Factura no encontrada para actualizar.' });
    }

    // Delete old line items
    await connection.query('DELETE FROM line_items WHERE invoiceId = ?', [id]);

    // Insert new line items
    for (const item of lineItems) {
      const newItemId = uuidv4(); // Generate new ID for potentially modified items
      await connection.query('INSERT INTO line_items SET ?', {
        id: newItemId, // Use new ID
        invoiceId: id,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        unitPrice: parseFloat(item.unitPrice)
      });
    }

    await connection.commit();
    res.json({ id, ...invoiceData, lineItems });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY' && err.sqlMessage.includes('invoiceNumber')) {
        return res.status(409).json({ message: `Ya existe otra factura con el número '${req.body.invoiceNumber}'.` });
    }
     if (err.code === 'ER_NO_REFERENCED_ROW_2' && err.sqlMessage.includes('clientId')) {
        return res.status(400).json({ message: `El cliente con ID '${req.body.clientId}' no existe.` });
    }
    next(err);
  } finally {
    connection.release();
  }
};

exports.deleteInvoice = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    // Line items are deleted by ON DELETE CASCADE
    const [result] = await connection.query('DELETE FROM invoices WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Factura no encontrada para eliminar' });
    }
    
    await connection.commit();
    res.status(204).send();
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.getNextInvoiceNumber = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            "SELECT MAX(CAST(REGEXP_REPLACE(invoiceNumber, '[^0-9]+', '') AS UNSIGNED)) as maxNum FROM invoices"
        );
        let nextNumber = 1;
        if (rows.length > 0 && rows[0].maxNum !== null) {
            nextNumber = parseInt(rows[0].maxNum) + 1;
        }
        res.json({ nextInvoiceNumber: String(nextNumber) });
    } catch (err) {
        next(err);
    }
};
